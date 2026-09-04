import { Linking } from 'react-native';
import { YouTubeVideo } from '../types';
import { apiRequest } from './apiClient';

export type YouTubeFilter = 'recommended' | 'english' | 'hindi' | 'quick' | 'detailed';

export const youtubeService = {
  /**
   * Search YouTube for authentic cooking tutorials matching a recipe or query
   * Queries the secure Savour backend proxy (no API keys on client).
   */
  async searchCookingVideos(
    queryOrDish: string,
    filter: YouTubeFilter = 'recommended',
    languages?: string[]
  ): Promise<YouTubeVideo[]> {
    const langParam =
      languages && languages.length > 0
        ? `&languages=${encodeURIComponent(languages.join(','))}`
        : '';

    const endpoint = `/api/youtube/search?dish=${encodeURIComponent(
      queryOrDish
    )}&q=${encodeURIComponent(queryOrDish)}&filter=${encodeURIComponent(
      filter
    )}${langParam}`;

    try {
      const data = await apiRequest<{ videos?: YouTubeVideo[] }>(endpoint, {
        method: 'GET',
        timeoutMs: 10000,
        retries: 1,
      });

      return Array.isArray(data?.videos) ? data.videos : [];
    } catch (error) {
      console.warn('YouTube search request error:', error);
      return [];
    }
  },

  /**
   * Generates a safe embed URL from a YouTube ID
   */
  getEmbedUrl(videoId: string): string {
    return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
  },

  /**
   * Generates a direct watch URL
   */
  getWatchUrl(videoId: string): string {
    return `https://www.youtube.com/watch?v=${videoId}`;
  },

  /**
   * Opens the video directly in the YouTube native app or system browser
   */
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
      // Ignore and fallback to web url
    }

    await Linking.openURL(webUrl);
  },
};
