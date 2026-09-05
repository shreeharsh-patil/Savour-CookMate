import { Recipe } from '../types';

/**
 * Maps raw MongoDB recipe document to client-side Recipe shape.
 * Strict zero-fake-data guarantee: does NOT invent fallback ratings, times, calories, or quantities.
 */
export function mapMongoRecipeToClient(doc: any): Recipe {
  if (!doc) return null as any;

  const instructions = Array.isArray(doc.steps) && doc.steps.length > 0
    ? doc.steps.map((s: any) => (typeof s === "string" ? s : s.instruction || ""))
    : Array.isArray(doc.instructions)
    ? doc.instructions
    : [];

  const parsedSteps = Array.isArray(doc.steps) && doc.steps.length > 0
    ? doc.steps.map((s: any, idx: number) => ({
        stepNumber: s.stepNumber || idx + 1,
        title: `Step ${s.stepNumber || idx + 1}`,
        text: typeof s === "string" ? s : s.instruction || "",
        timeMinutes: s.timerMinutes || 0,
        tip: s.chefTip || "",
      }))
    : instructions.map((text: string, idx: number) => ({
        stepNumber: idx + 1,
        title: `Step ${idx + 1}`,
        text,
        timeMinutes: 0,
      }));

  return {
    id: doc._id?.toString() || doc.id || doc.slug,
    name: doc.name || doc.title || "",
    title: doc.name || doc.title || "",
    description: doc.description || "",
    cuisine: doc.cuisine || "",
    mealType: Array.isArray(doc.mealTypes) && doc.mealTypes.length > 0 ? doc.mealTypes[0] : doc.mealType || doc.category || "",
    diet: Array.isArray(doc.dietaryTags) && doc.dietaryTags.length > 0 ? doc.dietaryTags[0] : doc.diet || "",
    difficulty: doc.difficulty || undefined,
    prepTime: doc.prepTime || undefined,
    cookTime: doc.cookTime || undefined,
    totalTime: doc.totalTime || (doc.prepTime && doc.cookTime ? doc.prepTime + doc.cookTime : undefined),
    servings: doc.servings || undefined,
    calories: doc.nutrition?.calories || doc.calories || undefined,
    averageRating: doc.averageRating !== undefined ? doc.averageRating : null,
    ratingCount: doc.ratingCount || 0,
    cookCount: doc.cookCount || 0,
    nutrition: doc.nutrition || undefined,
    ingredients: (doc.ingredients || []).map((ing: any) => ({
      name: ing.name,
      normalizedName: ing.normalizedName || ing.name?.toLowerCase() || "",
      quantity: ing.quantity || "",
      unit: ing.unit || "",
      optional: Boolean(ing.optional),
      category: ing.category || "",
      item: ing.name,
      amount: `${ing.quantity || ""} ${ing.unit || ""}`.trim(),
    })),
    instructions,
    steps: doc.steps || [],
    parsedSteps,
    tips: doc.tips || [],
    substitutions: (doc.substitutions || []).map((s: any) => ({
      ingredient: s.ingredient,
      substitute: s.substitute,
    })),
    tags: doc.searchKeywords || doc.dietaryTags || [],
    imageSearchQuery: doc.name,
    youtubeSearchQuery: doc.youtubeSearchQuery || `${doc.name} authentic recipe tutorial`,
    imageUrl: doc.imageUrl || doc.thumbnailUrl || "",
    prepTimeMinutes: doc.prepTime,
    cookTimeMinutes: doc.cookTime,
  };
}
