import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../database/database.module";
import { RecipesService } from "./recipes.service";
import { RecipesController } from "./recipes.controller";
import { CategoriesController } from "./categories.controller";
import { CuisinesController } from "./cuisines.controller";
import { MealDbRecipeProvider } from "./providers/mealdb.provider";
import { FirebaseAuthGuard } from "../../common/guards/firebase-auth.guard";

@Module({
  imports: [DatabaseModule],
  controllers: [RecipesController, CategoriesController, CuisinesController],
  providers: [RecipesService, MealDbRecipeProvider, FirebaseAuthGuard],
  exports: [RecipesService, MealDbRecipeProvider],
})
export class RecipesModule {}
