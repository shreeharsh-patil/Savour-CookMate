/**
 * Scientific Culinary Unit Converter for USDA FoodData Central Nutrition Estimation
 * Maps volumetric, mass, and count-based ingredients to standard gram references.
 */

// Average weight in grams for common count-based whole ingredients
export const COUNT_WEIGHT_MAPPINGS: Record<string, number> = {
  egg: 50,
  onion: 150,
  tomato: 125,
  banana: 120,
  potato: 200,
  apple: 180,
  lemon: 60,
  lime: 45,
  clove: 3, // garlic clove
  carrot: 70,
  avocado: 150,
  capsicum: 150,
  "bell pepper": 150,
};

// Common volume/mass conversion multipliers to grams (assuming ~1g/ml density for water/liquid base)
const UNIT_TO_GRAMS: Record<string, number> = {
  g: 1,
  gram: 1,
  grams: 1,
  kg: 1000,
  kilogram: 1000,
  kilograms: 1000,
  mg: 0.001,
  milligram: 0.001,
  milligrams: 0.001,
  ml: 1,
  milliliter: 1,
  milliliters: 1,
  l: 1000,
  liter: 1000,
  liters: 1000,
  tsp: 5,
  teaspoon: 5,
  teaspoons: 5,
  tbsp: 15,
  tablespoon: 15,
  tablespoons: 15,
  cup: 240,
  cups: 240,
  oz: 28.35,
  ounce: 28.35,
  ounces: 28.35,
  lb: 453.6,
  lbs: 453.6,
  pound: 453.6,
  pounds: 453.6,
};

/**
 * Parses numeric and fractional culinary quantities into floating-point numbers.
 * Supports: "2", "0.5", "1/2", "1 1/2", "3/4", "1-2"
 */
export function parseCulinaryQuantity(rawQuantity: string | number | undefined | null): number | null {
  if (rawQuantity === undefined || rawQuantity === null) return null;
  if (typeof rawQuantity === "number") return isNaN(rawQuantity) ? null : rawQuantity;

  const str = String(rawQuantity).trim().replace(/,/g, ".");
  if (!str) return null;

  // Handle ranges like "1-2" by taking the midpoint
  if (str.includes("-")) {
    const parts = str.split("-").map((p) => parseCulinaryQuantity(p.trim()));
    if (parts[0] !== null && parts[1] !== null) {
      return (parts[0] + parts[1]) / 2;
    }
  }

  // Handle mixed numbers like "1 1/2" or "2 1/4"
  if (str.includes(" ")) {
    const parts = str.split(/\s+/);
    if (parts.length === 2) {
      const whole = parseFloat(parts[0]);
      const fraction = parseCulinaryQuantity(parts[1]);
      if (!isNaN(whole) && fraction !== null) {
        return whole + fraction;
      }
    }
  }

  // Handle single fractions like "1/2", "3/4", "1/4"
  if (str.includes("/")) {
    const [num, den] = str.split("/").map((n) => parseFloat(n.trim()));
    if (!isNaN(num) && !isNaN(den) && den !== 0) {
      return num / den;
    }
  }

  const val = parseFloat(str);
  return isNaN(val) ? null : val;
}

export interface ConvertedIngredientWeight {
  grams: number | null;
  confidence: "exact" | "count_estimate" | "unconvertible";
  resolvedUnit: string;
}

/**
 * Converts an ingredient's quantity and unit into estimated total grams.
 */
export function convertToGrams(
  ingredientName: string,
  rawQuantity: string | number | undefined | null,
  rawUnit: string | undefined | null
): ConvertedIngredientWeight {
  const qty = parseCulinaryQuantity(rawQuantity);
  const nameLower = (ingredientName || "").toLowerCase().trim();
  const unitLower = (rawUnit || "").toLowerCase().trim();

  // If no quantity is specified, check if it is seasoning "to taste" or pinch
  if (qty === null || qty <= 0) {
    return { grams: null, confidence: "unconvertible", resolvedUnit: unitLower || "unspecified" };
  }

  // 1. Direct standard unit match
  if (unitLower && UNIT_TO_GRAMS[unitLower]) {
    return {
      grams: Math.round(qty * UNIT_TO_GRAMS[unitLower] * 10) / 10,
      confidence: "exact",
      resolvedUnit: unitLower,
    };
  }

  // 2. Count-based items (pieces, whole, count, or empty unit)
  const isCountUnit =
    !unitLower ||
    unitLower === "piece" ||
    unitLower === "pieces" ||
    unitLower === "whole" ||
    unitLower === "unit" ||
    unitLower === "units" ||
    unitLower === "count";

  if (isCountUnit) {
    for (const [key, avgWeight] of Object.entries(COUNT_WEIGHT_MAPPINGS)) {
      if (nameLower.includes(key)) {
        return {
          grams: Math.round(qty * avgWeight * 10) / 10,
          confidence: "count_estimate",
          resolvedUnit: "piece",
        };
      }
    }
  }

  // 3. Fallback for pinch or dash (negligible calories < 1g)
  if (unitLower === "pinch" || unitLower === "dash") {
    return { grams: 0.5 * qty, confidence: "exact", resolvedUnit: unitLower };
  }

  // Could not reliably convert without risking arbitrary estimation
  return { grams: null, confidence: "unconvertible", resolvedUnit: unitLower || "unspecified" };
}
