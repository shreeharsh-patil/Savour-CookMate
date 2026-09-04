import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../database/database.module";
import { RecommendationsService } from "./recommendations.service";
import { RecommendationsController } from "./recommendations.controller";
import { FirebaseAuthGuard } from "../../common/guards/firebase-auth.guard";

@Module({
  imports: [DatabaseModule],
  controllers: [RecommendationsController],
  providers: [RecommendationsService, FirebaseAuthGuard],
  exports: [RecommendationsService],
})
export class RecommendationsModule {}
