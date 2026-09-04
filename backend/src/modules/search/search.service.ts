import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Recipe, RecipeDocument } from "../../database/schemas/recipe.schema";
import { SearchHistory, SearchHistoryDocument } from "../../database/schemas/search-history.schema";
import { GeminiService } from "../gemini/gemini.service";

export interface SearchOptions {
  query: string;
  cuisine?: string;
  mealType?: string;
  diet?: string;
  maxCookingTime?: number;
  spicePreference?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class SearchService {
  constructor(
    @InjectModel(Recipe.name) private recipeModel: Model<RecipeDocument>,
    @InjectModel(SearchHistory.name) private searchHistoryModel: Model<SearchHistoryDocument>,
    private geminiService: GeminiService
  ) {}

  async searchRecipes(options: SearchOptions, userId?: string) {
    const { query, page = 1, limit = 20 } = options;
    const cleanQuery = (query || "").trim();

    // 1. Analyze intent (Gemini used ONLY if query is conversational)
    const intent = await this.geminiService.parseSearchIntent(cleanQuery);

    // 2. Build MongoDB query
    const mongoQuery: any = { status: "published" };

    // Cuisine filter
    const targetCuisine = options.cuisine || intent.cuisine;
    if (targetCuisine && targetCuisine.toLowerCase() !== "all") {
      mongoQuery.cuisine = { $regex: new RegExp(`^${targetCuisine}$`, "i") };
    }

    // Meal type filter
    const targetMealType = options.mealType || intent.mealType;
    if (targetMealType && targetMealType.toLowerCase() !== "all") {
      mongoQuery.mealTypes = { $in: [new RegExp(targetMealType, "i")] };
    }

    // Diet filter
    const targetDiet = options.diet || intent.diet;
    if (targetDiet && targetDiet.toLowerCase() !== "all") {
      mongoQuery.dietaryTags = { $in: [new RegExp(targetDiet, "i")] };
    }

    // Max cooking time filter
    const targetMaxTime = options.maxCookingTime || intent.maxCookingTime;
    if (targetMaxTime && targetMaxTime > 0) {
      mongoQuery.totalTime = { $lte: targetMaxTime };
    }

    // Ingredients in query
    if (intent.ingredients && intent.ingredients.length > 0) {
      mongoQuery["ingredients.normalizedName"] = {
        $in: intent.ingredients.map((i) => new RegExp(i.toLowerCase(), "i")),
      };
    }

    // Text search or keywords match
    if (cleanQuery && (!intent.isConversational || !intent.ingredients.length)) {
      mongoQuery.$or = [
        { name: { $regex: cleanQuery, $options: "i" } },
        { description: { $regex: cleanQuery, $options: "i" } },
        { searchKeywords: { $in: [new RegExp(cleanQuery, "i")] } },
        { cuisine: { $regex: cleanQuery, $options: "i" } },
      ];
    }

    const skip = (Math.max(1, page) - 1) * Math.min(50, limit);
    const take = Math.min(50, limit);

    const [recipes, total] = await Promise.all([
      this.recipeModel.find(mongoQuery).sort({ cookCount: -1 }).skip(skip).limit(take).lean(),
      this.recipeModel.countDocuments(mongoQuery),
    ]);

    // Record search history for user
    if (userId && cleanQuery) {
      this.searchHistoryModel
        .create({
          userId,
          query: cleanQuery,
          parsedIntent: intent,
          resultCount: total,
        })
        .catch(() => {});
    }

    return {
      query: cleanQuery,
      interpretedIntent: intent.isConversational
        ? {
            cuisine: intent.cuisine,
            mealType: intent.mealType,
            diet: intent.diet,
            maxTime: intent.maxCookingTime,
            ingredients: intent.ingredients,
          }
        : null,
      recipes,
      pagination: {
        page: Number(page),
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  async autocomplete(term: string) {
    if (!term || term.trim().length < 2) return [];
    const clean = term.trim();

    const recipes = await this.recipeModel
      .find({
        name: { $regex: clean, $options: "i" },
        status: "published",
      })
      .select("name cuisine slug")
      .limit(6)
      .lean();

    return recipes.map((r) => ({
      title: r.name,
      subtitle: `${r.cuisine} Cuisine`,
      slug: r.slug,
    }));
  }
}
