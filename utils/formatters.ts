/**
 * Utility formatters for Yummy Tummy
 */

export function formatCookTime(minutes?: number | null): string | null {
  if (!minutes || isNaN(minutes) || minutes <= 0) return null;
  if (minutes >= 60) {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  }
  return `${minutes} mins`;
}

export function formatRating(rating?: number | null): string | null {
  if (rating === null || rating === undefined || isNaN(rating) || rating <= 0) {
    return null;
  }
  return rating.toFixed(1);
}

export function formatCalories(calories?: number): string | null {
  if (!calories || isNaN(calories) || calories <= 0) return null;
  return `${calories} kcal`;
}

export function formatViewCount(count?: number): string | null {
  if (!count || count <= 0) return null;
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

  // Match mixed fractions ("1 1/2", "1-1/2"), simple fractions ("1/2"), decimals ("1.5"), or integers ("2")
  // Fraction branches MUST precede the bare integer branch to prevent matching "1" out of "1/2"
  const numMatch = originalQuantity.match(/^(\d+\s*[- ]\s*\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?)/);
  if (!numMatch) return originalQuantity;

  const matchedStr = numMatch[1].trim();
  let originalNum = 0;

  if (matchedStr.includes('/')) {
    const parts = matchedStr.split(/[\s-]+/);
    if (parts.length === 2) {
      // Mixed fraction: e.g. "1 1/2" or "1-1/2"
      const whole = parseFloat(parts[0]) || 0;
      const [num, den] = parts[1].split('/').map(Number);
      originalNum = whole + (den ? num / den : 0);
    } else {
      // Simple fraction: e.g. "1/2"
      const [num, den] = parts[0].split('/').map(Number);
      originalNum = den ? num / den : 0;
    }
  } else {
    originalNum = parseFloat(matchedStr);
  }

  if (isNaN(originalNum) || originalNum <= 0) return originalQuantity;

  const scaled = originalNum * factor;
  const rounded = scaled >= 10 ? Math.round(scaled) : Math.round(scaled * 10) / 10;
  return originalQuantity.replace(numMatch[1], String(rounded));
}
