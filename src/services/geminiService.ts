import { Recipe, RecipeFilterOptions, PantryRecipeRecommendation } from '../types';
import { validateRecipes, validateRecipe } from '../utils/recipeValidator';
import { evaluateRecipeMatch } from '../utils/pantryMatcher';

export interface GeminiServiceResponse {
  recipes: Recipe[];
  error?: string;
}

export interface PantryQueryOptions {
  ingredients?: string[];
  naturalLanguagePrompt?: string;
  dietary?: string[];
  diet?: string;
  skillLevel?: string;
}

export interface PantryIntelligenceResult {
  recommendations: PantryRecipeRecommendation[];
  extractedIngredients: string[];
  extractedPreferences: string;
}

// In-flight request deduplication maps to prevent duplicate parallel fetches
const inFlightDiscover = new Map<string, Promise<Recipe[]>>();
const inFlightPantry = new Map<string, Promise<PantryIntelligenceResult>>();

// Client-side cache (3 minutes) for instant tab switching with zero network overhead
const clientDiscoverCache = new Map<string, { data: Recipe[]; expires: number }>();
const clientPantryCache = new Map<string, { data: PantryIntelligenceResult; expires: number }>();

function createRequestKey(prefix: string, obj: any): string {
  try {
    return `${prefix}:${JSON.stringify(obj, Object.keys(obj).sort())}`;
  } catch {
    return `${prefix}:${String(obj)}`;
  }
}

export const geminiService = {
  /**
   * Discover fresh, authentic recipes via Gemini 3.8-Flash
   * Features in-flight deduplication and client memory caching.
   */
  async discoverRecipes(options: RecipeFilterOptions = {}): Promise<Recipe[]> {
    const key = createRequestKey('discover', options);

    // 1. Check client-side memory cache
    const cached = clientDiscoverCache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    // 2. Check if identical request is already in-flight
    if (inFlightDiscover.has(key)) {
      return inFlightDiscover.get(key)!;
    }

    // 3. Initiate request with in-flight deduplication promise
    const fetchPromise = (async () => {
      try {
        const response = await fetch('/api/recipes/discover', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(options),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Gemini API responded with status ${response.status}`);
        }

        const data = await response.json();
        if (!data.recipes || !Array.isArray(data.recipes)) {
          throw new Error('Gemini API returned an invalid response structure.');
        }

        // Strict validation: discard any malformed AI outputs
        const validatedRecipes = validateRecipes(data.recipes);

        if (validatedRecipes.length === 0 && data.recipes.length > 0) {
          throw new Error('All recipe items from Gemini failed structural validation.');
        }

        // Cache for 3 minutes
        clientDiscoverCache.set(key, { data: validatedRecipes, expires: Date.now() + 180000 });
        return validatedRecipes;
      } finally {
        inFlightDiscover.delete(key);
      }
    })();

    inFlightDiscover.set(key, fetchPromise);
    return fetchPromise;
  },

  /**
   * "Cook With What I Have": Smart Pantry Intelligent Matching Engine.
   * Sends ingredients + natural language prompt to Gemini backend.
   * Features in-flight deduplication and local deterministic evaluation.
   */
  async findPantryRecommendations(options: PantryQueryOptions): Promise<PantryIntelligenceResult> {
    const key = createRequestKey('pantry', options);

    // 1. Check client-side memory cache
    const cached = clientPantryCache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    // 2. Check if identical request is in flight
    if (inFlightPantry.has(key)) {
      return inFlightPantry.get(key)!;
    }

    const fetchPromise = (async () => {
      try {
        const response = await fetch('/api/recipes/pantry', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(options),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Failed to query Gemini Kitchen engine: ${response.status}`);
        }

        const data = await response.json();
        const rawRecommendations = Array.isArray(data.recommendations) ? data.recommendations : [];

        const effectivePantryItems = [
          ...(options.ingredients || []),
          ...(Array.isArray(data.extractedIngredients) ? data.extractedIngredients : []),
        ];

        const validatedRecommendations: PantryRecipeRecommendation[] = [];

        for (const item of rawRecommendations) {
          const validRecipe = validateRecipe(item.recipe || item);
          if (!validRecipe) continue;

          // Deterministic evaluation locally: (matched / totalRequired) * 100
          const evaluated = evaluateRecipeMatch(
            validRecipe,
            effectivePantryItems,
            item.reasonForRecommendation,
            item.matchPercentage
          );

          validatedRecommendations.push(evaluated);
        }

        const result: PantryIntelligenceResult = {
          recommendations: validatedRecommendations,
          extractedIngredients: data.extractedIngredients || [],
          extractedPreferences: data.extractedPreferences || '',
        };

        clientPantryCache.set(key, { data: result, expires: Date.now() + 180000 });
        return result;
      } finally {
        inFlightPantry.delete(key);
      }
    })();

    inFlightPantry.set(key, fetchPromise);
    return fetchPromise;
  },

  /**
   * Extract ingredients and preferences from freeform natural language text
   */
  async extractIngredientsFromPrompt(prompt: string): Promise<{ ingredients: string[]; preferences: string }> {
    const response = await fetch('/api/pantry/extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to extract ingredients');
    }

    return response.json();
  },

  /**
   * Legacy wrapper for pantry cooking
   */
  async cookFromPantry(ingredients: string[], dietary: string[] = []): Promise<Recipe[]> {
    const result = await this.findPantryRecommendations({ ingredients, dietary });
    return result.recommendations.map(r => r.recipe);
  },

  /**
   * Search query directly via Gemini
   */
  async searchRecipes(query: string, dietary: string[] = []): Promise<Recipe[]> {
    return this.discoverRecipes({ query, dietary });
  },
};

