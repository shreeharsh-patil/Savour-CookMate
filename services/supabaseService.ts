import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Recipe,
  PantryItem,
  UserProfile,
  UserPreferences,
  CookingHistoryItem,
  ShoppingListItem,
  AuthUser,
} from '../types';

// Read credentials from environment variables if configured
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

let client: SupabaseClient | null = null;
if (supabaseUrl && supabaseAnonKey) {
  try {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
  } catch (err) {
    console.warn('Supabase client initialization notice:', err);
  }
}

const STORAGE_KEYS = {
  AUTH_USER: 'savour_auth_user',
  USER_PROFILE: 'savour_user_profile',
  USER_PREFERENCES: 'savour_user_preferences',
  SAVED_RECIPES: 'savour_saved_recipes',
  PANTRY_ITEMS: 'savour_pantry_items',
  SHOPPING_LIST: 'savour_shopping_list',
  COOKING_HISTORY: 'savour_cooking_history',
};

const DEFAULT_PREFERENCES: UserPreferences = {
  diet: 'Non-Vegetarian',
  favoriteCuisines: ['Indian', 'Italian', 'Asian'],
  skillLevel: 'Intermediate',
  videoLanguages: ['English', 'Hindi'],
  spiceTolerance: 'Medium',
  onboardingCompleted: true,
};

const DEFAULT_PROFILE: UserProfile = {
  name: 'Gourmet Explorer',
  email: 'chef@savour.app',
  avatarUrl:
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  skillLevel: 'Home Cook',
  spiceTolerance: 'Medium',
  dietaryPreferences: ['Fresh Herbs', 'High Protein'],
  createdAt: new Date().toISOString(),
  isGuest: true,
};

export const supabaseService = {
  isConfigured(): boolean {
    return Boolean(client);
  },

  getClient(): SupabaseClient | null {
    return client;
  },

  // ==========================================
  // AUTHENTICATION
  // ==========================================
  async getCurrentUser(): Promise<AuthUser> {
    if (client) {
      try {
        const {
          data: { session },
        } = await client.auth.getSession();
        if (session?.user) {
          const u = session.user;
          return {
            id: u.id,
            email: u.email || '',
            name: u.user_metadata?.full_name || u.email?.split('@')[0] || 'Chef',
            avatarUrl: u.user_metadata?.avatar_url,
            isGuest: false,
          };
        }
      } catch (err) {
        console.warn('Session check notice:', err);
      }
    }

    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_USER);
      if (stored) return JSON.parse(stored);
    } catch {}

    const guest: AuthUser = {
      id: 'guest_' + Math.random().toString(36).substring(2, 9),
      email: 'guest@savour.app',
      name: 'Guest Chef',
      isGuest: true,
    };
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(guest));
    return guest;
  },

  async signInWithGoogle(): Promise<{ error?: string }> {
    if (!client) {
      // Local preview user for demo environment
      const mockGoogleUser: AuthUser = {
        id: 'google_usr_' + Math.random().toString(36).substring(2, 9),
        email: 'culinary.artist@gmail.com',
        name: 'Culinary Artist',
        avatarUrl:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        isGuest: false,
      };
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(mockGoogleUser));
      await this.updateUserProfile({
        name: mockGoogleUser.name,
        email: mockGoogleUser.email,
        isGuest: false,
      });
      return {};
    }

    try {
      const { error } = await client.auth.signInWithOAuth({
        provider: 'google',
      });
      if (error) return { error: error.message };
      return {};
    } catch (err: any) {
      return { error: err?.message || 'Google sign-in could not be completed' };
    }
  },

  async signInWithEmail(
    email: string,
    pass: string
  ): Promise<{ user?: AuthUser; error?: string }> {
    if (!client) {
      const user: AuthUser = {
        id: 'user_' + Math.random().toString(36).substring(2, 9),
        email,
        name: email.split('@')[0],
        isGuest: false,
      };
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
      await this.updateUserProfile({
        name: user.name,
        email: user.email,
        isGuest: false,
      });
      return { user };
    }

    try {
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password: pass,
      });
      if (error) return { error: error.message };
      if (data.user) {
        const u = data.user;
        const user: AuthUser = {
          id: u.id,
          email: u.email || '',
          name: u.user_metadata?.full_name || u.email?.split('@')[0] || 'Chef',
          avatarUrl: u.user_metadata?.avatar_url,
          isGuest: false,
        };
        await AsyncStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
        return { user };
      }
      return { error: 'Failed to sign in' };
    } catch (err: any) {
      return { error: err?.message || 'Sign in failed' };
    }
  },

  async signUpWithEmail(
    email: string,
    pass: string,
    name?: string
  ): Promise<{ user?: AuthUser; error?: string }> {
    if (!client) {
      const user: AuthUser = {
        id: 'user_' + Math.random().toString(36).substring(2, 9),
        email,
        name: name || email.split('@')[0],
        isGuest: false,
      };
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
      await this.updateUserProfile({
        name: user.name,
        email: user.email,
        isGuest: false,
      });
      return { user };
    }

    try {
      const { data, error } = await client.auth.signUp({
        email,
        password: pass,
        options: {
          data: { full_name: name || email.split('@')[0] },
        },
      });
      if (error) return { error: error.message };
      if (data.user) {
        const u = data.user;
        const user: AuthUser = {
          id: u.id,
          email: u.email || '',
          name: name || u.email?.split('@')[0] || 'Chef',
          avatarUrl: u.user_metadata?.avatar_url,
          isGuest: false,
        };
        await AsyncStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
        return { user };
      }
      return { error: 'Failed to sign up' };
    } catch (err: any) {
      return { error: err?.message || 'Sign up failed' };
    }
  },

  async signInAsGuest(): Promise<AuthUser> {
    const guest: AuthUser = {
      id: 'guest_' + Math.random().toString(36).substring(2, 9),
      email: 'guest@savour.app',
      name: 'Guest Chef',
      isGuest: true,
    };
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(guest));
    await this.updateUserProfile({
      name: 'Guest Chef',
      email: 'guest@savour.app',
      isGuest: true,
    });
    return guest;
  },

  async signOut(): Promise<void> {
    if (client) {
      try {
        await client.auth.signOut();
      } catch (e) {
        console.warn('Sign out error:', e);
      }
    }
    await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_USER);
  },

  // ==========================================
  // USER PROFILE & PREFERENCES
  // ==========================================
  async getUserProfile(): Promise<UserProfile> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      if (stored) return JSON.parse(stored);
    } catch {}
    return DEFAULT_PROFILE;
  },

  async updateUserProfile(partial: Partial<UserProfile>): Promise<UserProfile> {
    const current = await this.getUserProfile();
    const updated = { ...current, ...partial };
    await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(updated));
    return updated;
  },

  async getUserPreferences(): Promise<UserPreferences> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      if (stored) return JSON.parse(stored);
    } catch {}
    return DEFAULT_PREFERENCES;
  },

  async updateUserPreferences(
    partial: Partial<UserPreferences>
  ): Promise<UserPreferences> {
    const current = await this.getUserPreferences();
    const updated = { ...current, ...partial };
    await AsyncStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(updated));
    return updated;
  },

  // ==========================================
  // PANTRY ITEMS
  // ==========================================
  async getPantryItems(): Promise<PantryItem[]> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.PANTRY_ITEMS);
      if (stored) return JSON.parse(stored);
    } catch {}
    return [];
  },

  async savePantryItems(items: PantryItem[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.PANTRY_ITEMS, JSON.stringify(items));
  },

  // ==========================================
  // SAVED RECIPES
  // ==========================================
  async getSavedRecipes(): Promise<Recipe[]> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_RECIPES);
      if (stored) return JSON.parse(stored);
    } catch {}
    return [];
  },

  async saveRecipe(recipe: Recipe): Promise<void> {
    const current = await this.getSavedRecipes();
    const updated = [
      { ...recipe, isSaved: true, savedAt: new Date().toISOString() },
      ...current.filter((r) => r.id !== recipe.id),
    ];
    await AsyncStorage.setItem(STORAGE_KEYS.SAVED_RECIPES, JSON.stringify(updated));
  },

  async removeSavedRecipe(recipeId: string): Promise<void> {
    const current = await this.getSavedRecipes();
    const updated = current.filter((r) => r.id !== recipeId);
    await AsyncStorage.setItem(STORAGE_KEYS.SAVED_RECIPES, JSON.stringify(updated));
  },

  // ==========================================
  // SHOPPING LIST
  // ==========================================
  async getShoppingList(): Promise<ShoppingListItem[]> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.SHOPPING_LIST);
      if (stored) return JSON.parse(stored);
    } catch {}
    return [];
  },

  async saveShoppingList(items: ShoppingListItem[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.SHOPPING_LIST, JSON.stringify(items));
  },

  // ==========================================
  // COOKING HISTORY
  // ==========================================
  async getCookingHistory(): Promise<CookingHistoryItem[]> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.COOKING_HISTORY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return [];
  },

  async addCookingHistory(
    recipe: Recipe,
    rating?: number,
    notes?: string
  ): Promise<CookingHistoryItem> {
    const item: CookingHistoryItem = {
      id: String(Date.now()),
      recipeId: recipe.id,
      recipeTitle: recipe.title || recipe.name,
      recipeData: recipe,
      rating: rating || 5,
      notes,
      cookedAt: new Date().toISOString(),
    };
    const current = await this.getCookingHistory();
    const updated = [item, ...current];
    await AsyncStorage.setItem(STORAGE_KEYS.COOKING_HISTORY, JSON.stringify(updated));
    return item;
  },
};
