import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../services/api";

export const PROFILE_KEYS = {
  all: ["profile"] as const,
  profile: () => [...PROFILE_KEYS.all, "details"] as const,
  preferences: () => [...PROFILE_KEYS.all, "preferences"] as const,
};

export function useProfileQuery() {
  return useQuery({
    queryKey: PROFILE_KEYS.profile(),
    queryFn: () => api.users.getProfile(),
    staleTime: 1000 * 60 * 5,
  });
}

export function usePreferencesQuery() {
  return useQuery({
    queryKey: PROFILE_KEYS.preferences(),
    queryFn: () => api.users.getPreferences(),
    staleTime: 1000 * 60 * 10,
  });
}

export function useUpdatePreferencesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (prefs: any) => api.users.updatePreferences(prefs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["recommendations"] });
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
    },
  });
}
