import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface OrderItem {
  productId: number;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discountRate: number;
}

interface CreateOrderRequest {
  customerId?: number;
  items: OrderItem[];
  paymentMethod?: string;
  paymentAmount?: number;
  notes?: string;
}

interface SalesOrder {
  id: number;
  orderNumber: string;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: string;
}

// Creates a new sales order with automatic stock deduction
export const createOrder = api(
  { auth: true, expose: true, method: "POST", path: "/sales/orders" },
  async (req: CreateOrderRequest): Promise<SalesOrder> => {
    const auth = getAuthData()!;

    await using tx = await db.begin();

    const orderNumber = `SO-${Date.now()}`;
    let subtotal = 0;
    let taxAmount = 0;
    let discountAmount = 0;

    for (const item of req.items) {
      const itemSubtotal = item.quantity * item.unitPrice;
      const itemDiscount = itemSubtotal * (item.discountRate / 100);
      const itemTax = (itemSubtotal - itemDiscount) * (item.taxRate / 100);

      subtotal += itemSubtotal;
      taxAmount += itemTax;
      discountAmount += itemDiscount;
    }

    const totalAmount = subtotal - discountAmount + taxAmount;
    const paidAmount = req.paymentAmount || 0;
    const paymentStatus = paidAmount >= totalAmount ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid';

    const order = await tx.queryRow<SalesOrder>`
      INSERT INTO sales_orders (
        order_number, customer_id, payment_status, payment_method,
        subtotal, tax_amount, discount_amount, total_amount, paid_amount, notes, user_id
      )
      VALUES (
        ${orderNumber}, ${req.customerId || null}, ${paymentStatus}, ${req.paymentMethod || null},
        ${subtotal}, ${taxAmount}, ${discountAmount}, ${totalAmount}, ${paidAmount},
        ${req.notes || null}, ${auth.userID}
      )
      RETURNING id, order_number as "orderNumber", total_amount as "totalAmount",
                paid_amount as "paidAmount", payment_status as "paymentStatus"
    `;

    if (!order) {
      throw new Error("Failed to create order");
    }

    for (const item of req.items) {
      const product = await tx.queryRow<{ currentStock: number }>`
        SELECT current_stock as "currentStock" FROM products WHERE id = ${item.productId}
      `;

      if (!product) {
        throw APIError.notFound(`product ${item.productId} not found`);
      }

      if (product.currentStock < item.quantity) {
        throw APIError.failedPrecondition(`insufficient stock for product ${item.productId}`);
      }

      const itemTotal = item.quantity * item.unitPrice * (1 - item.discountRate / 100) * (1 + item.taxRate / 100);

      await tx.exec`
        INSERT INTO sales_order_items (
          sales_order_id, product_id, quantity, unit_price, tax_rate, discount_rate, total_amount
        )
        VALUES (
          ${order.id}, ${item.productId}, ${item.quantity}, ${item.unitPrice},
          ${item.taxRate}, ${item.discountRate}, ${itemTotal}
        )
      `;

      await tx.exec`
        UPDATE products
        SET current_stock = current_stock - ${item.quantity},
            updated_at = NOW()
        WHERE id = ${item.productId}
      `;

      await tx.exec`
        INSERT INTO stock_movements (product_id, movement_type, quantity, reference_type, reference_id, user_id)
        VALUES (${item.productId}, 'out', ${item.quantity}, 'sale', ${order.id}, ${auth.userID})
      `;
    }

    if (paidAmount > 0 && req.paymentMethod) {
      const paymentNumber = `PAY-${Date.now()}`;
      await tx.exec`
        INSERT INTO payments (payment_number, reference_type, reference_id, payment_method, amount, user_id)
        VALUES (${paymentNumber}, 'sale', ${order.id}, ${req.paymentMethod}, ${paidAmount}, ${auth.userID})
      `;
    }

    await tx.commit();

    return order;
  }
);
