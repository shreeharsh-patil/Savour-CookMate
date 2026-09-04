import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../database/database.module";
import { PantryService } from "./pantry.service";
import { PantryController } from "./pantry.controller";
import { IngredientsModule } from "../ingredients/ingredients.module";
import { GeminiModule } from "../gemini/gemini.module";
import { FirebaseAuthGuard } from "../../common/guards/firebase-auth.guard";

@Module({
  imports: [DatabaseModule, IngredientsModule, GeminiModule],
  controllers: [PantryController],
  providers: [PantryService, FirebaseAuthGuard],
  exports: [PantryService],
})
export class PantryModule {}
