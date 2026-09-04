import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { PantryItem, PantryItemDocument } from "../../database/schemas/pantry-item.schema";
import { Recipe, RecipeDocument } from "../../database/schemas/recipe.schema";
import { IngredientsService } from "../ingredients/ingredients.service";

export interface CreatePantryItemDto {
  name: string;
  quantity?: string;
  unit?: string;
  expiryDate?: string;
  lowStock?: boolean;
}

export interface UpdatePantryItemDto {
  quantity?: string;
  unit?: string;
  expiryDate?: string;
  lowStock?: boolean;
}

@Injectable()
export class PantryService {
  constructor(
    @InjectModel(PantryItem.name) private pantryModel: Model<PantryItemDocument>,
    @InjectModel(Recipe.name) private recipeModel: Model<RecipeDocument>,
    private ingredientsService: IngredientsService
  ) {}

  async getPantryItems(userId: string) {
    const items = await this.pantryModel.find({ userId }).sort({ createdAt: -1 }).lean();

    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const runningLow = items.filter((i) => i.lowStock);
    const expiringSoon = items.filter((i) => i.expiryDate && new Date(i.expiryDate) <= threeDaysFromNow);
    const available = items.filter((i) => !i.lowStock && (!i.expiryDate || new Date(i.expiryDate) > threeDaysFromNow));
    const recentlyAdded = [...items].slice(0, 8);

    return {
      allItems: items,
      sections: {
        available,
        runningLow,
        expiringSoon,
        recentlyAdded,
      },
      counts: {
        total: items.length,
        available: available.length,
        runningLow: runningLow.length,
        expiringSoon: expiringSoon.length,
      },
    };
  }

  async addItem(userId: string, dto: CreatePantryItemDto) {
    const normalizedName = this.ingredientsService.normalizeIngredientName(dto.name);
    const expiry = dto.expiryDate ? new Date(dto.expiryDate) : undefined;

    const item = await this.pantryModel.findOneAndUpdate(
      { userId, normalizedName },
      {
        userId,
        name: dto.name.trim(),
        normalizedName,
        quantity: dto.quantity || "1",
        unit: dto.unit || "unit",
        expiryDate: expiry,
        lowStock: Boolean(dto.lowStock),
      },
      { upsert: true, new: true }
    );

    return item;
  }

  async updateItem(userId: string, id: string, dto: UpdatePantryItemDto) {
    const update: any = {};
    if (dto.quantity !== undefined) update.quantity = dto.quantity;
    if (dto.unit !== undefined) update.unit = dto.unit;
    if (dto.expiryDate !== undefined) update.expiryDate = dto.expiryDate ? new Date(dto.expiryDate) : null;
    if (dto.lowStock !== undefined) update.lowStock = dto.lowStock;

    const updated = await this.pantryModel.findOneAndUpdate(
      { _id: id, userId },
      { $set: update },
      { new: true }
    );

    if (!updated) {
      throw new NotFoundException("Pantry item not found.");
    }
    return updated;
  }

  async removeItem(userId: string, id: string) {
    const res = await this.pantryModel.findOneAndDelete({ _id: id, userId });
    if (!res) {
      throw new NotFoundException("Pantry item not found.");
    }
    return { success: true };
  }

  async getSmartSections(userId: string) {
    const pantryItems = await this.pantryModel.find({ userId }).lean();
    const pantryNames = new Set(pantryItems.map((p) => p.normalizedName.toLowerCase()));

    const recipes = await this.recipeModel.find({ status: "published" }).lean();

    const cookWithoutShopping: any[] = [];
    const missingOneIngredient: any[] = [];
    const useTheseSoon: any[] = [];

    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const expiringNames = new Set(
      pantryItems
        .filter((i) => i.expiryDate && new Date(i.expiryDate) <= threeDaysFromNow)
        .map((i) => i.normalizedName.toLowerCase())
    );

    for (const recipe of recipes) {
      const required = recipe.ingredients.filter((i) => !i.optional);
      if (required.length === 0) continue;

      let matchedCount = 0;
      const missingList: any[] = [];
      let usesExpiring = false;

      for (const req of required) {
        const reqName = req.normalizedName.toLowerCase();
        let found = false;
        for (const pName of pantryNames) {
          if (pName.includes(reqName) || reqName.includes(pName)) {
            found = true;
            break;
          }
        }

        if (found) {
          matchedCount++;
          if (expiringNames.has(reqName)) {
            usesExpiring = true;
          }
        } else {
          missingList.push(req);
        }
      }

      const matchPct = Math.round((matchedCount / required.length) * 100);

      // Cook Without Shopping: 100% matched
      if (missingList.length === 0) {
        cookWithoutShopping.push({
          ...recipe,
          matchPercentage: 100,
          missingIngredients: [],
          matchedCount,
          totalRequired: required.length,
        });
      }
      // Missing 1 Ingredient
      else if (missingList.length === 1) {
        missingOneIngredient.push({
          ...recipe,
          matchPercentage: matchPct,
          missingIngredients: missingList,
          matchedCount,
          totalRequired: required.length,
        });
      }

      // Use These Soon
      if (usesExpiring && matchedCount >= 2) {
        useTheseSoon.push({
          ...recipe,
          matchPercentage: matchPct,
          missingIngredients: missingList,
          matchedCount,
          totalRequired: required.length,
        });
      }
    }

    return {
      cookWithoutShopping: cookWithoutShopping.slice(0, 10),
      missingOneIngredient: missingOneIngredient.slice(0, 10),
      useTheseSoon: useTheseSoon.slice(0, 10),
    };
  }
}
