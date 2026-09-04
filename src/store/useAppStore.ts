import { create } from 'zustand';
import {
  Recipe,
  PantryItem,
  YouTubeVideo,
  UserProfile,
  TabType,
  RecipeFilterOptions,
  PantryRecipeRecommendation,
  PantryMatchGroup,
  ShoppingListItem,
  AuthUser,
  UserPreferences,
  CookingHistoryItem,
} from '../types';
import { recipeService } from '../services/recipeService';
import { supabaseService } from '../services/supabaseService';
import { geminiService } from '../services/geminiService';

interface AppState {
  // Navigation & View
  activeTab: TabType;
  deviceFrame: boolean; // toggle phone frame vs wide
  setActiveTab: (tab: TabType) => void;
  toggleDeviceFrame: () => void;

  // Authentication & Onboarding
  currentUser: AuthUser | null;
  userPreferences: UserPreferences;
  cookingHistory: CookingHistoryItem[];
  isAuthModalOpen: boolean;
  isOnboardingOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  setOnboardingOpen: (open: boolean) => void;
  loadAuthUser: () => Promise<void>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  signInWithEmail: (email: string, pass: string) => Promise<{ error?: string }>;
  signUpWithEmail: (email: string, pass: string, name?: string) => Promise<{ error?: string }>;
  signInAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;
  loadUserPreferences: () => Promise<void>;
  updateUserPreferences: (partial: Partial<UserPreferences>) => Promise<void>;
  loadCookingHistory: () => Promise<void>;
  addCookingHistory: (recipe: Recipe, rating?: number, notes?: string) => Promise<void>;

  // Selected Recipe & Cooking Mode
  selectedRecipe: Recipe | null;
  activeVideo: YouTubeVideo | null;
  isCookingMode: boolean;
  cookingStepIndex: number;
  cookingTimerSeconds: number;
  isTimerRunning: boolean;
  setSelectedRecipe: (recipe: Recipe | null) => void;
  setActiveVideo: (video: YouTubeVideo | null) => void;
  startCookingMode: (recipe: Recipe) => void;
  exitCookingMode: () => void;
  setCookingStepIndex: (index: number) => void;
  setCookingTimerSeconds: (seconds: number) => void;
  setIsTimerRunning: (running: boolean) => void;

  // Home Feed & Live Channels
  homeRecipes: Recipe[];
  isHomeLoading: boolean;
  homeError: string | null;
  activeHomeCategory: string;
  activeMindCategory: string | null;
  homeCategoryCache: Record<string, Recipe[]>;
  setActiveHomeCategory: (category: string) => void;
  setActiveMindCategory: (category: string | null) => void;
  loadHomeRecipes: (category?: string, refresh?: boolean, customOptions?: RecipeFilterOptions) => Promise<void>;
  searchHomeWithPrompt: (prompt: string) => Promise<void>;

  // Explore & Search Feed
  exploreRecipes: Recipe[];
  isExploreLoading: boolean;
  exploreError: string | null;
  searchQuery: string;
  selectedCuisine: string;
  selectedDietary: string[];
  maxCookTime: number;
  setSearchQuery: (q: string) => void;
  setSelectedCuisine: (c: string) => void;
  toggleDietary: (d: string) => void;
  setMaxCookTime: (t: number) => void;
  searchExploreRecipes: (customOptions?: RecipeFilterOptions) => Promise<void>;

  // Pantry & "Cook With What I Have"
  pantryItems: PantryItem[];
  pantryRecipes: Recipe[];
  pantryRecommendations: PantryRecipeRecommendation[];
  pantryMatchFilter: PantryMatchGroup | 'ALL';
  naturalLanguagePantryInput: string;
  isPantryLoading: boolean;
  isPantryCooking: boolean;
  pantryError: string | null;
  setPantryMatchFilter: (filter: PantryMatchGroup | 'ALL') => void;
  setNaturalLanguagePantryInput: (val: string) => void;
  loadPantryItems: () => Promise<void>;
  addPantryItem: (name: string, category: PantryItem['category'], quantity?: string) => Promise<void>;
  removePantryItem: (id: string) => Promise<void>;
  clearAllPantryItems: () => Promise<void>;
  findDishesICanMake: (promptOverride?: string) => Promise<void>;
  extractAndAddIngredients: (prompt: string) => Promise<string[]>;
  cookWithPantry: () => Promise<void>;

  // Shopping List
  shoppingList: ShoppingListItem[];
  loadShoppingList: () => Promise<void>;
  addMissingToShoppingList: (missingItems: string[], recipeTitle?: string, recipeId?: string) => Promise<void>;
  toggleShoppingListItem: (id: string) => Promise<void>;
  removeShoppingListItem: (id: string) => Promise<void>;
  clearCheckedShoppingList: () => Promise<void>;
  moveShoppingItemToPantry: (id: string) => Promise<void>;

  // Saved Recipes
  savedRecipes: Recipe[];
  isSavedLoading: boolean;
  loadSavedRecipes: () => Promise<void>;
  toggleSaveRecipe: (recipe: Recipe) => Promise<void>;

  // User Profile
  userProfile: UserProfile;
  loadUserProfile: () => Promise<void>;
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>;

  // Notification Toast
  toastMessage: string | null;
  setToast: (msg: string | null) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  activeTab: 'home',
  deviceFrame: true, // Default to sleek mobile frame
  setActiveTab: (tab) => set({ activeTab: tab }),
  toggleDeviceFrame: () => set((state) => ({ deviceFrame: !state.deviceFrame })),

  // Authentication & Onboarding
  currentUser: null,
  userPreferences: {
    diet: 'Non-Vegetarian',
    favoriteCuisines: ['Indian', 'Italian', 'Asian'],
    skillLevel: 'Intermediate',
    videoLanguages: ['English', 'Hindi'],
    spiceTolerance: 'Medium',
    onboardingCompleted: false,
  },
  cookingHistory: [],
  isAuthModalOpen: false,
  isOnboardingOpen: false,
  setAuthModalOpen: (open) => set({ isAuthModalOpen: open }),
  setOnboardingOpen: (open) => set({ isOnboardingOpen: open }),

  loadAuthUser: async () => {
    try {
      const user = await supabaseService.getCurrentUser();
      const prefs = await supabaseService.getUserPreferences();
      const profile = await supabaseService.getUserProfile();
      const history = await supabaseService.getCookingHistory();
      set({
        currentUser: user,
        userPreferences: prefs,
        userProfile: profile,
        cookingHistory: history,
        isOnboardingOpen: !prefs.onboardingCompleted,
      });
    } catch (e) {
      console.warn('Auth initialization fallback:', e);
    }
  },

  signInWithGoogle: async () => {
    const res = await supabaseService.signInWithGoogle();
    if (!res.error) {
      const user = await supabaseService.getCurrentUser();
      const profile = await supabaseService.getUserProfile();
      set({ currentUser: user, userProfile: profile, isAuthModalOpen: false });
      get().setToast(`Welcome, ${user.name}!`);
      // Reload user data
      await Promise.all([
        get().loadPantryItems(),
        get().loadSavedRecipes(),
        get().loadShoppingList(),
        get().loadCookingHistory(),
      ]);
    }
    return res;
  },

  signInWithEmail: async (email, pass) => {
    const res = await supabaseService.signInWithEmail(email, pass);
    if (!res.error && res.user) {
      const profile = await supabaseService.getUserProfile();
      set({ currentUser: res.user, userProfile: profile, isAuthModalOpen: false });
      get().setToast(`Signed in as ${res.user.name}`);
      await Promise.all([
        get().loadPantryItems(),
        get().loadSavedRecipes(),
        get().loadShoppingList(),
        get().loadCookingHistory(),
      ]);
    }
    return { error: res.error };
  },

  signUpWithEmail: async (email, pass, name) => {
    const res = await supabaseService.signUpWithEmail(email, pass, name);
    if (!res.error && res.user) {
      const profile = await supabaseService.getUserProfile();
      set({ currentUser: res.user, userProfile: profile, isAuthModalOpen: false });
      get().setToast(`Account created for ${res.user.name}!`);
      await Promise.all([
        get().loadPantryItems(),
        get().loadSavedRecipes(),
        get().loadShoppingList(),
        get().loadCookingHistory(),
      ]);
    }
    return { error: res.error };
  },

  signInAsGuest: async () => {
    const guest = await supabaseService.signInAsGuest();
    set({ currentUser: guest, isAuthModalOpen: false });
    get().setToast('Browsing as Guest Chef');
  },

  signOut: async () => {
    await supabaseService.signOut();
    const guest = await supabaseService.getCurrentUser();
    set({
      currentUser: guest,
      savedRecipes: [],
      cookingHistory: [],
      pantryRecommendations: [],
    });
    get().setToast('Signed out successfully');
  },

  loadUserPreferences: async () => {
    const prefs = await supabaseService.getUserPreferences();
    set({ userPreferences: prefs });
  },

  updateUserPreferences: async (partial) => {
    const updated = await supabaseService.updateUserPreferences(partial);
    set({ userPreferences: updated });
    get().setToast('Preferences saved');
    // Invalidate home category cache so fresh Gemini recommendations match new preferences
    set({ homeCategoryCache: {} });
    get().loadHomeRecipes(get().activeHomeCategory, true);
  },

  loadCookingHistory: async () => {
    const history = await supabaseService.getCookingHistory();
    set({ cookingHistory: history });
  },

  addCookingHistory: async (recipe, rating, notes) => {
    const item = await supabaseService.addCookingHistory(recipe, rating, notes);
    set((state) => ({
      cookingHistory: [item, ...state.cookingHistory.filter(h => h.id !== item.id)],
    }));
  },

  selectedRecipe: null,
  activeVideo: null,
  isCookingMode: false,
  cookingStepIndex: 0,
  cookingTimerSeconds: 0,
  isTimerRunning: false,
  setSelectedRecipe: (recipe) => set({ selectedRecipe: recipe }),
  setActiveVideo: (video) => set({ activeVideo: video }),
  startCookingMode: (recipe) => set({
    selectedRecipe: recipe,
    isCookingMode: true,
    cookingStepIndex: 0,
    cookingTimerSeconds: ((recipe.instructions[0] as any)?.timeMinutes || 5) * 60,
    isTimerRunning: false,
  }),
  exitCookingMode: () => set({ isCookingMode: false, isTimerRunning: false }),
  setCookingStepIndex: (index) => {
    const recipe = get().selectedRecipe;
    const stepTime = (recipe?.instructions[index] as any)?.timeMinutes || 5;
    set({
      cookingStepIndex: index,
      cookingTimerSeconds: stepTime * 60,
      isTimerRunning: false,
    });
  },
  setCookingTimerSeconds: (seconds) => set({ cookingTimerSeconds: seconds }),
  setIsTimerRunning: (running) => set({ isTimerRunning: running }),

  // Home Feed & Live Channels
  homeRecipes: [],
  isHomeLoading: false,
  homeError: null,
  activeHomeCategory: 'Top Picks',
  activeMindCategory: null,
  homeCategoryCache: {},
  setActiveHomeCategory: (category) => {
    set({ activeHomeCategory: category, activeMindCategory: null });
    get().loadHomeRecipes(category, false);
  },
  setActiveMindCategory: (category) => {
    if (!category) {
      set({ activeMindCategory: null });
      return;
    }
    set({ activeMindCategory: category });
    get().loadHomeRecipes(`What's on your mind: ${category}`, false, { query: category, category });
  },
  loadHomeRecipes: async (category = 'Top Picks', refresh = false, customOptions = {}) => {
    const cacheKey = customOptions.query || category;
    const cache = get().homeCategoryCache;

    // Use cached Gemini results if available and not explicitly refreshing
    if (!refresh && cache[cacheKey] && cache[cacheKey].length > 0) {
      set({ homeRecipes: cache[cacheKey], isHomeLoading: false, homeError: null });
      return;
    }

    set({ isHomeLoading: true, homeError: null });
    try {
      const prefs = get().userPreferences;
      const options: RecipeFilterOptions = {
        category,
        diet: prefs?.diet,
        skillLevel: prefs?.skillLevel,
        videoLanguages: prefs?.videoLanguages,
        ...customOptions,
      };

      // If category is "Because You Like...", inject user profile taste preferences
      if (category === 'Because You Like...') {
        const profile = get().userProfile;
        options.dietary = profile.dietaryPreferences;
        options.query = `${profile.spiceTolerance} spice, curated for ${prefs?.skillLevel || profile.skillLevel}`;
      } else if (category === 'Quick Meals') {
        options.maxCookTimeMinutes = 25;
      } else if (category === 'High Protein') {
        options.dietary = ['High-Protein'];
      } else if (category === 'Goan') {
        options.cuisine = 'Goan';
        options.query = 'Authentic Goan seafood curries and coastal delicacies';
      } else if (category === 'Indian') {
        options.cuisine = 'Indian';
      }

      const recipes = await recipeService.discoverRecipes(options);
      set((state) => ({
        homeRecipes: recipes,
        isHomeLoading: false,
        homeCategoryCache: {
          ...state.homeCategoryCache,
          [cacheKey]: recipes,
        },
      }));
    } catch (err: any) {
      console.error('Failed to load home recipes:', err);
      set({
        homeError: err?.message || 'Unable to connect to Gemini Recipe service. Please check connection.',
        isHomeLoading: false,
      });
    }
  },

  searchHomeWithPrompt: async (prompt: string) => {
    if (!prompt.trim()) return;
    set({ isHomeLoading: true, homeError: null, activeMindCategory: null, activeHomeCategory: prompt });
    try {
      const recipes = await recipeService.discoverRecipes({
        query: prompt,
        naturalLanguagePrompt: prompt,
      });
      set((state) => ({
        homeRecipes: recipes,
        isHomeLoading: false,
        homeCategoryCache: {
          ...state.homeCategoryCache,
          [prompt]: recipes,
        },
      }));
    } catch (err: any) {
      console.error('Natural language search failed:', err);
      set({
        homeError: err?.message || 'Failed to analyze request with Gemini.',
        isHomeLoading: false,
      });
    }
  },

  // Explore Feed
  exploreRecipes: [],
  isExploreLoading: false,
  exploreError: null,
  searchQuery: '',
  selectedCuisine: 'All',
  selectedDietary: [],
  maxCookTime: 60,
  setSearchQuery: (q) => set({ searchQuery: q }),
  setSelectedCuisine: (c) => set({ selectedCuisine: c }),
  toggleDietary: (d) => {
    const current = get().selectedDietary;
    const updated = current.includes(d) ? current.filter(item => item !== d) : [...current, d];
    set({ selectedDietary: updated });
  },
  setMaxCookTime: (t) => set({ maxCookTime: t }),
  searchExploreRecipes: async (customOptions) => {
    set({ isExploreLoading: true, exploreError: null });
    try {
      const prefs = get().userPreferences;
      const query = customOptions?.query !== undefined ? customOptions.query : get().searchQuery;
      const cuisine = customOptions?.cuisine !== undefined ? customOptions.cuisine : get().selectedCuisine;
      const dietary = customOptions?.dietary !== undefined ? customOptions.dietary : get().selectedDietary;
      const maxCookTimeMinutes = customOptions?.maxCookTimeMinutes || get().maxCookTime;

      const recipes = await recipeService.discoverRecipes({
        query: query.trim() || undefined,
        cuisine: cuisine !== 'All' ? cuisine : undefined,
        dietary: dietary.length > 0 ? dietary : undefined,
        diet: prefs?.diet,
        skillLevel: prefs?.skillLevel,
        videoLanguages: prefs?.videoLanguages,
        maxCookTimeMinutes,
      });
      set({ exploreRecipes: recipes, isExploreLoading: false });
    } catch (err: any) {
      console.error('Explore search failed:', err);
      set({
        exploreError: err?.message || 'Failed to search recipes via Gemini.',
        isExploreLoading: false,
      });
    }
  },

  // Pantry & "Cook With What I Have"
  pantryItems: [],
  pantryRecipes: [],
  pantryRecommendations: [],
  pantryMatchFilter: 'ALL',
  naturalLanguagePantryInput: '',
  isPantryLoading: false,
  isPantryCooking: false,
  pantryError: null,
  setPantryMatchFilter: (filter) => set({ pantryMatchFilter: filter }),
  setNaturalLanguagePantryInput: (val) => set({ naturalLanguagePantryInput: val }),

  loadPantryItems: async () => {
    set({ isPantryLoading: true });
    try {
      const items = await supabaseService.getPantryItems();
      set({ pantryItems: items, isPantryLoading: false });
    } catch {
      set({ isPantryLoading: false });
    }
  },

  addPantryItem: async (name, category, quantity) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    // Check if already exists in pantry (case insensitive)
    const existing = get().pantryItems.find(i => i.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      get().setToast(`${trimmed} is already in your kitchen pantry`);
      return;
    }

    const newItem: PantryItem = {
      id: String(Date.now() + Math.random()),
      name: trimmed,
      category: category || 'Produce',
      quantity: quantity?.trim() || '1 portion',
      addedAt: new Date().toISOString(),
    };
    const updated = [newItem, ...get().pantryItems];
    set({ pantryItems: updated });
    await supabaseService.savePantryItems(updated);
    get().setToast(`Added ${trimmed} to My Kitchen`);
  },

  removePantryItem: async (id) => {
    const updated = get().pantryItems.filter(i => i.id !== id);
    set({ pantryItems: updated });
    await supabaseService.savePantryItems(updated);
  },

  clearAllPantryItems: async () => {
    set({ pantryItems: [], pantryRecommendations: [], pantryRecipes: [] });
    await supabaseService.savePantryItems([]);
    get().setToast('Pantry cleared');
  },

  extractAndAddIngredients: async (prompt: string) => {
    const trimmed = prompt.trim();
    if (!trimmed) return [];
    try {
      const { ingredients } = await geminiService.extractIngredientsFromPrompt(trimmed);
      if (Array.isArray(ingredients) && ingredients.length > 0) {
        let addedCount = 0;
        const currentItems = [...get().pantryItems];
        for (const ing of ingredients) {
          const clean = ing.trim();
          if (!clean) continue;
          if (!currentItems.some(i => i.name.toLowerCase() === clean.toLowerCase())) {
            currentItems.unshift({
              id: String(Date.now() + Math.random()),
              name: clean,
              category: 'Produce',
              quantity: 'Available',
              addedAt: new Date().toISOString(),
            });
            addedCount++;
          }
        }
        set({ pantryItems: currentItems });
        await supabaseService.savePantryItems(currentItems);
        if (addedCount > 0) {
          get().setToast(`Extracted and added ${addedCount} ingredients to Kitchen!`);
        }
        return ingredients;
      }
      return [];
    } catch (e) {
      console.warn('Could not extract ingredients via AI:', e);
      return [];
    }
  },

  findDishesICanMake: async (promptOverride?: string) => {
    const availableIngredients = get().pantryItems.map(i => i.name);
    const nlPrompt = promptOverride !== undefined ? promptOverride : get().naturalLanguagePantryInput;

    if (availableIngredients.length === 0 && !nlPrompt.trim()) {
      set({ pantryError: 'Please enter ingredients or describe what you have in your kitchen.' });
      return;
    }

    set({ isPantryCooking: true, pantryError: null });

    try {
      const prefs = get().userPreferences;
      const result = await recipeService.findPantryRecommendations({
        ingredients: availableIngredients,
        naturalLanguagePrompt: nlPrompt.trim() || undefined,
        dietary: get().selectedDietary,
        diet: prefs?.diet,
        skillLevel: prefs?.skillLevel,
      });

      // If user typed new ingredients in the prompt, auto-persist newly extracted items into their pantry
      if (Array.isArray(result.extractedIngredients) && result.extractedIngredients.length > 0) {
        const currentItems = [...get().pantryItems];
        let addedCount = 0;
        for (const extractedName of result.extractedIngredients) {
          const clean = extractedName.trim();
          if (!clean) continue;
          if (!currentItems.some(i => i.name.toLowerCase() === clean.toLowerCase())) {
            currentItems.unshift({
              id: String(Date.now() + Math.random()),
              name: clean,
              category: 'Produce',
              quantity: 'Available',
              addedAt: new Date().toISOString(),
            });
            addedCount++;
          }
        }
        if (addedCount > 0) {
          set({ pantryItems: currentItems });
          await supabaseService.savePantryItems(currentItems);
        }
      }

      set({
        pantryRecommendations: result.recommendations,
        pantryRecipes: result.recommendations.map(r => r.recipe),
        isPantryCooking: false,
      });

      if (result.recommendations.length > 0) {
        get().setToast(`Found ${result.recommendations.length} culinary dishes for your kitchen!`);
      }
    } catch (err: any) {
      console.error('Pantry cooking error:', err);
      set({
        pantryError: err?.message || 'Gemini could not find dishes for your ingredients. Try adding a staple or two.',
        isPantryCooking: false,
      });
    }
  },

  cookWithPantry: async () => {
    return get().findDishesICanMake();
  },

  // Shopping List
  shoppingList: JSON.parse(localStorage.getItem('savor_shopping_list') || '[]'),

  loadShoppingList: async () => {
    try {
      const raw = localStorage.getItem('savor_shopping_list');
      if (raw) {
        set({ shoppingList: JSON.parse(raw) });
      }
    } catch (e) {
      console.error('Failed to parse shopping list:', e);
    }
  },

  addMissingToShoppingList: async (missingItems: string[], recipeTitle?: string, recipeId?: string) => {
    if (!missingItems || missingItems.length === 0) return;
    const current = get().shoppingList;
    const newItems: ShoppingListItem[] = [];

    for (const item of missingItems) {
      const trimmed = item.trim();
      if (!trimmed) continue;
      // avoid exact duplicates for the same recipe
      if (!current.some(c => c.name.toLowerCase() === trimmed.toLowerCase() && !c.checked)) {
        newItems.push({
          id: String(Date.now() + Math.random()),
          name: trimmed,
          recipeTitle,
          recipeId,
          checked: false,
          addedAt: new Date().toISOString(),
        });
      }
    }

    if (newItems.length === 0) {
      get().setToast('Items are already on your shopping list');
      return;
    }

    const updated = [...newItems, ...current];
    set({ shoppingList: updated });
    localStorage.setItem('savor_shopping_list', JSON.stringify(updated));
    get().setToast(`Added ${newItems.length} missing ingredient${newItems.length > 1 ? 's' : ''} to Shopping List`);
  },

  toggleShoppingListItem: async (id: string) => {
    const updated = get().shoppingList.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    set({ shoppingList: updated });
    localStorage.setItem('savor_shopping_list', JSON.stringify(updated));
  },

  removeShoppingListItem: async (id: string) => {
    const updated = get().shoppingList.filter(item => item.id !== id);
    set({ shoppingList: updated });
    localStorage.setItem('savor_shopping_list', JSON.stringify(updated));
  },

  clearCheckedShoppingList: async () => {
    const updated = get().shoppingList.filter(item => !item.checked);
    set({ shoppingList: updated });
    localStorage.setItem('savor_shopping_list', JSON.stringify(updated));
    get().setToast('Cleared checked items from Shopping List');
  },

  moveShoppingItemToPantry: async (id: string) => {
    const target = get().shoppingList.find(i => i.id === id);
    if (!target) return;

    // Add to pantry
    await get().addPantryItem(target.name, 'Pantry & Grains', '1 unit');
    // Remove from shopping list
    await get().removeShoppingListItem(id);
    get().setToast(`Moved ${target.name} to My Kitchen!`);
  },

  // Saved Recipes
  savedRecipes: [],
  isSavedLoading: false,
  loadSavedRecipes: async () => {
    set({ isSavedLoading: true });
    try {
      const recipes = await supabaseService.getSavedRecipes();
      set({ savedRecipes: recipes, isSavedLoading: false });
    } catch {
      set({ isSavedLoading: false });
    }
  },
  toggleSaveRecipe: async (recipe) => {
    const isCurrentlySaved = Boolean(recipe.isSaved || get().savedRecipes.some(r => r.id === recipe.id));
    const nextStatus = !isCurrentlySaved;

    // Optimistically update home & explore & selected
    const updatedRecipe = { ...recipe, isSaved: nextStatus };
    set((state) => ({
      selectedRecipe: state.selectedRecipe?.id === recipe.id ? updatedRecipe : state.selectedRecipe,
      homeRecipes: state.homeRecipes.map(r => r.id === recipe.id ? updatedRecipe : r),
      exploreRecipes: state.exploreRecipes.map(r => r.id === recipe.id ? updatedRecipe : r),
      pantryRecipes: state.pantryRecipes.map(r => r.id === recipe.id ? updatedRecipe : r),
    }));

    if (nextStatus) {
      await supabaseService.saveRecipe(updatedRecipe);
      set((state) => ({ savedRecipes: [updatedRecipe, ...state.savedRecipes.filter(r => r.id !== recipe.id)] }));
      get().setToast(`Saved "${recipe.title}" to collection`);
    } else {
      await supabaseService.removeSavedRecipe(recipe.id);
      set((state) => ({ savedRecipes: state.savedRecipes.filter(r => r.id !== recipe.id) }));
      get().setToast(`Removed from saved collection`);
    }
  },

  // Profile
  userProfile: {
    name: 'Gourmet Chef',
    email: 'shreeharsh.dev@gmail.com',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    skillLevel: 'Home Cook',
    spiceTolerance: 'Medium',
    dietaryPreferences: ['Fresh Herbs', 'High Protein'],
    supabaseConnected: supabaseService.isConfigured(),
    createdAt: new Date().toISOString(),
  },
  loadUserProfile: async () => {
    const profile = await supabaseService.getUserProfile();
    set({ userProfile: profile });
  },
  updateUserProfile: async (partial) => {
    const updated = await supabaseService.updateUserProfile(partial);
    set({ userProfile: updated });
    get().setToast('Profile preferences updated');
  },

  toastMessage: null,
  setToast: (msg) => {
    set({ toastMessage: msg });
    if (msg) {
      setTimeout(() => {
        if (get().toastMessage === msg) {
          set({ toastMessage: null });
        }
      }, 2600);
    }
  },
}));
