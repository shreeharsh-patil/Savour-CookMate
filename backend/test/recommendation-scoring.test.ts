import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { RecommendationsService } from "../src/modules/recommendations/recommendations.service";
import { IngredientsService } from "../src/modules/ingredients/ingredients.service";

describe("RecommendationsService - Scoring & Strict Safety Filters", () => {
  const ingredientsService = new IngredientsService(null as any);

  // Mock repositories to return controlled test datasets
  const mockRecipeModel = {
    find: (query: any) => ({
      lean: async () => [
        {
          _id: "rec_1",
          name: "Paneer Butter Masala",
          title: "Paneer Butter Masala",
          cuisine: "North Indian",
          dietaryTags: ["vegetarian"],
          allergens: ["dairy"],
          totalTime: 30,
          difficulty: "Medium",
          cookCount: 45,
          ingredients: [
            { name: "paneer", amount: "200g", optional: false },
            { name: "tomato", amount: "3", optional: false },
            { name: "butter", amount: "2 tbsp", optional: false },
            { name: "garam masala", amount: "1 tsp", optional: false },
          ],
        },
        {
          _id: "rec_2",
          name: "Chicken Biryani",
          title: "Chicken Biryani",
          cuisine: "Hyderabadi",
          dietaryTags: ["non-vegetarian"],
          allergens: [],
          totalTime: 60,
          difficulty: "Advanced",
          cookCount: 80,
          ingredients: [
            { name: "chicken", amount: "500g", optional: false },
            { name: "basmati rice", amount: "2 cups", optional: false },
            { name: "onion", amount: "2", optional: false },
          ],
        },
        {
          _id: "rec_3",
          name: "Peanut Pad Thai",
          title: "Peanut Pad Thai",
          cuisine: "Thai",
          dietaryTags: ["vegetarian"],
          allergens: ["peanut", "peanuts", "nuts"],
          totalTime: 25,
          difficulty: "Easy",
          cookCount: 20,
          ingredients: [
            { name: "rice noodles", amount: "200g", optional: false },
            { name: "crushed peanuts", amount: "50g", optional: false },
            { name: "tofu", amount: "150g", optional: false },
          ],
        },
      ],
    }),
  };

  const mockPantryModel = {
    find: () => ({
      lean: async () => [
        { name: "cottage cheese" }, // paneer alias
        { name: "tomatoes" },       // tomato alias
        { name: "makhan" },         // butter alias
      ],
    }),
  };

  const mockUserPrefModel = {
    findOne: (query: any) => ({
      lean: async () => {
        if (query.userId === "user_peanut_allergic") {
          return {
            diet: "vegetarian",
            dietaryRestrictions: ["vegetarian"],
            allergies: ["peanut"],
            favoriteCuisines: ["Thai", "North Indian"],
            cookingSkill: "Medium",
            maximumCookingTime: 45,
          };
        }
        if (query.userId === "user_strict_vegetarian") {
          return {
            diet: "vegetarian",
            dietaryRestrictions: ["vegetarian"],
            allergies: [],
            favoriteCuisines: ["North Indian"],
            cookingSkill: "Medium",
            maximumCookingTime: 45,
          };
        }
        // Default omnivore
        return {
          dietaryRestrictions: [],
          allergies: [],
          favoriteCuisines: ["North Indian", "Hyderabadi"],
          cookingSkill: "Medium",
          maximumCookingTime: 60,
        };
      },
    }),
  };

  const mockHistoryModel = {
    find: () => ({
      sort: () => ({
        limit: () => ({
          lean: async () => [],
        }),
      }),
    }),
  };

  const mockEventModel = {
    create: async () => ({}),
  };

  const service = new RecommendationsService(
    mockRecipeModel as any,
    mockPantryModel as any,
    mockUserPrefModel as any,
    mockHistoryModel as any,
    mockEventModel as any,
    ingredientsService
  );

  test("Strict Safety Filter: Excludes any recipe with allergen conflict", async () => {
    const result = await service.getRecommendations("user_peanut_allergic");

    // Peanut Pad Thai MUST NEVER be returned to peanut allergic user
    const hasPeanutRecipe = result.topRecommendations.some((item) =>
      item.recipe.title.toLowerCase().includes("peanut") ||
      (item.recipe.allergens || []).includes("peanut")
    );

    assert.equal(hasPeanutRecipe, false, "Allergen-conflicted recipe was not excluded!");
  });

  test("Strict Safety Filter: Excludes non-vegetarian recipes for vegetarian user", async () => {
    const result = await service.getRecommendations("user_strict_vegetarian");

    const hasNonVegRecipe = result.topRecommendations.some((item) =>
      item.recipe.dietaryTags?.includes("non-vegetarian")
    );

    assert.equal(hasNonVegRecipe, false, "Non-vegetarian dish was returned to a vegetarian user!");
  });

  test("Alias matching identifies missing vs matched ingredients correctly", async () => {
    const result = await service.getRecommendations("user_strict_vegetarian");

    const paneerDish = result.topRecommendations.find((item) => item.recipe.title === "Paneer Butter Masala");
    assert.ok(paneerDish, "Paneer dish should be included");

    // 3 out of 4 ingredients match (paneer, tomato, butter from cottage cheese, tomatoes, makhan)
    // Only garam masala is missing
    assert.equal(paneerDish.missingIngredients.length, 1);
    assert.equal(paneerDish.missingIngredients[0], "garam masala");
    assert.ok(paneerDish.explanation.includes("Only missing garam masala"));
  });
});
