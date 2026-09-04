import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  parseCulinaryQuantity,
  convertToGrams,
  COUNT_WEIGHT_MAPPINGS,
} from "../src/modules/nutrition/nutrition-converter";

describe("Scientific Nutrition Converter - Culinary Units & Density", () => {
  test("parses whole numbers, decimals, fractions, mixed numbers, and ranges", () => {
    assert.equal(parseCulinaryQuantity("2"), 2);
    assert.equal(parseCulinaryQuantity("0.5"), 0.5);
    assert.equal(parseCulinaryQuantity("1/2"), 0.5);
    assert.equal(parseCulinaryQuantity("3/4"), 0.75);
    assert.equal(parseCulinaryQuantity("1 1/2"), 1.5);
    assert.equal(parseCulinaryQuantity("2 1/4"), 2.25);
    assert.equal(parseCulinaryQuantity("1-2"), 1.5); // Midpoint of range
    assert.equal(parseCulinaryQuantity(""), null);
    assert.equal(parseCulinaryQuantity(undefined), null);
    assert.equal(parseCulinaryQuantity(null), null);
  });

  test("converts standard mass units to grams accurately", () => {
    assert.equal(convertToGrams("flour", "500", "g").grams, 500);
    assert.equal(convertToGrams("sugar", "1", "kg").grams, 1000);
    assert.equal(convertToGrams("salt", "2000", "mg").grams, 2);
    assert.equal(convertToGrams("butter", "1", "lb").grams, 453.6);
    assert.equal(convertToGrams("cheese", "8", "oz").grams, 226.8);
  });

  test("converts volumetric culinary units to gram equivalents", () => {
    // 1 cup = 240g
    assert.equal(convertToGrams("milk", "1", "cup").grams, 240);
    assert.equal(convertToGrams("water", "2", "cups").grams, 480);
    assert.equal(convertToGrams("water", "1/2", "cup").grams, 120);

    // 1 tbsp = 15g, 1 tsp = 5g
    assert.equal(convertToGrams("olive oil", "2", "tbsp").grams, 30);
    assert.equal(convertToGrams("baking powder", "1", "tsp").grams, 5);
    assert.equal(convertToGrams("vanilla", "1 1/2", "tsp").grams, 7.5);

    // Metric volume
    assert.equal(convertToGrams("broth", "250", "ml").grams, 250);
    assert.equal(convertToGrams("water", "1", "liter").grams, 1000);
  });

  test("converts count-based produce and proteins using scientific empirical averages", () => {
    // Egg = 50g
    const twoEggs = convertToGrams("large egg", "2", "pieces");
    assert.equal(twoEggs.grams, 100);
    assert.equal(twoEggs.confidence, "count_estimate");

    // Onion = 150g
    const oneOnion = convertToGrams("medium onion", "1", "whole");
    assert.equal(oneOnion.grams, 150);
    assert.equal(oneOnion.confidence, "count_estimate");

    // Tomato = 125g
    const twoTomatoes = convertToGrams("ripe tomato", "2", "");
    assert.equal(twoTomatoes.grams, 250);

    // Potato = 200g
    const potatoes = convertToGrams("russet potato", "3", "pieces");
    assert.equal(potatoes.grams, 600);

    // Garlic clove = 3g
    const garlic = convertToGrams("garlic clove", "4", "pieces");
    assert.equal(garlic.grams, 12);
  });

  test("returns unconvertible status without inventing arbitrary numbers for unknown units", () => {
    const unconvertible = convertToGrams("special seasoning", "2", "handfuls");
    assert.equal(unconvertible.grams, null);
    assert.equal(unconvertible.confidence, "unconvertible");

    const noQty = convertToGrams("salt", "", "tsp");
    assert.equal(noQty.grams, null);
    assert.equal(noQty.confidence, "unconvertible");
  });
});
