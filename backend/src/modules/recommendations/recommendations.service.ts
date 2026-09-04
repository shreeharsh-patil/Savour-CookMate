import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Recipe, RecipeDocument } from "../../database/schemas/recipe.schema";
import { PantryItem, PantryItemDocument } from "../../database/schemas/pantry-item.schema";
import { UserPreferences, UserPreferencesDocument } from "../../database/schemas/user-preferences.schema";
import { CookingHistory, CookingHistoryDocument } from "../../database/schemas/cooking-history.schema";
import { RecommendationEvent, RecommendationEventDocument } from "../../database/schemas/recommendation-event.schema";

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
    @InjectModel(RecommendationEvent.name) private eventModel: Model<RecommendationEventDocument>
  ) {}

  async getRecommendations(userId: string) {
    // 1. Fetch user pantry items
    const pantry = await this.pantryModel.find({ userId }).lean();
    const pantryNormalized = new Set(pantry.map((p) => p.normalizedName.toLowerCase()));

    // 2. Fetch user preferences
    const preferences = (await this.prefModel.findOne({ userId }).lean()) || {
      diet: "all",
      favoriteCuisines: [],
      maximumCookingTime: 45,
      cookingSkill: "beginner",
    };

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

    // 4. Fetch all active recipes
    const recipes = await this.recipeModel.find({ status: "published" }).lean();

    const scoredItems: RecommendationGroupItem[] = [];

    for (const recipe of recipes) {
      const required = recipe.ingredients.filter((i) => !i.optional);
      const totalRequired = required.length || 1;

      const matched: string[] = [];
      const missing: string[] = [];

      for (const ing of required) {
        const ingNorm = ing.normalizedName.toLowerCase();
        let found = false;
        for (const p of pantryNormalized) {
          if (p.includes(ingNorm) || ingNorm.includes(p)) {
            found = true;
            break;
          }
        }
        if (found) {
          matched.push(ing.name);
        } else {
          missing.push(ing.name);
        }
      }

      // Deterministic calculation
      const ingredientMatchFraction = matched.length / totalRequired;
      const ingredientMatchPercent = Math.round(ingredientMatchFraction * 100);

      // Scoring Breakdown:
      // 1. Ingredient Match: 40%
      const matchScore = ingredientMatchFraction * 40;

      // 2. User Preferences (Cuisine & Skill): 20%
      let prefScore = 0;
      if (preferences.favoriteCuisines?.some((c) => c.toLowerCase() === recipe.cuisine.toLowerCase())) {
        prefScore += 15;
      }
      if (recipe.difficulty?.toLowerCase() === preferences.cookingSkill?.toLowerCase()) {
        prefScore += 5;
      }

      // 3. Cooking Time: 15%
      let timeScore = 0;
      const maxTime = preferences.maximumCookingTime || 45;
      if (recipe.totalTime <= maxTime) {
        timeScore = 15;
      } else if (recipe.totalTime <= maxTime + 15) {
        timeScore = 8;
      }

      // 4. Diet Compatibility: 10%
      let dietScore = 10;
      const userDiet = preferences.diet?.toLowerCase();
      if (userDiet && userDiet !== "all") {
        const recipeTags = recipe.dietaryTags?.map((d) => d.toLowerCase()) || [];
        if (!recipeTags.includes(userDiet)) {
          dietScore = 0;
        }
      }

      // 5. Cooking History: 10%
      let historyScore = 0;
      if (cookedCuisineCounts[recipe.cuisine]) {
        historyScore = Math.min(10, cookedCuisineCounts[recipe.cuisine] * 3);
      }

      // 6. Popularity: 5%
      const popularityScore = Math.min(5, (recipe.cookCount || 0) * 0.1);

      const overallScore = Math.round(
        matchScore + prefScore + timeScore + dietScore + historyScore + popularityScore
      );

      // Build human explanation
      let explanation = "";
      if (missing.length === 0) {
        explanation = "You have all required ingredients in your kitchen.";
      } else if (missing.length === 1) {
        explanation = `You have ${matched.length} of ${totalRequired} ingredients. Only missing ${missing[0]}.`;
      } else if (ingredientMatchPercent >= 60) {
        explanation = `Strong match using your pantry staples. Fits your ${recipe.cuisine} preference.`;
      } else {
        explanation = `Matches your preference for ${recipe.totalTime}-min ${recipe.cuisine} dishes.`;
      }

      scoredItems.push({
        recipe,
        matchPercentage: ingredientMatchPercent,
        matchedIngredients: matched,
        missingIngredients: missing,
        overallScore,
        explanation,
      });
    }

    // Sort by overallScore descending
    scoredItems.sort((a, b) => b.overallScore - a.overallScore);

    // Grouping according to prompt specifications
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
      makeNow: makeNow.slice(0, 8),
      almostThere: almostThere.slice(0, 8),
      goodMatch: goodMatch.slice(0, 8),
      worthShoppingFor: worthShoppingFor.slice(0, 8),
      topRecommendations: scoredItems.slice(0, 10),
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
