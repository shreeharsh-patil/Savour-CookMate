/**
 * Recipe Source Video Provider
 * Extracts exact tutorial videos linked to the recipe (e.g. from TheMealDB strYoutube or MongoDB)
 */

import { Injectable, Logger } from "@nestjs/common";
import {
  VideoProvider,
  VideoMetadata,
  VideoSearchOptions,
} from "./video-provider.interface";
import {
  extractYouTubeVideoId,
  buildWatchUrl,
  buildEmbedUrl,
  buildThumbnailUrl,
} from "../youtube.utils";

@Injectable()
export class RecipeSourceVideoProvider implements VideoProvider {
  public readonly providerName = "recipe_source";
  private readonly logger = new Logger("RecipeSourceVideoProvider");

  /**
   * Resolves exact recipe-linked video if recipe has youtubeVideoId or youtubeUrl.
   */
  async resolveFromRecipe(recipe: {
    name: string;
    sourceUrl?: string;
    youtubeUrl?: string;
    youtubeVideoId?: string;
    source?: string;
  }): Promise<VideoMetadata | null> {
    const videoId =
      recipe.youtubeVideoId || extractYouTubeVideoId(recipe.youtubeUrl);

    if (!videoId) return null;

    return {
      id: videoId,
      title: `${recipe.name} - Official Recipe Tutorial`,
      channelTitle: recipe.source || "Recipe Source",
      thumbnailUrl: buildThumbnailUrl(videoId),
      videoUrl: buildWatchUrl(videoId),
      embedUrl: buildEmbedUrl(videoId),
      // Do not invent fake duration or fake views
      duration: undefined,
      durationSeconds: undefined,
      views: undefined,
      viewCount: undefined,
      language: undefined,
      relevanceScore: 100, // Exact recipe source tutorial
      provider: "recipe_source",
    };
  }

  async searchVideos(
    query: string,
    options: VideoSearchOptions
  ): Promise<VideoMetadata[]> {
    return [];
  }

  async getVideoMetadata(videoId: string): Promise<VideoMetadata | null> {
    const cleanId = extractYouTubeVideoId(videoId);
    if (!cleanId) return null;

    return {
      id: cleanId,
      title: "Recipe Tutorial",
      channelTitle: "Culinary Video",
      thumbnailUrl: buildThumbnailUrl(cleanId),
      videoUrl: buildWatchUrl(cleanId),
      embedUrl: buildEmbedUrl(cleanId),
      duration: undefined,
      durationSeconds: undefined,
      views: undefined,
      viewCount: undefined,
      relevanceScore: 100,
      provider: "recipe_source",
    };
  }
}
