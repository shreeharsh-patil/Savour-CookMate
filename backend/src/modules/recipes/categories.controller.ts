import { Controller, Get, UseGuards } from "@nestjs/common";
import { RecipesService } from "./recipes.service";
import { FirebaseAuthGuard, Public } from "../../common/guards/firebase-auth.guard";

@Controller("api/v1/categories")
@UseGuards(FirebaseAuthGuard)
export class CategoriesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Public()
  @Get()
  async getCategories() {
    const categories = await this.recipesService.getCategories();
    return { categories, count: categories.length };
  }
}
