import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { clerkPublishableKey } from "./config";
import { Dashboard } from "./components/Dashboard";

const queryClient = new QueryClient();

export default function App() {
  if (!clerkPublishableKey) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Configuration Required</h1>
          <p className="text-muted-foreground">
            Please set the ClerkPublishableKey in the Infrastructure tab
          </p>
        </div>
      </div>
    );
  }

  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <SignedIn>
        <QueryClientProvider client={queryClient}>
          <Dashboard />
        </QueryClientProvider>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </ClerkProvider>
  );
}
