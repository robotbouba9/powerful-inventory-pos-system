import { api, Query } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface SalesChartRequest {
  startDate: Query<string>;
  endDate: Query<string>;
  interval?: Query<string>;
}

interface ChartDataPoint {
  date: string;
  revenue: number;
  orders: number;
  profit: number;
}

interface SalesChartResponse {
  data: ChartDataPoint[];
}

// Gets sales data for charting
export const getSalesChart = api<SalesChartRequest, SalesChartResponse>(
  { auth: true, expose: true, method: "GET", path: "/analytics/sales-chart" },
  async (req) => {
    getAuthData()!;

    const interval = req.interval || 'day';
    let dateFormat = 'YYYY-MM-DD';
    let truncFunc = 'DATE(order_date)';

    if (interval === 'month') {
      dateFormat = 'YYYY-MM';
      truncFunc = "TO_CHAR(order_date, 'YYYY-MM')";
    } else if (interval === 'week') {
      truncFunc = "DATE_TRUNC('week', order_date)";
    }

    const data = await db.rawQueryAll<ChartDataPoint>(`
      SELECT 
        ${truncFunc} as date,
        COALESCE(SUM(s.total_amount), 0) as revenue,
        COUNT(s.id)::int as orders,
        COALESCE(SUM(
          (SELECT SUM(i.quantity * (p.selling_price - p.cost_price))
           FROM sales_order_items i
           JOIN products p ON p.id = i.product_id
           WHERE i.sales_order_id = s.id)
        ), 0) as profit
      FROM sales_orders s
      WHERE s.order_date >= $1 AND s.order_date <= $2
        AND s.status != 'cancelled'
      GROUP BY date
      ORDER BY date
    `, req.startDate, req.endDate);

    return { data };
  }
);
