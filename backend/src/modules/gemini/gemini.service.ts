import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { GoogleGenAI } from "@google/genai";
import * as crypto from "crypto";
import { ENV } from "../../config/env.config";
import { AICache, AICacheDocument } from "../../database/schemas/ai-cache.schema";
import {
  AIIngredientCache,
  AIIngredientCacheDocument,
  DishSuggestion,
} from "../../database/schemas/ai-ingredient-cache.schema";
import { Recipe, RecipeDocument } from "../../database/schemas/recipe.schema";
import { IngredientsService } from "../ingredients/ingredients.service";
import { MealDbRecipeProvider } from "../recipes/providers/mealdb.provider";

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

export interface CookWithWhatIHaveResult {
  fromCache: boolean;
  ingredientHash: string;
  suggestions: Array<{
    dishName: string;
    requiredIngredients: string[];
    optionalIngredients: string[];
    reason: string;
    missingImportantIngredients: string[];
    isAiSuggestion: boolean;
    sourceTag: string;
    matchedRecipe?: any;
  }>;
  note?: string;
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger("GeminiService");
  private aiClient: GoogleGenAI | null = null;
  // In-memory deduplication for concurrent identical in-flight requests
  private readonly inFlightRequests = new Map<string, Promise<CookWithWhatIHaveResult>>();

  constructor(
    @InjectModel(AICache.name) private aiCacheModel: Model<AICacheDocument>,
    @InjectModel(AIIngredientCache.name)
    private aiIngredientCacheModel: Model<AIIngredientCacheDocument>,
    @InjectModel(Recipe.name) private recipeModel: Model<RecipeDocument>,
    private ingredientsService: IngredientsService,
    private mealDbProvider: MealDbRecipeProvider
  ) {
    if (ENV.GEMINI_API_KEY) {
      try {
        this.aiClient = new GoogleGenAI({
          apiKey: ENV.GEMINI_API_KEY,
          httpOptions: {
            headers: {
              "User-Agent": "SavourCookMate/2.0",
            },
          },
        });
      } catch (err: any) {
        this.logger.warn(`Failed to initialize GoogleGenAI: ${err.message}`);
      }
    }
  }

  private hashKey(prefix: string, data: any): string {
    return crypto.createHash("sha256").update(`${prefix}:${JSON.stringify(data)}`).digest("hex");
  }

  /**
   * Builds deterministic canonical cooking key combining sorted ingredients and normalized preferences.
   * Dietary and allergen restrictions are strictly partitioned so caches never leak across preferences.
   */
  public buildCanonicalCookingKey(
    rawIngredients: string[],
    preferences: Record<string, any> = {}
  ): { normalizedList: string[]; cacheKey: string } {
    const normalizedList = Array.from(
      new Set(
        rawIngredients
          .map((i) => this.ingredientsService.normalizeIngredientName(i))
          .filter(Boolean)
      )
    ).sort();

    const diet = (preferences.diet || preferences.dietary || "").toString().toLowerCase().trim();
    const rawAllergies = Array.isArray(preferences.allergies)
      ? preferences.allergies
      : typeof preferences.allergies === "string"
      ? [preferences.allergies]
      : [];
    const allergies = Array.from(
      new Set(rawAllergies.map((a: any) => String(a).toLowerCase().trim()).filter(Boolean))
    ).sort();
    const maxCookingTime = preferences.maxCookingTime ? Number(preferences.maxCookingTime) : 0;
    const cuisine = (preferences.cuisine || "").toString().toLowerCase().trim();
    const spiceLevel = (preferences.spiceLevel || "").toString().toLowerCase().trim();

    const canonicalObject = {
      allergies,
      cuisine,
      diet,
      ingredients: normalizedList,
      maxCookingTime,
      spiceLevel,
    };

    const cacheKey = crypto
      .createHash("sha256")
      .update(JSON.stringify(canonicalObject))
      .digest("hex");

    return { normalizedList, cacheKey };
  }

  /**
   * SIGNATURE FEATURE: "Cook With What I Have"
   * ONLY runs when user explicitly taps "Find dishes I can make".
   * 1. Normalizes and sorts ingredients + preferences deterministically.
   * 2. Checks MongoDB aiIngredientCache using canonical key.
   * 3. Deduplicates concurrent in-flight requests.
   * 4. Structured compact Gemini request if uncached.
   * 5. Matches real recipes in MongoDB or displays as "Based on your kitchen".
   */
  async cookWithWhatIHave(
    rawIngredients: string[],
    preferences: Record<string, any> = {}
  ): Promise<CookWithWhatIHaveResult> {
    if (!rawIngredients || rawIngredients.length === 0) {
      return {
        fromCache: false,
        ingredientHash: "",
        suggestions: [],
      };
    }

    // 1. Build canonical key combining sorted ingredients and preferences
    const { normalizedList, cacheKey } = this.buildCanonicalCookingKey(rawIngredients, preferences);

    // 2. In-memory deduplication for identical concurrent requests
    if (this.inFlightRequests.has(cacheKey)) {
      return this.inFlightRequests.get(cacheKey)!;
    }

    const requestPromise = this.executeCookWithWhatIHave(normalizedList, cacheKey, preferences);
    this.inFlightRequests.set(cacheKey, requestPromise);

    try {
      return await requestPromise;
    } finally {
      this.inFlightRequests.delete(cacheKey);
    }
  }

  private async executeCookWithWhatIHave(
    normalizedList: string[],
    ingredientHash: string,
    preferences: Record<string, any>
  ): Promise<CookWithWhatIHaveResult> {
    // 3. Check MongoDB aiIngredientCache
    const cached = await this.aiIngredientCacheModel.findOne({ ingredientHash }).lean();
    if (cached && cached.expiresAt > new Date() && cached.suggestions?.length > 0) {
      const enriched = await this.enrichSuggestions(cached.suggestions);
      return {
        fromCache: true,
        ingredientHash,
        suggestions: enriched,
      };
    }

    // If Gemini client is not configured
    if (!this.aiClient) {
      return {
        fromCache: false,
        ingredientHash,
        suggestions: [],
        note: "AI ingredient reasoning is offline. Using verified pantry matches from your kitchen.",
      };
    }

    // 4. Send compact structured request to Gemini
    try {
      const prompt = `You are a culinary expert. The user has these ingredients in their kitchen:
[${normalizedList.join(", ")}]

Preferences / Restrictions: ${JSON.stringify(preferences)}

Determine up to 5 plausible dishes that can be prepared primarily using these ingredients.
Return JSON ONLY strictly matching this structure:
{
  "suggestions": [
    {
      "dishName": "Exact recipe title",
      "requiredIngredients": ["ingredient 1", "ingredient 2"],
      "optionalIngredients": ["optional ingredient"],
      "reason": "1 concise sentence explaining why this works with their pantry",
      "missingImportantIngredients": ["any staple they might need to add"]
    }
  ]
}
Do NOT generate fake ratings, fake reviews, calories, videos, or markdown backticks outside JSON.`;

      const response = await this.aiClient.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const text = response.text || "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const suggestions: DishSuggestion[] = Array.isArray(parsed.suggestions)
          ? parsed.suggestions.map((s: any) => ({
              dishName: s.dishName || "Custom Dish",
              requiredIngredients: s.requiredIngredients || [],
              optionalIngredients: s.optionalIngredients || [],
              reason: s.reason || "",
              missingImportantIngredients: s.missingImportantIngredients || [],
            }))
          : [];

        // Cache in MongoDB with 7-day TTL
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await this.aiIngredientCacheModel.findOneAndUpdate(
          { ingredientHash },
          {
            ingredientHash,
            ingredients: normalizedList,
            preferences,
            suggestions,
            modelVersion: "gemini-2.5-flash",
            createdAt: new Date(),
            expiresAt,
          },
          { upsert: true }
        );

        const enriched = await this.enrichSuggestions(suggestions);
        return {
          fromCache: false,
          ingredientHash,
          suggestions: enriched,
        };
      }
    } catch (err: any) {
      this.logger.warn(`Gemini cook-with-what-i-have error: ${err.message}`);
    }

    return {
      fromCache: false,
      ingredientHash,
      suggestions: [],
      note: "Could not generate creative dish suggestions. Relying on verified recipe matches.",
    };
  }

  /**
   * Cross-references AI suggestions with real recipes in MongoDB Atlas or TheMealDB.
   * If not found, labels clearly as "Suggested from your ingredients".
   */
  private async enrichSuggestions(suggestions: DishSuggestion[]) {
    const results = [];

    for (const item of suggestions) {
      let matchedRecipe = await this.recipeModel
        .findOne({
          name: { $regex: new RegExp(`^${item.dishName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
          status: "published",
        })
        .lean();

      if (!matchedRecipe) {
        try {
          const external = await this.mealDbProvider.searchRecipes(item.dishName);
          if (external.length > 0) {
            matchedRecipe = external[0] as any;
          }
        } catch {
          // ignore
        }
      }

      results.push({
        dishName: item.dishName,
        requiredIngredients: item.requiredIngredients,
        optionalIngredients: item.optionalIngredients,
        reason: item.reason,
        missingImportantIngredients: item.missingImportantIngredients,
        isAiSuggestion: !matchedRecipe,
        sourceTag: matchedRecipe ? "Verified Recipe" : "Based on your kitchen",
        matchedRecipe: matchedRecipe || undefined,
      });
    }

    return results;
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

    const words = trimmed.split(/\s+/);
    const isConversational =
      words.length >= 5 &&
      /\b(i want|looking for|something like|can i make|under \d+|less than \d+|quick and easy)\b/i.test(trimmed);

    if (!isConversational || !this.aiClient) {
      return this.fallbackParse(trimmed);
    }

    const cacheKey = this.hashKey("intent", trimmed.toLowerCase());
    const cached = await this.aiCacheModel.findOne({ cacheKey });
    if (cached && cached.expiresAt > new Date()) {
      return cached.responseData as ParsedSearchIntent;
    }

    try {
      const prompt = `Analyze this culinary search query: "${trimmed}".
Extract user intent into structured JSON only:
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
      this.logger.warn(`Gemini intent parse warning, falling back to deterministic extraction: ${err}`);
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
        { substitute: "Appropriate culinary alternative", ratio: "1:1", tip: "Use similar moisture and seasoning." },
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
      this.logger.warn(`Gemini substitutions warning: ${err}`);
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
