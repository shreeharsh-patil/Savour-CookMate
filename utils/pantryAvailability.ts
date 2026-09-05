import { Ingredient, PantryItem, IngredientAvailability } from '../types';

/**
 * Computes the real availability state of an ingredient against pantry items.
 *
 * States:
 * - ENOUGH: Ingredient exists in pantry with sufficient recorded quantity
 * - PARTIAL: Ingredient exists in pantry but recorded quantity is less than required
 * - UNKNOWN_QUANTITY: Ingredient is in pantry or pantryNames set, but either required or pantry quantity is unquantified
 * - MISSING: Ingredient is not in pantry at all
 */
export function computeAvailability(
  ing: Ingredient,
  scaledQty: string,
  pantryItems: PantryItem[] = [],
  pantryNames: Set<string> = new Set()
): { status: IngredientAvailability; label: string } {
  const name = (ing.name || ing.item || '').toLowerCase().trim();
  const norm = (ing.normalizedName || '').toLowerCase().trim();

  // Find matching pantry item
  const matchedPantry = pantryItems.find((p) => {
    const pName = (p.name || '').toLowerCase().trim();
    return pName === name || pName === norm || (norm && pName.includes(norm)) || (name && pName.includes(name));
  });

  const isInPantry = Boolean(matchedPantry) || pantryNames.has(name) || (Boolean(norm) && pantryNames.has(norm));

  if (!isInPantry) {
    return { status: 'MISSING', label: '+ Add' };
  }

  const reqQtyStr = scaledQty || ing.quantity || ing.amount || '';
  const pQtyStr = matchedPantry?.quantity || '';

  if (!reqQtyStr || !pQtyStr) {
    return { status: 'UNKNOWN_QUANTITY', label: 'In Kitchen' };
  }

  const reqNum = parseFloat(reqQtyStr);
  const pNum = parseFloat(pQtyStr);

  if (isNaN(reqNum) || isNaN(pNum)) {
    return { status: 'UNKNOWN_QUANTITY', label: 'In Kitchen' };
  }

  if (pNum >= reqNum) {
    return { status: 'ENOUGH', label: 'In Kitchen' };
  }

  return { status: 'PARTIAL', label: 'Partial' };
}
