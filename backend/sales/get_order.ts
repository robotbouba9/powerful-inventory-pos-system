import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface GetOrderRequest {
  id: number;
}

interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discountRate: number;
  totalAmount: number;
}

interface SalesOrder {
  id: number;
  orderNumber: string;
  customerId: number | null;
  customerName: string | null;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  notes: string | null;
  orderDate: Date;
  items: OrderItem[];
}

// Gets a sales order by ID with items
export const getOrder = api<GetOrderRequest, SalesOrder>(
  { auth: true, expose: true, method: "GET", path: "/sales/orders/:id" },
  async (req) => {
    getAuthData()!;

    const order = await db.queryRow<Omit<SalesOrder, 'items'>>`
      SELECT 
        s.id,
        s.order_number as "orderNumber",
        s.customer_id as "customerId",
        c.name as "customerName",
        s.status,
        s.payment_status as "paymentStatus",
        s.payment_method as "paymentMethod",
        s.subtotal,
        s.tax_amount as "taxAmount",
        s.discount_amount as "discountAmount",
        s.total_amount as "totalAmount",
        s.paid_amount as "paidAmount",
        s.notes,
        s.order_date as "orderDate"
      FROM sales_orders s
      LEFT JOIN customers c ON c.id = s.customer_id
      WHERE s.id = ${req.id}
    `;

    if (!order) {
      throw APIError.notFound("sales order not found");
    }

    const items = await db.queryAll<OrderItem>`
      SELECT 
        i.id,
        i.product_id as "productId",
        p.name as "productName",
        i.quantity,
        i.unit_price as "unitPrice",
        i.tax_rate as "taxRate",
        i.discount_rate as "discountRate",
        i.total_amount as "totalAmount"
      FROM sales_order_items i
      JOIN products p ON p.id = i.product_id
      WHERE i.sales_order_id = ${req.id}
    `;

    return { ...order, items };
  }
);
