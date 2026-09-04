import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Bookmark,
  Clock,
  Flame,
  Users,
  Play,
  CheckCircle2,
  Circle,
  Lightbulb,
  ChefHat,
  Sparkles,
  ExternalLink,
  Share2,
  PlusCircle,
  Check,
  AlertCircle,
  RotateCw,
  ShoppingBag,
  Activity,
  Heart
} from 'lucide-react';
import { Recipe, YouTubeVideo, Ingredient } from '../types';
import { useAppStore } from '../store/useAppStore';
import { recipeService } from '../services/recipeService';
import { YouTubeFilter } from '../services/youtubeService';
import { CulinaryImage } from './CulinaryImage';

interface RecipeDetailModalProps {
  recipe: Recipe;
  onClose: () => void;
}

export const RecipeDetailModal: React.FC<RecipeDetailModalProps> = ({ recipe, onClose }) => {
  const toggleSaveRecipe = useAppStore((state) => state.toggleSaveRecipe);
  const startCookingMode = useAppStore((state) => state.startCookingMode);
  const setActiveVideo = useAppStore((state) => state.setActiveVideo);
  const pantryItems = useAppStore((state) => state.pantryItems);
  const setToast = useAppStore((state) => state.setToast);
  const addMissingToShoppingList = useAppStore((state) => state.addMissingToShoppingList);
  const userPreferences = useAppStore((state) => state.userPreferences);

  const [activeSection, setActiveSection] = useState<
    'all' | 'pantry' | 'ingredients' | 'instructions' | 'nutrition' | 'tips' | 'videos'
  >('all');
  const [videoFilter, setVideoFilter] = useState<YouTubeFilter>('recommended');
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({});
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loadingVideos, setLoadingVideos] = useState<boolean>(false);
  const [showAllVideos, setShowAllVideos] = useState<boolean>(false);

  // Normalize pantry item names for fast matching
  const pantryNames = useMemo(() => {
    return new Set(pantryItems.map(p => p.name.toLowerCase().trim()));
  }, [pantryItems]);

  const ingredientsList = recipe.ingredients || [];

  const { youHaveList, youAreMissingList } = useMemo(() => {
    const have: Ingredient[] = [];
    const missing: Ingredient[] = [];

    ingredientsList.forEach((ing) => {
      const name = (ing.name || (ing as any).item || '').toLowerCase().trim();
      const norm = (ing.normalizedName || '').toLowerCase().trim();
      const hasIt = pantryNames.has(name) || (norm && pantryNames.has(norm));
      if (hasIt) {
        have.push(ing);
      } else {
        missing.push(ing);
      }
    });

    return { youHaveList: have, youAreMissingList: missing };
  }, [ingredientsList, pantryNames]);

  const totalRequired = ingredientsList.filter(i => !i.optional).length || ingredientsList.length;
  const matchPercentage = totalRequired > 0 ? Math.min(100, Math.round((youHaveList.length / totalRequired) * 100)) : 100;

  // Nutritional values (guaranteeing numbers)
  const calories = recipe.calories || 420;
  const protein = recipe.proteinGrams || Math.round(calories * 0.05);
  const carbs = recipe.carbsGrams || Math.round(calories * 0.09);
  const fat = recipe.fatGrams || Math.round(calories * 0.04);
  const fiber = recipe.fiberGrams || Math.max(2, Math.round(carbs * 0.12));

  // YouTube tutorial search effect
  const videoLanguages = userPreferences?.videoLanguages || [];

  useEffect(() => {
    let isMounted = true;
    const fetchVideos = async () => {
      setLoadingVideos(true);
      try {
        const list = await recipeService.getCookingVideosForRecipe(recipe, videoFilter, videoLanguages);
        if (isMounted) {
          setVideos(list);
        }
      } catch (err) {
        console.warn('Could not load recipe tutorials:', err);
      } finally {
        if (isMounted) setLoadingVideos(false);
      }
    };
    fetchVideos();
    return () => {
      isMounted = false;
    };
  }, [recipe, videoFilter, videoLanguages]);

  const toggleCheck = (index: number) => {
    setCheckedIngredients(prev => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: recipe.title,
        text: `Check out this recipe for ${recipe.title} on Savor!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
      setToast('Recipe link copied to clipboard');
    }
  };

  const handleAddAllMissing = () => {
    const missingNames = youAreMissingList
      .filter(i => !i.optional)
      .map(i => i.name || (i as any).item || '');
    if (missingNames.length > 0) {
      addMissingToShoppingList(missingNames, recipe.title, recipe.id);
    } else {
      setToast('All ingredients are already in your kitchen!');
    }
  };

  const totalTime = (recipe.prepTimeMinutes || recipe.prepTime || 10) + (recipe.cookTimeMinutes || recipe.cookTime || 20);
  const visibleVideos = showAllVideos ? videos : videos.slice(0, 3);

  return (
    <div
      id="recipe-detail-modal-overlay"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-end md:items-center overflow-y-auto no-scrollbar"
    >
      <div
        id="recipe-detail-sheet"
        className="w-full max-w-lg bg-[#FFFDF9] min-h-[92vh] max-h-[96vh] md:max-h-[92vh] rounded-t-[32px] md:rounded-[32px] overflow-hidden flex flex-col shadow-2xl relative border border-[#EAE5DC]"
      >
        {/* Sticky Top Header Nav */}
        <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-4 bg-gradient-to-b from-black/70 via-black/30 to-transparent">
          <button
            id="detail-back-btn"
            onClick={onClose}
            className="p-2.5 rounded-full bg-white/85 backdrop-blur-md text-[#171717] hover:bg-white transition-colors shadow-md cursor-pointer"
            title="Back to Recipes"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2.5 rounded-full bg-white/85 backdrop-blur-md text-[#171717] hover:bg-white transition-colors shadow-md cursor-pointer"
              title="Share Recipe"
            >
              <Share2 size={16} />
            </button>
            <button
              id="detail-save-btn"
              onClick={() => toggleSaveRecipe(recipe)}
              className="p-2.5 rounded-full bg-white/85 backdrop-blur-md text-[#171717] hover:bg-white transition-colors shadow-md cursor-pointer"
              title={recipe.isSaved ? 'Remove from Saved' : 'Save Recipe'}
            >
              <Bookmark
                size={18}
                className={recipe.isSaved ? 'fill-[#FF5A3C] text-[#FF5A3C]' : 'text-[#171717]'}
              />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-28">
          {/* Large Hero Food Image */}
          <div className="relative h-72 w-full bg-[#F5F2EC]">
            <CulinaryImage
              src={recipe.imageUrl}
              alt={recipe.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#FFFDF9] via-transparent to-black/30 pointer-events-none" />
            <div className="absolute bottom-4 left-5 right-5 flex items-center justify-between">
              <span className="bg-[#FF5A3C] text-white text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                {recipe.cuisine} • {recipe.difficulty}
              </span>
              <span className="bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold px-3 py-1 rounded-full">
                {recipe.servings} Servings
              </span>
            </div>
          </div>

          {/* Dish Title & High-level Metrics */}
          <div className="px-5 pt-3">
            <h1 className="text-2xl sm:text-3xl font-serif italic text-[#171717] tracking-tight leading-snug">
              {recipe.title}
            </h1>
            <p className="text-xs sm:text-sm text-[#737373] mt-2 leading-relaxed">
              {recipe.description}
            </p>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-4 gap-2 mt-4 p-3.5 bg-white rounded-2xl border border-[#171717]/5 shadow-xs text-center">
              <div>
                <span className="flex items-center justify-center text-[#FF5A3C] mb-1">
                  <Clock size={16} />
                </span>
                <span className="text-xs font-bold text-[#171717] block">{totalTime}m</span>
                <span className="text-[9px] uppercase tracking-wider text-[#737373]">Total</span>
              </div>
              <div>
                <span className="flex items-center justify-center text-amber-500 mb-1">
                  <Flame size={16} />
                </span>
                <span className="text-xs font-bold text-[#171717] block">{calories}</span>
                <span className="text-[9px] uppercase tracking-wider text-[#737373]">Calories</span>
              </div>
              <div>
                <span className="flex items-center justify-center text-emerald-600 mb-1">
                  <Activity size={16} />
                </span>
                <span className="text-xs font-bold text-[#171717] block">{recipe.difficulty}</span>
                <span className="text-[9px] uppercase tracking-wider text-[#737373]">Level</span>
              </div>
              <div>
                <span className="flex items-center justify-center text-indigo-500 mb-1">
                  <Sparkles size={16} />
                </span>
                <span className="text-xs font-bold text-[#171717] block">
                  ★ {recipe.ratingEstimate ? recipe.ratingEstimate.toFixed(1) : '4.9'}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-[#737373]">Rating</span>
              </div>
            </div>

            {/* Ingredient Match Bar */}
            <div className="mt-4 p-3.5 bg-gradient-to-r from-[#FFF9F5] to-[#F5FBF7] border border-[#EBE6DC] rounded-2xl">
              <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
                <span className="flex items-center gap-1.5 text-[#171717]">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  Kitchen Ingredient Match
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                  matchPercentage >= 80
                    ? 'bg-emerald-100 text-emerald-800'
                    : matchPercentage >= 50
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-stone-100 text-stone-700'
                }`}>
                  {youHaveList.length} of {totalRequired} ({matchPercentage}%)
                </span>
              </div>
              <div className="h-2 w-full bg-[#E5E0D6] rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    matchPercentage >= 80
                      ? 'bg-emerald-500'
                      : matchPercentage >= 50
                      ? 'bg-amber-500'
                      : 'bg-[#FF5A3C]'
                  }`}
                  style={{ width: `${matchPercentage}%` }}
                />
              </div>
            </div>

            {/* Quick Navigation Filter Pills */}
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-3 mt-3 border-b border-[#171717]/5">
              {[
                { id: 'all', label: 'All Sections' },
                { id: 'pantry', label: 'You Have / Missing' },
                { id: 'ingredients', label: 'Ingredients' },
                { id: 'instructions', label: 'Instructions' },
                { id: 'nutrition', label: 'Nutrition' },
                { id: 'tips', label: 'Tips & Swaps' },
                { id: 'videos', label: "Watch How It's Made" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id as any)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                    activeSection === tab.id
                      ? 'bg-[#FF5A3C] text-white shadow-xs'
                      : 'bg-white text-[#737373] border border-[#EAE5DC] hover:text-[#171717]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ========================================================= */}
            {/* SECTION: YOU HAVE & YOU'RE MISSING                        */}
            {/* ========================================================= */}
            {(activeSection === 'all' || activeSection === 'pantry') && (
              <div className="mt-5 space-y-4">
                {/* You Have */}
                <div className="p-4 bg-emerald-50/50 border border-emerald-200/70 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-emerald-600" />
                      You Have ({youHaveList.length})
                    </span>
                    <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100/60 px-2 py-0.5 rounded-full">
                      Ready in Pantry
                    </span>
                  </div>
                  {youHaveList.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {youHaveList.map((ing, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-white text-emerald-900 border border-emerald-200 px-2.5 py-1 rounded-xl font-medium shadow-2xs"
                        >
                          ✓ {ing.name || (ing as any).item}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-emerald-700 italic">No pantry items matched yet.</p>
                  )}
                </div>

                {/* You're Missing */}
                <div className="p-4 bg-amber-50/50 border border-amber-200/70 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                      <AlertCircle size={14} className="text-amber-600" />
                      You're Missing ({youAreMissingList.length})
                    </span>
                    {youAreMissingList.length > 0 && (
                      <button
                        onClick={handleAddAllMissing}
                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[10px] font-bold flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
                      >
                        <PlusCircle size={12} />
                        <span>Add to List</span>
                      </button>
                    )}
                  </div>
                  {youAreMissingList.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {youAreMissingList.map((ing, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-white text-amber-900 border border-amber-200 px-2.5 py-1 rounded-xl font-medium shadow-2xs"
                        >
                          + {ing.name || (ing as any).item} {ing.optional ? '(opt)' : ''}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-emerald-700 font-semibold">
                      You have all ingredients needed for this dish!
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* SECTION: INGREDIENTS CHECKLIST                            */}
            {/* ========================================================= */}
            {(activeSection === 'all' || activeSection === 'ingredients') && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#171717]">
                    Ingredients ({ingredientsList.length})
                  </h3>
                  <span className="text-[10px] text-[#737373]">Tap to mark acquired</span>
                </div>
                <div className="space-y-2">
                  {ingredientsList.map((ing, idx) => {
                    const ingName = ing.name || (ing as any).item || '';
                    const ingAmount = ing.amount || (ing.quantity ? `${ing.quantity} ${ing.unit || ''}`.trim() : '');
                    const isChecked = Boolean(checkedIngredients[idx]);
                    const inPantry = pantryNames.has(ingName.toLowerCase().trim()) || (ing.normalizedName && pantryNames.has(ing.normalizedName.toLowerCase().trim()));

                    return (
                      <div
                        key={idx}
                        onClick={() => toggleCheck(idx)}
                        className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-[#F9F8F6] border-[#E8E3DA] opacity-60'
                            : inPantry
                            ? 'bg-emerald-50/40 border-emerald-200'
                            : 'bg-white border-[#F0ECE4] hover:border-[#E0DCD4]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {isChecked ? (
                            <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
                          ) : (
                            <Circle size={18} className="text-[#A3A3A3] flex-shrink-0" />
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`text-xs font-bold ${isChecked ? 'line-through text-[#737373]' : 'text-[#171717]'}`}>
                                {ingName}
                              </span>
                              {ing.optional && (
                                <span className="text-[9px] text-[#737373] bg-[#F5F2EC] px-1.5 py-0.2 rounded font-medium">
                                  Optional
                                </span>
                              )}
                            </div>
                            {inPantry && (
                              <span className="block text-[10px] font-semibold text-emerald-700">
                                ✓ Available in Pantry
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-[#FF5A3C] bg-[#FFF5F2] px-2 py-1 rounded-lg flex-shrink-0 ml-2">
                          {ingAmount}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* SECTION: INSTRUCTIONS                                     */}
            {/* ========================================================= */}
            {(activeSection === 'all' || activeSection === 'instructions') && (
              <div className="mt-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#171717] mb-3">
                  Instructions ({recipe.instructions?.length || 0} Steps)
                </h3>
                <div className="space-y-3">
                  {(recipe.instructions || []).map((step: any, idx) => {
                    const stepText = typeof step === 'string' ? step : step.text;
                    const stepTitle = typeof step === 'object' && step.title ? step.title : `Step ${idx + 1}`;
                    const stepTip = typeof step === 'object' && step.tip ? step.tip : (recipe.tips?.[idx] || recipe.chefTips?.[idx]);

                    return (
                      <div
                        key={idx}
                        className="p-4 bg-white rounded-2xl border border-[#F0ECE4] shadow-2xs relative pl-12"
                      >
                        <span className="absolute left-3.5 top-4 w-6 h-6 rounded-full bg-[#FF5A3C] text-white text-xs font-bold flex items-center justify-center shadow-xs">
                          {idx + 1}
                        </span>
                        <h4 className="text-xs font-bold text-[#171717]">{stepTitle}</h4>
                        <p className="text-xs text-[#525252] mt-1 leading-relaxed">{stepText}</p>
                        {stepTip && (
                          <div className="mt-2 text-[11px] text-[#FF5A3C] bg-[#FFF5F2] p-2 rounded-xl flex items-center gap-1.5 font-medium">
                            <Lightbulb size={12} className="flex-shrink-0" />
                            <span>{stepTip}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* SECTION: NUTRITION                                        */}
            {/* ========================================================= */}
            {(activeSection === 'all' || activeSection === 'nutrition') && (
              <div className="mt-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#171717] mb-3 flex items-center gap-1.5">
                  <Activity size={14} className="text-[#FF5A3C]" />
                  Nutrition Facts (Per Serving)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 p-4 bg-white rounded-2xl border border-[#F0ECE4] shadow-xs">
                  <div className="p-2.5 bg-[#FFF5F2] rounded-xl text-center">
                    <span className="text-[10px] uppercase font-bold text-[#737373] block">Calories</span>
                    <span className="text-lg font-serif italic font-bold text-[#FF5A3C]">{calories}</span>
                    <span className="text-[9px] text-[#737373] block">kcal</span>
                  </div>
                  <div className="p-2.5 bg-emerald-50/60 rounded-xl text-center">
                    <span className="text-[10px] uppercase font-bold text-[#737373] block">Protein</span>
                    <span className="text-lg font-serif italic font-bold text-emerald-800">{protein}g</span>
                    <span className="text-[9px] text-[#737373] block">macro</span>
                  </div>
                  <div className="p-2.5 bg-amber-50/60 rounded-xl text-center">
                    <span className="text-[10px] uppercase font-bold text-[#737373] block">Carbs</span>
                    <span className="text-lg font-serif italic font-bold text-amber-800">{carbs}g</span>
                    <span className="text-[9px] text-[#737373] block">energy</span>
                  </div>
                  <div className="p-2.5 bg-indigo-50/60 rounded-xl text-center">
                    <span className="text-[10px] uppercase font-bold text-[#737373] block">Fat</span>
                    <span className="text-lg font-serif italic font-bold text-indigo-800">{fat}g</span>
                    <span className="text-[9px] text-[#737373] block">lipids</span>
                  </div>
                  <div className="p-2.5 bg-purple-50/60 rounded-xl text-center col-span-2 sm:col-span-1">
                    <span className="text-[10px] uppercase font-bold text-[#737373] block">Fiber</span>
                    <span className="text-lg font-serif italic font-bold text-purple-800">{fiber}g</span>
                    <span className="text-[9px] text-[#737373] block">dietary</span>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* SECTION: TIPS & SUBSTITUTIONS                             */}
            {/* ========================================================= */}
            {(activeSection === 'all' || activeSection === 'tips') && (
              <div className="mt-6 space-y-4">
                {/* Chef Tips */}
                {((recipe.tips && recipe.tips.length > 0) || (recipe.chefTips && recipe.chefTips.length > 0)) && (
                  <div className="p-4 bg-[#FFF5F2] border border-[#FFE1D9] rounded-2xl">
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#FF5A3C] mb-2.5">
                      <Lightbulb size={14} />
                      <span>Executive Chef Tips</span>
                    </div>
                    <ul className="space-y-2 text-xs text-[#525252] leading-relaxed pl-1">
                      {(recipe.tips || recipe.chefTips || []).map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-[#FF5A3C] font-bold">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Substitutions */}
                {recipe.substitutions && recipe.substitutions.length > 0 && (
                  <div className="p-4 bg-[#FBF9F5] border border-[#EBE6DC] rounded-2xl">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-[#737373] mb-2.5 flex items-center gap-1.5">
                      <RotateCw size={12} className="text-[#FF5A3C]" />
                      Smart Ingredient Substitutions
                    </h4>
                    <div className="space-y-2">
                      {recipe.substitutions.map((sub, sIdx) => (
                        <div
                          key={sIdx}
                          className="flex items-center justify-between text-xs bg-white p-2.5 rounded-xl border border-[#171717]/5"
                        >
                          <span className="font-semibold text-[#171717]">{sub.ingredient}</span>
                          <span className="text-[#737373]">
                            ↔ <span className="text-[#FF5A3C] font-bold">{sub.substitute}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================= */}
            {/* SECTION: WATCH HOW IT'S MADE (YOUTUBE INTEGRATION)        */}
            {/* ========================================================= */}
            {(activeSection === 'videos' || (activeSection === 'all' && (loadingVideos || videos.length > 0))) && (
              <div className="mt-7 pt-4 border-t border-[#171717]/5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#FF5A3C] block">
                      YouTube Data API v3
                    </span>
                    <h3 className="text-lg font-serif italic text-[#171717]">
                      Watch How It's Made
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold text-[#737373] bg-white px-2.5 py-1 rounded-full border border-[#EBE6DC]">
                    {videos.length} Masterclasses
                  </span>
                </div>

                {/* Filter Pills */}
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-3">
                  {(['recommended', 'english', 'hindi', 'quick', 'detailed'] as YouTubeFilter[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => {
                        setVideoFilter(f);
                        setShowAllVideos(false);
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-bold capitalize transition-all cursor-pointer ${
                        videoFilter === f
                          ? 'bg-[#171717] text-white'
                          : 'bg-white text-[#737373] border border-[#EAE5DC] hover:text-[#171717]'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                {/* Video Cards List */}
                {loadingVideos ? (
                  <div className="py-10 text-center bg-white rounded-2xl border border-[#F0ECE4]">
                    <span className="inline-block w-6 h-6 border-2 border-[#FF5A3C] border-t-transparent rounded-full animate-spin mb-2" />
                    <p className="text-xs text-[#737373]">Loading authentic cooking videos...</p>
                  </div>
                ) : visibleVideos.length > 0 ? (
                  <div className="space-y-3">
                    {visibleVideos.map((vid) => (
                      <div
                        key={vid.id}
                        className="bg-white rounded-2xl border border-[#F0ECE4] hover:border-[#FF5A3C] transition-all p-3 shadow-2xs group flex flex-col gap-2.5"
                      >
                        <div className="flex gap-3 items-start">
                          {/* Thumbnail with duration badge */}
                          <div
                            onClick={() => setActiveVideo(vid)}
                            className="relative w-32 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-black cursor-pointer shadow-xs"
                          >
                            <img
                              src={vid.thumbnailUrl}
                              alt={vid.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                              <span className="w-8 h-8 rounded-full bg-[#FF5A3C] text-white flex items-center justify-center shadow-md">
                                <Play size={14} className="fill-white translate-x-0.5" />
                              </span>
                            </div>
                            {vid.duration && (
                              <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] font-mono px-1.5 py-0.5 rounded font-bold">
                                {vid.duration}
                              </span>
                            )}
                          </div>

                          {/* Video metadata */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1">
                              {vid.language && (
                                <span className="text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded bg-stone-100 text-stone-700">
                                  {vid.language}
                                </span>
                              )}
                              {vid.isQuick && (
                                <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                                  Quick
                                </span>
                              )}
                            </div>
                            <h4
                              onClick={() => setActiveVideo(vid)}
                              className="text-xs font-bold text-[#171717] line-clamp-2 cursor-pointer group-hover:text-[#FF5A3C] transition-colors leading-snug"
                            >
                              {vid.title}
                            </h4>
                            <p className="text-[11px] text-[#737373] mt-1 font-medium truncate">
                              {vid.channelTitle}
                            </p>
                            <span className="text-[10px] text-[#A3A3A3] block mt-0.5">
                              {vid.views || '250K views'}
                            </span>
                          </div>
                        </div>

                        {/* Video Card Action Buttons */}
                        <div className="flex items-center justify-between pt-2 border-t border-[#F5F2EC]">
                          <button
                            onClick={() => setActiveVideo(vid)}
                            className="px-3 py-1.5 bg-[#FF5A3C] hover:bg-[#E2482B] text-white text-[11px] font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                          >
                            <Play size={12} className="fill-white" />
                            <span>Watch Tutorial</span>
                          </button>
                          <a
                            href={vid.videoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] font-bold text-[#737373] hover:text-[#171717] inline-flex items-center gap-1 transition-colors"
                          >
                            Open on YouTube <ExternalLink size={12} />
                          </a>
                        </div>
                      </div>
                    ))}

                    {/* Toggle show more videos */}
                    {videos.length > 3 && (
                      <button
                        onClick={() => setShowAllVideos(!showAllVideos)}
                        className="w-full py-2.5 bg-white border border-[#EAE5DC] hover:border-[#171717] text-[#171717] text-xs font-bold rounded-xl transition-all cursor-pointer"
                      >
                        {showAllVideos ? 'Show Best 3 Only' : `Show All ${videos.length} Videos`}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-white rounded-2xl border border-[#F0ECE4]">
                    <p className="text-xs text-[#737373] mb-2">No videos matched this filter.</p>
                    <button
                      onClick={() => setVideoFilter('recommended')}
                      className="text-xs font-bold text-[#FF5A3C] underline cursor-pointer"
                    >
                      Reset to Recommended
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sticky Bottom CTA: Start Cooking */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-[#F0ECE4] flex items-center gap-3">
          <button
            id="start-cooking-mode-btn"
            onClick={() => {
              onClose();
              startCookingMode(recipe);
            }}
            className="flex-1 py-4 bg-[#FF5A3C] hover:bg-[#E2482B] active:scale-[0.98] text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-xl shadow-[#FF5A3C]/25 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <ChefHat size={20} />
            <span>Start Cooking</span>
          </button>
        </div>
      </div>
    </div>
  );
};
