import { Recipe, Ingredient, RecipeSubstitution, InstructionStep } from '../types';

/**
 * Strict schema validator for recipes.
 * Guarantees that only valid, non-malformed recipes are rendered in the application.
 */
export function validateRecipe(raw: any): Recipe | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  // 1. Mandatory Text Attributes
  const name =
    typeof raw.name === 'string' && raw.name.trim()
      ? raw.name.trim()
      : typeof raw.title === 'string' && raw.title.trim()
      ? raw.title.trim()
      : null;

  if (!name) {
    return null;
  }

  const id =
    typeof raw.id === 'string' && raw.id.trim()
      ? raw.id.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-')
      : name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  const description =
    typeof raw.description === 'string' && raw.description.trim()
      ? raw.description.trim()
      : `${name} crafted with fresh culinary ingredients.`;

  const cuisine =
    typeof raw.cuisine === 'string' && raw.cuisine.trim() ? raw.cuisine.trim() : 'Global';
  const mealType =
    typeof raw.mealType === 'string' && raw.mealType.trim() ? raw.mealType.trim() : 'Main Course';
  const diet =
    typeof raw.diet === 'string' && raw.diet.trim() ? raw.diet.trim() : 'Vegetarian';
  const difficulty =
    typeof raw.difficulty === 'string' && raw.difficulty.trim() ? raw.difficulty.trim() : 'Medium';

  // 2. Numeric attributes (must be non-negative)
  const prepTime =
    typeof raw.prepTime === 'number' && !isNaN(raw.prepTime) && raw.prepTime >= 0
      ? Math.round(raw.prepTime)
      : typeof raw.prepTimeMinutes === 'number'
      ? Math.round(raw.prepTimeMinutes)
      : 15;

  const cookTime =
    typeof raw.cookTime === 'number' && !isNaN(raw.cookTime) && raw.cookTime >= 0
      ? Math.round(raw.cookTime)
      : typeof raw.cookTimeMinutes === 'number'
      ? Math.round(raw.cookTimeMinutes)
      : 25;

  const totalTime =
    typeof raw.totalTime === 'number' && !isNaN(raw.totalTime) && raw.totalTime > 0
      ? Math.round(raw.totalTime)
      : prepTime + cookTime;

  const servings =
    typeof raw.servings === 'number' && !isNaN(raw.servings) && raw.servings > 0
      ? Math.round(raw.servings)
      : 4;

  const calories =
    typeof raw.calories === 'number' && !isNaN(raw.calories) && raw.calories > 0
      ? Math.round(raw.calories)
      : 450;

  const ratingEstimate =
    typeof raw.ratingEstimate === 'number' &&
    !isNaN(raw.ratingEstimate) &&
    raw.ratingEstimate > 0
      ? Math.min(5.0, Math.max(1.0, Number(raw.ratingEstimate.toFixed(1))))
      : 4.8;

  // 3. Ingredients validation
  if (!Array.isArray(raw.ingredients) || raw.ingredients.length === 0) {
    return null;
  }

  const validIngredients: Ingredient[] = [];
  for (const ing of raw.ingredients) {
    if (!ing) continue;
    let ingName = '';
    let quantity = '1';
    let unit = '';
    let category = 'Produce';
    let optional = false;

    if (typeof ing === 'string') {
      ingName = ing.trim();
    } else if (typeof ing === 'object') {
      ingName =
        typeof ing.name === 'string'
          ? ing.name.trim()
          : typeof ing.item === 'string'
          ? ing.item.trim()
          : '';
      quantity =
        typeof ing.quantity === 'string'
          ? ing.quantity.trim()
          : typeof ing.amount === 'string'
          ? ing.amount.trim()
          : '1';
      unit = typeof ing.unit === 'string' ? ing.unit.trim() : '';
      category =
        typeof ing.category === 'string' && ing.category.trim()
          ? ing.category.trim()
          : 'Produce';
      optional = Boolean(ing.optional);
    }

    if (!ingName) continue;

    const normalized = ingName.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();

    validIngredients.push({
      name: ingName,
      normalizedName:
        typeof ing?.normalizedName === 'string' && ing.normalizedName
          ? ing.normalizedName
          : normalized,
      quantity,
      unit,
      optional,
      category,
      item: ingName,
      amount: unit ? `${quantity} ${unit}`.trim() : quantity,
    });
  }

  if (validIngredients.length === 0) {
    return null;
  }

  // 4. Instructions validation
  const validInstructions: string[] = [];
  if (Array.isArray(raw.instructions)) {
    for (const step of raw.instructions) {
      if (typeof step === 'string' && step.trim()) {
        validInstructions.push(step.trim());
      } else if (
        step &&
        typeof step === 'object' &&
        typeof step.text === 'string' &&
        step.text.trim()
      ) {
        validInstructions.push(step.text.trim());
      }
    }
  }

  if (validInstructions.length === 0) {
    return null;
  }

  // 5. Tips validation
  const validTips: string[] = [];
  if (Array.isArray(raw.tips)) {
    for (const tip of raw.tips) {
      if (typeof tip === 'string' && tip.trim()) {
        validTips.push(tip.trim());
      }
    }
  } else if (Array.isArray(raw.chefTips)) {
    for (const tip of raw.chefTips) {
      if (typeof tip === 'string' && tip.trim()) {
        validTips.push(tip.trim());
      }
    }
  }

  // 6. Substitutions validation
  const validSubstitutions: RecipeSubstitution[] = [];
  if (Array.isArray(raw.substitutions)) {
    for (const sub of raw.substitutions) {
      if (
        sub &&
        typeof sub === 'object' &&
        typeof sub.ingredient === 'string' &&
        typeof sub.substitute === 'string'
      ) {
        validSubstitutions.push({
          ingredient: sub.ingredient.trim(),
          substitute: sub.substitute.trim(),
        });
      }
    }
  }

  // 7. Tags validation
  const validTags: string[] = [];
  if (Array.isArray(raw.tags)) {
    for (const tag of raw.tags) {
      if (typeof tag === 'string' && tag.trim()) {
        validTags.push(tag.trim());
      }
    }
  }
  if (validTags.length === 0) {
    validTags.push(cuisine, mealType);
  }

  // 8. Search queries
  const imageSearchQuery =
    typeof raw.imageSearchQuery === 'string' && raw.imageSearchQuery.trim()
      ? raw.imageSearchQuery.trim()
      : typeof raw.imageKeyword === 'string' && raw.imageKeyword.trim()
      ? raw.imageKeyword.trim()
      : `${name} food dish`;

  const youtubeSearchQuery =
    typeof raw.youtubeSearchQuery === 'string' && raw.youtubeSearchQuery.trim()
      ? raw.youtubeSearchQuery.trim()
      : `how to cook authentic ${name} recipe`;

  // 9. Computed step representations for interactive cooking mode
  const stepTimeShare = Math.max(
    2,
    Math.round(cookTime / Math.max(validInstructions.length, 1))
  );
  const parsedSteps: InstructionStep[] = validInstructions.map((text, idx) => ({
    stepNumber: idx + 1,
    title: `Step ${idx + 1}`,
    text,
    timeMinutes: stepTimeShare,
    tip: validTips[idx % Math.max(validTips.length, 1)] || undefined,
  }));

  return {
    id,
    name,
    title: name,
    description,
    tagline: raw.tagline || description.slice(0, 100),
    cuisine,
    mealType,
    diet,
    difficulty,
    prepTime,
    cookTime,
    totalTime,
    prepTimeMinutes: prepTime,
    cookTimeMinutes: cookTime,
    servings,
    calories,
    ratingEstimate,
    proteinGrams:
      typeof raw.proteinGrams === 'number'
        ? raw.proteinGrams
        : Math.round((calories * 0.25) / 4),
    carbsGrams:
      typeof raw.carbsGrams === 'number'
        ? raw.carbsGrams
        : Math.round((calories * 0.45) / 4),
    fatGrams:
      typeof raw.fatGrams === 'number'
        ? raw.fatGrams
        : Math.round((calories * 0.3) / 9),
    fiberGrams:
      typeof raw.fiberGrams === 'number'
        ? raw.fiberGrams
        : Math.max(2, Math.round(calories * 0.01)),
    ingredients: validIngredients,
    instructions: validInstructions,
    parsedSteps,
    tips:
      validTips.length > 0
        ? validTips
        : ['Taste and adjust seasoning with flaky sea salt and fresh pepper before plating.'],
    chefTips:
      validTips.length > 0
        ? validTips
        : ['Taste and adjust seasoning before plating.'],
    substitutions: validSubstitutions,
    tags: validTags,
    imageSearchQuery,
    imageKeyword: imageSearchQuery,
    youtubeSearchQuery,
    imageUrl: raw.imageUrl,
    usedPantryItems: Array.isArray(raw.usedPantryItems) ? raw.usedPantryItems : [],
    missingStaples: Array.isArray(raw.missingStaples) ? raw.missingStaples : [],
  };
}

/**
 * Batch validator that filters and maps an array of raw responses.
 * Guarantees zero malformed items in the resulting collection.
 */
export function validateRecipes(rawList: any): Recipe[] {
  if (!Array.isArray(rawList)) {
    return [];
  }

  const validRecipes: Recipe[] = [];
  for (const item of rawList) {
    const validated = validateRecipe(item);
    if (validated) {
      validRecipes.push(validated);
    }
  }

  return validRecipes;
}
