/**
 * Savour CookMate - Client Analytics Service
 * Production telemetry & product interaction event logger.
 * Safe, asynchronous, non-blocking with zero latency impact.
 */

export type AnalyticsEventType =
  | 'home_view'
  | 'recipe_view'
  | 'recipe_save'
  | 'recipe_unsave'
  | 'pantry_add'
  | 'pantry_remove'
  | 'recommendation_view'
  | 'recommendation_open'
  | 'search'
  | 'cooking_start'
  | 'cooking_step_complete'
  | 'cooking_complete'
  | 'shopping_add'
  | 'youtube_open';

export interface AnalyticsPayloads {
  home_view: { category?: string; filter?: string };
  recipe_view: { recipeId: string; recipeTitle: string; category?: string; cuisine?: string };
  recipe_save: { recipeId: string; recipeTitle: string; collection?: string };
  recipe_unsave: { recipeId: string };
  pantry_add: { ingredientName: string; count: number };
  pantry_remove: { ingredientName: string };
  recommendation_view: { recommendationsCount: number; algorithm?: string };
  recommendation_open: { recipeId: string; rank?: number; matchReason?: string };
  search: { query: string; resultsCount?: number; filterCuisine?: string; filterDiet?: string };
  cooking_start: { recipeId: string; recipeTitle: string; totalSteps: number };
  cooking_step_complete: { recipeId: string; stepIndex: number; totalSteps: number };
  cooking_complete: { recipeId: string; totalSteps: number; durationSeconds?: number; rating?: number };
  shopping_add: { ingredientName: string; category?: string };
  youtube_open: { videoId: string; videoTitle?: string; recipeId?: string };
}

export interface AnalyticsEvent<E extends AnalyticsEventType = AnalyticsEventType> {
  event: E;
  timestamp: string;
  properties: AnalyticsPayloads[E];
}

class AnalyticsService {
  private queue: AnalyticsEvent[] = [];
  private isProcessing = false;
  private readonly MAX_QUEUE_SIZE = 100;

  public track<E extends AnalyticsEventType>(
    event: E,
    properties: AnalyticsPayloads[E]
  ): void {
    const entry: AnalyticsEvent<E> = {
      event,
      timestamp: new Date().toISOString(),
      properties,
    };

    if (__DEV__) {
      // Clean, low-noise development telemetry
      console.log(`[Analytics] ${event}`, properties);
    }

    if (this.queue.length >= this.MAX_QUEUE_SIZE) {
      this.queue.shift(); // Evict oldest if buffer is full
    }
    this.queue.push(entry as AnalyticsEvent);

    // Asynchronously flush queue in background without blocking render thread
    this.scheduleFlush();
  }

  // Convenience helper methods
  public trackHomeView(category?: string, filter?: string) {
    this.track('home_view', { category, filter });
  }

  public trackRecipeView(recipeId: string, recipeTitle: string, category?: string, cuisine?: string) {
    this.track('recipe_view', { recipeId, recipeTitle, category, cuisine });
  }

  public trackRecipeSave(recipeId: string, recipeTitle: string, collection?: string) {
    this.track('recipe_save', { recipeId, recipeTitle, collection });
  }

  public trackRecipeUnsave(recipeId: string) {
    this.track('recipe_unsave', { recipeId });
  }

  public trackPantryAdd(ingredientName: string, count: number) {
    this.track('pantry_add', { ingredientName, count });
  }

  public trackPantryRemove(ingredientName: string) {
    this.track('pantry_remove', { ingredientName });
  }

  public trackRecommendationView(recommendationsCount: number, algorithm = 'hybrid-score') {
    this.track('recommendation_view', { recommendationsCount, algorithm });
  }

  public trackRecommendationOpen(recipeId: string, rank?: number, matchReason?: string) {
    this.track('recommendation_open', { recipeId, rank, matchReason });
  }

  public trackSearch(query: string, resultsCount?: number, filterCuisine?: string, filterDiet?: string) {
    this.track('search', { query, resultsCount, filterCuisine, filterDiet });
  }

  public trackCookingStart(recipeId: string, recipeTitle: string, totalSteps: number) {
    this.track('cooking_start', { recipeId, recipeTitle, totalSteps });
  }

  public trackCookingStepComplete(recipeId: string, stepIndex: number, totalSteps: number) {
    this.track('cooking_step_complete', { recipeId, stepIndex, totalSteps });
  }

  public trackCookingComplete(recipeId: string, totalSteps: number, durationSeconds?: number, rating?: number) {
    this.track('cooking_complete', { recipeId, totalSteps, durationSeconds, rating });
  }

  public trackShoppingAdd(ingredientName: string, category?: string) {
    this.track('shopping_add', { ingredientName, category });
  }

  public trackYoutubeOpen(videoId: string, videoTitle?: string, recipeId?: string) {
    this.track('youtube_open', { videoId, videoTitle, recipeId });
  }

  private scheduleFlush() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    // Flush batch asynchronously
    setTimeout(() => {
      try {
        const batch = [...this.queue];
        this.queue = [];
        // In production, batch can be forwarded to backend telemetry endpoint
      } finally {
        this.isProcessing = false;
      }
    }, 1000);
  }
}

export const analytics = new AnalyticsService();
