import { Recipe, Ingredient, PantryRecipeRecommendation, PantryMatchGroup } from '../types';

/**
 * Normalizes culinary ingredient names for high-accuracy pantry comparison.
 * Handles plurals, common culinary synonyms (e.g. curd/yogurt, cilantro/coriander),
 * and substring inclusions (e.g., "basmati rice" -> matches "rice").
 */
export function normalizeIngredientString(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .trim()
    // remove common quantifiers & filler descriptors
    .replace(/\b(fresh|dried|chopped|diced|sliced|minced|grated|crushed|ground|whole|cubed|cooked|raw|cloves of|tbsp|tsp|cups|grams|kg|ml)\b/gi, '')
    // clean extra spaces and punctuation
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Common culinary synonyms and equivalents
 */
const SYNONYM_MAP: Record<string, string[]> = {
  curd: ['yogurt', 'yoghurt', 'dahi', 'greek yogurt'],
  yogurt: ['curd', 'dahi', 'yoghurt'],
  dahi: ['curd', 'yogurt'],
  cilantro: ['coriander', 'fresh coriander', 'dhania'],
  coriander: ['cilantro', 'fresh coriander', 'dhania'],
  chili: ['chilli', 'green chili', 'red chili', 'chili powder'],
  chicken: ['chicken breast', 'chicken thighs', 'boneless chicken', 'minced chicken'],
  paneer: ['cottage cheese', 'firm paneer', 'fresh paneer'],
  rice: ['basmati rice', 'jasmine rice', 'white rice', 'brown rice', 'cooked rice'],
  onion: ['red onion', 'yellow onion', 'shallots', 'onions', 'white onion'],
  tomato: ['tomatoes', 'roma tomato', 'crushed tomatoes', 'pureed tomatoes'],
  garlic: ['garlic cloves', 'garlic paste', 'minced garlic'],
  ginger: ['ginger paste', 'fresh ginger', 'grated ginger'],
  oil: ['cooking oil', 'olive oil', 'vegetable oil', 'mustard oil', 'sunflower oil'],
  butter: ['ghee', 'clarified butter', 'unsalted butter'],
  ghee: ['butter', 'clarified butter'],
  egg: ['eggs', 'egg white', 'egg yolk'],
};

/**
 * Checks if a recipe ingredient is present in the user's available pantry ingredients.
 */
export function isIngredientInPantry(
  recipeIngredient: Ingredient | string,
  userPantryItems: string[]
): boolean {
  const ingName = typeof recipeIngredient === 'string'
    ? recipeIngredient
    : (recipeIngredient.normalizedName || recipeIngredient.name);

  const cleanIng = normalizeIngredientString(ingName);
  if (!cleanIng) return false;

  const words = cleanIng.split(' ').filter(w => w.length > 2);

  for (const pantryItem of userPantryItems) {
    const cleanPantry = normalizeIngredientString(pantryItem);
    if (!cleanPantry) continue;

    // Exact or direct inclusion match
    if (cleanIng === cleanPantry) return true;
    if (cleanIng.includes(cleanPantry) || cleanPantry.includes(cleanIng)) return true;

    // Singular / Plural matching (e.g. "onions" vs "onion")
    if (cleanIng + 's' === cleanPantry || cleanPantry + 's' === cleanIng) return true;
    if (cleanIng.replace(/es$/, '') === cleanPantry || cleanPantry.replace(/es$/, '') === cleanIng) return true;

    // Synonym map lookup
    for (const [key, syns] of Object.entries(SYNONYM_MAP)) {
      if ((cleanIng.includes(key) || syns.some(s => cleanIng.includes(s))) &&
          (cleanPantry.includes(key) || syns.some(s => cleanPantry.includes(s)))) {
        return true;
      }
    }

    // Word intersection for multi-word ingredients (e.g. "basmati rice" & "rice")
    if (words.some(w => cleanPantry.includes(w)) && words.length <= 2) {
      // guard against false positives like "chili powder" vs "garlic powder"
      if (!cleanPantry.includes('powder') && !cleanIng.includes('powder')) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Deterministically evaluates a recipe against user's pantry items.
 * Formula:
 * matchPercentage = (matched required ingredients / total required ingredients) * 100
 *
 * Groups results into:
 * - MAKE NOW: No important required ingredients missing (missing count === 0 or match === 100%)
 * - ALMOST THERE: Missing 1–2 ingredients
 * - GOOD MATCH: Strong pantry match (>=50% match, missing <= 4)
 * - WORTH SHOPPING FOR: Requires more ingredients (<50% match or missing >= 5)
 */
export function evaluateRecipeMatch(
  recipe: Recipe,
  userPantryItems: string[],
  geminiReason?: string,
  geminiReportedMatch?: number
): PantryRecipeRecommendation {
  const allIngredients = recipe.ingredients || [];
  
  // Separate required vs optional
  const requiredIngredients = allIngredients.filter(ing => !ing.optional);
  const optionalIngredients = allIngredients.filter(ing => ing.optional);

  const matchedRequired: string[] = [];
  const missingRequired: string[] = [];

  for (const ing of requiredIngredients) {
    const displayName = ing.name;
    if (isIngredientInPantry(ing, userPantryItems)) {
      matchedRequired.push(displayName);
    } else {
      missingRequired.push(displayName);
    }
  }

  const optionalMissing: string[] = [];
  for (const ing of optionalIngredients) {
    if (!isIngredientInPantry(ing, userPantryItems)) {
      optionalMissing.push(ing.name);
    }
  }

  // Deterministic local computation:
  const totalRequired = requiredIngredients.length;
  const availableCount = matchedRequired.length;

  const matchPercentage = totalRequired > 0
    ? Math.round((availableCount / totalRequired) * 100)
    : 100;

  // Strict grouping rule as dictated by specification:
  let group: PantryMatchGroup;
  if (missingRequired.length === 0 || matchPercentage === 100) {
    group = 'MAKE NOW';
  } else if (missingRequired.length <= 2) {
    group = 'ALMOST THERE';
  } else if (matchPercentage >= 50 && missingRequired.length <= 4) {
    group = 'GOOD MATCH';
  } else {
    group = 'WORTH SHOPPING FOR';
  }

  const reason = geminiReason || (
    group === 'MAKE NOW'
      ? `You have all ${availableCount} key ingredients on hand! Ready to cook immediately.`
      : group === 'ALMOST THERE'
      ? `You have ${availableCount} of ${totalRequired} ingredients (${matchPercentage}%). Just grab ${missingRequired.slice(0, 2).join(' & ')}.`
      : group === 'GOOD MATCH'
      ? `Strong culinary match utilizing ${availableCount} of your pantry items.`
      : `Exciting recipe that builds on your pantry items with a few fresh additions.`
  );

  return {
    recipe: {
      ...recipe,
      usedPantryItems: matchedRequired,
      missingStaples: missingRequired,
    },
    matchPercentage,
    geminiMatchPercentage: geminiReportedMatch,
    availableIngredients: matchedRequired,
    missingIngredients: missingRequired,
    optionalMissingIngredients: optionalMissing,
    reasonForRecommendation: reason,
    group,
    matchGroup: group,
    totalRequiredCount: totalRequired,
    availableCount,
  };
}
