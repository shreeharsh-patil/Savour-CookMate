import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
} from "@nestjs/common";
import { RecipesService } from "./recipes.service";
import { FirebaseAuthGuard, Public, AuthenticatedUser } from "../../common/guards/firebase-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@Controller("api/v1/recipes")
@UseGuards(FirebaseAuthGuard)
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Public()
  @Get()
  async getRecipes(
    @Query("cuisine") cuisine?: string,
    @Query("mealType") mealType?: string,
    @Query("diet") diet?: string,
    @Query("difficulty") difficulty?: string,
    @Query("maxTime") maxTime?: number,
    @Query("search") search?: string,
    @Query("sort") sort?: "popular" | "rating" | "time" | "newest",
    @Query("page") page?: number,
    @Query("limit") limit?: number
  ) {
    return this.recipesService.findAll({
      cuisine,
      mealType,
      diet,
      difficulty,
      maxTime: maxTime ? Number(maxTime) : undefined,
      search,
      sort,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Public()
  @Get("search")
  async searchRecipes(@Query("q") query: string, @Query("limit") limit?: number) {
    const recipes = await this.recipesService.searchRecipes(query, limit ? Number(limit) : 20);
    return { recipes, total: recipes.length };
  }

  @Public()
  @Get("home-feed")
  async getHomeFeed() {
    return this.recipesService.getHomeFeed();
  }

  @Public()
  @Get("category/:category")
  async getByCategory(@Param("category") category: string, @Query("limit") limit?: number) {
    const recipes = await this.recipesService.getByCategory(category, limit ? Number(limit) : 20);
    return { category, recipes };
  }

  @Public()
  @Get("cuisine/:area")
  async getByCuisine(@Param("area") area: string, @Query("limit") limit?: number) {
    const recipes = await this.recipesService.getByCuisine(area, limit ? Number(limit) : 20);
    return { cuisine: area, recipes };
  }

  @Public()
  @Get(":id")
  async getRecipeDetail(@Param("id") id: string) {
    return this.recipesService.findById(id);
  }

  @Post(":id/rate")
  async rateRecipe(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body()
    body: {
      rating: number;
      comment?: string;
      difficultyFeedback?: string;
      wouldCookAgain?: boolean;
    }
  ) {
    return this.recipesService.rateRecipe(
      id,
      user.userId,
      body.rating,
      body.comment,
      user.displayName,
      body.difficultyFeedback,
      body.wouldCookAgain
    );
  }

  @Post(":id/cook")
  async recordCook(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { durationMinutes?: number; notes?: string }
  ) {
    return this.recipesService.recordCook(
      id,
      user.userId,
      body.durationMinutes,
      body.notes
    );
  }

  // Admin / Content Quality Workflows
  @Patch(":id/status")
  async updateRecipeStatus(
    @Param("id") id: string,
    @Body() body: { status: "draft" | "review" | "published" | "rejected" }
  ) {
    return this.recipesService.updateStatus(id, body.status);
  }

  @Patch(":id")
  async updateRecipeDetails(
    @Param("id") id: string,
    @Body() updates: any
  ) {
    return this.recipesService.updateRecipe(id, updates);
  }
}
