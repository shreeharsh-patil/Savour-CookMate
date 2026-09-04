/**
 * Free Invidious Video Provider Fallback
 * Best-effort public API discovery without hardcoded single instance
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
  formatSeconds,
  formatViews,
} from "../youtube.utils";
import {
  calculateRelevanceScore,
  detectVideoLanguage,
  isDisqualifiedContent,
} from "./ranking.utils";

@Injectable()
export class InvidiousVideoProvider implements VideoProvider {
  public readonly providerName = "invidious";
  private readonly logger = new Logger("InvidiousVideoProvider");
  private readonly TIMEOUT_MS = 3000;
  private readonly MAX_ATTEMPTS = 3;

  private getInstances(): string[] {
    const raw = ENV.INVIDIOUS_INSTANCES || "";
    return raw
      .split(",")
      .map((s) => s.trim().replace(/\/$/, ""))
      .filter(Boolean);
  }

  async searchVideos(
    query: string,
    options: VideoSearchOptions
  ): Promise<VideoMetadata[]> {
    const instances = this.getInstances();
    if (instances.length === 0) return [];

    const searchQuery = `${query.trim()} recipe tutorial`;

    // Try up to MAX_ATTEMPTS instances
    for (let i = 0; i < Math.min(instances.length, this.MAX_ATTEMPTS); i++) {
      const instance = instances[i];
      const searchUrl = `${instance}/api/v1/search?q=${encodeURIComponent(
        searchQuery
      )}&type=video&sort_by=relevance`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

      try {
        const res = await fetch(searchUrl, {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
            "User-Agent": "YummyTummy/2.0",
          },
        });
        clearTimeout(timeout);

        if (!res.ok) {
          this.logger.warn(
            `Invidious instance ${instance} returned ${res.status}, trying next...`
          );
          continue;
        }

        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) {
          continue;
        }

        const candidates: VideoMetadata[] = [];

        for (const item of data) {
          const id = item.videoId;
          if (!id || typeof id !== "string") continue;

          const title = item.title || "";
          const description = item.description || "";
          const channelTitle = item.author || item.authorId || "";

          if (isDisqualifiedContent(title, description)) {
            continue;
          }

          const durationSeconds =
            typeof item.lengthSeconds === "number" && item.lengthSeconds > 0
              ? item.lengthSeconds
              : undefined;
          const duration = formatSeconds(durationSeconds);

          const viewCount =
            typeof item.viewCount === "number" && item.viewCount > 0
              ? item.viewCount
              : undefined;
          const views = formatViews(viewCount);

          const score = calculateRelevanceScore(
            {
              title,
              description,
              channelTitle,
              durationSeconds,
              language: detectVideoLanguage(title, description),
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
            language: detectVideoLanguage(title, description),
            relevanceScore: score,
            provider: "invidious",
          });
        }

        if (candidates.length > 0) {
          return candidates;
        }
      } catch (err: any) {
        clearTimeout(timeout);
        this.logger.warn(
          `Invidious instance ${instance} failed: ${err.message}, trying next...`
        );
      }
    }

    return [];
  }

  async getVideoMetadata(videoId: string): Promise<VideoMetadata | null> {
    const instances = this.getInstances();
    for (let i = 0; i < Math.min(instances.length, 2); i++) {
      const instance = instances[i];
      const url = `${instance}/api/v1/videos/${encodeURIComponent(videoId)}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

      try {
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        if (!res.ok) continue;

        const data = await res.json();
        if (!data?.title) continue;
        return {
          id: videoId,
          title: data.title || "",
          channelTitle: data.author || "",
          thumbnailUrl: buildThumbnailUrl(videoId),
          videoUrl: buildWatchUrl(videoId),
          embedUrl: buildEmbedUrl(videoId),
          duration: formatSeconds(data.lengthSeconds),
          durationSeconds: data.lengthSeconds,
          views: formatViews(data.viewCount),
          viewCount: data.viewCount,
          language: detectVideoLanguage(data.title || "", data.description || ""),
          relevanceScore: 75,
          provider: "invidious",
        };
      } catch {
        clearTimeout(timeout);
      }
    }
    return null;
  }
}
