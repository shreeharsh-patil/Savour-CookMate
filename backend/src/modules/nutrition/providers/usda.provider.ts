import { Injectable, Logger } from "@nestjs/common";
import { NutritionProvider, IngredientNutritionResult } from "./nutrition-provider.interface";
import { ENV } from "../../../config/env.config";

@Injectable()
export class UsdaNutritionProvider implements NutritionProvider {
  public readonly providerName = "usda_fooddata_central";
  private readonly logger = new Logger("UsdaNutritionProvider");
  private readonly BASE_URL = "https://api.nal.usda.gov/fdc/v1";
  private readonly TIMEOUT_MS = 8000;

  async getIngredientNutrition(ingredientName: string): Promise<IngredientNutritionResult | null> {
    if (!ingredientName || !ingredientName.trim()) return null;

    const apiKey = ENV.USDA_API_KEY || "DEMO_KEY";
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

    try {
      const url = `${this.BASE_URL}/foods/search?query=${encodeURIComponent(
        ingredientName.trim()
      )}&pageSize=1&api_key=${apiKey}`;

      const res = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });
      clearTimeout(timeout);

      if (!res.ok) {
        this.logger.warn(`USDA API returned status ${res.status} for ${ingredientName}`);
        return null;
      }

      const data: any = await res.json();
      if (!data || !Array.isArray(data.foods) || data.foods.length === 0) {
        return null;
      }

      const food = data.foods[0];
      const foodNutrients = food.foodNutrients || [];

      let calories = 0;
      let protein = 0;
      let fat = 0;
      let carbs = 0;
      let fiber = 0;

      for (const fn of foodNutrients) {
        const name = (fn.nutrientName || "").toLowerCase();
        const value = Number(fn.value) || 0;

        if (name.includes("energy") && (fn.unitName?.toLowerCase() === "kcal" || fn.nutrientNumber === "208" || fn.nutrientId === 1008)) {
          calories = value;
        } else if (name.includes("protein")) {
          protein = value;
        } else if (name.includes("total lipid") || name === "fat") {
          fat = value;
        } else if (name.includes("carbohydrate")) {
          carbs = value;
        } else if (name.includes("fiber")) {
          fiber = value;
        }
      }

      return {
        fdcId: food.fdcId,
        ingredientName: food.description || ingredientName,
        servingReference: food.servingSize ? `${food.servingSize}${food.servingSizeUnit || "g"}` : "100g",
        nutrients: {
          calories: Math.round(calories),
          protein: Math.round(protein * 10) / 10,
          fat: Math.round(fat * 10) / 10,
          carbs: Math.round(carbs * 10) / 10,
          fiber: Math.round(fiber * 10) / 10,
        },
      };
    } catch (err: any) {
      clearTimeout(timeout);
      this.logger.warn(`USDA request failed for ${ingredientName}: ${err.message}`);
      return null;
    }
  }
}
