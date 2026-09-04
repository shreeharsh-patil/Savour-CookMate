import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../database/database.module";
import { RecipesService } from "./recipes.service";
import { RecipesController } from "./recipes.controller";
import { FirebaseAuthGuard } from "../../common/guards/firebase-auth.guard";

@Module({
  imports: [DatabaseModule],
  controllers: [RecipesController],
  providers: [RecipesService, FirebaseAuthGuard],
  exports: [RecipesService],
})
export class RecipesModule {}
