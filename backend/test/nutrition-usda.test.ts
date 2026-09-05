import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { NutritionService } from "../src/modules/nutrition/nutrition.service";
import { IngredientsService } from "../src/modules/ingredients/ingredients.service";

describe("NutritionService & USDA Provider - Estimated Nutrition", () => {
  // Mock NutritionProvider that simulates USDA FDC responses
  const mockUsdaProvider = {
    providerName: "usda_fooddata_central",
    getIngredientNutrition: async (name: string) => {
      const lower = name.toLowerCase();
      if (lower.includes("chicken")) {
        return {
          fdcId: 171477,
          ingredientName: "Chicken breast, raw",
          servingReference: "100g",
          nutrients: {
            calories: 165,
            protein: 31,
            fat: 3.6,
            carbs: 0,
            fiber: 0,
          },
        };
      }
      if (lower.includes("rice")) {
        return {
          fdcId: 168878,
          ingredientName: "White rice, long grain",
          servingReference: "100g",
          nutrients: {
            calories: 130,
            protein: 2.7,
            fat: 0.3,
            carbs: 28,
            fiber: 0.4,
          },
        };
      }
      return null;
    },
  };

  // Mock NutritionCache model
  const mockNutritionCacheModel = {
    findOne: () => ({
      lean: async () => null,
    }),
    findOneAndUpdate: async () => {},
  };

  test("calculates estimated recipe nutrition and labels output as 'Estimated nutrition'", async () => {
    // Mock Recipe model
    const mockRecipeModel = {
      findById: () => ({
        lean: async () => ({
          _id: "test-rec-1",
          name: "Chicken and Rice Bowl",
          servings: 2,
          ingredients: [
            { name: "chicken breast", quantity: "200", unit: "g" },
            { name: "white rice", quantity: "200", unit: "g" },
          ],
        }),
      }),
    };

    const service = new NutritionService(
      mockNutritionCacheModel as any,
      mockRecipeModel as any,
      mockUsdaProvider as any,
      new IngredientsService(null as any)
    );

    const result = await service.estimateRecipeNutrition("test-rec-1");

    assert.ok(result);
    assert.equal(result?.isEstimated, true);
    assert.equal(result?.label, "Estimated nutrition");
    assert.ok(result?.disclaimer.includes("USDA FoodData"));

    // Expected per serving calculation:
    // Chicken (200g = 2 * 165 cal = 330) + Rice (200g = 2 * 130 cal = 260) = 590 total calories
    // 590 total calories / 2 servings = ~295 calories per serving
    assert.equal(result?.perServing?.calories, 295);

    // Protein: (2 * 31 = 62) + (2 * 2.7 = 5.4) = 67.4 / 2 = 33.7g
    assert.equal(result?.perServing?.protein, 33.7);

    // Carbs: (2 * 0 = 0) + (2 * 28 = 56) = 56 / 2 = 28g
    assert.equal(result?.perServing?.carbs, 28);
  });

  test("returns perServingUnavailable: true and perServing: null when recipe servings is unknown", async () => {
    const mockRecipeModel = {
      findById: () => ({
        lean: async () => ({
          _id: "test-rec-unknown-servings",
          name: "Chicken Bowl",
          servings: undefined,
          ingredients: [
            { name: "chicken breast", quantity: "200", unit: "g" },
          ],
        }),
      }),
    };

    const service = new NutritionService(
      mockNutritionCacheModel as any,
      mockRecipeModel as any,
      mockUsdaProvider as any,
      new IngredientsService(null as any)
    );

    const result = await service.estimateRecipeNutrition("test-rec-unknown-servings");

    assert.ok(result);
    assert.equal(result?.isEstimated, true);
    assert.equal(result?.perServingUnavailable, true);
    assert.equal(result?.perServing, null);
    assert.ok(result?.totalDish);
    assert.equal(result?.totalDish?.calories, 330);
    assert.equal(result?.totalDish?.protein, 62);
  });

  test("falls back gracefully when USDA has no matches or recipe is unknown", async () => {
    const mockRecipeModel = {
      findById: () => ({
        lean: async () => null,
      }),
    };

    const service = new NutritionService(
      mockNutritionCacheModel as any,
      mockRecipeModel as any,
      mockUsdaProvider as any,
      new IngredientsService(null as any)
    );

    const notFound = await service.estimateRecipeNutrition("non-existent");
    assert.equal(notFound, null);
  });
});
