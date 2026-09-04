/**
 * Savour CookMate - Core Type Definitions
 */

export type TabType = 'home' | 'explore' | 'pantry' | 'saved' | 'profile';

export type DietType = 'Vegetarian' | 'Non-Vegetarian' | 'Vegan' | 'Eggetarian';
export type CookingLevelType = 'Beginner' | 'Intermediate' | 'Advanced';
export type SpiceLevelType = 'Mild' | 'Medium' | 'Hot' | 'Fiery';
export type VideoLanguageType = 'English' | 'Hindi' | 'Marathi' | 'Konkani' | 'Tamil' | 'Telugu';

export type PantryCategory =
  | 'Produce'
  | 'Dairy & Eggs'
  | 'Meat & Seafood'
  | 'Pantry & Grains'
  | 'Spices & Oils'
  | 'Other';

export interface Ingredient {
  name: string;
  normalizedName: string;
  quantity: string;
  unit: string;
  optional: boolean;
  category: string;
  // UI compatibility aliases
  item?: string;
  amount?: string;
  inPantry?: boolean;
}

export interface RecipeSubstitution {
  ingredient: string;
  substitute: string;
}

export interface InstructionStep {
  stepNumber: number;
  title: string;
  text: string;
  timeMinutes?: number;
  tip?: string;
}

export interface Recipe {
  id: string;
  name: string;
  title: string;
  description: string;
  cuisine: string;
  mealType: string;
  diet: DietType | string;
  difficulty: 'Easy' | 'Medium' | 'Advanced' | string;
  prepTime: number; // in minutes
  cookTime: number; // in minutes
  totalTime: number; // in minutes
  servings: number;
  calories: number;
  ratingEstimate: number;
  ingredients: Ingredient[];
  instructions: string[];
  tips: string[];
  substitutions: RecipeSubstitution[];
  tags: string[];
  imageSearchQuery: string;
  youtubeSearchQuery: string;

  // UI and computed metadata
  tagline?: string;
  imageUrl?: string;
  imageKeyword?: string;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  proteinGrams?: number;
  carbsGrams?: number;
  fatGrams?: number;
  fiberGrams?: number;
  chefTips?: string[];
  usedPantryItems?: string[];
  missingStaples?: string[];
  isSaved?: boolean;
  savedAt?: string;
  userRating?: number;
  personalNotes?: string;
  parsedSteps?: InstructionStep[];
}

export interface PantryItem {
  id: string;
  name: string;
  category: PantryCategory;
  quantity?: string;
  unit?: string;
  expiryDate?: string;
  addedAt: string;
}

export type PantryMatchGroup = 'MAKE NOW' | 'ALMOST THERE' | 'GOOD MATCH' | 'WORTH SHOPPING FOR';

export interface PantryRecipeRecommendation {
  recipe: Recipe;
  matchPercentage: number;
  availableIngredients: string[];
  missingIngredients: string[];
  optionalMissingIngredients: string[];
  reasonForRecommendation: string;
  group: PantryMatchGroup;
  matchGroup?: PantryMatchGroup;
  totalRequiredCount: number;
  availableCount: number;
}

export interface ShoppingListItem {
  id: string;
  name: string;
  recipeTitle?: string;
  recipeId?: string;
  category?: string;
  checked: boolean;
  addedAt: string;
}

export interface SavedCollection {
  id: string;
  name: string;
  description?: string;
  recipeIds: string[];
  iconName?: string;
}

export interface YouTubeVideo {
  id: string;
  title: string;
  channelTitle: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  embedUrl: string;
  duration?: string;
  durationSeconds?: number;
  views?: string;
  viewCount?: number;
  language?: string;
  relevanceScore?: number;
  isQuick?: boolean;
  isDetailed?: boolean;
}

export interface UserPreferences {
  diet: DietType;
  favoriteCuisines: string[];
  skillLevel: CookingLevelType;
  videoLanguages: VideoLanguageType[];
  spiceTolerance: SpiceLevelType;
  onboardingCompleted: boolean;
}

export interface CookingHistoryItem {
  id: string;
  userId?: string;
  recipeId: string;
  recipeTitle: string;
  recipeData: Recipe;
  rating?: number;
  notes?: string;
  cookedAt: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  isGuest: boolean;
}

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  avatarUrl: string;
  skillLevel: CookingLevelType | string;
  spiceTolerance: SpiceLevelType;
  dietaryPreferences: string[];
  createdAt: string;
  isGuest?: boolean;
}

export interface RecipeFilterOptions {
  category?: string;
  query?: string;
  cuisine?: string;
  dietary?: string[];
  diet?: DietType | string;
  skillLevel?: CookingLevelType | string;
  videoLanguages?: VideoLanguageType[];
  maxCookTimeMinutes?: number;
  naturalLanguagePrompt?: string;
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
