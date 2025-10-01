import { api, Query } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface DashboardStatsRequest {
  startDate?: Query<string>;
  endDate?: Query<string>;
}

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  lowStockProducts: number;
  revenueGrowth: number;
  ordersGrowth: number;
  topProducts: Array<{
    productId: number;
    productName: string;
    totalQuantity: number;
    totalRevenue: number;
  }>;
  recentOrders: Array<{
    id: number;
    orderNumber: string;
    customerName: string | null;
    totalAmount: number;
    status: string;
    orderDate: Date;
  }>;
  categoryDistribution: Array<{
    categoryName: string;
    productCount: number;
    totalValue: number;
  }>;
}

// Gets comprehensive dashboard statistics
export const getDashboardStats = api<DashboardStatsRequest, DashboardStats>(
  { auth: true, expose: true, method: "GET", path: "/analytics/dashboard" },
  async (req) => {
    getAuthData()!;

    const endDate = req.endDate || new Date().toISOString();
    const startDate = req.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const revenueResult = await db.queryRow<{ totalRevenue: number; totalOrders: number }>`
      SELECT 
        COALESCE(SUM(total_amount), 0) as "totalRevenue",
        COUNT(*)::int as "totalOrders"
      FROM sales_orders
      WHERE order_date >= ${startDate} AND order_date <= ${endDate}
        AND status != 'cancelled'
    `!;

    const customersResult = await db.queryRow<{ totalCustomers: number }>`
      SELECT COUNT(*)::int as "totalCustomers"
      FROM customers
      WHERE is_active = true
    `!;

    const lowStockResult = await db.queryRow<{ lowStockProducts: number }>`
      SELECT COUNT(*)::int as "lowStockProducts"
      FROM products
      WHERE current_stock <= reorder_point AND is_active = true
    `!;

    const previousPeriodStart = new Date(new Date(startDate).getTime() - (new Date(endDate).getTime() - new Date(startDate).getTime())).toISOString();

    const previousRevenueResult = await db.queryRow<{ previousRevenue: number; previousOrders: number }>`
      SELECT 
        COALESCE(SUM(total_amount), 0) as "previousRevenue",
        COUNT(*)::int as "previousOrders"
      FROM sales_orders
      WHERE order_date >= ${previousPeriodStart} AND order_date < ${startDate}
        AND status != 'cancelled'
    `!;

    const revenueGrowth = previousRevenueResult && previousRevenueResult.previousRevenue > 0
      ? ((revenueResult!.totalRevenue - previousRevenueResult.previousRevenue) / previousRevenueResult.previousRevenue) * 100
      : 0;

    const ordersGrowth = previousRevenueResult && previousRevenueResult.previousOrders > 0
      ? ((revenueResult!.totalOrders - previousRevenueResult.previousOrders) / previousRevenueResult.previousOrders) * 100
      : 0;

    const topProducts = await db.queryAll<{
      productId: number;
      productName: string;
      totalQuantity: number;
      totalRevenue: number;
    }>`
      SELECT 
        p.id as "productId",
        p.name as "productName",
        SUM(i.quantity)::int as "totalQuantity",
        SUM(i.total_amount) as "totalRevenue"
      FROM sales_order_items i
      JOIN products p ON p.id = i.product_id
      JOIN sales_orders s ON s.id = i.sales_order_id
      WHERE s.order_date >= ${startDate} AND s.order_date <= ${endDate}
        AND s.status != 'cancelled'
      GROUP BY p.id, p.name
      ORDER BY "totalRevenue" DESC
      LIMIT 10
    `;

    const recentOrders = await db.queryAll<{
      id: number;
      orderNumber: string;
      customerName: string | null;
      totalAmount: number;
      status: string;
      orderDate: Date;
    }>`
      SELECT 
        s.id,
        s.order_number as "orderNumber",
        c.name as "customerName",
        s.total_amount as "totalAmount",
        s.status,
        s.order_date as "orderDate"
      FROM sales_orders s
      LEFT JOIN customers c ON c.id = s.customer_id
      ORDER BY s.order_date DESC
      LIMIT 10
    `;

    const categoryDistribution = await db.queryAll<{
      categoryName: string;
      productCount: number;
      totalValue: number;
    }>`
      SELECT 
        COALESCE(c.name, 'Uncategorized') as "categoryName",
        COUNT(p.id)::int as "productCount",
        SUM(p.current_stock * p.selling_price) as "totalValue"
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.is_active = true
      GROUP BY c.name
      ORDER BY "totalValue" DESC
    `;

    return {
      totalRevenue: revenueResult?.totalRevenue || 0,
      totalOrders: revenueResult?.totalOrders || 0,
      totalCustomers: customersResult?.totalCustomers || 0,
      lowStockProducts: lowStockResult?.lowStockProducts || 0,
      revenueGrowth,
      ordersGrowth,
      topProducts,
      recentOrders,
      categoryDistribution,
    };
  }
);
