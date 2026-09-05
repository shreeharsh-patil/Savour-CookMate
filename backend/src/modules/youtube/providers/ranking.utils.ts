import { VideoMatchType, VideoMetadata, VideoSearchOptions } from "./video-provider.interface";

export const RANKING_VERSION = "v4";

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

const STOP_WORDS = new Set(["a", "an", "the", "and", "or", "with", "in", "of", "for", "to", "style", "recipe"]);
const SUPPORTING_DISH_TERMS = new Set(["curry", "masala", "recipe", "dish", "style"]);
const INGREDIENTS = new Set(["chicken", "mutton", "lamb", "beef", "pork", "fish", "prawn", "shrimp", "egg", "paneer", "tofu", "veg", "vegetable", "vegan", "dal", "lentil", "rice", "potato", "mushroom"]);
const METHODS = ["curry", "stir fry", "fried", "grilled", "baked", "steamed", "roasted", "one pot", "pressure cooked", "marinated", "pan cooked", "biryani", "masala"];
const ALIASES: Record<string, string[]> = {
  "butter chicken": ["butter chicken", "murgh makhani", "chicken makhani"],
  "paneer butter masala": ["paneer butter masala", "paneer makhani", "butter paneer"],
  "pani puri": ["pani puri", "golgappa", "gol gappa", "puchka"],
  "curd rice": ["curd rice", "yogurt rice", "thayir sadam"],
  "pav bhaji": ["pav bhaji", "paav bhaji"],
};
const TARGET_CONFLICTS: Record<string, string[]> = {
  "butter chicken": ["butter garlic chicken", "chicken curry", "chicken biryani", "chicken fry", "chicken tikka", "chicken korma"],
  "paneer butter masala": ["paneer tikka", "butter chicken"],
  "chicken biryani": ["veg biryani", "vegetable biryani", "mutton biryani", "lamb biryani", "beef biryani", "chicken curry"],
  "masala dosa": ["plain dosa", "rava dosa", "onion dosa"],
};
const RELATED_CUISINES: Record<string, string[]> = { goan: ["indian", "konkani"], konkani: ["goan", "indian"], chinese: ["asian", "indo chinese"], "north indian": ["indian"], "south indian": ["indian"] };

export type MatchConfidence = "EXACT" | "HIGH" | "MEDIUM" | "LOW";
export interface ValidationResult { valid: boolean; reason?: string; exact: boolean; alias: boolean; coreCoverage: number; tutorial: boolean; }

export function normalizeDishName(value: string): string {
  return (value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[â€™']/g, " ").replace(/[^\p{L}\p{N}]+/gu, " ").trim().replace(/\s+/g, " ");
}
export function extractDishTokens(dish: string): string[] { return normalizeDishName(dish).split(" ").filter((token) => token.length > 1 && !STOP_WORDS.has(token) && !SUPPORTING_DISH_TERMS.has(token)); }
function hasPhrase(text: string, phrase: string): boolean { return ` ${normalizeDishName(text)} `.includes(` ${normalizeDishName(phrase)} `); }
function titleTokens(title: string): Set<string> { return new Set(extractDishTokens(title)); }
function aliasSet(dish: string): string[] { const normalized = normalizeDishName(dish); return Array.from(new Set([normalized, ...(ALIASES[normalized] || [])].map(normalizeDishName))); }
export function getDishAliases(dish: string): string[] { return aliasSet(dish); }
function hasTutorialIntent(title: string): boolean { return TUTORIAL_KEYWORDS.some((term) => hasPhrase(title, term)); }

export function isDisqualifiedContent(title: string, description = ""): boolean {
  return DISQUALIFIED_TERMS.some((term) => hasPhrase(title, term) || hasPhrase(description, term));
}

function canonicalIngredient(value?: string): string | undefined {
  const normalized = normalizeDishName(value || "");
  if (normalized === "shrimp") return "prawn";
  if (normalized === "lentil") return "dal";
  return normalized || undefined;
}
function mainIngredient(options: VideoSearchOptions): string | undefined {
  const configured = canonicalIngredient(options.recipeFeatures?.mainIngredient);
  if (configured) return configured;
  return extractDishTokens(options.dish).map(canonicalIngredient).find((token) => token && INGREDIENTS.has(token));
}
function candidateIngredients(title: string): Set<string> {
  return new Set(extractDishTokens(title).map(canonicalIngredient).filter((token): token is string => Boolean(token && INGREDIENTS.has(token))));
}
function hasIngredientConflict(options: VideoSearchOptions, title: string): boolean {
  const target = mainIngredient(options);
  const candidate = candidateIngredients(title);
  if (!target || candidate.size === 0) return false;
  return Array.from(candidate).some((ingredient) => ingredient !== target);
}
function hasVariantConflict(dish: string, title: string, options: VideoSearchOptions): boolean {
  const target = normalizeDishName(dish);
  if ((TARGET_CONFLICTS[target] || []).some((phrase) => hasPhrase(title, phrase))) return true;
  return hasIngredientConflict(options, title);
}

export function validateVideoCandidate(video: Pick<VideoMetadata, "title" | "description" | "durationSeconds">, options: VideoSearchOptions): ValidationResult {
  const dish = normalizeDishName(options.dish);
  const title = normalizeDishName(video.title);
  const cores = extractDishTokens(dish);
  if (!dish || !title) return { valid: false, reason: "missing dish/title", exact: false, alias: false, coreCoverage: 0, tutorial: false };
  if (isDisqualifiedContent(video.title, video.description || "")) return { valid: false, reason: "non-tutorial intent", exact: false, alias: false, coreCoverage: 0, tutorial: false };
  if (video.durationSeconds && video.durationSeconds < 45) return { valid: false, reason: "shorter than 45 seconds", exact: false, alias: false, coreCoverage: 0, tutorial: false };
  if (hasVariantConflict(dish, title, options)) return { valid: false, reason: "conflicting ingredient or dish variant", exact: false, alias: false, coreCoverage: 0, tutorial: false };

  const aliases = aliasSet(dish);
  const exact = hasPhrase(title, dish);
  const alias = !exact && aliases.slice(1).some((candidate) => hasPhrase(title, candidate));
  const words = titleTokens(title);
  const rawCoverage = cores.length ? cores.filter((token) => words.has(token)).length / cores.length : 0;
  const coverage = exact || alias ? 1 : rawCoverage;
  const tutorial = hasTutorialIntent(title);
  if (cores.length === 1) {
    if (!words.has(cores[0]) || !tutorial) return { valid: false, reason: "single-word dish needs title token and tutorial intent", exact, alias, coreCoverage: coverage, tutorial };
  } else if (!exact && !alias && (coverage < 0.6 || !tutorial)) {
    return { valid: false, reason: "insufficient title dish coverage or tutorial intent", exact, alias, coreCoverage: coverage, tutorial };
  }
  return { valid: true, exact, alias, coreCoverage: coverage, tutorial };
}

export function detectVideoLanguage(title: string, description = ""): string | undefined {
  const text = `${title} ${description}`;
  if (
    /\b(recipe|video|in)\s+(in\s+)?marathi\b/i.test(text) ||
    /\bmarathi\b/i.test(text) ||
    /\bmarathit\b/i.test(text) ||
    /मराठी/.test(text) ||
    /\u0933/.test(text) ||
    /गावरान/.test(text) ||
    /भाकर[ी]?/.test(text) ||
    /झुणका/.test(text) ||
    /कशी\s+(बनवावी|करावी)/.test(text) ||
    /कसे\s+(बनवायचे|करावे)/.test(text) ||
    /कसा\s+बनवायचा/.test(text) ||
    /कृती/.test(text)
  ) {
    return "Marathi";
  }
  if (
    /\b(recipe|video|in)\s+(in\s+)?hindi\b/i.test(text) ||
    /\bhindi\b/i.test(text) ||
    /हिंदी|हिन्दी/.test(text) ||
    /बनाने\s+की\s+विधि/.test(text) ||
    /कैसे\s+(बनाएं|बनाये|बनाते)/.test(text) ||
    /का\s+तरीका/.test(text) ||
    /[\u0900-\u097F]/.test(text)
  ) {
    return "Hindi";
  }
  if (/\b(recipe|video|in)\s+(in\s+)?english\b/i.test(text)) return "English";
  return undefined;
}
function durationScore(seconds: number | undefined, filter: string): number { if (!seconds) return 0; if (filter === "quick") return seconds >= 120 && seconds <= 600 ? 8 : seconds >= 60 && seconds <= 900 ? 4 : 0; if (filter === "detailed") return seconds >= 600 && seconds <= 2100 ? 8 : seconds >= 480 && seconds <= 2700 ? 4 : 0; return seconds >= 120 && seconds <= 1200 ? 8 : seconds >= 60 && seconds <= 2400 ? 4 : 0; }
function languageScore(video: Pick<VideoMetadata, "title" | "description" | "language">, languages: string[] = []): number { const detected = video.language || detectVideoLanguage(video.title, video.description || ""); return detected && languages.some((language) => normalizeDishName(language) === normalizeDishName(detected)) ? 7 : 0; }
function channelScore(channelTitle: string): number { return TRUSTED_CHANNELS.some((channel) => hasPhrase(channelTitle, channel)) ? 5 : 0; }
function engagementScore(views?: number): number { return views && views > 0 ? Math.min(5, Math.log10(views + 1) / 2) : 0; }
function cuisineScore(title: string, cuisine?: string): number { const target = normalizeDishName(cuisine || ""); if (!target) return 0; if (hasPhrase(title, target)) return 15; return (RELATED_CUISINES[target] || []).some((related) => hasPhrase(title, related)) ? 5 : 0; }
function methodScore(title: string, options: VideoSearchOptions): number { const targetText = `${options.dish} ${options.recipeFeatures?.cookingMethod || ""} ${options.recipeFeatures?.category || ""}`; const matched = METHODS.find((method) => hasPhrase(targetText, method) && hasPhrase(title, method)); return matched ? 10 : 0; }
function categoryScore(title: string, options: VideoSearchOptions): number { const category = normalizeDishName(options.recipeFeatures?.category || ""); return category && hasPhrase(title, category) ? 10 : 0; }

/** Strict scoring for exact and strong dish identity. */
export function calculateRelevanceScore(video: Pick<VideoMetadata, "title" | "description" | "channelTitle" | "durationSeconds" | "language" | "viewCount">, options: VideoSearchOptions): number {
  const validation = validateVideoCandidate(video, options);
  if (!validation.valid) return 0;
  let score = validation.exact || validation.alias ? 55 : 35;
  score += Math.round(validation.coreCoverage * 25);
  if (!validation.exact && !validation.alias && validation.coreCoverage >= 0.6) score += 5;
  if (validation.tutorial) score += 10;
  score += cuisineScore(video.title, options.recipeFeatures?.cuisine);
  score += methodScore(video.title, options);
  score += durationScore(video.durationSeconds, options.filter || "recommended") + languageScore(video, options.languages) + channelScore(video.channelTitle) + engagementScore(video.viewCount);
  return Math.min(100, Math.round(score));
}

/** Similar-tier scoring is deliberately separate from exact relevance. It can never pass without a same-ingredient tutorial and method/category/cuisine evidence. */
function calculateFallbackScore(video: Pick<VideoMetadata, "title" | "description" | "durationSeconds" | "language" | "channelTitle" | "viewCount">, options: VideoSearchOptions): number {
  const targetIngredient = mainIngredient(options);
  const title = normalizeDishName(video.title);
  if (!targetIngredient || !title || isDisqualifiedContent(video.title, video.description || "") || (video.durationSeconds && video.durationSeconds < 45)) return 0;
  if (!titleTokens(title).has(targetIngredient) || hasIngredientConflict(options, title) || !hasTutorialIntent(title)) return 0;
  const cuisine = cuisineScore(title, options.recipeFeatures?.cuisine);
  const method = methodScore(title, options);
  const category = categoryScore(title, options);
  if (!cuisine && !method && !category) return 0;
  const dishKeyword = (options.recipeFeatures?.importantKeywords || []).some((keyword) => hasPhrase(title, keyword)) ? 10 : 0;
  return Math.min(74, Math.round(25 + 10 + cuisine + method + category + dishKeyword + durationScore(video.durationSeconds, options.filter || "recommended") + languageScore(video, options.languages) + channelScore(video.channelTitle)));
}

function matchType(score: number): VideoMatchType { return score >= 90 ? "recommended" : score >= 75 ? "strong" : score >= 55 ? "related" : "similar"; }
function confidence(score: number): MatchConfidence { return score >= 90 ? "EXACT" : score >= 75 ? "HIGH" : score >= 55 ? "MEDIUM" : "LOW"; }
function duplicateKey(video: VideoMetadata): string { return `${normalizeDishName(video.channelTitle)}|${normalizeDishName(video.title).replace(/\b(full|hd|official|video)\b/g, "").trim()}`; }

export function rankAndFilterVideos(videos: VideoMetadata[], options: VideoSearchOptions, minimumThreshold = 45): VideoMetadata[] {
  const uniqueIds = new Set<string>(); const uniqueTitles = new Set<string>();
  const ranked = videos.map((video) => ({ ...video, language: video.language || detectVideoLanguage(video.title, video.description || "") }))
    .filter((video) => !uniqueIds.has(video.id) && uniqueIds.add(video.id))
    .map((video) => { const strict = calculateRelevanceScore(video, options); const relevanceScore = strict || calculateFallbackScore(video, options); return { ...video, relevanceScore, matchType: matchType(relevanceScore) }; })
    .filter((video) => video.relevanceScore >= minimumThreshold)
    .sort((a, b) => b.relevanceScore - a.relevanceScore || (b.viewCount || 0) - (a.viewCount || 0) || a.title.localeCompare(b.title))
    .filter((video) => !uniqueTitles.has(duplicateKey(video)) && uniqueTitles.add(duplicateKey(video)));
  if (process.env.NODE_ENV !== "production") ranked.forEach((video) => console.debug(`[youtube-rank:${RANKING_VERSION}] ${options.dish}: ${video.title} => ${video.relevanceScore} (${confidence(video.relevanceScore)}, ${video.matchType})`));
  return ranked.slice(0, 3);
}

export function buildProgressiveQueries(options: VideoSearchOptions): string[] {
  const dish = options.dish.trim(); const features = options.recipeFeatures || {}; const ingredient = mainIngredient(options); const aliases = getDishAliases(dish).slice(1);
  const queries = [`${dish} recipe`, ...aliases.map((alias) => `${alias} recipe`)];
  if (ingredient && features.cuisine && features.cookingMethod) queries.push(`${features.cuisine} ${ingredient} ${features.cookingMethod} recipe`);
  if (ingredient && features.cookingMethod) queries.push(`${ingredient} ${features.cookingMethod} recipe`);
  if (ingredient && features.cuisine) queries.push(`${ingredient} ${features.cuisine} recipe`);
  if (ingredient && features.category) queries.push(`${ingredient} ${features.category} recipe`);
  return Array.from(new Set(queries.map((query) => query.replace(/\s+/g, " ").trim())));
}
