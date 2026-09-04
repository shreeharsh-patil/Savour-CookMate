import { Linking } from "react-native";
import { YouTubeVideo } from "../types";
import { api } from "./api";

export type YouTubeFilter = "recommended" | "english" | "hindi" | "quick" | "detailed";

export const youtubeService = {
  async searchCookingVideos(
    queryOrDish: string,
    filter: YouTubeFilter = "recommended",
    languages?: string[]
  ): Promise<YouTubeVideo[]> {
    try {
      const lang = languages && languages.length > 0 ? languages[0] : "English";
      const videos = await api.youtube.getVideos(queryOrDish, lang, filter);
      return Array.isArray(videos) ? videos : [];
    } catch (error) {
      console.warn("YouTube search error:", error);
      return [];
    }
  },

  getEmbedUrl(videoId: string): string {
    return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
  },

  getWatchUrl(videoId: string): string {
    return `https://www.youtube.com/watch?v=${videoId}`;
  },

  async openVideoInNativeApp(video: YouTubeVideo): Promise<void> {
    const appUrl = `vnd.youtube://${video.id}`;
    const webUrl = video.videoUrl || this.getWatchUrl(video.id);

    try {
      const canOpen = await Linking.canOpenURL(appUrl);
      if (canOpen) {
        await Linking.openURL(appUrl);
        return;
      }
    } catch {
      // fallback
    }

    try {
      await Linking.openURL(webUrl);
    } catch (err) {
      console.warn("Error launching video:", err);
    }
  },
};
