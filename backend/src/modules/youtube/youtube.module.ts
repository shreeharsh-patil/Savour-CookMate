import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../database/database.module";
import { YouTubeService } from "./youtube.service";
import { YouTubeController } from "./youtube.controller";
import { FirebaseAuthGuard } from "../../common/guards/firebase-auth.guard";
import { RecipeSourceVideoProvider } from "./providers/recipe-source.provider";
import { YouTubeDataVideoProvider } from "./providers/youtube-data.provider";
import { InvidiousVideoProvider } from "./providers/invidious.provider";

@Module({
  imports: [DatabaseModule],
  controllers: [YouTubeController],
  providers: [
    YouTubeService,
    RecipeSourceVideoProvider,
    YouTubeDataVideoProvider,
    InvidiousVideoProvider,
    FirebaseAuthGuard,
  ],
  exports: [YouTubeService],
})
export class YouTubeModule {}
