import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import Landing from "@/pages/landing";
import ClientDashboard from "@/pages/client-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import Dashboard from "@/pages/dashboard";
import PluginLibrary from "@/pages/plugin-library";
import PluginDetail from "@/pages/plugin-detail";
import PluginCheckout from "@/pages/plugin-checkout";
import PluginCheckoutSuccess from "@/pages/plugin-checkout-success";
import DonationSuccess from "@/pages/donation-success";
import VpsCheckout from "@/pages/vps-checkout";
import VpsSuccess from "@/pages/vps-success";
import Conversion from "@/pages/conversion";

import NotFound from "@/pages/not-found";
import ApiSettingsPage from "@/pages/api-settings-page";
import CustomHeaderCodeInjector from "@/components/custom-header-code-injector";

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
      {/* Universal routes available regardless of authentication state */}
      <Route path="/plugins" component={PluginLibrary} />
      <Route path="/plugin-library" component={PluginLibrary} />
      <Route path="/plugin/:slug" component={PluginDetail} />
      <Route path="/plugin/:slug/donate" component={PluginCheckout} />
      <Route path="/plugin-checkout-success" component={PluginCheckoutSuccess} />
      <Route path="/donation-success" component={DonationSuccess} />
      <Route path="/vps-checkout" component={VpsCheckout} />
      <Route path="/vps-success" component={VpsSuccess} />
      <Route path="/conversion" component={Conversion} />
      
      {/* Dashboard route that handles authentication properly */}
      <Route path="/dashboard" component={Dashboard} />
      
      {!isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
        </>
      ) : (
        <>
          {(user as any)?.role === "admin" ? (
            <>
              <Route path="/" component={AdminDashboard} />
              <Route path="/admin-dashboard" component={AdminDashboard} />
              <Route path="/client" component={ClientDashboard} />
              <Route path="/admin/api-settings" component={ApiSettingsPage} />
            </>
          ) : (
            <>
              <Route path="/" component={ClientDashboard} />
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
          <CustomHeaderCodeInjector />
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
