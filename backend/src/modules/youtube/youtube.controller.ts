import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { YouTubeService } from "./youtube.service";
import { FirebaseAuthGuard, Public } from "../../common/guards/firebase-auth.guard";

import { z } from "zod";
import { validateRequest } from "../../common/validation/validate-request";

const YouTubeQuerySchema = z
  .object({
    dish: z.string().max(100).optional(),
    recipeId: z.string().max(100).optional(),
    language: z.string().max(100).optional(),
    languages: z.string().max(100).optional(),
    filter: z.enum(["recommended", "quick", "detailed"]).optional(),
  })
  .refine((data) => Boolean(data.dish?.trim() || data.recipeId?.trim()), {
    message: "Either dish or recipeId must be provided.",
  });

@Controller("api/v1/youtube")
@UseGuards(FirebaseAuthGuard)
export class YouTubeController {
  constructor(private readonly youtubeService: YouTubeService) {}

  @Public()
  @Get()
  async getVideos(@Query() rawQuery: any) {
    const query = validateRequest(YouTubeQuerySchema, rawQuery);

    const langs: string[] = query.languages
      ? query.languages.split(",").map((s) => s.trim()).filter(Boolean)
      : query.language
      ? [query.language]
      : ["English"];

    return this.youtubeService.getVideosForRecipe(
      (query.dish || "").trim(),
      langs,
      query.filter || "recommended",
      query.recipeId
    );
  }
}
