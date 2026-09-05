import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Recipe,
  PantryItem,
  PantryCategory,
  PantryRecipeRecommendation,
  PantryMatchGroup,
  ShoppingListItem,
  CookingHistoryItem,
  UserProfile,
  UserPreferences,
  AuthUser,
  YouTubeVideo,
  DietType,
  CookingLevelType,
  SpiceLevelType,
  VideoLanguageType,
} from "../types";
import { api } from "../services/api";
import { mapMongoRecipeToClient, recipeService } from "../services/recipeService";
import { setStoredToken, clearStoredToken, getStoredToken } from "../services/apiClient";
import { firebaseSignIn, firebaseSignUp, firebaseSignOut, firebaseSignInWithGoogle } from "../services/firebaseClient";

interface ToastState {
  message: string;
  type?: "success" | "info" | "error";
}

interface AppState {
  // Auth & Profile
  currentUser: AuthUser | null;
  userProfile: UserProfile | null;
  userPreferences: UserPreferences;
  isAuthLoading: boolean;
  loadAuthUser: () => Promise<void>;
  signInWithGoogle: () => Promise<{ user?: AuthUser; error?: string }>;
  signInWithEmail: (email: string, pass: string) => Promise<{ user?: AuthUser; error?: string }>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<{ user?: AuthUser; error?: string }>;
  signInAsGuest: () => Promise<AuthUser>;
  signOut: () => Promise<void>;
  updateUserPreferences: (partial: Partial<UserPreferences>) => Promise<UserPreferences>;

  // Cooking History
  cookingHistory: CookingHistoryItem[];
  loadCookingHistory: () => Promise<void>;
  addCookingHistory: (recipe: Recipe, rating?: number, notes?: string) => Promise<CookingHistoryItem>;

  // Home Screen
  homeRecipes: Recipe[];
  isHomeLoading: boolean;
  homeError: string | null;
  activeHomeCategory: string;
  activeMindCategory: string;
  setActiveHomeCategory: (cat: string) => void;
  setActiveMindCategory: (cat: string | null) => void;
  loadHomeRecipes: (category?: string, refresh?: boolean, options?: any) => Promise<void>;
  searchHomeWithPrompt: (prompt: string) => Promise<void>;

  // Explore Screen
  exploreRecipes: Recipe[];
  isExploreLoading: boolean;
  exploreError: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCuisine: string;
  setSelectedCuisine: (cuisine: string) => void;
  selectedCuisineFilter: string;
  setSelectedCuisineFilter: (cuisine: string) => void;
  selectedDietary: string[];
  toggleDietary: (diet: string) => void;
  selectedDietaryFilter: string;
  setSelectedDietaryFilter: (diet: string) => void;
  searchExploreRecipes: (params?: any) => Promise<void>;
  loadCuratedRail: (rail: { query?: string; cuisine?: string; dietary?: string[]; maxCookTimeMinutes?: number }) => Promise<void>;

  // Pantry Screen
  pantryItems: PantryItem[];
  isPantryLoading: boolean;
  pantryRecommendations: PantryRecipeRecommendation[];
  pantryMatchFilter: PantryMatchGroup | "ALL";
  setPantryMatchFilter: (filter: PantryMatchGroup | "ALL") => void;
  isPantryCooking: boolean;
  pantryError: string | null;
  naturalLanguagePantryInput: string;
  setNaturalLanguagePantryInput: (val: string) => void;
  loadPantryItems: () => Promise<void>;
  addPantryItem: (name: string, category?: PantryCategory, quantity?: string, unit?: string, expiryDate?: string) => Promise<void>;
  restorePantryItem: (item: PantryItem) => Promise<void>;
  removePantryItem: (id: string) => Promise<void>;
  clearAllPantryItems: () => Promise<void>;
  findDishesICanMake: (prompt?: string) => Promise<void>;
  extractAndAddIngredients: (prompt: string) => Promise<void>;

  // Saved Recipes
  savedRecipes: Recipe[];
  isSavedLoading: boolean;
  loadSavedRecipes: () => Promise<void>;
  toggleSaveRecipe: (recipe: Recipe) => Promise<void>;
  saveRecipe: (recipe: Recipe) => Promise<void>;
  unsaveRecipe: (recipeId: string) => Promise<void>;
  isRecipeSaved: (recipeId: string) => boolean;

  // Recently Viewed Recipes
  recentlyViewedRecipes: Recipe[];
  loadRecentlyViewed: () => Promise<void>;
  addRecentlyViewed: (recipe: Recipe) => void;

  // Shopping List
  shoppingList: ShoppingListItem[];
  isShoppingListLoading: boolean;
  loadShoppingList: () => Promise<void>;
  addShoppingListItem: (name: string, recipeTitle?: string, recipeId?: string, category?: string) => Promise<void>;
  toggleShoppingListItem: (id: string) => Promise<void>;
  removeShoppingListItem: (id: string) => Promise<void>;
  clearCheckedShoppingList: () => Promise<void>;
  moveShoppingItemToPantry: (itemOrId: ShoppingListItem | string) => Promise<void>;
  addMissingToShoppingList: (
    missingOrRecipe: string[] | Recipe,
    recipeTitleOrMissing?: string | string[],
    recipeId?: string
  ) => Promise<void>;

  // Recipe-detail modal
  selectedRecipe: Recipe | null;
  setSelectedRecipe: (recipe: Recipe | null) => void;

  // Modals & Feedback
  isShoppingListOpen: boolean;
  setIsShoppingListOpen: (open: boolean) => void;
  isAuthModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  isOnboardingOpen: boolean;
  setOnboardingOpen: (open: boolean) => void;
  toast: ToastState | null;
  setToast: (toast: ToastState | string | null) => void;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  diet: "Vegetarian",
  allergies: [],
  favoriteCuisines: ["North Indian", "Italian", "Pan-Asian"],
  cookingSkill: "Beginner",
  skillLevel: "Beginner",
  videoLanguages: ["English"],
  maximumCookingTime: 45,
  spicePreference: "Medium",
  spiceTolerance: "Medium",
};

const RECENTLY_VIEWED_KEY = "@yummy_tummy_recently_viewed";
const LEGACY_RECENTLY_VIEWED_KEY = "@savour_recently_viewed";

async function readWithMigration(key: string, legacyKey: string): Promise<string | null> {
  const current = await AsyncStorage.getItem(key);
  if (current !== null) return current;

  const legacy = await AsyncStorage.getItem(legacyKey);
  if (legacy === null) return null;

  await AsyncStorage.setItem(key, legacy);
  await AsyncStorage.removeItem(legacyKey);
  return legacy;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Auth & Profile
  currentUser: null,
  userProfile: null,
  userPreferences: DEFAULT_PREFERENCES,
  isAuthLoading: false,

  loadAuthUser: async () => {
    try {
      // Restore recently viewed recipes.
      const savedRecent = await readWithMigration(RECENTLY_VIEWED_KEY, LEGACY_RECENTLY_VIEWED_KEY);
      if (savedRecent) {
        try {
          const parsed = JSON.parse(savedRecent);
          if (Array.isArray(parsed)) {
            set({ recentlyViewedRecipes: parsed });
          }
        } catch {}
      }

      // Fetch authenticated profile from MongoDB.
      const token = await getStoredToken();
      if (token) {
        try {
          const res = await api.auth.getMe();
          if (res?.user) {
            const authUser: AuthUser = {
              id: res.user.firebaseUid || res.user.id,
              email: res.user.email || "",
              name: res.user.displayName || "Home Cook",
              isGuest: res.user.isGuest || false,
              avatar: res.user.avatar,
            };
            set({
              currentUser: authUser,
              userProfile: {
                name: authUser.name,
                email: authUser.email,
                avatar: authUser.avatar,
                memberSince: new Date().getFullYear().toString(),
                totalRecipesCooked: 0,
                savedRecipeCount: 0,
                level: "Kitchen Explorer",
              },
            });
          } else {
            await clearStoredToken();
            await get().signInAsGuest();
          }
        } catch (authErr) {
          console.warn("Stored token invalid or expired, falling back to guest:", authErr);
          await clearStoredToken();
          await get().signInAsGuest();
        }
      } else {
        await get().signInAsGuest();
      }

      // Load initial user data
      await Promise.all([
        get().loadCookingHistory(),
        get().loadSavedRecipes(),
        get().loadPantryItems(),
        get().loadShoppingList(),
        get().loadHomeRecipes(),
      ]);
    } catch (err) {
      console.warn("Auth check notice:", err);
    }
  },

  signInWithGoogle: async () => {
    try {
      const { user: fbUser } = await firebaseSignInWithGoogle();
      const res = await api.auth.verifySession();
      if (res?.user || fbUser) {
        const user: AuthUser = {
          id: res?.user?.firebaseUid || fbUser.uid,
          name: res?.user?.displayName || fbUser.displayName || "Google Chef",
          email: res?.user?.email || fbUser.email || "",
          isGuest: false,
        };
        set({ currentUser: user, isAuthModalOpen: false });
        get().setToast({ message: `Welcome back, ${user.name}!`, type: "success" });
        return { user };
      }
      return { error: "Failed to verify session after Google Sign-In." };
    } catch (err: any) {
      return { error: err.message || "Google Sign-In failed." };
    }
  },

  signInWithEmail: async (email: string, pass: string) => {
    try {
      const { user: fbUser } = await firebaseSignIn(email, pass);
      const res = await api.auth.verifySession();
      const user: AuthUser = {
        id: res?.user?.firebaseUid || fbUser.uid,
        name: res?.user?.displayName || fbUser.displayName || email.split("@")[0],
        email: fbUser.email || email,
        isGuest: false,
      };
      set({ currentUser: user, isAuthModalOpen: false });
      get().setToast({ message: `Welcome back, ${user.name}!`, type: "success" });
      return { user };
    } catch (err: any) {
      let msg = "Sign in failed.";
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
        msg = "Invalid email or password.";
      } else if (err.code === "auth/user-not-found") {
        msg = "No account found with this email.";
      } else if (err.code === "auth/invalid-email") {
        msg = "Please enter a valid email address.";
      } else if (err.message) {
        msg = err.message;
      }
      return { error: msg };
    }
  },

  signUpWithEmail: async (email: string, pass: string, name: string) => {
    try {
      const { user: fbUser } = await firebaseSignUp(email, pass, name);
      const res = await api.auth.verifySession();
      const user: AuthUser = {
        id: res?.user?.firebaseUid || fbUser.uid,
        name: name || res?.user?.displayName || fbUser.displayName || email.split("@")[0],
        email: fbUser.email || email,
        isGuest: false,
      };
      set({ currentUser: user, isAuthModalOpen: false });
      get().setToast({ message: `Account created for ${user.name}!`, type: "success" });
      return { user };
    } catch (err: any) {
      let msg = "Sign up failed.";
      if (err.code === "auth/email-already-in-use") {
        msg = "An account with this email already exists.";
      } else if (err.code === "auth/weak-password") {
        msg = "Password should be at least 6 characters.";
      } else if (err.code === "auth/invalid-email") {
        msg = "Please enter a valid email address.";
      } else if (err.message) {
        msg = err.message;
      }
      return { error: msg };
    }
  },

  signInAsGuest: async () => {
    try {
      const res = await api.auth.createGuestSession();
      if (res?.token) {
        await setStoredToken(res.token);
      }
      // The guest id is the stable server-side identity (firebaseUid) for this
      // session - NOT the bearer token string (they happen to look similar today).
      const guestId =
        res?.user?.firebaseUid || res?.user?.id || res?.token || "guest_anonymous";
      const guest: AuthUser = {
        id: guestId,
        name: "Guest Chef",
        email: "",
        isGuest: true,
      };
      set({ currentUser: guest, isAuthModalOpen: false });
      return guest;
    } catch {
      const fallbackGuest: AuthUser = {
        id: "guest_anonymous",
        name: "Guest Chef",
        email: "",
        isGuest: true,
      };
      set({ currentUser: fallbackGuest, isAuthModalOpen: false });
      return fallbackGuest;
    }
  },

  signOut: async () => {
    await firebaseSignOut();
    set({ currentUser: null, userProfile: null });
    get().setToast({ message: "Signed out", type: "info" });
    await get().signInAsGuest();
  },

  updateUserPreferences: async (partial: Partial<UserPreferences>) => {
    const updated = { ...get().userPreferences, ...partial };
    set({ userPreferences: updated });
    try {
      await api.users.updatePreferences(updated);
    } catch {
      // offline fallback
    }
    return updated;
  },

  // Cooking History
  cookingHistory: [],
  loadCookingHistory: async () => {
    try {
      const records = await api.history.getHistory();
      set({
        cookingHistory: records.map((r) => ({
          id: r._id,
          recipeId: r.recipeId,
          recipeTitle: r.recipeName,
          cookedAt: r.cookedAt,
          rating: r.rating,
          notes: r.notes,
        })),
      });
    } catch {
      // offline
    }
  },

  addCookingHistory: async (recipe: Recipe, rating?: number, notes?: string) => {
    const item: CookingHistoryItem = {
      id: Date.now().toString(),
      recipeId: recipe.id,
      recipeTitle: recipe.title || recipe.name,
      cookedAt: new Date().toISOString(),
      rating,
      notes,
    };
    set((state) => ({ cookingHistory: [item, ...state.cookingHistory] }));
    try {
      await api.history.recordSession({
        recipeId: recipe.id,
        recipeName: recipe.title || recipe.name,
        recipeImage: recipe.imageUrl || "",
        durationMinutes: recipe.cookTime || 30,
        rating,
        notes,
      });
    } catch {
      // offline
    }
    return item;
  },

  // Home Screen
  homeRecipes: [],
  isHomeLoading: false,
  homeError: null,
  activeHomeCategory: "All",
  activeMindCategory: "",

  setActiveHomeCategory: (cat: string) => {
    set({ activeHomeCategory: cat, activeMindCategory: "" });
    get().loadHomeRecipes(cat);
  },

  setActiveMindCategory: (cat: string | null) => {
    set({ activeMindCategory: cat || "", activeHomeCategory: cat ? "" : "All" });
    if (cat) {
      get().loadHomeRecipes(`Category: ${cat}`, false, { query: cat, category: cat });
    }
  },

  loadHomeRecipes: async (category?: string, refresh?: boolean, options?: any) => {
    set({ isHomeLoading: true, homeError: null });
    try {
      const filterCategory = category || get().activeHomeCategory;
      const isGeneral = !filterCategory || filterCategory === "All" || filterCategory === "Fresh picks for you";
      const cleanCategory = filterCategory?.startsWith("Category: ")
        ? filterCategory.replace("Category: ", "")
        : filterCategory;

      const res = await api.recipes.getRecipes({
        cuisine: options?.cuisine || (!isGeneral && !options?.category ? cleanCategory : undefined),
        diet: options?.diet,
        mealType: options?.mealType,
        search: options?.query,
        limit: 20,
      });
      const recipes = (res.recipes || []).map(mapMongoRecipeToClient);
      set({ homeRecipes: recipes, isHomeLoading: false });
    } catch (err: any) {
      set({ isHomeLoading: false, homeError: err.message || "Failed to load recipes" });
    }
  },

  searchHomeWithPrompt: async (prompt: string) => {
    if (!prompt.trim()) return;
    set({ isHomeLoading: true, homeError: null });
    try {
      const res = await api.search.searchRecipes({ query: prompt.trim() });
      const recipes = (res.recipes || []).map(mapMongoRecipeToClient);
      set({ homeRecipes: recipes, isHomeLoading: false });
    } catch (err: any) {
      set({ isHomeLoading: false, homeError: err.message || "Search failed" });
    }
  },

  // Explore Screen
  exploreRecipes: [],
  isExploreLoading: false,
  exploreError: null,
  searchQuery: "",
  selectedCuisine: "All",
  selectedCuisineFilter: "All",
  selectedDietary: [],
  selectedDietaryFilter: "",

  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setSelectedCuisine: (cuisine: string) => {
    set({ selectedCuisine: cuisine, selectedCuisineFilter: cuisine });
    get().searchExploreRecipes({ cuisine });
  },
  setSelectedCuisineFilter: (cuisine: string) => {
    set({ selectedCuisine: cuisine, selectedCuisineFilter: cuisine });
    get().searchExploreRecipes({ cuisine });
  },
  toggleDietary: (diet: string) => {
    const current = get().selectedDietary;
    const exists = current.includes(diet);
    const updated = exists ? current.filter((d) => d !== diet) : [...current, diet];
    set({ selectedDietary: updated, selectedDietaryFilter: updated[0] || "" });
    get().searchExploreRecipes({ dietary: updated });
  },
  setSelectedDietaryFilter: (diet: string) => {
    set({ selectedDietaryFilter: diet, selectedDietary: diet ? [diet] : [] });
    get().searchExploreRecipes({ dietary: diet ? [diet] : [] });
  },

  searchExploreRecipes: async (params?: any) => {
    set({ isExploreLoading: true, exploreError: null });
    try {
      let q = get().searchQuery;
      let cuisine = get().selectedCuisineFilter;
      let diet = get().selectedDietaryFilter;

      if (typeof params === "string") {
        q = params;
      } else if (params && typeof params === "object") {
        if (params.query !== undefined) q = params.query;
        if (params.cuisine !== undefined) cuisine = params.cuisine;
        if (params.dietary !== undefined) diet = Array.isArray(params.dietary) ? params.dietary[0] : params.dietary;
        if (params.diet !== undefined) diet = params.diet;
      }

      const res = await api.search.searchRecipes({
        query: q,
        cuisine: cuisine !== "All" ? cuisine : undefined,
        diet: diet || undefined,
        maxCookingTime: params?.maxCookTimeMinutes,
      });

      const recipes = (res.recipes || []).map(mapMongoRecipeToClient);
      set({ exploreRecipes: recipes, isExploreLoading: false });
    } catch (err: any) {
      set({ isExploreLoading: false, exploreError: err.message || "Explore search failed" });
    }
  },

  loadCuratedRail: async (rail) => {
    set({ isExploreLoading: true, exploreError: null });
    try {
      const res = await api.recipes.getRecipes({
        cuisine: rail.cuisine,
        maxTime: rail.maxCookTimeMinutes,
        search: rail.query,
      });
      const recipes = (res.recipes || []).map(mapMongoRecipeToClient);
      set({ exploreRecipes: recipes, isExploreLoading: false });
    } catch (err: any) {
      set({ isExploreLoading: false, exploreError: err.message || "Failed to load rail" });
    }
  },

  // Pantry Screen
  pantryItems: [],
  isPantryLoading: false,
  pantryRecommendations: [],
  pantryMatchFilter: "ALL",
  setPantryMatchFilter: (filter: PantryMatchGroup | "ALL") => set({ pantryMatchFilter: filter }),
  isPantryCooking: false,
  pantryError: null,
  naturalLanguagePantryInput: "",

  setNaturalLanguagePantryInput: (val: string) => set({ naturalLanguagePantryInput: val }),

  loadPantryItems: async () => {
    set({ isPantryLoading: true });
    try {
      const res = await api.pantry.getItems();
      const items: PantryItem[] = (res.allItems || []).map((p) => ({
        id: p._id,
        name: p.name,
        category: (p.category as PantryCategory) || "Other",
        quantity: p.quantity,
        unit: p.unit,
        expiryDate: p.expiryDate,
        addedAt: p.createdAt || new Date().toISOString(),
      }));
      set({ pantryItems: items, isPantryLoading: false });
    } catch {
      set({ isPantryLoading: false });
    }
  },

  addPantryItem: async (name: string, category: PantryCategory = "Produce", quantity = "1", unit = "unit", expiryDate?: string) => {
    try {
      const created = await api.pantry.addItem({ name, quantity, unit, expiryDate, category });
      const item: PantryItem = {
        id: created?._id || Date.now().toString(),
        name,
        category,
        quantity,
        unit,
        expiryDate,
        addedAt: new Date().toISOString(),
      };
      set((state) => ({ pantryItems: [item, ...state.pantryItems.filter((i) => i.name.toLowerCase() !== name.toLowerCase())] }));
      get().setToast({ message: `Added ${name} to pantry`, type: "success" });
    } catch {
      // offline
    }
  },

  restorePantryItem: async (item: PantryItem) => {
    // Optimistically restore full item preserving all fields
    set((state) => ({
      pantryItems: [item, ...state.pantryItems.filter((i) => i.id !== item.id)],
    }));
    try {
      const created = await api.pantry.addItem({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        expiryDate: item.expiryDate,
        category: item.category,
      });
      // The re-created server document gets a NEW _id (the old row was deleted),
      // so reconcile the local entry to keep later remove/update calls valid.
      if (created?._id && created._id !== item.id) {
        set((state) => ({
          pantryItems: state.pantryItems.map((i) =>
            i.id === item.id ? { ...i, id: created._id } : i
          ),
        }));
      }
      get().setToast({ message: `Restored ${item.name}`, type: "success" });
    } catch {
      // offline
    }
  },

  removePantryItem: async (id: string) => {
    set((state) => ({ pantryItems: state.pantryItems.filter((i) => i.id !== id) }));
    try {
      await api.pantry.removeItem(id);
    } catch {
      // offline
    }
  },

  clearAllPantryItems: async () => {
    const items = get().pantryItems;
    set({ pantryItems: [] });
    for (const item of items) {
      api.pantry.removeItem(item.id).catch(() => {});
    }
  },

  findDishesICanMake: async () => {
    set({ isPantryCooking: true, pantryError: null });
    try {
      const items = get().pantryItems.map((p) => p.name);
      const prompt = get().naturalLanguagePantryInput;
      const res = await recipeService.findPantryRecommendations({
        selectedIngredients: items,
        naturalLanguagePrompt: prompt,
      });
      set({ pantryRecommendations: res.recommendations, isPantryCooking: false });
    } catch (err: any) {
      set({ isPantryCooking: false, pantryError: err.message || "Failed to find dishes" });
    }
  },

  extractAndAddIngredients: async (prompt: string) => {
    if (!prompt.trim()) return;
    try {
      const res = await api.search.searchRecipes({ query: prompt });
      const ingredients = res.interpretedIntent?.ingredients || [];
      for (const ing of ingredients) {
        await get().addPantryItem(ing);
      }
      if (ingredients.length > 0) {
        get().setToast({ message: `Added ${ingredients.length} items from text!`, type: "success" });
      }
      set({ naturalLanguagePantryInput: "" });
    } catch {
      // fallback
    }
  },

  // Saved Recipes
  savedRecipes: [],
  isSavedLoading: false,

  loadSavedRecipes: async () => {
    set({ isSavedLoading: true });
    try {
      const favs = await api.favorites.getFavorites();
      const recipes = favs.map((f) => ({
        ...mapMongoRecipeToClient(f.recipe),
        isSaved: true,
      }));
      set({ savedRecipes: recipes, isSavedLoading: false });
    } catch {
      set({ isSavedLoading: false });
    }
  },

  toggleSaveRecipe: async (recipe: Recipe) => {
    const isSaved = get().isRecipeSaved(recipe.id);
    if (isSaved) {
      await get().unsaveRecipe(recipe.id);
    } else {
      await get().saveRecipe(recipe);
    }
  },

  saveRecipe: async (recipe: Recipe) => {
    const updated = { ...recipe, isSaved: true };
    set((state) => ({ savedRecipes: [updated, ...state.savedRecipes.filter((r) => r.id !== recipe.id)] }));
    get().setToast({ message: "Recipe saved to vault", type: "success" });
    try {
      await api.favorites.toggleFavorite(recipe.id);
    } catch {
      // offline
    }
  },

  unsaveRecipe: async (recipeId: string) => {
    set((state) => ({ savedRecipes: state.savedRecipes.filter((r) => r.id !== recipeId) }));
    get().setToast({ message: "Recipe removed", type: "info" });
    try {
      await api.favorites.toggleFavorite(recipeId);
    } catch {
      // offline
    }
  },

  isRecipeSaved: (recipeId: string) => {
    return get().savedRecipes.some((r) => r.id === recipeId);
  },

  // Recently Viewed Recipes
  recentlyViewedRecipes: [],

  loadRecentlyViewed: async () => {
    try {
      const stored = await readWithMigration(RECENTLY_VIEWED_KEY, LEGACY_RECENTLY_VIEWED_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          set({ recentlyViewedRecipes: parsed });
        }
      }
    } catch {}
  },

  addRecentlyViewed: (recipe: Recipe) => {
    if (!recipe || !recipe.id) return;
    set((state) => {
      const filtered = state.recentlyViewedRecipes.filter((r) => r.id !== recipe.id);
      const updated = [recipe, ...filtered].slice(0, 10);
      AsyncStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated)).catch(() => {});
      return { recentlyViewedRecipes: updated };
    });
  },

  // Shopping List
  shoppingList: [],
  isShoppingListLoading: false,

  loadShoppingList: async () => {
    set({ isShoppingListLoading: true });
    try {
      const items = await api.shopping.getList();
      set({
        shoppingList: items.map((i) => ({
          id: i._id,
          name: i.name,
          recipeId: i.recipeId,
          category: i.category,
          checked: i.isChecked,
        })),
        isShoppingListLoading: false,
      });
    } catch {
      set({ isShoppingListLoading: false });
    }
  },

  addShoppingListItem: async (name: string, recipeTitle?: string, recipeId?: string, category = "General") => {
    try {
      const res = await api.shopping.addItem(name, "1", "unit", category, recipeId);
      const item: ShoppingListItem = {
        id: res._id || Date.now().toString(),
        name,
        recipeTitle,
        recipeId,
        category,
        checked: false,
      };
      set((state) => ({ shoppingList: [item, ...state.shoppingList] }));
      get().setToast({ message: `Added ${name} to shopping list`, type: "success" });
    } catch {
      // offline
    }
  },

  toggleShoppingListItem: async (id: string) => {
    set((state) => ({
      shoppingList: state.shoppingList.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)),
    }));
    try {
      await api.shopping.toggleChecked(id);
    } catch {
      // offline
    }
  },

  removeShoppingListItem: async (id: string) => {
    set((state) => ({ shoppingList: state.shoppingList.filter((i) => i.id !== id) }));
    try {
      await api.shopping.removeItem(id);
    } catch {
      // offline
    }
  },

  clearCheckedShoppingList: async () => {
    set((state) => ({ shoppingList: state.shoppingList.filter((i) => !i.checked) }));
    try {
      await api.shopping.clearChecked();
    } catch {
      // offline
    }
  },

  moveShoppingItemToPantry: async (itemOrId: ShoppingListItem | string) => {
    const item =
      typeof itemOrId === "string"
        ? get().shoppingList.find((i) => i.id === itemOrId)
        : itemOrId;
    if (!item) return;
    await get().addPantryItem(item.name);
    await get().removeShoppingListItem(item.id);
  },

  addMissingToShoppingList: async (
    missingOrRecipe: string[] | Recipe,
    recipeTitleOrMissing?: string | string[],
    recipeId?: string
  ) => {
    try {
      if (Array.isArray(missingOrRecipe)) {
        const items = missingOrRecipe;
        const title = typeof recipeTitleOrMissing === "string" ? recipeTitleOrMissing : undefined;
        for (const name of items) {
          await get().addShoppingListItem(name, title, recipeId);
        }
        get().setToast({ message: `Added ${items.length} items to shopping list!`, type: "success" });
      } else if (missingOrRecipe && typeof missingOrRecipe === "object") {
        const recipe = missingOrRecipe as Recipe;
        const res = await api.shopping.addMissingFromRecipe(recipe.id);
        await get().loadShoppingList();
        get().setToast({ message: `Added ${res.addedCount} items to shopping list!`, type: "success" });
      }
    } catch {
      get().setToast({
        message: "Couldn't update the shopping list. Please try again.",
        type: "error",
      });
    }
  },

  selectedRecipe: null,

  setSelectedRecipe: (recipe) => {
    set({ selectedRecipe: recipe });
    if (recipe) {
      get().addRecentlyViewed(recipe);
      if ((!recipe.instructions || recipe.instructions.length === 0) && (recipe.id || recipe.slug)) {
        api.recipes
          .getById(recipe.id || recipe.slug!)
          .then((full: any) => {
            if (full && Array.isArray(full.instructions) && full.instructions.length > 0) {
              const mapped = mapMongoRecipeToClient(full);
              const current = get().selectedRecipe;
              if (current && (current.id === recipe.id || current.slug === recipe.slug)) {
                set({ selectedRecipe: mapped });
              }
            }
          })
          .catch((err: any) => console.warn("Failed to hydrate recipe detail:", err));
      }
    }
  },

  // Modals & Feedback
  isShoppingListOpen: false,
  setIsShoppingListOpen: (open: boolean) => set({ isShoppingListOpen: open }),

  isAuthModalOpen: false,
  setAuthModalOpen: (open: boolean) => set({ isAuthModalOpen: open }),

  isOnboardingOpen: false,
  setOnboardingOpen: (open: boolean) => set({ isOnboardingOpen: open }),

  toast: null,
  setToast: (toast: ToastState | string | null) => {
    const toastObj: ToastState | null =
      typeof toast === "string" ? { message: toast, type: "info" } : toast;
    set({ toast: toastObj });
    if (toastObj) {
      setTimeout(() => {
        if (get().toast?.message === toastObj.message) {
          set({ toast: null });
        }
      }, 3500);
    }
  },
}));
