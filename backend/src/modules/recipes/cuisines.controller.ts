import { Controller, Get, UseGuards } from "@nestjs/common";
import { RecipesService } from "./recipes.service";
import { FirebaseAuthGuard, Public } from "../../common/guards/firebase-auth.guard";

@Controller("api/v1/cuisines")
@UseGuards(FirebaseAuthGuard)
export class CuisinesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Public()
  @Get()
  async getCuisines() {
    const cuisines = await this.recipesService.getCuisines();
    return { cuisines, count: cuisines.length };
  }
}
