import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface Supplier {
  id: number;
  name: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  currentBalance: number;
  isActive: boolean;
}

interface ListSuppliersResponse {
  suppliers: Supplier[];
}

// Lists all active suppliers
export const list = api<void, ListSuppliersResponse>(
  { auth: true, expose: true, method: "GET", path: "/suppliers" },
  async () => {
    getAuthData()!;

    const suppliers = await db.queryAll<Supplier>`
      SELECT 
        id, name, contact_person as "contactPerson", email, phone,
        current_balance as "currentBalance", is_active as "isActive"
      FROM suppliers
      WHERE is_active = true
      ORDER BY name
    `;

    return { suppliers };
  }
);
