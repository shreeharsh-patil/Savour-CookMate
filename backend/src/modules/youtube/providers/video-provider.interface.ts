/**
 * Video Provider Architecture Interfaces
 */

export interface VideoSearchOptions {
  dish: string;
  languages?: string[];
  filter?: "recommended" | "english" | "hindi" | "quick" | "detailed" | "all" | string;
  maxResults?: number;
  recipeKeywords?: string[];
  recipeId?: string;
}

export interface VideoMetadata {
  id: string;
  title: string;
  channelTitle: string;
  description?: string;
  thumbnailUrl: string;
  videoUrl: string;
  embedUrl: string;
  duration?: string; // only if real
  durationSeconds?: number; // only if real
  views?: string; // only if real
  viewCount?: number; // only if real
  language?: string; // only if real and known
  matchType?: "recommended" | "related";
  relevanceScore: number;
  provider: "recipe_source" | "youtube_data_api" | "invidious";
}

export interface VideoProvider {
  readonly providerName: string;
  searchVideos(query: string, options: VideoSearchOptions): Promise<VideoMetadata[]>;
  getVideoMetadata(videoId: string): Promise<VideoMetadata | null>;
  validateVideo?(videoId: string): Promise<boolean>;
}
