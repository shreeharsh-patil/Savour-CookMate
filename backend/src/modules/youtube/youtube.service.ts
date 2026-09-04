import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import * as crypto from "crypto";
import {
  YouTubeCache,
  YouTubeCacheDocument,
  YouTubeVideoItem,
} from "../../database/schemas/youtube-cache.schema";
import { Recipe, RecipeDocument } from "../../database/schemas/recipe.schema";
import { RecipeSourceVideoProvider } from "./providers/recipe-source.provider";
import { YouTubeDataVideoProvider } from "./providers/youtube-data.provider";
import { InvidiousVideoProvider } from "./providers/invidious.provider";
import { buildProgressiveQueries, rankAndFilterVideos, RANKING_VERSION } from "./providers/ranking.utils";
import { VideoMetadata, VideoSearchOptions } from "./providers/video-provider.interface";

@Injectable()
export class YouTubeService {
  private readonly logger = new Logger("YouTubeService");
  private readonly inFlightRequests = new Map<string, Promise<YouTubeVideoItem[]>>();

  constructor(
    @InjectModel(YouTubeCache.name)
    private cacheModel: Model<YouTubeCacheDocument>,
    @InjectModel(Recipe.name)
    private recipeModel: Model<RecipeDocument>,
    private readonly recipeSourceProvider: RecipeSourceVideoProvider,
    private readonly youtubeDataProvider: YouTubeDataVideoProvider,
    private readonly invidiousProvider: InvidiousVideoProvider
  ) {}

  public hashKey(
    dish: string,
    languages: string[] = ["English"],
    filter = "recommended"
  ): string {
    const sortedLangs = [...languages].map((l) => l.trim().toLowerCase()).sort().join(",");
    return crypto
      .createHash("sha256")
      .update(`${RANKING_VERSION}|${dish.trim().toLowerCase()}|${sortedLangs}|${filter.toLowerCase()}`)
      .digest("hex");
  }

  /**
   * Retrieves video tutorials for a recipe following strict source priority:
   * 1. Exact recipe-linked video from database / TheMealDB (zero external search needed)
   * 2. MongoDB cached recommendations
   * 3. Official YouTube Data API v3 (if API key configured)
   * 4. Free Invidious public instance fallback
   * 5. Empty list fallback (directs UI to official YouTube search)
   */
  async getVideosForRecipe(
    dishName: string,
    languages: string[] | string = ["English"],
    filter = "recommended",
    recipeId?: string
  ): Promise<YouTubeVideoItem[]> {
    const normalizedLangs = Array.isArray(languages)
      ? languages
      : [languages || "English"];
    const cacheKey = this.hashKey(dishName, normalizedLangs, filter);

    // Deduplicate in-flight concurrent identical requests
    if (this.inFlightRequests.has(cacheKey)) {
      return this.inFlightRequests.get(cacheKey)!;
    }

    const task = this.resolveVideosPipeline(
      dishName,
      normalizedLangs,
      filter,
      cacheKey,
      recipeId
    );
    this.inFlightRequests.set(cacheKey, task);

    try {
      return await task;
    } finally {
      this.inFlightRequests.delete(cacheKey);
    }
  }

  private async resolveVideosPipeline(
    dishName: string,
    languages: string[],
    filter: string,
    cacheKey: string,
    recipeId?: string
  ): Promise<YouTubeVideoItem[]> {
    let exactRecipeVideo: VideoMetadata | null = null;
    let recipeContext: any = null;

    // =========================================================================
    // PRIORITY 1: Exact recipe-linked tutorial stored in MongoDB / TheMealDB
    // =========================================================================
    if (recipeId) {
      try {
        const recipeDoc = await this.recipeModel
          .findOne({
            $or: [
              { _id: recipeId.match(/^[0-9a-fA-F]{24}$/) ? recipeId : undefined },
              { externalId: recipeId },
              { slug: recipeId },
            ].filter(Boolean),
          })
          .lean();

        if (recipeDoc) {
          recipeContext = recipeDoc;
          const linkedVideo = await this.recipeSourceProvider.resolveFromRecipe(
            recipeDoc
          );
          if (linkedVideo) {
            // A linked URL is only shown after a live provider/oEmbed check.
            // Removed/private videos deliberately fall through to normal search.
            exactRecipeVideo = await this.youtubeDataProvider.getVideoMetadata(linkedVideo.id)
              || await this.invidiousProvider.getVideoMetadata(linkedVideo.id)
              || await this.recipeSourceProvider.getVideoMetadata(linkedVideo.id);
            if (exactRecipeVideo) exactRecipeVideo.relevanceScore = 100;
          }
        }
      } catch (err: any) {
        this.logger.debug(`Recipe lookup for video skipped: ${err.message}`);
      }
    }

    // If an exact tutorial exists and user didn't request a non-default filter, return it directly!
    if (exactRecipeVideo && filter === "recommended") {
      const singleResult: YouTubeVideoItem[] = [
        this.toCacheItem(exactRecipeVideo),
      ];
      return singleResult;
    }

    // =========================================================================
    // PRIORITY 2: MongoDB Atlas Video Cache
    // =========================================================================
    try {
      const cached = await this.cacheModel.findOne({ cacheKey }).lean();
      if (cached && cached.expiresAt > new Date() && cached.videos?.length > 0) {
        // Cache expiry alone cannot detect a later deletion/private change on
        // YouTube. Verify each cached ID before returning it to the client.
        const availability = await Promise.all(
          cached.videos.map(async (video) => ({
            id: video.id,
            available: Boolean(await this.recipeSourceProvider.getVideoMetadata(video.id)),
          }))
        );
        const availableIds = new Set(availability.filter((item) => item.available).map((item) => item.id));
        const availableVideos = cached.videos.filter((video) => availableIds.has(video.id));
        if (availableVideos.length === 0) {
          this.logger.debug(`Discarded stale YouTube cache for ${dishName}: no videos remain available`);
        } else {
        // If we also had an exact recipe tutorial, prepend it if not already present
        if (
          exactRecipeVideo &&
          !availableVideos.some((v) => v.id === exactRecipeVideo!.id)
        ) {
          return [this.toCacheItem(exactRecipeVideo), ...availableVideos];
        }
        return availableVideos;
        }
      }
    } catch (err: any) {
      this.logger.warn(`Cache read error: ${err.message}`);
    }

    // =========================================================================
    // PRIORITY 3: Official YouTube Data API v3 (when configured)
    // =========================================================================
    const searchOptions: VideoSearchOptions = {
      dish: dishName,
      languages,
      filter,
      maxResults: 6,
      recipeId,
      recipeFeatures: this.deriveRecipeFeatures(dishName, recipeContext),
    };
    const queries = buildProgressiveQueries(searchOptions);

    let searchResults: VideoMetadata[] = [];

    if (this.youtubeDataProvider.isConfigured()) {
      searchLoop: for (const query of queries) {
        for (const language of languages) {
        try {
          const results = await this.youtubeDataProvider.searchVideos(query, {
            ...searchOptions,
            languages: [language],
          });
          searchResults.push(...results);
          // Do not consume quota on secondary languages after three strong matches.
          if (rankAndFilterVideos(searchResults, searchOptions, 45).length >= 3) break searchLoop;
        } catch (err: any) {
          this.logger.warn(`YouTube Data API failed: ${err.message}`);
        }
        }
      }
    }

    // =========================================================================
    // PRIORITY 4: Free Invidious Public API Fallback
    // =========================================================================
    if (rankAndFilterVideos(searchResults, searchOptions, 45).length < 3) {
      try {
        for (const query of queries) {
          const results = await this.invidiousProvider.searchVideos(query, searchOptions);
          searchResults.push(...results);
          if (rankAndFilterVideos(searchResults, searchOptions, 45).length >= 3) break;
        }
      } catch (err: any) {
        this.logger.warn(`Invidious search fallback failed: ${err.message}`);
      }
    }

    // Validation rejects weak dish matches before relevance-first ranking.
    let ranked = rankAndFilterVideos(searchResults, searchOptions, 45);

    // If an exact recipe video exists, always put it first
    if (exactRecipeVideo) {
      ranked = [
        exactRecipeVideo,
        ...ranked.filter((v) => v.id !== exactRecipeVideo!.id),
      ];
    }

    // Convert to persistence schema
    const finalVideos: YouTubeVideoItem[] = ranked.slice(0, 3).map((v) =>
      this.toCacheItem(v)
    );

    // =========================================================================
    // PRIORITY 5: Store in MongoDB cache if results exist
    // Exact recipe: 30 days TTL. Search results: 3 days TTL.
    // =========================================================================
    if (finalVideos.length > 0) {
      const ttlDays = exactRecipeVideo ? 30 : 3;
      const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

      this.cacheModel
        .findOneAndUpdate(
          { cacheKey },
          {
            cacheKey,
            recipeId,
            recipeName: dishName,
            language: finalVideos[0]?.language || "",
            filter,
            rankingVersion: RANKING_VERSION,
            provider: finalVideos[0]?.provider || "youtube",
            videos: finalVideos,
            fetchedAt: new Date(),
            expiresAt,
          },
          { upsert: true }
        )
        .catch((err) =>
          this.logger.warn(`Failed to cache YouTube search: ${err.message}`)
        );
    }

    // If no video passed minimum relevance threshold, return empty list []
    // The mobile UI will show "Search on YouTube" button.
    return finalVideos;
  }

  private deriveRecipeFeatures(dishName: string, recipe?: any): VideoSearchOptions["recipeFeatures"] {
    const source = `${dishName} ${recipe?.name || ""} ${recipe?.category || ""} ${(recipe?.tags || []).join(" ")} ${(recipe?.searchKeywords || []).join(" ")}`.toLowerCase();
    const ingredientNames = (recipe?.ingredients || []).map((ingredient: any) => `${ingredient.normalizedName || ""} ${ingredient.name || ""}`).join(" ").toLowerCase();
    const mainIngredient = ["chicken", "mutton", "lamb", "beef", "pork", "fish", "prawn", "shrimp", "egg", "paneer", "tofu", "mushroom", "potato", "dal", "lentil", "rice"]
      .find((ingredient) => new RegExp(`\\b${ingredient}\\b`, "i").test(`${source} ${ingredientNames}`));
    const cookingMethod = ["stir fry", "curry", "fried", "grilled", "baked", "steamed", "roasted", "one pot", "pressure cooked", "marinated", "pan cooked", "biryani", "masala"]
      .find((method) => source.includes(method));
    const importantKeywords = dishName.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 2 && word !== mainIngredient && !["recipe", "style", "indian"].includes(word));

    return {
      mainIngredient,
      cuisine: recipe?.cuisine,
      category: recipe?.category || recipe?.mealTypes?.[0],
      cookingMethod,
      importantKeywords,
    };
  }

  private toCacheItem(v: VideoMetadata): YouTubeVideoItem {
    return {
      id: v.id,
      title: v.title,
      channelTitle: v.channelTitle,
      description: v.description || "",
      thumbnailUrl: v.thumbnailUrl,
      videoUrl: v.videoUrl,
      embedUrl: v.embedUrl,
      duration: v.duration || "",
      durationSeconds: v.durationSeconds || 0,
      views: v.views || "",
      viewCount: v.viewCount || 0,
      language: v.language || "",
      matchType: v.matchType || (v.relevanceScore >= 90 ? "recommended" : v.relevanceScore >= 75 ? "strong" : v.relevanceScore >= 55 ? "related" : "similar"),
      provider: v.provider || "youtube",
      score: v.relevanceScore || 0,
      relevanceScore: v.relevanceScore || 0,
    };
  }
}
