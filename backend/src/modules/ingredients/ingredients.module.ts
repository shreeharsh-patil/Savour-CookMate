import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../database/database.module";
import { IngredientsService } from "./ingredients.service";
import { IngredientsController } from "./ingredients.controller";
import { FirebaseAuthGuard } from "../../common/guards/firebase-auth.guard";

@Module({
  imports: [DatabaseModule],
  controllers: [IngredientsController],
  providers: [IngredientsService, FirebaseAuthGuard],
  exports: [IngredientsService],
})
export class IngredientsModule {}
