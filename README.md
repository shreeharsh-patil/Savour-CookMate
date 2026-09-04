# Yummy Tummy

> A production-grade React Native cooking companion backed by NestJS, Fastify, MongoDB Atlas, and Gemini.

---

## 🍽️ Overview

**Yummy Tummy** is a premium, consumer-oriented cooking and recipe discovery application. Taking cues from the visual hierarchy, information density, and frictionless experience of leading food apps such as Swiggy and Zomato, Yummy Tummy turns home cooking into an effortless, delightful craft.

### 🌟 Core Principle

> **AI understands.** (Gemini extracts search intent, normalizes ingredients, suggests substitutes, and assists during cooking)  
> **Backend decides.** (NestJS evaluates deterministic match percentages, dietary rules, and ranking formulas)  
> **MongoDB remembers.** (MongoDB Atlas persists stable recipes, pantry inventories, favorites, shopping lists, and reviews)  
> **React Native presents.** (Expo, Reanimated, and TanStack Query deliver smooth, high-density, native mobile experiences)

---

## 🏗️ System Architecture

```
                       ┌─────────────────────────┐
                       │   React Native (Expo)   │
                       │   TanStack Query + UI   │
                       └────────────┬────────────┘
                                    │ HTTP / REST (/api/v1/...)
                                    ▼
                       ┌─────────────────────────┐
                       │   NestJS API (Fastify)  │
                       │  Guards, Zod, Services  │
                       └─────┬──────────────┬────┘
                             │              │
        ┌────────────────────┴──┐        ┌──┴──────────────────────┐
        ▼                       ▼        ▼                         ▼
┌───────────────┐     ┌───────────────┐ ┌───────────────┐ ┌─────────────────┐
│ MongoDB Atlas │     │  Gemini API   │ │  YouTube API  │ │ Firebase Admin  │
│ (Mongoose DB) │     │ (Intent & AI) │ │ (Video Proxy) │ │ (Auth & Tokens) │
└───────────────┘     └───────────────┘ └───────────────┘ └─────────────────┘
```

> [!IMPORTANT]
> **Zero Client Secret Exposure**: React Native never connects directly to MongoDB Atlas. MongoDB URIs, Gemini API keys, YouTube API keys, and Firebase Admin service credentials are strictly managed server-side.

---

## 📁 Repository Structure

```
yummy-tummy/
├── app/                            # Expo Router screens (file-based navigation)
│   ├── _layout.tsx                 # Root layout with QueryClientProvider & global sheets
│   └── (tabs)/                     # Bottom tab navigator
│       ├── _layout.tsx             # Tab bar configuration & badges
│       ├── index.tsx               # Discovery Home feed (Swiggy/Zomato style)
│       ├── explore.tsx             # Natural language search & curated rails
│       ├── pantry.tsx              # "Cook With What I Have" kitchen screen
│       ├── saved.tsx               # Personal recipe vault & custom collections
│       └── profile.tsx             # Culinary preferences & cooking history
├── backend/                        # Production NestJS + Fastify API server
│   ├── package.json                # Backend dependency manifest
│   ├── tsconfig.json               # Backend TypeScript configuration
│   └── src/
│       ├── main.ts                 # Fastify bootstrap with Helmet, CORS & Rate Limiting
│       ├── app.module.ts           # Root NestJS module & bootstrap seeder
│       ├── config/
│       │   └── env.config.ts       # Zod-validated environment configuration
│       ├── database/
│       │   ├── database.module.ts  # Mongoose feature registry
│       │   ├── seed.ts             # Authentic seed recipes & master ingredients
│       │   └── schemas/            # Mongoose document schemas & indexes
│       │       ├── user.schema.ts
│       │       ├── user-preferences.schema.ts
│       │       ├── recipe.schema.ts
│       │       ├── ingredient.schema.ts
│       │       ├── pantry-item.schema.ts
│       │       ├── favorite.schema.ts
│       │       ├── shopping-item.schema.ts
│       │       ├── cooking-history.schema.ts
│       │       ├── review.schema.ts
│       │       ├── recommendation-event.schema.ts
│       │       ├── youtube-cache.schema.ts
│       │       ├── ai-cache.schema.ts
│       │       └── search-history.schema.ts
│       ├── common/
│       │   ├── guards/             # Firebase JWT verification & guest guard
│       │   ├── filters/            # Production structured exception filter
│       │   └── decorators/         # @CurrentUser() parameter decorator
│       └── modules/
│           ├── auth/               # Firebase session sync & guest token generator
│           ├── users/              # Preferences & profile stats
│           ├── recipes/            # MongoDB recipe pagination, filters & real ratings
│           ├── ingredients/        # Ingredient catalog & normalization
│           ├── pantry/             # Kitchen inventory & smart sections
│           ├── search/             # MongoDB Atlas text search & Gemini intent parsing
│           ├── recommendations/    # Deterministic 6-factor recommendation engine
│           ├── favorites/          # Collections & bookmarks
│           ├── shopping/           # Shopping list & 1-tap transfer to kitchen
│           ├── history/            # Cooking history and analytics
│           ├── youtube/            # Curated tutorial search with anti-mukbang filters
│           └── gemini/             # Structured intent parsing, substitutes & advice
├── components/                     # Reusable native UI components
│   ├── AuthModal.tsx               # Google OAuth, Email/Pass, & Guest mode
│   ├── FoodImage.tsx               # High-performance Expo Image with cache
│   ├── RecipeCard.tsx              # High-density food card with real ratings
│   ├── RecipeDetailModal.tsx       # Comprehensive recipe detail sheet
│   └── ShoppingListModal.tsx       # Persistent shopping checklist
├── features/                       # TanStack Query server-state hooks
│   ├── recipes/useRecipes.ts
│   ├── pantry/usePantry.ts
│   ├── search/useSearch.ts
│   ├── recommendations/useRecommendations.ts
│   ├── favorites/useFavorites.ts
│   ├── shopping/useShopping.ts
│   ├── cooking/useCooking.ts
│   ├── profile/useProfile.ts
│   └── youtube/useYouTube.ts
├── services/
│   ├── apiClient.ts                # Resilient mobile HTTP client with Bearer auth
│   ├── api.ts                      # Centralized typed endpoint client
│   ├── recipeService.ts            # Client-to-MongoDB recipe mapper
│   └── youtubeService.ts           # Deep-linking & video proxy
├── store/
│   └── useAppStore.ts              # Zustand store for local UI state
└── types/
    └── index.ts                    # Core TypeScript domain models
```

---

## 🚀 API Endpoints (`/api/v1/...`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/v1/auth/verify` | Syncs verified Firebase JWT with MongoDB `users` collection | Yes |
| `GET` | `/api/v1/auth/me` | Retrieves current authenticated profile | Yes |
| `POST` | `/api/v1/auth/guest` | Creates an anonymous guest chef session | No |
| `GET` | `/api/v1/recipes` | Paginated recipes with cuisine, diet, difficulty & time filters | No |
| `GET` | `/api/v1/recipes/:id` | Full recipe detail with ingredients, steps, and real reviews | No |
| `POST` | `/api/v1/recipes/:id/rate` | Submits real user rating & comment (recomputes aggregate) | Yes |
| `POST` | `/api/v1/recipes/:id/cook` | Records cooking completion & increments cook count | Yes |
| `POST` | `/api/v1/search` | Atlas search + conversational intent parsing via Gemini | No |
| `GET` | `/api/v1/search/autocomplete`| Substring prefix search for dish names | No |
| `GET` | `/api/v1/recommendations` | Deterministic recommendation engine (40% match, 20% pref, etc.) | Yes |
| `POST` | `/api/v1/recommendations/event`| Tracks recommendation engagement events for ranking affinity | Yes |
| `GET` | `/api/v1/pantry` | User pantry items grouped by Available, Low Stock, Expiring Soon | Yes |
| `POST` | `/api/v1/pantry` | Adds an item with quantity, unit, and optional expiration date | Yes |
| `PUT` | `/api/v1/pantry/:id` | Updates quantity, stock flag, or expiry date | Yes |
| `DELETE`| `/api/v1/pantry/:id` | Removes item from kitchen inventory | Yes |
| `GET` | `/api/v1/pantry/smart-sections` | Smart sections: *Cook Without Shopping*, *Use Soon*, *Missing 1* | Yes |
| `GET` | `/api/v1/favorites` | Saved recipes by collection (*Want to Try*, *Quick Meals*, etc.) | Yes |
| `POST` | `/api/v1/favorites/toggle` | Toggles recipe bookmark status | Yes |
| `GET` | `/api/v1/shopping-list` | Persistent shopping items | Yes |
| `POST` | `/api/v1/shopping-list/add-missing` | Adds all missing recipe ingredients with 1 tap | Yes |
| `POST` | `/api/v1/shopping-list/move-to-pantry` | Transfers checked shopping items into Kitchen Inventory | Yes |
| `GET` | `/api/v1/history` | User cooking history log | Yes |
| `GET` | `/api/v1/preferences` | User taste preferences (diet, spice, cuisines, time limit) | Yes |
| `PUT` | `/api/v1/preferences` | Updates taste preferences | Yes |
| `GET` | `/api/v1/youtube` | Tutorials filtered for quality, duration, and language | No |
| `POST` | `/api/v1/ai/substitutions` | Practical ingredient substitutions with ratios | No |
| `POST` | `/api/v1/ai/advice` | Real-time chef advice for the active cooking step | No |

---

## 🎯 Deterministic Recommendation Engine

Recommendations are calculated deterministically on the NestJS backend:

$$\text{Score} = \text{Match (40\%)} + \text{Preferences (20\%)} + \text{Time (15\%)} + \text{Diet (10\%)} + \text{History (10\%)} + \text{Popularity (5\%)}$$

* **MAKE NOW**: 100% of required ingredients available in the user's pantry.
* **ALMOST THERE**: Missing only 1–2 ingredients.
* **GOOD MATCH**: High ingredient overlap ( $\ge 50\%$ match).
* **WORTH SHOPPING FOR**: Great recipe matching preferences with shopping list integration.

---

## 🛠️ Getting Started

### 1. Environment Configuration

Copy `.env.example` to `.env` and provide your credentials:

```bash
cp .env.example .env
```

Key environment variables:
```ini
MONGODB_URI="mongodb+srv://<user>:<password>@cluster.mongodb.net/yummy-tummy?retryWrites=true&w=majority"
GEMINI_API_KEY="your_gemini_api_key_here"
YOUTUBE_API_KEY="your_youtube_api_key_here"
FIREBASE_PROJECT_ID="your-firebase-project"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk@your-project.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
EXPO_PUBLIC_API_URL="http://localhost:3000"
```

### 2. Run the NestJS Backend

```bash
npm run backend
```
*The Fastify server starts on `http://localhost:3000` and automatically seeds initial authentic recipes and master ingredients if the database is empty.*

### 3. Run the React Native Mobile App

```bash
npm start
```
*Press `a` for Android Emulator, `i` for iOS Simulator, or scan the QR code with the Expo Go mobile app.*

### 4. Run TypeScript Type Check

```bash
npm run lint
```
*Verifies both the Expo mobile app and the NestJS backend with zero errors.*
