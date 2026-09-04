import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../database/database.module";
import { YouTubeService } from "./youtube.service";
import { YouTubeController } from "./youtube.controller";
import { FirebaseAuthGuard } from "../../common/guards/firebase-auth.guard";

@Module({
  imports: [DatabaseModule],
  controllers: [YouTubeController],
  providers: [YouTubeService, FirebaseAuthGuard],
  exports: [YouTubeService],
})
export class YouTubeModule {}
