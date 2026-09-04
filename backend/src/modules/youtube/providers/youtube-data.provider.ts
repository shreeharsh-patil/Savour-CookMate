/**
 * Official YouTube Data API v3 Video Provider
 * Free quota, highest quality metadata when YOUTUBE_API_KEY is configured
 */

import { Injectable, Logger } from "@nestjs/common";
import { ENV } from "../../../config/env.config";
import {
  VideoProvider,
  VideoMetadata,
  VideoSearchOptions,
} from "./video-provider.interface";
import {
  buildWatchUrl,
  buildEmbedUrl,
  buildThumbnailUrl,
  parseIsoDuration,
  formatSeconds,
  formatViews,
  normalizeLanguageCode,
} from "../youtube.utils";
import {
  calculateRelevanceScore,
  isDisqualifiedContent,
} from "./ranking.utils";

@Injectable()
export class YouTubeDataVideoProvider implements VideoProvider {
  public readonly providerName = "youtube_data_api";
  private readonly logger = new Logger("YouTubeDataVideoProvider");

  isConfigured(): boolean {
    return Boolean(ENV.YOUTUBE_API_KEY && ENV.YOUTUBE_API_KEY.trim());
  }

  async searchVideos(
    query: string,
    options: VideoSearchOptions
  ): Promise<VideoMetadata[]> {
    if (!this.isConfigured()) return [];

    const dishQuery = `${options.dish.trim()} recipe`;
    const preferredLang = options.languages?.[0];
    const langCode = normalizeLanguageCode(preferredLang);

    // Build search URL with relevanceLanguage and videoEmbeddable
    // NOTE: We do NOT force videoCaption=closedCaption because it excludes many authentic tutorials
    let searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
      dishQuery
    )}&type=video&videoEmbeddable=true&maxResults=${options.maxResults || 8}&key=${
      ENV.YOUTUBE_API_KEY
    }`;

    if (langCode && langCode !== "en") {
      searchUrl += `&relevanceLanguage=${langCode}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    try {
      const res = await fetch(searchUrl, {
        signal: controller.signal,
        headers: { "User-Agent": "SavourCookMate/2.0" },
      });
      clearTimeout(timeout);

      if (!res.ok) {
        this.logger.warn(`YouTube Data API search returned HTTP ${res.status}`);
        return [];
      }

      const data = await res.json();
      if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
        return [];
      }

      const videoIds = data.items
        .map((it: any) => it.id?.videoId)
        .filter(Boolean);

      if (videoIds.length === 0) return [];

      // Fetch real details (duration and views)
      const detailsMap = await this.fetchVideoDetails(videoIds);

      const candidates: VideoMetadata[] = [];

      for (const item of data.items) {
        const id = item.id?.videoId;
        if (!id) continue;

        const title = item.snippet?.title || "";
        const description = item.snippet?.description || "";
        const channelTitle = item.snippet?.channelTitle || "";

        if (isDisqualifiedContent(title, description)) {
          continue;
        }

        const detail = detailsMap[id];
        const durationSeconds = detail?.durationSeconds;
        const duration = formatSeconds(durationSeconds);
        const viewCount = detail?.viewCount;
        const views = formatViews(viewCount);

        const score = calculateRelevanceScore(
          {
            title,
            description,
            channelTitle,
            durationSeconds,
            language: preferredLang,
          },
          options
        );

        candidates.push({
          id,
          title,
          channelTitle,
          description,
          thumbnailUrl: buildThumbnailUrl(id),
          videoUrl: buildWatchUrl(id),
          embedUrl: buildEmbedUrl(id),
          duration,
          durationSeconds,
          views,
          viewCount,
          language: preferredLang,
          relevanceScore: score,
          provider: "youtube_data_api",
        });
      }

      return candidates;
    } catch (err: any) {
      clearTimeout(timeout);
      this.logger.warn(`YouTube Data API error: ${err.message}`);
      return [];
    }
  }

  private async fetchVideoDetails(
    videoIds: string[]
  ): Promise<Record<string, { durationSeconds: number; viewCount: number }>> {
    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics&id=${videoIds.join(
      ","
    )}&key=${ENV.YOUTUBE_API_KEY}`;

    try {
      const res = await fetch(detailsUrl);
      if (!res.ok) return {};

      const data = await res.json();
      const map: Record<string, { durationSeconds: number; viewCount: number }> =
        {};

      for (const d of data.items || []) {
        const seconds = parseIsoDuration(d.contentDetails?.duration);
        const views = parseInt(d.statistics?.viewCount || "0", 10);
        map[d.id] = {
          durationSeconds: seconds > 0 ? seconds : 0,
          viewCount: views > 0 ? views : 0,
        };
      }
      return map;
    } catch {
      return {};
    }
  }

  async getVideoMetadata(videoId: string): Promise<VideoMetadata | null> {
    if (!this.isConfigured()) return null;

    const detailsMap = await this.fetchVideoDetails([videoId]);
    const detail = detailsMap[videoId];

    return {
      id: videoId,
      title: "Recipe Tutorial",
      channelTitle: "YouTube Creator",
      thumbnailUrl: buildThumbnailUrl(videoId),
      videoUrl: buildWatchUrl(videoId),
      embedUrl: buildEmbedUrl(videoId),
      duration: formatSeconds(detail?.durationSeconds),
      durationSeconds: detail?.durationSeconds,
      views: formatViews(detail?.viewCount),
      viewCount: detail?.viewCount,
      relevanceScore: 80,
      provider: "youtube_data_api",
    };
  }
}
