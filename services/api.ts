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

  // Recipes
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
    getRecipeDetail: (id: string) => apiClient<any>(`/api/v1/recipes/${id}`),
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
    addItem: (item: { name: string; quantity?: string; unit?: string; expiryDate?: string; lowStock?: boolean }) =>
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
    getSmartSections: () => apiClient<{ cookWithoutShopping: any[]; missingOneIngredient: any[]; useTheseSoon: any[] }>("/api/v1/pantry/smart-sections"),
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
    getVideos: (dish: string, language = "English", filter = "all") =>
      apiClient<any[]>(
        `/api/v1/youtube?dish=${encodeURIComponent(dish)}&language=${encodeURIComponent(language)}&filter=${encodeURIComponent(filter)}`
      ),
  },

  // AI Assistant & Substitutions
  ai: {
    getSubstitutions: (ingredient: string, dishContext?: string) =>
      apiClient<any[]>("/api/v1/ai/substitutions", {
        method: "POST",
        body: JSON.stringify({ ingredient, dishContext }),
      }),
    getAdvice: (question: string, recipeName: string, stepInstruction?: string) =>
      apiClient<{ advice: string }>("/api/v1/ai/advice", {
        method: "POST",
        body: JSON.stringify({ question, recipeName, stepInstruction }),
      }),
  },
};
