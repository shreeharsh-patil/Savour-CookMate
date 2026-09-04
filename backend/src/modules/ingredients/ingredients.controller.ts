import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { IngredientsService } from "./ingredients.service";
import { FirebaseAuthGuard, Public } from "../../common/guards/firebase-auth.guard";

@Controller("api/v1/ingredients")
@UseGuards(FirebaseAuthGuard)
export class IngredientsController {
  constructor(private readonly ingredientsService: IngredientsService) {}

  @Public()
  @Get()
  async getIngredients(@Query("q") query?: string, @Query("limit") limit?: number) {
    return this.ingredientsService.search(query || "", limit ? Number(limit) : 20);
  }
}
