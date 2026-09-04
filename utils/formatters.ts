/**
 * Utility formatters for Savour CookMate
 */

export function formatCookTime(minutes: number): string {
  if (!minutes || minutes <= 0) return '15 mins';
  if (minutes >= 60) {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  }
  return `${minutes} mins`;
}

export function formatRating(rating?: number): string {
  if (!rating || isNaN(rating)) return '4.8';
  return rating.toFixed(1);
}

export function formatCalories(calories?: number): string {
  if (!calories || isNaN(calories)) return '450 kcal';
  return `${calories} kcal`;
}

export function formatViewCount(count?: number): string {
  if (!count) return '250K views';
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, '')}M views`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(0)}K views`;
  }
  return `${count} views`;
}

/**
 * Calculates adjusted ingredient amount when servings are changed.
 */
export function scaleIngredientQuantity(
  originalQuantity: string,
  baseServings: number,
  targetServings: number
): string {
  if (!originalQuantity || baseServings <= 0 || targetServings <= 0 || baseServings === targetServings) {
    return originalQuantity;
  }

  const factor = targetServings / baseServings;

  // Check if starts with a number or fraction
  const numMatch = originalQuantity.match(/^(\d+(?:\.\d+)?|\d+\/\d+)/);
  if (!numMatch) return originalQuantity;

  let originalNum = parseFloat(numMatch[1]);
  if (numMatch[1].includes('/')) {
    const [num, den] = numMatch[1].split('/').map(Number);
    if (den) originalNum = num / den;
  }

  const scaled = originalNum * factor;
  const rounded = scaled >= 10 ? Math.round(scaled) : Math.round(scaled * 10) / 10;
  return originalQuantity.replace(numMatch[1], String(rounded));
}
