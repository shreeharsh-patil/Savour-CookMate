import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { GoogleGenAI } from "@google/genai";
import * as crypto from "crypto";
import { ENV } from "../../config/env.config";
import { AICache, AICacheDocument } from "../../database/schemas/ai-cache.schema";

export interface ParsedSearchIntent {
  queryKeywords: string[];
  ingredients: string[];
  cuisine?: string;
  mealType?: string;
  diet?: string;
  maxCookingTime?: number;
  spiceLevel?: string;
  difficulty?: string;
  isConversational: boolean;
}

@Injectable()
export class GeminiService {
  private aiClient: GoogleGenAI | null = null;

  constructor(
    @InjectModel(AICache.name) private aiCacheModel: Model<AICacheDocument>
  ) {
    if (ENV.GEMINI_API_KEY) {
      this.aiClient = new GoogleGenAI({
        apiKey: ENV.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "SavourCookMate/2.0",
          },
        },
      });
    }
  }

  private hashKey(prefix: string, data: any): string {
    return crypto.createHash("sha256").update(`${prefix}:${JSON.stringify(data)}`).digest("hex");
  }

  async parseSearchIntent(rawQuery: string): Promise<ParsedSearchIntent> {
    const trimmed = rawQuery.trim();
    if (!trimmed) {
      return {
        queryKeywords: [],
        ingredients: [],
        isConversational: false,
      };
    }

    // Check if query is conversational or simple keyword
    const words = trimmed.split(/\s+/);
    const isConversational =
      words.length > 3 ||
      /\b(want|have|under|less than|minutes|mins|something|make|quick|easy|spicy|dinner|lunch|breakfast)\b/i.test(trimmed);

    if (!isConversational || !this.aiClient) {
      // Deterministic parsing without AI overhead
      return this.fallbackParse(trimmed);
    }

    const cacheKey = this.hashKey("intent", trimmed.toLowerCase());
    const cached = await this.aiCacheModel.findOne({ cacheKey });
    if (cached && cached.expiresAt > new Date()) {
      return cached.responseData as ParsedSearchIntent;
    }

    try {
      const prompt = `Analyze this culinary search query: "${trimmed}".
Extract the user's intent into structured JSON.
Return JSON ONLY:
{
  "queryKeywords": ["keywords"],
  "ingredients": ["ingredient names"],
  "cuisine": "optional cuisine or null",
  "mealType": "Breakfast | Lunch | Dinner | Snack | Dessert | null",
  "diet": "Vegetarian | Non-Vegetarian | Vegan | Eggetarian | null",
  "maxCookingTime": number_in_minutes_or_null,
  "spiceLevel": "mild | medium | spicy | fiery | null",
  "difficulty": "Easy | Medium | Hard | null"
}`;

      const response = await this.aiClient.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const text = response.text || "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const result: ParsedSearchIntent = {
          queryKeywords: parsed.queryKeywords || [trimmed],
          ingredients: parsed.ingredients || [],
          cuisine: parsed.cuisine || undefined,
          mealType: parsed.mealType || undefined,
          diet: parsed.diet || undefined,
          maxCookingTime: parsed.maxCookingTime || undefined,
          spiceLevel: parsed.spiceLevel || undefined,
          difficulty: parsed.difficulty || undefined,
          isConversational: true,
        };

        await this.aiCacheModel.findOneAndUpdate(
          { cacheKey },
          {
            cacheKey,
            type: "intent",
            responseData: result,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
          { upsert: true }
        );

        return result;
      }
    } catch (err) {
      console.warn("Gemini intent parse warning, falling back to deterministic extraction:", err);
    }

    return this.fallbackParse(trimmed);
  }

  private fallbackParse(query: string): ParsedSearchIntent {
    const qLower = query.toLowerCase();
    const timeMatch = qLower.match(/(\d+)\s*(mins?|minutes?)/);
    const maxTime = timeMatch ? parseInt(timeMatch[1], 10) : undefined;

    let diet: string | undefined;
    if (qLower.includes("veg") && !qLower.includes("non-veg")) diet = "Vegetarian";
    if (qLower.includes("non-veg")) diet = "Non-Vegetarian";
    if (qLower.includes("vegan")) diet = "Vegan";

    let mealType: string | undefined;
    if (qLower.includes("breakfast")) mealType = "Breakfast";
    if (qLower.includes("lunch")) mealType = "Lunch";
    if (qLower.includes("dinner")) mealType = "Dinner";

    return {
      queryKeywords: [query],
      ingredients: [],
      diet,
      mealType,
      maxCookingTime: maxTime,
      isConversational: false,
    };
  }

  async getSubstitutions(ingredient: string, dishContext?: string) {
    const cacheKey = this.hashKey("sub", { ingredient: ingredient.toLowerCase(), dish: dishContext });
    const cached = await this.aiCacheModel.findOne({ cacheKey });
    if (cached && cached.expiresAt > new Date()) {
      return cached.responseData;
    }

    if (!this.aiClient) {
      return [
        { substitute: "Appropriate pantry alternative", ratio: "1:1", tip: "Use similar texture and moisture." },
      ];
    }

    try {
      const prompt = `Suggest 3 realistic culinary substitutions for "${ingredient}" in ${dishContext || "general cooking"}.
Return JSON only:
[
  { "substitute": "Name", "ratio": "e.g. 1:1 or 2 tbsp per cup", "tip": "Practical advice" }
]`;

      const response = await this.aiClient.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const text = response.text || "";
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const subs = JSON.parse(jsonMatch[0]);
        await this.aiCacheModel.findOneAndUpdate(
          { cacheKey },
          {
            cacheKey,
            type: "substitutions",
            responseData: subs,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
          { upsert: true }
        );
        return subs;
      }
    } catch (err) {
      console.warn("Gemini substitutions warning:", err);
    }

    return [];
  }

  async getCookingAdvice(question: string, recipeContext: { name: string; stepInstruction?: string }) {
    if (!this.aiClient) {
      return "Keep heat moderate and check seasoning balance with a pinch of salt.";
    }

    try {
      const prompt = `You are an expert chef assisting a home cook preparing "${recipeContext.name}".
Current step: "${recipeContext.stepInstruction || "Cooking"}".
User question: "${question}".
Provide a concise, practical, 1-2 sentence solution focused on heat control, timing, and flavor.`;

      const response = await this.aiClient.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      return response.text?.trim() || "Taste carefully and adjust heat and seasoning as needed.";
    } catch (err) {
      return "Simmer gently on low heat and check texture and seasoning.";
    }
  }
}
