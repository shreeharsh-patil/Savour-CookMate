import { YouTubeVideo } from '../types';

export type YouTubeFilter = 'recommended' | 'english' | 'hindi' | 'quick' | 'detailed';

export interface YouTubeSearchResult {
  videos: YouTubeVideo[];
  searchesGenerated?: string[];
  source?: string;
}

// In-flight request deduplication map: url -> Promise
const inFlightYouTube = new Map<string, Promise<YouTubeVideo[]>>();
// Client-side cache (10 minutes)
const clientYouTubeCache = new Map<string, { videos: YouTubeVideo[]; expires: number }>();

export const youtubeService = {
  /**
   * Search YouTube for authentic cooking tutorials matching a recipe or query
   * Features in-flight deduplication and client memory caching.
   */
  async searchCookingVideos(
    queryOrDish: string,
    filter: YouTubeFilter = 'recommended',
    languages?: string[]
  ): Promise<YouTubeVideo[]> {
    const langParam = languages && languages.length > 0 ? `&languages=${encodeURIComponent(languages.join(','))}` : '';
    const url = `/api/youtube/search?dish=${encodeURIComponent(queryOrDish)}&q=${encodeURIComponent(queryOrDish)}&filter=${encodeURIComponent(filter)}${langParam}`;

    // 1. Check client memory cache
    const cached = clientYouTubeCache.get(url);
    if (cached && cached.expires > Date.now()) {
      return cached.videos;
    }

    // 2. Check if identical request is currently in-flight
    if (inFlightYouTube.has(url)) {
      return inFlightYouTube.get(url)!;
    }

    const fetchPromise = (async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`YouTube search service returned ${response.status}`);
        }

        const data: YouTubeSearchResult = await response.json();
        const videos = data.videos || [];
        // Cache for 10 minutes
        clientYouTubeCache.set(url, { videos, expires: Date.now() + 600000 });
        return videos;
      } catch (error) {
        console.warn('YouTube search request failed, falling back:', error);
        return [];
      } finally {
        inFlightYouTube.delete(url);
      }
    })();

    inFlightYouTube.set(url, fetchPromise);
    return fetchPromise;
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
  }
};
