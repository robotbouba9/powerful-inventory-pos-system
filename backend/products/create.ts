import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface CreateProductRequest {
  sku: string;
  name: string;
  description?: string;
  categoryId?: number;
  barcode?: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  minStockLevel: number;
  maxStockLevel?: number;
  reorderPoint: number;
  currentStock: number;
  imageUrl?: string;
}

interface Product {
  id: number;
  sku: string;
  name: string;
  description: string | null;
  categoryId: number | null;
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

// Creates a new product
export const create = api(
  { auth: true, expose: true, method: "POST", path: "/products" },
  async (req: CreateProductRequest): Promise<Product> => {
    const auth = getAuthData()!;

    const existing = await db.queryRow`SELECT id FROM products WHERE sku = ${req.sku}`;
    if (existing) {
      throw APIError.alreadyExists("product with this SKU already exists");
    }

    const product = await db.queryRow<Product>`
      INSERT INTO products (
        sku, name, description, category_id, barcode, unit,
        cost_price, selling_price, min_stock_level, max_stock_level,
        reorder_point, current_stock, image_url
      )
      VALUES (
        ${req.sku}, ${req.name}, ${req.description || null}, ${req.categoryId || null},
        ${req.barcode || null}, ${req.unit}, ${req.costPrice}, ${req.sellingPrice},
        ${req.minStockLevel}, ${req.maxStockLevel || null}, ${req.reorderPoint},
        ${req.currentStock}, ${req.imageUrl || null}
      )
      RETURNING 
        id, sku, name, description, category_id as "categoryId", barcode, unit,
        cost_price as "costPrice", selling_price as "sellingPrice",
        min_stock_level as "minStockLevel", max_stock_level as "maxStockLevel",
        reorder_point as "reorderPoint", current_stock as "currentStock",
        image_url as "imageUrl", is_active as "isActive"
    `;

    if (!product) {
      throw new Error("Failed to create product");
    }

    if (req.currentStock > 0) {
      await db.exec`
        INSERT INTO stock_movements (product_id, movement_type, quantity, reference_type, user_id)
        VALUES (${product.id}, 'in', ${req.currentStock}, 'adjustment', ${auth.userID})
      `;
    }

    return product;
  }
);
