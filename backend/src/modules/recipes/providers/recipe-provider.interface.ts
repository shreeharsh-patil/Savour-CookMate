export interface NormalizedIngredientItem {
  name: string;
  normalizedName: string;
  quantity?: string;
  unit?: string;
  optional?: boolean;
  category?: string;
}

export interface NormalizedStepItem {
  stepNumber: number;
  instruction: string;
  timerMinutes?: number;
  chefTip?: string;
}

export interface NormalizedRecipe {
  externalId: string;
  provider: string; // "themealdb"
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  thumbnailUrl?: string;
  category?: string;
  cuisine?: string;
  ingredients: NormalizedIngredientItem[];
  instructions: string[];
  steps: NormalizedStepItem[];
  youtubeSearchQuery?: string;
  youtubeUrl?: string;
  youtubeVideoId?: string;
  sourceUrl?: string;
  totalTime?: number;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  dietaryTags: string[];
  difficulty?: string;
  searchKeywords: string[];
  lastSyncedAt: Date;
}

export interface RecipeProvider {
  readonly providerName: string;
  searchRecipes(query: string): Promise<NormalizedRecipe[]>;
  getRecipe(id: string): Promise<NormalizedRecipe | null>;
  getCategories(): Promise<string[]>;
  getCuisines(): Promise<string[]>;
  getIngredients(): Promise<string[]>;
  getByCategory(category: string): Promise<NormalizedRecipe[]>;
  getByCuisine(cuisine: string): Promise<NormalizedRecipe[]>;
  getByIngredient(ingredient: string): Promise<NormalizedRecipe[]>;
}
