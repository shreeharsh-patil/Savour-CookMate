import { Linking, Alert } from "react-native";
import { YouTubeVideo } from "../types";
import { api } from "./api";

export type YouTubeFilter =
  | "recommended"
  | "english"
  | "hindi"
  | "quick"
  | "detailed";

export const youtubeService = {
  /**
   * Validates whether a given string is a valid 11-character YouTube video ID
   */
  isValidVideoId(id?: string | null): boolean {
    if (!id || typeof id !== "string") return false;
    return /^[a-zA-Z0-9_-]{11}$/.test(id.trim());
  },

  getEmbedUrl(videoId: string): string {
    const cleanId = videoId.trim();
    return `https://www.youtube-nocookie.com/embed/${cleanId}?autoplay=1&rel=0`;
  },

  getWatchUrl(videoId: string): string {
    const cleanId = videoId.trim();
    return `https://www.youtube.com/watch?v=${cleanId}`;
  },

  getSearchUrl(query: string): string {
    const cleanQuery = query.trim();
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(
      cleanQuery + " recipe tutorial"
    )}`;
  },

  /**
   * Opens video tutorial reliably using the official universal watch URL.
   * Lets the OS naturally route to the native YouTube app if installed,
   * or fall back smoothly to the system browser.
   */
  async openVideoInNativeApp(
    video: YouTubeVideo | { id: string; title?: string; videoUrl?: string }
  ): Promise<void> {
    const videoId = video.id?.trim();
    if (!this.isValidVideoId(videoId)) {
      Alert.alert(
        "Tutorial Unavailable",
        "This video link is invalid or no longer available on YouTube."
      );
      return;
    }

    const universalUrl = video.videoUrl || this.getWatchUrl(videoId);

    try {
      await Linking.openURL(universalUrl);
    } catch (err) {
      console.warn("Failed to open YouTube video:", err);
      Alert.alert(
        "Could Not Open Video",
        "Please check your internet connection or install the YouTube app."
      );
    }
  },

  /**
   * Opens official YouTube search as a reliable zero-fake-data fallback
   */
  async openYouTubeSearch(query: string): Promise<void> {
    const searchUrl = this.getSearchUrl(query);
    try {
      await Linking.openURL(searchUrl);
    } catch (err) {
      console.warn("Failed to open YouTube search:", err);
      Alert.alert(
        "Could Not Open YouTube",
        "Unable to launch YouTube search. Please try again later."
      );
    }
  },

  /**
   * Fetches authentic cooking videos through the backend pipeline
   */
  async searchCookingVideos(
    queryOrDish: string,
    filter: YouTubeFilter = "recommended",
    languages?: string[] | string,
    recipeId?: string,
    signal?: AbortSignal
  ): Promise<YouTubeVideo[]> {
    try {
      const videos = await api.youtube.getVideos(
        queryOrDish,
        languages || "English",
        filter,
        recipeId,
        signal
      );
      return Array.isArray(videos) ? videos : [];
    } catch (error: any) {
      if (error?.name === "AbortError" || signal?.aborted) {
        return [];
      }
      console.warn("YouTube search error:", error);
      return [];
    }
  },
};
