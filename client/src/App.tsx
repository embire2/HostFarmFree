import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import Landing from "@/pages/landing";
import ClientDashboard from "@/pages/client-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import PluginLibrary from "@/pages/plugin-library";
import PluginDetail from "@/pages/plugin-detail";
import PluginCheckout from "@/pages/plugin-checkout";
import DonationSuccess from "@/pages/donation-success";

import NotFound from "@/pages/not-found";
import ApiSettingsPage from "@/pages/api-settings-page";

function Router() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />

          <Route path="/plugins" component={PluginLibrary} />
          <Route path="/plugin-library" component={PluginLibrary} />
          <Route path="/plugin/:slug" component={PluginDetail} />
          <Route path="/plugin/:slug/donate" component={PluginCheckout} />
          <Route path="/donation-success" component={DonationSuccess} />
        </>
      ) : (
        <>
          {(user as any)?.role === "admin" ? (
            <>
              <Route path="/" component={AdminDashboard} />
              <Route path="/dashboard" component={AdminDashboard} />
              <Route path="/client" component={ClientDashboard} />
              <Route path="/admin/api-settings" component={ApiSettingsPage} />
              <Route path="/plugins" component={PluginLibrary} />
              <Route path="/plugin-library" component={PluginLibrary} />
              <Route path="/plugin/:slug" component={PluginDetail} />
              <Route path="/plugin/:slug/donate" component={PluginCheckout} />
              <Route path="/donation-success" component={DonationSuccess} />
            </>
          ) : (
            <>
              <Route path="/" component={ClientDashboard} />
              <Route path="/dashboard" component={ClientDashboard} />
              <Route path="/plugins" component={PluginLibrary} />
              <Route path="/plugin-library" component={PluginLibrary} />
              <Route path="/plugin/:slug" component={PluginDetail} />
              <Route path="/plugin/:slug/donate" component={PluginCheckout} />
              <Route path="/donation-success" component={DonationSuccess} />
            </>
          )}
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
