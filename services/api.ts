import { apiClient } from "./apiClient";

export interface RecipeQueryParams {
  cuisine?: string;
  mealType?: string;
  diet?: string;
  difficulty?: string;
  maxTime?: number;
  search?: string;
  sort?: "popular" | "rating" | "time" | "newest";
  page?: number;
  limit?: number;
}

export const api = {
  // Auth
  auth: {
    verifySession: () => apiClient<any>("/api/v1/auth/verify", { method: "POST" }),
    getMe: () => apiClient<any>("/api/v1/auth/me"),
    createGuestSession: () => apiClient<{ token: string; user: any; preferences: any }>("/api/v1/auth/guest", { method: "POST" }),
  },

  // Users & Preferences
  users: {
    getPreferences: () => apiClient<any>("/api/v1/preferences"),
    updatePreferences: (prefs: any) =>
      apiClient<any>("/api/v1/preferences", {
        method: "PUT",
        body: JSON.stringify(prefs),
      }),
    getProfile: () => apiClient<any>("/api/v1/users/profile"),
  },

  // Recipes (MongoDB Atlas + TheMealDB Provider)
  recipes: {
    getRecipes: (params: RecipeQueryParams = {}) => {
      const searchParams = new URLSearchParams();
      if (params.cuisine) searchParams.append("cuisine", params.cuisine);
      if (params.mealType) searchParams.append("mealType", params.mealType);
      if (params.diet) searchParams.append("diet", params.diet);
      if (params.difficulty) searchParams.append("difficulty", params.difficulty);
      if (params.maxTime) searchParams.append("maxTime", String(params.maxTime));
      if (params.search) searchParams.append("search", params.search);
      if (params.sort) searchParams.append("sort", params.sort);
      if (params.page) searchParams.append("page", String(params.page));
      if (params.limit) searchParams.append("limit", String(params.limit));

      const queryStr = searchParams.toString();
      return apiClient<{ recipes: any[]; pagination: any }>(
        `/api/v1/recipes${queryStr ? `?${queryStr}` : ""}`
      );
    },
    searchDirect: (query: string, limit = 20) =>
      apiClient<{ recipes: any[]; total: number }>(
        `/api/v1/recipes/search?q=${encodeURIComponent(query)}&limit=${limit}`
      ),
    getHomeFeed: () => apiClient<any>("/api/v1/recipes/home-feed"),
    getCategories: () => apiClient<{ categories: string[]; count: number }>("/api/v1/categories"),
    getCuisines: () => apiClient<{ cuisines: string[]; count: number }>("/api/v1/cuisines"),
    getByCategory: (category: string, limit = 20) =>
      apiClient<{ category: string; recipes: any[] }>(
        `/api/v1/recipes/category/${encodeURIComponent(category)}?limit=${limit}`
      ),
    getByCuisine: (area: string, limit = 20) =>
      apiClient<{ cuisine: string; recipes: any[] }>(
        `/api/v1/recipes/cuisine/${encodeURIComponent(area)}?limit=${limit}`
      ),
    getRecipeDetail: (id: string) => apiClient<any>(`/api/v1/recipes/${id}`),
    getById: (id: string) => apiClient<any>(`/api/v1/recipes/${encodeURIComponent(id)}`),
    rateRecipe: (
      id: string,
      rating: number,
      comment?: string,
      difficultyFeedback?: string,
      wouldCookAgain?: boolean
    ) =>
      apiClient<{ averageRating: number; ratingCount: number }>(`/api/v1/recipes/${id}/rate`, {
        method: "POST",
        body: JSON.stringify({ rating, comment, difficultyFeedback, wouldCookAgain }),
      }),
    recordCook: (id: string, durationMinutes?: number, notes?: string) =>
      apiClient<{ success: boolean; cookCount: number }>(`/api/v1/recipes/${id}/cook`, {
        method: "POST",
        body: JSON.stringify({ durationMinutes, notes }),
      }),
  },

  // Ingredients
  ingredients: {
    search: (query: string, limit = 20) =>
      apiClient<any[]>(`/api/v1/ingredients?q=${encodeURIComponent(query)}&limit=${limit}`),
  },

  // Pantry
  pantry: {
    getItems: () => apiClient<{ allItems: any[]; sections: any; counts: any }>("/api/v1/pantry"),
    addItem: (item: { name: string; quantity?: string; unit?: string; expiryDate?: string; category?: string; lowStock?: boolean }) =>
      apiClient<any>("/api/v1/pantry", {
        method: "POST",
        body: JSON.stringify(item),
      }),
    updateItem: (id: string, update: { quantity?: string; unit?: string; expiryDate?: string; lowStock?: boolean }) =>
      apiClient<any>(`/api/v1/pantry/${id}`, {
        method: "PUT",
        body: JSON.stringify(update),
      }),
    removeItem: (id: string) =>
      apiClient<{ success: boolean }>(`/api/v1/pantry/${id}`, {
        method: "DELETE",
      }),
    getSmartSections: () =>
      apiClient<{ cookWithoutShopping: any[]; missingOneIngredient: any[]; useTheseSoon: any[] }>(
        "/api/v1/pantry/smart-sections"
      ),
    findDishes: (ingredients?: string[], includeAi = false) =>
      apiClient<{
        makeNow: any[];
        almostThere: any[];
        goodMatch: any[];
        aiSuggestions: any[];
        totalMatched: number;
        message?: string;
      }>("/api/v1/pantry/find-dishes", {
        method: "POST",
        body: JSON.stringify({ ingredients, includeAi }),
      }),
  },

  // Search
  search: {
    searchRecipes: (payload: { query: string; cuisine?: string; mealType?: string; diet?: string; maxCookingTime?: number; page?: number; limit?: number }) =>
      apiClient<{ query: string; interpretedIntent: any; recipes: any[]; pagination: any }>("/api/v1/search", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    autocomplete: (term: string) =>
      apiClient<Array<{ title: string; subtitle: string; slug: string }>>(`/api/v1/search/autocomplete?q=${encodeURIComponent(term)}`),
  },

  // Nutrition (USDA FoodData Central)
  nutrition: {
    getIngredient: (name: string) =>
      apiClient<{ data: any }>(`/api/v1/nutrition/ingredient/${encodeURIComponent(name)}`),
    getIngredientNutrition: (name: string) =>
      apiClient<{ data: any }>(`/api/v1/nutrition/ingredient/${encodeURIComponent(name)}`),
    getRecipeNutrition: (recipeId: string) =>
      apiClient<{
        data: {
          isEstimated: boolean;
          label: string;
          disclaimer: string;
          perServing: {
            calories: number;
            protein: number;
            carbs: number;
            fat: number;
            fiber: number;
          };
        } | null;
      }>(`/api/v1/nutrition/recipe/${recipeId}`),
  },

  // Products & Barcodes (Open Food Facts)
  products: {
    getByBarcode: (barcode: string) =>
      apiClient<{ data: any }>(`/api/v1/products/barcode/${encodeURIComponent(barcode)}`),
    search: (query: string, limit = 10) =>
      apiClient<{ data: any[] }>(`/api/v1/products/search?q=${encodeURIComponent(query)}&limit=${limit}`),
  },

  // Analytics & Real Popularity
  analytics: {
    recordEvent: (recipeId: string, eventType: "view" | "save" | "cook_start" | "cook_complete") =>
      apiClient<{ success: boolean; popularityScore: number }>("/api/v1/analytics/event", {
        method: "POST",
        body: JSON.stringify({ recipeId, eventType }),
      }),
    getPopular: (limit = 10) =>
      apiClient<any[]>(`/api/v1/analytics/popular?limit=${limit}`),
  },

  // Recommendations
  recommendations: {
    getRecommendations: () =>
      apiClient<{
        makeNow: any[];
        almostThere: any[];
        goodMatch: any[];
        worthShoppingFor: any[];
        topRecommendations: any[];
      }>("/api/v1/recommendations"),
    recordEvent: (recipeId: string, eventType: string) =>
      apiClient<any>("/api/v1/recommendations/event", {
        method: "POST",
        body: JSON.stringify({ recipeId, eventType }),
      }),
  },

  // Favorites
  favorites: {
    getFavorites: (collection?: string) =>
      apiClient<any[]>(`/api/v1/favorites${collection ? `?collection=${encodeURIComponent(collection)}` : ""}`),
    toggleFavorite: (recipeId: string, collectionName?: string) =>
      apiClient<{ isFavorited: boolean }>("/api/v1/favorites/toggle", {
        method: "POST",
        body: JSON.stringify({ recipeId, collectionName }),
      }),
    checkStatus: (recipeId: string) => apiClient<{ isFavorited: boolean }>(`/api/v1/favorites/status/${recipeId}`),
  },

  // Shopping List
  shopping: {
    getList: () => apiClient<any[]>("/api/v1/shopping-list"),
    addItem: (name: string, quantity = "1", unit = "unit", category = "General", recipeId?: string) =>
      apiClient<any>("/api/v1/shopping-list", {
        method: "POST",
        body: JSON.stringify({ name, quantity, unit, category, recipeId }),
      }),
    toggleChecked: (id: string) =>
      apiClient<any>(`/api/v1/shopping-list/${id}/toggle`, {
        method: "PUT",
      }),
    removeItem: (id: string) =>
      apiClient<{ success: boolean }>(`/api/v1/shopping-list/${id}`, {
        method: "DELETE",
      }),
    clearChecked: () =>
      apiClient<{ success: boolean }>("/api/v1/shopping-list/clear-checked", {
        method: "DELETE",
      }),
    addMissingFromRecipe: (recipeId: string) =>
      apiClient<{ success: boolean; addedCount: number; items: any[] }>("/api/v1/shopping-list/add-missing", {
        method: "POST",
        body: JSON.stringify({ recipeId }),
      }),
    moveCheckedToPantry: () =>
      apiClient<{ movedCount: number }>("/api/v1/shopping-list/move-to-pantry", {
        method: "POST",
      }),
  },

  // Cooking History
  history: {
    getHistory: (limit = 20) => apiClient<any[]>(`/api/v1/history?limit=${limit}`),
    recordSession: (session: {
      recipeId: string;
      recipeName: string;
      recipeImage: string;
      durationMinutes?: number;
      rating?: number;
      notes?: string;
    }) =>
      apiClient<any>("/api/v1/history", {
        method: "POST",
        body: JSON.stringify(session),
      }),
  },

  // YouTube
  youtube: {
    getVideos: (
      dish: string,
      languages: string[] | string = "English",
      filter = "recommended",
      recipeId?: string,
      signal?: AbortSignal
    ) => {
      const langs = Array.isArray(languages) ? languages.join(",") : languages;
      let url = `/api/v1/youtube?dish=${encodeURIComponent(dish)}&languages=${encodeURIComponent(langs)}&filter=${encodeURIComponent(filter)}`;
      if (recipeId) {
        url += `&recipeId=${encodeURIComponent(recipeId)}`;
      }
      return apiClient<any[]>(url, { signal });
    },
  },

  // AI Assistant: ONLY Cook With What I Have & practical step advice
  ai: {
    cookWithWhatIHave: (ingredients: string[], preferences?: Record<string, any>) =>
      apiClient<{
        fromCache: boolean;
        ingredientHash: string;
        suggestions: Array<{
          dishName: string;
          requiredIngredients: string[];
          optionalIngredients: string[];
          reason: string;
          missingImportantIngredients: string[];
          isAiSuggestion: boolean;
          sourceTag: string;
          matchedRecipe?: any;
        }>;
        note?: string;
      }>("/api/v1/ai/cook-with-what-i-have", {
        method: "POST",
        body: JSON.stringify({ ingredients, preferences }),
      }),
  },
};
