import React, { memo } from 'react';
import {
  Clock,
  Flame,
  ChefHat,
  Bookmark,
  Sparkles,
  Check,
  AlertCircle,
  PlusCircle,
  ArrowRight,
  Plus
} from 'lucide-react';
import { PantryRecipeRecommendation, PantryMatchGroup } from '../types';
import { useAppStore } from '../store/useAppStore';
import { CulinaryImage } from './CulinaryImage';

interface PantryRecommendationCardProps {
  recommendation: PantryRecipeRecommendation;
}

const TIER_STYLES: Record<PantryMatchGroup, { bg: string; text: string; border: string; label: string }> = {
  'MAKE NOW': {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-700',
    border: 'border-emerald-500/20',
    label: 'MAKE NOW',
  },
  'ALMOST THERE': {
    bg: 'bg-amber-500/10',
    text: 'text-amber-700',
    border: 'border-amber-500/20',
    label: 'ALMOST THERE',
  },
  'GOOD MATCH': {
    bg: 'bg-blue-500/10',
    text: 'text-blue-700',
    border: 'border-blue-500/20',
    label: 'GOOD MATCH',
  },
  'WORTH SHOPPING FOR': {
    bg: 'bg-stone-500/10',
    text: 'text-stone-700',
    border: 'border-stone-500/20',
    label: 'WORTH SHOPPING FOR',
  },
};

const PantryRecommendationCardComponent: React.FC<PantryRecommendationCardProps> = ({ recommendation }) => {
  const setSelectedRecipe = useAppStore((state) => state.setSelectedRecipe);
  const toggleSaveRecipe = useAppStore((state) => state.toggleSaveRecipe);
  const addMissingToShoppingList = useAppStore((state) => state.addMissingToShoppingList);
  const shoppingList = useAppStore((state) => state.shoppingList);

  const {
    recipe,
    matchPercentage,
    availableIngredients,
    missingIngredients,
    optionalMissingIngredients,
    reasonForRecommendation,
  } = recommendation;

  const currentGroup = recommendation.group || recommendation.matchGroup || 'GOOD MATCH';
  const tier = TIER_STYLES[currentGroup] || TIER_STYLES['GOOD MATCH'];
  const isSaved = Boolean(recipe.isSaved);

  const missingAlreadyOnShoppingList = missingIngredients.every(item =>
    shoppingList.some(s => s.name.toLowerCase() === item.toLowerCase() && !s.checked)
  );

  const handleAddMissingToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (missingIngredients.length > 0) {
      addMissingToShoppingList(missingIngredients, recipe.name, recipe.id);
    }
  };

  return (
    <div
      id={`pantry-rec-${recipe.id}`}
      onClick={() => setSelectedRecipe(recipe)}
      className="group bg-white rounded-[28px] border border-[#171717]/10 hover:border-[#FF5A3C]/30 shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer flex flex-col"
    >
      {/* Visual media banner */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-stone-100">
        <CulinaryImage
          src={recipe.imageUrl || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80'}
          alt={recipe.name}
          className="w-full h-full group-hover:scale-103 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          {/* Match percentage pill */}
          <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold text-white tracking-tight">
              {matchPercentage}% Match
            </span>
          </div>

          {/* Bookmark save toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleSaveRecipe(recipe);
            }}
            className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all cursor-pointer"
            title={isSaved ? 'Remove from saved' : 'Save recipe'}
          >
            <Bookmark size={16} className={isSaved ? 'fill-[#FF5A3C] text-[#FF5A3C]' : 'text-white'} />
          </button>
        </div>

        {/* Bottom banner info */}
        <div className="absolute bottom-3 left-3 right-3">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider backdrop-blur-md ${tier.bg} ${tier.text} border ${tier.border} bg-white/90`}>
              {tier.label}
            </span>
            <span className="text-[10px] font-medium text-white/80">
              {recipe.cuisine} • {recipe.diet}
            </span>
          </div>
          <h3 className="text-lg font-serif italic text-white line-clamp-1 leading-snug">
            {recipe.name}
          </h3>
        </div>
      </div>

      {/* Body details */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
        {/* Metric strip & chef reason */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-4 text-xs text-[#737373]">
            <span className="flex items-center gap-1">
              <Clock size={13} className="text-[#FF5A3C]" />
              {recipe.totalTime} mins
            </span>
            <span className="flex items-center gap-1">
              <Flame size={13} className="text-[#FF5A3C]" />
              {recipe.calories} kcal
            </span>
            <span className="flex items-center gap-1">
              <ChefHat size={13} className="text-[#FF5A3C]" />
              {recipe.difficulty}
            </span>
          </div>

          {reasonForRecommendation && (
            <p className="text-xs text-[#525252] italic bg-[#FFFDF9] p-2.5 rounded-xl border border-[#171717]/5 flex items-start gap-2">
              <Sparkles size={14} className="text-[#FF5A3C] flex-shrink-0 mt-0.5" />
              <span>{reasonForRecommendation}</span>
            </p>
          )}
        </div>

        {/* Ingredients Matching Breakdown */}
        <div className="space-y-2 pt-1 border-t border-[#171717]/5">
          {/* Available in Kitchen */}
          {availableIngredients.length > 0 && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block mb-1.5 flex items-center gap-1">
                <Check size={11} className="stroke-[2.5]" />
                In Your Kitchen ({availableIngredients.length})
              </span>
              <div className="flex flex-wrap gap-1">
                {availableIngredients.map((item, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-medium px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-md border border-emerald-100 flex items-center gap-1"
                  >
                    <Check size={9} />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Missing Required Ingredients */}
          {missingIngredients.length > 0 && (
            <div className="pt-1">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1">
                  <AlertCircle size={11} />
                  Missing Required ({missingIngredients.length})
                </span>
                <button
                  type="button"
                  onClick={handleAddMissingToCart}
                  disabled={missingAlreadyOnShoppingList}
                  className="text-[10px] font-bold text-[#FF5A3C] hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:no-underline"
                >
                  <PlusCircle size={11} />
                  {missingAlreadyOnShoppingList ? 'Added to List' : 'Add to Shopping List'}
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {missingIngredients.map((item, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-medium px-2 py-0.5 bg-amber-50 text-amber-800 rounded-md border border-amber-100 flex items-center gap-1"
                  >
                    <Plus size={9} className="text-amber-600" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Optional missing ingredients */}
          {optionalMissingIngredients && optionalMissingIngredients.length > 0 && (
            <div className="pt-0.5">
              <span className="text-[10px] text-[#737373] block">
                Optional finishing touches: {optionalMissingIngredients.join(', ')}
              </span>
            </div>
          )}
        </div>

        {/* Action button bar */}
        <div className="pt-2 flex items-center gap-2">
          {missingIngredients.length > 0 && !missingAlreadyOnShoppingList ? (
            <button
              type="button"
              onClick={handleAddMissingToCart}
              className="flex-1 py-2.5 px-3 bg-white hover:bg-stone-50 active:scale-98 border border-[#171717]/10 rounded-xl text-xs font-bold text-[#171717] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <PlusCircle size={14} className="text-[#FF5A3C]" />
              Add Missing to Shopping List
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => setSelectedRecipe(recipe)}
            className="flex-1 py-2.5 px-4 bg-[#FF5A3C] hover:bg-[#E2482B] active:scale-98 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm shadow-[#FF5A3C]/20 transition-all cursor-pointer"
          >
            <span>View Recipe</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export const PantryRecommendationCard = memo(PantryRecommendationCardComponent);
