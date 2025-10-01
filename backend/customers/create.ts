import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface CreateCustomerRequest {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  taxNumber?: string;
  creditLimit?: number;
  customerType: string;
}

interface Customer {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  customerType: string;
  loyaltyPoints: number;
}

// Creates a new customer
export const create = api(
  { auth: true, expose: true, method: "POST", path: "/customers" },
  async (req: CreateCustomerRequest): Promise<Customer> => {
    getAuthData()!;

    const customer = await db.queryRow<Customer>`
      INSERT INTO customers (
        name, email, phone, address, city, country, tax_number, credit_limit, customer_type
      )
      VALUES (
        ${req.name}, ${req.email || null}, ${req.phone || null}, ${req.address || null},
        ${req.city || null}, ${req.country || null}, ${req.taxNumber || null},
        ${req.creditLimit || null}, ${req.customerType}
      )
      RETURNING id, name, email, phone, customer_type as "customerType", loyalty_points as "loyaltyPoints"
    `;

    if (!customer) {
      throw new Error("Failed to create customer");
    }

    return customer;
  }
);
