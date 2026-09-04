import { Injectable, Logger } from "@nestjs/common";
import { ProductProvider, ProductInfo } from "./product-provider.interface";

@Injectable()
export class OpenFoodFactsProvider implements ProductProvider {
  public readonly providerName = "openfoodfacts";
  private readonly logger = new Logger("OpenFoodFactsProvider");
  private readonly BASE_URL = "https://world.openfoodfacts.org";
  private readonly TIMEOUT_MS = 8000;

  private mapProduct(p: any): ProductInfo {
    const nutriments = p.nutriments || {};
    return {
      barcode: p.code || p._id || "",
      productName: p.product_name || p.product_name_en || "Packaged Product",
      brand: p.brands || undefined,
      imageUrl: p.image_url || p.image_front_url || undefined,
      ingredientsText: p.ingredients_text || p.ingredients_text_en || undefined,
      quantity: p.quantity || undefined,
      category: p.categories ? p.categories.split(",")[0]?.trim() : undefined,
      nutrients: {
        calories: Math.round(Number(nutriments["energy-kcal_100g"] || nutriments["energy-kcal"] || 0)),
        protein: Math.round(Number(nutriments.proteins_100g || 0) * 10) / 10,
        carbs: Math.round(Number(nutriments.carbohydrates_100g || 0) * 10) / 10,
        fat: Math.round(Number(nutriments.fat_100g || 0) * 10) / 10,
        fiber: Math.round(Number(nutriments.fiber_100g || 0) * 10) / 10,
      },
    };
  }

  async getProductByBarcode(barcode: string): Promise<ProductInfo | null> {
    if (!barcode || !barcode.trim()) return null;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

    try {
      const url = `${this.BASE_URL}/api/v2/product/${encodeURIComponent(barcode.trim())}.json`;
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "User-Agent": "YummyTummy/2.0 (contact@yummytummy.app)",
        },
      });
      clearTimeout(timeout);

      if (!res.ok) {
        this.logger.warn(`OpenFoodFacts barcode returned status ${res.status}`);
        return null;
      }

      const data: any = await res.json();
      if (!data || data.status !== 1 || !data.product) {
        return null;
      }

      return this.mapProduct(data.product);
    } catch (err: any) {
      clearTimeout(timeout);
      this.logger.warn(`OpenFoodFacts barcode lookup failed: ${err.message}`);
      return null;
    }
  }

  async searchProducts(query: string, limit = 10): Promise<ProductInfo[]> {
    if (!query || !query.trim()) return [];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

    try {
      const url = `${this.BASE_URL}/cgi/search.pl?search_terms=${encodeURIComponent(
        query.trim()
      )}&search_simple=1&action=process&json=1&page_size=${limit}`;

      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "User-Agent": "YummyTummy/2.0 (contact@yummytummy.app)",
        },
      });
      clearTimeout(timeout);

      if (!res.ok) return [];

      const data: any = await res.json();
      if (!data || !Array.isArray(data.products)) return [];

      return data.products.slice(0, limit).map((p: any) => this.mapProduct(p));
    } catch (err: any) {
      clearTimeout(timeout);
      this.logger.warn(`OpenFoodFacts search failed: ${err.message}`);
      return [];
    }
  }
}
