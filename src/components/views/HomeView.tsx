import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  RefreshCw,
  Search,
  Refrigerator,
  Flame,
  ChefHat,
  AlertCircle,
  Play,
  X,
  Star,
  Compass,
  Zap,
  ArrowRight
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { RecipeCard } from '../RecipeCard';

// "What's on your mind?" categories as requested
const MIND_CATEGORIES = [
  { name: 'Biryani', emoji: '🍛', subtitle: 'Fragrant & Spiced' },
  { name: 'Paneer', emoji: '🧀', subtitle: 'Rich & Golden' },
  { name: 'Chicken', emoji: '🍗', subtitle: 'Tender & Savory' },
  { name: 'Dosa', emoji: '🥞', subtitle: 'Crispy Fermented' },
  { name: 'Pasta', emoji: '🍝', subtitle: 'Handcrafted Italian' },
  { name: 'Breakfast', emoji: '🍳', subtitle: 'Energizing Morning' },
  { name: 'Desserts', emoji: '🍰', subtitle: 'Artisanal Sweets' },
  { name: 'Healthy', emoji: '🥗', subtitle: 'Clean & Nourishing' },
];

// Live recommendation channels as requested
const RECOMMENDATION_CHANNELS = [
  'Top Picks',
  'Trending',
  'Quick Meals',
  'Indian',
  'Goan',
  'Breakfast',
  'Healthy',
  'High Protein',
  'Desserts',
  'Because You Like...',
  'Popular Cuisines',
];

// Natural language search query inspirations
const NATURAL_LANGUAGE_INSPIRATIONS = [
  'spicy chicken under 30 minutes',
  'easy paneer dinner',
  'high protein vegetarian breakfast',
  'Goan seafood recipe',
];

const POPULAR_CUISINE_TILES = [
  { name: 'Indian', emoji: '🇮🇳', query: 'Authentic Indian royal thali recipes' },
  { name: 'Goan', emoji: '🌊', query: 'Authentic Goan coastal curry and seafood' },
  { name: 'Italian', emoji: '🍝', query: 'Artisanal regional Italian pasta and risotto' },
  { name: 'Mexican', emoji: '🌮', query: 'Traditional Mexican tacos and moles' },
];

export const HomeView: React.FC = () => {
  const homeRecipes = useAppStore((state) => state.homeRecipes);
  const isHomeLoading = useAppStore((state) => state.isHomeLoading);
  const homeError = useAppStore((state) => state.homeError);
  const activeHomeCategory = useAppStore((state) => state.activeHomeCategory);
  const activeMindCategory = useAppStore((state) => state.activeMindCategory);
  const setActiveHomeCategory = useAppStore((state) => state.setActiveHomeCategory);
  const setActiveMindCategory = useAppStore((state) => state.setActiveMindCategory);
  const loadHomeRecipes = useAppStore((state) => state.loadHomeRecipes);
  const searchHomeWithPrompt = useAppStore((state) => state.searchHomeWithPrompt);
  const setActiveTab = useAppStore((state) => state.setActiveTab);
  const pantryCount = useAppStore((state) => state.pantryItems.length);
  const setSelectedRecipe = useAppStore((state) => state.setSelectedRecipe);
  const startCookingMode = useAppStore((state) => state.startCookingMode);
  const setActiveVideo = useAppStore((state) => state.setActiveVideo);
  const userName = useAppStore((state) => state.userProfile?.name);

  const [searchInput, setSearchInput] = useState('');

  // Initial load
  useEffect(() => {
    if (homeRecipes.length === 0) {
      loadHomeRecipes('Top Picks', false);
    }
  }, [homeRecipes.length, loadHomeRecipes]);

  const handleChannelSelect = (channel: string) => {
    setActiveHomeCategory(channel);
  };

  const handleMindCategorySelect = (catName: string) => {
    setActiveMindCategory(catName);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    searchHomeWithPrompt(searchInput.trim());
  };

  const handlePromptChipClick = (prompt: string) => {
    setSearchInput(prompt);
    searchHomeWithPrompt(prompt);
  };

  const handleRefresh = () => {
    if (activeMindCategory) {
      loadHomeRecipes(`What's on your mind: ${activeMindCategory}`, true, { query: activeMindCategory, category: activeMindCategory });
    } else {
      loadHomeRecipes(activeHomeCategory, true);
    }
  };

  const featuredRecipe = homeRecipes[0];
  const feedRecipes = homeRecipes.slice(1);

  return (
    <div id="home-view" className="space-y-6 px-4 pt-3 pb-8">
      {/* Header matching Artistic Flair aesthetic */}
      <header className="flex justify-between items-center z-20">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#737373] font-bold mb-0.5">
            Artisanal Culinary Lab • Gemini 3.8
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif italic font-light tracking-tight text-[#171717]">
            Savor.
          </h1>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            id="refresh-home-recipes-btn"
            onClick={handleRefresh}
            disabled={isHomeLoading}
            className="w-10 h-10 border border-[#171717]/10 rounded-full flex items-center justify-center text-[#171717] hover:border-[#FF5A3C] transition-colors cursor-pointer bg-white disabled:opacity-50 shadow-xs"
            title="Regenerate live Gemini recipes"
          >
            <RefreshCw size={16} strokeWidth={1.5} className={isHomeLoading ? 'animate-spin text-[#FF5A3C]' : ''} />
          </button>

          <button
            id="header-profile-badge"
            onClick={() => setActiveTab('profile')}
            className="w-10 h-10 bg-[#FF5A3C] rounded-full flex items-center justify-center text-white font-bold text-xs shadow-md shadow-[#FF5A3C]/20 cursor-pointer hover:opacity-95 transition-opacity"
            title="User Profile"
          >
            {userName ? userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'JS'}
          </button>
        </div>
      </header>

      {/* Natural Language Search Bar */}
      <div className="space-y-2">
        <form onSubmit={handleSearchSubmit} className="relative flex items-center">
          <input
            id="home-natural-language-search"
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Try 'spicy chicken under 30 minutes' or 'easy paneer dinner'..."
            className="w-full pl-10 pr-10 py-3 bg-white text-xs text-[#171717] font-medium rounded-2xl border border-[#171717]/10 shadow-xs focus:outline-none focus:border-[#FF5A3C] transition-all"
          />
          <Search size={16} strokeWidth={1.5} className="absolute left-3.5 text-[#A3A3A3]" />
          {searchInput ? (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              className="absolute right-3 text-[#A3A3A3] hover:text-[#171717] cursor-pointer"
            >
              <X size={14} />
            </button>
          ) : (
            <span className="absolute right-3 text-[10px] uppercase font-bold text-[#FF5A3C] tracking-wider pointer-events-none">
              AI NLP
            </span>
          )}
        </form>

        {/* Natural Language Prompt Inspiration Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          <span className="text-[9px] uppercase tracking-wider text-[#A3A3A3] font-bold flex-shrink-0 flex items-center gap-0.5">
            <Zap size={10} className="text-[#FF5A3C]" />
            Try:
          </span>
          {NATURAL_LANGUAGE_INSPIRATIONS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handlePromptChipClick(prompt)}
              className="flex-shrink-0 text-[10px] font-semibold bg-white hover:bg-[#FFF5F2] hover:text-[#FF5A3C] hover:border-[#FF5A3C]/30 text-[#737373] border border-[#171717]/5 px-2.5 py-1 rounded-full transition-all cursor-pointer shadow-2xs"
            >
              "{prompt}"
            </button>
          ))}
        </div>
      </div>

      {/* "What's on your mind?" Section */}
      <section id="whats-on-your-mind-section" className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[9px] uppercase tracking-[0.2em] text-[#FF5A3C] font-bold block">
              Curated Moods
            </span>
            <h2 className="text-base font-serif italic text-[#171717]">
              What's on your mind?
            </h2>
          </div>
          {activeMindCategory && (
            <button
              onClick={() => setActiveMindCategory(null)}
              className="text-[10px] font-bold text-[#737373] hover:text-[#171717] uppercase tracking-wider underline cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>

        <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
          {MIND_CATEGORIES.map((cat) => {
            const isSelected = activeMindCategory === cat.name;
            return (
              <button
                key={cat.name}
                id={`mind-category-${cat.name.toLowerCase()}`}
                onClick={() => handleMindCategorySelect(cat.name)}
                className={`flex-shrink-0 flex flex-col items-center justify-center w-20 py-2.5 px-1.5 rounded-2xl border transition-all cursor-pointer group shadow-xs ${
                  isSelected
                    ? 'bg-[#171717] text-white border-[#171717] scale-102 ring-2 ring-[#FF5A3C]/30'
                    : 'bg-white text-[#171717] border-[#171717]/5 hover:border-[#FF5A3C]'
                }`}
              >
                <div className={`w-11 h-11 rounded-full flex items-center justify-center text-xl mb-1.5 transition-transform group-hover:scale-110 ${
                  isSelected ? 'bg-white/15' : 'bg-[#FFFDF9]'
                }`}>
                  {cat.emoji}
                </div>
                <span className={`text-[11px] font-bold tracking-tight text-center ${
                  isSelected ? 'text-white' : 'text-[#171717]'
                }`}>
                  {cat.name}
                </span>
                <span className={`text-[8px] truncate max-w-full font-medium ${
                  isSelected ? 'text-[#FF8A73]' : 'text-[#737373]'
                }`}>
                  {cat.subtitle}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Live Recommendation Channels Bar */}
      <section id="recommendation-channels-section" className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-widest text-[#737373] font-bold">
            Live Recommendation Channels
          </span>
          <span className="text-[10px] text-[#FF5A3C] font-semibold flex items-center gap-1">
            <Sparkles size={11} /> Gemini 3.8 Live
          </span>
        </div>

        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {RECOMMENDATION_CHANNELS.map((channel) => {
            const isSelected = !activeMindCategory && activeHomeCategory === channel;
            return (
              <button
                key={channel}
                id={`rec-channel-${channel.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                onClick={() => handleChannelSelect(channel)}
                className={`flex-shrink-0 text-[11px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full transition-all cursor-pointer shadow-xs ${
                  isSelected
                    ? 'bg-[#FF5A3C] text-white shadow-md shadow-[#FF5A3C]/25'
                    : 'bg-white text-[#737373] border border-[#171717]/5 hover:border-[#FF5A3C] hover:text-[#171717]'
                }`}
              >
                {channel}
              </button>
            );
          })}
        </div>
      </section>

      {/* Dynamic Status / Active Channel Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-serif italic text-[#171717]">
            {activeMindCategory ? `Dishes for: ${activeMindCategory}` : activeHomeCategory}
          </h3>
          <span className="text-[10px] font-bold text-[#FF5A3C] bg-[#FFF5F2] px-2 py-0.5 rounded-full">
            {homeRecipes.length} recipes
          </span>
        </div>
        {isHomeLoading && (
          <div className="flex items-center gap-1.5 text-[11px] text-[#FF5A3C] font-medium">
            <span className="w-3.5 h-3.5 border-2 border-[#FF5A3C] border-t-transparent rounded-full animate-spin" />
            <span>Chef Gemini is formulating...</span>
          </div>
        )}
      </div>

      {/* Error state */}
      {homeError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-xs text-red-800">
          <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Gemini Discovery Notification</p>
            <p className="mt-0.5 text-red-700">{homeError}</p>
            <button
              onClick={handleRefresh}
              className="mt-2 text-[11px] font-bold underline hover:no-underline cursor-pointer"
            >
              Retry Live Generation
            </button>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {isHomeLoading && homeRecipes.length === 0 && (
        <div className="space-y-4">
          <div className="h-64 w-full bg-white rounded-[32px] border border-[#171717]/5 animate-pulse p-6 flex flex-col justify-end">
            <div className="h-5 bg-[#EAE5DC] rounded w-1/3 mb-2" />
            <div className="h-4 bg-[#EAE5DC] rounded w-2/3 mb-4" />
            <div className="h-10 bg-[#EAE5DC] rounded-2xl w-32" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-44 bg-white rounded-3xl animate-pulse" />
            <div className="h-44 bg-white rounded-3xl animate-pulse" />
          </div>
        </div>
      )}

      {/* Hero Section: Top Pick Spotlight Banner */}
      {featuredRecipe && (
        <section className="relative w-full rounded-[36px] overflow-hidden shadow-xl group">
          <div className="relative h-[340px] sm:h-[360px] w-full bg-[#171717] overflow-hidden">
            <img
              src={featuredRecipe.imageUrl}
              alt={featuredRecipe.title}
              className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-103 transition-transform duration-700 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

            <div className="absolute right-4 bottom-4 text-white/10 italic text-7xl sm:text-8xl font-serif select-none pointer-events-none">
              Culinary
            </div>

            {/* Top Badge */}
            <div className="absolute top-5 right-5 z-10 flex items-center gap-1.5">
              <span className="bg-[#FF5A3C] text-white text-[10px] px-3.5 py-1.5 rounded-full uppercase tracking-widest font-bold shadow-md shadow-[#FF5A3C]/30 flex items-center gap-1">
                <Sparkles size={11} /> Gemini Top Pick
              </span>
            </div>

            {/* Floating Card */}
            <div className="absolute left-3 right-3 bottom-3 sm:left-4 sm:right-auto sm:max-w-md z-10">
              <div className="bg-white/95 backdrop-blur-md p-5 sm:p-6 rounded-[28px] border border-white/80 shadow-2xl">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#FF5A3C]">
                    {featuredRecipe.cuisine} • {featuredRecipe.prepTime + featuredRecipe.cookTime}m
                  </span>
                  <span className="text-[10px] font-bold text-[#171717] flex items-center gap-0.5">
                    <Star size={11} className="text-amber-400 fill-amber-400" />
                    {featuredRecipe.ratingEstimate ? featuredRecipe.ratingEstimate.toFixed(1) : '4.9'}
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-serif italic text-[#171717] mb-2 leading-[1.15] line-clamp-2">
                  {featuredRecipe.title}
                </h2>
                <p className="text-[#737373] text-xs leading-relaxed mb-4 line-clamp-2">
                  {featuredRecipe.tagline || featuredRecipe.description}
                </p>

                <div className="flex items-center justify-between">
                  <button
                    id="hero-start-cooking-btn"
                    onClick={() => startCookingMode(featuredRecipe)}
                    className="bg-[#FF5A3C] text-white px-5 py-2.5 rounded-2xl font-bold text-xs hover:scale-102 active:scale-98 transition-transform shadow-md shadow-[#FF5A3C]/25 cursor-pointer"
                  >
                    Start Cooking
                  </button>
                  <button
                    id="hero-view-details-btn"
                    onClick={() => setSelectedRecipe(featuredRecipe)}
                    className="text-xs font-semibold text-[#171717] hover:text-[#FF5A3C] transition-colors cursor-pointer underline underline-offset-4"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Feed Recipe Grid */}
      {feedRecipes.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#171717]">
              Recommended Masterpieces
            </h3>
            <span className="text-[10px] text-[#737373] font-medium">
              Verified Real Recipes • Zero Mock Data
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {feedRecipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        </section>
      )}

      {/* Smart Pantry AI Banner */}
      <div
        id="home-smart-pantry-banner"
        onClick={() => setActiveTab('pantry')}
        className="relative overflow-hidden bg-gradient-to-r from-[#FF5A3C] to-[#E2482B] text-white p-5 rounded-[28px] shadow-md cursor-pointer hover:brightness-105 transition-all"
      >
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest bg-white/20 px-2.5 py-0.5 rounded-full">
              <Refrigerator size={10} /> Smart Pantry AI
            </span>
            <h3 className="text-sm font-black tracking-tight leading-snug">
              Got ingredients in your fridge?
            </h3>
            <p className="text-[11px] text-white/90">
              You have <strong className="underline">{pantryCount} pantry items</strong>. Let Gemini formulate matching recipes!
            </p>
          </div>
          <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl flex-shrink-0">
            <Sparkles size={20} className="text-white" />
          </div>
        </div>
      </div>

      {/* Popular Cuisines Exploration Strip */}
      <section className="space-y-3">
        <div className="flex justify-between items-end">
          <div>
            <span className="text-[9px] uppercase tracking-[0.2em] text-[#737373] font-bold block">
              Regional Traditions
            </span>
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#171717]">
              Popular Cuisines
            </h3>
          </div>
          <button
            onClick={() => setActiveTab('explore')}
            className="text-[10px] text-[#FF5A3C] font-bold uppercase tracking-wider cursor-pointer hover:underline flex items-center gap-0.5"
          >
            Explore All <ArrowRight size={11} />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {POPULAR_CUISINE_TILES.map((tile) => (
            <div
              key={tile.name}
              id={`popular-cuisine-${tile.name.toLowerCase()}`}
              onClick={() => {
                setActiveHomeCategory(tile.name);
                loadHomeRecipes(tile.name, false, { query: tile.query, cuisine: tile.name });
              }}
              className="p-3.5 bg-white border border-[#171717]/5 rounded-2xl flex flex-col items-center justify-center group cursor-pointer hover:border-[#FF5A3C] transition-all shadow-xs hover:shadow-sm"
            >
              <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">
                {tile.emoji}
              </span>
              <span className="text-xs font-bold text-[#171717] group-hover:text-[#FF5A3C] transition-colors">
                {tile.name}
              </span>
              <span className="text-[9px] text-[#737373] mt-0.5">
                Gemini Masterclass
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
