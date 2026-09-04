import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../services/api";

export const SHOPPING_KEYS = {
  all: ["shopping-list"] as const,
  list: () => [...SHOPPING_KEYS.all, "list"] as const,
};

export function useShoppingListQuery() {
  return useQuery({
    queryKey: SHOPPING_KEYS.list(),
    queryFn: () => api.shopping.getList(),
    staleTime: 1000 * 60 * 2,
  });
}

export function useAddShoppingItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (item: { name: string; quantity?: string; unit?: string; category?: string; recipeId?: string }) =>
      api.shopping.addItem(item.name, item.quantity, item.unit, item.category, item.recipeId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SHOPPING_KEYS.all }),
  });
}

export function useToggleShoppingItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.shopping.toggleChecked(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SHOPPING_KEYS.all }),
  });
}

export function useRemoveShoppingItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.shopping.removeItem(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SHOPPING_KEYS.all }),
  });
}

export function useClearCheckedShoppingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.shopping.clearChecked(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SHOPPING_KEYS.all }),
  });
}

export function useAddMissingFromRecipeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (recipeId: string) => api.shopping.addMissingFromRecipe(recipeId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SHOPPING_KEYS.all }),
  });
}

export function useMoveToPantryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.shopping.moveCheckedToPantry(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SHOPPING_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["pantry"] });
      queryClient.invalidateQueries({ queryKey: ["recommendations"] });
    },
  });
}
