import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ShoppingItem, ShoppingItemDocument } from "../../database/schemas/shopping-item.schema";
import { PantryItem, PantryItemDocument } from "../../database/schemas/pantry-item.schema";
import { Recipe, RecipeDocument } from "../../database/schemas/recipe.schema";
import { IngredientsService } from "../ingredients/ingredients.service";

@Injectable()
export class ShoppingService {
  constructor(
    @InjectModel(ShoppingItem.name) private shoppingModel: Model<ShoppingItemDocument>,
    @InjectModel(PantryItem.name) private pantryModel: Model<PantryItemDocument>,
    @InjectModel(Recipe.name) private recipeModel: Model<RecipeDocument>,
    private ingredientsService: IngredientsService
  ) {}

  async getList(userId: string) {
    const items = await this.shoppingModel.find({ userId }).sort({ isChecked: 1, createdAt: -1 }).lean();
    return items;
  }

  async addItem(userId: string, name: string, quantity = "1", unit = "unit", category = "General", recipeId?: string) {
    const normalizedName = this.ingredientsService.normalizeIngredientName(name);
    return this.shoppingModel.create({
      userId,
      name: name.trim(),
      normalizedName,
      quantity,
      unit,
      category,
      recipeId,
      isChecked: false,
    });
  }

  async toggleChecked(userId: string, id: string) {
    const item = await this.shoppingModel.findOne({ _id: id, userId });
    if (!item) {
      throw new NotFoundException("Shopping item not found.");
    }
    item.isChecked = !item.isChecked;
    await item.save();
    return item;
  }

  async removeItem(userId: string, id: string) {
    await this.shoppingModel.findOneAndDelete({ _id: id, userId });
    return { success: true };
  }

  async clearChecked(userId: string) {
    await this.shoppingModel.deleteMany({ userId, isChecked: true });
    return { success: true };
  }

  async addMissingFromRecipe(userId: string, recipeId: string) {
    const recipe = await this.recipeModel.findById(recipeId).lean();
    if (!recipe) {
      throw new NotFoundException("Recipe not found.");
    }

    const pantryItems = await this.pantryModel.find({ userId }).lean();
    const pantryNormalized = new Set(pantryItems.map((p) => p.normalizedName.toLowerCase()));

    const missingIngredients = recipe.ingredients.filter((ing) => {
      if (ing.optional) return false;
      const ingNorm = ing.normalizedName.toLowerCase();
      for (const p of pantryNormalized) {
        if (p.includes(ingNorm) || ingNorm.includes(p)) return false;
      }
      return true;
    });

    const added: any[] = [];
    for (const missing of missingIngredients) {
      const item = await this.shoppingModel.create({
        userId,
        name: missing.name,
        normalizedName: missing.normalizedName,
        quantity: missing.quantity,
        unit: missing.unit,
        category: missing.category || "Produce",
        recipeId: recipe._id.toString(),
        isChecked: false,
      });
      added.push(item);
    }

    return {
      success: true,
      addedCount: added.length,
      items: added,
    };
  }

  async moveCheckedToPantry(userId: string) {
    const checked = await this.shoppingModel.find({ userId, isChecked: true }).lean();
    if (checked.length === 0) {
      return { movedCount: 0 };
    }

    for (const item of checked) {
      await this.pantryModel.findOneAndUpdate(
        { userId, normalizedName: item.normalizedName },
        {
          userId,
          name: item.name,
          normalizedName: item.normalizedName,
          quantity: item.quantity,
          unit: item.unit,
          lowStock: false,
        },
        { upsert: true }
      );
    }

    await this.shoppingModel.deleteMany({ userId, isChecked: true });

    return { movedCount: checked.length };
  }
}
