import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Globe, 
  Download, 
  BarChart3, 
  Plus,
  ExternalLink,
  HardDrive,
  Wifi,
  Calendar,
  TrendingUp
} from "lucide-react";
import Navbar from "@/components/navbar";
import DomainSearch from "@/components/domain-search";
import { HostingAccount, PluginDownload } from "@shared/schema";

export default function ClientDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: hostingAccounts, isLoading: accountsLoading } = useQuery({
    queryKey: ["/api/hosting-accounts"],
    enabled: isAuthenticated,
  });

  const { data: pluginDownloads, isLoading: downloadsLoading } = useQuery({
    queryKey: ["/api/plugin-downloads"],
    enabled: isAuthenticated,
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
  });

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

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 MB";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const getUsagePercentage = (used: number, limit: number) => {
    return Math.round((used / limit) * 100);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-dark mb-2">
            Welcome back, {user?.firstName || "Developer"}!
          </h1>
          <p className="text-gray-600">
            Manage your hosting accounts, download plugins, and monitor your websites.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Globe className="h-8 w-8 text-primary" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Active Sites</p>
                  <p className="text-2xl font-bold">{hostingAccounts?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Download className="h-8 w-8 text-accent" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Downloaded Plugins</p>
                  <p className="text-2xl font-bold">{pluginDownloads?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-orange-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Available Plugins</p>
                  <p className="text-2xl font-bold">{stats?.totalPlugins || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-purple-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Community Size</p>
                  <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hosting Accounts */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center">
                  <Globe className="mr-2 h-5 w-5" />
                  Your Hosting Accounts
                </CardTitle>
                <Button
                  onClick={() => {
                    document.getElementById("create-domain")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  size="sm"
                  className="bg-primary text-white hover:bg-secondary"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create New
                </Button>
              </CardHeader>
              <CardContent>
                {accountsLoading ? (
                  <div className="space-y-4">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    ))}
                  </div>
                ) : hostingAccounts && hostingAccounts.length > 0 ? (
                  <div className="space-y-4">
                    {hostingAccounts.map((account: HostingAccount) => (
                      <div key={account.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">{account.domain}</h3>
                            <p className="text-sm text-muted-foreground">
                              Created {new Date(account.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge 
                              variant={account.status === "active" ? "default" : "secondary"}
                              className={account.status === "active" ? "bg-green-500" : ""}
                            >
                              {account.status}
                            </Badge>
                            <Button size="sm" variant="outline">
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Visit
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-muted-foreground flex items-center">
                                <HardDrive className="mr-1 h-4 w-4" />
                                Disk Usage
                              </span>
                              <span className="text-sm">
                                {formatBytes(account.diskUsage || 0)} / {formatBytes(account.diskLimit || 5120)}
                              </span>
                            </div>
                            <Progress 
                              value={getUsagePercentage(account.diskUsage || 0, account.diskLimit || 5120)} 
                              className="h-2"
                            />
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-muted-foreground flex items-center">
                                <Wifi className="mr-1 h-4 w-4" />
                                Bandwidth
                              </span>
                              <span className="text-sm">
                                {formatBytes(account.bandwidthUsed || 0)} / {formatBytes(account.bandwidthLimit || 10240)}
                              </span>
                            </div>
                            <Progress 
                              value={getUsagePercentage(account.bandwidthUsed || 0, account.bandwidthLimit || 10240)} 
                              className="h-2"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Globe className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No hosting accounts yet</h3>
                    <p className="text-gray-500 mb-4">
                      Create your first free hosting account to get started.
                    </p>
                    <Button
                      onClick={() => {
                        document.getElementById("create-domain")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="bg-primary text-white hover:bg-secondary"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First Site
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Create New Domain */}
            <Card id="create-domain">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plus className="mr-2 h-5 w-5" />
                  Create New Hosting Account
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DomainSearch 
                  onSuccess={() => {
                    // Refresh hosting accounts
                    window.location.reload();
                  }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Downloads */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Download className="mr-2 h-5 w-5" />
                  Recent Downloads
                </CardTitle>
              </CardHeader>
              <CardContent>
                {downloadsLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : pluginDownloads && pluginDownloads.length > 0 ? (
                  <div className="space-y-3">
                    {pluginDownloads.slice(0, 5).map((download: PluginDownload) => (
                      <div key={download.id} className="border-b border-gray-100 pb-2 last:border-b-0">
                        <p className="font-medium text-sm">Plugin #{download.pluginId}</p>
                        <p className="text-xs text-muted-foreground flex items-center">
                          <Calendar className="mr-1 h-3 w-3" />
                          {new Date(download.downloadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Download className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">No downloads yet</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2"
                      onClick={() => window.location.href = "/plugins"}
                    >
                      Browse Plugins
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.location.href = "/plugins"}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Browse Plugin Library
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  View Analytics
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  cPanel Access
                </Button>
              </CardContent>
            </Card>

            {/* Support */}
            <Card>
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Our community is here to help you succeed with your projects.
                </p>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full">
                    Community Forums
                  </Button>
                  <Button variant="outline" size="sm" className="w-full">
                    Documentation
                  </Button>
                  <Button variant="outline" size="sm" className="w-full">
                    Video Tutorials
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
