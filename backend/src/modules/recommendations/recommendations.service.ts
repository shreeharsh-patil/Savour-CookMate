import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Recipe, RecipeDocument } from "../../database/schemas/recipe.schema";
import { PantryItem, PantryItemDocument } from "../../database/schemas/pantry-item.schema";
import { UserPreferences, UserPreferencesDocument } from "../../database/schemas/user-preferences.schema";
import { CookingHistory, CookingHistoryDocument } from "../../database/schemas/cooking-history.schema";
import { RecommendationEvent, RecommendationEventDocument } from "../../database/schemas/recommendation-event.schema";
import { IngredientsService } from "../ingredients/ingredients.service";

export interface RecommendationGroupItem {
  recipe: any;
  matchPercentage: number;
  matchedIngredients: string[];
  missingIngredients: string[];
  overallScore: number;
  explanation: string;
}

@Injectable()
export class RecommendationsService {
  constructor(
    @InjectModel(Recipe.name) private recipeModel: Model<RecipeDocument>,
    @InjectModel(PantryItem.name) private pantryModel: Model<PantryItemDocument>,
    @InjectModel(UserPreferences.name) private prefModel: Model<UserPreferencesDocument>,
    @InjectModel(CookingHistory.name) private historyModel: Model<CookingHistoryDocument>,
    @InjectModel(RecommendationEvent.name) private eventModel: Model<RecommendationEventDocument>,
    private ingredientsService: IngredientsService
  ) {}

  async getRecommendations(userId: string) {
    // 1. Fetch user pantry items (excluding expired items)
    const now = new Date();
    const pantry = await this.pantryModel
      .find({
        userId,
        $or: [
          { expiryDate: { $exists: false } },
          { expiryDate: null },
          { expiryDate: { $gte: now } },
        ],
      })
      .lean();
    const pantryItemNames = pantry.map((p) => p.name || p.normalizedName);

    // 2. Fetch user preferences
    const preferences = (await this.prefModel.findOne({ userId }).lean()) || {
      diet: "all",
      allergies: [],
      favoriteCuisines: [],
      maximumCookingTime: 45,
      cookingSkill: "beginner",
    };

    const userAllergies = (preferences.allergies || []).map((a: string) => a.toLowerCase().trim());
    const rawDiet = preferences.diet || (Array.isArray((preferences as any).dietaryRestrictions) ? (preferences as any).dietaryRestrictions.join(" ") : "");
    const userDiet = (rawDiet || "").toLowerCase();

    // 3. Fetch user cooking history to compute cuisine affinity
    const recentHistory = await this.historyModel
      .find({ userId })
      .sort({ cookedAt: -1 })
      .limit(20)
      .lean();

    const cookedCuisineCounts: Record<string, number> = {};
    for (const h of recentHistory) {
      if (h.recipeName) {
        cookedCuisineCounts[h.recipeName] = (cookedCuisineCounts[h.recipeName] || 0) + 1;
      }
    }

    // 4. Fetch all published recipes
    const recipes = await this.recipeModel.find({ status: "published" }).lean();

    const scoredItems: RecommendationGroupItem[] = [];

    for (const recipe of recipes) {
      // STRICT SAFETY FILTER 1: Allergies
      if (userAllergies.length > 0) {
        const recipeAllergens = (recipe.allergens || []).map((a: string) => a.toLowerCase());
        const hasDirectAllergen = userAllergies.some((userAllergy) =>
          recipeAllergens.some((ra) => ra.includes(userAllergy) || userAllergy.includes(ra))
        );
        if (hasDirectAllergen) continue; // Never recommend allergen-conflicted recipe

        const hasIngredientAllergen = recipe.ingredients.some((ing) =>
          userAllergies.some((userAllergy) =>
            this.ingredientsService.areIngredientsMatching(ing.name, userAllergy)
          )
        );
        if (hasIngredientAllergen) continue;
      }

      // STRICT SAFETY FILTER 2: Dietary restrictions
      if (userDiet && userDiet !== "all") {
        const recipeTags = recipe.dietaryTags?.map((d) => d.toLowerCase()) || [];
        const isVegUser = userDiet.includes("veg") && !userDiet.includes("non-veg");
        const isVeganUser = userDiet.includes("vegan");

        if (isVeganUser && !recipeTags.includes("vegan")) continue;
        if (isVegUser && !recipeTags.includes("vegetarian") && !recipeTags.includes("vegan")) continue;
      }

      // Calculate ingredient match using canonical aliases
      const required = recipe.ingredients.filter((i) => !i.optional);
      const totalRequired = required.length || 1;

      const matched: string[] = [];
      const missing: string[] = [];

      for (const req of required) {
        const isAvailable = pantryItemNames.some((pantryName) =>
          this.ingredientsService.areIngredientsMatching(pantryName, req.name)
        );

        if (isAvailable) {
          matched.push(req.name);
        } else {
          missing.push(req.name);
        }
      }

      const matchFraction = matched.length / totalRequired;
      const matchPercentage = Math.round(matchFraction * 100);

      // FORMULA WEIGHTS (Prompt Section 5):
      // Ingredient match: 40%
      const ingredientScore = matchFraction * 40;

      // Diet compatibility: 20%
      let dietScore = 20;
      if (userDiet && userDiet !== "all") {
        const recipeTags = recipe.dietaryTags?.map((d) => d.toLowerCase()) || [];
        if (!recipeTags.includes(userDiet)) {
          dietScore = 10;
        }
      }

      // User preferences: 15% (cuisine 10%, skill 5%)
      let prefScore = 0;
      if (preferences.favoriteCuisines?.some((c: string) => c.toLowerCase() === recipe.cuisine.toLowerCase())) {
        prefScore += 10;
      }
      if (recipe.difficulty?.toLowerCase() === preferences.cookingSkill?.toLowerCase()) {
        prefScore += 5;
      }

      // Cooking time: 10%
      let timeScore = 0;
      const maxTime = preferences.maximumCookingTime || 45;
      if (recipe.totalTime <= maxTime) {
        timeScore = 10;
      } else if (recipe.totalTime <= maxTime + 15) {
        timeScore = 5;
      }

      // Previous cooking behavior: 10%
      let historyScore = 0;
      if (cookedCuisineCounts[recipe.cuisine]) {
        historyScore = Math.min(10, cookedCuisineCounts[recipe.cuisine] * 3);
      }

      // Real popularity: 5%
      const popularityScore = Math.min(5, (recipe.cookCount || 0) * 0.1);

      const overallScore = Math.round(
        ingredientScore + dietScore + prefScore + timeScore + historyScore + popularityScore
      );

      // Natural, helpful human explanation
      let explanation = "";
      if (missing.length === 0) {
        explanation = `Great match — you already have all ${totalRequired} required ingredients.`;
      } else if (missing.length === 1) {
        explanation = `Great match — you already have ${matched.length} of the ${totalRequired} required ingredients. Only missing ${missing[0]}.`;
      } else if (matchPercentage >= 60) {
        explanation = `Great match — you already have ${matched.length} of the ${totalRequired} required ingredients.`;
      } else {
        explanation = `Matches your preference for ${recipe.totalTime}-min ${recipe.cuisine} dishes.`;
      }

      scoredItems.push({
        recipe,
        matchPercentage,
        matchedIngredients: matched,
        missingIngredients: missing,
        overallScore,
        explanation,
      });
    }

    // Sort by overallScore descending
    scoredItems.sort((a, b) => b.overallScore - a.overallScore);

    // Grouping
    const makeNow = scoredItems.filter((i) => i.missingIngredients.length === 0);
    const almostThere = scoredItems.filter(
      (i) => i.missingIngredients.length >= 1 && i.missingIngredients.length <= 2
    );
    const goodMatch = scoredItems.filter(
      (i) => i.missingIngredients.length > 2 && i.matchPercentage >= 50
    );
    const worthShoppingFor = scoredItems.filter(
      (i) => i.matchPercentage > 0 && i.matchPercentage < 50
    );

    return {
      makeNow: makeNow.slice(0, 10),
      almostThere: almostThere.slice(0, 10),
      goodMatch: goodMatch.slice(0, 10),
      worthShoppingFor: worthShoppingFor.slice(0, 10),
      topRecommendations: scoredItems.slice(0, 12),
    };
  }

  async recordEvent(userId: string, recipeId: string, eventType: string) {
    return this.eventModel.create({
      userId,
      recipeId,
      eventType,
      timestamp: new Date(),
    });
  }
}
