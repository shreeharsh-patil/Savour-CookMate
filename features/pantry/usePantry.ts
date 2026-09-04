import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../services/api";

export const PANTRY_KEYS = {
  all: ["pantry"] as const,
  items: () => [...PANTRY_KEYS.all, "items"] as const,
  smartSections: () => [...PANTRY_KEYS.all, "smart-sections"] as const,
};

export function usePantryQuery() {
  return useQuery({
    queryKey: PANTRY_KEYS.items(),
    queryFn: () => api.pantry.getItems(),
    staleTime: 1000 * 60 * 2,
  });
}

export function usePantrySmartSectionsQuery() {
  return useQuery({
    queryKey: PANTRY_KEYS.smartSections(),
    queryFn: () => api.pantry.getSmartSections(),
    staleTime: 1000 * 60 * 2,
  });
}

export function useAddPantryItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (item: { name: string; quantity?: string; unit?: string; expiryDate?: string; lowStock?: boolean }) =>
      api.pantry.addItem(item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PANTRY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["recommendations"] });
    },
  });
}

export function useUpdatePantryItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, update }: { id: string; update: { quantity?: string; unit?: string; expiryDate?: string; lowStock?: boolean } }) =>
      api.pantry.updateItem(id, update),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PANTRY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["recommendations"] });
    },
  });
}

export function useRemovePantryItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.pantry.removeItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PANTRY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["recommendations"] });
    },
  });
}
