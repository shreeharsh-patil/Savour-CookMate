import {
  Recipe,
  RecipeFilterOptions,
  PantryRecipeRecommendation,
  PantryQueryOptions,
  PantryIntelligenceResult,
} from '../types';
import { apiRequest } from './apiClient';
import { validateRecipes, validateRecipe } from '../utils/recipeValidator';
import { evaluateRecipeMatch } from '../utils/pantryMatcher';

// High-definition culinary photography registry for rich visual representation
const CULINARY_IMAGE_REGISTRY: Record<string, string> = {
  biryani:
    'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=1200&q=80',
  paneer:
    'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=1200&q=80',
  dosa:
    'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=1200&q=80',
  goan:
    'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=1200&q=80',
  curry:
    'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=1200&q=80',
  indian:
    'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=1200&q=80',
  chicken:
    'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=1200&q=80',
  prawn:
    'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=1200&q=80',
  fish:
    'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=1200&q=80',
  seafood:
    'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=1200&q=80',
  salmon:
    'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=1200&q=80',
  pasta:
    'https://images.unsplash.com/photo-1621996346565-e3d5d6281292?auto=format&fit=crop&w=1200&q=80',
  steak:
    'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
  taco:
    'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=1200&q=80',
  pizza:
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80',
  burger:
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80',
  salad:
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80',
  soup:
    'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=1200&q=80',
  ramen:
    'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1200&q=80',
  sushi:
    'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=1200&q=80',
  dessert:
    'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=1200&q=80',
  cake:
    'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1200&q=80',
  breakfast:
    'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=1200&q=80',
  rice:
    'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=1200&q=80',
  egg:
    'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=1200&q=80',
};

export function resolveFoodImage(title: string, keyword?: string): string {
  const combined = `${title || ''} ${keyword || ''}`.toLowerCase();
  for (const [key, url] of Object.entries(CULINARY_IMAGE_REGISTRY)) {
    if (combined.includes(key)) {
      return url;
    }
  }
  return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80';
}

export const recipeService = {
  /**
   * Discovers fresh, authentic recipes via Savour backend API
   */
  async discoverRecipes(options: RecipeFilterOptions = {}): Promise<Recipe[]> {
    const data = await apiRequest<{ recipes: any[] }>('/api/recipes/discover', {
      method: 'POST',
      body: JSON.stringify(options),
      timeoutMs: 25000, // Generation can take a few seconds
      retries: 1,
    });

    const rawList = Array.isArray(data?.recipes) ? data.recipes : [];
    const validated = validateRecipes(rawList);

    return validated.map((recipe) => ({
      ...recipe,
      imageUrl: recipe.imageUrl || resolveFoodImage(recipe.title, recipe.imageKeyword),
    }));
  },

  /**
   * "Cook With What I Have" - Finds recipes matching available pantry items
   */
  async findPantryRecommendations(
    options: PantryQueryOptions
  ): Promise<PantryIntelligenceResult> {
    const data = await apiRequest<{
      recommendations?: any[];
      extractedIngredients?: string[];
      extractedPreferences?: string;
    }>('/api/recipes/pantry', {
      method: 'POST',
      body: JSON.stringify(options),
      timeoutMs: 25000,
      retries: 1,
    });

    const rawRecs = Array.isArray(data?.recommendations) ? data.recommendations : [];
    const effectivePantry = [
      ...(options.ingredients || []),
      ...(data.extractedIngredients || []),
    ];

    const validatedRecs: PantryRecipeRecommendation[] = [];

    for (const item of rawRecs) {
      const validRecipe = validateRecipe(item.recipe || item);
      if (!validRecipe) continue;

      const enrichedRecipe = {
        ...validRecipe,
        imageUrl: validRecipe.imageUrl || resolveFoodImage(validRecipe.title, validRecipe.imageKeyword),
      };

      const evaluated = evaluateRecipeMatch(
        enrichedRecipe,
        effectivePantry,
        item.reasonForRecommendation,
        item.matchPercentage
      );

      validatedRecs.push(evaluated);
    }

    return {
      recommendations: validatedRecs,
      extractedIngredients: data.extractedIngredients || [],
      extractedPreferences: data.extractedPreferences || '',
    };
  },

  /**
   * Extracts ingredients and dietary preferences from conversational natural language text
   */
  async extractIngredientsFromPrompt(
    prompt: string
  ): Promise<{ ingredients: string[]; preferences: string }> {
    const data = await apiRequest<{ ingredients: string[]; preferences: string }>(
      '/api/pantry/extract',
      {
        method: 'POST',
        body: JSON.stringify({ prompt }),
        timeoutMs: 12000,
      }
    );

    return {
      ingredients: Array.isArray(data?.ingredients) ? data.ingredients : [],
      preferences: data?.preferences || '',
    };
  },
};
