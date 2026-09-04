import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { IngredientsService } from "../src/modules/ingredients/ingredients.service";

describe("IngredientsService - Alias Resolution & Canonical Matching", () => {
  // Mock model not needed for pure normalization and alias tests
  const service = new IngredientsService(null as any);

  test("resolves canonical names correctly from regional and international synonyms", () => {
    assert.equal(service.resolveCanonical("cilantro"), "coriander");
    assert.equal(service.resolveCanonical("kothmir"), "coriander");
    assert.equal(service.resolveCanonical("dhaniya"), "coriander");
    assert.equal(service.resolveCanonical("bell pepper"), "capsicum");
    assert.equal(service.resolveCanonical("sweet pepper"), "capsicum");
    assert.equal(service.resolveCanonical("shimla mirch"), "capsicum");
    assert.equal(service.resolveCanonical("dahi"), "curd");
    assert.equal(service.resolveCanonical("greek yogurt"), "curd");
    assert.equal(service.resolveCanonical("cottage cheese"), "paneer");
    assert.equal(service.resolveCanonical("scallions"), "spring onion");
    assert.equal(service.resolveCanonical("aloo"), "potato");
    assert.equal(service.resolveCanonical("all-purpose flour"), "maida");
  });

  test("normalizes raw culinary strings removing units and culinary prep terms", () => {
    const raw1 = "2 cups fresh chopped cilantro";
    const raw2 = "500g boneless skinless chicken thighs";
    const raw3 = "1 tbsp roasted cumin seeds";

    assert.equal(service.normalizeIngredientName(raw1), "coriander");
    assert.equal(service.normalizeIngredientName(raw2), "chicken");
    assert.equal(service.normalizeIngredientName(raw3), "cumin");
  });

  test("areIngredientsMatching returns true for synonymous ingredients", () => {
    // Coriander / Cilantro
    assert.ok(service.areIngredientsMatching("fresh cilantro leaves", "coriander"));
    assert.ok(service.areIngredientsMatching("dhaniya", "cilantro"));

    // Capsicum / Bell Pepper
    assert.ok(service.areIngredientsMatching("red bell pepper", "capsicum"));
    assert.ok(service.areIngredientsMatching("shimla mirch", "sweet pepper"));

    // Curd / Yogurt
    assert.ok(service.areIngredientsMatching("plain yogurt", "curd"));
    assert.ok(service.areIngredientsMatching("greek yogurt", "dahi"));

    // Potato / Aloo
    assert.ok(service.areIngredientsMatching("russet potatoes", "aloo"));
  });

  test("areIngredientsMatching returns false for distinctly different ingredients", () => {
    assert.ok(!service.areIngredientsMatching("chicken", "paneer"));
    assert.ok(!service.areIngredientsMatching("potato", "tomato"));
    assert.ok(!service.areIngredientsMatching("milk", "garlic"));
    assert.ok(!service.areIngredientsMatching("rice", "flour"));
  });
});
