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
    name: doc.name || doc.title || "Savory Dish",
    title: doc.name || doc.title || "Savory Dish",
    description: doc.description || "",
    cuisine: doc.cuisine || "Global",
    mealType: Array.isArray(doc.mealTypes) && doc.mealTypes.length > 0 ? doc.mealTypes[0] : doc.mealType || doc.category || "Dinner",
    diet: Array.isArray(doc.dietaryTags) && doc.dietaryTags.length > 0 ? doc.dietaryTags[0] : doc.diet || "All",
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
    imageUrl: doc.imageUrl || doc.thumbnailUrl || "",
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
   * Normal search without Gemini: Checks MongoDB Atlas search first, then TheMealDB
   */
  async searchRecipes(query: string, limit = 20): Promise<Recipe[]> {
    try {
      const res = await api.recipes.searchDirect(query, limit);
      return (res.recipes || []).map(mapMongoRecipeToClient);
    } catch (err) {
      console.warn("Recipe search error:", err);
      return [];
    }
  },

  /**
   * Real popularity: recipes sorted by real app interactions (views, saves, cooking completions)
   */
  async getPopularRecipes(limit = 10): Promise<Recipe[]> {
    try {
      const items = await api.analytics.getPopular(limit);
      return items.map(mapMongoRecipeToClient);
    } catch {
      return [];
    }
  },

  /**
   * Home Feed: Structured sections without any Gemini overhead
   */
  async getHomeFeed() {
    try {
      const feed = await api.recipes.getHomeFeed();
      return {
        whatsOnYourMind: feed.whatsOnYourMind || [],
        popularCuisines: feed.popularCuisines || [],
        quickMeals: (feed.quickMeals || []).map(mapMongoRecipeToClient),
        popularWithUsers: (feed.popularWithUsers || []).map(mapMongoRecipeToClient),
        categories: feed.categories || [],
        discoverNew: (feed.discoverNew || []).map(mapMongoRecipeToClient),
      };
    } catch (err) {
      console.warn("Home feed fetch error:", err);
      return null;
    }
  },

  /**
   * Categories from TheMealDB + MongoDB
   */
  async getCategories(): Promise<string[]> {
    try {
      const res = await api.recipes.getCategories();
      return res.categories || [];
    } catch {
      return [];
    }
  },

  /**
   * Cuisines / Areas from TheMealDB + MongoDB
   */
  async getCuisines(): Promise<string[]> {
    try {
      const res = await api.recipes.getCuisines();
      return res.cuisines || [];
    } catch {
      return [];
    }
  },

  /**
   * "Cook With What I Have":
   * Deterministic matching first against verified recipe databases.
   * If user explicitly asks for creative suggestions, runs Gemini.
   */
  async findPantryRecommendations(
    options: PantryQueryOptions
  ): Promise<PantryIntelligenceResult> {
    try {
      const items = options.selectedIngredients || options.ingredients;
      const res = await api.pantry.findDishes(
        items,
        Boolean(options.naturalLanguagePrompt || items?.length)
      );

      const allDeterministic = [
        ...(res.makeNow || []),
        ...(res.almostThere || []),
        ...(res.goodMatch || []),
      ];

      const recommendations: PantryRecipeRecommendation[] = allDeterministic.map((item) => {
        const recipe = mapMongoRecipeToClient(item);
        const missingCount = item.missingIngredients?.length || 0;

        let group: "MAKE NOW" | "ALMOST THERE" | "GOOD MATCH" | "WORTH SHOPPING FOR" = "WORTH SHOPPING FOR";
        if (missingCount === 0 || item.matchPercentage >= 95) group = "MAKE NOW";
        else if (missingCount <= 2) group = "ALMOST THERE";
        else if (item.matchPercentage >= 50) group = "GOOD MATCH";

        return {
          recipe,
          matchPercentage: item.matchPercentage,
          availableIngredients: item.matchedIngredients || [],
          missingIngredients: item.missingIngredients?.map((i: any) => i.name || i) || [],
          optionalMissingIngredients: [],
          reasonForRecommendation: `${item.matchPercentage}% ingredient match from your kitchen`,
          group,
          matchGroup: group,
          totalRequiredCount: item.totalRequired || item.ingredients?.length || 1,
          availableCount: item.matchedCount || 0,
        };
      });

      // Map AI suggestions if present
      if (res.aiSuggestions && res.aiSuggestions.length > 0) {
        for (const sug of res.aiSuggestions) {
          if (sug.matchedRecipe) {
            const recipe = mapMongoRecipeToClient(sug.matchedRecipe);
            recommendations.push({
              recipe,
              matchPercentage: 80,
              availableIngredients: sug.requiredIngredients || [],
              missingIngredients: sug.missingImportantIngredients || [],
              optionalMissingIngredients: sug.optionalIngredients || [],
              reasonForRecommendation: sug.reason || "Suggested from your ingredients",
              group: "GOOD MATCH",
              matchGroup: "GOOD MATCH",
              totalRequiredCount: sug.requiredIngredients?.length || 1,
              availableCount: sug.requiredIngredients?.length || 1,
            });
          }
        }
      }

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
