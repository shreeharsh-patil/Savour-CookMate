import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { CookingHistory, CookingHistoryDocument } from "../../database/schemas/cooking-history.schema";
import { Recipe, RecipeDocument } from "../../database/schemas/recipe.schema";

@Injectable()
export class HistoryService {
  constructor(
    @InjectModel(CookingHistory.name) private historyModel: Model<CookingHistoryDocument>,
    @InjectModel(Recipe.name) private recipeModel: Model<RecipeDocument>
  ) {}

  async getHistory(userId: string, limit = 20) {
    return this.historyModel
      .find({ userId })
      .sort({ cookedAt: -1 })
      .limit(limit)
      .lean();
  }

  async recordSession(
    userId: string,
    recipeId: string,
    recipeName: string,
    recipeImage: string,
    durationMinutes?: number,
    rating?: number,
    notes?: string
  ) {
    const record = await this.historyModel.create({
      userId,
      recipeId,
      recipeName,
      recipeImage,
      durationMinutes: durationMinutes || 30,
      rating,
      notes: notes || "",
    });

    // Increment recipe cookCount
    await this.recipeModel.findByIdAndUpdate(recipeId, { $inc: { cookCount: 1 } });

    return record;
  }
}
