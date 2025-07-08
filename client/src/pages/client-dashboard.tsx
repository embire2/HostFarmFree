import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
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
  TrendingUp,
  Settings,
  Mail,
  Database,
  Link,
  Users,
  Folder,
  Clock,
  RefreshCw,
  AlertTriangle
} from "lucide-react";
import Navbar from "@/components/navbar";
import DomainSearch from "@/components/domain-search";
import { HostingAccount, PluginDownload, VpsOrder } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const emailUpdateSchema = z.object({
  email: z.string().email("Please enter a valid email address").optional().or(z.literal(""))
});

type EmailUpdateFormData = z.infer<typeof emailUpdateSchema>;

// EmailUpdateForm component
function EmailUpdateForm({ userId, currentEmail }: { userId: number; currentEmail: string | null }) {
  const { toast } = useToast();
  
  const form = useForm<EmailUpdateFormData>({
    resolver: zodResolver(emailUpdateSchema),
    defaultValues: {
      email: currentEmail || "",
    },
  });

  const updateEmailMutation = useMutation({
    mutationFn: async (data: EmailUpdateFormData) => {
      const response = await apiRequest("PATCH", `/api/user/${userId}`, {
        email: data.email || null,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Email updated!",
        description: "Your email address has been saved for communication.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EmailUpdateFormData) => {
    updateEmailMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex space-x-2">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormControl>
                <Input
                  type="email"
                  placeholder="your.email@example.com"
                  {...field}
                  className="text-sm"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          size="sm"
          disabled={updateEmailMutation.isPending}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          {updateEmailMutation.isPending ? "Saving..." : "Save Email"}
        </Button>
      </form>
    </Form>
  );
}


// AccountCard component with comprehensive WHM API statistics
function AccountCard({ account, onCpanelLogin }: { account: HostingAccount; onCpanelLogin: (domain: string) => void }) {
  const { data: accountStats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ["/api/hosting-accounts", account.id, "stats"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/hosting-accounts/${account.id}/stats`);
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 MB";
    const mb = bytes / (1024 * 1024);
    return mb < 1024 ? `${mb.toFixed(1)} MB` : `${(mb / 1024).toFixed(1)} GB`;
  };

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === 0) return 0;
    return Math.min(Math.round((used / limit) * 100), 100);
  };

  const formatMBValue = (value: number) => {
    return value < 1024 ? `${value.toFixed(1)} MB` : `${(value / 1024).toFixed(1)} GB`;
  };

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-lg">{account.domain}</h3>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span>Created {account.createdAt ? new Date(account.createdAt).toLocaleDateString() : 'N/A'}</span>
            {accountStats?.packageName && (
              <>
                <span>•</span>
                <span>Plan: {accountStats.packageName}</span>
              </>
            )}
            {accountStats?.lastUpdate && (
              <>
                <span>•</span>
                <span className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  Updated {new Date(accountStats.lastUpdate).toLocaleTimeString()}
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge 
            variant={account.status === "active" ? "default" : "secondary"}
            className={account.status === "active" ? "bg-green-500" : accountStats?.suspended ? "bg-red-500" : ""}
          >
            {accountStats?.suspended ? "Suspended" : account.status}
          </Badge>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => refetchStats()}
            disabled={statsLoading}
          >
            <RefreshCw className={`h-4 w-4 ${statsLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onCpanelLogin(account.domain)}
          >
            <Settings className="h-4 w-4 mr-1" />
            cPanel
          </Button>
          <Button size="sm" variant="outline" onClick={() => window.open(`https://${account.domain}`, '_blank')}>
            <ExternalLink className="h-4 w-4 mr-1" />
            Visit
          </Button>
        </div>
      </div>

      {statsLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-2 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : accountStats ? (
        <>
          {/* Primary Resource Usage */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-muted-foreground flex items-center">
                  <HardDrive className="mr-1 h-4 w-4" />
                  Disk Usage
                </span>
                <span className="text-sm">
                  {formatMBValue(accountStats.diskUsage)} / {formatMBValue(accountStats.diskLimit)}
                </span>
              </div>
              <Progress 
                value={getUsagePercentage(accountStats.diskUsage, accountStats.diskLimit)} 
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
                  {formatMBValue(accountStats.bandwidthUsed)} / {formatMBValue(accountStats.bandwidthLimit)}
                </span>
              </div>
              <Progress 
                value={getUsagePercentage(accountStats.bandwidthUsed, accountStats.bandwidthLimit)} 
                className="h-2"
              />
            </div>
          </div>

          {/* Detailed Services Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="flex items-center justify-center mb-1">
                <Mail className="h-4 w-4 mr-1 text-blue-500" />
                <span className="text-sm font-medium">Email</span>
              </div>
              <div className="text-lg font-bold text-blue-600">{accountStats.emailAccounts}</div>
              <div className="text-xs text-muted-foreground">of {accountStats.emailLimit}</div>
            </div>

            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="flex items-center justify-center mb-1">
                <Database className="h-4 w-4 mr-1 text-green-500" />
                <span className="text-sm font-medium">Databases</span>
              </div>
              <div className="text-lg font-bold text-green-600">{accountStats.databases}</div>
              <div className="text-xs text-muted-foreground">of {accountStats.databaseLimit}</div>
            </div>

            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="flex items-center justify-center mb-1">
                <Link className="h-4 w-4 mr-1 text-purple-500" />
                <span className="text-sm font-medium">Subdomains</span>
              </div>
              <div className="text-lg font-bold text-purple-600">{accountStats.subdomains}</div>
              <div className="text-xs text-muted-foreground">of {accountStats.subdomainLimit}</div>
            </div>

            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="flex items-center justify-center mb-1">
                <Users className="h-4 w-4 mr-1 text-orange-500" />
                <span className="text-sm font-medium">FTP Accounts</span>
              </div>
              <div className="text-lg font-bold text-orange-600">{accountStats.ftpAccounts}</div>
              <div className="text-xs text-muted-foreground">of {accountStats.ftpAccountLimit}</div>
            </div>
          </div>

          {/* Additional Domain Statistics */}
          {(accountStats.addonDomains > 0 || accountStats.parkDomains > 0) && (
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div className="text-center p-2 bg-gray-50 rounded">
                <div className="flex items-center justify-center mb-1">
                  <Globe className="h-4 w-4 mr-1 text-indigo-500" />
                  <span className="text-sm font-medium">Addon Domains</span>
                </div>
                <div className="text-lg font-bold text-indigo-600">{accountStats.addonDomains}</div>
                <div className="text-xs text-muted-foreground">of {accountStats.addonDomainLimit}</div>
              </div>

              <div className="text-center p-2 bg-gray-50 rounded">
                <div className="flex items-center justify-center mb-1">
                  <Folder className="h-4 w-4 mr-1 text-teal-500" />
                  <span className="text-sm font-medium">Parked Domains</span>
                </div>
                <div className="text-lg font-bold text-teal-600">{accountStats.parkDomains}</div>
                <div className="text-xs text-muted-foreground">of {accountStats.parkDomainLimit}</div>
              </div>
            </div>
          )}

          {/* Data Source and IP Information */}
          <div className="text-xs text-muted-foreground border-t pt-2 flex justify-between items-center">
            <span>
              Source: {accountStats.source === 'whm_api' ? 'Live WHM Data' : 
                       accountStats.source === 'database_fallback' ? 'Database Cache' : 'Default Values'}
              {accountStats.ip && ` • IP: ${accountStats.ip}`}
            </span>
            {accountStats.error && (
              <span className="text-yellow-600 font-medium">{accountStats.error}</span>
            )}
          </div>
        </>
      ) : (
        <div className="text-center py-4 text-muted-foreground">
          Failed to load account statistics
        </div>
      )}
    </div>
  );
}

export default function ClientDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [showActivationMessage, setShowActivationMessage] = useState(false);
  const [activationCountdown, setActivationCountdown] = useState(120); // 2 minutes
  const [tempCredentials, setTempCredentials] = useState<any>(null);


  // Handle automatic domain creation from URL parameter
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      const urlParams = new URLSearchParams(window.location.search);
      const domainParam = urlParams.get('domain');
      const activationParam = urlParams.get('activation');
      
      // Show activation message if coming from account creation
      if (activationParam === 'true') {
        setShowActivationMessage(true);
        // Clear the URL parameter
        window.history.replaceState({}, '', '/');
      }
      
      if (domainParam && !isCreatingAccount) {
        setIsCreatingAccount(true);
        
        // Clear the URL parameter
        window.history.replaceState({}, '', '/');
        
        // Create the hosting account automatically
        apiRequest("POST", "/api/hosting-accounts", {
          subdomain: domainParam,
          packageId: 1 // Default free package
        })
        .then(response => response.json())
        .then(data => {
          if (data.account) {
            toast({
              title: "Hosting Account Created!",
              description: `Your website ${data.domain} has been created successfully. It may take up to 2 minutes to activate.`,
            });
            setShowActivationMessage(true);
            queryClient.invalidateQueries({ queryKey: ["/api/hosting-accounts"] });
          }
        })
        .catch(error => {
          console.error('Error creating hosting account:', error);
          toast({
            title: "Error Creating Account",
            description: "There was an error creating your hosting account. Please try again.",
            variant: "destructive",
          });
        })
        .finally(() => {
          setIsCreatingAccount(false);
        });
      }
    }
  }, [isAuthenticated, isLoading, user, toast, isCreatingAccount]);

  // Countdown timer for activation message
  useEffect(() => {
    if (showActivationMessage && activationCountdown > 0) {
      const timer = setTimeout(() => {
        setActivationCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (showActivationMessage && activationCountdown === 0) {
      // Auto-refresh hosting accounts after countdown
      queryClient.invalidateQueries({ queryKey: ["/api/hosting-accounts"] });
      setShowActivationMessage(false);
      setActivationCountdown(120); // Reset for next time
    }
  }, [showActivationMessage, activationCountdown, queryClient]);

  // Check for temporary credentials from recent registration
  useEffect(() => {
    const storedCredentials = localStorage.getItem('tempCredentials');
    if (storedCredentials) {
      try {
        const credentials = JSON.parse(storedCredentials);
        const now = Date.now();
        const fiveMinutesAgo = now - (5 * 60 * 1000); // 5 minutes
        
        // Only show credentials if they're less than 5 minutes old
        if (credentials.timestamp > fiveMinutesAgo) {
          setTempCredentials(credentials);
        } else {
          // Clean up old credentials
          localStorage.removeItem('tempCredentials');
        }
      } catch (error) {
        console.error('Error parsing stored credentials:', error);
        localStorage.removeItem('tempCredentials');
      }
    }
  }, []);

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

  // Force refresh user data to ensure displayPassword is loaded
  useEffect(() => {
    if (isAuthenticated && user) {
      // Only refresh if user doesn't have displayPassword yet
      if (!user.displayPassword) {
        console.log('[Client Dashboard] Refreshing user data to get displayPassword...');
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      }
    }
  }, [isAuthenticated, user]);

  const { data: hostingAccounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ["/api/hosting-accounts"],
    enabled: isAuthenticated,
  });

  const { data: pluginDownloads = [], isLoading: downloadsLoading } = useQuery({
    queryKey: ["/api/plugin-downloads"],
    enabled: isAuthenticated,
  });

  // Fetch VPS orders for this user
  const { data: vpsOrders = [] } = useQuery<VpsOrder[]>({
    queryKey: [`/api/vps-orders/by-email/${user?.email}`],
    enabled: isAuthenticated && !!user?.email,
  });

  const { data: stats = {} } = useQuery({
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

  const handleCpanelLogin = async (domain: string) => {
    try {
      console.log(`[Client Dashboard] Starting cPanel login for domain: ${domain}`);
      
      const res = await apiRequest("POST", "/api/cpanel-login", { domain });
      const data = await res.json();
      
      console.log(`[Client Dashboard] cPanel login response:`, {
        status: res.status,
        ok: res.ok,
        hasLoginUrl: !!data.loginUrl,
        message: data.message,
        data: data
      });
      
      if (res.ok && data.loginUrl) {
        // Open cPanel in a new tab with auto-login
        console.log(`[Client Dashboard] Opening cPanel URL: ${data.loginUrl}`);
        window.open(data.loginUrl, '_blank');
        
        toast({
          title: "cPanel Access",
          description: data.message || "Opening cPanel in a new tab...",
        });
      } else {
        const errorMessage = data.message || data.debug || "Failed to generate cPanel login URL";
        console.error(`[Client Dashboard] cPanel login failed:`, {
          status: res.status,
          message: data.message,
          debug: data.debug,
          fullResponse: data
        });
        
        // If we have a username, show it to help with manual login
        if (data.username) {
          toast({
            title: "cPanel Login",
            description: `Opening cPanel for manual login. Username: ${data.username}`,
            variant: "default",
          });
          
          // Still open the URL even if auto-login failed
          if (data.loginUrl) {
            window.open(data.loginUrl, '_blank');
          }
        } else {
          throw new Error(errorMessage);
        }
      }
    } catch (error) {
      console.error("[Client Dashboard] cPanel login error:", error);
      
      // Extract detailed error information
      let errorMessage = "Could not access cPanel";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = JSON.stringify(error);
      }
      
      toast({
        title: "cPanel Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Email Collection Banner for users without email */}
        {user && !user.email && (
          <div className="mb-8">
            <Card className="border-red-500 bg-red-100 dark:bg-red-900/30">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">
                      🚨 Email Address Required
                    </h3>
                    <p className="text-red-800 dark:text-red-200 mb-3">
                      Add your email address to receive important hosting notifications, security alerts, and account updates.
                    </p>
                    <EmailUpdateForm userId={user.id} currentEmail={user.email} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-dark mb-2">
            Welcome Back Farmer!
          </h1>
          <p className="text-gray-600">
            Manage your hosting accounts, download plugins, and monitor your websites.
          </p>
        </div>





        {/* Activation Message */}
        {showActivationMessage && (
          <div className="mb-8">
            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <Clock className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                      Account Activation in Progress
                    </h3>
                    <p className="text-blue-700 dark:text-blue-200 mt-1">
                      Your hosting account is being set up. This may take up to 2 minutes to complete.
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-300 mt-2">
                      Auto-refreshing in {Math.floor(activationCountdown / 60)}:{(activationCountdown % 60).toString().padStart(2, '0')}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      queryClient.invalidateQueries({ queryKey: ["/api/hosting-accounts"] });
                      toast({
                        title: "Refreshed",
                        description: "Checking for account activation...",
                      });
                    }}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Account Credentials Box - Only for anonymous users */}
        {user?.isAnonymous && (
          <div className="mb-8">
            <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <Users className="h-8 w-8 text-red-600" />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
                        ⚠️ Critical: Your Account Credentials
                      </h3>
                      <p className="text-red-700 dark:text-red-200 text-sm mb-4">
                        <strong>Save these details immediately!</strong> There is no way to recover your account without them.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-red-800 dark:text-red-200">Username</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={user.username}
                            readOnly
                            className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md font-mono text-sm"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              navigator.clipboard.writeText(user.username);
                              toast({
                                title: "Copied!",
                                description: "Username copied to clipboard",
                              });
                            }}
                          >
                            Copy
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-red-800 dark:text-red-200">Password</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={user.displayPassword || "Contact support for password"}
                            readOnly
                            className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md font-mono text-sm"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!user.displayPassword}
                            onClick={() => {
                              if (user.displayPassword) {
                                navigator.clipboard.writeText(user.displayPassword);
                                toast({
                                  title: "Copied!",
                                  description: "Password copied to clipboard",
                                });
                              }
                            }}
                          >
                            {user.displayPassword ? "Copy" : "N/A"}
                          </Button>
                        </div>
                        <p className="text-xs text-red-600 dark:text-red-300">
                          ⚠️ Save this password! You'll need it to access your hosting accounts.
                        </p>
                      </div>
                    </div>

                    {user.recoveryPhrase && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-red-800 dark:text-red-200">Recovery Phrase (Keep Secret!)</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={user.recoveryPhrase}
                            readOnly
                            className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md font-mono text-sm"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              navigator.clipboard.writeText(user.recoveryPhrase || '');
                              toast({
                                title: "Copied!",
                                description: "Recovery phrase copied to clipboard",
                              });
                            }}
                          >
                            Copy
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="border-t border-red-200 dark:border-red-800 pt-4">
                      <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">
                        Optional: Provide Email for Communication
                      </h4>
                      <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                        We can use your email strictly for important hosting updates and security notifications.
                      </p>
                      <EmailUpdateForm userId={user.id} currentEmail={user.email} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Globe className="h-8 w-8 text-primary" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Active Sites</p>
                  <p className="text-2xl font-bold">{Array.isArray(hostingAccounts) ? hostingAccounts.length : 0}</p>
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
                  <p className="text-2xl font-bold">{Array.isArray(pluginDownloads) ? pluginDownloads.length : 0}</p>
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
                  <p className="text-2xl font-bold">{(stats as any)?.totalPlugins || 0}</p>
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
                  <p className="text-2xl font-bold">{(stats as any)?.totalUsers || 0}</p>
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
                ) : Array.isArray(hostingAccounts) && hostingAccounts.length > 0 ? (
                  <div className="space-y-4">
                    {hostingAccounts.map((account: HostingAccount) => (
                      <AccountCard key={account.id} account={account} onCpanelLogin={handleCpanelLogin} />
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
            {/* VPS Orders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="mr-2 h-5 w-5" />
                  VPS Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                {vpsOrders.length > 0 ? (
                  <div className="space-y-3">
                    {vpsOrders.slice(0, 3).map((order: VpsOrder) => (
                      <div key={order.id} className="border-b border-gray-100 pb-2 last:border-b-0">
                        <div className="flex justify-between items-center mb-1">
                          <p className="font-medium text-sm">{order.packageName}</p>
                          <Badge 
                            variant={order.status === "active" ? "default" : order.status === "pending" ? "secondary" : "destructive"}
                            className={
                              order.status === "active" ? "bg-green-500 text-xs" : 
                              order.status === "pending" ? "bg-orange-500 text-xs" : 
                              "bg-red-500 text-xs"
                            }
                          >
                            {order.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center">
                          <Calendar className="mr-1 h-3 w-3" />
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground">${(order.packagePrice / 100).toFixed(2)}/month</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Database className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-muted-foreground">No VPS orders yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

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
                ) : Array.isArray(pluginDownloads) && pluginDownloads.length > 0 ? (
                  <div className="space-y-3">
                    {pluginDownloads.slice(0, 5).map((download: PluginDownload) => (
                      <div key={download.id} className="border-b border-gray-100 pb-2 last:border-b-0">
                        <p className="font-medium text-sm">Plugin #{download.pluginId}</p>
                        <p className="text-xs text-muted-foreground flex items-center">
                          <Calendar className="mr-1 h-3 w-3" />
                          {download.downloadedAt ? new Date(download.downloadedAt).toLocaleDateString() : 'N/A'}
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
