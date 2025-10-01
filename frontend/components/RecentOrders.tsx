import { Badge } from "@/components/ui/badge";

interface RecentOrder {
  id: number;
  orderNumber: string;
  customerName: string | null;
  totalAmount: number;
  status: string;
  orderDate: Date;
}

interface RecentOrdersProps {
  orders: RecentOrder[];
}

export function RecentOrders({ orders }: RecentOrdersProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-500 hover:bg-green-500/20";
      case "pending":
        return "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20";
      case "cancelled":
        return "bg-red-500/10 text-red-500 hover:bg-red-500/20";
      default:
        return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20";
    }
  };

  if (!orders.length) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No orders yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div
          key={order.id}
          className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">{order.orderNumber}</span>
              <Badge className={getStatusColor(order.status)}>
                {order.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {order.customerName || "Walk-in Customer"} • {new Date(order.orderDate).toLocaleDateString()}
            </p>
          </div>
          <div className="text-right">
            <div className="font-bold text-lg text-foreground">
              {formatCurrency(order.totalAmount)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
