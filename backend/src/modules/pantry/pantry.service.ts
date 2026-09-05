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
  category?: string;
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

    const expired = items.filter((i) => i.expiryDate && new Date(i.expiryDate) < now);
    const expiringSoon = items.filter(
      (i) => i.expiryDate && new Date(i.expiryDate) >= now && new Date(i.expiryDate) <= threeDaysFromNow
    );
    const runningLow = items.filter((i) => i.lowStock);
    const available = items.filter((i) => !i.lowStock && (!i.expiryDate || new Date(i.expiryDate) > threeDaysFromNow));
    const recentlyAdded = [...items].slice(0, 8);

    return {
      allItems: items,
      sections: {
        available,
        runningLow,
        expiringSoon,
        expired,
        recentlyAdded,
      },
      counts: {
        total: items.length,
        available: available.length,
        runningLow: runningLow.length,
        expiringSoon: expiringSoon.length,
        expired: expired.length,
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
        quantity: dto.quantity ? dto.quantity.trim() : undefined,
        unit: dto.unit ? dto.unit.trim() : undefined,
        expiryDate: expiry,
        category: dto.category ? dto.category.trim() : "Produce",
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
    const now = new Date();
    const pantryItems = await this.pantryModel.find({ userId }).lean();
    const validPantryItems = pantryItems.filter((i) => !i.expiryDate || new Date(i.expiryDate) >= now);
    const pantryItemNames = validPantryItems.map((p) => p.name || p.normalizedName);
    const normalizedPantryNames = validPantryItems
      .map((item) => item.normalizedName || this.ingredientsService.normalizeIngredientName(item.name))
      .filter(Boolean);

    if (normalizedPantryNames.length === 0) {
      return {
        cookWithoutShopping: [],
        useTheseIngredientsSoon: [],
        missingOneIngredient: [],
        bestMatch: [],
        quickestMatch: [],
      };
    }

    // Use the indexed normalized ingredient field to avoid loading and scoring
    // every published recipe for every pantry visit. The projection deliberately
    // excludes instructions/steps and other detail-only fields.
    const recipeProjection = {
      slug: 1,
      name: 1,
      imageUrl: 1,
      thumbnailUrl: 1,
      cuisine: 1,
      category: 1,
      totalTime: 1,
      cookTime: 1,
      ingredients: 1,
    };
    let recipes = await this.recipeModel
      .find({
        status: "published",
        "ingredients.normalizedName": { $in: normalizedPantryNames },
      })
      .select(recipeProjection)
      .limit(150)
      .lean();

    // Older imported recipes can lack normalized ingredients. Only use a small
    // fallback set in that case; never fall back to a full collection scan.
    if (recipes.length === 0) {
      recipes = await this.recipeModel
        .find({ status: "published" })
        .select(recipeProjection)
        .sort({ popularityScore: -1, updatedAt: -1 })
        .limit(40)
        .lean();
    }

    const cookWithoutShopping: any[] = [];
    const missingOneIngredient: any[] = [];
    const useTheseSoon: any[] = [];
    const allMatches: any[] = [];

    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const expiringItems = pantryItems.filter(
      (i) => i.expiryDate && new Date(i.expiryDate) >= now && new Date(i.expiryDate) <= threeDaysFromNow
    );

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
    includeAi = false,
    preferences: Record<string, any> = {}
  ) {
    let ingredientNames: string[] = [];

    if (specificIngredients && specificIngredients.length > 0) {
      ingredientNames = specificIngredients;
    } else {
      const now = new Date();
      const items = await this.pantryModel
        .find({
          userId,
          $or: [
            { expiryDate: { $exists: false } },
            { expiryDate: null },
            { expiryDate: { $gte: now } },
          ],
        })
        .lean();
      ingredientNames = items.map((i) => i.name || i.normalizedName);
    }

    if (ingredientNames.length === 0) {
      return {
        makeNow: [],
        almostThere: [],
        goodMatch: [],
        moreIdeas: [],
        aiSuggestions: [],
        message: "No ingredients provided. Add ingredients to your kitchen first.",
      };
    }

    // 1. Normalize and canonicalize ingredients
    const normalizedList = Array.from(
      new Set(
        ingredientNames
          .map((i) => this.ingredientsService.normalizeIngredientName(i))
          .filter(Boolean)
      )
    );

    // 2. Scalable candidate selection with index & lightweight projection
    // Avoid unbounded full-table scan and avoid pulling heavy instructions/steps
    const candidateRecipes = await this.recipeModel
      .find(
        {
          status: "published",
          "ingredients.normalizedName": { $in: normalizedList },
        },
        {
          name: 1,
          slug: 1,
          description: 1,
          imageUrl: 1,
          thumbnailUrl: 1,
          cuisine: 1,
          category: 1,
          prepTime: 1,
          cookTime: 1,
          totalTime: 1,
          servings: 1,
          dietaryTags: 1,
          difficulty: 1,
          averageRating: 1,
          ratingCount: 1,
          popularityScore: 1,
          ingredients: 1,
        }
      )
      .limit(100)
      .lean();

    // If candidate count is small (< 8), supplement with top published recipes
    let recipes = candidateRecipes;
    if (recipes.length < 8) {
      const existingIds = new Set(recipes.map((r: any) => r._id.toString()));
      const popularFallback = await this.recipeModel
        .find(
          { status: "published", _id: { $nin: Array.from(existingIds) } },
          {
            name: 1,
            slug: 1,
            description: 1,
            imageUrl: 1,
            thumbnailUrl: 1,
            cuisine: 1,
            category: 1,
            prepTime: 1,
            cookTime: 1,
            totalTime: 1,
            servings: 1,
            dietaryTags: 1,
            difficulty: 1,
            averageRating: 1,
            ratingCount: 1,
            popularityScore: 1,
            ingredients: 1,
          }
        )
        .sort({ popularityScore: -1 })
        .limit(20)
        .lean();

      recipes = [...recipes, ...popularFallback];
    }

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

      if (matchPct >= 95 || missingNames.length === 0) {
        makeNow.push(enriched);
      } else if (missingNames.length <= 2 && matchPct >= 50) {
        almostThere.push(enriched);
      } else if (matchPct >= 40) {
        goodMatch.push(enriched);
      }
    }

    makeNow.sort((a, b) => b.matchPercentage - a.matchPercentage);
    almostThere.sort((a, b) => b.matchPercentage - a.matchPercentage);
    goodMatch.sort((a, b) => b.matchPercentage - a.matchPercentage);

    // 3. Result Quality Evaluation & AI Threshold
    // If makeNow + almostThere >= 3, verified real recipes are sufficient. Do NOT call Gemini.
    const strongMatchesCount = makeNow.length + almostThere.length;
    const shouldCallGemini = strongMatchesCount < 3 && ingredientNames.length >= 2;

    let aiSuggestions: any[] = [];
    if (shouldCallGemini) {
      try {
        const aiRes = await this.geminiService.cookWithWhatIHave(ingredientNames, preferences);
        aiSuggestions = aiRes.suggestions || [];
      } catch {
        // Fallback without failing
      }
    }

    return {
      makeNow: makeNow.slice(0, 10),
      almostThere: almostThere.slice(0, 10),
      goodMatch: goodMatch.slice(0, 10),
      moreIdeas: aiSuggestions,
      aiSuggestions,
      totalMatched: makeNow.length + almostThere.length + goodMatch.length,
      aiTriggered: shouldCallGemini && aiSuggestions.length > 0,
    };
  }
}
