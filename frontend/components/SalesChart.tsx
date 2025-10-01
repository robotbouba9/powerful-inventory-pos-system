import { useQuery } from "@tanstack/react-query";
import { useBackend } from "../hooks/useBackend";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

export function SalesChart() {
  const backend = useBackend();

  const { data, isLoading } = useQuery({
    queryKey: ["salesChart"],
    queryFn: async () => {
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      return backend.analytics.getSalesChart({ startDate, endDate });
    },
  });

  if (isLoading) {
    return <Skeleton className="h-[300px] w-full" />;
  }

  if (!data?.data.length) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data.data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis 
          dataKey="date" 
          className="text-xs"
          tick={{ fill: "hsl(var(--muted-foreground))" }}
        />
        <YAxis 
          className="text-xs"
          tick={{ fill: "hsl(var(--muted-foreground))" }}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "6px",
          }}
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="revenue" 
          stroke="hsl(var(--primary))" 
          strokeWidth={2}
          name="Revenue"
        />
        <Line 
          type="monotone" 
          dataKey="profit" 
          stroke="hsl(142, 76%, 36%)" 
          strokeWidth={2}
          name="Profit"
        />
        <Line 
          type="monotone" 
          dataKey="orders" 
          stroke="hsl(var(--muted-foreground))" 
          strokeWidth={2}
          name="Orders"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
