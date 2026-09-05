import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Recipe, RecipeDocument } from "../../database/schemas/recipe.schema";
import { SearchHistory, SearchHistoryDocument } from "../../database/schemas/search-history.schema";
import { RecipesService } from "../recipes/recipes.service";
import { MealDbRecipeProvider } from "../recipes/providers/mealdb.provider";

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
  private readonly logger = new Logger("SearchService");

  constructor(
    @InjectModel(Recipe.name) private recipeModel: Model<RecipeDocument>,
    @InjectModel(SearchHistory.name) private searchHistoryModel: Model<SearchHistoryDocument>,
    private recipesService: RecipesService,
    private mealDbProvider: MealDbRecipeProvider
  ) {}

  async searchRecipes(options: SearchOptions, userId?: string) {
    const { page = 1, limit = 20 } = options;
    const MAX_SEARCH_LENGTH = 100;
    const cleanQuery = (options.query || "").trim().slice(0, MAX_SEARCH_LENGTH);
    const intent = this.parseSearchIntent(cleanQuery);

    // Build MongoDB query
    const mongoQuery: any = { status: "published" };

    const targetCuisine = (options.cuisine || intent.cuisine || "").trim().slice(0, MAX_SEARCH_LENGTH);
    if (targetCuisine && targetCuisine.toLowerCase() !== "all") {
      mongoQuery.cuisine = { $regex: new RegExp(`^${this.escapeRegex(targetCuisine)}$`, "i") };
    }

    const targetMealType = (options.mealType || intent.mealType || "").trim().slice(0, MAX_SEARCH_LENGTH);
    if (targetMealType && targetMealType.toLowerCase() !== "all") {
      mongoQuery.mealTypes = { $in: [new RegExp(this.escapeRegex(targetMealType), "i")] };
    }

    const targetDiet = (options.diet || intent.diet || "").trim().slice(0, MAX_SEARCH_LENGTH);
    if (targetDiet && targetDiet.toLowerCase() !== "all") {
      mongoQuery.dietaryTags = { $in: [new RegExp(this.escapeRegex(targetDiet), "i")] };
    }

    const targetMaxTime = options.maxCookingTime || intent.maxCookingTime;
    if (targetMaxTime && targetMaxTime > 0) {
      mongoQuery.totalTime = { $lte: targetMaxTime };
    }

    if (intent.ingredients && intent.ingredients.length > 0) {
      mongoQuery["ingredients.normalizedName"] = {
        $in: intent.ingredients.map((i: string) => new RegExp(this.escapeRegex(i.toLowerCase().trim()), "i")),
      };
    }

    const effectiveQuery = (intent.cleanQuery || cleanQuery).trim();
    if (effectiveQuery) {
      const esc = this.escapeRegex(effectiveQuery);
      mongoQuery.$or = [
        { name: { $regex: esc, $options: "i" } },
        { description: { $regex: esc, $options: "i" } },
        { searchKeywords: { $in: [new RegExp(esc, "i")] } },
        { cuisine: { $regex: esc, $options: "i" } },
        { "ingredients.name": { $regex: esc, $options: "i" } },
      ];
    }

    const skip = (Math.max(1, page) - 1) * Math.min(50, limit);
    const take = Math.min(50, limit);

    let [recipes, total] = await Promise.all([
      this.recipeModel.find(mongoQuery).sort({ popularityScore: -1, cookCount: -1 }).skip(skip).limit(take).lean(),
      this.recipeModel.countDocuments(mongoQuery),
    ]);

    // If fewer than 4 results found and query has terms, query TheMealDB and cache
    if (recipes.length < 4 && effectiveQuery) {
      try {
        const external = await this.mealDbProvider.searchRecipes(effectiveQuery);
        if (external.length > 0) {
          const saved = await this.recipesService.upsertProviderRecipes(external);
          const existingIds = new Set(recipes.map((r: any) => r._id?.toString()));
          for (const s of saved) {
            if (!existingIds.has(s._id?.toString())) {
              recipes.push(s);
              total++;
            }
          }
        }
      } catch (err: any) {
        this.logger.warn(`External recipe search error: ${err.message}`);
      }
    }

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
      interpretedIntent: intent.isConversational ? intent : null,
      recipes: recipes.slice(0, take),
      pagination: {
        page: Number(page),
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  private parseSearchIntent(rawQuery: string): {
    cleanQuery: string;
    cuisine?: string;
    mealType?: string;
    diet?: string;
    maxCookingTime?: number;
    ingredients: string[];
    isConversational: boolean;
  } {
    const trimmed = rawQuery.trim().slice(0, 100);
    if (!trimmed) {
      return { cleanQuery: "", ingredients: [], isConversational: false };
    }

    const qLower = trimmed.toLowerCase();
    let isConversational = false;

    // Time parsing: "under 30 mins", "less than 20 minutes", "30 min", "quick"
    let maxCookingTime: number | undefined;
    const timeMatch = qLower.match(/(?:under|less than|within|in)?\s*(\d+)\s*(?:mins?|minutes?)/i);
    if (timeMatch) {
      maxCookingTime = parseInt(timeMatch[1], 10);
      isConversational = true;
    } else if (/\bquick\b|\beasy\b|\bfast\b/i.test(qLower)) {
      maxCookingTime = 30;
      isConversational = true;
    }

    // Diet parsing
    let diet: string | undefined;
    if (/\bvegan\b/i.test(qLower)) {
      diet = "Vegan";
      isConversational = true;
    } else if (/\bnon[-\s]?veg(?:etarian)?\b/i.test(qLower)) {
      diet = "Non-Vegetarian";
      isConversational = true;
    } else if (/\bveg(?:etarian)?\b/i.test(qLower)) {
      diet = "Vegetarian";
      isConversational = true;
    } else if (/\bgluten[-\s]?free\b/i.test(qLower)) {
      diet = "Gluten-Free";
      isConversational = true;
    } else if (/\bketo\b/i.test(qLower)) {
      diet = "Keto";
      isConversational = true;
    }

    // Meal type parsing
    let mealType: string | undefined;
    if (/\bbreakfast\b/i.test(qLower)) mealType = "Breakfast";
    else if (/\blunch\b/i.test(qLower)) mealType = "Lunch";
    else if (/\bdinner\b/i.test(qLower)) mealType = "Dinner";
    else if (/\bdessert\b/i.test(qLower)) mealType = "Dessert";
    else if (/\bsnack\b/i.test(qLower)) mealType = "Snack";

    if (mealType) isConversational = true;

    // Cuisine parsing
    const commonCuisines = [
      "italian", "indian", "mexican", "chinese", "thai", "japanese",
      "french", "mediterranean", "american", "spanish", "greek",
      "goan", "punjabi", "south indian", "north indian", "korean", "vietnamese"
    ];
    let cuisine: string | undefined;
    for (const c of commonCuisines) {
      if (new RegExp(`\\b${c}\\b`, "i").test(qLower)) {
        cuisine = c.charAt(0).toUpperCase() + c.slice(1);
        isConversational = true;
        break;
      }
    }

    // Ingredients parsing: "with chicken and mushrooms"
    const ingredients: string[] = [];
    const withMatch = qLower.match(/(?:with|using|featuring|having)\s+([a-z\s,]+)/i);
    if (withMatch) {
      const ingTokens = withMatch[1].split(/\s+(?:and|or|,)\s+|\s*,\s*/);
      for (const token of ingTokens) {
        const cleaned = token.trim();
        if (cleaned.length > 2 && !commonCuisines.includes(cleaned)) {
          ingredients.push(cleaned);
        }
      }
      if (ingredients.length > 0) isConversational = true;
    }

    let clean = trimmed;
    if (/\b(i want|looking for|something like|can i make|how to cook|recipe for|show me)\b/i.test(clean)) {
      clean = clean.replace(/\b(i want|looking for|something like|can i make|how to cook|recipe for|show me)\b/gi, "").trim();
      isConversational = true;
    }

    return {
      cleanQuery: clean,
      cuisine,
      mealType,
      diet,
      maxCookingTime,
      ingredients,
      isConversational,
    };
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  async autocomplete(term: string) {
    if (!term || term.trim().length < 2) return [];
    const clean = term.trim().slice(0, 100);
    const esc = this.escapeRegex(clean);

    const recipes = await this.recipeModel
      .find({
        name: { $regex: esc, $options: "i" },
        status: "published",
      })
      .select("name cuisine slug")
      .limit(6)
      .lean();

    return recipes.map((r) => ({
      title: r.name,
      subtitle: `${r.cuisine || "Special"} Cuisine`,
      slug: r.slug,
    }));
  }
}
