import { Controller, Post, Get, Body, Query, UseGuards } from "@nestjs/common";
import { AnalyticsService } from "./analytics.service";
import { FirebaseAuthGuard, Public } from "../../common/guards/firebase-auth.guard";

@Controller("api/v1/analytics")
@UseGuards(FirebaseAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Public()
  @Post("event")
  async recordEvent(
    @Body() body: { recipeId: string; eventType: "view" | "save" | "cook_start" | "cook_complete" }
  ) {
    const score = await this.analyticsService.recordEvent(body.recipeId, body.eventType);
    return { success: true, popularityScore: score };
  }

  @Public()
  @Get("popular")
  async getPopular(@Query("limit") limit?: number) {
    return this.analyticsService.getPopularRecipes(limit ? Number(limit) : 10);
  }
}
