import React, { useState, useEffect, useMemo } from 'react';
import {
  Bookmark,
  Search,
  Sparkles,
  ChefHat,
  ArrowRight
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { RecipeCard } from '../RecipeCard';

export const SavedView: React.FC = () => {
  const savedRecipes = useAppStore((state) => state.savedRecipes);
  const loadSavedRecipes = useAppStore((state) => state.loadSavedRecipes);
  const setActiveTab = useAppStore((state) => state.setActiveTab);
  const [filterQuery, setFilterQuery] = useState('');

  useEffect(() => {
    loadSavedRecipes();
  }, [loadSavedRecipes]);

  const filtered = useMemo(() => {
    const q = filterQuery.toLowerCase().trim();
    if (!q) return savedRecipes;
    return savedRecipes.filter(r =>
      r.title.toLowerCase().includes(q) ||
      r.cuisine.toLowerCase().includes(q) ||
      (r.tags && r.tags.some(t => t.toLowerCase().includes(q)))
    );
  }, [savedRecipes, filterQuery]);

  return (
    <div id="saved-view" className="space-y-5 px-4 pt-3 pb-8">
      {/* Header */}
      <div>
        <span className="text-[10px] uppercase tracking-[0.2em] text-[#737373] font-bold mb-1 block">
          Personal Anthology • Curated Vault
        </span>
        <h1 className="text-3xl sm:text-4xl font-serif italic font-light tracking-tight text-[#171717]">
          Saved. ({savedRecipes.length})
        </h1>
      </div>

      {/* Filter / Search within saved */}
      {savedRecipes.length > 0 && (
        <div className="relative">
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Search your saved cookbook..."
            className="w-full pl-9 pr-3 py-2.5 bg-white text-xs text-[#171717] font-medium rounded-2xl border border-[#171717]/5 shadow-xs focus:outline-none focus:border-[#FF5A3C]"
          />
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A3A3A3]" />
        </div>
      )}

      {/* List */}
      {filtered.length > 0 ? (
        <div className="space-y-5 pt-1">
          {filtered.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} variant="featured" />
          ))}
        </div>
      ) : savedRecipes.length > 0 ? (
        <div className="text-center py-12 p-6 bg-white rounded-[32px] border border-[#171717]/5 space-y-2">
          <p className="text-xs text-[#737373]">No saved recipes match "{filterQuery}".</p>
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16 p-8 bg-white rounded-[32px] border border-[#171717]/5 space-y-3 shadow-xs">
          <div className="w-14 h-14 bg-[#FFF5F2] rounded-full flex items-center justify-center mx-auto text-[#FF5A3C]">
            <Bookmark size={24} />
          </div>
          <h3 className="text-base font-serif italic text-[#171717]">Your cookbook is waiting</h3>
          <p className="text-xs text-[#737373] max-w-xs mx-auto leading-relaxed">
            Bookmark delicious recipes from the Home or Explore feeds to build your personalized master collection.
          </p>
          <button
            onClick={() => setActiveTab('home')}
            className="inline-flex items-center gap-1.5 px-6 py-3 bg-[#FF5A3C] text-white text-xs font-bold rounded-2xl hover:bg-[#E2482B] transition-all cursor-pointer shadow-md shadow-[#FF5A3C]/20 hover:scale-102"
          >
            Explore Recipes <ArrowRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
};
