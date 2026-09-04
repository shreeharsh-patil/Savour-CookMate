import { useQuery } from "@tanstack/react-query";
import { api } from "../../services/api";

export const YOUTUBE_KEYS = {
  all: ["youtube"] as const,
  videos: (dish: string, language: string, filter: string) =>
    [...YOUTUBE_KEYS.all, "videos", dish, language, filter] as const,
};

export function useYouTubeVideosQuery(dish: string, language = "English", filter = "all") {
  return useQuery({
    queryKey: YOUTUBE_KEYS.videos(dish, language, filter),
    queryFn: () => api.youtube.getVideos(dish, language, filter),
    enabled: Boolean(dish && dish.trim().length > 0),
    staleTime: 1000 * 60 * 60, // 1 hour fresh
  });
}
