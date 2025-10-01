import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface UpdateProductRequest {
  id: number;
  name?: string;
  description?: string;
  categoryId?: number;
  barcode?: string;
  unit?: string;
  costPrice?: number;
  sellingPrice?: number;
  minStockLevel?: number;
  maxStockLevel?: number;
  reorderPoint?: number;
  imageUrl?: string;
  isActive?: boolean;
}

interface Product {
  id: number;
  sku: string;
  name: string;
  currentStock: number;
}

// Updates a product
export const update = api(
  { auth: true, expose: true, method: "PUT", path: "/products/:id" },
  async (req: UpdateProductRequest): Promise<Product> => {
    getAuthData()!;

    const existing = await db.queryRow`SELECT id FROM products WHERE id = ${req.id}`;
    if (!existing) {
      throw APIError.notFound("product not found");
    }

    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (req.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      params.push(req.name);
    }
    if (req.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      params.push(req.description);
    }
    if (req.categoryId !== undefined) {
      updates.push(`category_id = $${paramIndex++}`);
      params.push(req.categoryId);
    }
    if (req.barcode !== undefined) {
      updates.push(`barcode = $${paramIndex++}`);
      params.push(req.barcode);
    }
    if (req.unit !== undefined) {
      updates.push(`unit = $${paramIndex++}`);
      params.push(req.unit);
    }
    if (req.costPrice !== undefined) {
      updates.push(`cost_price = $${paramIndex++}`);
      params.push(req.costPrice);
    }
    if (req.sellingPrice !== undefined) {
      updates.push(`selling_price = $${paramIndex++}`);
      params.push(req.sellingPrice);
    }
    if (req.minStockLevel !== undefined) {
      updates.push(`min_stock_level = $${paramIndex++}`);
      params.push(req.minStockLevel);
    }
    if (req.maxStockLevel !== undefined) {
      updates.push(`max_stock_level = $${paramIndex++}`);
      params.push(req.maxStockLevel);
    }
    if (req.reorderPoint !== undefined) {
      updates.push(`reorder_point = $${paramIndex++}`);
      params.push(req.reorderPoint);
    }
    if (req.imageUrl !== undefined) {
      updates.push(`image_url = $${paramIndex++}`);
      params.push(req.imageUrl);
    }
    if (req.isActive !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      params.push(req.isActive);
    }

    if (updates.length === 0) {
      throw APIError.invalidArgument("no fields to update");
    }

    updates.push(`updated_at = NOW()`);
    params.push(req.id);

    const product = await db.rawQueryRow<Product>(`
      UPDATE products
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, sku, name, current_stock as "currentStock"
    `, ...params);

    if (!product) {
      throw new Error("Failed to update product");
    }

    return product;
  }
);
