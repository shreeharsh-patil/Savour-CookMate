import { Module } from "@nestjs/common";
import { ProductsService } from "./products.service";
import { ProductsController } from "./products.controller";
import { OpenFoodFactsProvider } from "./providers/openfoodfacts.provider";

@Module({
  controllers: [ProductsController],
  providers: [ProductsService, OpenFoodFactsProvider],
  exports: [ProductsService, OpenFoodFactsProvider],
})
export class ProductsModule {}
