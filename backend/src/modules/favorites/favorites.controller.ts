import { Controller, Get, Post, Param, Query, Body, UseGuards } from "@nestjs/common";
import { FavoritesService } from "./favorites.service";
import { FirebaseAuthGuard, AuthenticatedUser } from "../../common/guards/firebase-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@Controller("api/v1/favorites")
@UseGuards(FirebaseAuthGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  async getFavorites(
    @CurrentUser() user: AuthenticatedUser,
    @Query("collection") collection?: string
  ) {
    return this.favoritesService.getFavorites(user.userId, collection);
  }

  @Post("toggle")
  async toggleFavorite(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { recipeId: string; collectionName?: string }
  ) {
    return this.favoritesService.toggleFavorite(
      user.userId,
      body.recipeId,
      body.collectionName
    );
  }

  @Get("status/:recipeId")
  async checkStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param("recipeId") recipeId: string
  ) {
    return this.favoritesService.isFavorited(user.userId, recipeId);
  }
}
