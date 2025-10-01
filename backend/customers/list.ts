import { api, Query } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface ListCustomersRequest {
  search?: Query<string>;
  customerType?: Query<string>;
}

interface Customer {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  customerType: string;
  currentBalance: number;
  loyaltyPoints: number;
  isActive: boolean;
}

interface ListCustomersResponse {
  customers: Customer[];
}

// Lists all customers with optional filtering
export const list = api<ListCustomersRequest, ListCustomersResponse>(
  { auth: true, expose: true, method: "GET", path: "/customers" },
  async (req) => {
    getAuthData()!;

    let whereConditions: string[] = ["is_active = true"];
    let params: any[] = [];
    let paramIndex = 1;

    if (req.search) {
      whereConditions.push(`(name ILIKE $${paramIndex} OR phone ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`);
      params.push(`%${req.search}%`);
      paramIndex++;
    }

    if (req.customerType) {
      whereConditions.push(`customer_type = $${paramIndex}`);
      params.push(req.customerType);
      paramIndex++;
    }

    const customers = await db.rawQueryAll<Customer>(`
      SELECT 
        id, name, email, phone,
        customer_type as "customerType",
        current_balance as "currentBalance",
        loyalty_points as "loyaltyPoints",
        is_active as "isActive"
      FROM customers
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY name
    `, ...params);

    return { customers };
  }
);
