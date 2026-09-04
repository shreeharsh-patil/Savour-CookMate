import {
  Recipe,
  RecipeFilterOptions,
  PantryRecipeRecommendation,
  PantryQueryOptions,
  PantryIntelligenceResult,
} from "../types";
import { api } from "./api";

export function mapMongoRecipeToClient(doc: any): Recipe {
  if (!doc) return null as any;

  const instructions = Array.isArray(doc.steps) && doc.steps.length > 0
    ? doc.steps.map((s: any) => (typeof s === "string" ? s : s.instruction || ""))
    : Array.isArray(doc.instructions)
    ? doc.instructions
    : [];

  const parsedSteps = Array.isArray(doc.steps)
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
    name: doc.name || doc.title || "Savory Dish",
    title: doc.name || doc.title || "Savory Dish",
    description: doc.description || "",
    cuisine: doc.cuisine || "Global",
    mealType: Array.isArray(doc.mealTypes) && doc.mealTypes.length > 0 ? doc.mealTypes[0] : doc.mealType || "Dinner",
    diet: Array.isArray(doc.dietaryTags) && doc.dietaryTags.length > 0 ? doc.dietaryTags[0] : doc.diet || "All",
    difficulty: doc.difficulty || "Medium",
    prepTime: doc.prepTime || 15,
    cookTime: doc.cookTime || 25,
    totalTime: doc.totalTime || (doc.prepTime || 15) + (doc.cookTime || 25),
    servings: doc.servings || 2,
    calories: doc.nutrition?.calories || doc.calories || 400,
    averageRating: doc.averageRating !== undefined ? doc.averageRating : null,
    ratingCount: doc.ratingCount || 0,
    cookCount: doc.cookCount || 0,
    nutrition: doc.nutrition || { calories: doc.calories || 400, protein: 0, carbs: 0, fat: 0, fiber: 0 },
    ingredients: (doc.ingredients || []).map((ing: any) => ({
      name: ing.name,
      normalizedName: ing.normalizedName || ing.name.toLowerCase(),
      quantity: ing.quantity || "1",
      unit: ing.unit || "unit",
      optional: Boolean(ing.optional),
      category: ing.category || "Produce",
      item: ing.name,
      amount: `${ing.quantity || "1"} ${ing.unit || ""}`.trim(),
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
    imageUrl: doc.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=900&auto=format&fit=crop&q=80",
    prepTimeMinutes: doc.prepTime,
    cookTimeMinutes: doc.cookTime,
  };
}

export const recipeService = {
  /**
   * Fetches persistent recipes from MongoDB Atlas backend
   */
  async discoverRecipes(options: RecipeFilterOptions = {}): Promise<Recipe[]> {
    try {
      const res = await api.recipes.getRecipes({
        cuisine: options.cuisine,
        mealType: options.mealType,
        diet: options.diet,
        maxTime: options.maxCookTimeMinutes,
        search: options.query || options.naturalLanguagePrompt,
      });

      return (res.recipes || []).map(mapMongoRecipeToClient);
    } catch (err) {
      console.warn("Recipe fetch error:", err);
      return [];
    }
  },

  /**
   * "Cook With What I Have" - deterministic recommendations from MongoDB Atlas
   */
  async findPantryRecommendations(
    options: PantryQueryOptions
  ): Promise<PantryIntelligenceResult> {
    try {
      const res = await api.recommendations.getRecommendations();

      const allGroups = [
        ...(res.makeNow || []),
        ...(res.almostThere || []),
        ...(res.goodMatch || []),
        ...(res.worthShoppingFor || []),
      ];

      const recommendations: PantryRecipeRecommendation[] = allGroups.map((item) => {
        const recipe = mapMongoRecipeToClient(item.recipe);
        const missingCount = item.missingIngredients?.length || 0;

        let group: "MAKE NOW" | "ALMOST THERE" | "GOOD MATCH" | "WORTH SHOPPING FOR" = "WORTH SHOPPING FOR";
        if (missingCount === 0) group = "MAKE NOW";
        else if (missingCount <= 2) group = "ALMOST THERE";
        else if (item.matchPercentage >= 50) group = "GOOD MATCH";

        return {
          recipe,
          matchPercentage: item.matchPercentage,
          availableIngredients: item.matchedIngredients || [],
          missingIngredients: item.missingIngredients || [],
          optionalMissingIngredients: [],
          reasonForRecommendation: item.explanation || `${item.matchPercentage}% pantry ingredient match`,
          group,
          matchGroup: group,
          totalRequiredCount: (item.matchedIngredients?.length || 0) + (item.missingIngredients?.length || 0),
          availableCount: item.matchedIngredients?.length || 0,
        };
      });

      return {
        recommendations,
        extractedIngredients: [],
        extractedPreferences: "",
      };
    } catch (err) {
      console.warn("Pantry recommendation error:", err);
      return {
        recommendations: [],
        extractedIngredients: [],
        extractedPreferences: "",
      };
    }
  },

  async extractIngredientsFromPrompt(prompt: string): Promise<{ ingredients: string[]; preferences: string }> {
    try {
      const res = await api.search.searchRecipes({ query: prompt });
      return {
        ingredients: res.interpretedIntent?.ingredients || [],
        preferences: res.interpretedIntent?.cuisine || "",
      };
    } catch {
      return { ingredients: [], preferences: "" };
    }
  },
};
