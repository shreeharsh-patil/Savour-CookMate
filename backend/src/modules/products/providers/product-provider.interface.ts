export interface ProductInfo {
  barcode: string;
  productName: string;
  brand?: string;
  imageUrl?: string;
  ingredientsText?: string;
  nutrients?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
  };
  category?: string;
  quantity?: string;
}

export interface ProductProvider {
  readonly providerName: string;
  getProductByBarcode(barcode: string): Promise<ProductInfo | null>;
  searchProducts(query: string, limit?: number): Promise<ProductInfo[]>;
}
