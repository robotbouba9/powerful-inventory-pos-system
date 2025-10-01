import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface GetProductRequest {
  id: number;
}

interface Product {
  id: number;
  sku: string;
  name: string;
  description: string | null;
  categoryId: number | null;
  categoryName: string | null;
  barcode: string | null;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  minStockLevel: number;
  maxStockLevel: number | null;
  reorderPoint: number;
  currentStock: number;
  imageUrl: string | null;
  isActive: boolean;
}

// Gets a product by ID
export const get = api<GetProductRequest, Product>(
  { auth: true, expose: true, method: "GET", path: "/products/:id" },
  async (req) => {
    getAuthData()!;

    const product = await db.queryRow<Product>`
      SELECT 
        p.id, p.sku, p.name, p.description, p.category_id as "categoryId",
        c.name as "categoryName", p.barcode, p.unit,
        p.cost_price as "costPrice", p.selling_price as "sellingPrice",
        p.min_stock_level as "minStockLevel", p.max_stock_level as "maxStockLevel",
        p.reorder_point as "reorderPoint", p.current_stock as "currentStock",
        p.image_url as "imageUrl", p.is_active as "isActive"
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.id = ${req.id}
    `;

    if (!product) {
      throw APIError.notFound("product not found");
    }

    return product;
  }
);
