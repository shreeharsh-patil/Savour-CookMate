/**
 * YouTube Utility Functions
 * Safe extraction, normalization, and URL construction without fake data
 */

export const YOUTUBE_ID_REGEX =
  /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([a-zA-Z0-9_-]{11})/i;

/**
 * Safely extracts an 11-character YouTube video ID from any standard URL.
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - https://m.youtube.com/watch?v=VIDEO_ID
 * Returns null if the URL is invalid or does not match a valid YouTube ID.
 */
export function extractYouTubeVideoId(url?: string | null): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // Direct 11-char ID passed
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const match = trimmed.match(YOUTUBE_ID_REGEX);
    if (match && match[1] && match[1].length === 11) {
      return match[1];
    }
  } catch {
    return null;
  }

  return null;
}

export function buildWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId.trim()}`;
}

export function buildEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId.trim()}?rel=0`;
}

export function buildThumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId.trim()}/hqdefault.jpg`;
}

/**
 * Parses standard ISO 8601 durations (e.g. PT12M34S, PT1H5M, PT45S).
 * Returns duration in seconds, or 0 if unparseable.
 */
export function parseIsoDuration(durationStr?: string | null): number {
  if (!durationStr || typeof durationStr !== "string") return 0;
  const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/i);
  if (!match) return 0;
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Formats a duration in seconds to standard MM:SS or H:MM:SS.
 */
export function formatSeconds(totalSeconds?: number | null): string | undefined {
  if (!totalSeconds || totalSeconds <= 0 || isNaN(totalSeconds)) return undefined;
  const hours = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  const padSec = s < 10 ? `0${s}` : `${s}`;

  if (hours > 0) {
    const padMin = m < 10 ? `0${m}` : `${m}`;
    return `${hours}:${padMin}:${padSec}`;
  }
  return `${m}:${padSec}`;
}

/**
 * Formats real view count to readable string without inventing fake metrics.
 */
export function formatViews(views?: number | null): string | undefined {
  if (views === undefined || views === null || isNaN(views) || views <= 0) {
    return undefined;
  }
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M views`;
  }
  if (views >= 1000) {
    return `${Math.round(views / 1000)}K views`;
  }
  return `${views} views`;
}

/**
 * Language normalization for YouTube/Invidious searches.
 */
export const LANGUAGE_MAP: Record<string, { code: string; label: string }> = {
  english: { code: "en", label: "English" },
  en: { code: "en", label: "English" },
  hindi: { code: "hi", label: "Hindi" },
  hi: { code: "hi", label: "Hindi" },
  marathi: { code: "mr", label: "Marathi" },
  mr: { code: "mr", label: "Marathi" },
  konkani: { code: "gom", label: "Konkani" },
  gom: { code: "gom", label: "Konkani" },
  tamil: { code: "ta", label: "Tamil" },
  ta: { code: "ta", label: "Tamil" },
  telugu: { code: "te", label: "Telugu" },
  te: { code: "te", label: "Telugu" },
};

export function normalizeLanguageCode(lang?: string | null): string {
  if (!lang) return "en";
  const lower = lang.trim().toLowerCase();
  return LANGUAGE_MAP[lower]?.code || "en";
}
