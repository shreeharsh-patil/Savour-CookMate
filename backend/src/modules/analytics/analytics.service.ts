import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { RecipeAnalytics, RecipeAnalyticsDocument } from "../../database/schemas/recipe-analytics.schema";
import { Recipe, RecipeDocument } from "../../database/schemas/recipe.schema";

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger("AnalyticsService");

  constructor(
    @InjectModel(RecipeAnalytics.name)
    private readonly analyticsModel: Model<RecipeAnalyticsDocument>,
    @InjectModel(Recipe.name)
    private readonly recipeModel: Model<RecipeDocument>
  ) {}

  private calculateScore(views: number, saves: number, starts: number, completions: number): number {
    return Math.round((views * 0.1 + saves * 1 + starts * 2 + completions * 3) * 10) / 10;
  }

  async recordEvent(
    recipeId: string,
    eventType: "view" | "save" | "cook_start" | "cook_complete"
  ): Promise<number> {
    if (!recipeId) return 0;

    const incField =
      eventType === "view"
        ? "recipeViews"
        : eventType === "save"
        ? "recipeSaves"
        : eventType === "cook_start"
        ? "cookingStarts"
        : "cookingCompletions";

    const doc = await this.analyticsModel.findOneAndUpdate(
      { recipeId },
      {
        $inc: { [incField]: 1 },
        $set: { lastUpdated: new Date() },
      },
      { upsert: true, new: true }
    );

    const score = this.calculateScore(
      doc.recipeViews,
      doc.recipeSaves,
      doc.cookingStarts,
      doc.cookingCompletions
    );

    doc.popularityScore = score;
    await doc.save();

    // Also synchronize popularityScore to Recipe collection for fast indexed queries
    await this.recipeModel.findByIdAndUpdate(recipeId, {
      $set: { popularityScore: score },
    });

    return score;
  }

  async getPopularRecipes(limit = 10) {
    return this.recipeModel
      .find({ status: "published" })
      .sort({ popularityScore: -1, cookCount: -1 })
      .limit(limit)
      .lean();
  }
}
