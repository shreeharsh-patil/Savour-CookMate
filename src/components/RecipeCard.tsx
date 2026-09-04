import React, { memo } from 'react';
import { Clock, Flame, Bookmark, Play, ChefHat, Sparkles, Star } from 'lucide-react';
import { Recipe } from '../types';
import { useAppStore } from '../store/useAppStore';
import { CulinaryImage } from './CulinaryImage';

interface RecipeCardProps {
  recipe: Recipe;
  variant?: 'featured' | 'compact' | 'horizontal';
  onSelect?: () => void;
}

const RecipeCardComponent: React.FC<RecipeCardProps> = ({ recipe, variant = 'featured', onSelect }) => {
  const toggleSaveRecipe = useAppStore((state) => state.toggleSaveRecipe);
  const setSelectedRecipe = useAppStore((state) => state.setSelectedRecipe);
  const setActiveVideo = useAppStore((state) => state.setActiveVideo);

  const handleCardClick = () => {
    if (onSelect) {
      onSelect();
    } else {
      setSelectedRecipe(recipe);
    }
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleSaveRecipe(recipe);
  };

  const handlePlayVideo = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveVideo({
      id: 'video-' + recipe.id,
      title: recipe.title + ' — Masterclass',
      channelTitle: 'Culinary Masterclass',
      description: `Step-by-step video guide for cooking authentic ${recipe.title}.`,
      thumbnailUrl: recipe.imageUrl || 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80',
      videoUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(recipe.youtubeSearchQuery || recipe.title)}`,
      embedUrl: `https://www.youtube.com/embed/sq3y6_3L6dE?autoplay=1`,
    });
  };

  const totalTime = (recipe.prepTimeMinutes || 10) + (recipe.cookTimeMinutes || 20);

  if (variant === 'compact') {
    return (
      <div
        id={`recipe-card-compact-${recipe.id}`}
        onClick={handleCardClick}
        className="group relative flex-shrink-0 w-44 bg-white rounded-[24px] overflow-hidden border border-[#171717]/5 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer"
      >
        <div className="relative h-32 w-full overflow-hidden bg-[#F5F2EC]">
          <CulinaryImage
            src={recipe.imageUrl}
            alt={recipe.title}
            className="w-full h-full group-hover:scale-105 transition-transform duration-300"
          />
          <button
            onClick={handleBookmark}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-colors cursor-pointer z-10"
          >
            <Bookmark size={13} className={recipe.isSaved ? 'fill-[#FF5A3C] text-[#FF5A3C]' : 'text-white'} />
          </button>
          <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 z-10">
            <Clock size={10} />
            {totalTime}m
          </div>
        </div>
        <div className="p-3">
          <span className="text-[9px] font-bold text-[#FF5A3C] uppercase tracking-[0.15em]">{recipe.cuisine}</span>
          <h4 className="text-sm font-serif italic text-[#171717] line-clamp-1 mt-0.5 group-hover:text-[#FF5A3C] transition-colors">
            {recipe.title}
          </h4>
          <div className="flex items-center justify-between text-[11px] text-[#737373] mt-2 pt-1.5 border-t border-[#171717]/5">
            <span className="flex items-center gap-0.5">
              <Flame size={11} className="text-[#FF5A3C]" />
              {recipe.calories} kcal
            </span>
            <span className="font-semibold text-[10px] bg-[#F5F2EC] px-1.5 py-0.5 rounded-md text-[#171717]">
              {recipe.difficulty}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Full Featured Food Card with Artistic Flair
  return (
    <article
      id={`recipe-card-featured-${recipe.id}`}
      onClick={handleCardClick}
      className="group relative bg-white rounded-[32px] overflow-hidden border border-[#171717]/5 shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer"
    >
      {/* Large Food Photography */}
      <div className="relative h-56 w-full overflow-hidden bg-[#F5F2EC]">
        <CulinaryImage
          src={recipe.imageUrl}
          alt={recipe.title}
          className="w-full h-full group-hover:scale-103 transition-transform duration-500 ease-out"
        />
        {/* Soft Vignette Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

        {/* Top Badges & Actions */}
        <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between z-10">
          <div className="flex items-center gap-1.5">
            <span className="bg-[#FF5A3C] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-sm flex items-center gap-1">
              <Sparkles size={11} />
              {recipe.cuisine}
            </span>
            {recipe.usedPantryItems && recipe.usedPantryItems.length > 0 && (
              <span className="bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                Pantry Match ({recipe.usedPantryItems.length})
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              id={`video-btn-${recipe.id}`}
              onClick={handlePlayVideo}
              aria-label="Play cooking video"
              className="p-2 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-[#FF5A3C] transition-all cursor-pointer shadow-md"
              title="Watch video guide"
            >
              <Play size={14} className="fill-white translate-x-0.5" />
            </button>
            <button
              id={`bookmark-btn-${recipe.id}`}
              onClick={handleBookmark}
              aria-label="Save recipe"
              className="p-2 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-black/70 transition-all cursor-pointer shadow-md"
              title={recipe.isSaved ? 'Saved' : 'Save recipe'}
            >
              <Bookmark size={14} className={recipe.isSaved ? 'fill-[#FF5A3C] text-[#FF5A3C]' : 'text-white'} />
            </button>
          </div>
        </div>

        {/* In-Image Bottom Floating Badges */}
        <div className="absolute bottom-3 left-3.5 right-3.5 z-10 flex items-center justify-between text-white text-xs">
          <div className="flex items-center gap-2">
            <span className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full font-medium flex items-center gap-1 text-[11px]">
              <Star size={11} className="text-amber-400 fill-amber-400" />
              {recipe.ratingEstimate ? recipe.ratingEstimate.toFixed(1) : '4.8'}
            </span>
            <span className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full font-medium flex items-center gap-1 text-[11px]">
              <Clock size={12} className="text-[#FF5A3C]" />
              {totalTime} mins
            </span>
            <span className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full font-medium flex items-center gap-1 text-[11px]">
              <Flame size={12} className="text-amber-400" />
              {recipe.calories} kcal
            </span>
          </div>

          <span className="bg-white/90 backdrop-blur-md text-[#171717] px-3 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider">
            {recipe.difficulty}
          </span>
        </div>
      </div>

      {/* Card Content & Details */}
      <div className="p-5 bg-white">
        <h3 className="text-xl font-serif italic text-[#171717] group-hover:text-[#FF5A3C] transition-colors line-clamp-1 leading-snug">
          {recipe.title}
        </h3>
        <p className="text-xs text-[#737373] line-clamp-2 mt-1.5 leading-relaxed">
          {recipe.tagline || recipe.description}
        </p>

        {/* Dynamic Tags */}
        <div className="flex flex-wrap gap-1.5 mt-3.5">
          {(recipe.tags || []).slice(0, 3).map((tag, idx) => (
            <span
              key={idx}
              className="text-[10px] font-bold uppercase tracking-wider bg-[#FFF7F5] text-[#FF5A3C] border border-[#FFE6E1] px-2.5 py-0.5 rounded-full"
            >
              {tag}
            </span>
          ))}
          {recipe.proteinGrams && (
            <span className="text-[10px] font-semibold bg-[#F5F2EC] text-[#171717] px-2.5 py-0.5 rounded-full">
              {recipe.proteinGrams}g Protein
            </span>
          )}
        </div>

        {/* Bottom CTA Bar */}
        <div className="mt-4 pt-3.5 border-t border-[#171717]/5 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-[#737373]">
            <ChefHat size={14} className="text-[#FF5A3C]" />
            <span>{recipe.ingredients?.length || 0} ingredients</span>
            <span>•</span>
            <span>{recipe.instructions?.length || 0} steps</span>
          </div>
          <span className="text-xs font-bold text-[#FF5A3C] group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
            Cook Dish →
          </span>
        </div>
      </div>
    </article>
  );
};

export const RecipeCard = memo(RecipeCardComponent);
