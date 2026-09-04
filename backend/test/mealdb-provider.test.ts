import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { MealDbRecipeProvider } from "../src/modules/recipes/providers/mealdb.provider";

describe("MealDbRecipeProvider - Meal Normalization & Step Extraction", () => {
  const provider = new MealDbRecipeProvider();

  test("normalizes a MealDB API object into a NormalizedRecipe with ingredients and steps", () => {
    const rawMeal = {
      idMeal: "52772",
      strMeal: "Teriyaki Chicken Casserole",
      strCategory: "Chicken",
      strArea: "Japanese",
      strInstructions:
        "Preheat oven to 350 degrees F.\r\nStir soy sauce, brown sugar, and garlic in a small saucepan.\r\nBake for 30 minutes until golden brown.\r\nLet stand for 5 minutes before serving.",
      strMealThumb: "https://www.themealdb.com/images/media/meals/wvpsxx1468256321.jpg",
      strTags: "Meat,Casserole",
      strYoutube: "https://www.youtube.com/watch?v=4aZr5hZXP_s",
      strIngredient1: "soy sauce",
      strIngredient2: "water",
      strIngredient3: "brown sugar",
      strIngredient4: "ground ginger",
      strIngredient5: "minced garlic",
      strIngredient6: "cornstarch",
      strIngredient7: "chicken breasts",
      strIngredient8: "",
      strIngredient9: null,
      strMeasure1: "3/4 cup",
      strMeasure2: "1/2 cup",
      strMeasure3: "1/4 cup",
      strMeasure4: "1/2 tsp",
      strMeasure5: "1/2 tsp",
      strMeasure6: "2 tbsp",
      strMeasure7: "2 pounds",
      strMeasure8: "",
      strMeasure9: null,
    };

    const normalized = provider.normalizeMeal(rawMeal);

    assert.equal(normalized.externalId, "52772");
    assert.equal(normalized.name, "Teriyaki Chicken Casserole");
    assert.equal(normalized.category, "Chicken");
    assert.equal(normalized.cuisine, "Japanese");
    assert.equal(normalized.youtubeUrl, "https://www.youtube.com/watch?v=4aZr5hZXP_s");
    assert.equal(normalized.youtubeVideoId, "4aZr5hZXP_s");
    assert.equal(normalized.sourceUrl, undefined); // strSource was not in rawMeal, must NOT use strYoutube
    assert.ok(normalized.dietaryTags.includes("Non-Vegetarian"));

    // Ingredients parsing
    assert.equal(normalized.ingredients.length, 7);
    assert.equal(normalized.ingredients[0].name, "soy sauce");
    assert.equal(normalized.ingredients[0].quantity, "3/4");
    assert.equal(normalized.ingredients[0].unit, "cup");

    assert.equal(normalized.ingredients[6].name, "chicken breasts");
    assert.equal(normalized.ingredients[6].quantity, "2");
    assert.equal(normalized.ingredients[6].unit, "pounds");

    // Steps & Timer parsing
    assert.equal(normalized.instructions.length, 4);
    assert.equal(normalized.steps.length, 4);
    assert.equal(normalized.steps[0].stepNumber, 1);

    // Step 3 mentions "30 minutes"
    const step3 = normalized.steps.find((s) => s.instruction.includes("30 minutes"));
    assert.ok(step3);
    assert.equal(step3?.timerMinutes, 30);

    // Step 4 mentions "5 minutes"
    const step4 = normalized.steps.find((s) => s.instruction.includes("5 minutes"));
    assert.ok(step4);
    assert.equal(step4?.timerMinutes, 5);
  });

  test("handles vegetarian and vegan category tagging correctly", () => {
    const veganMeal = {
      idMeal: "52955",
      strMeal: "Vegan Lasagna",
      strCategory: "Vegan",
      strArea: "Italian",
      strInstructions: "Assemble layers and bake.",
      strIngredient1: "Spinach",
      strMeasure1: "200g",
    };

    const normalized = provider.normalizeMeal(veganMeal);
    assert.ok(normalized.dietaryTags.includes("Vegan"));
    assert.ok(normalized.dietaryTags.includes("Vegetarian"));

    const vegMeal = {
      idMeal: "52812",
      strMeal: "Vegetarian Casserole",
      strCategory: "Vegetarian",
      strArea: "British",
      strInstructions: "Mix vegetables and bake.",
      strIngredient1: "Carrot",
      strMeasure1: "2 units",
    };

    const normalizedVeg = provider.normalizeMeal(vegMeal);
    assert.ok(normalizedVeg.dietaryTags.includes("Vegetarian"));
    assert.ok(!normalizedVeg.dietaryTags.includes("Non-Vegetarian"));
  });

  test("handles empty or sparse meal input gracefully without throwing errors", () => {
    const sparseMeal = {
      idMeal: "99999",
      strMeal: "Simple Toast",
      strInstructions: "",
    };

    const normalized = provider.normalizeMeal(sparseMeal);
    assert.equal(normalized.name, "Simple Toast");
    assert.equal(normalized.ingredients.length, 0);
    assert.equal(normalized.instructions.length, 0);
    assert.equal(normalized.cookTime, undefined);
    assert.equal(normalized.prepTime, undefined);
  });
});
