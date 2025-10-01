import { api, Query } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface ListOrdersRequest {
  status?: Query<string>;
  paymentStatus?: Query<string>;
  startDate?: Query<string>;
  endDate?: Query<string>;
  page?: Query<number>;
  limit?: Query<number>;
}

interface SalesOrder {
  id: number;
  orderNumber: string;
  customerName: string | null;
  totalAmount: number;
  paidAmount: number;
  status: string;
  paymentStatus: string;
  orderDate: Date;
}

interface ListOrdersResponse {
  orders: SalesOrder[];
  total: number;
  page: number;
  limit: number;
}

// Lists sales orders with filtering and pagination
export const listOrders = api<ListOrdersRequest, ListOrdersResponse>(
  { auth: true, expose: true, method: "GET", path: "/sales/orders" },
  async (req) => {
    getAuthData()!;

    const page = req.page || 1;
    const limit = req.limit || 50;
    const offset = (page - 1) * limit;

    let whereConditions: string[] = [];
    let params: any[] = [];
    let paramIndex = 1;

    if (req.status) {
      whereConditions.push(`s.status = $${paramIndex++}`);
      params.push(req.status);
    }

    if (req.paymentStatus) {
      whereConditions.push(`s.payment_status = $${paramIndex++}`);
      params.push(req.paymentStatus);
    }

    if (req.startDate) {
      whereConditions.push(`s.order_date >= $${paramIndex++}`);
      params.push(req.startDate);
    }

    if (req.endDate) {
      whereConditions.push(`s.order_date <= $${paramIndex++}`);
      params.push(req.endDate);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countResult = await db.rawQueryRow<{ count: number }>(`
      SELECT COUNT(*)::int as count FROM sales_orders s ${whereClause}
    `, ...params)!;

    params.push(limit, offset);
    const orders = await db.rawQueryAll<SalesOrder>(`
      SELECT 
        s.id,
        s.order_number as "orderNumber",
        c.name as "customerName",
        s.total_amount as "totalAmount",
        s.paid_amount as "paidAmount",
        s.status,
        s.payment_status as "paymentStatus",
        s.order_date as "orderDate"
      FROM sales_orders s
      LEFT JOIN customers c ON c.id = s.customer_id
      ${whereClause}
      ORDER BY s.order_date DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `, ...params);

    return {
      orders,
      total: countResult?.count || 0,
      page,
      limit,
    };
  }
);
