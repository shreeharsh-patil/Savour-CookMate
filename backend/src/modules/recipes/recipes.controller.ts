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
import { RolesGuard, Roles } from "../../common/guards/roles.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

import { z } from "zod";
import { validateRequest } from "../../common/validation/validate-request";

const RateRecipeSchema = z.object({
  rating: z.number().min(1, "Rating must be between 1 and 5").max(5, "Rating must be between 1 and 5"),
  comment: z.string().max(1000, "Comment cannot exceed 1000 characters").optional(),
  difficultyFeedback: z.enum(["Too Easy", "Just Right", "Too Hard"]).optional(),
  wouldCookAgain: z.boolean().optional(),
});

const RecordCookSchema = z.object({
  durationMinutes: z.number().int().positive().max(720).optional(),
  notes: z.string().max(1000).optional(),
});

const GetRecipesQuerySchema = z.object({
  cuisine: z.string().max(100).optional(),
  mealType: z.string().max(100).optional(),
  diet: z.string().max(100).optional(),
  difficulty: z.string().max(50).optional(),
  maxTime: z.coerce.number().positive().max(720).optional(),
  search: z.string().max(100).optional(),
  sort: z.enum(["popular", "rating", "time", "newest"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

const SearchRecipesQuerySchema = z.object({
  q: z.string().min(1, "Search query cannot be empty").max(100, "Search query cannot exceed 100 characters"),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

@Controller("api/v1/recipes")
@UseGuards(FirebaseAuthGuard)
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Public()
  @Get()
  async getRecipes(
    @Query() rawQuery: any
  ) {
    const validated = validateRequest(GetRecipesQuerySchema, rawQuery);
    return this.recipesService.findAll({
      cuisine: validated.cuisine,
      mealType: validated.mealType,
      diet: validated.diet,
      difficulty: validated.difficulty,
      maxTime: validated.maxTime,
      search: validated.search,
      sort: validated.sort,
      page: validated.page || 1,
      limit: validated.limit || 20,
    });
  }

  @Public()
  @Get("search")
  async searchRecipes(@Query() rawQuery: any) {
    const validated = validateRequest(SearchRecipesQuerySchema, rawQuery);
    const recipes = await this.recipesService.searchRecipes(validated.q, validated.limit || 20);
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
    const safeLimit = Math.min(50, Math.max(1, limit ? Number(limit) : 20));
    const recipes = await this.recipesService.getByCategory(category.slice(0, 100), safeLimit);
    return { category, recipes };
  }

  @Public()
  @Get("cuisine/:area")
  async getByCuisine(@Param("area") area: string, @Query("limit") limit?: number) {
    const safeLimit = Math.min(50, Math.max(1, limit ? Number(limit) : 20));
    const recipes = await this.recipesService.getByCuisine(area.slice(0, 100), safeLimit);
    return { cuisine: area, recipes };
  }

  @Public()
  @Get(":id")
  async getRecipeDetail(@Param("id") id: string) {
    return this.recipesService.findById(id.slice(0, 150));
  }

  @Post(":id/rate")
  async rateRecipe(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() rawBody: unknown
  ) {
    const body = validateRequest(RateRecipeSchema, rawBody);
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
    @Body() rawBody: unknown
  ) {
    const body = validateRequest(RecordCookSchema, rawBody);
    return this.recipesService.recordCook(
      id,
      user.userId,
      body.durationMinutes,
      body.notes
    );
  }

  // Admin / Content Quality Workflows - Restricted strictly to administrators
  @UseGuards(RolesGuard)
  @Roles("admin")
  @Patch(":id/status")
  async updateRecipeStatus(
    @Param("id") id: string,
    @Body() body: { status: "draft" | "review" | "published" | "rejected" }
  ) {
    return this.recipesService.updateStatus(id, body.status);
  }

  @UseGuards(RolesGuard)
  @Roles("admin")
  @Patch(":id")
  async updateRecipeDetails(
    @Param("id") id: string,
    @Body() updates: any
  ) {
    return this.recipesService.updateRecipe(id, updates);
  }
}
