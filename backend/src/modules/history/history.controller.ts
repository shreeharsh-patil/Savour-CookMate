import { Controller, Get, Post, Query, Body, UseGuards } from "@nestjs/common";
import { HistoryService } from "./history.service";
import { FirebaseAuthGuard, AuthenticatedUser } from "../../common/guards/firebase-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@Controller("api/v1/history")
@UseGuards(FirebaseAuthGuard)
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get()
  async getHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Query("limit") limit?: number
  ) {
    return this.historyService.getHistory(user.userId, limit ? Number(limit) : 20);
  }

  @Post()
  async recordCookingSession(
    @CurrentUser() user: AuthenticatedUser,
    @Body()
    body: {
      recipeId: string;
      recipeName: string;
      recipeImage: string;
      durationMinutes?: number;
      rating?: number;
      notes?: string;
    }
  ) {
    return this.historyService.recordSession(
      user.userId,
      body.recipeId,
      body.recipeName,
      body.recipeImage,
      body.durationMinutes,
      body.rating,
      body.notes
    );
  }
}
