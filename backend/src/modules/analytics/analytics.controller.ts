import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import { AnalyticsService } from "./analytics.service";
import { FirebaseAuthGuard, Public, AuthenticatedUser } from "../../common/guards/firebase-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

// Anti-spam throttling map: prevents identical event spam for same recipe & user within 5 minutes
const eventDeduplication = new Map<string, number>();
const DEDUP_WINDOW_MS = 5 * 60 * 1000;

function cleanOldDedupEntries() {
  const now = Date.now();
  for (const [key, timestamp] of eventDeduplication.entries()) {
    if (now - timestamp > DEDUP_WINDOW_MS) {
      eventDeduplication.delete(key);
    }
  }
}

@Controller("api/v1/analytics")
@UseGuards(FirebaseAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post("event")
  async recordEvent(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { recipeId: string; eventType: "view" | "save" | "cook_start" | "cook_complete" }
  ) {
    if (!body.recipeId || typeof body.recipeId !== "string" || body.recipeId.trim().length === 0) {
      throw new BadRequestException("A valid recipeId is required.");
    }

    const validTypes = ["view", "save", "cook_start", "cook_complete"] as const;
    if (!validTypes.includes(body.eventType)) {
      throw new BadRequestException(`Invalid eventType. Must be one of: ${validTypes.join(", ")}.`);
    }

    // Deduplicate rapid repeat events from same user on same recipe
    cleanOldDedupEntries();
    const dedupKey = `${user.userId}:${body.recipeId.trim()}:${body.eventType}`;
    const lastEventTime = eventDeduplication.get(dedupKey);
    const now = Date.now();

    if (lastEventTime && now - lastEventTime < DEDUP_WINDOW_MS) {
      // Event already recorded within deduplication window: return current score without double counting
      const currentScore = await this.analyticsService.getRecipePopularity(body.recipeId.trim());
      return { success: true, popularityScore: currentScore, deduplicated: true };
    }

    eventDeduplication.set(dedupKey, now);

    const score = await this.analyticsService.recordEvent(body.recipeId.trim(), body.eventType);
    return { success: true, popularityScore: score };
  }

  @Public()
  @Get("popular")
  async getPopular(@Query("limit") limit?: number) {
    return this.analyticsService.getPopularRecipes(limit ? Number(limit) : 10);
  }
}
