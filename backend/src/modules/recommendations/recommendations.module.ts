import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../database/database.module";
import { IngredientsModule } from "../ingredients/ingredients.module";
import { RecommendationsService } from "./recommendations.service";
import { RecommendationsController } from "./recommendations.controller";
import { FirebaseAuthGuard } from "../../common/guards/firebase-auth.guard";

@Module({
  imports: [DatabaseModule, IngredientsModule],
  controllers: [RecommendationsController],
  providers: [RecommendationsService, FirebaseAuthGuard],
  exports: [RecommendationsService],
})
export class RecommendationsModule {}
