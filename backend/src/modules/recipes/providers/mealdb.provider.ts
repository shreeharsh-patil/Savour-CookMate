import { Injectable, Logger } from "@nestjs/common";
import {
  RecipeProvider,
  NormalizedRecipe,
  NormalizedIngredientItem,
  NormalizedStepItem,
} from "./recipe-provider.interface";
import { extractYouTubeVideoId } from "../../youtube/youtube.utils";

@Injectable()
export class MealDbRecipeProvider implements RecipeProvider {
  public readonly providerName = "themealdb";
  private readonly logger = new Logger("MealDbRecipeProvider");
  private readonly BASE_URL = "https://www.themealdb.com/api/json/v1/1";
  private readonly TIMEOUT_MS = 8000;

  private async fetchWithTimeout<T>(endpoint: string): Promise<T | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

    try {
      const res = await fetch(`${this.BASE_URL}${endpoint}`, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });
      clearTimeout(timeout);

      if (!res.ok) {
        this.logger.warn(`MealDB returned status ${res.status} for ${endpoint}`);
        return null;
      }
      return (await res.json()) as T;
    } catch (err: any) {
      clearTimeout(timeout);
      this.logger.warn(`MealDB request failed for ${endpoint}: ${err.message}`);
      return null;
    }
  }

  public normalizeMeal(meal: any): NormalizedRecipe {
    const ingredients: NormalizedIngredientItem[] = [];

    for (let i = 1; i <= 20; i++) {
      const rawName = meal[`strIngredient${i}`];
      const rawMeasure = meal[`strMeasure${i}`];

      if (rawName && typeof rawName === "string" && rawName.trim()) {
        const cleanName = rawName.trim();
        const measure = rawMeasure && typeof rawMeasure === "string" ? rawMeasure.trim() : "1 unit";

        // Extract unit vs quantity from measure
        const measureMatch = measure.match(/^([\d\/\.\s\-\u00BC-\u00BE\u2150-\u215E]+)?\s*(.*)$/);
        const quantity = measureMatch && measureMatch[1] ? measureMatch[1].trim() : "1";
        const unit = measureMatch && measureMatch[2] ? measureMatch[2].trim() : "unit";

        ingredients.push({
          name: cleanName,
          normalizedName: cleanName.toLowerCase().trim(),
          quantity,
          unit: unit || "unit",
          optional: false,
          category: "Pantry",
        });
      }
    }

    const rawInstructions: string = meal.strInstructions || "";
    const instructionLines = rawInstructions
      .split(/\r\n|\n|\r/)
      .map((line) => line.trim())
      .filter((line) => line.length > 5 && !/^step\s*\d+$/i.test(line));

    const steps: NormalizedStepItem[] = instructionLines.map((line, idx) => {
      // Estimate timer if line mentions e.g. "cook for 15 minutes"
      const timerMatch = line.match(/(\d+)\s*(?:minutes?|mins?)/i);
      const timerMinutes = timerMatch ? parseInt(timerMatch[1], 10) : 0;

      return {
        stepNumber: idx + 1,
        instruction: line,
        timerMinutes: Math.min(120, timerMinutes),
      };
    });

    const category = meal.strCategory || "Miscellaneous";
    const cuisine = meal.strArea || "International";
    const dietaryTags: string[] = [];

    const lowerCat = category.toLowerCase();
    if (lowerCat.includes("vegan")) {
      dietaryTags.push("Vegan", "Vegetarian");
    } else if (lowerCat.includes("vegetarian")) {
      dietaryTags.push("Vegetarian");
    } else if (
      lowerCat.includes("chicken") ||
      lowerCat.includes("beef") ||
      lowerCat.includes("pork") ||
      lowerCat.includes("lamb") ||
      lowerCat.includes("seafood") ||
      lowerCat.includes("goat")
    ) {
      dietaryTags.push("Non-Vegetarian");
    }

    const slug = `${meal.strMeal.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${meal.idMeal}`;

    const rawYoutube = typeof meal.strYoutube === "string" && meal.strYoutube.trim() ? meal.strYoutube.trim() : undefined;
    const youtubeVideoId = extractYouTubeVideoId(rawYoutube) || undefined;
    const rawSource = typeof meal.strSource === "string" && meal.strSource.trim() ? meal.strSource.trim() : undefined;

    return {
      externalId: meal.idMeal,
      provider: this.providerName,
      name: meal.strMeal,
      slug,
      description: `${cuisine} style ${category.toLowerCase()} dish: ${meal.strMeal}`,
      imageUrl: meal.strMealThumb || "",
      thumbnailUrl: meal.strMealThumb ? `${meal.strMealThumb}/preview` : "",
      category,
      cuisine,
      ingredients,
      instructions: instructionLines,
      steps,
      youtubeSearchQuery: rawYoutube ? undefined : `${meal.strMeal} recipe tutorial`,
      youtubeUrl: rawYoutube,
      youtubeVideoId,
      sourceUrl: rawSource,
      prepTime: 15,
      cookTime: 25,
      totalTime: 40,
      servings: 4,
      dietaryTags,
      difficulty: "Medium",
      searchKeywords: [meal.strMeal, category, cuisine, ...ingredients.map((i) => i.name)],
      lastSyncedAt: new Date(),
    };
  }

  async searchRecipes(query: string): Promise<NormalizedRecipe[]> {
    if (!query || !query.trim()) return [];
    const data = await this.fetchWithTimeout<{ meals: any[] }>(`/search.php?s=${encodeURIComponent(query.trim())}`);
    if (!data || !Array.isArray(data.meals)) return [];
    return data.meals.map((m) => this.normalizeMeal(m));
  }

  async getRecipe(id: string): Promise<NormalizedRecipe | null> {
    if (!id || !id.trim()) return null;
    const data = await this.fetchWithTimeout<{ meals: any[] }>(`/lookup.php?i=${encodeURIComponent(id.trim())}`);
    if (!data || !Array.isArray(data.meals) || data.meals.length === 0) return null;
    return this.normalizeMeal(data.meals[0]);
  }

  async getCategories(): Promise<string[]> {
    const data = await this.fetchWithTimeout<{ categories: Array<{ strCategory: string }> }>("/categories.php");
    if (!data || !Array.isArray(data.categories)) return [];
    return data.categories.map((c) => c.strCategory);
  }

  async getCuisines(): Promise<string[]> {
    const data = await this.fetchWithTimeout<{ meals: Array<{ strArea: string }> }>("/list.php?a=list");
    if (!data || !Array.isArray(data.meals)) return [];
    return data.meals.map((m) => m.strArea).filter(Boolean);
  }

  async getIngredients(): Promise<string[]> {
    const data = await this.fetchWithTimeout<{ meals: Array<{ strIngredient: string }> }>("/list.php?i=list");
    if (!data || !Array.isArray(data.meals)) return [];
    return data.meals.map((m) => m.strIngredient).filter(Boolean);
  }

  async getByCategory(category: string): Promise<NormalizedRecipe[]> {
    if (!category) return [];
    const data = await this.fetchWithTimeout<{ meals: Array<{ idMeal: string; strMeal: string; strMealThumb: string }> }>(
      `/filter.php?c=${encodeURIComponent(category.trim())}`
    );
    if (!data || !Array.isArray(data.meals)) return [];

    // Filter endpoints return minimal data (idMeal, strMeal, strMealThumb).
    // Convert to shallow normalized recipe or fetch full details on request
    return data.meals.slice(0, 20).map((m) => {
      const slug = `${m.strMeal.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${m.idMeal}`;
      return {
        externalId: m.idMeal,
        provider: this.providerName,
        name: m.strMeal,
        slug,
        description: `${category} dish: ${m.strMeal}`,
        imageUrl: m.strMealThumb,
        thumbnailUrl: m.strMealThumb ? `${m.strMealThumb}/preview` : "",
        category,
        cuisine: "International",
        ingredients: [],
        instructions: [],
        steps: [],
        totalTime: 30,
        prepTime: 10,
        cookTime: 20,
        servings: 2,
        dietaryTags: [],
        difficulty: "Medium",
        searchKeywords: [m.strMeal, category],
        lastSyncedAt: new Date(),
      };
    });
  }

  async getByCuisine(cuisine: string): Promise<NormalizedRecipe[]> {
    if (!cuisine) return [];
    const data = await this.fetchWithTimeout<{ meals: Array<{ idMeal: string; strMeal: string; strMealThumb: string }> }>(
      `/filter.php?a=${encodeURIComponent(cuisine.trim())}`
    );
    if (!data || !Array.isArray(data.meals)) return [];

    return data.meals.slice(0, 20).map((m) => {
      const slug = `${m.strMeal.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${m.idMeal}`;
      return {
        externalId: m.idMeal,
        provider: this.providerName,
        name: m.strMeal,
        slug,
        description: `${cuisine} dish: ${m.strMeal}`,
        imageUrl: m.strMealThumb,
        thumbnailUrl: m.strMealThumb ? `${m.strMealThumb}/preview` : "",
        category: "Main Course",
        cuisine,
        ingredients: [],
        instructions: [],
        steps: [],
        totalTime: 30,
        prepTime: 10,
        cookTime: 20,
        servings: 2,
        dietaryTags: [],
        difficulty: "Medium",
        searchKeywords: [m.strMeal, cuisine],
        lastSyncedAt: new Date(),
      };
    });
  }

  async getByIngredient(ingredient: string): Promise<NormalizedRecipe[]> {
    if (!ingredient) return [];
    const data = await this.fetchWithTimeout<{ meals: Array<{ idMeal: string; strMeal: string; strMealThumb: string }> }>(
      `/filter.php?i=${encodeURIComponent(ingredient.trim().toLowerCase())}`
    );
    if (!data || !Array.isArray(data.meals)) return [];

    return data.meals.slice(0, 20).map((m) => {
      const slug = `${m.strMeal.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${m.idMeal}`;
      return {
        externalId: m.idMeal,
        provider: this.providerName,
        name: m.strMeal,
        slug,
        description: `Dish featuring ${ingredient}: ${m.strMeal}`,
        imageUrl: m.strMealThumb,
        thumbnailUrl: m.strMealThumb ? `${m.strMealThumb}/preview` : "",
        category: "Main Course",
        cuisine: "International",
        ingredients: [{ name: ingredient, normalizedName: ingredient.toLowerCase(), quantity: "1", unit: "portion" }],
        instructions: [],
        steps: [],
        totalTime: 30,
        prepTime: 10,
        cookTime: 20,
        servings: 2,
        dietaryTags: [],
        difficulty: "Medium",
        searchKeywords: [m.strMeal, ingredient],
        lastSyncedAt: new Date(),
      };
    });
  }
}
