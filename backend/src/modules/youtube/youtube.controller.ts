import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { YouTubeService } from "./youtube.service";
import { FirebaseAuthGuard, Public } from "../../common/guards/firebase-auth.guard";

@Controller("api/v1/youtube")
@UseGuards(FirebaseAuthGuard)
export class YouTubeController {
  constructor(private readonly youtubeService: YouTubeService) {}

  @Public()
  @Get()
  async getVideos(
    @Query("dish") dish?: string,
    @Query("recipeId") recipeId?: string,
    @Query("language") language?: string,
    @Query("languages") languages?: string,
    @Query("filter") filter?: string
  ) {
    const langs: string[] = languages
      ? languages.split(",").map((s) => s.trim()).filter(Boolean)
      : language
      ? [language]
      : ["English"];

    return this.youtubeService.getVideosForRecipe(
      dish || "Recipe Tutorial",
      langs,
      filter || "recommended",
      recipeId
    );
  }
}
