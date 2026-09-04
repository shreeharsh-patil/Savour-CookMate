import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { NutritionService } from "./nutrition.service";
import { FirebaseAuthGuard, Public } from "../../common/guards/firebase-auth.guard";

@Controller("api/v1/nutrition")
@UseGuards(FirebaseAuthGuard)
export class NutritionController {
  constructor(private readonly nutritionService: NutritionService) {}

  @Public()
  @Get("ingredient/:name")
  async getIngredientNutrition(@Param("name") name: string) {
    const data = await this.nutritionService.getIngredientNutrition(name);
    return { data };
  }

  @Public()
  @Get("recipe/:id")
  async getRecipeNutrition(@Param("id") id: string) {
    const data = await this.nutritionService.estimateRecipeNutrition(id);
    return { data };
  }
}
