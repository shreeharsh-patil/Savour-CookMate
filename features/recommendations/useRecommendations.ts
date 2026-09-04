import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../../services/api";

export const RECOMMENDATION_KEYS = {
  all: ["recommendations"] as const,
  list: () => [...RECOMMENDATION_KEYS.all, "list"] as const,
};

export function useRecommendationsQuery() {
  return useQuery({
    queryKey: RECOMMENDATION_KEYS.list(),
    queryFn: () => api.recommendations.getRecommendations(),
    staleTime: 1000 * 60 * 3,
  });
}

export function useTrackRecommendationEventMutation() {
  return useMutation({
    mutationFn: ({ recipeId, eventType }: { recipeId: string; eventType: string }) =>
      api.recommendations.recordEvent(recipeId, eventType),
  });
}
