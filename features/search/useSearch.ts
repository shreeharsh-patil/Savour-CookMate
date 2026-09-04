import { useQuery } from "@tanstack/react-query";
import { api } from "../../services/api";

export const SEARCH_KEYS = {
  all: ["search"] as const,
  results: (payload: any) => [...SEARCH_KEYS.all, "results", payload] as const,
  autocomplete: (term: string) => [...SEARCH_KEYS.all, "autocomplete", term] as const,
};

export function useSearchQuery(payload: {
  query: string;
  cuisine?: string;
  mealType?: string;
  diet?: string;
  maxCookingTime?: number;
  enabled?: boolean;
}) {
  const { enabled = true, ...rest } = payload;
  return useQuery({
    queryKey: SEARCH_KEYS.results(rest),
    queryFn: () => api.search.searchRecipes(rest),
    enabled: Boolean(rest.query && rest.query.trim().length > 0 && enabled),
    staleTime: 1000 * 60 * 3,
  });
}

export function useAutocompleteQuery(term: string) {
  return useQuery({
    queryKey: SEARCH_KEYS.autocomplete(term),
    queryFn: () => api.search.autocomplete(term),
    enabled: Boolean(term && term.trim().length >= 2),
    staleTime: 1000 * 60 * 5,
  });
}
