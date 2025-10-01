import { TrendingUp } from "lucide-react";

interface TopProduct {
  productId: number;
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
}

interface TopProductsProps {
  products: TopProduct[];
}

export function TopProducts({ products }: TopProductsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (!products.length) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No products sold yet
      </div>
    );
  }

  const maxRevenue = Math.max(...products.map((p) => p.totalRevenue));

  return (
    <div className="space-y-4">
      {products.slice(0, 5).map((product, index) => (
        <div key={product.productId} className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">{index + 1}.</span>
              <span className="text-foreground">{product.productName}</span>
            </div>
            <span className="font-semibold text-foreground">
              {formatCurrency(product.totalRevenue)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-full transition-all"
                style={{ width: `${(product.totalRevenue / maxRevenue) * 100}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              {product.totalQuantity} sold
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
