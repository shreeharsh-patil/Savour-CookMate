import React, { useState } from 'react';
import { X, Plus, Trash2, CheckCircle2, Circle, ShoppingBag, ArrowRight, Check } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

interface ShoppingListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShoppingListModal: React.FC<ShoppingListModalProps> = ({ isOpen, onClose }) => {
  const {
    shoppingList,
    toggleShoppingListItem,
    removeShoppingListItem,
    clearCheckedShoppingList,
    moveShoppingItemToPantry,
    addMissingToShoppingList
  } = useAppStore();

  const [newItemName, setNewItemName] = useState('');

  if (!isOpen) return null;

  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    addMissingToShoppingList([newItemName.trim()], 'Custom Item');
    setNewItemName('');
  };

  const pendingItems = shoppingList.filter(item => !item.checked);
  const checkedItems = shoppingList.filter(item => item.checked);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="shopping-list-modal"
        className="bg-white w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] shadow-2xl flex flex-col max-h-[85vh] border border-[#171717]/10 overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 border-b border-[#171717]/5 flex items-center justify-between bg-[#FFFDF9]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FF5A3C]/10 flex items-center justify-center text-[#FF5A3C]">
              <ShoppingBag size={20} />
            </div>
            <div>
              <h2 className="text-lg font-serif italic text-[#171717]">Shopping List</h2>
              <p className="text-[11px] text-[#737373]">
                {pendingItems.length} item{pendingItems.length === 1 ? '' : 's'} to buy • {checkedItems.length} purchased
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#171717]/5 hover:bg-[#171717]/10 flex items-center justify-center text-[#737373] transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Add custom item form */}
        <form onSubmit={handleAddNewItem} className="p-4 border-b border-[#171717]/5 bg-white flex gap-2">
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="Add ingredient or grocery staple..."
            className="flex-1 px-4 py-2.5 text-xs bg-[#FFFDF9] border border-[#171717]/10 rounded-xl focus:outline-none focus:border-[#FF5A3C] text-[#171717]"
          />
          <button
            type="submit"
            disabled={!newItemName.trim()}
            className="px-4 py-2.5 bg-[#FF5A3C] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-[#E2482B] disabled:opacity-50 transition-colors cursor-pointer"
          >
            <Plus size={14} /> Add
          </button>
        </form>

        {/* Scrollable list content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {shoppingList.length === 0 ? (
            <div className="text-center py-12 text-[#737373] space-y-3">
              <ShoppingBag size={36} className="mx-auto text-[#A3A3A3] stroke-[1.5]" />
              <p className="text-sm font-semibold text-[#171717]">Your shopping list is clear</p>
              <p className="text-xs max-w-xs mx-auto">
                When a dish is missing ingredients, tap &ldquo;Add Missing to Shopping List&rdquo; in My Kitchen to add them here automatically.
              </p>
            </div>
          ) : (
            <>
              {/* Items to buy */}
              {pendingItems.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#737373] px-1">
                    To Buy ({pendingItems.length})
                  </span>
                  <div className="space-y-1.5">
                    {pendingItems.map((item) => (
                      <div
                        key={item.id}
                        className="group flex items-center justify-between p-3 bg-[#FFFDF9] hover:bg-white rounded-2xl border border-[#171717]/5 transition-all"
                      >
                        <div
                          onClick={() => toggleShoppingListItem(item.id)}
                          className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                        >
                          <Circle size={18} className="text-[#A3A3A3] group-hover:text-[#FF5A3C] transition-colors flex-shrink-0" />
                          <div className="min-w-0">
                            <span className="text-xs font-semibold text-[#171717] block truncate">
                              {item.name}
                            </span>
                            {item.recipeTitle && (
                              <span className="text-[10px] text-[#737373] truncate block">
                                For: {item.recipeTitle}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => moveShoppingItemToPantry(item.id)}
                            title="Bought it! Move directly to My Kitchen"
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <ArrowRight size={11} /> Kitchen
                          </button>
                          <button
                            onClick={() => removeShoppingListItem(item.id)}
                            className="p-1.5 text-[#A3A3A3] hover:text-red-500 transition-colors cursor-pointer"
                            title="Remove"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Already purchased / checked */}
              {checkedItems.length > 0 && (
                <div className="space-y-2 pt-3 border-t border-[#171717]/5">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-700">
                      Purchased ({checkedItems.length})
                    </span>
                    <button
                      onClick={clearCheckedShoppingList}
                      className="text-[10px] font-bold text-red-500 hover:underline cursor-pointer"
                    >
                      Clear Purchased
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {checkedItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-emerald-50/40 rounded-2xl border border-emerald-100 transition-all opacity-80"
                      >
                        <div
                          onClick={() => toggleShoppingListItem(item.id)}
                          className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                        >
                          <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
                          <div className="min-w-0">
                            <span className="text-xs font-semibold text-emerald-900 line-through truncate block">
                              {item.name}
                            </span>
                            {item.recipeTitle && (
                              <span className="text-[10px] text-emerald-700/80 truncate block">
                                For: {item.recipeTitle}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => moveShoppingItemToPantry(item.id)}
                            title="Move to My Kitchen"
                            className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Check size={11} /> Move to Kitchen
                          </button>
                          <button
                            onClick={() => removeShoppingListItem(item.id)}
                            className="p-1.5 text-[#A3A3A3] hover:text-red-500 cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#171717]/5 bg-[#FFFDF9] flex justify-between items-center">
          <span className="text-[11px] text-[#737373]">
            {pendingItems.length === 0 && shoppingList.length > 0
              ? 'All items acquired! Ready to cook.'
              : `${pendingItems.length} items remaining`}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#171717] hover:bg-black text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
