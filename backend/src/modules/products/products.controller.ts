import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { ProductsService } from "./products.service";
import { FirebaseAuthGuard, Public } from "../../common/guards/firebase-auth.guard";

@Controller("api/v1/products")
@UseGuards(FirebaseAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Public()
  @Get("barcode/:barcode")
  async getByBarcode(@Param("barcode") barcode: string) {
    const product = await this.productsService.getByBarcode(barcode);
    return { data: product };
  }

  @Public()
  @Get("search")
  async search(@Query("q") query: string, @Query("limit") limit?: number) {
    const products = await this.productsService.search(query, limit ? Number(limit) : 10);
    return { data: products };
  }
}
