import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import { Recipe, RecipeDocument } from "../../database/schemas/recipe.schema";
import { Review, ReviewDocument } from "../../database/schemas/review.schema";
import { CookingHistory, CookingHistoryDocument } from "../../database/schemas/cooking-history.schema";
import { MealDbRecipeProvider } from "./providers/mealdb.provider";
import { NormalizedRecipe } from "./providers/recipe-provider.interface";

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const MAX_SEARCH_LENGTH = 100;

export interface RecipeFilterOptions {
  cuisine?: string;
  mealType?: string;
  diet?: string;
  difficulty?: string;
  maxTime?: number;
  search?: string;
  sort?: "popular" | "rating" | "time" | "newest";
  page?: number;
  limit?: number;
}

@Injectable()
export class RecipesService {
  private readonly logger = new Logger("RecipesService");

  constructor(
    @InjectModel(Recipe.name) private recipeModel: Model<RecipeDocument>,
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    @InjectModel(CookingHistory.name) private historyModel: Model<CookingHistoryDocument>,
    private readonly mealDbProvider: MealDbRecipeProvider
  ) {}

  /**
   * Helper to persist recipes from external providers into MongoDB with TTL tracking
   */
  async upsertProviderRecipes(normalizedList: NormalizedRecipe[]): Promise<any[]> {
    const savedDocs: any[] = [];

    for (const item of normalizedList) {
      try {
        const existing = await this.recipeModel.findOne({
          $or: [
            { externalId: item.externalId, provider: item.provider },
            { slug: item.slug },
            { name: { $regex: new RegExp(`^${item.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") } },
          ],
        });

        if (existing) {
          existing.lastSyncedAt = new Date();
          if (!existing.imageUrl && item.imageUrl) existing.imageUrl = item.imageUrl;
          if ((!existing.ingredients || existing.ingredients.length === 0) && item.ingredients?.length > 0) {
            existing.ingredients = item.ingredients as any;
          }
          if ((!existing.instructions || existing.instructions.length === 0) && item.instructions?.length > 0) {
            existing.instructions = item.instructions;
            existing.steps = item.steps as any;
            existing.isHydrated = true;
            existing.detailFetchedAt = new Date();
          }
          if (item.category && !existing.category) existing.category = item.category;
          if (item.cuisine && !existing.cuisine) existing.cuisine = item.cuisine;
          if (item.totalTime !== undefined && existing.totalTime === undefined) existing.totalTime = item.totalTime;
          if (item.prepTime !== undefined && existing.prepTime === undefined) existing.prepTime = item.prepTime;
          if (item.cookTime !== undefined && existing.cookTime === undefined) existing.cookTime = item.cookTime;
          if (item.servings !== undefined && existing.servings === undefined) existing.servings = item.servings;
          if (item.difficulty && !existing.difficulty) existing.difficulty = item.difficulty;
          if (item.description && !existing.description) existing.description = item.description;
          if (!existing.youtubeUrl && item.youtubeUrl) existing.youtubeUrl = item.youtubeUrl;
          if (!existing.youtubeVideoId && item.youtubeVideoId) existing.youtubeVideoId = item.youtubeVideoId;
          if (!existing.sourceUrl && item.sourceUrl) existing.sourceUrl = item.sourceUrl;
          await existing.save();
          savedDocs.push(existing.toObject());
        } else {
          const created = await this.recipeModel.create({
            ...item,
            status: "published",
            isHydrated: Boolean(item.instructions?.length),
            detailFetchedAt: item.instructions?.length ? new Date() : undefined,
            popularityScore: 0,
            cookCount: 0,
            ratingCount: 0,
            averageRating: null,
          });
          savedDocs.push(created.toObject());
        }
      } catch (err: any) {
        this.logger.warn(`Failed to upsert recipe ${item.name}: ${err.message}`);
      }
    }

    return savedDocs;
  }

  async findAll(options: RecipeFilterOptions) {
    const {
      cuisine,
      mealType,
      diet,
      difficulty,
      maxTime,
      search,
      sort = "popular",
      page = 1,
      limit = 20,
    } = options;

    const query: any = { status: "published" };

    if (cuisine && cuisine.toLowerCase() !== "all") {
      const esc = escapeRegex(cuisine.trim().slice(0, MAX_SEARCH_LENGTH));
      query.cuisine = { $regex: new RegExp(`^${esc}$`, "i") };
    }

    if (mealType && mealType.toLowerCase() !== "all") {
      const esc = escapeRegex(mealType.trim().slice(0, MAX_SEARCH_LENGTH));
      query.mealTypes = { $in: [new RegExp(esc, "i")] };
    }

    if (diet && diet.toLowerCase() !== "all") {
      const esc = escapeRegex(diet.trim().slice(0, MAX_SEARCH_LENGTH));
      query.dietaryTags = { $in: [new RegExp(esc, "i")] };
    }

    if (difficulty && difficulty.toLowerCase() !== "all") {
      query.difficulty = difficulty;
    }

    if (maxTime && maxTime > 0) {
      query.totalTime = { $lte: Number(maxTime) };
    }

    if (search && search.trim()) {
      const cleanSearch = search.trim().slice(0, MAX_SEARCH_LENGTH);
      query.$text = { $search: cleanSearch };
    }

    let sortObj: any = { popularityScore: -1, cookCount: -1 };
    if (sort === "rating") {
      sortObj = { averageRating: -1, ratingCount: -1 };
    } else if (sort === "time") {
      sortObj = { totalTime: 1 };
    } else if (sort === "newest") {
      sortObj = { createdAt: -1 };
    }

    const skip = (Math.max(1, page) - 1) * Math.min(50, limit);
    const take = Math.min(50, limit);

    let [recipes, total] = await Promise.all([
      this.recipeModel.find(query).sort(sortObj).skip(skip).limit(take).lean(),
      this.recipeModel.countDocuments(query),
    ]);

    // If searching and fewer than 3 results found in local cache, query TheMealDB and cache
    if (search && search.trim() && recipes.length < 3) {
      try {
        const cleanSearch = search.trim().slice(0, MAX_SEARCH_LENGTH);
        const external = await this.mealDbProvider.searchRecipes(cleanSearch);
        if (external.length > 0) {
          const cached = await this.upsertProviderRecipes(external);
          const existingIds = new Set(recipes.map((r: any) => r._id?.toString()));
          for (const c of cached) {
            if (!existingIds.has(c._id?.toString())) {
              recipes.push(c);
              total++;
            }
          }
        }
      } catch (err: any) {
        this.logger.warn(`MealDB fallback search failed: ${err.message}`);
      }
    }

    return {
      recipes,
      pagination: {
        page: Number(page),
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  /**
   * Normal search without Gemini: Checks MongoDB Atlas search first, then provider fallback
   */
  async searchRecipes(query: string, limit = 20) {
    if (!query || !query.trim()) {
      return this.recipeModel.find({ status: "published" }).limit(limit).lean();
    }

    const clean = query.trim().slice(0, MAX_SEARCH_LENGTH);
    const escaped = escapeRegex(clean);

    // 1. Check MongoDB text search
    let recipes = await this.recipeModel
      .find({
        status: "published",
        $or: [
          { $text: { $search: clean } },
          { name: { $regex: escaped, $options: "i" } },
          { cuisine: { $regex: escaped, $options: "i" } },
          { "ingredients.name": { $regex: escaped, $options: "i" } },
        ],
      })
      .sort({ popularityScore: -1, cookCount: -1 })
      .limit(limit)
      .lean();

    // 2. If insufficient results, fetch from TheMealDB and cache
    if (recipes.length < 5) {
      try {
        const external = await this.mealDbProvider.searchRecipes(clean);
        if (external.length > 0) {
          const saved = await this.upsertProviderRecipes(external);
          const existingIds = new Set(recipes.map((r: any) => r._id?.toString()));
          for (const s of saved) {
            if (!existingIds.has(s._id?.toString())) {
              recipes.push(s);
            }
          }
        }
      } catch (err: any) {
        this.logger.warn(`External recipe search error: ${err.message}`);
      }
    }

    return recipes.slice(0, limit);
  }

  async findById(id: string) {
    if (!id || typeof id !== "string") {
      throw new NotFoundException("Valid recipe ID or slug required.");
    }
    const cleanId = id.trim();
    let recipe: any = null;

    // 1. Valid Mongo ObjectId -> _id
    if (mongoose.Types.ObjectId.isValid(cleanId)) {
      recipe = await this.recipeModel.findById(cleanId).lean();
    }

    // 2. Otherwise: slug, externalId
    if (!recipe) {
      recipe = await this.recipeModel.findOne({ slug: cleanId }).lean();
    }
    if (!recipe) {
      recipe = await this.recipeModel.findOne({ externalId: cleanId }).lean();
    }

    // 3. Hydrate provider records that were saved from shallow list/filter results or missing instructions.
    if (!recipe || (!recipe.instructions?.length && (recipe.provider === this.mealDbProvider.providerName || recipe.externalId || (recipe.slug && /-\d+$/.test(recipe.slug))))) {
      try {
        const mealId = recipe?.externalId || (recipe?.slug && recipe.slug.match(/-(\d+)$/)?.[1]) || cleanId;
        const external = await this.mealDbProvider.getRecipe(mealId);
        if (external) {
          const [saved] = await this.upsertProviderRecipes([external]);
          recipe = saved;
        }
      } catch (err: any) {
        this.logger.warn(`External recipe lookup error: ${err.message}`);
      }
    }

    if (!recipe) {
      throw new NotFoundException(`Recipe with id or slug '${cleanId}' not found.`);
    }

    // Fetch real reviews for this recipe
    const reviews = await this.reviewModel
      .find({ recipeId: recipe._id as any })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Fetch 4 similar recipes from the same cuisine or category
    const similar = await this.recipeModel
      .find({
        _id: { $ne: recipe._id },
        $or: [{ cuisine: recipe.cuisine }, { category: recipe.category }],
        status: "published",
      })
      .limit(4)
      .lean();

    return {
      ...recipe,
      reviews,
      similarRecipes: similar,
    };
  }

  async getCategories(): Promise<string[]> {
    const localCategories = (await this.recipeModel.distinct("category", { status: "published" })) as string[];
    const externalCategories = await this.mealDbProvider.getCategories();
    const set = new Set<string>([...localCategories, ...externalCategories].filter(Boolean));
    return Array.from(set);
  }

  async getCuisines(): Promise<string[]> {
    const localCuisines = (await this.recipeModel.distinct("cuisine", { status: "published" })) as string[];
    const externalCuisines = await this.mealDbProvider.getCuisines();
    const set = new Set<string>([...localCuisines, ...externalCuisines].filter(Boolean));
    return Array.from(set);
  }

  async getIngredientsList(): Promise<string[]> {
    return this.mealDbProvider.getIngredients();
  }

  async getByCategory(category: string, limit = 20) {
    let recipes = await this.recipeModel
      .find({
        status: "published",
        category: { $regex: new RegExp(`^${category}$`, "i") },
      })
      .sort({ popularityScore: -1 })
      .limit(limit)
      .lean();

    if (recipes.length < 5) {
      const external = await this.mealDbProvider.getByCategory(category);
      if (external.length > 0) {
        const saved = await this.upsertProviderRecipes(external);
        const existingIds = new Set(recipes.map((r: any) => r._id?.toString()));
        for (const s of saved) {
          if (!existingIds.has(s._id?.toString())) {
            recipes.push(s);
          }
        }
      }
    }

    return recipes.slice(0, limit);
  }

  async getByCuisine(area: string, limit = 20) {
    let recipes = await this.recipeModel
      .find({
        status: "published",
        cuisine: { $regex: new RegExp(`^${area}$`, "i") },
      })
      .sort({ popularityScore: -1 })
      .limit(limit)
      .lean();

    if (recipes.length < 5) {
      const external = await this.mealDbProvider.getByCuisine(area);
      if (external.length > 0) {
        const saved = await this.upsertProviderRecipes(external);
        const existingIds = new Set(recipes.map((r: any) => r._id?.toString()));
        for (const s of saved) {
          if (!existingIds.has(s._id?.toString())) {
            recipes.push(s);
          }
        }
      }
    }

    return recipes.slice(0, limit);
  }

  async getHomeFeed() {
    const [quickMeals, popular, categories, cuisines, recent] = await Promise.all([
      this.recipeModel.find({ status: "published", totalTime: { $lte: 30 } }).sort({ popularityScore: -1 }).limit(8).lean(),
      this.recipeModel.find({ status: "published" }).sort({ popularityScore: -1, cookCount: -1 }).limit(8).lean(),
      this.getCategories(),
      this.getCuisines(),
      this.recipeModel.find({ status: "published" }).sort({ createdAt: -1 }).limit(8).lean(),
    ]);

    return {
      whatsOnYourMind: ["Breakfast", "Lunch", "Dinner", "Healthy", "Dessert", "Quick Bites"],
      popularCuisines: cuisines.slice(0, 8),
      quickMeals,
      popularWithUsers: popular,
      categories: categories.slice(0, 12),
      discoverNew: recent,
    };
  }

  async rateRecipe(
    recipeId: string,
    userId: string,
    rating: number,
    comment?: string,
    userName?: string,
    difficultyFeedback?: string,
    wouldCookAgain?: boolean
  ) {
    const recipe = await this.recipeModel.findById(recipeId);
    if (!recipe) {
      throw new NotFoundException(`Recipe with id '${recipeId}' not found.`);
    }

    const updateDoc: any = {
      userId,
      recipeId: recipe._id,
      rating: Math.round(rating * 10) / 10,
      comment: (comment || "").trim(),
      userName: userName?.trim() || "Anonymous Cook",
    };

    if (difficultyFeedback) {
      updateDoc.difficultyFeedback = difficultyFeedback;
    } else {
      updateDoc.$unset = { ...updateDoc.$unset, difficultyFeedback: 1 };
    }

    if (wouldCookAgain !== undefined && wouldCookAgain !== null) {
      updateDoc.wouldCookAgain = Boolean(wouldCookAgain);
    } else {
      updateDoc.$unset = { ...updateDoc.$unset, wouldCookAgain: 1 };
    }

    await (this.reviewModel as any).findOneAndUpdate(
      { userId, recipeId: recipe._id },
      updateDoc,
      { upsert: true, new: true }
    );

    const stats = await this.reviewModel.aggregate([
      { $match: { recipeId: recipe._id } },
      {
        $group: {
          _id: "$recipeId",
          averageRating: { $avg: "$rating" },
          ratingCount: { $sum: 1 },
        },
      },
    ]);

    if (stats.length > 0) {
      recipe.averageRating = Math.round(stats[0].averageRating * 10) / 10;
      recipe.ratingCount = stats[0].ratingCount;
      await recipe.save();
    }

    return {
      averageRating: recipe.averageRating,
      ratingCount: recipe.ratingCount,
    };
  }

  async recordCook(recipeId: string, userId: string, durationMinutes?: number, notes?: string) {
    let recipe: any = null;
    if (mongoose.Types.ObjectId.isValid(recipeId)) {
      recipe = await this.recipeModel.findById(recipeId);
    }
    if (!recipe) {
      recipe = await this.recipeModel.findOne({ slug: recipeId });
    }
    if (!recipe) {
      recipe = await this.recipeModel.findOne({ externalId: recipeId });
    }
    if (!recipe) {
      throw new NotFoundException(`Recipe with id '${recipeId}' not found.`);
    }

    // Idempotent guard: Check for duplicate submissions within 15 seconds
    const fifteenSecondsAgo = new Date(Date.now() - 15 * 1000);
    const existingSession: any = await this.historyModel.findOne({
      userId,
      recipeId: recipe._id.toString(),
      cookedAt: { $gte: fifteenSecondsAgo },
    });

    if (existingSession) {
      const cookedDate = existingSession.cookedAt || new Date();
      return {
        success: true,
        cookCount: recipe.cookCount || 1,
        historyItem: {
          id: existingSession._id.toString(),
          recipeId: existingSession.recipeId,
          recipeTitle: existingSession.recipeName,
          cookedAt: cookedDate instanceof Date ? cookedDate.toISOString() : String(cookedDate),
          notes: existingSession.notes,
        },
      };
    }

    recipe.cookCount = (recipe.cookCount || 0) + 1;
    await recipe.save();

    const historyDoc: any = await this.historyModel.create({
      userId,
      recipeId: recipe._id.toString(),
      recipeName: recipe.name,
      recipeImage: recipe.imageUrl,
      durationMinutes: durationMinutes ?? recipe.totalTime ?? recipe.cookTime ?? undefined,
      notes: (notes || "").trim(),
    });

    const docDate = historyDoc?.cookedAt || new Date();
    return {
      success: true,
      cookCount: recipe.cookCount,
      historyItem: {
        id: historyDoc._id.toString(),
        recipeId: historyDoc.recipeId,
        recipeTitle: historyDoc.recipeName,
        cookedAt: docDate instanceof Date ? docDate.toISOString() : String(docDate),
        notes: historyDoc.notes,
      },
    };
  }

  async updateStatus(id: string, status: "draft" | "review" | "published" | "rejected") {
    const recipe = await this.recipeModel.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    );
    if (!recipe) throw new NotFoundException(`Recipe '${id}' not found.`);
    return recipe;
  }

  async updateRecipe(id: string, updates: Partial<Recipe>) {
    const recipe = await this.recipeModel.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    );
    if (!recipe) throw new NotFoundException(`Recipe '${id}' not found.`);
    return recipe;
  }
}
