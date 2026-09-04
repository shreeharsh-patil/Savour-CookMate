import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import * as crypto from "crypto";
import { ENV } from "../../config/env.config";
import { YouTubeCache, YouTubeCacheDocument, YouTubeVideoItem } from "../../database/schemas/youtube-cache.schema";

const CURATED_CHANNELS = [
  "Chef Ranveer Brar",
  "Sanjeev Kapoor Khazana",
  "Kunal Kapur",
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
];

const DISQUALIFIED_TERMS = [
  "reaction",
  "mukbang",
  "eating show",
  "asmr eating",
  "challenge",
  "prank",
  "restaurant review",
  "street food review",
  "tiktok",
  "shorts",
  "unboxing",
  "compilation",
  "worst",
];

@Injectable()
export class YouTubeService {
  constructor(
    @InjectModel(YouTubeCache.name) private cacheModel: Model<YouTubeCacheDocument>
  ) {}

  private hashKey(dish: string, lang = "en", filter = "all"): string {
    return crypto
      .createHash("sha256")
      .update(`${dish.trim().toLowerCase()}|${lang}|${filter}`)
      .digest("hex");
  }

  async getVideosForRecipe(recipeName: string, language = "English", filter = "all"): Promise<YouTubeVideoItem[]> {
    const cacheKey = this.hashKey(recipeName, language, filter);

    // 1. Check MongoDB Atlas Cache
    const cached = await this.cacheModel.findOne({ cacheKey }).lean();
    if (cached && cached.expiresAt > new Date() && cached.videos?.length > 0) {
      return cached.videos;
    }

    // 2. Fetch from YouTube Data API v3 if key exists
    let results: YouTubeVideoItem[] = [];
    if (ENV.YOUTUBE_API_KEY) {
      try {
        results = await this.fetchFromYouTubeApi(recipeName, language);
      } catch (err) {
        console.warn("YouTube API call warning, falling back to curated video bank:", err);
      }
    }

    // 3. Fallback to curated catalog if API key not provided or failed
    if (results.length === 0) {
      results = this.getCuratedFallbackVideos(recipeName, language, filter);
    }

    // 4. Cache in MongoDB Atlas with 7-day TTL
    if (results.length > 0) {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await this.cacheModel.findOneAndUpdate(
        { cacheKey },
        {
          cacheKey,
          recipeId: recipeName,
          language,
          videos: results,
          fetchedAt: new Date(),
          expiresAt,
        },
        { upsert: true }
      );
    }

    return results;
  }

  private async fetchFromYouTubeApi(dish: string, language: string): Promise<YouTubeVideoItem[]> {
    const query = `${dish} authentic recipe tutorial`;
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
      query
    )}&type=video&videoCaption=closedCaption&videoEmbeddable=true&maxResults=10&key=${ENV.YOUTUBE_API_KEY}`;

    const res = await fetch(searchUrl, {
      headers: { "User-Agent": "SavourCookMate/2.0" },
    });

    if (!res.ok) {
      throw new Error(`YouTube API returned ${res.status}`);
    }

    const data = await res.json();
    if (!data.items || !Array.isArray(data.items)) return [];

    const videoIds = data.items.map((it: any) => it.id.videoId).filter(Boolean);
    if (videoIds.length === 0) return [];

    // Get video details (duration and views)
    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics&id=${videoIds.join(
      ","
    )}&key=${ENV.YOUTUBE_API_KEY}`;

    const detailsRes = await fetch(detailsUrl);
    const detailsData = detailsRes.ok ? await detailsRes.json() : { items: [] };

    const detailsMap: Record<string, { duration: string; seconds: number; views: number }> = {};
    for (const d of detailsData.items || []) {
      const sec = this.parseIsoDuration(d.contentDetails?.duration || "PT0S");
      detailsMap[d.id] = {
        duration: this.formatSeconds(sec),
        seconds: sec,
        views: parseInt(d.statistics?.viewCount || "0", 10),
      };
    }

    const candidates: YouTubeVideoItem[] = [];

    for (const item of data.items) {
      const id = item.id.videoId;
      const title = item.snippet.title || "";
      const description = item.snippet.description || "";
      const channelTitle = item.snippet.channelTitle || "";
      const textToFilter = `${title} ${description}`.toLowerCase();

      // Reject Mukbang, reactions, unrelated shorts
      const isDisqualified = DISQUALIFIED_TERMS.some((term) => textToFilter.includes(term));
      if (isDisqualified) continue;

      const details = detailsMap[id] || { duration: "10:00", seconds: 600, views: 50000 };

      // Reject ultra-short (<60s) or extremely long (>45m)
      if (details.seconds < 60 || details.seconds > 2700) continue;

      // Ranking score calculation
      let score = 50;
      const dishTokens = dish.toLowerCase().split(" ");
      const matchesDish = dishTokens.filter((t) => textToFilter.includes(t)).length;
      score += matchesDish * 15;

      if (CURATED_CHANNELS.some((c) => channelTitle.toLowerCase().includes(c.toLowerCase()))) {
        score += 30; // High reputation culinary channel
      }

      if (details.seconds >= 240 && details.seconds <= 900) {
        score += 15; // Ideal tutorial length (4 - 15 mins)
      }

      candidates.push({
        id,
        title,
        channelTitle,
        description,
        thumbnailUrl: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
        videoUrl: `https://www.youtube.com/watch?v=${id}`,
        embedUrl: `https://www.youtube.com/embed/${id}?rel=0`,
        duration: details.duration,
        durationSeconds: details.seconds,
        views: details.views > 1000000 ? `${(details.views / 1000000).toFixed(1)}M views` : `${Math.round(details.views / 1000)}K views`,
        viewCount: details.views,
        language,
        score,
      });
    }

    candidates.sort((a, b) => b.score - a.score);
    return candidates.slice(0, 6);
  }

  private parseIsoDuration(durationStr: string): number {
    const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 300;
    const hours = parseInt(match[1] || "0", 10);
    const minutes = parseInt(match[2] || "0", 10);
    const seconds = parseInt(match[3] || "0", 10);
    return hours * 3600 + minutes * 60 + seconds;
  }

  private formatSeconds(totalSeconds: number): string {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  }

  private getCuratedFallbackVideos(dish: string, language: string, filter: string): YouTubeVideoItem[] {
    const curatedBank = [
      {
        keywords: ["butter chicken", "murgh makhani", "chicken"],
        id: "a03U45jFxOI",
        title: "Restaurant Style Butter Chicken Recipe",
        channelTitle: "Ranveer Brar",
        description: "Master the authentic velvety tomato gravy and smoky marinated tandoori chicken.",
        duration: "14:20",
        durationSeconds: 860,
        views: "12M views",
        viewCount: 12000000,
        language: "Hindi",
        score: 95,
      },
      {
        keywords: ["paneer", "butter masala", "tikka"],
        id: "V_J1bW8n9b4",
        title: "Dhaba Style Paneer Butter Masala",
        channelTitle: "Sanjeev Kapoor Khazana",
        description: "Silky tomato-cashew gravy with melt-in-mouth paneer cubes and kasuri methi.",
        duration: "11:45",
        durationSeconds: 705,
        views: "8.4M views",
        viewCount: 8400000,
        language: "Hindi",
        score: 90,
      },
      {
        keywords: ["goan", "fish", "curry", "pomfret", "salmon"],
        id: "W_rQY2hK58A",
        title: "Authentic Goan Fish Curry Recipe",
        channelTitle: "Hebbars Kitchen",
        description: "Fresh coastal fish simmered with grated coconut, dried kokum and spices.",
        duration: "7:15",
        durationSeconds: 435,
        views: "2.1M views",
        viewCount: 2100000,
        language: "English",
        score: 88,
      },
      {
        keywords: ["pasta", "spaghetti", "aglio e olio", "garlic"],
        id: "bJUiWdMPRUp",
        title: "Spaghetti Aglio e Olio - Traditional Neapolitan Recipe",
        channelTitle: "Vincenzo's Plate",
        description: "Golden sliced garlic, red pepper flakes, olive oil emulsified with pasta water.",
        duration: "9:30",
        durationSeconds: 570,
        views: "4.5M views",
        viewCount: 4500000,
        language: "English",
        score: 92,
      },
      {
        keywords: ["shakshuka", "egg", "eggs", "tomato"],
        id: "4kgK7tq-31Q",
        title: "How to Make Perfect Shakshuka",
        channelTitle: "Preppy Kitchen",
        description: "Poached eggs in a spiced, chunky sweet bell pepper and tomato sauce.",
        duration: "8:25",
        durationSeconds: 505,
        views: "3.2M views",
        viewCount: 3200000,
        language: "English",
        score: 89,
      },
      {
        keywords: ["dal", "makhani", "lentil"],
        id: "m7L2yP4_kQw",
        title: "Authentic Restaurant Dal Makhani Recipe",
        channelTitle: "Ranveer Brar",
        description: "Slow simmered black urad dal, sweet butter, and rich smoked aromatics.",
        duration: "16:05",
        durationSeconds: 965,
        views: "5.1M views",
        viewCount: 5100000,
        language: "Hindi",
        score: 91,
      },
      {
        keywords: ["thai", "green curry", "curry"],
        id: "wJ86v9V1p8s",
        title: "Authentic Thai Green Curry",
        channelTitle: "Hot Thai Kitchen",
        description: "Cracked coconut cream, vibrant herbs, and authentic bamboo shoots.",
        duration: "12:10",
        durationSeconds: 730,
        views: "3.8M views",
        viewCount: 3800000,
        language: "English",
        score: 93,
      },
    ];

    const dLower = dish.toLowerCase();
    const scored = curatedBank.map((v) => {
      let match = 0;
      v.keywords.forEach((k) => {
        if (dLower.includes(k)) match += 30;
      });
      return {
        ...v,
        thumbnailUrl: `https://img.youtube.com/vi/${v.id}/hqdefault.jpg`,
        videoUrl: `https://www.youtube.com/watch?v=${v.id}`,
        embedUrl: `https://www.youtube.com/embed/${v.id}?rel=0`,
        score: v.score + match,
      };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 4);
  }
}
