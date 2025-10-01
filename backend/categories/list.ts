import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface Category {
  id: number;
  name: string;
  description: string | null;
  parentId: number | null;
  icon: string | null;
  productCount: number;
}

interface ListCategoriesResponse {
  categories: Category[];
}

// Lists all categories with product counts
export const list = api<void, ListCategoriesResponse>(
  { auth: true, expose: true, method: "GET", path: "/categories" },
  async () => {
    getAuthData()!;

    const categories = await db.queryAll<Category>`
      SELECT 
        c.id,
        c.name,
        c.description,
        c.parent_id as "parentId",
        c.icon,
        COUNT(p.id)::int as "productCount"
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id AND p.is_active = true
      GROUP BY c.id
      ORDER BY c.name
    `;

    return { categories };
  }
);
