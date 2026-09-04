import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { PantryItem, PantryItemDocument } from "../../database/schemas/pantry-item.schema";
import { Recipe, RecipeDocument } from "../../database/schemas/recipe.schema";
import { IngredientsService } from "../ingredients/ingredients.service";
import { GeminiService } from "../gemini/gemini.service";

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
    private ingredientsService: IngredientsService,
    private geminiService: GeminiService
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
    const pantryItemNames = pantryItems.map((p) => p.name || p.normalizedName);

    const recipes = await this.recipeModel.find({ status: "published" }).lean();

    const cookWithoutShopping: any[] = [];
    const missingOneIngredient: any[] = [];
    const useTheseSoon: any[] = [];
    const allMatches: any[] = [];

    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const expiringItems = pantryItems.filter((i) => i.expiryDate && new Date(i.expiryDate) <= threeDaysFromNow);

    for (const recipe of recipes) {
      const required = recipe.ingredients.filter((i) => !i.optional);
      if (required.length === 0) continue;

      let matchedCount = 0;
      const missingList: any[] = [];
      let usesExpiring = false;

      for (const req of required) {
        const isMatched = pantryItemNames.some((pName) =>
          this.ingredientsService.areIngredientsMatching(pName, req.name)
        );

        if (isMatched) {
          matchedCount++;
          if (expiringItems.some((exp) => this.ingredientsService.areIngredientsMatching(exp.name, req.name))) {
            usesExpiring = true;
          }
        } else {
          missingList.push(req);
        }
      }

      const matchPct = Math.round((matchedCount / required.length) * 100);

      const recipeWithMatch = {
        ...recipe,
        matchPercentage: matchPct,
        missingIngredients: missingList,
        matchedCount,
        totalRequired: required.length,
      };

      if (matchPct > 0) {
        allMatches.push(recipeWithMatch);
      }

      // Cook Without Shopping: 100% matched
      if (missingList.length === 0) {
        cookWithoutShopping.push(recipeWithMatch);
      }
      // Missing Only One Ingredient
      else if (missingList.length === 1) {
        missingOneIngredient.push(recipeWithMatch);
      }

      // Use These Ingredients Soon
      if (usesExpiring && matchedCount >= 2) {
        useTheseSoon.push(recipeWithMatch);
      }
    }

    // Best Match: highest match percentage descending
    const bestMatch = [...allMatches].sort((a, b) => b.matchPercentage - a.matchPercentage);

    // Quickest Match: recipes with high match sorted by cook time
    const quickestMatch = [...allMatches]
      .filter((r) => r.matchPercentage >= 50)
      .sort((a, b) => (a.totalTime || a.cookTime) - (b.totalTime || b.cookTime));

    return {
      cookWithoutShopping: cookWithoutShopping.slice(0, 10),
      useTheseIngredientsSoon: useTheseSoon.slice(0, 10),
      missingOneIngredient: missingOneIngredient.slice(0, 10),
      bestMatch: bestMatch.slice(0, 10),
      quickestMatch: quickestMatch.slice(0, 10),
    };
  }

  /**
   * "Cook With What I Have"
   * Performs deterministic recipe matching first across verified recipes.
   * If user requests creative AI suggestions or if deterministic matches need additional ideas,
   * calls Gemini asynchronously and returns clearly labeled results.
   */
  async findDishesICanMake(
    userId: string,
    specificIngredients?: string[],
    includeAi = true
  ) {
    let ingredientNames: string[] = [];

    if (specificIngredients && specificIngredients.length > 0) {
      ingredientNames = specificIngredients;
    } else {
      const items = await this.pantryModel.find({ userId }).lean();
      ingredientNames = items.map((i) => i.name || i.normalizedName);
    }

    if (ingredientNames.length === 0) {
      return {
        makeNow: [],
        almostThere: [],
        goodMatch: [],
        aiSuggestions: [],
        message: "No ingredients provided. Add ingredients to your kitchen first.",
      };
    }

    const recipes = await this.recipeModel.find({ status: "published" }).lean();
    const makeNow: any[] = [];
    const almostThere: any[] = [];
    const goodMatch: any[] = [];

    for (const recipe of recipes) {
      const required = recipe.ingredients.filter((i) => !i.optional);
      if (required.length === 0) continue;

      let matched = 0;
      const matchedNames: string[] = [];
      const missingNames: string[] = [];

      for (const req of required) {
        const isAvail = ingredientNames.some((p) =>
          this.ingredientsService.areIngredientsMatching(p, req.name)
        );
        if (isAvail) {
          matched++;
          matchedNames.push(req.name);
        } else {
          missingNames.push(req.name);
        }
      }

      const matchPct = Math.round((matched / required.length) * 100);
      const enriched = {
        ...recipe,
        matchPercentage: matchPct,
        matchedIngredients: matchedNames,
        missingIngredients: missingNames,
        matchedCount: matched,
        totalRequired: required.length,
      };

      if (matchPct >= 95) {
        makeNow.push(enriched);
      } else if (missingNames.length <= 2) {
        almostThere.push(enriched);
      } else if (matchPct >= 50) {
        goodMatch.push(enriched);
      }
    }

    makeNow.sort((a, b) => b.matchPercentage - a.matchPercentage);
    almostThere.sort((a, b) => b.matchPercentage - a.matchPercentage);
    goodMatch.sort((a, b) => b.matchPercentage - a.matchPercentage);

    // Call Gemini only if requested and user has enough ingredients
    let aiSuggestions: any[] = [];
    if (includeAi) {
      try {
        const aiRes = await this.geminiService.cookWithWhatIHave(ingredientNames);
        aiSuggestions = aiRes.suggestions || [];
      } catch {
        // Fallback without failing
      }
    }

    return {
      makeNow: makeNow.slice(0, 10),
      almostThere: almostThere.slice(0, 10),
      goodMatch: goodMatch.slice(0, 10),
      aiSuggestions,
      totalMatched: makeNow.length + almostThere.length + goodMatch.length,
    };
  }
}
