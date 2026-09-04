# Savour CookMate

> An intelligent cooking companion that helps you discover recipes, cook with ingredients you already have, follow guided recipes, and find useful cooking videos.

---

## 🍽️ Overview

**Savour CookMate** is a production-grade React Native mobile cooking and recipe discovery application built with Expo. Taking cues from the information density, visual hierarchy, and frictionless UX of leading food applications like Swiggy and Zomato, Savour CookMate provides an editorial culinary experience centered on home cooks.

Whether you are looking for dinner ideas based on leftover pantry staples, discovering regional cuisines (Indian, Goan, Italian, Pan-Asian, Mexican), following step-by-step cooking instructions with built-in timers, or watching authentic video tutorials, Savour CookMate is designed to make cooking effortless and delightful.

---

## ✨ Key Features

### 1. 🔍 Natural Language Food Discovery
- Search recipes using conversational queries such as:
  - *"spicy chicken under 30 minutes"*
  - *"easy paneer dinner"*
  - *"high protein breakfast"*
  - *"Goan seafood curry"*
  - *"dinner using potato, onion, and eggs"*
- Automatic interpretation of dietary preferences, cook times, cuisines, and key ingredients.

### 2. 🥕 "Cook With What I Have" (Smart Pantry)
- **Input Flexibility**: Type ingredients, tap popular kitchen staples, or write a conversational sentence.
- **Deterministic Match Tiers**:
  - **Cook Now**: Dishes where you have 100% of required ingredients.
  - **Almost There**: Recipes missing only 1–2 items.
  - **More Ideas**: Inspiring recipes utilizing your ingredients with a few fresh additions.
- **One-Tap Shopping List**: Instantly add all missing ingredients for a recipe to your persistent shopping checklist.

### 3. 🍳 Immersive Guided Cooking Mode
- Full-screen distraction-free cooking interface designed for kitchen use.
- Large, thumb-friendly **Previous** and **Next** controls.
- Step-by-step guidance with timing cues, chef secrets, and masterclass tips.
- Integrated digital timer with start, pause, reset, and **+1 Min** controls.
- Haptic feedback upon timer completion and step navigation.
- Automatic logging to your personal **Cooking History**.

### 4. 📺 Curated Video Masterclasses
- Integrated YouTube tutorials for each recipe.
- Filter by language: English, Hindi, Marathi, Konkani, Tamil, Telugu, and quick vs. detailed tutorials.
- Direct native app deep-linking and in-app video playback.

### 5. 📚 Personal Recipe Vault & Collections
- Save favorite recipes with instant bookmarking.
- Organize recipes into curated collections: *Want to Try*, *Quick Meals*, *Breakfast*, *Healthy*, *Favorites*, or custom collections.
- Full offline support with persistent local storage.

### 6. 👤 Personalized Preferences & Sync
- Customize diet: Vegetarian, Non-Vegetarian, Eggetarian, Vegan.
- Cooking experience: Beginner, Intermediate, Master Chef.
- Spice tolerance: Mild, Medium, Hot, Fiery.
- Seamless authentication with Google OAuth, Email/Password, or instant Guest Chef mode.

---

## 🏗️ Architecture & Tech Stack

```
savour-cookmate/
├── app/                  # Expo Router file-based screens & navigation
│   ├── _layout.tsx       # Root layout, providers & global modals
│   └── (tabs)/           # Native bottom tab navigator
│       ├── _layout.tsx   # Tab bar configuration
│       ├── index.tsx     # Home food discovery feed
│       ├── explore.tsx   # Search & exploration filters
│       ├── pantry.tsx    # "Cook With What I Have" kitchen
│       ├── saved.tsx     # Recipe vault & collections
│       └── profile.tsx   # Profile & taste preferences
├── components/           # Reusable native UI components
│   ├── ActiveCookingSheet.tsx # Guided cooking overlay
│   ├── AuthModal.tsx          # Google & Email authentication
│   ├── CompactRecipeCard.tsx  # Horizontal rail cards
│   ├── CookingStep.tsx        # Recipe step instruction
│   ├── EmptyState.tsx         # Clean empty state view
│   ├── ErrorState.tsx         # User-friendly error message
│   ├── FoodCategoryRail.tsx   # "What's on your mind?" circular rail
│   ├── FoodImage.tsx          # Cached image component with fallback
│   ├── HomeHeader.tsx         # App wordmark & user avatar
│   ├── IngredientList.tsx     # Serving scaler & pantry indicators
│   ├── LoadingSkeleton.tsx    # Smooth skeleton loaders
│   ├── OnboardingModal.tsx    # First-run personalization
│   ├── PantryMatchCard.tsx    # Pantry match tier card
│   ├── PreferenceSelector.tsx # Reusable taste selector
│   ├── RecipeCard.tsx         # Primary feed recipe card
│   ├── RecipeDetailModal.tsx  # Full recipe detail sheet
│   ├── RecipeHero.tsx         # Hero spotlight banner
│   ├── RecipeSearch.tsx       # Natural language search input
│   ├── ShoppingListModal.tsx  # Persistent shopping list
│   ├── Toast.tsx              # Floating feedback notification
│   ├── VideoCard.tsx          # YouTube video tutorial card
│   └── YouTubePlayerModal.tsx # Video player overlay
├── constants/            # Design system, brand & categories
│   ├── brand.ts          # Centralized product name & metadata
│   ├── categories.ts     # Curated categories & photographic imagery
│   └── theme.ts          # 8pt spacing grid, coral palette (#FF5A3C)
├── services/             # API & persistence layer
│   ├── apiClient.ts      # Resilient network client with retries & cache
│   ├── recipeService.ts  # Recipe discovery & pantry orchestrator
│   ├── supabaseService.ts# Supabase auth & persistent sync
│   └── youtubeService.ts # Video search & deep-linking
├── store/                # State management
│   └── useAppStore.ts    # Zustand store with async storage persistence
├── types/                # Strict TypeScript interfaces
│   └── index.ts          # Core domain models
├── utils/                # Pure business logic & formatters
│   ├── formatters.ts     # Cook time, rating, calorie formatters
│   ├── pantryMatcher.ts  # Deterministic ingredient matcher
│   └── recipeValidator.ts# Strict JSON schema validator
└── server.ts             # Backend API proxy server (Express)
```

### Core Technologies
- **Mobile Framework**: [React Native](https://reactnative.dev/) & [Expo](https://expo.dev/) (SDK 52+)
- **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Styling**: React Native StyleSheet, 8pt spacing system, appetizing palette (`#FF5A3C` coral)
- **Local Persistence**: `@react-native-async-storage/async-storage`
- **Backend Infrastructure**:
  - Express server (`server.ts`) hosting API routes
  - Real Gemini API (`@google/genai`) for structured recipe discovery & natural language ingredient extraction
  - YouTube Data API v3 proxy with video ranking and curated catalog fallback
  - Supabase client (`@supabase/supabase-js`) for cloud synchronization and multi-tier caching

---

## 🔒 Security & API Architecture

All sensitive API keys remain strictly **server-side**:

```
[ React Native Mobile App ]
           │
           ▼ (HTTP JSON API on port 3000)
[ Savour Backend Server (server.ts) ]
    ├── Gemini 3.8-Flash API (Secure server-side key)
    ├── YouTube Data API v3 (Secure server-side key)
    └── Supabase Cache & Auth (Server-side key)
```

No Google or YouTube API credentials are baked into client bundles.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **bun**
- **Expo Go** app installed on your iOS or Android device (optional, for physical device testing)

### 1. Clone & Install
```bash
git clone https://github.com/shreeharsh-patil/Savour-CookMate.git
cd Savour-CookMate
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Set the following variables in `.env`:
```env
# Backend API Keys (Required for live recipe generation)
GEMINI_API_KEY=your_gemini_api_key_here

# YouTube Data API v3 (Optional; curated catalog fallback provided)
YOUTUBE_API_KEY=your_youtube_api_key_here

# Supabase (Optional; offline storage fallback provided)
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Server Port
PORT=3000
```

### 3. Start the Backend API Server
```bash
npm run server
```
The server will start on `http://localhost:3000`.

### 4. Start the Mobile Application
In a separate terminal:
```bash
npm start
```

Press:
- **`a`** to open in Android Emulator
- **`i`** to open in iOS Simulator
- **`w`** to open in Web browser
- Or scan the QR code with **Expo Go** on your physical phone!

---

## 🗄️ Database Setup (Optional)

If using Supabase for cloud sync across devices, run the provided SQL schema in your Supabase SQL Editor:
- Schema location: `src/services/supabaseSchema.sql`

Tables created:
- `user_profiles`: User preferences, dietary requirements, spice tolerance
- `saved_recipes`: Bookmarked recipes with tags
- `pantry_items`: Kitchen inventory
- `cooking_history`: Completed recipes with ratings and timestamps
- `recipe_cache`: 7-day TTL caching for high throughput and reduced quota usage
- `youtube_cache`: 7-day TTL caching for YouTube search queries

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
