import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface CreateSupplierRequest {
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  taxNumber?: string;
  paymentTerms?: string;
  creditLimit?: number;
}

interface Supplier {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  currentBalance: number;
}

// Creates a new supplier
export const create = api(
  { auth: true, expose: true, method: "POST", path: "/suppliers" },
  async (req: CreateSupplierRequest): Promise<Supplier> => {
    getAuthData()!;

    const supplier = await db.queryRow<Supplier>`
      INSERT INTO suppliers (
        name, contact_person, email, phone, address, city, country,
        tax_number, payment_terms, credit_limit
      )
      VALUES (
        ${req.name}, ${req.contactPerson || null}, ${req.email || null},
        ${req.phone || null}, ${req.address || null}, ${req.city || null},
        ${req.country || null}, ${req.taxNumber || null}, ${req.paymentTerms || null},
        ${req.creditLimit || null}
      )
      RETURNING id, name, email, phone, current_balance as "currentBalance"
    `;

    if (!supplier) {
      throw new Error("Failed to create supplier");
    }

    return supplier;
  }
);
