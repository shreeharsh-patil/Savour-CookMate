import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Recipe,
  PantryItem,
  UserProfile,
  UserPreferences,
  CookingHistoryItem,
  ShoppingListItem,
  AuthUser,
  DietType,
  CookingLevelType,
  VideoLanguageType,
} from '../types';

// Read credentials from client-side environment (or default)
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

let client: SupabaseClient | null = null;
if (supabaseUrl && supabaseAnonKey) {
  try {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  } catch (err) {
    console.warn('Supabase client initialization warning:', err);
  }
}

const STORAGE_KEYS = {
  AUTH_USER: 'savor_auth_user',
  USER_PROFILE: 'savor_user_profile',
  USER_PREFERENCES: 'savor_user_preferences',
  SAVED_RECIPES: 'savor_saved_recipes',
  PANTRY_ITEMS: 'savor_pantry_items',
  SHOPPING_LIST: 'savor_shopping_list',
  COOKING_HISTORY: 'savor_cooking_history',
};

const DEFAULT_PREFERENCES: UserPreferences = {
  diet: 'Non-Vegetarian',
  favoriteCuisines: ['Indian', 'Italian', 'Asian'],
  skillLevel: 'Intermediate',
  videoLanguages: ['English', 'Hindi'],
  spiceTolerance: 'Medium',
  onboardingCompleted: false,
};

const DEFAULT_PROFILE: UserProfile = {
  name: 'Gourmet Explorer',
  email: 'guest.chef@savor.app',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  skillLevel: 'Home Cook',
  spiceTolerance: 'Medium',
  dietaryPreferences: ['Fresh Herbs', 'High Protein'],
  supabaseConnected: Boolean(client),
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
        const { data: { session } } = await client.auth.getSession();
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
        console.warn('Session check warning:', err);
      }
    }

    // Local storage fallback
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
      if (stored) return JSON.parse(stored);
    } catch {}

    const guest: AuthUser = {
      id: 'guest_' + Math.random().toString(36).substring(2, 9),
      email: 'guest@savor.app',
      name: 'Guest Chef',
      isGuest: true,
    };
    localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(guest));
    return guest;
  },

  async signInWithGoogle(): Promise<{ error?: string }> {
    if (!client) {
      // Offline / unconfigured preview demo login
      const mockGoogleUser: AuthUser = {
        id: 'google_usr_' + Math.random().toString(36).substring(2, 9),
        email: 'culinary.artist@gmail.com',
        name: 'Culinary Artist',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        isGuest: false,
      };
      localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(mockGoogleUser));
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
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) return { error: error.message };
      return {};
    } catch (err: any) {
      return { error: err?.message || 'Google sign-in failed' };
    }
  },

  async signInWithEmail(email: string, password: string): Promise<{ user?: AuthUser; error?: string }> {
    if (!client) {
      // Local demo auth
      const user: AuthUser = {
        id: 'user_' + Math.random().toString(36).substring(2, 9),
        email,
        name: email.split('@')[0],
        isGuest: false,
      };
      localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
      await this.updateUserProfile({ name: user.name, email: user.email, isGuest: false });
      return { user };
    }

    try {
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      if (data.user) {
        const u: AuthUser = {
          id: data.user.id,
          email: data.user.email || '',
          name: data.user.user_metadata?.full_name || email.split('@')[0],
          avatarUrl: data.user.user_metadata?.avatar_url,
          isGuest: false,
        };
        localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(u));
        return { user: u };
      }
      return { error: 'Authentication failed' };
    } catch (err: any) {
      return { error: err?.message || 'Sign in failed' };
    }
  },

  async signUpWithEmail(email: string, password: string, fullName?: string): Promise<{ user?: AuthUser; error?: string }> {
    if (!client) {
      const user: AuthUser = {
        id: 'user_' + Math.random().toString(36).substring(2, 9),
        email,
        name: fullName || email.split('@')[0],
        isGuest: false,
      };
      localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
      await this.updateUserProfile({ name: user.name, email: user.email, isGuest: false });
      return { user };
    }

    try {
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName || email.split('@')[0] },
        },
      });
      if (error) return { error: error.message };
      if (data.user) {
        const u: AuthUser = {
          id: data.user.id,
          email: data.user.email || '',
          name: fullName || email.split('@')[0],
          isGuest: false,
        };
        localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(u));
        return { user: u };
      }
      return { error: 'Sign up failed' };
    } catch (err: any) {
      return { error: err?.message || 'Sign up failed' };
    }
  },

  async signInAsGuest(): Promise<AuthUser> {
    const guest: AuthUser = {
      id: 'guest_' + Math.random().toString(36).substring(2, 9),
      email: 'guest@savor.kitchen',
      name: 'Guest Chef',
      isGuest: true,
    };
    localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(guest));
    return guest;
  },

  async signOut(): Promise<void> {
    if (client) {
      try {
        await client.auth.signOut();
      } catch {}
    }
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
  },

  // ==========================================
  // USER PREFERENCES (Diet, Cooking Level, Video Languages)
  // ==========================================
  async getUserPreferences(): Promise<UserPreferences> {
    const currentUser = await this.getCurrentUser();

    if (client && !currentUser.isGuest) {
      try {
        const { data, error } = await client
          .from('user_preferences')
          .select('*')
          .eq('user_id', currentUser.id)
          .single();

        if (!error && data) {
          const prefs: UserPreferences = {
            diet: data.diet || DEFAULT_PREFERENCES.diet,
            favoriteCuisines: data.favorite_cuisines || DEFAULT_PREFERENCES.favoriteCuisines,
            skillLevel: data.skill_level || DEFAULT_PREFERENCES.skillLevel,
            videoLanguages: data.video_languages || DEFAULT_PREFERENCES.videoLanguages,
            spiceTolerance: data.spice_tolerance || DEFAULT_PREFERENCES.spiceTolerance,
            onboardingCompleted: Boolean(data.onboarding_completed),
          };
          localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(prefs));
          return prefs;
        }
      } catch (err) {
        console.warn('Preferences fetch warning:', err);
      }
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      if (stored) return JSON.parse(stored);
    } catch {}

    return DEFAULT_PREFERENCES;
  },

  async updateUserPreferences(partial: Partial<UserPreferences>): Promise<UserPreferences> {
    const current = await this.getUserPreferences();
    const updated: UserPreferences = { ...current, ...partial };
    localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(updated));

    const currentUser = await this.getCurrentUser();
    if (client && !currentUser.isGuest) {
      try {
        await client.from('user_preferences').upsert({
          user_id: currentUser.id,
          diet: updated.diet,
          favorite_cuisines: updated.favoriteCuisines,
          skill_level: updated.skillLevel,
          video_languages: updated.videoLanguages,
          spice_tolerance: updated.spiceTolerance,
          onboarding_completed: updated.onboardingCompleted,
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Supabase preferences update error:', err);
      }
    }

    return updated;
  },

  // ==========================================
  // SAVED RECIPES (FAVORITES)
  // ==========================================
  async getSavedRecipes(): Promise<Recipe[]> {
    const currentUser = await this.getCurrentUser();

    if (client && !currentUser.isGuest) {
      try {
        const { data, error } = await client
          .from('favorites')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false });

        if (!error && data) {
          const list = data.map((d: any) => d.recipe_data as Recipe);
          localStorage.setItem(STORAGE_KEYS.SAVED_RECIPES, JSON.stringify(list));
          return list;
        }
      } catch (e) {
        console.warn('Error fetching saved recipes from Supabase:', e);
      }
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SAVED_RECIPES);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  async saveRecipe(recipe: Recipe): Promise<void> {
    const enriched = { ...recipe, isSaved: true, savedAt: new Date().toISOString() };
    const currentUser = await this.getCurrentUser();

    // Local update
    try {
      const saved = await this.getSavedRecipes();
      const filtered = saved.filter(r => r.id !== recipe.id);
      const updated = [enriched, ...filtered];
      localStorage.setItem(STORAGE_KEYS.SAVED_RECIPES, JSON.stringify(updated));
    } catch (e) {
      console.warn('Local save error:', e);
    }

    if (client && !currentUser.isGuest) {
      try {
        await client.from('favorites').upsert({
          id: `${currentUser.id}_${recipe.id}`,
          user_id: currentUser.id,
          recipe_id: recipe.id,
          recipe_data: enriched,
          created_at: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('Supabase favorite save error:', e);
      }
    }
  },

  async removeSavedRecipe(recipeId: string): Promise<void> {
    const currentUser = await this.getCurrentUser();

    try {
      const saved = await this.getSavedRecipes();
      const updated = saved.filter(r => r.id !== recipeId);
      localStorage.setItem(STORAGE_KEYS.SAVED_RECIPES, JSON.stringify(updated));
    } catch (e) {
      console.warn('Local remove error:', e);
    }

    if (client && !currentUser.isGuest) {
      try {
        await client.from('favorites').delete().eq('user_id', currentUser.id).eq('recipe_id', recipeId);
      } catch (e) {
        console.warn('Supabase favorite delete error:', e);
      }
    }
  },

  // ==========================================
  // COOKING HISTORY (Journal of Cooked Dishes)
  // ==========================================
  async getCookingHistory(): Promise<CookingHistoryItem[]> {
    const currentUser = await this.getCurrentUser();

    if (client && !currentUser.isGuest) {
      try {
        const { data, error } = await client
          .from('cooking_history')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('cooked_at', { ascending: false });

        if (!error && data) {
          const mapped = data.map((d: any) => ({
            id: d.id,
            userId: d.user_id,
            recipeId: d.recipe_id,
            recipeTitle: d.recipe_title,
            recipeData: d.recipe_data,
            rating: d.rating,
            notes: d.notes,
            cookedAt: d.cooked_at,
          }));
          localStorage.setItem(STORAGE_KEYS.COOKING_HISTORY, JSON.stringify(mapped));
          return mapped;
        }
      } catch (err) {
        console.warn('Supabase cooking history fetch warning:', err);
      }
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.COOKING_HISTORY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  async recordCookingHistory(entry: {
    recipe: Recipe;
    rating?: number;
    notes?: string;
  }): Promise<CookingHistoryItem> {
    const currentUser = await this.getCurrentUser();
    const id = 'cook_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

    const historyItem: CookingHistoryItem = {
      id,
      userId: currentUser.id,
      recipeId: entry.recipe.id,
      recipeTitle: entry.recipe.title || entry.recipe.name,
      recipeData: entry.recipe,
      rating: entry.rating || 5,
      notes: entry.notes || 'Cooked to perfection!',
      cookedAt: new Date().toISOString(),
    };

    // Save locally
    try {
      const currentList = await this.getCookingHistory();
      const updated = [historyItem, ...currentList];
      localStorage.setItem(STORAGE_KEYS.COOKING_HISTORY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Local cooking history save warning:', e);
    }

    // Save to Supabase
    if (client && !currentUser.isGuest) {
      try {
        await client.from('cooking_history').insert({
          id: historyItem.id,
          user_id: currentUser.id,
          recipe_id: historyItem.recipeId,
          recipe_title: historyItem.recipeTitle,
          recipe_data: historyItem.recipeData,
          rating: historyItem.rating,
          notes: historyItem.notes,
          cooked_at: historyItem.cookedAt,
        });
      } catch (err) {
        console.warn('Supabase cooking history insert error:', err);
      }
    }

    return historyItem;
  },

  async addCookingHistory(
    recipe: Recipe,
    rating?: number,
    notes?: string
  ): Promise<CookingHistoryItem> {
    return this.recordCookingHistory({ recipe, rating, notes });
  },

  // ==========================================
  // PANTRY ITEMS
  // ==========================================
  async getPantryItems(): Promise<PantryItem[]> {
    const currentUser = await this.getCurrentUser();

    if (client && !currentUser.isGuest) {
      try {
        const { data, error } = await client
          .from('pantry_items')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('added_at', { ascending: false });

        if (!error && data) {
          const items: PantryItem[] = data.map((d: any) => ({
            id: d.id,
            name: d.name,
            category: d.category,
            quantity: d.quantity,
            addedAt: d.added_at,
          }));
          localStorage.setItem(STORAGE_KEYS.PANTRY_ITEMS, JSON.stringify(items));
          return items;
        }
      } catch (e) {
        console.warn('Supabase pantry fetch failed:', e);
      }
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PANTRY_ITEMS);
      if (stored) return JSON.parse(stored);
    } catch {}

    // Default starting staples
    const defaultPantry: PantryItem[] = [
      { id: '1', name: 'Eggs', category: 'Dairy & Eggs', quantity: '6 pcs', addedAt: new Date().toISOString() },
      { id: '2', name: 'Garlic', category: 'Produce', quantity: '1 bulb', addedAt: new Date().toISOString() },
      { id: '3', name: 'Olive Oil', category: 'Spices & Oils', quantity: '500ml', addedAt: new Date().toISOString() },
      { id: '4', name: 'Pasta', category: 'Pantry & Grains', quantity: '1 pack', addedAt: new Date().toISOString() },
      { id: '5', name: 'Parmesan', category: 'Dairy & Eggs', quantity: '1 block', addedAt: new Date().toISOString() },
      { id: '6', name: 'Cherry Tomatoes', category: 'Produce', quantity: '1 box', addedAt: new Date().toISOString() },
    ];
    localStorage.setItem(STORAGE_KEYS.PANTRY_ITEMS, JSON.stringify(defaultPantry));
    return defaultPantry;
  },

  async savePantryItems(items: PantryItem[]): Promise<void> {
    const currentUser = await this.getCurrentUser();

    try {
      localStorage.setItem(STORAGE_KEYS.PANTRY_ITEMS, JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to save pantry items locally:', e);
    }

    if (client && !currentUser.isGuest) {
      try {
        const rows = items.map(i => ({
          id: i.id,
          user_id: currentUser.id,
          name: i.name,
          category: i.category,
          quantity: i.quantity,
          added_at: i.addedAt || new Date().toISOString(),
        }));
        await client.from('pantry_items').upsert(rows);
      } catch (e) {
        console.warn('Supabase pantry upsert error:', e);
      }
    }
  },

  // ==========================================
  // SHOPPING LIST ITEMS
  // ==========================================
  async getShoppingList(): Promise<ShoppingListItem[]> {
    const currentUser = await this.getCurrentUser();

    if (client && !currentUser.isGuest) {
      try {
        const { data, error } = await client
          .from('shopping_list_items')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('added_at', { ascending: false });

        if (!error && data) {
          const list: ShoppingListItem[] = data.map((d: any) => ({
            id: d.id,
            name: d.name,
            recipeTitle: d.recipe_title,
            recipeId: d.recipe_id,
            category: d.category,
            checked: Boolean(d.checked),
            addedAt: d.added_at,
          }));
          localStorage.setItem(STORAGE_KEYS.SHOPPING_LIST, JSON.stringify(list));
          return list;
        }
      } catch (e) {
        console.warn('Supabase shopping list fetch failed:', e);
      }
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SHOPPING_LIST);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  async saveShoppingList(items: ShoppingListItem[]): Promise<void> {
    const currentUser = await this.getCurrentUser();

    try {
      localStorage.setItem(STORAGE_KEYS.SHOPPING_LIST, JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to save shopping list locally:', e);
    }

    if (client && !currentUser.isGuest) {
      try {
        const rows = items.map(i => ({
          id: i.id,
          user_id: currentUser.id,
          name: i.name,
          recipe_title: i.recipeTitle,
          recipe_id: i.recipeId,
          category: i.category,
          checked: i.checked,
          added_at: i.addedAt,
        }));
        await client.from('shopping_list_items').upsert(rows);
      } catch (e) {
        console.warn('Supabase shopping list upsert error:', e);
      }
    }
  },

  // ==========================================
  // USER PROFILE
  // ==========================================
  async getUserProfile(): Promise<UserProfile> {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      if (stored) return JSON.parse(stored);
    } catch {}

    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(DEFAULT_PROFILE));
    return DEFAULT_PROFILE;
  },

  async updateUserProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    const current = await this.getUserProfile();
    const updated = { ...current, ...profile };
    try {
      localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(updated));
    } catch {}

    const currentUser = await this.getCurrentUser();
    if (client && !currentUser.isGuest) {
      try {
        await client.from('profiles').upsert({
          id: currentUser.id,
          email: updated.email,
          name: updated.name,
          avatar_url: updated.avatarUrl,
          updated_at: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('Supabase profile upsert error:', e);
      }
    }

    return updated;
  },
};
