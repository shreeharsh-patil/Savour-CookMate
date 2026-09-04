import { Injectable } from "@nestjs/common";
import { OpenFoodFactsProvider } from "./providers/openfoodfacts.provider";
import { ProductInfo } from "./providers/product-provider.interface";

@Injectable()
export class ProductsService {
  constructor(private readonly openFoodFactsProvider: OpenFoodFactsProvider) {}

  async getByBarcode(barcode: string): Promise<ProductInfo | null> {
    return this.openFoodFactsProvider.getProductByBarcode(barcode);
  }

  async search(query: string, limit = 10): Promise<ProductInfo[]> {
    return this.openFoodFactsProvider.searchProducts(query, limit);
  }
}
