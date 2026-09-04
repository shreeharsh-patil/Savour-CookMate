import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { User, UserSchema } from "./schemas/user.schema";
import { UserPreferences, UserPreferencesSchema } from "./schemas/user-preferences.schema";
import { Recipe, RecipeSchema } from "./schemas/recipe.schema";
import { Ingredient, IngredientSchema } from "./schemas/ingredient.schema";
import { PantryItem, PantryItemSchema } from "./schemas/pantry-item.schema";
import { Favorite, FavoriteSchema } from "./schemas/favorite.schema";
import { ShoppingItem, ShoppingItemSchema } from "./schemas/shopping-item.schema";
import { CookingHistory, CookingHistorySchema } from "./schemas/cooking-history.schema";
import { Review, ReviewSchema } from "./schemas/review.schema";
import { RecommendationEvent, RecommendationEventSchema } from "./schemas/recommendation-event.schema";
import { YouTubeCache, YouTubeCacheSchema } from "./schemas/youtube-cache.schema";
import { AICache, AICacheSchema } from "./schemas/ai-cache.schema";
import { SearchHistory, SearchHistorySchema } from "./schemas/search-history.schema";

const featureModels = [
  { name: User.name, schema: UserSchema },
  { name: UserPreferences.name, schema: UserPreferencesSchema },
  { name: Recipe.name, schema: RecipeSchema },
  { name: Ingredient.name, schema: IngredientSchema },
  { name: PantryItem.name, schema: PantryItemSchema },
  { name: Favorite.name, schema: FavoriteSchema },
  { name: ShoppingItem.name, schema: ShoppingItemSchema },
  { name: CookingHistory.name, schema: CookingHistorySchema },
  { name: Review.name, schema: ReviewSchema },
  { name: RecommendationEvent.name, schema: RecommendationEventSchema },
  { name: YouTubeCache.name, schema: YouTubeCacheSchema },
  { name: AICache.name, schema: AICacheSchema },
  { name: SearchHistory.name, schema: SearchHistorySchema },
];

@Module({
  imports: [MongooseModule.forFeature(featureModels)],
  exports: [MongooseModule.forFeature(featureModels)],
})
export class DatabaseModule {}
