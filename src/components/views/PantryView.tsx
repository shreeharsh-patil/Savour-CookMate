import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Plus,
  Trash2,
  AlertCircle,
  ShoppingBag,
  Check,
  Search,
  MessageSquare,
  Filter,
  CheckCircle2,
  RotateCcw,
  ArrowRight
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { PantryItem, PantryMatchGroup } from '../../types';
import { PantryRecommendationCard } from '../PantryRecommendationCard';
import { ShoppingListModal } from '../ShoppingListModal';

// Popular kitchen staples matching the user's explicit examples + essential staples
const QUICK_STAPLES: { name: string; category: PantryItem['category'] }[] = [
  { name: 'Chicken', category: 'Meat & Seafood' },
  { name: 'Rice', category: 'Pantry & Grains' },
  { name: 'Onion', category: 'Produce' },
  { name: 'Tomato', category: 'Produce' },
  { name: 'Paneer', category: 'Dairy & Eggs' },
  { name: 'Egg', category: 'Dairy & Eggs' },
  { name: 'Garlic', category: 'Produce' },
  { name: 'Yogurt', category: 'Dairy & Eggs' },
  { name: 'Ginger', category: 'Produce' },
  { name: 'Olive Oil', category: 'Spices & Oils' },
  { name: 'Coriander', category: 'Produce' },
  { name: 'Pasta', category: 'Pantry & Grains' },
];

const MATCH_GROUP_TABS: { id: PantryMatchGroup | 'ALL'; label: string; desc: string }[] = [
  { id: 'ALL', label: 'All Dishes', desc: 'All kitchen recommendations' },
  { id: 'MAKE NOW', label: 'MAKE NOW', desc: '0 missing ingredients' },
  { id: 'ALMOST THERE', label: 'ALMOST THERE', desc: 'Missing 1–2 items' },
  { id: 'GOOD MATCH', label: 'GOOD MATCH', desc: 'Strong pantry alignment' },
  { id: 'WORTH SHOPPING FOR', label: 'WORTH SHOPPING FOR', desc: 'Requires extra items' },
];

export const PantryView: React.FC = () => {
  const pantryItems = useAppStore((state) => state.pantryItems);
  const loadPantryItems = useAppStore((state) => state.loadPantryItems);
  const addPantryItem = useAppStore((state) => state.addPantryItem);
  const removePantryItem = useAppStore((state) => state.removePantryItem);
  const clearAllPantryItems = useAppStore((state) => state.clearAllPantryItems);
  const pantryRecommendations = useAppStore((state) => state.pantryRecommendations);
  const isPantryCooking = useAppStore((state) => state.isPantryCooking);
  const pantryError = useAppStore((state) => state.pantryError);
  const findDishesICanMake = useAppStore((state) => state.findDishesICanMake);
  const naturalLanguagePantryInput = useAppStore((state) => state.naturalLanguagePantryInput);
  const setNaturalLanguagePantryInput = useAppStore((state) => state.setNaturalLanguagePantryInput);
  const extractAndAddIngredients = useAppStore((state) => state.extractAndAddIngredients);
  const pantryMatchFilter = useAppStore((state) => state.pantryMatchFilter);
  const setPantryMatchFilter = useAppStore((state) => state.setPantryMatchFilter);
  const shoppingList = useAppStore((state) => state.shoppingList);

  const [ingredientInput, setIngredientInput] = useState('');
  const [ingredientCategory, setIngredientCategory] = useState<PantryItem['category']>('Produce');
  const [isExtractingNLP, setIsExtractingNLP] = useState(false);
  const [isShoppingListOpen, setIsShoppingListOpen] = useState(false);
  const [activeInputMode, setActiveInputMode] = useState<'quick' | 'natural'>('quick');

  useEffect(() => {
    loadPantryItems();
  }, [loadPantryItems]);

  const handleAddManualIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = ingredientInput.trim();
    if (!clean) return;

    // Handle comma-separated list entry e.g. "Chicken, Rice, Onion"
    if (clean.includes(',')) {
      const parts = clean.split(',').map(p => p.trim()).filter(Boolean);
      parts.forEach(p => addPantryItem(p, ingredientCategory));
    } else {
      addPantryItem(clean, ingredientCategory);
    }
    setIngredientInput('');
  };

  const handleExtractNLP = async () => {
    if (!naturalLanguagePantryInput.trim()) return;
    setIsExtractingNLP(true);
    await extractAndAddIngredients(naturalLanguagePantryInput);
    setIsExtractingNLP(false);
  };

  const handleCookWithWhatIHave = () => {
    findDishesICanMake();
  };

  const existingLower = useMemo(() => {
    return new Set(pantryItems.map(p => p.name.toLowerCase().trim()));
  }, [pantryItems]);

  // Filter recommendations based on active group tab
  const filteredRecommendations = useMemo(() => {
    return pantryRecommendations.filter(rec => {
      if (pantryMatchFilter === 'ALL') return true;
      const group = rec.group || rec.matchGroup;
      return group === pantryMatchFilter;
    });
  }, [pantryRecommendations, pantryMatchFilter]);

  const countByGroup = useMemo(() => {
    return {
      'MAKE NOW': pantryRecommendations.filter(r => (r.group || r.matchGroup) === 'MAKE NOW').length,
      'ALMOST THERE': pantryRecommendations.filter(r => (r.group || r.matchGroup) === 'ALMOST THERE').length,
      'GOOD MATCH': pantryRecommendations.filter(r => (r.group || r.matchGroup) === 'GOOD MATCH').length,
      'WORTH SHOPPING FOR': pantryRecommendations.filter(r => (r.group || r.matchGroup) === 'WORTH SHOPPING FOR').length,
    } as Record<PantryMatchGroup, number>;
  }, [pantryRecommendations]);

  const pendingShoppingCount = useMemo(() => {
    return shoppingList.filter(i => !i.checked).length;
  }, [shoppingList]);

  return (
    <div id="pantry-view" className="space-y-6 px-4 pt-3 pb-12 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#737373] font-bold mb-1 block">
            Zero-Waste Intelligence • Kitchen Lab
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif italic font-light tracking-tight text-[#171717]">
            My Kitchen
          </h1>
          <p className="text-xs text-[#737373] mt-0.5">
            Keep track of what you have and turn everyday ingredients into gourmet dishes.
          </p>
        </div>

        {/* Shopping List Trigger Pill */}
        <button
          id="open-shopping-list-btn"
          onClick={() => setIsShoppingListOpen(true)}
          className="relative flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-stone-50 border border-[#171717]/10 rounded-2xl shadow-xs text-xs font-bold text-[#171717] cursor-pointer transition-all"
        >
          <ShoppingBag size={14} className="text-[#FF5A3C]" />
          <span>Shopping List</span>
          {pendingShoppingCount > 0 && (
            <span className="ml-0.5 px-1.5 py-0.2 bg-[#FF5A3C] text-white text-[10px] font-bold rounded-full">
              {pendingShoppingCount}
            </span>
          )}
        </button>
      </div>

      {/* Input Mode Selector */}
      <div className="flex bg-[#171717]/5 p-1 rounded-2xl">
        <button
          type="button"
          onClick={() => setActiveInputMode('quick')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeInputMode === 'quick'
              ? 'bg-white text-[#171717] shadow-xs'
              : 'text-[#737373] hover:text-[#171717]'
          }`}
        >
          <Search size={13} />
          <span>Search & Add Ingredients</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveInputMode('natural')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeInputMode === 'natural'
              ? 'bg-white text-[#171717] shadow-xs'
              : 'text-[#737373] hover:text-[#171717]'
          }`}
        >
          <MessageSquare size={13} />
          <span>Natural Language AI</span>
        </button>
      </div>

      {/* Mode 1: Manual Search & Add Input */}
      {activeInputMode === 'quick' ? (
        <div className="bg-white rounded-[28px] p-5 border border-[#171717]/5 shadow-xs space-y-4">
          <form onSubmit={handleAddManualIngredient} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3.5 top-3.5 text-[#A3A3A3]" />
                <input
                  type="text"
                  id="pantry-ingredient-input"
                  value={ingredientInput}
                  onChange={(e) => setIngredientInput(e.target.value)}
                  placeholder="Enter ingredient (e.g. Chicken, Rice, Onion, Paneer)..."
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#FFFDF9] text-xs text-[#171717] rounded-xl border border-[#171717]/10 focus:outline-none focus:border-[#FF5A3C]"
                />
              </div>

              <div className="flex gap-2">
                <select
                  value={ingredientCategory}
                  onChange={(e) => setIngredientCategory(e.target.value as any)}
                  className="px-3 py-2.5 bg-[#FFFDF9] text-xs text-[#171717] rounded-xl border border-[#171717]/10 focus:outline-none"
                >
                  <option value="Produce">Produce</option>
                  <option value="Dairy & Eggs">Dairy & Eggs</option>
                  <option value="Meat & Seafood">Meat & Seafood</option>
                  <option value="Pantry & Grains">Grains & Pantry</option>
                  <option value="Spices & Oils">Spices & Oils</option>
                  <option value="Other">Other</option>
                </select>

                <button
                  type="submit"
                  disabled={!ingredientInput.trim()}
                  className="px-4 py-2.5 bg-[#FF5A3C] hover:bg-[#E2482B] text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
                >
                  <Plus size={14} /> Add
                </button>
              </div>
            </div>
            <p className="text-[10px] text-[#737373]">
              Tip: Separate multiple items with commas (e.g., &ldquo;Chicken, Rice, Onion, Garlic&rdquo;)
            </p>
          </form>

          {/* Quick-add chips */}
          <div className="pt-2 border-t border-[#171717]/5">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#737373] block mb-2">
              Common Kitchen Staples (Tap to add)
            </span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_STAPLES.map((staple) => {
                const isAdded = existingLower.has(staple.name.toLowerCase().trim());
                return (
                  <button
                    key={staple.name}
                    type="button"
                    onClick={() => {
                      if (!isAdded) {
                        addPantryItem(staple.name, staple.category);
                      }
                    }}
                    disabled={isAdded}
                    className={`flex items-center gap-1 text-[11px] font-medium px-3 py-1.5 rounded-full border transition-all ${
                      isAdded
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 opacity-60 cursor-default'
                        : 'bg-[#FFFDF9] hover:bg-white border-[#171717]/10 text-[#171717] hover:border-[#FF5A3C] cursor-pointer shadow-2xs'
                    }`}
                  >
                    {isAdded ? <Check size={11} className="stroke-[2.5]" /> : <Plus size={11} className="text-[#FF5A3C]" />}
                    {staple.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Mode 2: Natural Language Prompt */
        <div className="bg-white rounded-[28px] p-5 border border-[#171717]/5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#FF5A3C] flex items-center gap-1">
              <Sparkles size={12} />
              Natural-Language Kitchen Input
            </span>
          </div>
          <p className="text-xs text-[#737373]">
            Tell Gemini what you have in everyday words. Example: &ldquo;I have chicken, rice, onion and curd and want something spicy.&rdquo;
          </p>
          <textarea
            id="natural-language-pantry-input"
            rows={3}
            value={naturalLanguagePantryInput}
            onChange={(e) => setNaturalLanguagePantryInput(e.target.value)}
            placeholder="e.g. I have paneer, tomato, garlic, onion, and some basmati rice in the fridge. Want something quick and comforting..."
            className="w-full p-3.5 bg-[#FFFDF9] text-xs text-[#171717] rounded-2xl border border-[#171717]/10 focus:outline-none focus:border-[#FF5A3C] resize-none"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleExtractNLP}
              disabled={isExtractingNLP || !naturalLanguagePantryInput.trim()}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-[#171717] text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isExtractingNLP ? (
                <>
                  <span className="w-3 h-3 border-2 border-[#171717] border-t-transparent rounded-full animate-spin" />
                  <span>Extracting...</span>
                </>
              ) : (
                <>
                  <Plus size={13} />
                  <span>Extract & Add to Kitchen</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Selected Pantry Ingredients Inventory */}
      <div className="bg-white rounded-[32px] p-5 border border-[#171717]/5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#171717]/5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#171717]">
              Available Ingredients ({pantryItems.length})
            </span>
            {pantryItems.length > 0 && (
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                Ready to Cook
              </span>
            )}
          </div>
          {pantryItems.length > 0 && (
            <button
              type="button"
              onClick={clearAllPantryItems}
              className="text-[10px] text-stone-500 hover:text-red-500 font-semibold cursor-pointer transition-colors"
            >
              Clear All
            </button>
          )}
        </div>

        {pantryItems.length === 0 ? (
          <div className="text-center py-8 text-[#737373] space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-stone-50 flex items-center justify-center mx-auto text-[#A3A3A3]">
              <Search size={22} />
            </div>
            <p className="text-xs font-semibold text-[#171717]">No ingredients added yet</p>
            <p className="text-[11px] max-w-xs mx-auto">
              Add ingredients above or tap the staples to start cooking with what you already have.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-3.5">
            {pantryItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-[#FFFDF9] rounded-2xl border border-[#171717]/5 group hover:border-[#FF5A3C]/30 transition-all"
              >
                <div className="min-w-0 pr-1">
                  <h4 className="text-xs font-bold text-[#171717] truncate">{item.name}</h4>
                  <span className="text-[9px] text-[#737373] uppercase tracking-wider block">
                    {item.category}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removePantryItem(item.id)}
                  className="p-1 text-[#A3A3A3] hover:text-red-500 transition-colors cursor-pointer"
                  title={`Remove ${item.name}`}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Feature Action Button: "Cook With What I Have" / "Find dishes I can make" */}
      <div className="pt-1">
        <button
          id="find-dishes-btn"
          type="button"
          onClick={handleCookWithWhatIHave}
          disabled={isPantryCooking || (pantryItems.length === 0 && !naturalLanguagePantryInput.trim())}
          className="w-full py-4 px-6 bg-[#FF5A3C] hover:bg-[#E2482B] active:scale-[0.99] text-white font-bold text-sm rounded-2xl shadow-xl shadow-[#FF5A3C]/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isPantryCooking ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Gemini is Matching Recipes to Your Kitchen...</span>
            </>
          ) : (
            <>
              <Sparkles size={18} />
              <span>Find dishes I can make</span>
            </>
          )}
        </button>
      </div>

      {/* Pantry Error Feedback */}
      {pantryError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
          <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-red-800">
            <span className="font-bold block">Pantry Recommendation Notice</span>
            <span>{pantryError}</span>
          </div>
        </div>
      )}

      {/* Recommendations Section */}
      {pantryRecommendations.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-[#171717]/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#FF5A3C] flex items-center gap-1">
                <Sparkles size={12} />
                Intelligent Pantry Matching Results
              </span>
              <h2 className="text-xl font-serif italic text-[#171717]">
                Dishes Tailored to Your Kitchen ({pantryRecommendations.length})
              </h2>
            </div>

            <button
              type="button"
              onClick={handleCookWithWhatIHave}
              disabled={isPantryCooking}
              className="text-xs font-semibold text-[#737373] hover:text-[#171717] flex items-center gap-1 cursor-pointer self-start sm:self-auto"
            >
              <RotateCcw size={13} />
              <span>Refresh Suggestions</span>
            </button>
          </div>

          {/* Group Filter Tabs: MAKE NOW, ALMOST THERE, GOOD MATCH, WORTH SHOPPING FOR */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {MATCH_GROUP_TABS.map((tab) => {
              const isActive = pantryMatchFilter === tab.id;
              const count = tab.id === 'ALL' ? pantryRecommendations.length : countByGroup[tab.id];

              return (
                <button
                  key={tab.id}
                  id={`tab-filter-${tab.id.toLowerCase()}`}
                  type="button"
                  onClick={() => setPantryMatchFilter(tab.id)}
                  className={`flex-shrink-0 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
                    isActive
                      ? 'bg-[#171717] text-white border-[#171717] shadow-sm'
                      : 'bg-white text-[#525252] border-[#171717]/10 hover:border-[#171717]/30'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-stone-100 text-[#737373]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Recommendation Cards */}
          {filteredRecommendations.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-[#171717]/5 space-y-2">
              <Filter size={24} className="mx-auto text-[#A3A3A3]" />
              <p className="text-xs font-bold text-[#171717]">No recipes in this match tier</p>
              <p className="text-[11px] text-[#737373]">
                Try selecting &ldquo;All Dishes&rdquo; to view recommendations across all match tiers.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredRecommendations.map((rec) => (
                <PantryRecommendationCard key={rec.recipe.id} recommendation={rec} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Shopping List Modal */}
      <ShoppingListModal
        isOpen={isShoppingListOpen}
        onClose={() => setIsShoppingListOpen(false)}
      />
    </div>
  );
};
