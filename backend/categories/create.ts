import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface CreateCategoryRequest {
  name: string;
  description?: string;
  parentId?: number;
  icon?: string;
}

interface Category {
  id: number;
  name: string;
  description: string | null;
  parentId: number | null;
  icon: string | null;
}

// Creates a new category
export const create = api(
  { auth: true, expose: true, method: "POST", path: "/categories" },
  async (req: CreateCategoryRequest): Promise<Category> => {
    getAuthData()!;

    const category = await db.queryRow<Category>`
      INSERT INTO categories (name, description, parent_id, icon)
      VALUES (${req.name}, ${req.description || null}, ${req.parentId || null}, ${req.icon || null})
      RETURNING id, name, description, parent_id as "parentId", icon
    `;

    if (!category) {
      throw new Error("Failed to create category");
    }

    return category;
  }
);
