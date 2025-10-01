import { api, Query } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface ListProductsRequest {
  search?: Query<string>;
  categoryId?: Query<number>;
  lowStock?: Query<boolean>;
  page?: Query<number>;
  limit?: Query<number>;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  categoryName: string | null;
  currentStock: number;
  minStockLevel: number;
  sellingPrice: number;
  costPrice: number;
  isActive: boolean;
  imageUrl: string | null;
}

interface ListProductsResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
}

// Lists products with filtering and pagination
export const list = api<ListProductsRequest, ListProductsResponse>(
  { auth: true, expose: true, method: "GET", path: "/products" },
  async (req) => {
    getAuthData()!;

    const page = req.page || 1;
    const limit = req.limit || 50;
    const offset = (page - 1) * limit;

    let whereConditions: string[] = [];
    let params: any[] = [];
    let paramIndex = 1;

    if (req.search) {
      whereConditions.push(`(p.name ILIKE $${paramIndex} OR p.sku ILIKE $${paramIndex} OR p.barcode ILIKE $${paramIndex})`);
      params.push(`%${req.search}%`);
      paramIndex++;
    }

    if (req.categoryId) {
      whereConditions.push(`p.category_id = $${paramIndex}`);
      params.push(req.categoryId);
      paramIndex++;
    }

    if (req.lowStock) {
      whereConditions.push(`p.current_stock <= p.reorder_point`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countResult = await db.queryRow<{ count: number }>`
      SELECT COUNT(*)::int as count FROM products p ${db.rawQuery(whereClause, ...params)}
    `!;

    params.push(limit, offset);
    const products = await db.rawQueryAll<Product>(`
      SELECT 
        p.id,
        p.sku,
        p.name,
        c.name as "categoryName",
        p.current_stock as "currentStock",
        p.min_stock_level as "minStockLevel",
        p.selling_price as "sellingPrice",
        p.cost_price as "costPrice",
        p.is_active as "isActive",
        p.image_url as "imageUrl"
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      ${whereClause}
      ORDER BY p.name
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, ...params);

    return {
      products,
      total: countResult?.count || 0,
      page,
      limit,
    };
  }
);
