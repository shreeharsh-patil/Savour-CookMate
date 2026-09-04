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
      // The linked recipe establishes identity; metadata is not invented.
      title: "Open recipe tutorial",
      channelTitle: recipe.source || "",
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
    // oEmbed is a keyless public availability check and returns real title/channel
    // data. It fails for removed, private, or otherwise unavailable videos.
    try {
      const url = `https://www.youtube.com/oembed?url=${encodeURIComponent(buildWatchUrl(cleanId))}&format=json`;
      const response = await fetch(url);
      if (!response.ok) return null;
      const data = await response.json();
      if (!data?.title || !data?.author_name) return null;
      return {
        id: cleanId,
        title: data.title,
        channelTitle: data.author_name,
        thumbnailUrl: data.thumbnail_url || buildThumbnailUrl(cleanId),
        videoUrl: buildWatchUrl(cleanId),
        embedUrl: buildEmbedUrl(cleanId),
        duration: undefined,
        durationSeconds: undefined,
        views: undefined,
        viewCount: undefined,
        language: undefined,
        relevanceScore: 100,
        provider: "recipe_source",
      };
    } catch {
      return null;
    }
  }
}
