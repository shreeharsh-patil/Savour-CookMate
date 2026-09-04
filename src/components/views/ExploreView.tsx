import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  X,
  Sparkles,
  Clock,
  AlertCircle,
  ChefHat
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { RecipeCard } from '../RecipeCard';

const CUISINES = ['All', 'Italian', 'Mexican', 'Japanese', 'Indian', 'Mediterranean', 'American', 'Thai'];
const DIETARY_OPTIONS = ['High-Protein', 'Vegetarian', 'Vegan', 'Gluten-Free', 'Low-Carb', 'Dairy-Free'];
const QUICK_PROMPTS = ['Crispy Salmon', '15-Min Pasta', 'High Protein Bowl', 'Street Tacos', 'Creamy Tuscan Chicken'];

export const ExploreView: React.FC = () => {
  const exploreRecipes = useAppStore((state) => state.exploreRecipes);
  const isExploreLoading = useAppStore((state) => state.isExploreLoading);
  const exploreError = useAppStore((state) => state.exploreError);
  const searchQuery = useAppStore((state) => state.searchQuery);
  const setSearchQuery = useAppStore((state) => state.setSearchQuery);
  const selectedCuisine = useAppStore((state) => state.selectedCuisine);
  const setSelectedCuisine = useAppStore((state) => state.setSelectedCuisine);
  const selectedDietary = useAppStore((state) => state.selectedDietary);
  const toggleDietary = useAppStore((state) => state.toggleDietary);
  const maxCookTime = useAppStore((state) => state.maxCookTime);
  const setMaxCookTime = useAppStore((state) => state.setMaxCookTime);
  const searchExploreRecipes = useAppStore((state) => state.searchExploreRecipes);

  const [inputVal, setInputVal] = useState(searchQuery);
  const [showFilters, setShowFilters] = useState(false);

  // Initial load if empty
  useEffect(() => {
    if (exploreRecipes.length === 0) {
      searchExploreRecipes({ query: 'gourmet chef favorites' });
    }
  }, [exploreRecipes.length, searchExploreRecipes]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    setSearchQuery(inputVal);
    searchExploreRecipes({ query: inputVal });
  };

  const handleQuickPrompt = (prompt: string) => {
    setInputVal(prompt);
    setSearchQuery(prompt);
    searchExploreRecipes({ query: prompt });
  };

  const handleCuisineSelect = (c: string) => {
    setSelectedCuisine(c);
    searchExploreRecipes({ cuisine: c });
  };

  const activeFiltersCount = (selectedCuisine !== 'All' ? 1 : 0) + selectedDietary.length;

  return (
    <div id="explore-view" className="space-y-5 px-4 pt-3 pb-8">
      {/* Header matching Artistic Flair */}
      <div>
        <span className="text-[10px] uppercase tracking-[0.2em] text-[#737373] font-bold mb-1 block">
          Culinary Inquiries • Gemini AI
        </span>
        <h1 className="text-3xl sm:text-4xl font-serif italic font-light tracking-tight text-[#171717]">
          Explore.
        </h1>
      </div>

      {/* Search Input Box */}
      <form onSubmit={handleSearchSubmit} className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <input
            id="explore-search-input"
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Search by dish, craving, or chef technique..."
            className="w-full pl-10 pr-9 py-3 bg-white text-xs text-[#171717] font-medium rounded-2xl border border-[#171717]/5 shadow-xs focus:outline-none focus:border-[#FF5A3C] transition-all"
          />
          <Search size={16} strokeWidth={1.5} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A3A3A3]" />
          {inputVal && (
            <button
              type="button"
              onClick={() => {
                setInputVal('');
                setSearchQuery('');
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A3A3A3] hover:text-[#171717] cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-center relative shadow-xs ${
            showFilters || activeFiltersCount > 0
              ? 'bg-[#171717] text-white border-[#171717]'
              : 'bg-white text-[#171717] border-[#171717]/5 hover:border-[#FF5A3C]'
          }`}
        >
          <Filter size={16} strokeWidth={1.5} />
          {activeFiltersCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FF5A3C] text-white text-[9px] font-bold flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </form>

      {/* Quick Prompts */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
        {QUICK_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => handleQuickPrompt(prompt)}
            className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wider bg-white hover:bg-[#FFF5F2] hover:text-[#FF5A3C] text-[#737373] border border-[#171717]/5 px-3 py-1.5 rounded-full transition-all cursor-pointer shadow-xs"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Expandable Filter Drawer */}
      {showFilters && (
        <div className="p-5 bg-white/95 backdrop-blur-md rounded-[28px] border border-[#171717]/5 shadow-lg space-y-4">
          {/* Cuisines */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#737373] block mb-2">
              Cuisine
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CUISINES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleCuisineSelect(c)}
                  className={`text-xs font-semibold px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                    selectedCuisine === c
                      ? 'bg-[#FF5A3C] text-white shadow-xs'
                      : 'bg-[#F5F2EC] text-[#171717] hover:bg-[#EAE5DC]'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Dietary Preferences */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#737373] block mb-2">
              Dietary Goals
            </label>
            <div className="flex flex-wrap gap-1.5">
              {DIETARY_OPTIONS.map((diet) => {
                const isChecked = selectedDietary.includes(diet);
                return (
                  <button
                    key={diet}
                    type="button"
                    onClick={() => {
                      toggleDietary(diet);
                      searchExploreRecipes();
                    }}
                    className={`text-xs font-semibold px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                      isChecked
                        ? 'bg-[#171717] text-white shadow-xs'
                        : 'bg-[#F5F2EC] text-[#171717] hover:bg-[#EAE5DC]'
                    }`}
                  >
                    {diet}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Max Cook Time */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-[#171717] mb-1.5">
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#737373]">
                <Clock size={12} /> Max Cooking Time
              </span>
              <span>≤ {maxCookTime} mins</span>
            </div>
            <input
              type="range"
              min="15"
              max="90"
              step="15"
              value={maxCookTime}
              onChange={(e) => {
                const val = Number(e.target.value);
                setMaxCookTime(val);
                searchExploreRecipes({ maxCookTimeMinutes: val });
              }}
              className="w-full accent-[#FF5A3C] cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Results Header */}
      <div className="flex items-center justify-between pt-1">
        <h2 className="text-xs font-bold text-[#737373] uppercase tracking-widest">
          {searchQuery ? `Results for "${searchQuery}"` : 'Curated Masterpieces'}
        </h2>
        <span className="text-xs font-bold text-[#FF5A3C]">
          {isExploreLoading ? 'Discovering with Gemini...' : `${exploreRecipes.length} recipes`}
        </span>
      </div>

      {/* Loading Shimmer */}
      {isExploreLoading && (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div key={n} className="bg-white rounded-[32px] overflow-hidden border border-[#171717]/5 animate-pulse">
              <div className="h-44 bg-[#EAE5DC]" />
              <div className="p-5 space-y-2">
                <div className="h-5 bg-[#EAE5DC] rounded w-2/3" />
                <div className="h-3.5 bg-[#EAE5DC] rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {exploreError && !isExploreLoading && (
        <div className="p-6 bg-white rounded-[32px] border border-red-200 text-center space-y-3 shadow-xs">
          <AlertCircle size={32} className="text-red-500 mx-auto" />
          <h4 className="text-xs font-bold text-[#171717]">Search Error</h4>
          <p className="text-xs text-[#737373]">{exploreError}</p>
          <button
            onClick={() => searchExploreRecipes()}
            className="px-5 py-2.5 bg-[#FF5A3C] text-white text-xs font-bold rounded-xl hover:bg-[#E2482B] transition-colors cursor-pointer shadow-sm"
          >
            Retry Search
          </button>
        </div>
      )}

      {/* Results List */}
      {!isExploreLoading && !exploreError && exploreRecipes.length > 0 && (
        <div className="space-y-5">
          {exploreRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} variant="featured" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isExploreLoading && !exploreError && exploreRecipes.length === 0 && (
        <div className="text-center py-12 p-6 bg-white rounded-[32px] border border-[#171717]/5 space-y-3">
          <ChefHat size={36} className="text-[#A3A3A3] mx-auto" />
          <h3 className="text-sm font-bold text-[#171717]">No recipes matched</h3>
          <p className="text-xs text-[#737373]">Try another keyword or broaden your dietary filters.</p>
        </div>
      )}
    </div>
  );
};
