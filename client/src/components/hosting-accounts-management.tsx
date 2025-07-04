import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Globe,
  Trash2,
  Edit,
  HardDrive,
  Wifi,
  Mail,
  Database,
  Link,
  Users,
  Calendar,
  Server,
  AlertTriangle,
  CheckCircle,
  Clock,
  ExternalLink,
  Loader2,
  RefreshCw,
  Plus,
  UserPlus,
  Package,
  Settings,
  Search
} from "lucide-react";

import type { User, HostingPackage } from "@shared/schema";
import CredentialsModal from "@/components/credentials-modal";

interface HostingAccount {
  id: number;
  domain: string;
  subdomain: string;
  status: string;
  packageId?: number;
  diskUsage?: number;
  diskLimit?: number;
  bandwidthUsed?: number;
  bandwidthLimit?: number;
  createdAt: string;
  updatedAt?: string;
}

interface ClientWithAccounts {
  user: User;
  hostingAccounts: HostingAccount[];
}

export default function HostingAccountsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newAccountData, setNewAccountData] = useState({
    domain: "",
    packageId: "",
    userId: "",
    createAnonymous: false
  });
  const [credentialsModal, setCredentialsModal] = useState({
    isOpen: false,
    credentials: null as {
      username: string;
      password: string;
      recoveryPhrase: string;
    } | null
  });
  
  // State for subdomain search
  const [subdomainInput, setSubdomainInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<{ available: boolean; message: string } | null>(null);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Fetch hosting accounts grouped by client
  const { data: clientAccounts = [], isLoading, refetch } = useQuery<ClientWithAccounts[]>({
    queryKey: ["/api/admin/hosting-accounts"],
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch all users for account creation
  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  // Fetch hosting packages for package selection
  const { data: hostingPackages = [] } = useQuery<HostingPackage[]>({
    queryKey: ["/api/admin/packages"],
  });

  // Create anonymous account mutation
  const createAnonymousAccountMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/create-anonymous-account");
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      // Show credentials modal instead of toast
      setCredentialsModal({
        isOpen: true,
        credentials: {
          username: data.username,
          password: data.password,
          recoveryPhrase: data.recoveryPhrase
        }
      });
      setNewAccountData(prev => ({ ...prev, userId: data.id.toString() }));
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Create Anonymous Account",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create hosting account mutation with WHM integration
  const createHostingAccountMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/create-hosting-account", data);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hosting-accounts"] });
      toast({
        title: "Hosting Account Created Successfully",
        description: `${data.domain} has been created with WHM integration`,
      });
      setNewAccountData({
        domain: "",
        packageId: "",
        userId: "",
        createAnonymous: false
      });
      // Clear search state
      setSubdomainInput("");
      setSearchResult(null);
      if (searchTimeout) {
        clearTimeout(searchTimeout);
        setSearchTimeout(null);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Create Hosting Account",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete hosting account mutation with WHM integration
  const deleteAccountMutation = useMutation({
    mutationFn: async (accountId: number) => {
      const res = await apiRequest("DELETE", `/api/admin/hosting-accounts/${accountId}`);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hosting-accounts"] });
      toast({
        title: "Account Deleted Successfully",
        description: `${data.deletedAccount.domain} has been completely removed from both the system and WHM`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Deletion Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Search for subdomain availability with debouncing
  const searchSubdomainAvailability = (subdomain: string) => {
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Reset search state
    setSearchResult(null);
    setNewAccountData(prev => ({ ...prev, domain: "" }));

    // Validate subdomain input
    if (!subdomain || subdomain.length < 3) {
      if (subdomain.length > 0 && subdomain.length < 3) {
        setSearchResult({
          available: false,
          message: "Subdomain must be at least 3 characters long"
        });
      }
      return;
    }

    // Additional validation for subdomain format
    if (!/^[a-z0-9-]+$/.test(subdomain) || subdomain.startsWith('-') || subdomain.endsWith('-')) {
      setSearchResult({
        available: false,
        message: "Subdomain can only contain letters, numbers, and hyphens (not at start or end)"
      });
      return;
    }

    setIsSearching(true);
    
    // Debounce the search by 500ms
    const timeout = setTimeout(async () => {
      try {
        const fullDomain = `${subdomain}.hostme.today`;
        const res = await apiRequest("POST", "/api/check-domain-availability", { domain: fullDomain });
        
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
        const data = await res.json();
        
        if (typeof data.available !== 'boolean') {
          throw new Error('Invalid response format from server');
        }
        
        setSearchResult({
          available: data.available,
          message: data.message || (data.available 
            ? `${fullDomain} is available!` 
            : `${fullDomain} is already taken`)
        });
        
        // Update the domain in the form data if available
        if (data.available) {
          setNewAccountData(prev => ({ ...prev, domain: fullDomain }));
        } else {
          setNewAccountData(prev => ({ ...prev, domain: "" }));
        }
      } catch (error) {
        console.error('Domain availability check failed:', error);
        
        // Provide more specific error messages
        let errorMessage = "Error checking availability";
        if (error instanceof Error) {
          if (error.message.includes('Failed to fetch')) {
            errorMessage = "Network error - please check your connection";
          } else if (error.message.includes('500')) {
            errorMessage = "Server error - please try again";
          } else if (error.message.includes('404')) {
            errorMessage = "Service temporarily unavailable";
          } else {
            errorMessage = `Error: ${error.message}`;
          }
        }
        
        setSearchResult({
          available: false,
          message: errorMessage
        });
        setNewAccountData(prev => ({ ...prev, domain: "" }));
      } finally {
        setIsSearching(false);
      }
    }, 500);

    setSearchTimeout(timeout);
  };

  const handleDeleteAccount = (account: HostingAccount, clientName: string) => {
    console.log(`Deleting hosting account: ${account.domain} (ID: ${account.id}) for client: ${clientName}`);
  };

  // cPanel login functionality
  const handleCpanelLogin = async (domain: string) => {
    try {
      console.log(`[Frontend] Starting cPanel login for domain: ${domain}`);
      
      const res = await apiRequest("POST", "/api/cpanel-login", { domain });
      const data = await res.json();
      
      console.log(`[Frontend] cPanel login response:`, {
        status: res.status,
        ok: res.ok,
        hasLoginUrl: !!data.loginUrl,
        message: data.message,
        data: data
      });
      
      if (res.ok && data.loginUrl) {
        // Open cPanel in a new tab with auto-login
        console.log(`[Frontend] Opening cPanel URL: ${data.loginUrl}`);
        window.open(data.loginUrl, '_blank');
        
        toast({
          title: "cPanel Access",
          description: data.message || "Opening cPanel in a new tab...",
        });
      } else {
        const errorMessage = data.message || data.debug || "Failed to generate cPanel login URL";
        console.error(`[Frontend] cPanel login failed:`, {
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
      console.error("[Frontend] cPanel login error:", error);
      
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

  const handleCreateAnonymousAccount = async () => {
    createAnonymousAccountMutation.mutate();
  };

  const handleCreateHostingAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subdomainInput || subdomainInput.length < 3) {
      toast({
        title: "Invalid Subdomain",
        description: "Please enter a subdomain (minimum 3 characters)",
        variant: "destructive",
      });
      return;
    }

    if (!newAccountData.domain || !newAccountData.packageId) {
      toast({
        title: "Missing Information",
        description: "Please wait for domain availability check and select a package",
        variant: "destructive",
      });
      return;
    }

    if (searchResult && !searchResult.available) {
      toast({
        title: "Domain Not Available",
        description: "The selected subdomain is already taken. Please choose a different one.",
        variant: "destructive",
      });
      return;
    }

    if (!newAccountData.userId && !newAccountData.createAnonymous) {
      toast({
        title: "Missing User",
        description: "Please select a user or create an anonymous account first",
        variant: "destructive",
      });
      return;
    }

    const accountData = {
      domain: newAccountData.domain,
      packageId: parseInt(newAccountData.packageId),
      userId: newAccountData.userId ? parseInt(newAccountData.userId) : undefined,
    };

    createHostingAccountMutation.mutate(accountData);
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes) return "0 MB";
    const mb = bytes / (1024 * 1024);
    return mb < 1024 ? `${mb.toFixed(1)} MB` : `${(mb / 1024).toFixed(1)} GB`;
  };

  const getUsagePercentage = (used?: number, limit?: number) => {
    if (!used || !limit || limit === 0) return 0;
    return Math.min(Math.round((used / limit) * 100), 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "suspended":
        return "bg-red-500";
      case "pending":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const getTotalAccountsCount = () => {
    return clientAccounts.reduce((total, client) => total + client.hostingAccounts.length, 0);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading hosting accounts...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Hosting Accounts Management</h2>
          <p className="text-muted-foreground">
            Manage client hosting accounts with WHM integration
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="text-sm">
            {getTotalAccountsCount()} Total Accounts
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Account Creation Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Plus className="mr-2 h-5 w-5" />
            Create New Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="hosting" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="hosting" className="flex items-center">
                <Globe className="mr-2 h-4 w-4" />
                Hosting Account
              </TabsTrigger>
              <TabsTrigger value="anonymous" className="flex items-center">
                <UserPlus className="mr-2 h-4 w-4" />
                Anonymous User
              </TabsTrigger>
            </TabsList>

            <TabsContent value="hosting" className="space-y-4 mt-6">
              <form onSubmit={handleCreateHostingAccount} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="subdomain">Subdomain</Label>
                    <div className="relative">
                      <Input
                        id="subdomain"
                        placeholder="Enter subdomain (e.g., mysite)"
                        value={subdomainInput}
                        onChange={(e) => {
                          const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                          setSubdomainInput(value);
                          searchSubdomainAvailability(value);
                        }}
                        className="pr-10"
                        required
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        {isSearching ? (
                          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                        ) : (
                          <Search className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="text-muted-foreground mr-1">Domain:</span>
                      <code className="bg-muted px-2 py-1 rounded text-xs">
                        {subdomainInput || 'subdomain'}.hostme.today
                      </code>
                    </div>
                    {searchResult && (
                      <div className={`flex items-center text-sm mt-2 ${
                        searchResult.available ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {searchResult.available ? (
                          <CheckCircle className="h-4 w-4 mr-1" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 mr-1" />
                        )}
                        {searchResult.message}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="package">Hosting Package</Label>
                    <Select 
                      value={newAccountData.packageId} 
                      onValueChange={(value) => setNewAccountData(prev => ({ ...prev, packageId: value }))}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a package" />
                      </SelectTrigger>
                      <SelectContent>
                        {hostingPackages.map((pkg: any) => (
                          <SelectItem key={pkg.id} value={pkg.id.toString()}>
                            {pkg.displayName} - {pkg.price === 0 ? "Free" : `$${pkg.price}/month`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="user">Assign to User</Label>
                  <Select 
                    value={newAccountData.userId} 
                    onValueChange={(value) => setNewAccountData(prev => ({ ...prev, userId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an existing user or create anonymous account" />
                    </SelectTrigger>
                    <SelectContent>
                      {allUsers.map((user: any) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.username} ({user.email || "No email"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground mt-1">
                    Select a user to assign this hosting account to, or create an anonymous account first
                  </p>
                </div>

                <Button 
                  type="submit" 
                  disabled={
                    createHostingAccountMutation.isPending || 
                    isSearching || 
                    !subdomainInput ||
                    subdomainInput.length < 3 ||
                    (searchResult && !searchResult.available) ||
                    !newAccountData.packageId ||
                    !newAccountData.userId
                  }
                  className="w-full"
                >
                  {createHostingAccountMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : isSearching ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking Availability...
                    </>
                  ) : (
                    <>
                      <Globe className="mr-2 h-4 w-4" />
                      Create Hosting Account
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="anonymous" className="space-y-4 mt-6">
              <div className="text-center space-y-4">
                <div className="p-6 border rounded-lg bg-muted/50">
                  <UserPlus className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
                  <h3 className="font-medium mb-2">Create Anonymous Account</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Generate a new anonymous user account with auto-generated credentials.
                    The username and password will be displayed after creation.
                  </p>
                  <Button 
                    onClick={handleCreateAnonymousAccount}
                    disabled={createAnonymousAccountMutation.isPending}
                    className="w-full"
                  >
                    {createAnonymousAccountMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Anonymous Account...
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Create Anonymous Account
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  <p><strong>Note:</strong> After creating an anonymous account, you can use it to create a hosting account in the "Hosting Account" tab.</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Client Accounts Grid */}
      {clientAccounts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Server className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Hosting Accounts</h3>
            <p className="text-gray-500">No clients have hosting accounts yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {clientAccounts.map((client) => (
            <Card key={client.user.id} className="overflow-hidden">
              <CardHeader className="bg-gray-50 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-semibold">
                      {client.user.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {client.user.firstName && client.user.lastName 
                          ? `${client.user.firstName} ${client.user.lastName}` 
                          : client.user.username}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {client.user.email} • {client.user.role}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-sm">
                    {client.hostingAccounts.length} Account{client.hostingAccounts.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {client.hostingAccounts.map((account) => (
                    <div key={account.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      {/* Account Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-base">{account.domain}</h4>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>Created {new Date(account.createdAt).toLocaleDateString()}</span>
                            {account.updatedAt && (
                              <>
                                <span>•</span>
                                <Clock className="h-3 w-3" />
                                <span>Updated {new Date(account.updatedAt).toLocaleDateString()}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant="secondary"
                            className={`${getStatusColor(account.status)} text-white`}
                          >
                            {account.status.toUpperCase()}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`https://${account.domain}`, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Resource Usage */}
                      <div className="space-y-3 mb-4">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-muted-foreground flex items-center">
                              <HardDrive className="mr-1 h-3 w-3" />
                              Disk Usage
                            </span>
                            <span className="text-xs">
                              {formatBytes(account.diskUsage)} / {formatBytes(account.diskLimit)}
                            </span>
                          </div>
                          <Progress 
                            value={getUsagePercentage(account.diskUsage, account.diskLimit)} 
                            className="h-1"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-muted-foreground flex items-center">
                              <Wifi className="mr-1 h-3 w-3" />
                              Bandwidth
                            </span>
                            <span className="text-xs">
                              {formatBytes(account.bandwidthUsed)} / {formatBytes(account.bandwidthLimit)}
                            </span>
                          </div>
                          <Progress 
                            value={getUsagePercentage(account.bandwidthUsed, account.bandwidthLimit)} 
                            className="h-1"
                          />
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="text-xs text-muted-foreground">
                          ID: {account.id} • Package: {account.packageId || 'Default'}
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2"
                            onClick={() => handleCpanelLogin(account.domain)}
                            title="Access cPanel"
                          >
                            <Settings className="h-3 w-3 mr-1" />
                            cPanel
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 w-7 p-0"
                            disabled
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                disabled={deleteAccountMutation.isPending}
                              >
                                {deleteAccountMutation.isPending ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3 w-3" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center">
                                  <AlertTriangle className="mr-2 h-5 w-5 text-red-500" />
                                  Delete Hosting Account
                                </AlertDialogTitle>
                                <AlertDialogDescription className="space-y-2">
                                  <p>
                                    Are you sure you want to delete the hosting account <strong>{account.domain}</strong>?
                                  </p>
                                  <div className="bg-red-50 p-3 rounded-md border border-red-200">
                                    <p className="text-sm text-red-800 font-medium">
                                      ⚠️ This action will:
                                    </p>
                                    <ul className="text-sm text-red-700 mt-1 ml-4 list-disc">
                                      <li>Permanently delete the account from WHM server</li>
                                      <li>Remove all website files and databases</li>
                                      <li>Delete all email accounts and data</li>
                                      <li>Remove the account from our system</li>
                                    </ul>
                                    <p className="text-sm text-red-800 font-medium mt-2">
                                      This action cannot be undone!
                                    </p>
                                  </div>
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => {
                                    handleDeleteAccount(account, client.user.username);
                                    deleteAccountMutation.mutate(account.id);
                                  }}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete Account
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Credentials Modal */}
      <CredentialsModal
        isOpen={credentialsModal.isOpen}
        onClose={() => setCredentialsModal({ isOpen: false, credentials: null })}
        credentials={credentialsModal.credentials}
      />
    </div>
  );
}