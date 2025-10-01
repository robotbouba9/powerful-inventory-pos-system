import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useBackend } from "../hooks/useBackend";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { Overview } from "./Overview";
import { Products } from "./Products";
import { POSSystem } from "./POSSystem";
import { Sales } from "./Sales";
import { Customers } from "./Customers";
import { Header } from "./Header";

export function Dashboard() {
  const { user } = useUser();
  const backend = useBackend();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const syncUser = async () => {
      if (user) {
        try {
          await backend.users.sync({
            email: user.emailAddresses[0]?.emailAddress || "",
            fullName: user.fullName || user.firstName || "User",
            avatarUrl: user.imageUrl,
          });
        } catch (error) {
          console.error("Failed to sync user:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    syncUser();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto py-6 px-4">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="pos">POS</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <Overview />
          </TabsContent>
          
          <TabsContent value="pos">
            <POSSystem />
          </TabsContent>
          
          <TabsContent value="products">
            <Products />
          </TabsContent>
          
          <TabsContent value="sales">
            <Sales />
          </TabsContent>
          
          <TabsContent value="customers">
            <Customers />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
