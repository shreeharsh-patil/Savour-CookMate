import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, RecipeQueryParams } from "../../services/api";

export const RECIPE_KEYS = {
  all: ["recipes"] as const,
  list: (filters: RecipeQueryParams) => [...RECIPE_KEYS.all, "list", filters] as const,
  detail: (id: string) => [...RECIPE_KEYS.all, "detail", id] as const,
};

export function useRecipesQuery(filters: RecipeQueryParams = {}) {
  return useQuery({
    queryKey: RECIPE_KEYS.list(filters),
    queryFn: () => api.recipes.getRecipes(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes fresh
  });
}

export function useRecipeDetailQuery(id: string | null) {
  return useQuery({
    queryKey: RECIPE_KEYS.detail(id || ""),
    queryFn: () => (id ? api.recipes.getRecipeDetail(id) : null),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 10,
  });
}

export function useRateRecipeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, rating, comment }: { id: string; rating: number; comment?: string }) =>
      api.recipes.rateRecipe(id, rating, comment),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: RECIPE_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: RECIPE_KEYS.all });
    },
  });
}

export function useRecordCookMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, durationMinutes, notes }: { id: string; durationMinutes?: number; notes?: string }) =>
      api.recipes.recordCook(id, durationMinutes, notes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: RECIPE_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ["history"] });
    },
  });
}
