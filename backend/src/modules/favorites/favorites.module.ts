import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../database/database.module";
import { FavoritesService } from "./favorites.service";
import { FavoritesController } from "./favorites.controller";
import { FirebaseAuthGuard } from "../../common/guards/firebase-auth.guard";

@Module({
  imports: [DatabaseModule],
  controllers: [FavoritesController],
  providers: [FavoritesService, FirebaseAuthGuard],
  exports: [FavoritesService],
})
export class FavoritesModule {}
