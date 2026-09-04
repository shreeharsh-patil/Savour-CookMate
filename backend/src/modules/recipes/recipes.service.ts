import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Recipe, RecipeDocument } from "../../database/schemas/recipe.schema";
import { Review, ReviewDocument } from "../../database/schemas/review.schema";
import { CookingHistory, CookingHistoryDocument } from "../../database/schemas/cooking-history.schema";

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
  constructor(
    @InjectModel(Recipe.name) private recipeModel: Model<RecipeDocument>,
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    @InjectModel(CookingHistory.name) private historyModel: Model<CookingHistoryDocument>,
  ) {}

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
      query.cuisine = { $regex: new RegExp(`^${cuisine}$`, "i") };
    }

    if (mealType && mealType.toLowerCase() !== "all") {
      query.mealTypes = { $in: [new RegExp(mealType, "i")] };
    }

    if (diet && diet.toLowerCase() !== "all") {
      query.dietaryTags = { $in: [new RegExp(diet, "i")] };
    }

    if (difficulty && difficulty.toLowerCase() !== "all") {
      query.difficulty = difficulty;
    }

    if (maxTime && maxTime > 0) {
      query.totalTime = { $lte: Number(maxTime) };
    }

    if (search && search.trim()) {
      query.$text = { $search: search.trim() };
    }

    let sortObj: any = { cookCount: -1 };
    if (sort === "rating") {
      sortObj = { averageRating: -1, ratingCount: -1 };
    } else if (sort === "time") {
      sortObj = { totalTime: 1 };
    } else if (sort === "newest") {
      sortObj = { createdAt: -1 };
    }

    const skip = (Math.max(1, page) - 1) * Math.min(50, limit);
    const take = Math.min(50, limit);

    const [recipes, total] = await Promise.all([
      this.recipeModel.find(query).sort(sortObj).skip(skip).limit(take).lean(),
      this.recipeModel.countDocuments(query),
    ]);

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

  async findById(id: string) {
    let recipe = await this.recipeModel.findById(id).lean();
    if (!recipe) {
      recipe = await this.recipeModel.findOne({ slug: id }).lean();
    }
    if (!recipe) {
      throw new NotFoundException(`Recipe with id or slug '${id}' not found.`);
    }

    // Fetch real reviews for this recipe
    const reviews = await this.reviewModel
      .find({ recipeId: recipe._id as any })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Fetch 4 similar recipes from the same cuisine or meal type
    const similar = await this.recipeModel
      .find({
        _id: { $ne: recipe._id },
        cuisine: recipe.cuisine,
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

    // Save or update real review
    await this.reviewModel.findOneAndUpdate(
      { userId, recipeId },
      {
        userId,
        recipeId,
        rating,
        comment: comment || "",
        userName: userName || "Home Cook",
        difficultyFeedback: difficultyFeedback || "Just Right",
        wouldCookAgain: wouldCookAgain !== undefined ? wouldCookAgain : true,
      },
      { upsert: true, new: true }
    );

    // Compute actual real aggregate rating from user reviews
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
    const recipe = await this.recipeModel.findById(recipeId);
    if (!recipe) {
      throw new NotFoundException(`Recipe with id '${recipeId}' not found.`);
    }

    recipe.cookCount = (recipe.cookCount || 0) + 1;
    await recipe.save();

    await this.historyModel.create({
      userId,
      recipeId: recipe._id as any,
      recipeName: recipe.name,
      recipeImage: recipe.imageUrl,
      durationMinutes: durationMinutes || recipe.cookTime,
      notes: notes || "",
    });

    return { success: true, cookCount: recipe.cookCount };
  }

  // Protected Admin / Content Quality Methods
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
