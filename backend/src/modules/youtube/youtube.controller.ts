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
    @Query("dish") dish: string,
    @Query("language") language?: string,
    @Query("filter") filter?: string
  ) {
    return this.youtubeService.getVideosForRecipe(
      dish || "Indian Curry",
      language || "English",
      filter || "all"
    );
  }
}
