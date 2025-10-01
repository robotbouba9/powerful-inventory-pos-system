import { UserButton } from "@clerk/clerk-react";
import { Package } from "lucide-react";

export function Header() {
  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary rounded-lg p-2">
            <Package className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Inventory Pro</h1>
            <p className="text-sm text-muted-foreground">Advanced ERP & POS System</p>
          </div>
        </div>
        <UserButton afterSignOutUrl="/" />
      </div>
    </header>
  );
}
