/**
 * Deterministic Video Relevance Ranking and Scoring
 */

import { VideoMetadata, VideoSearchOptions } from "./video-provider.interface";

export const DISQUALIFIED_TERMS = [
  "reaction",
  "reacts",
  "reacting",
  "mukbang",
  "eating show",
  "asmr eating",
  "food challenge",
  "eating challenge",
  "challenge",
  "prank",
  "restaurant review",
  "street food review",
  "unboxing",
  "compilation",
  "worst food",
  "24 hours eating",
  "blind taste test",
  "funny moments",
];

export const TRUSTED_CHANNELS = [
  "Chef Ranveer Brar",
  "Ranveer Brar",
  "Sanjeev Kapoor Khazana",
  "Sanjeev Kapoor",
  "Kunal Kapur",
  "Chef Kunal Kapur",
  "Hebbars Kitchen",
  "Your Food Lab",
  "Bharatzkitchen",
  "Vincenzo's Plate",
  "Hot Thai Kitchen",
  "Preppy Kitchen",
  "Gordon Ramsay",
  "Babish Culinary Universe",
  "Joshua Weissman",
  "Tasty",
  "Nisha Madhulika",
  "Kabita's Kitchen",
  "Rajshri Food",
  "Tarla Dalal",
];

export const TUTORIAL_KEYWORDS = [
  "recipe",
  "how to make",
  "how to cook",
  "authentic",
  "traditional",
  "step by step",
  "easy",
  "quick",
  "homemade",
  "restaurant style",
  "dhaba style",
];

const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "with",
  "in",
  "of",
  "for",
  "to",
  "style",
  "special",
]);

/**
 * Tokenizes a dish name into meaningful culinary keywords.
 */
export function extractDishTokens(dish: string): string[] {
  return dish
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

/**
 * Checks if text contains any disqualified non-cooking terms.
 */
export function isDisqualifiedContent(title: string, description = ""): boolean {
  const text = `${title} ${description}`.toLowerCase();
  return DISQUALIFIED_TERMS.some((term) => text.includes(term));
}

/**
 * Calculates a deterministic recipe relevance score from 0 to 100+.
 * Minimum acceptable score for a recipe tutorial is 60.
 */
export function calculateRelevanceScore(
  video: {
    title: string;
    description?: string;
    channelTitle?: string;
    durationSeconds?: number;
    language?: string;
  },
  options: VideoSearchOptions
): number {
  const { dish, filter = "recommended", languages = [] } = options;
  const titleLower = video.title.toLowerCase();
  const descLower = (video.description || "").toLowerCase();
  const channelLower = (video.channelTitle || "").toLowerCase();
  const combinedText = `${titleLower} ${descLower}`;

  // 1. Immediate Disqualification for non-cooking/mukbang/reaction content
  if (isDisqualifiedContent(titleLower, descLower)) {
    return 0;
  }

  // 2. Duration checks when duration is available
  if (video.durationSeconds !== undefined && video.durationSeconds > 0) {
    // Ultra-short clips (< 45s) are not actionable cooking tutorials
    if (video.durationSeconds < 45) return 0;
    // Over 1 hour is usually a stream or compilation
    if (video.durationSeconds > 3600) return 0;
  }

  // 3. Dish Name Relevance & Token Overlap
  const dishTokens = extractDishTokens(dish);
  if (dishTokens.length === 0) return 50;

  const matchedTokens = dishTokens.filter(
    (token) => titleLower.includes(token) || descLower.includes(token)
  );
  const titleMatchedTokens = dishTokens.filter((token) =>
    titleLower.includes(token)
  );

  // If none of the dish tokens appear in the video title or description, reject it
  if (matchedTokens.length === 0) {
    return 10;
  }

  // Require meaningful title match: at least 1 token if single-word dish, or at least 50% for multi-word
  const tokenMatchRatio = titleMatchedTokens.length / dishTokens.length;
  if (dishTokens.length > 1 && tokenMatchRatio < 0.4) {
    // E.g. "Butter Chicken" matching neither "butter" nor "chicken"
    return 20;
  }

  let score = 40;

  // Title overlap points
  if (tokenMatchRatio === 1) {
    score += 35; // Perfect title match
  } else if (tokenMatchRatio >= 0.5) {
    score += 20;
  } else {
    score += 10;
  }

  // Exact phrase match in title
  if (titleLower.includes(dish.toLowerCase().trim())) {
    score += 15;
  }

  // 4. Recipe / Tutorial Intent Keywords
  const hasTutorialKeyword = TUTORIAL_KEYWORDS.some((kw) =>
    titleLower.includes(kw)
  );
  if (hasTutorialKeyword) {
    score += 15;
  }

  // 5. Trusted Cooking Channel Bonus
  const isTrustedChannel = TRUSTED_CHANNELS.some((tc) =>
    channelLower.includes(tc.toLowerCase())
  );
  if (isTrustedChannel) {
    score += 20;
  }

  // 6. Filter Specific Weighting
  const lowerFilter = filter.toLowerCase();

  // Duration Filters
  if (video.durationSeconds !== undefined && video.durationSeconds > 0) {
    if (lowerFilter === "quick") {
      if (video.durationSeconds >= 60 && video.durationSeconds <= 600) {
        score += 30; // Ideal quick tutorial (1 - 10 mins)
      } else if (video.durationSeconds > 900) {
        score -= 30; // Not a quick tutorial
      }
    } else if (lowerFilter === "detailed") {
      if (video.durationSeconds >= 600 && video.durationSeconds <= 2400) {
        score += 30; // Detailed masterclass (10 - 40 mins)
      } else if (video.durationSeconds < 480) {
        score -= 30; // Too short for detailed
      }
    } else {
      // General / Recommended: Sweet spot is 4 to 20 minutes
      if (video.durationSeconds >= 240 && video.durationSeconds <= 1200) {
        score += 10;
      }
    }
  }

  // Language Filters
  const hasHindiKeywords =
    /[\u0900-\u097F]/.test(titleLower) ||
    titleLower.includes("hindi") ||
    titleLower.includes("recipe in hindi");

  if (lowerFilter === "hindi" || languages.map((l) => l.toLowerCase()).includes("hindi")) {
    if (hasHindiKeywords) {
      score += 25;
    }
  }

  if (lowerFilter === "english" || languages.map((l) => l.toLowerCase()).includes("english")) {
    if (!hasHindiKeywords && !/[\u0900-\u097F]/.test(titleLower)) {
      score += 15;
    }
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Filters and ranks video candidates deterministically.
 * Drops any video with a relevance score below minimumThreshold (default 60).
 */
export function rankAndFilterVideos(
  videos: VideoMetadata[],
  options: VideoSearchOptions,
  minimumThreshold = 60
): VideoMetadata[] {
  const scored = videos
    .map((v) => {
      const score = calculateRelevanceScore(v, options);
      return {
        ...v,
        relevanceScore: score,
      };
    })
    .filter((v) => v.relevanceScore >= minimumThreshold);

  // Deterministic sorting: Highest relevance score first.
  // If scores are equal, prefer videos with real view counts or duration.
  scored.sort((a, b) => {
    if (b.relevanceScore !== a.relevanceScore) {
      return b.relevanceScore - a.relevanceScore;
    }
    if ((b.viewCount || 0) !== (a.viewCount || 0)) {
      return (b.viewCount || 0) - (a.viewCount || 0);
    }
    return a.title.localeCompare(b.title);
  });

  return scored;
}
