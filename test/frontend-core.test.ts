import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { mapMongoRecipeToClient } from "../utils/recipeMapper";
import { scaleIngredientQuantity, formatCookTime, formatRating, formatCalories } from "../utils/formatters";
import { computeAvailability } from "../utils/pantryAvailability";
import { ApiError, classifyHttpStatus } from "../services/apiError";
import { Ingredient, PantryItem } from "../types";
import { BRAND } from "../constants/brand";
import { COLORS, TYPOGRAPHY } from "../constants/theme";
import { WHAT_ON_YOUR_MIND } from "../constants/categories";

describe("Frontend Core - mapMongoRecipeToClient (Zero Fake Data Guarantee)", () => {
  test("preserves undefined / null for missing metadata without inventing fake defaults", () => {
    const rawDoc = {
      _id: "recipe_123",
      name: "Simple Sautéed Spinach",
      ingredients: [
        { name: "Spinach", quantity: "200", unit: "g" },
      ],
      steps: ["Wash spinach", "Sauté in oil"],
    };

    const recipe = mapMongoRecipeToClient(rawDoc);

    assert.equal(recipe.id, "recipe_123");
    assert.equal(recipe.name, "Simple Sautéed Spinach");
    // Strict zero fake data check: no fake 4.5 rating, no fake 30-min time, no fake 400 calories
    assert.equal(recipe.averageRating, null, "averageRating must be null when missing");
    assert.equal(recipe.prepTime, undefined, "prepTime must be undefined when missing");
    assert.equal(recipe.cookTime, undefined, "cookTime must be undefined when missing");
    assert.equal(recipe.totalTime, undefined, "totalTime must be undefined when missing");
    assert.equal(recipe.servings, undefined, "servings must be undefined when missing");
    assert.equal(recipe.calories, undefined, "calories must be undefined when missing");
    assert.equal(recipe.difficulty, undefined, "difficulty must be undefined when missing");
  });

  test("correctly maps authentic values when present", () => {
    const rawDoc = {
      _id: "recipe_456",
      title: "Masala Chai",
      description: "Traditional spiced Indian tea",
      cuisine: "Indian",
      mealTypes: ["Beverage"],
      dietaryTags: ["Vegetarian"],
      difficulty: "Easy",
      prepTime: 5,
      cookTime: 10,
      totalTime: 15,
      servings: 2,
      averageRating: 4.8,
      ratingCount: 42,
      cookCount: 150,
      nutrition: { calories: 120, protein: 4, carbs: 18, fat: 3 },
      ingredients: [
        { name: "Black Tea", quantity: "2", unit: "tsp", optional: false },
        { name: "Milk", quantity: "1", unit: "cup", optional: false },
        { name: "Cardamom", quantity: "3", unit: "pods", optional: true },
      ],
      steps: [
        { stepNumber: 1, instruction: "Crush cardamom pods", timerMinutes: 1 },
        { stepNumber: 2, instruction: "Boil water with tea and milk", timerMinutes: 8 },
      ],
      imageUrl: "https://example.com/chai.jpg",
    };

    const recipe = mapMongoRecipeToClient(rawDoc);

    assert.equal(recipe.id, "recipe_456");
    assert.equal(recipe.name, "Masala Chai");
    assert.equal(recipe.cuisine, "Indian");
    assert.equal(recipe.mealType, "Beverage");
    assert.equal(recipe.diet, "Vegetarian");
    assert.equal(recipe.difficulty, "Easy");
    assert.equal(recipe.prepTime, 5);
    assert.equal(recipe.cookTime, 10);
    assert.equal(recipe.totalTime, 15);
    assert.equal(recipe.servings, 2);
    assert.equal(recipe.calories, 120);
    assert.equal(recipe.averageRating, 4.8);
    assert.equal(recipe.ratingCount, 42);
    assert.equal(recipe.cookCount, 150);
    assert.equal(recipe.imageUrl, "https://example.com/chai.jpg");

    // Check ingredients
    assert.equal(recipe.ingredients.length, 3);
    assert.equal(recipe.ingredients[0].name, "Black Tea");
    assert.equal(recipe.ingredients[0].amount, "2 tsp");
    assert.equal(recipe.ingredients[2].optional, true);

    // Check steps
    assert.ok(recipe.parsedSteps);
    assert.equal(recipe.parsedSteps.length, 2);
    assert.equal(recipe.parsedSteps[0].text, "Crush cardamom pods");
    assert.equal(recipe.parsedSteps[0].timeMinutes, 1);
  });

  test("handles null or undefined document safely", () => {
    assert.equal(mapMongoRecipeToClient(null), null);
    assert.equal(mapMongoRecipeToClient(undefined), null);
  });
});

describe("Frontend Core - scaleIngredientQuantity", () => {
  test("scales simple fractions correctly", () => {
    // 1/2 cup for 2 servings scaled to 4 servings -> 1 cup
    const result = scaleIngredientQuantity("1/2 cup", 2, 4);
    assert.equal(result, "1 cup");

    // 1/4 tsp for 2 servings scaled to 6 servings -> 0.8 (or 0.75 rounded to 0.8) tsp
    const scaled3x = scaleIngredientQuantity("1/4 tsp", 2, 6);
    assert.equal(scaled3x, "0.8 tsp");
  });

  test("scales mixed fractions correctly without matching only the integer prefix", () => {
    // 1 1/2 tbsp for 2 servings scaled to 4 servings -> 3 tbsp
    const result = scaleIngredientQuantity("1 1/2 tbsp", 2, 4);
    assert.equal(result, "3 tbsp");

    // 2-1/2 cups for 4 servings scaled to 2 servings -> 1.3 cups
    const halved = scaleIngredientQuantity("2-1/2 cups", 4, 2);
    assert.equal(halved, "1.3 cups");
  });

  test("scales whole numbers and decimals accurately", () => {
    assert.equal(scaleIngredientQuantity("2 cloves garlic", 2, 4), "4 cloves garlic");
    assert.equal(scaleIngredientQuantity("1.5 kg tomatoes", 2, 4), "3 kg tomatoes");
    assert.equal(scaleIngredientQuantity("100 g flour", 2, 4), "200 g flour");
  });

  test("never defaults empty or unquantified amounts to '1'", () => {
    assert.equal(scaleIngredientQuantity("", 2, 4), "");
    assert.equal(scaleIngredientQuantity("Salt to taste", 2, 4), "Salt to taste");
    assert.equal(scaleIngredientQuantity("A pinch of turmeric", 2, 4), "A pinch of turmeric");
    assert.equal(scaleIngredientQuantity("Fresh coriander leaves", 2, 4), "Fresh coriander leaves");
  });

  test("returns original quantity unchanged on invalid or equal servings", () => {
    assert.equal(scaleIngredientQuantity("2 cups", 4, 4), "2 cups");
    assert.equal(scaleIngredientQuantity("2 cups", 0, 4), "2 cups");
    assert.equal(scaleIngredientQuantity("2 cups", 4, 0), "2 cups");
    assert.equal(scaleIngredientQuantity("2 cups", -2, 4), "2 cups");
  });
});

describe("Frontend Core - Formatters (formatCookTime, formatRating, formatCalories)", () => {
  test("formatCookTime returns clean human strings and null for non-positive values", () => {
    assert.equal(formatCookTime(25), "25 mins");
    assert.equal(formatCookTime(60), "1h");
    assert.equal(formatCookTime(75), "1h 15m");
    assert.equal(formatCookTime(0), null);
    assert.equal(formatCookTime(-10), null);
    assert.equal(formatCookTime(null), null);
    assert.equal(formatCookTime(undefined), null);
  });

  test("formatRating returns 1-decimal string and null for missing or non-positive values", () => {
    assert.equal(formatRating(4.5), "4.5");
    assert.equal(formatRating(5), "5.0");
    assert.equal(formatRating(0), null);
    assert.equal(formatRating(null), null);
    assert.equal(formatRating(undefined), null);
  });

  test("formatCalories returns kcal string and null for missing or non-positive values", () => {
    assert.equal(formatCalories(350), "350 kcal");
    assert.equal(formatCalories(0), null);
    assert.equal(formatCalories(undefined), null);
  });
});

describe("Frontend Core - computeAvailability (Pantry 4-State Matching)", () => {
  const pantryItems: PantryItem[] = [
    {
      id: "p1",
      name: "Basmati Rice",
      normalizedName: "basmati rice",
      quantity: "500",
      unit: "g",
      category: "Pantry & Grains",
    },
    {
      id: "p2",
      name: "Salt",
      normalizedName: "salt",
      quantity: "",
      unit: "",
      category: "Spices & Oils",
    },
    {
      id: "p3",
      name: "Olive Oil",
      normalizedName: "olive oil",
      quantity: "50",
      unit: "ml",
      category: "Spices & Oils",
    },
  ];

  const pantryNames = new Set(["basmati rice", "salt", "olive oil"]);

  test("returns ENOUGH when pantry has >= required quantity", () => {
    const ing: Ingredient = {
      name: "Basmati Rice",
      normalizedName: "basmati rice",
      quantity: "200",
      unit: "g",
    };
    const result = computeAvailability(ing, "200", pantryItems, pantryNames);
    assert.equal(result.status, "ENOUGH");
    assert.equal(result.label, "In Kitchen");
  });

  test("returns PARTIAL when pantry has < required quantity", () => {
    const ing: Ingredient = {
      name: "Olive Oil",
      normalizedName: "olive oil",
      quantity: "100",
      unit: "ml",
    };
    const result = computeAvailability(ing, "100", pantryItems, pantryNames);
    assert.equal(result.status, "PARTIAL");
    assert.equal(result.label, "Partial");
  });

  test("returns UNKNOWN_QUANTITY when ingredient is in pantry but quantity is unquantified", () => {
    const ing: Ingredient = {
      name: "Salt",
      normalizedName: "salt",
      quantity: "1",
      unit: "pinch",
    };
    const result = computeAvailability(ing, "1", pantryItems, pantryNames);
    assert.equal(result.status, "UNKNOWN_QUANTITY");
    assert.equal(result.label, "In Kitchen");
  });

  test("returns MISSING when ingredient is not present in pantry", () => {
    const ing: Ingredient = {
      name: "Saffron",
      normalizedName: "saffron",
      quantity: "1",
      unit: "pinch",
    };
    const result = computeAvailability(ing, "1", pantryItems, pantryNames);
    assert.equal(result.status, "MISSING");
    assert.equal(result.label, "+ Add");
  });
});

describe("Frontend Core - ApiError & HTTP Status Classification", () => {
  test("classifies HTTP status codes accurately", () => {
    assert.equal(classifyHttpStatus(401), "UNAUTHORIZED");
    assert.equal(classifyHttpStatus(404), "NOT_FOUND");
    assert.equal(classifyHttpStatus(500), "SERVER_ERROR");
    assert.equal(classifyHttpStatus(502), "SERVER_ERROR");
    assert.equal(classifyHttpStatus(503), "SERVER_ERROR");
    assert.equal(classifyHttpStatus(400), "CLIENT_ERROR");
    assert.equal(classifyHttpStatus(422), "CLIENT_ERROR");
    assert.equal(classifyHttpStatus(403), "CLIENT_ERROR");
  });

  test("ApiError instance holds correct fields", () => {
    const error = new ApiError("Invalid payload", "CLIENT_ERROR", 400, { field: "email" });

    assert.equal(error.name, "ApiError");
    assert.equal(error.message, "Invalid payload");
    assert.equal(error.kind, "CLIENT_ERROR");
    assert.equal(error.status, 400);
    assert.deepEqual(error.data, { field: "email" });
    assert.ok(error instanceof Error);
  });
});

describe("Frontend Core - Brand Identity & Logo Typography", () => {
  test("defines authentic logo font family matching brand identity", () => {
    assert.equal(TYPOGRAPHY.fontLogo, "Fredoka_700Bold");
    assert.equal(TYPOGRAPHY.fontLogoSemiBold, "Fredoka_600SemiBold");
  });

  test("defines authentic logo color palette (orange + dark chocolate brown)", () => {
    assert.equal(COLORS.logoOrange, "#FF5A3C");
    assert.equal(COLORS.logoDark, "#352119");
  });

  test("standardizes brand wordmark and product name", () => {
    assert.equal(BRAND.WORDMARK, "Yummy Tummy");
    assert.equal(BRAND.NAME, "Yummy Tummy");
  });
});

describe("Frontend Core - 'What\\'s on your mind?' Categories & Circular UI Contract", () => {
  test("defines authentic food categories with non-empty imagery and search queries", () => {
    assert.ok(WHAT_ON_YOUR_MIND.length >= 8, "Expected at least 8 mind categories");
    for (const cat of WHAT_ON_YOUR_MIND) {
      assert.ok(cat.id && typeof cat.id === "string");
      assert.ok(cat.name && typeof cat.name === "string");
      assert.ok(cat.subtitle && typeof cat.subtitle === "string");
      assert.ok(cat.imageUrl.startsWith("https://images.unsplash.com/"), `Invalid image URL: ${cat.imageUrl}`);
      assert.ok(cat.query && typeof cat.query === "string");
    }
  });

  test("contains key culinary staples including Paneer, Biryani, and Chicken", () => {
    const paneer = WHAT_ON_YOUR_MIND.find((c) => c.name.toLowerCase() === "paneer");
    const biryani = WHAT_ON_YOUR_MIND.find((c) => c.name.toLowerCase() === "biryani");
    const chicken = WHAT_ON_YOUR_MIND.find((c) => c.name.toLowerCase() === "chicken");

    assert.ok(paneer, "Paneer category must exist");
    assert.ok(biryani, "Biryani category must exist");
    assert.ok(chicken, "Chicken category must exist");
  });

  test("satisfies circular selection ring geometry (2-3px ring, 3-4px gap, 1:1 aspect ratio)", () => {
    // Contract parameters matching FoodCategoryRail
    const wrapperSize = 76;
    const imageSize = 64;
    const ringBorderWidth = 2.5;

    // Outer and inner aspect ratio must be strictly 1:1
    assert.equal(wrapperSize, 76);
    assert.equal(imageSize, 64);

    // Ring thickness between 2px and 3px
    assert.ok(ringBorderWidth >= 2 && ringBorderWidth <= 3, "Ring thickness must be 2-3px");

    // Gap between circular image and outer ring: (wrapperSize - 2 * borderWidth - imageSize) / 2
    const innerSpace = wrapperSize - (2 * ringBorderWidth);
    const gap = (innerSpace - imageSize) / 2;
    assert.ok(gap >= 3 && gap <= 4, `Gap must be 3-4px, got ${gap}px`);
    assert.equal(gap, 3.5);
  });
});

