import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../database/database.module";
import { GeminiService } from "./gemini.service";
import { GeminiController } from "./gemini.controller";
import { IngredientsModule } from "../ingredients/ingredients.module";
import { RecipesModule } from "../recipes/recipes.module";
import { FirebaseAuthGuard } from "../../common/guards/firebase-auth.guard";

@Module({
  imports: [DatabaseModule, IngredientsModule, RecipesModule],
  controllers: [GeminiController],
  providers: [GeminiService, FirebaseAuthGuard],
  exports: [GeminiService],
})
export class GeminiModule {}
