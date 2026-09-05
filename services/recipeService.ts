import {
  Recipe,
  RecipeFilterOptions,
  PantryRecipeRecommendation,
  PantryQueryOptions,
  PantryIntelligenceResult,
} from "../types";
import { api } from "./api";

import { mapMongoRecipeToClient } from "../utils/recipeMapper";
export { mapMongoRecipeToClient };

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
        false
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

      // Map AI suggestions if present with deterministic match calculation from actual pantry
      if (res.aiSuggestions && res.aiSuggestions.length > 0) {
        const pantryList = (items || []).map((item: any) => String(item).toLowerCase().trim()).filter(Boolean);
        const matchesPantry = (req: string) =>
          pantryList.some((p) => p === req || p.includes(req) || req.includes(p));

        for (const sug of res.aiSuggestions) {
          if (sug.matchedRecipe) {
            const recipe = mapMongoRecipeToClient(sug.matchedRecipe);
            const rawRequired = (sug.requiredIngredients || []).map((ingredient: any) =>
              String(ingredient.name || ingredient).toLowerCase().trim()
            ).filter(Boolean);
            const required = rawRequired.length > 0
              ? rawRequired
              : (recipe.ingredients || []).map((i: any) => i.name.toLowerCase().trim()).filter(Boolean);

            const availableIngredients = required.filter(matchesPantry);
            const missingIngredients = required.filter((ingredient: string) => !matchesPantry(ingredient));
            const totalRequiredCount = required.length;
            const availableCount = availableIngredients.length;
            const matchPercentage = totalRequiredCount > 0 ? Math.round((availableCount / totalRequiredCount) * 100) : 0;

            recommendations.push({
              recipe,
              matchPercentage,
              availableIngredients,
              missingIngredients,
              optionalMissingIngredients: sug.optionalIngredients || [],
              reasonForRecommendation: sug.reason || "Suggested from your ingredients",
              group: "GOOD MATCH",
              matchGroup: "GOOD MATCH",
              totalRequiredCount,
              availableCount,
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
