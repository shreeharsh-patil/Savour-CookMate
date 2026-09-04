import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Ingredient, IngredientDocument } from "../../database/schemas/ingredient.schema";

@Injectable()
export class IngredientsService {
  constructor(
    @InjectModel(Ingredient.name) private ingredientModel: Model<IngredientDocument>
  ) {}

  async search(query: string, limit = 20) {
    if (!query || !query.trim()) {
      return this.ingredientModel.find().limit(limit).lean();
    }
    const clean = query.trim().toLowerCase();
    return this.ingredientModel
      .find({
        $or: [
          { name: { $regex: clean, $options: "i" } },
          { normalizedName: { $regex: clean, $options: "i" } },
        ],
      })
      .limit(limit)
      .lean();
  }

  normalizeIngredientName(raw: string): string {
    return raw
      .toLowerCase()
      .replace(/[0-9]+(\.[0-9]+)?(\s*(g|kg|ml|l|cup|cups|tbsp|tsp|piece|pieces|slice|slices))?/g, "")
      .replace(/\(.*?\)/g, "")
      .replace(/fresh|ripe|boneless|diced|chopped|sliced|minced|grated|peeled|toasted/g, "")
      .trim();
  }
}
