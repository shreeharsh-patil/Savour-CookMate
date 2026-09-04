import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { ShoppingService } from "../src/modules/shopping/shopping.service";
import { IngredientsService } from "../src/modules/ingredients/ingredients.service";

describe("ShoppingService - Deduplication & Category Grouping", () => {
  const ingredientsService = new IngredientsService(null as any);

  // In-memory mock storage simulating MongoDB ShoppingItem collection
  const mockStorage: any[] = [];

  const mockShoppingModel = {
    find: (query: any) => ({
      sort: () => ({
        lean: async () => mockStorage.filter((item) => item.userId === query.userId),
      }),
    }),
    findOne: async (query: any) => {
      const found = mockStorage.find(
        (item) => item.userId === query.userId && item.normalizedName === query.normalizedName
      );
      if (!found) return null;
      return {
        ...found,
        save: async function () {
          const idx = mockStorage.findIndex((i) => i === found);
          if (idx >= 0) {
            mockStorage[idx] = this;
          }
        },
      };
    },
    create: async (doc: any) => {
      const record = { ...doc, _id: `item_${Date.now()}_${Math.random()}` };
      mockStorage.push(record);
      return record;
    },
  };

  const service = new ShoppingService(
    mockShoppingModel as any,
    null as any,
    null as any,
    ingredientsService
  );

  test("Standard category grouping maps produce, dairy, spices, protein, grains accurately", () => {
    // Testing private mapper via any cast
    const mapper = (service as any).mapToStandardCategory.bind(service);

    assert.equal(mapper("Fresh Produce"), "Vegetables");
    assert.equal(mapper("fresh greens"), "Vegetables");
    assert.equal(mapper("chicken breast"), "Protein");
    assert.equal(mapper("lentil / dal"), "Protein");
    assert.equal(mapper("heavy cream"), "Dairy");
    assert.equal(mapper("butter"), "Dairy");
    assert.equal(mapper("garam masala"), "Spices");
    assert.equal(mapper("chilli powder"), "Spices");
    assert.equal(mapper("basmati rice"), "Grains");
    assert.equal(mapper("pasta / noodles"), "Grains");
    assert.equal(mapper("aluminum foil"), "Other");
  });

  test("Deduplicates items and sums numeric quantities instead of duplicating rows", async () => {
    mockStorage.length = 0; // Reset storage

    // First addition: 1 bell pepper
    await service.addItem("user_123", "Bell Pepper", "1", "piece", "produce");
    assert.equal(mockStorage.length, 1);
    assert.equal(mockStorage[0].quantity, "1");
    assert.equal(mockStorage[0].category, "Vegetables");

    // Second addition: 2 bell peppers (same normalized name 'capsicum')
    await service.addItem("user_123", "bell pepper", "2", "piece", "produce");

    // Must still have only 1 item in list, with quantity updated to 3
    assert.equal(mockStorage.length, 1, "Duplicate row was created instead of merging!");
    assert.equal(mockStorage[0].quantity, "3");
    assert.equal(mockStorage[0].isChecked, false);
  });

  test("Distinguishes different ingredients into distinct entries", async () => {
    // Adding another different ingredient
    await service.addItem("user_123", "Basmati Rice", "1", "kg", "grain");

    assert.equal(mockStorage.length, 2);
    assert.equal(mockStorage[1].category, "Grains");
  });
});
