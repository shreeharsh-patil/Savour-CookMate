import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../services/api";

export const FAVORITE_KEYS = {
  all: ["favorites"] as const,
  list: (collection?: string) => [...FAVORITE_KEYS.all, "list", collection || "all"] as const,
  status: (recipeId: string) => [...FAVORITE_KEYS.all, "status", recipeId] as const,
};

export function useFavoritesQuery(collection?: string) {
  return useQuery({
    queryKey: FAVORITE_KEYS.list(collection),
    queryFn: () => api.favorites.getFavorites(collection),
    staleTime: 1000 * 60 * 2,
  });
}

export function useIsFavoriteQuery(recipeId: string | null) {
  return useQuery({
    queryKey: FAVORITE_KEYS.status(recipeId || ""),
    queryFn: () => (recipeId ? api.favorites.checkStatus(recipeId) : { isFavorited: false }),
    enabled: Boolean(recipeId),
    staleTime: 1000 * 60 * 2,
  });
}

export function useToggleFavoriteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ recipeId, collectionName }: { recipeId: string; collectionName?: string }) =>
      api.favorites.toggleFavorite(recipeId, collectionName),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: FAVORITE_KEYS.status(variables.recipeId) });
      queryClient.invalidateQueries({ queryKey: FAVORITE_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}
