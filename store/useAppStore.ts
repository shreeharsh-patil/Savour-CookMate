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

interface AppState {
  // Navigation & View
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;

  // Authentication & Onboarding
  currentUser: AuthUser | null;
  userPreferences: UserPreferences;
  cookingHistory: CookingHistoryItem[];
  isAuthModalOpen: boolean;
  isOnboardingOpen: boolean;
  isShoppingListOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  setOnboardingOpen: (open: boolean) => void;
  setIsShoppingListOpen: (open: boolean) => void;
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

  // Home Feed
  homeRecipes: Recipe[];
  isHomeLoading: boolean;
  homeError: string | null;
  activeHomeCategory: string;
  activeMindCategory: string | null;
  homeCategoryCache: Record<string, Recipe[]>;
  setActiveHomeCategory: (category: string) => void;
  setActiveMindCategory: (category: string | null) => void;
  loadHomeRecipes: (
    category?: string,
    refresh?: boolean,
    customOptions?: RecipeFilterOptions
  ) => Promise<void>;
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
  addPantryItem: (
    name: string,
    category: PantryItem['category'],
    quantity?: string
  ) => Promise<void>;
  removePantryItem: (id: string) => Promise<void>;
  clearAllPantryItems: () => Promise<void>;
  findDishesICanMake: (promptOverride?: string) => Promise<void>;
  extractAndAddIngredients: (prompt: string) => Promise<string[]>;

  // Shopping List
  shoppingList: ShoppingListItem[];
  loadShoppingList: () => Promise<void>;
  addMissingToShoppingList: (
    missingItems: string[],
    recipeTitle?: string,
    recipeId?: string
  ) => Promise<void>;
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
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Authentication & Onboarding
  currentUser: null,
  userPreferences: {
    diet: 'Non-Vegetarian',
    favoriteCuisines: ['Indian', 'Italian', 'Asian'],
    skillLevel: 'Intermediate',
    videoLanguages: ['English', 'Hindi'],
    spiceTolerance: 'Medium',
    onboardingCompleted: true,
  },
  cookingHistory: [],
  isAuthModalOpen: false,
  isOnboardingOpen: false,
  isShoppingListOpen: false,
  setAuthModalOpen: (open) => set({ isAuthModalOpen: open }),
  setOnboardingOpen: (open) => set({ isOnboardingOpen: open }),
  setIsShoppingListOpen: (open) => set({ isShoppingListOpen: open }),

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
      });
    } catch (e) {
      console.warn('Auth initialization notice:', e);
    }
  },

  signInWithGoogle: async () => {
    const res = await supabaseService.signInWithGoogle();
    if (!res.error) {
      const user = await supabaseService.getCurrentUser();
      const profile = await supabaseService.getUserProfile();
      set({ currentUser: user, userProfile: profile, isAuthModalOpen: false });
      get().setToast(`Welcome, ${user.name}!`);
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
    // Invalidate home category cache so fresh recommendations match new preferences
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
      cookingHistory: [item, ...state.cookingHistory.filter((h) => h.id !== item.id)],
    }));
  },

  // Selected Recipe & Cooking Mode
  selectedRecipe: null,
  activeVideo: null,
  isCookingMode: false,
  cookingStepIndex: 0,
  cookingTimerSeconds: 0,
  isTimerRunning: false,

  setSelectedRecipe: (recipe) => set({ selectedRecipe: recipe }),
  setActiveVideo: (video) => set({ activeVideo: video }),

  startCookingMode: (recipe) => {
    const firstStep = recipe.instructions[0];
    const initialSeconds =
      typeof firstStep === 'object' && (firstStep as any)?.timeMinutes
        ? (firstStep as any).timeMinutes * 60
        : 300;

    set({
      selectedRecipe: recipe,
      isCookingMode: true,
      cookingStepIndex: 0,
      cookingTimerSeconds: initialSeconds,
      isTimerRunning: false,
    });
  },

  exitCookingMode: () => set({ isCookingMode: false, isTimerRunning: false }),

  setCookingStepIndex: (index) => {
    const recipe = get().selectedRecipe;
    const step = recipe?.instructions[index];
    const stepTime =
      typeof step === 'object' && (step as any)?.timeMinutes
        ? (step as any).timeMinutes * 60
        : 300;

    set({
      cookingStepIndex: index,
      cookingTimerSeconds: stepTime,
      isTimerRunning: false,
    });
  },

  setCookingTimerSeconds: (seconds) => set({ cookingTimerSeconds: seconds }),
  setIsTimerRunning: (running) => set({ isTimerRunning: running }),

  // Home Feed
  homeRecipes: [],
  isHomeLoading: false,
  homeError: null,
  activeHomeCategory: 'Fresh picks for you',
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
    get().loadHomeRecipes(`Category: ${category}`, false, {
      query: category,
      category,
    });
  },

  loadHomeRecipes: async (
    category = 'Fresh picks for you',
    refresh = false,
    customOptions = {}
  ) => {
    const cacheKey = customOptions.query || category;
    const cache = get().homeCategoryCache;

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

      if (category === 'Quick Meals') {
        options.maxCookTimeMinutes = 25;
      } else if (category === 'High Protein') {
        options.dietary = ['High-Protein'];
      } else if (category === 'Goan Favourites') {
        options.cuisine = 'Goan';
        options.query = 'Authentic Goan seafood curries and coastal delicacies';
      } else if (category === 'Indian Classics') {
        options.cuisine = 'Indian';
      }

      const recipes = await recipeService.discoverRecipes(options);
      const saved = await supabaseService.getSavedRecipes();
      const savedIds = new Set(saved.map((s) => s.id));

      const enriched = recipes.map((r) => ({
        ...r,
        isSaved: savedIds.has(r.id),
      }));

      set((state) => ({
        homeRecipes: enriched,
        isHomeLoading: false,
        homeCategoryCache: {
          ...state.homeCategoryCache,
          [cacheKey]: enriched,
        },
      }));
    } catch (err: any) {
      console.warn('Failed to load home recommendations:', err);
      set({
        homeError:
          err?.message ||
          'Unable to load fresh recommendations right now. Please check connection.',
        isHomeLoading: false,
      });
    }
  },

  searchHomeWithPrompt: async (prompt: string) => {
    if (!prompt.trim()) return;
    set({
      isHomeLoading: true,
      homeError: null,
      activeMindCategory: null,
      activeHomeCategory: prompt,
    });
    try {
      const recipes = await recipeService.discoverRecipes({
        query: prompt,
        naturalLanguagePrompt: prompt,
      });
      const saved = await supabaseService.getSavedRecipes();
      const savedIds = new Set(saved.map((s) => s.id));

      const enriched = recipes.map((r) => ({
        ...r,
        isSaved: savedIds.has(r.id),
      }));

      set((state) => ({
        homeRecipes: enriched,
        isHomeLoading: false,
        homeCategoryCache: {
          ...state.homeCategoryCache,
          [prompt]: enriched,
        },
      }));
    } catch (err: any) {
      console.warn('Natural language search notice:', err);
      set({
        homeError:
          err?.message || 'Could not find recipes matching this request. Try another idea.',
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
    const updated = current.includes(d)
      ? current.filter((item) => item !== d)
      : [...current, d];
    set({ selectedDietary: updated });
  },
  setMaxCookTime: (t) => set({ maxCookTime: t }),

  searchExploreRecipes: async (customOptions) => {
    set({ isExploreLoading: true, exploreError: null });
    try {
      const prefs = get().userPreferences;
      const query =
        customOptions?.query !== undefined ? customOptions.query : get().searchQuery;
      const cuisine =
        customOptions?.cuisine !== undefined
          ? customOptions.cuisine
          : get().selectedCuisine;
      const dietary =
        customOptions?.dietary !== undefined
          ? customOptions.dietary
          : get().selectedDietary;
      const maxCookTimeMinutes =
        customOptions?.maxCookTimeMinutes || get().maxCookTime;

      const recipes = await recipeService.discoverRecipes({
        query: query.trim() || undefined,
        cuisine: cuisine !== 'All' ? cuisine : undefined,
        dietary: dietary.length > 0 ? dietary : undefined,
        diet: prefs?.diet,
        skillLevel: prefs?.skillLevel,
        videoLanguages: prefs?.videoLanguages,
        maxCookTimeMinutes,
      });

      const saved = await supabaseService.getSavedRecipes();
      const savedIds = new Set(saved.map((s) => s.id));

      const enriched = recipes.map((r) => ({
        ...r,
        isSaved: savedIds.has(r.id),
      }));

      set({ exploreRecipes: enriched, isExploreLoading: false });
    } catch (err: any) {
      console.warn('Explore search notice:', err);
      set({
        exploreError: err?.message || 'Failed to find matching recipes.',
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

    const existing = get().pantryItems.find(
      (i) => i.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (existing) {
      get().setToast(`${trimmed} is already in your kitchen`);
      return;
    }

    const newItem: PantryItem = {
      id: String(Date.now() + Math.random()),
      name: trimmed,
      category: category || 'Produce',
      quantity: quantity?.trim() || 'Available',
      addedAt: new Date().toISOString(),
    };
    const updated = [newItem, ...get().pantryItems];
    set({ pantryItems: updated });
    await supabaseService.savePantryItems(updated);
    get().setToast(`Added ${trimmed} to My Kitchen`);
  },

  removePantryItem: async (id) => {
    const updated = get().pantryItems.filter((i) => i.id !== id);
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
      const { ingredients } = await recipeService.extractIngredientsFromPrompt(trimmed);
      if (Array.isArray(ingredients) && ingredients.length > 0) {
        let addedCount = 0;
        const currentItems = [...get().pantryItems];
        for (const ing of ingredients) {
          const clean = ing.trim();
          if (!clean) continue;
          if (!currentItems.some((i) => i.name.toLowerCase() === clean.toLowerCase())) {
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
          get().setToast(`Added ${addedCount} ingredients to your kitchen!`);
        }
        return ingredients;
      }
      return [];
    } catch (e) {
      console.warn('Could not extract ingredients:', e);
      return [];
    }
  },

  findDishesICanMake: async (promptOverride?: string) => {
    const availableIngredients = get().pantryItems.map((i) => i.name);
    const nlPrompt =
      promptOverride !== undefined
        ? promptOverride
        : get().naturalLanguagePantryInput;

    if (availableIngredients.length === 0 && !nlPrompt.trim()) {
      set({
        pantryError:
          'Please enter ingredients or describe what you have in your kitchen.',
      });
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

      // Auto-add newly extracted ingredients from prompt
      if (
        Array.isArray(result.extractedIngredients) &&
        result.extractedIngredients.length > 0
      ) {
        const currentItems = [...get().pantryItems];
        let addedCount = 0;
        for (const extractedName of result.extractedIngredients) {
          const clean = extractedName.trim();
          if (!clean) continue;
          if (!currentItems.some((i) => i.name.toLowerCase() === clean.toLowerCase())) {
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
        pantryRecipes: result.recommendations.map((r) => r.recipe),
        isPantryCooking: false,
      });

      if (result.recommendations.length > 0) {
        get().setToast(
          `Found ${result.recommendations.length} dishes for your kitchen!`
        );
      }
    } catch (err: any) {
      console.warn('Pantry cooking notice:', err);
      set({
        pantryError:
          err?.message ||
          'Could not find matching dishes right now. Try adding a pantry staple or two.',
        isPantryCooking: false,
      });
    }
  },

  // Shopping List
  shoppingList: [],

  loadShoppingList: async () => {
    try {
      const items = await supabaseService.getShoppingList();
      set({ shoppingList: items });
    } catch (e) {
      console.warn('Shopping list load notice:', e);
    }
  },

  addMissingToShoppingList: async (
    missingItems: string[],
    recipeTitle?: string,
    recipeId?: string
  ) => {
    if (!missingItems || missingItems.length === 0) return;
    const current = get().shoppingList;
    const newItems: ShoppingListItem[] = [];

    for (const item of missingItems) {
      const trimmed = item.trim();
      if (!trimmed) continue;
      if (
        !current.some(
          (c) => c.name.toLowerCase() === trimmed.toLowerCase() && !c.checked
        )
      ) {
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
    await supabaseService.saveShoppingList(updated);
    get().setToast(
      `Added ${newItems.length} missing ingredient${newItems.length > 1 ? 's' : ''} to Shopping List`
    );
  },

  toggleShoppingListItem: async (id: string) => {
    const updated = get().shoppingList.map((item) =>
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    set({ shoppingList: updated });
    await supabaseService.saveShoppingList(updated);
  },

  removeShoppingListItem: async (id: string) => {
    const updated = get().shoppingList.filter((item) => item.id !== id);
    set({ shoppingList: updated });
    await supabaseService.saveShoppingList(updated);
  },

  clearCheckedShoppingList: async () => {
    const updated = get().shoppingList.filter((item) => !item.checked);
    set({ shoppingList: updated });
    await supabaseService.saveShoppingList(updated);
    get().setToast('Cleared checked items from Shopping List');
  },

  moveShoppingItemToPantry: async (id: string) => {
    const target = get().shoppingList.find((i) => i.id === id);
    if (!target) return;

    await get().addPantryItem(target.name, 'Pantry & Grains', '1 unit');
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
    const isCurrentlySaved = Boolean(
      recipe.isSaved || get().savedRecipes.some((r) => r.id === recipe.id)
    );
    const nextStatus = !isCurrentlySaved;

    const updatedRecipe = { ...recipe, isSaved: nextStatus };
    set((state) => ({
      selectedRecipe:
        state.selectedRecipe?.id === recipe.id
          ? updatedRecipe
          : state.selectedRecipe,
      homeRecipes: state.homeRecipes.map((r) =>
        r.id === recipe.id ? updatedRecipe : r
      ),
      exploreRecipes: state.exploreRecipes.map((r) =>
        r.id === recipe.id ? updatedRecipe : r
      ),
      pantryRecipes: state.pantryRecipes.map((r) =>
        r.id === recipe.id ? updatedRecipe : r
      ),
    }));

    if (nextStatus) {
      await supabaseService.saveRecipe(updatedRecipe);
      set((state) => ({
        savedRecipes: [
          updatedRecipe,
          ...state.savedRecipes.filter((r) => r.id !== recipe.id),
        ],
      }));
      get().setToast(`Saved "${recipe.title}" to collection`);
    } else {
      await supabaseService.removeSavedRecipe(recipe.id);
      set((state) => ({
        savedRecipes: state.savedRecipes.filter((r) => r.id !== recipe.id),
      }));
      get().setToast(`Removed from saved collection`);
    }
  },

  // User Profile
  userProfile: {
    name: 'Gourmet Chef',
    email: 'chef@savour.app',
    avatarUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    skillLevel: 'Home Cook',
    spiceTolerance: 'Medium',
    dietaryPreferences: ['Fresh Herbs', 'High Protein'],
    createdAt: new Date().toISOString(),
    isGuest: true,
  },

  loadUserProfile: async () => {
    const profile = await supabaseService.getUserProfile();
    set({ userProfile: profile });
  },

  updateUserProfile: async (partial) => {
    const updated = await supabaseService.updateUserProfile(partial);
    set({ userProfile: updated });
    get().setToast('Profile updated');
  },

  // Notification Toast
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
