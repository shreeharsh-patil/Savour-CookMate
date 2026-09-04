import { Controller, Get, Post, Body, UseGuards } from "@nestjs/common";
import { RecommendationsService } from "./recommendations.service";
import { FirebaseAuthGuard, AuthenticatedUser } from "../../common/guards/firebase-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@Controller("api/v1/recommendations")
@UseGuards(FirebaseAuthGuard)
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Get()
  async getRecommendations(@CurrentUser() user: AuthenticatedUser) {
    return this.recommendationsService.getRecommendations(user.userId);
  }

  @Post("event")
  async recordEvent(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { recipeId: string; eventType: string }
  ) {
    return this.recommendationsService.recordEvent(
      user.userId,
      body.recipeId,
      body.eventType
    );
  }
}
