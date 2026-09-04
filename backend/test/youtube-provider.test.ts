import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  extractYouTubeVideoId,
  buildWatchUrl,
  buildEmbedUrl,
  buildThumbnailUrl,
  parseIsoDuration,
  formatSeconds,
  formatViews,
  normalizeLanguageCode,
} from "../src/modules/youtube/youtube.utils";
import {
  calculateRelevanceScore,
  rankAndFilterVideos,
  isDisqualifiedContent,
} from "../src/modules/youtube/providers/ranking.utils";
import { RecipeSourceVideoProvider } from "../src/modules/youtube/providers/recipe-source.provider";
import { VideoMetadata } from "../src/modules/youtube/providers/video-provider.interface";

describe("YouTube Utils - Safe Video ID Extraction & URL Construction", () => {
  test("extracts 11-char ID from standard watch URL", () => {
    const id = extractYouTubeVideoId("https://www.youtube.com/watch?v=4aZr5hZXP_s");
    assert.equal(id, "4aZr5hZXP_s");
  });

  test("extracts ID from watch URL with extra query params", () => {
    const id = extractYouTubeVideoId(
      "https://www.youtube.com/watch?v=4aZr5hZXP_s&feature=emb_title&t=45s"
    );
    assert.equal(id, "4aZr5hZXP_s");
  });

  test("extracts ID from youtu.be short URL", () => {
    const id = extractYouTubeVideoId("https://youtu.be/4aZr5hZXP_s?t=10");
    assert.equal(id, "4aZr5hZXP_s");
  });

  test("extracts ID from embed URL", () => {
    const id = extractYouTubeVideoId("https://www.youtube.com/embed/4aZr5hZXP_s");
    assert.equal(id, "4aZr5hZXP_s");
  });

  test("extracts ID from shorts URL", () => {
    const id = extractYouTubeVideoId("https://youtube.com/shorts/4aZr5hZXP_s");
    assert.equal(id, "4aZr5hZXP_s");
  });

  test("handles direct 11-char ID safely", () => {
    const id = extractYouTubeVideoId("4aZr5hZXP_s");
    assert.equal(id, "4aZr5hZXP_s");
  });

  test("returns null for invalid or malicious URLs without throwing", () => {
    assert.equal(extractYouTubeVideoId("https://example.com/watch?v=12345"), null);
    assert.equal(extractYouTubeVideoId("https://youtube.com/watch"), null);
    assert.equal(extractYouTubeVideoId(""), null);
    assert.equal(extractYouTubeVideoId(undefined), null);
    assert.equal(extractYouTubeVideoId(null), null);
  });

  test("constructs valid canonical watch, embed, and thumbnail URLs", () => {
    const id = "4aZr5hZXP_s";
    assert.equal(buildWatchUrl(id), "https://www.youtube.com/watch?v=4aZr5hZXP_s");
    assert.equal(buildEmbedUrl(id), "https://www.youtube-nocookie.com/embed/4aZr5hZXP_s?rel=0");
    assert.equal(buildThumbnailUrl(id), "https://img.youtube.com/vi/4aZr5hZXP_s/hqdefault.jpg");
  });

  test("parses ISO 8601 duration and formats seconds without faking", () => {
    assert.equal(parseIsoDuration("PT12M34S"), 754);
    assert.equal(parseIsoDuration("PT1H5M"), 3900);
    assert.equal(parseIsoDuration("PT45S"), 45);
    assert.equal(parseIsoDuration(null), 0);

    assert.equal(formatSeconds(754), "12:34");
    assert.equal(formatSeconds(3900), "1:05:00");
    assert.equal(formatSeconds(45), "0:45");
    assert.equal(formatSeconds(undefined), undefined); // NEVER fake "10:00"
    assert.equal(formatSeconds(0), undefined);
  });

  test("formats real views and returns undefined when unavailable", () => {
    assert.equal(formatViews(1500000), "1.5M views");
    assert.equal(formatViews(45200), "45K views");
    assert.equal(formatViews(500), "500 views");
    assert.equal(formatViews(undefined), undefined); // NEVER fake 50000 views
    assert.equal(formatViews(0), undefined);
  });

  test("normalizes language codes accurately", () => {
    assert.equal(normalizeLanguageCode("English"), "en");
    assert.equal(normalizeLanguageCode("Hindi"), "hi");
    assert.equal(normalizeLanguageCode("Marathi"), "mr");
    assert.equal(normalizeLanguageCode("Tamil"), "ta");
    assert.equal(normalizeLanguageCode("Telugu"), "te");
    assert.equal(normalizeLanguageCode("Konkani"), "gom");
    assert.equal(normalizeLanguageCode(undefined), "en");
  });
});

describe("YouTube Ranking & Deterministic Relevance", () => {
  test("disqualifies mukbang, reactions, eating challenges, and unboxings", () => {
    assert.ok(isDisqualifiedContent("Epic Butter Chicken Mukbang Eating Show"));
    assert.ok(isDisqualifiedContent("American Reacts to Indian Street Food"));
    assert.ok(isDisqualifiedContent("Eating 10,000 Calories of Curry Challenge"));
    assert.ok(isDisqualifiedContent("Worst Rated Indian Restaurant Review"));
    assert.ok(!isDisqualifiedContent("How to Make Restaurant Style Butter Chicken at Home"));
  });

  test("calculates high relevance score for authentic recipe tutorials with matching dish tokens", () => {
    const score = calculateRelevanceScore(
      {
        title: "Authentic Restaurant Style Butter Chicken Recipe - Murgh Makhani",
        description: "Learn how to make rich silky butter chicken step by step at home.",
        channelTitle: "Ranveer Brar",
        durationSeconds: 840, // 14 mins
      },
      { dish: "Butter Chicken", filter: "recommended" }
    );

    assert.ok(score >= 80, `Expected score >= 80, got ${score}`);
  });

  test("scores unrelated videos very low (< 60) when dish tokens are absent", () => {
    const score = calculateRelevanceScore(
      {
        title: "Chocolate Lava Cake Recipe with Molten Center",
        description: "The easiest dessert recipe you will ever make.",
        channelTitle: "Preppy Kitchen",
        durationSeconds: 600,
      },
      { dish: "Butter Chicken", filter: "recommended" }
    );

    assert.ok(score < 60, `Expected score < 60 for unrelated dish, got ${score}`);
  });

  test("quick filter prioritizes 1-10 minute tutorials and penalizes long videos", () => {
    const quickScore = calculateRelevanceScore(
      {
        title: "Quick 10 Minute Paneer Butter Masala",
        description: "Super fast weeknight paneer curry recipe.",
        durationSeconds: 360, // 6 minutes
      },
      { dish: "Paneer Butter Masala", filter: "quick" }
    );

    const longScore = calculateRelevanceScore(
      {
        title: "Comprehensive 45 Minute Masterclass Paneer Butter Masala",
        description: "Every single detail of making paneer from scratch.",
        durationSeconds: 2700, // 45 minutes
      },
      { dish: "Paneer Butter Masala", filter: "quick" }
    );

    assert.ok(
      quickScore > longScore,
      `Quick tutorial score (${quickScore}) should outrank long video (${longScore}) without overriding dish relevance`
    );
  });

  test("detailed filter prioritizes 10-40 minute in-depth masterclasses", () => {
    const detailedScore = calculateRelevanceScore(
      {
        title: "Authentic Traditional Goan Fish Curry Masterclass",
        description: "Detailed step-by-step technique from coconut grinding to slow simmer.",
        durationSeconds: 1200, // 20 minutes
      },
      { dish: "Goan Fish Curry", filter: "detailed" }
    );

    const shortScore = calculateRelevanceScore(
      {
        title: "1 Minute Goan Fish Curry",
        description: "Fast version",
        durationSeconds: 90, // 1.5 mins
      },
      { dish: "Goan Fish Curry", filter: "detailed" }
    );

    assert.ok(detailedScore > shortScore);
  });

  test("rankAndFilterVideos filters out candidates below minimum threshold (60)", () => {
    const candidates: VideoMetadata[] = [
      {
        id: "vid1",
        title: "Authentic Dal Makhani Recipe - Traditional Restaurant Style",
        channelTitle: "Sanjeev Kapoor Khazana",
        thumbnailUrl: "https://img.youtube.com/vi/vid1/hqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=vid1",
        embedUrl: "https://www.youtube.com/embed/vid1",
        durationSeconds: 650,
        relevanceScore: 0,
        provider: "youtube_data_api",
      },
      {
        id: "vid2",
        title: "I Tried Eating Only Desserts for 24 Hours",
        channelTitle: "Foodie Vlogger",
        thumbnailUrl: "https://img.youtube.com/vi/vid2/hqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=vid2",
        embedUrl: "https://www.youtube.com/embed/vid2",
        durationSeconds: 900,
        relevanceScore: 0,
        provider: "youtube_data_api",
      },
    ];

    const filtered = rankAndFilterVideos(candidates, { dish: "Dal Makhani" }, 60);

    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].id, "vid1");
    assert.ok(filtered[0].relevanceScore >= 60);
  });
});

describe("RecipeSourceVideoProvider - Exact Recipe Linking", () => {
  const provider = new RecipeSourceVideoProvider();

  test("resolves exact recipe-linked video directly from youtubeVideoId or youtubeUrl", async () => {
    const video = await provider.resolveFromRecipe({
      name: "Chicken Handi",
      youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      source: "TheMealDB",
    });

    assert.ok(video !== null);
    assert.equal(video.id, "dQw4w9WgXcQ");
    assert.equal(video.title, "Open recipe tutorial");
    assert.equal(video.videoUrl, "https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    assert.equal(video.relevanceScore, 100);
    assert.equal(video.provider, "recipe_source");

    // Zero fake data
    assert.equal(video.duration, undefined);
    assert.equal(video.views, undefined);
  });

  test("returns null when recipe has no YouTube link without throwing errors", async () => {
    const video = await provider.resolveFromRecipe({
      name: "Custom Salad",
      sourceUrl: "https://example.com/salad",
    });

    assert.equal(video, null);
  });
});
