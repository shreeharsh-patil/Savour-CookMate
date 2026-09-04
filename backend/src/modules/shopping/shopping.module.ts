import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../database/database.module";
import { ShoppingService } from "./shopping.service";
import { ShoppingController } from "./shopping.controller";
import { IngredientsModule } from "../ingredients/ingredients.module";
import { FirebaseAuthGuard } from "../../common/guards/firebase-auth.guard";

@Module({
  imports: [DatabaseModule, IngredientsModule],
  controllers: [ShoppingController],
  providers: [ShoppingService, FirebaseAuthGuard],
  exports: [ShoppingService],
})
export class ShoppingModule {}
