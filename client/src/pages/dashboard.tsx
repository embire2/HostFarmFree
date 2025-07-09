import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import ClientDashboard from "./client-dashboard";
import AdminDashboard from "./admin-dashboard";
import Landing from "./landing";

export default function Dashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Handle authentication state changes
  useEffect(() => {
    // If we're done loading and still not authenticated, wait a bit for auth to process
    if (!isLoading && !isAuthenticated) {
      const timeoutId = setTimeout(() => {
        // If still not authenticated after 2 seconds, redirect to home
        if (!isAuthenticated) {
          console.log("[Dashboard] User not authenticated after timeout, redirecting to home");
          setLocation("/");
        }
      }, 2000);

      return () => clearTimeout(timeoutId);
    }
  }, [isLoading, isAuthenticated, setLocation]);

  // Show loading while authentication is being determined
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show landing page temporarily
  if (!isAuthenticated) {
    return <Landing />;
  }

  // Route to appropriate dashboard based on user role
  if ((user as any)?.role === "admin") {
    return <AdminDashboard />;
  } else {
    return <ClientDashboard />;
  }
}