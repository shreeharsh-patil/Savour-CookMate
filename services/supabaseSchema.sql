-- ==============================================================================
-- SAVOUR COOKMATE — SUPABASE POSTGRESQL SCHEMA & ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. User Preferences Table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  diet TEXT DEFAULT 'Non-Vegetarian',
  favorite_cuisines TEXT[] DEFAULT ARRAY['Indian', 'Italian', 'Asian'],
  skill_level TEXT DEFAULT 'Intermediate',
  video_languages TEXT[] DEFAULT ARRAY['English', 'Hindi'],
  spice_tolerance TEXT DEFAULT 'Medium',
  onboarding_completed BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Pantry Items Table
CREATE TABLE IF NOT EXISTS public.pantry_items (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'Other',
  quantity TEXT,
  added_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Favorites Table
CREATE TABLE IF NOT EXISTS public.favorites (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id TEXT NOT NULL,
  recipe_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_favorite UNIQUE (user_id, recipe_id)
);

-- 5. Shopping List Items Table
CREATE TABLE IF NOT EXISTS public.shopping_list_items (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  recipe_title TEXT,
  recipe_id TEXT,
  category TEXT DEFAULT 'Produce',
  checked BOOLEAN DEFAULT false,
  added_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Cooking History Table
CREATE TABLE IF NOT EXISTS public.cooking_history (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id TEXT NOT NULL,
  recipe_title TEXT NOT NULL,
  recipe_data JSONB NOT NULL,
  rating NUMERIC DEFAULT 5.0,
  notes TEXT,
  cooked_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Recipe Cache Table (Live Discovery Responses)
CREATE TABLE IF NOT EXISTS public.recipe_cache (
  cache_key TEXT PRIMARY KEY,
  query TEXT,
  ingredients TEXT[],
  diet TEXT,
  cuisine TEXT,
  language TEXT,
  response_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

-- 8. YouTube Cache Table (Live YouTube Video Responses)
CREATE TABLE IF NOT EXISTS public.youtube_cache (
  cache_key TEXT PRIMARY KEY,
  query TEXT,
  dish TEXT,
  filter TEXT,
  language TEXT,
  response_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pantry_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cooking_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.youtube_cache ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- User Preferences Policies
CREATE POLICY "Users can read own preferences" ON public.user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can modify own preferences" ON public.user_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Pantry Items Policies
CREATE POLICY "Users can read own pantry items" ON public.pantry_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pantry items" ON public.pantry_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pantry items" ON public.pantry_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own pantry items" ON public.pantry_items
  FOR DELETE USING (auth.uid() = user_id);

-- Favorites Policies
CREATE POLICY "Users can read own favorites" ON public.favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own favorites" ON public.favorites
  FOR ALL USING (auth.uid() = user_id);

-- Shopping List Policies
CREATE POLICY "Users can read own shopping list" ON public.shopping_list_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own shopping list" ON public.shopping_list_items
  FOR ALL USING (auth.uid() = user_id);

-- Cooking History Policies
CREATE POLICY "Users can read own cooking history" ON public.cooking_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cooking history" ON public.cooking_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Recipe & YouTube Cache Policies (Read by anyone, write by server/authenticated)
CREATE POLICY "Anyone can read recipe cache" ON public.recipe_cache
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert recipe cache" ON public.recipe_cache
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read youtube cache" ON public.youtube_cache
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert youtube cache" ON public.youtube_cache
  FOR INSERT WITH CHECK (true);

-- Trigger for auto-creating profile on user sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80')
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger definition
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
