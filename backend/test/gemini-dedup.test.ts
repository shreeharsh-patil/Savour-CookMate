import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { GeminiService } from "../src/modules/gemini/gemini.service";
import { IngredientsService } from "../src/modules/ingredients/ingredients.service";

describe("GeminiService - Deterministic Hashing & Request Deduplication", () => {
  const ingredientsService = new IngredientsService(null as any);

  // Mock models for GeminiService
  const mockAiCacheModel = {} as any;
  const mockAiIngredientCacheModel = {
    findOne: () => ({
      lean: async () => null,
    }),
    findOneAndUpdate: async () => ({}),
    create: async () => {},
  } as any;
  const mockRecipeModel = {
    find: () => ({
      lean: async () => [],
    }),
    findOne: () => ({
      lean: async () => null,
    }),
  } as any;
  const mockMealDbProvider = {} as any;

  test("normalizes and sorts ingredients deterministically regardless of order or case", () => {
    const list1 = ["Onion", "chicken", "garlic "];
    const list2 = ["Garlic", "CHICKEN", "onion"];
    const list3 = ["chicken", "onion", "garlic", "onion"]; // duplicate

    const normalize = (items: string[]) =>
      Array.from(
        new Set(
          items
            .map((i) => ingredientsService.normalizeIngredientName(i))
            .filter(Boolean)
        )
      ).sort();

    const norm1 = normalize(list1);
    const norm2 = normalize(list2);
    const norm3 = normalize(list3);

    assert.deepEqual(norm1, norm2);
    assert.deepEqual(norm2, norm3);
    assert.equal(norm1.join("|"), "chicken|garlic|onion");
  });

  test("deduplicates simultaneous concurrent requests using in-memory request map", async () => {
    const service = new GeminiService(
      mockAiCacheModel,
      mockAiIngredientCacheModel,
      mockRecipeModel,
      ingredientsService,
      mockMealDbProvider
    );

    // Call cookWithWhatIHave twice simultaneously with same ingredients in different order
    const p1 = service.cookWithWhatIHave(["tomato", "paneer"]);
    const p2 = service.cookWithWhatIHave(["paneer", "tomato"]);

    // Both promises should resolve to identical results
    const [res1, res2] = await Promise.all([p1, p2]);

    assert.deepEqual(res1, res2);
    assert.equal(typeof res1.ingredientHash, "string");
    assert.equal(res1.ingredientHash.length, 64);
  });

  test("isolates cache keys strictly by dietary and allergy preferences", () => {
    const service = new GeminiService(
      mockAiCacheModel,
      mockAiIngredientCacheModel,
      mockRecipeModel,
      ingredientsService,
      mockMealDbProvider
    );

    const ing = ["pasta", "garlic", "olive oil"];

    const key1 = service.buildCanonicalCookingKey(ing, { diet: "Vegetarian" });
    const key2 = service.buildCanonicalCookingKey(ing, { diet: "Vegan" });
    const key3 = service.buildCanonicalCookingKey(ing, { diet: "Vegetarian", allergies: ["gluten"] });
    const key4 = service.buildCanonicalCookingKey(ing, { diet: "Vegetarian" }); // duplicate of key1

    // Dietary preferences change the hash
    assert.notEqual(key1.cacheKey, key2.cacheKey);

    // Allergen restrictions change the hash
    assert.notEqual(key1.cacheKey, key3.cacheKey);

    // Identical preferences produce identical hash
    assert.equal(key1.cacheKey, key4.cacheKey);
    assert.equal(key1.cacheKey.length, 64);
  });

  test("returns empty suggestions gracefully when empty ingredient list is provided", async () => {
    const service = new GeminiService(
      mockAiCacheModel,
      mockAiIngredientCacheModel,
      mockRecipeModel,
      ingredientsService,
      mockMealDbProvider
    );

    const emptyRes = await service.cookWithWhatIHave([]);
    assert.equal(emptyRes.suggestions.length, 0);
    assert.equal(emptyRes.fromCache, false);
  });
});
