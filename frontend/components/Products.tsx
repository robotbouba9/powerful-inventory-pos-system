import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useBackend } from "../hooks/useBackend";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export function Products() {
  const backend = useBackend();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showLowStock, setShowLowStock] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: productsData } = useQuery({
    queryKey: ["products", search, showLowStock],
    queryFn: () => backend.products.list({ search, lowStock: showLowStock }),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => backend.categories.list(),
  });

  const createProductMutation = useMutation({
    mutationFn: (data: any) => backend.products.create(data),
    onSuccess: () => {
      toast({ title: "Success", description: "Product created successfully" });
      setIsCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error) => {
      console.error("Product creation failed:", error);
      toast({ title: "Error", description: "Failed to create product", variant: "destructive" });
    },
  });

  const handleCreateProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createProductMutation.mutate({
      sku: formData.get("sku") as string,
      name: formData.get("name") as string,
      categoryId: formData.get("categoryId") ? Number(formData.get("categoryId")) : undefined,
      unit: formData.get("unit") as string,
      costPrice: Number(formData.get("costPrice")),
      sellingPrice: Number(formData.get("sellingPrice")),
      currentStock: Number(formData.get("currentStock")),
      minStockLevel: Number(formData.get("minStockLevel")),
      reorderPoint: Number(formData.get("reorderPoint")),
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              Products
            </CardTitle>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Product</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateProduct} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sku">SKU *</Label>
                      <Input id="sku" name="sku" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">Product Name *</Label>
                      <Input id="name" name="name" required />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="categoryId">Category</Label>
                      <Select name="categoryId">
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categoriesData?.categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id.toString()}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="unit">Unit *</Label>
                      <Input id="unit" name="unit" defaultValue="unit" required />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="costPrice">Cost Price *</Label>
                      <Input id="costPrice" name="costPrice" type="number" step="0.01" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sellingPrice">Selling Price *</Label>
                      <Input id="sellingPrice" name="sellingPrice" type="number" step="0.01" required />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentStock">Current Stock *</Label>
                      <Input id="currentStock" name="currentStock" type="number" defaultValue="0" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="minStockLevel">Min Stock *</Label>
                      <Input id="minStockLevel" name="minStockLevel" type="number" defaultValue="10" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reorderPoint">Reorder Point *</Label>
                      <Input id="reorderPoint" name="reorderPoint" type="number" defaultValue="20" required />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createProductMutation.isPending}>
                      Create Product
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button
              variant={showLowStock ? "default" : "outline"}
              onClick={() => setShowLowStock(!showLowStock)}
              className="gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              Low Stock
            </Button>
          </div>

          <div className="space-y-3">
            {productsData?.products.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold text-foreground">{product.name}</h4>
                    {product.currentStock <= product.minStockLevel && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Low Stock
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {product.sku} • {product.categoryName || "Uncategorized"}
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <div className="font-bold text-lg text-foreground">
                    ${product.sellingPrice.toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Stock: {product.currentStock}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
