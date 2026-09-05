import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { buildProgressiveQueries, calculateRelevanceScore, detectVideoLanguage, normalizeDishName, rankAndFilterVideos, validateVideoCandidate } from "../src/modules/youtube/providers/ranking.utils";
import { VideoMetadata, VideoSearchOptions } from "../src/modules/youtube/providers/video-provider.interface";

const candidate = (title: string, overrides: Partial<VideoMetadata> = {}): VideoMetadata => ({
  id: overrides.id || title.slice(0, 11).padEnd(11, "x"), title, channelTitle: overrides.channelTitle || "Home Cook",
  description: overrides.description || "", thumbnailUrl: "https://example.com/thumb.jpg", videoUrl: "https://youtube.com/watch?v=abcdefghijk",
  embedUrl: "https://youtube.com/embed/abcdefghijk", durationSeconds: overrides.durationSeconds ?? 600,
  viewCount: overrides.viewCount, language: overrides.language, relevanceScore: 0, provider: "youtube_data_api", ...overrides,
});
const options = (dish: string, extra: Partial<VideoSearchOptions> = {}): VideoSearchOptions => ({ dish, filter: "recommended", languages: ["English"], ...extra });

describe("YouTube ranking v2", () => {
  test("normalizes punctuation, case, accents and whitespace", () => {
    assert.equal(normalizeDishName("  Paneer-Butter Mášala! "), "paneer butter masala");
  });

  test("accepts exact Butter Chicken and its culinary alias", () => {
    assert.ok(calculateRelevanceScore(candidate("Butter Chicken Recipe"), options("Butter Chicken")) >= 70);
    assert.ok(calculateRelevanceScore(candidate("Murgh Makhani Recipe"), options("Butter Chicken")) >= 70);
  });

  test("rejects broad, conflicting, and non-tutorial Butter Chicken candidates", () => {
    for (const title of ["Chicken Curry Recipe", "Butter Garlic Chicken Recipe", "Chicken Eating Challenge"]) {
      assert.equal(validateVideoCandidate(candidate(title), options("Butter Chicken")).valid, false, title);
    }
    assert.equal(calculateRelevanceScore(candidate("Easy Chicken Recipe", { channelTitle: "Chef Ranveer Brar", viewCount: 50_000_000 }), options("Butter Chicken")), 0);
  });

  test("uses paneer aliases but rejects neighboring paneer dishes", () => {
    assert.ok(calculateRelevanceScore(candidate("Paneer Makhani Recipe"), options("Paneer Butter Masala")) >= 70);
    for (const title of ["Paneer Tikka Recipe", "Paneer Curry Recipe", "Butter Chicken Recipe"]) {
      assert.equal(validateVideoCandidate(candidate(title), options("Paneer Butter Masala")).valid, false, title);
    }
  });

  test("rejects principal protein conflicts for biryani", () => {
    assert.ok(calculateRelevanceScore(candidate("Hyderabadi Chicken Biryani Recipe"), options("Chicken Biryani")) >= 70);
    for (const title of ["Veg Biryani Recipe", "Mutton Biryani Recipe", "Chicken Curry Recipe"]) {
      assert.equal(validateVideoCandidate(candidate(title), options("Chicken Biryani")).valid, false, title);
    }
  });

  test("requires tutorial intent for single-word dishes and rejects short/non-tutorial uploads", () => {
    assert.ok(calculateRelevanceScore(candidate("Dosa Recipe", { durationSeconds: 480 }), options("Dosa")) >= 70);
    assert.equal(validateVideoCandidate(candidate("Dosa Eating Challenge"), options("Dosa")).valid, false);
    assert.equal(validateVideoCandidate(candidate("Dosa Recipe", { durationSeconds: 30 }), options("Dosa")).valid, false);
  });

  test("keeps a closely related culinary tutorial when an exact regional title is unavailable", () => {
    const related = candidate("Traditional Chicken Cafreal Recipe", { durationSeconds: 540 });
    const ranked = rankAndFilterVideos([related], options("Goan Chicken Cafreal"), 60);
    assert.equal(ranked.length, 1);
    assert.equal(ranked[0].matchType, "strong");
    assert.ok(ranked[0].relevanceScore >= 75 && ranked[0].relevanceScore < 90);
  });

  test("deduplicates IDs and near-identical uploads while preserving the strongest exact result", () => {
    const ranked = rankAndFilterVideos([
      candidate("Butter Chicken Recipe", { id: "firstvideo01", viewCount: 100 }),
      candidate("Butter Chicken Recipe Full Video", { id: "secondvideo", viewCount: 10 }),
      candidate("Chicken Curry Recipe", { id: "thirdvideo0" }),
    ], options("Butter Chicken"));
    assert.equal(ranked.length, 1);
    assert.equal(ranked[0].id, "firstvideo01");
  });

  test("admits a related paneer curry only when same-ingredient method evidence exists", () => {
    const fallbackOptions = options("Paneer Butter Masala", {
      recipeFeatures: { mainIngredient: "paneer", cuisine: "North Indian", category: "curry", cookingMethod: "curry", importantKeywords: ["butter", "masala"] },
    });
    const ranked = rankAndFilterVideos([candidate("Restaurant Style Paneer Curry Recipe")], fallbackOptions, 45);
    assert.equal(ranked.length, 1);
    assert.equal(ranked[0].matchType, "related");
    assert.ok(ranked[0].relevanceScore >= 55);
    assert.equal(rankAndFilterVideos([candidate("Butter Chicken Curry Recipe")], fallbackOptions, 45).length, 0);
  });

  test("admits a same-ingredient, same-cuisine similar tutorial but rejects conflicting proteins", () => {
    const fallbackOptions = options("Goan Prawn Curry", {
      recipeFeatures: { mainIngredient: "prawn", cuisine: "Goan", category: "curry", cookingMethod: "curry" },
    });
    const ranked = rankAndFilterVideos([candidate("Indian Coconut Prawn Curry Recipe")], fallbackOptions, 45);
    assert.equal(ranked.length, 1);
    assert.ok(["related", "similar"].includes(ranked[0].matchType!));
    assert.equal(rankAndFilterVideos([candidate("Goan Fish Curry Recipe")], fallbackOptions, 45).length, 0);
  });

  test("builds progressive alias, method, cuisine, and category queries without duplicates", () => {
    const queries = buildProgressiveQueries(options("Paneer Butter Masala", {
      recipeFeatures: { mainIngredient: "paneer", cuisine: "North Indian", category: "curry", cookingMethod: "curry" },
    }));
    assert.ok(queries.includes("Paneer Butter Masala recipe"));
    assert.ok(queries.includes("paneer makhani recipe"));
    assert.ok(queries.includes("North Indian paneer curry recipe"));
    assert.ok(queries.includes("paneer curry recipe"));
    assert.ok(queries.includes("paneer North Indian recipe"));
    assert.equal(new Set(queries).size, queries.length);
  });

  test("accurately differentiates Marathi from Hindi video titles and descriptions", () => {
    // Marathi specific scripts/words
    assert.equal(detectVideoLanguage("झणझणीत मिसळ कशी बनवावी | Misal Pav Recipe in Marathi"), "Marathi");
    assert.equal(detectVideoLanguage("झणझणीत कोल्हापुरी मिसळ रेसिपी"), "Marathi"); // contains Marathi 'ळ' (\u0933)
    assert.equal(detectVideoLanguage("गावरान पिठलं भाकरी रेसिपी"), "Marathi"); // contains गावरान and भाकरी
    assert.equal(detectVideoLanguage("चकली कशी करावी - दिवाळी फराळ"), "Marathi");
    assert.equal(detectVideoLanguage("Maharashtrian Poha Recipe in marathi"), "Marathi");

    // Hindi specific words
    assert.equal(detectVideoLanguage("पनीर बटर मसाला बनाने की विधि | Paneer Recipe in Hindi"), "Hindi");
    assert.equal(detectVideoLanguage("स्वादिष्ट दाल तड़का कैसे बनाएं"), "Hindi");
    assert.equal(detectVideoLanguage("हलवाई जैसा समोसा बनाने का तरीका"), "Hindi");

    // English
    assert.equal(detectVideoLanguage("Crispy Masala Dosa Recipe in English"), "English");
  });
});
