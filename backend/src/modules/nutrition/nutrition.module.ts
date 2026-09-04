import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../database/database.module";
import { IngredientsModule } from "../ingredients/ingredients.module";
import { NutritionService } from "./nutrition.service";
import { NutritionController } from "./nutrition.controller";
import { UsdaNutritionProvider } from "./providers/usda.provider";

@Module({
  imports: [DatabaseModule, IngredientsModule],
  controllers: [NutritionController],
  providers: [NutritionService, UsdaNutritionProvider],
  exports: [NutritionService, UsdaNutritionProvider],
})
export class NutritionModule {}
