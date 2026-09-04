import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../services/api";

export const HISTORY_KEYS = {
  all: ["history"] as const,
  list: () => [...HISTORY_KEYS.all, "list"] as const,
};

export function useCookingHistoryQuery() {
  return useQuery({
    queryKey: HISTORY_KEYS.list(),
    queryFn: () => api.history.getHistory(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useRecordCookingSessionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (session: {
      recipeId: string;
      recipeName: string;
      recipeImage: string;
      durationMinutes?: number;
      rating?: number;
      notes?: string;
    }) => api.history.recordSession(session),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HISTORY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["recommendations"] });
    },
  });
}
