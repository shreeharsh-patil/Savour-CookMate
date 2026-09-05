import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { NutritionCache, NutritionCacheDocument } from "../../database/schemas/nutrition-cache.schema";
import { Recipe, RecipeDocument } from "../../database/schemas/recipe.schema";
import { UsdaNutritionProvider } from "./providers/usda.provider";
import { IngredientsService } from "../ingredients/ingredients.service";

import { convertToGrams } from "./nutrition-converter";

export interface EstimatedRecipeNutrition {
  isEstimated: boolean;
  unavailable?: boolean;
  perServingUnavailable?: boolean;
  label: "Estimated nutrition" | "Nutrition unavailable";
  confidence?: "high" | "medium" | "low" | "none";
  disclaimer: string;
  perServing?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  } | null;
  totalDish: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
}

@Injectable()
export class NutritionService {
  private readonly logger = new Logger("NutritionService");

  constructor(
    @InjectModel(NutritionCache.name)
    private readonly cacheModel: Model<NutritionCacheDocument>,
    @InjectModel(Recipe.name)
    private readonly recipeModel: Model<RecipeDocument>,
    private readonly usdaProvider: UsdaNutritionProvider,
    private readonly ingredientsService: IngredientsService
  ) {}

  async getIngredientNutrition(ingredient: string) {
    if (!ingredient || !ingredient.trim()) return null;
    const normalized = this.ingredientsService.normalizeIngredientName(ingredient);

    // 1. Check MongoDB Cache
    const cached = await this.cacheModel.findOne({ normalizedIngredient: normalized }).lean();
    if (cached && cached.expiresAt > new Date()) {
      return {
        normalizedIngredient: cached.normalizedIngredient,
        fdcId: cached.fdcId,
        nutrients: cached.nutrients,
        servingReference: cached.servingReference,
      };
    }

    // 2. Fetch from USDA
    const fetched = await this.usdaProvider.getIngredientNutrition(normalized || ingredient);
    if (!fetched) {
      return null;
    }

    // 3. Cache with 30 days TTL
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await this.cacheModel.findOneAndUpdate(
      { normalizedIngredient: normalized },
      {
        normalizedIngredient: normalized,
        fdcId: fetched.fdcId,
        nutrients: fetched.nutrients,
        servingReference: fetched.servingReference,
        fetchedAt: new Date(),
        expiresAt,
      },
      { upsert: true }
    );

    return {
      normalizedIngredient: normalized,
      fdcId: fetched.fdcId,
      nutrients: fetched.nutrients,
      servingReference: fetched.servingReference,
    };
  }

  async estimateRecipeNutrition(recipeId: string): Promise<EstimatedRecipeNutrition | null> {
    const recipe = await this.recipeModel.findById(recipeId).lean();
    if (!recipe) return null;

    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalFiber = 0;

    const ingredients = recipe.ingredients || [];
    const hasServings = typeof recipe.servings === "number" && recipe.servings > 0;
    const servings = hasServings ? recipe.servings : null;

    let convertedCount = 0;
    const requiredIngredients = ingredients.filter((i) => !i.optional);
    const totalCount = requiredIngredients.length || ingredients.length;

    // If recipe already has manual/stored nutrition, use that
    if (recipe.nutrition && (recipe.nutrition.calories > 0 || recipe.nutrition.protein > 0)) {
      totalCalories = servings ? recipe.nutrition.calories * servings : recipe.nutrition.calories;
      totalProtein = servings ? (recipe.nutrition.protein || 0) * servings : (recipe.nutrition.protein || 0);
      totalCarbs = servings ? (recipe.nutrition.carbs || 0) * servings : (recipe.nutrition.carbs || 0);
      totalFat = servings ? (recipe.nutrition.fat || 0) * servings : (recipe.nutrition.fat || 0);
      totalFiber = servings ? (recipe.nutrition.fiber || 0) * servings : (recipe.nutrition.fiber || 0);
      convertedCount = totalCount;
    } else {
      // Estimate by converting all recipe ingredients through USDA FoodData reference grams
      for (const ing of ingredients) {
        const nut = await this.getIngredientNutrition(ing.name);
        if (nut) {
          const conversion = convertToGrams(ing.name, ing.quantity, ing.unit);
          if (conversion.grams !== null && conversion.grams > 0) {
            convertedCount++;
            const factor = conversion.grams / 100; // USDA nutrition reference is per 100g
            totalCalories += nut.nutrients.calories * factor;
            totalProtein += nut.nutrients.protein * factor;
            totalCarbs += nut.nutrients.carbs * factor;
            totalFat += nut.nutrients.fat * factor;
            totalFiber += nut.nutrients.fiber * factor;
          }
        }
      }
    }

    if (totalCalories === 0) {
      // If USDA nutrition is unavailable, do NOT invent fake numbers. Return unavailable status!
      return {
        isEstimated: false,
        unavailable: true,
        label: "Nutrition unavailable",
        confidence: "none",
        disclaimer: "USDA nutritional information is currently unavailable for this recipe.",
        perServingUnavailable: true,
        perServing: null,
        totalDish: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
      };
    }

    const ratio = totalCount > 0 ? convertedCount / totalCount : 0;
    const confidence = ratio >= 0.8 ? "high" : ratio >= 0.5 ? "medium" : "low";

    const perServing = servings
      ? {
          calories: Math.round(totalCalories / servings),
          protein: Math.round((totalProtein / servings) * 10) / 10,
          carbs: Math.round((totalCarbs / servings) * 10) / 10,
          fat: Math.round((totalFat / servings) * 10) / 10,
          fiber: Math.round((totalFiber / servings) * 10) / 10,
        }
      : null;

    return {
      isEstimated: true,
      unavailable: false,
      label: "Estimated nutrition",
      confidence,
      disclaimer: servings
        ? "Estimated values based on standard USDA FoodData ingredient reference data. Not medical advice."
        : "Estimated total recipe values based on USDA FoodData. Per-serving values unavailable because serving count is unknown.",
      perServingUnavailable: !servings,
      perServing,
      totalDish: {
        calories: Math.round(totalCalories),
        protein: Math.round(totalProtein * 10) / 10,
        carbs: Math.round(totalCarbs * 10) / 10,
        fat: Math.round(totalFat * 10) / 10,
        fiber: Math.round(totalFiber * 10) / 10,
      },
    };
  }
}
