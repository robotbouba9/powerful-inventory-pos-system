import { api, Query } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface SearchByBarcodeRequest {
  barcode: Query<string>;
}

interface Product {
  id: number;
  sku: string;
  name: string;
  barcode: string | null;
  sellingPrice: number;
  currentStock: number;
  imageUrl: string | null;
}

interface SearchByBarcodeResponse {
  product: Product | null;
}

// Searches for a product by barcode
export const searchByBarcode = api<SearchByBarcodeRequest, SearchByBarcodeResponse>(
  { auth: true, expose: true, method: "GET", path: "/products/search/barcode" },
  async (req) => {
    getAuthData()!;

    const product = await db.queryRow<Product>`
      SELECT 
        id, sku, name, barcode,
        selling_price as "sellingPrice",
        current_stock as "currentStock",
        image_url as "imageUrl"
      FROM products
      WHERE barcode = ${req.barcode} AND is_active = true
    `;

    return { product };
  }
);
