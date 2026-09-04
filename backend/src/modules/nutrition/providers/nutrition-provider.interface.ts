export interface NutrientValues {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface IngredientNutritionResult {
  fdcId?: number;
  ingredientName: string;
  servingReference: string; // e.g. "100g"
  nutrients: NutrientValues;
}

export interface NutritionProvider {
  readonly providerName: string;
  getIngredientNutrition(ingredientName: string): Promise<IngredientNutritionResult | null>;
}
