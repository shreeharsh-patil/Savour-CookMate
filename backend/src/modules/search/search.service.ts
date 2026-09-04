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
    const { query, page = 1, limit = 20 } = options;
    const cleanQuery = (query || "").trim();

    const intent: any = {
      isConversational: false,
      cuisine: options.cuisine,
      mealType: options.mealType,
      diet: options.diet,
      maxCookingTime: options.maxCookingTime,
      ingredients: [],
    };

    // Build MongoDB query
    const mongoQuery: any = { status: "published" };

    const targetCuisine = options.cuisine || intent.cuisine;
    if (targetCuisine && targetCuisine.toLowerCase() !== "all") {
      mongoQuery.cuisine = { $regex: new RegExp(`^${this.escapeRegex(targetCuisine)}$`, "i") };
    }

    const targetMealType = options.mealType || intent.mealType;
    if (targetMealType && targetMealType.toLowerCase() !== "all") {
      mongoQuery.mealTypes = { $in: [new RegExp(this.escapeRegex(targetMealType), "i")] };
    }

    const targetDiet = options.diet || intent.diet;
    if (targetDiet && targetDiet.toLowerCase() !== "all") {
      mongoQuery.dietaryTags = { $in: [new RegExp(this.escapeRegex(targetDiet), "i")] };
    }

    const targetMaxTime = options.maxCookingTime || intent.maxCookingTime;
    if (targetMaxTime && targetMaxTime > 0) {
      mongoQuery.totalTime = { $lte: targetMaxTime };
    }

    if (intent.ingredients && intent.ingredients.length > 0) {
      mongoQuery["ingredients.normalizedName"] = {
        $in: intent.ingredients.map((i: string) => new RegExp(i.toLowerCase(), "i")),
      };
    }

    if (cleanQuery) {
      mongoQuery.$or = [
        { name: { $regex: this.escapeRegex(cleanQuery), $options: "i" } },
        { description: { $regex: this.escapeRegex(cleanQuery), $options: "i" } },
        { searchKeywords: { $in: [new RegExp(this.escapeRegex(cleanQuery), "i")] } },
        { cuisine: { $regex: this.escapeRegex(cleanQuery), $options: "i" } },
        { "ingredients.name": { $regex: this.escapeRegex(cleanQuery), $options: "i" } },
      ];
    }

    const skip = (Math.max(1, page) - 1) * Math.min(50, limit);
    const take = Math.min(50, limit);

    let [recipes, total] = await Promise.all([
      this.recipeModel.find(mongoQuery).sort({ popularityScore: -1, cookCount: -1 }).skip(skip).limit(take).lean(),
      this.recipeModel.countDocuments(mongoQuery),
    ]);

    // If fewer than 4 results found and query has terms, query TheMealDB and cache
    if (recipes.length < 4 && cleanQuery) {
      try {
        const external = await this.mealDbProvider.searchRecipes(cleanQuery);
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
      interpretedIntent: null,
      recipes: recipes.slice(0, take),
      pagination: {
        page: Number(page),
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
