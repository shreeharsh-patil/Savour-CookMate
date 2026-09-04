import { VideoMetadata, VideoSearchOptions } from "./video-provider.interface";

export const RANKING_VERSION = "v3";

export const DISQUALIFIED_TERMS = [
  "reaction", "reacts", "mukbang", "eating show", "eating challenge", "food challenge",
  "restaurant review", "restaurant vlog", "food vlog", "taste test", "comparison", " vs ",
  "rating", "unboxing", "compilation", "prank", "challenge",
];

export const TUTORIAL_KEYWORDS = [
  "recipe", "how to make", "how to cook", "step by step", "homemade", "authentic",
  "traditional", "restaurant style", "dhaba style", "cooking",
];

export const TRUSTED_CHANNELS = [
  "Chef Ranveer Brar", "Sanjeev Kapoor", "Kunal Kapur", "Hebbars Kitchen", "Your Food Lab",
  "Bharatzkitchen", "Vincenzo's Plate", "Hot Thai Kitchen", "Nisha Madhulika", "Kabita's Kitchen",
  "Rajshri Food", "Tarla Dalal",
];

const STOP_WORDS = new Set(["a", "an", "the", "and", "or", "with", "in", "of", "for", "to", "style"]);
const PROTEINS = new Set(["chicken", "mutton", "lamb", "beef", "fish", "prawn", "prawns", "egg", "eggs", "paneer", "veg", "vegetable", "vegetables", "vegan"]);
const ALIASES: Record<string, string[]> = {
  "butter chicken": ["butter chicken", "murgh makhani", "chicken makhani"],
  "paneer butter masala": ["paneer butter masala", "paneer makhani", "butter paneer"],
  "pani puri": ["pani puri", "golgappa", "gol gappa", "puchka"],
  "curd rice": ["curd rice", "yogurt rice", "thayir sadam"],
  "pav bhaji": ["pav bhaji", "paav bhaji"],
};
const TARGET_CONFLICTS: Record<string, string[]> = {
  "butter chicken": ["butter garlic chicken", "chicken curry", "chicken biryani", "chicken fry", "chicken tikka", "chicken korma"],
  "paneer butter masala": ["paneer tikka", "paneer curry", "butter chicken"],
  "chicken biryani": ["veg biryani", "vegetable biryani", "mutton biryani", "lamb biryani", "beef biryani", "chicken curry"],
  "masala dosa": ["plain dosa", "rava dosa", "onion dosa"],
};

export type MatchConfidence = "EXACT" | "HIGH" | "MEDIUM" | "LOW";
export interface ValidationResult { valid: boolean; reason?: string; exact: boolean; alias: boolean; coreCoverage: number; tutorial: boolean; }

/** Canonical form used for all title and dish comparisons; never use substring matching. */
export function normalizeDishName(value: string): string {
  return (value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[’']/g, " ").replace(/[^\p{L}\p{N}]+/gu, " ").trim().replace(/\s+/g, " ");
}

export function extractDishTokens(dish: string): string[] {
  return normalizeDishName(dish).split(" ").filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function hasPhrase(text: string, phrase: string): boolean {
  const normalized = normalizeDishName(text);
  const normalizedPhrase = normalizeDishName(phrase);
  return ` ${normalized} `.includes(` ${normalizedPhrase} `);
}

function titleTokens(title: string): Set<string> { return new Set(extractDishTokens(title)); }
function aliasSet(dish: string): string[] {
  const normalized = normalizeDishName(dish);
  return Array.from(new Set([normalized, ...(ALIASES[normalized] || [])].map(normalizeDishName)));
}
export function getDishAliases(dish: string): string[] { return aliasSet(dish); }

function hasTutorialIntent(title: string): boolean {
  const normalized = normalizeDishName(title);
  return TUTORIAL_KEYWORDS.some((term) => hasPhrase(normalized, term));
}

export function isDisqualifiedContent(title: string, description = ""): boolean {
  const titleText = normalizeDishName(title);
  const descriptionText = normalizeDishName(description);
  return DISQUALIFIED_TERMS.some((term) => hasPhrase(titleText, term) || hasPhrase(descriptionText, term));
}

function hasVariantConflict(dish: string, title: string): boolean {
  const target = normalizeDishName(dish);
  const normalizedTitle = normalizeDishName(title);
  if ((TARGET_CONFLICTS[target] || []).some((phrase) => hasPhrase(normalizedTitle, phrase))) return true;

  const targetProteins = new Set(extractDishTokens(target).filter((token) => PROTEINS.has(token)));
  const candidateProteins = extractDishTokens(normalizedTitle).filter((token) => PROTEINS.has(token));
  if (targetProteins.size && candidateProteins.some((token) => !targetProteins.has(token))) return true;
  return false;
}

/** Stage 1: a candidate must prove dish identity before any quality signals are considered. */
export function validateVideoCandidate(video: Pick<VideoMetadata, "title" | "description" | "durationSeconds">, options: VideoSearchOptions): ValidationResult {
  const dish = normalizeDishName(options.dish);
  const title = normalizeDishName(video.title);
  const cores = extractDishTokens(dish);
  if (!dish || !title) return { valid: false, reason: "missing dish/title", exact: false, alias: false, coreCoverage: 0, tutorial: false };
  if (isDisqualifiedContent(video.title, video.description || "")) return { valid: false, reason: "non-tutorial intent", exact: false, alias: false, coreCoverage: 0, tutorial: false };
  if (video.durationSeconds && video.durationSeconds < 45) return { valid: false, reason: "shorter than 45 seconds", exact: false, alias: false, coreCoverage: 0, tutorial: false };
  if (hasVariantConflict(dish, title)) return { valid: false, reason: "conflicting dish variant", exact: false, alias: false, coreCoverage: 0, tutorial: false };

  const aliases = aliasSet(dish);
  const exact = hasPhrase(title, dish);
  const alias = !exact && aliases.slice(1).some((candidate) => hasPhrase(title, candidate));
  const words = titleTokens(title);
  const rawCoverage = cores.length ? cores.filter((token) => words.has(token)).length / cores.length : 0;
  const coverage = exact || alias ? 1 : rawCoverage;
  const tutorial = hasTutorialIntent(title);

  if (cores.length === 1) {
    if (!words.has(cores[0]) || !tutorial) return { valid: false, reason: "single-word dish needs title token and tutorial intent", exact, alias, coreCoverage: coverage, tutorial };
  } else if (!exact && !alias && coverage < 0.6) {
    return { valid: false, reason: "insufficient core title coverage", exact, alias, coreCoverage: coverage, tutorial };
  }
  return { valid: true, exact, alias, coreCoverage: coverage, tutorial };
}

export function detectVideoLanguage(title: string, description = ""): string | undefined {
  const text = `${title} ${description}`;
  if (/\b(recipe|video|in)\s+(in\s+)?hindi\b/i.test(text) || /[\u0900-\u097F]/.test(text)) return "Hindi";
  if (/\b(recipe|video|in)\s+(in\s+)?english\b/i.test(text)) return "English";
  return undefined;
}

function durationScore(seconds: number | undefined, filter: string): number {
  if (!seconds) return 0;
  const type = filter.toLowerCase();
  if (type === "quick") return seconds >= 120 && seconds <= 600 ? 8 : seconds >= 60 && seconds <= 900 ? 4 : 0;
  if (type === "detailed") return seconds >= 600 && seconds <= 2100 ? 8 : seconds >= 480 && seconds <= 2700 ? 4 : 0;
  return seconds >= 120 && seconds <= 1200 ? 8 : seconds >= 60 && seconds <= 2400 ? 4 : 0;
}

function languageScore(video: Pick<VideoMetadata, "title" | "description" | "language">, languages: string[] = []): number {
  const detected = video.language || detectVideoLanguage(video.title, video.description || "");
  if (!detected) return 0;
  return languages.some((language) => normalizeDishName(language) === normalizeDishName(detected)) ? 7 : 0;
}

function channelScore(channelTitle: string): number { return TRUSTED_CHANNELS.some((channel) => hasPhrase(channelTitle, channel)) ? 5 : 0; }
function engagementScore(views?: number): number { return views && views > 0 ? Math.min(5, Math.log10(views + 1) / 2) : 0; }

/** Stage 2: relevance is 75/100 points; quality only breaks ties among valid dish matches. */
export function calculateRelevanceScore(video: Pick<VideoMetadata, "title" | "description" | "channelTitle" | "durationSeconds" | "language" | "viewCount">, options: VideoSearchOptions): number {
  const validation = validateVideoCandidate(video, options);
  if (!validation.valid) return 0;
  let score = 0;
  if (validation.exact) score += 40;
  else if (validation.alias) score += 38;
  else if (validation.coreCoverage >= 0.6) score += 30;
  else score += 18;
  score += Math.round(validation.coreCoverage * 25);
  if (validation.tutorial) score += 10;
  score += durationScore(video.durationSeconds, options.filter || "recommended");
  score += languageScore(video, options.languages);
  score += channelScore(video.channelTitle);
  score += engagementScore(video.viewCount);
  return Math.min(100, Math.round(score));
}

function confidence(score: number): MatchConfidence { return score >= 90 ? "EXACT" : score >= 80 ? "HIGH" : score >= 70 ? "MEDIUM" : "LOW"; }
function duplicateKey(video: VideoMetadata): string { return `${normalizeDishName(video.channelTitle)}|${normalizeDishName(video.title).replace(/\b(full|hd|official|video)\b/g, "").trim()}`; }

export function rankAndFilterVideos(videos: VideoMetadata[], options: VideoSearchOptions, minimumThreshold = 70): VideoMetadata[] {
  const uniqueIds = new Set<string>();
  const uniqueTitles = new Set<string>();
  const ranked = videos.map((video) => ({ ...video, language: video.language || detectVideoLanguage(video.title, video.description || "") }))
    .filter((video) => !uniqueIds.has(video.id) && uniqueIds.add(video.id))
    .map((video) => {
      const relevanceScore = calculateRelevanceScore(video, options);
      return { ...video, relevanceScore, matchType: relevanceScore >= 75 ? "recommended" as const : "related" as const };
    })
    .filter((video) => video.relevanceScore >= minimumThreshold)
    .sort((a, b) => b.relevanceScore - a.relevanceScore || (b.viewCount || 0) - (a.viewCount || 0) || a.title.localeCompare(b.title))
    .filter((video) => !uniqueTitles.has(duplicateKey(video)) && uniqueTitles.add(duplicateKey(video)));
  if (process.env.NODE_ENV !== "production") ranked.forEach((video) => console.debug(`[youtube-rank:${RANKING_VERSION}] ${options.dish}: ${video.title} => ${video.relevanceScore} (${confidence(video.relevanceScore)})`));
  return ranked.slice(0, 3);
}
