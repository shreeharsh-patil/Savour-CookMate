import { Module, OnApplicationBootstrap } from "@nestjs/common";
import { MongooseModule, InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ENV } from "./config/env.config";
import { DatabaseModule } from "./database/database.module";
import { Recipe, RecipeDocument } from "./database/schemas/recipe.schema";
import { Ingredient, IngredientDocument } from "./database/schemas/ingredient.schema";
import { seedDatabaseIfEmpty } from "./database/seed";

import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { RecipesModule } from "./modules/recipes/recipes.module";
import { IngredientsModule } from "./modules/ingredients/ingredients.module";
import { PantryModule } from "./modules/pantry/pantry.module";
import { SearchModule } from "./modules/search/search.module";
import { RecommendationsModule } from "./modules/recommendations/recommendations.module";
import { FavoritesModule } from "./modules/favorites/favorites.module";
import { ShoppingModule } from "./modules/shopping/shopping.module";
import { HistoryModule } from "./modules/history/history.module";
import { YouTubeModule } from "./modules/youtube/youtube.module";
import { GeminiModule } from "./modules/gemini/gemini.module";
import { MonitoringModule } from "./common/monitoring/monitoring.module";

@Module({
  imports: [
    MonitoringModule,
    MongooseModule.forRoot(ENV.MONGODB_URI, {
      retryAttempts: 2,
      retryDelay: 1000,
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    RecipesModule,
    IngredientsModule,
    PantryModule,
    SearchModule,
    RecommendationsModule,
    FavoritesModule,
    ShoppingModule,
    HistoryModule,
    YouTubeModule,
    GeminiModule,
  ],
})
export class AppModule implements OnApplicationBootstrap {
  constructor(
    @InjectModel(Recipe.name) private recipeModel: Model<RecipeDocument>,
    @InjectModel(Ingredient.name) private ingredientModel: Model<IngredientDocument>
  ) {}

  async onApplicationBootstrap() {
    await seedDatabaseIfEmpty(this.recipeModel, this.ingredientModel);
  }
}
