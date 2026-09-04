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

  private mapToStandardCategory(cat: string): string {
    const lower = (cat || "").toLowerCase();
    if (/produce|veg|herb|greens/i.test(lower)) return "Vegetables";
    if (/meat|poultry|chicken|fish|seafood|protein|egg|lentil|dal/i.test(lower)) return "Protein";
    if (/dairy|milk|cheese|paneer|curd|butter|yogurt|cream/i.test(lower)) return "Dairy";
    if (/spice|masala|\boil\b|salt|chilli|herb/i.test(lower)) return "Spices";
    if (/grain|rice|pasta|flour|bread|cereal/i.test(lower)) return "Grains";
    return "Other";
  }

  async addItem(userId: string, name: string, quantity = "1", unit = "unit", category = "Other", recipeId?: string) {
    const normalizedName = this.ingredientsService.normalizeIngredientName(name);
    const standardCategory = this.mapToStandardCategory(category);

    // Prevent duplicate items
    const existing = await this.shoppingModel.findOne({ userId, normalizedName });
    if (existing) {
      // If item already exists, update quantity
      const existingNum = parseFloat(existing.quantity);
      const incomingNum = parseFloat(quantity);
      if (!isNaN(existingNum) && !isNaN(incomingNum)) {
        existing.quantity = (existingNum + incomingNum).toString();
      }
      existing.isChecked = false; // Re-activate
      if (recipeId && !existing.recipeId) existing.recipeId = recipeId;
      await existing.save();
      return existing;
    }

    return this.shoppingModel.create({
      userId,
      name: name.trim(),
      normalizedName,
      quantity,
      unit,
      category: standardCategory,
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
    const pantryItemNames = pantryItems.map((p) => p.name || p.normalizedName);

    const missingIngredients = recipe.ingredients.filter((ing) => {
      if (ing.optional) return false;
      return !pantryItemNames.some((pName) =>
        this.ingredientsService.areIngredientsMatching(pName, ing.name)
      );
    });

    const addedOrUpdated: any[] = [];
    for (const missing of missingIngredients) {
      const item = await this.addItem(
        userId,
        missing.name,
        missing.quantity,
        missing.unit,
        this.mapToStandardCategory(missing.category || "Produce"),
        recipe._id.toString()
      );
      addedOrUpdated.push(item);
    }

    return {
      success: true,
      addedCount: addedOrUpdated.length,
      items: addedOrUpdated,
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
