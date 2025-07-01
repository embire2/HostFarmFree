import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Upload, 
  Server, 
  Heart,
  Plus,
  Download,
  Eye,
  ExternalLink,
  Settings,
  BarChart3,
  Globe,
  Puzzle,
  Loader2
} from "lucide-react";
import Navbar from "@/components/navbar";
import { apiRequest } from "@/lib/queryClient";
import ApiSettings from "@/components/api-settings";
import PackageManagement from "@/components/package-management";

export default function AdminDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const whmLoginMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/whm-login");
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.loginUrl) {
        window.open(data.loginUrl, '_blank', 'noopener,noreferrer');
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to open WHM",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleOpenWHM = () => {
    whmLoginMutation.mutate();
  };

  const [pluginData, setPluginData] = useState({
    name: "",
    description: "",
    category: "",
    version: "",
    author: "HostFarm.org", // Hardcoded as requested
    imageUrl: "",
  });
  const [pluginFile, setPluginFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "admin")) {
      toast({
        title: "Unauthorized",
        description: "Admin access required.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  const { data: stats = {} } = useQuery({
    queryKey: ["/api/stats"],
  });

  const { data: plugins = [] } = useQuery({
    queryKey: ["/api/plugins"],
  });

  const { data: donations = [] } = useQuery({
    queryKey: ["/api/admin/donations"],
    enabled: isAuthenticated && user?.role === "admin",
  });

  const uploadPluginMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await apiRequest("POST", "/api/admin/plugins", formData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Plugin uploaded successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/plugins"] });
      setPluginData({
        name: "",
        description: "",
        category: "",
        version: "",
        author: "",
        imageUrl: "",
      });
      setPluginFile(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePluginUpload = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pluginFile) {
      toast({
        title: "Error",
        description: "Please select a plugin file.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("pluginFile", pluginFile);
    Object.entries(pluginData).forEach(([key, value]) => {
      formData.append(key, value);
    });

    uploadPluginMutation.mutate(formData);
  };

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

  const categories = [
    "e-commerce",
    "seo",
    "page-builder", 
    "forms",
    "security",
    "backup",
    "analytics",
    "social",
    "performance",
    "other"
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Admin Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-dark mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">
            Manage users, plugins, and system settings for HostFarm.org
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-primary" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{(stats as any)?.totalUsers || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Puzzle className="h-8 w-8 text-accent" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Active Plugins</p>
                  <p className="text-2xl font-bold">{(stats as any)?.totalPlugins || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Globe className="h-8 w-8 text-orange-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Active Websites</p>
                  <p className="text-2xl font-bold">{(stats as any)?.totalWebsites || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Heart className="h-8 w-8 text-red-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Donations</p>
                  <p className="text-2xl font-bold">
                    ${(((stats as any)?.totalDonations || 0) / 100).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Tabs */}
        <Tabs defaultValue="packages" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="packages" className="flex items-center">
              <Puzzle className="mr-2 h-4 w-4" />
              Packages
            </TabsTrigger>
            <TabsTrigger value="plugins" className="flex items-center">
              <Upload className="mr-2 h-4 w-4" />
              Plugin Management
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center">
              <Users className="mr-2 h-4 w-4" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="donations" className="flex items-center">
              <Heart className="mr-2 h-4 w-4" />
              Donations
            </TabsTrigger>
            <TabsTrigger value="api-settings" className="flex items-center">
              <Settings className="mr-2 h-4 w-4" />
              API Settings
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center">
              <Server className="mr-2 h-4 w-4" />
              System
            </TabsTrigger>
          </TabsList>

          <TabsContent value="packages" className="space-y-6">
            <PackageManagement />
          </TabsContent>

          <TabsContent value="plugins" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Upload Plugin Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Plus className="mr-2 h-5 w-5" />
                    Upload New Plugin
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePluginUpload} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Plugin Name</Label>
                      <Input
                        id="name"
                        value={pluginData.name}
                        onChange={(e) => setPluginData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., WooCommerce Pro"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={pluginData.description}
                        onChange={(e) => setPluginData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Brief description of the plugin"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Select 
                          value={pluginData.category}
                          onValueChange={(value) => setPluginData(prev => ({ ...prev, category: value }))}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' ')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="version">Version</Label>
                        <Input
                          id="version"
                          value={pluginData.version}
                          onChange={(e) => setPluginData(prev => ({ ...prev, version: e.target.value }))}
                          placeholder="e.g., 1.0.0"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="author">Author</Label>
                      <Input
                        id="author"
                        value={pluginData.author}
                        onChange={(e) => setPluginData(prev => ({ ...prev, author: e.target.value }))}
                        placeholder="Plugin author"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="imageUrl">Image URL (optional)</Label>
                      <Input
                        id="imageUrl"
                        type="url"
                        value={pluginData.imageUrl}
                        onChange={(e) => setPluginData(prev => ({ ...prev, imageUrl: e.target.value }))}
                        placeholder="https://example.com/plugin-image.jpg"
                      />
                    </div>

                    <div>
                      <Label htmlFor="pluginFile">Plugin File (.zip)</Label>
                      <Input
                        id="pluginFile"
                        type="file"
                        accept=".zip"
                        onChange={(e) => setPluginFile(e.target.files?.[0] || null)}
                        required
                      />
                    </div>

                    <Button 
                      type="submit" 
                      disabled={uploadPluginMutation.isPending}
                      className="w-full bg-primary text-white hover:bg-secondary"
                    >
                      {uploadPluginMutation.isPending ? "Uploading..." : "Upload Plugin"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Plugin List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Puzzle className="mr-2 h-5 w-5" />
                    Recent Plugins
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {plugins ? (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {Array.isArray(plugins) && plugins.slice(0, 10).map((plugin: any) => (
                        <div key={plugin.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-semibold">{plugin.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                v{plugin.version} • {plugin.category}
                              </p>
                            </div>
                            <Badge variant="outline">
                              <Download className="mr-1 h-3 w-3" />
                              {plugin.downloadCount || 0}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">{plugin.description}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Puzzle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-500">No plugins uploaded yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  User Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">User Management</h3>
                  <p className="text-gray-500 mb-4">
                    User management features will be available in the next update.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-md mx-auto">
                    <Button variant="outline" size="sm" disabled>
                      <Eye className="mr-2 h-4 w-4" />
                      View Users
                    </Button>
                    <Button variant="outline" size="sm" disabled>
                      <Settings className="mr-2 h-4 w-4" />
                      Manage Roles
                    </Button>
                    <Button variant="outline" size="sm" disabled>
                      <BarChart3 className="mr-2 h-4 w-4" />
                      User Analytics
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="donations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Heart className="mr-2 h-5 w-5" />
                  Donation Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Array.isArray(donations) && donations.length > 0 ? (
                  <div className="space-y-4">
                    {donations.map((donation: any) => (
                      <div key={donation.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">
                              ${(donation.amount / 100).toFixed(2)} {donation.currency}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {donation.donorEmail || "Anonymous"} • {new Date(donation.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge 
                            variant={donation.status === "completed" ? "default" : "secondary"}
                            className={donation.status === "completed" ? "bg-green-500" : ""}
                          >
                            {donation.status}
                          </Badge>
                        </div>
                        {donation.message && (
                          <p className="mt-2 text-sm text-gray-600">"{donation.message}"</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Heart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500">No donations yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api-settings" className="space-y-6">
            <ApiSettings />
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Server className="mr-2 h-5 w-5" />
                  System Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-dashed">
                    <CardContent className="p-6 text-center">
                      <Server className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                      <h3 className="font-medium mb-1">WHM Integration</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Monitor and manage hosting infrastructure
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleOpenWHM}
                        disabled={whmLoginMutation.isPending}
                        className="flex items-center gap-2"
                      >
                        {whmLoginMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ExternalLink className="h-4 w-4" />
                        )}
                        Open WHM Panel
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-dashed">
                    <CardContent className="p-6 text-center">
                      <BarChart3 className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                      <h3 className="font-medium mb-1">System Analytics</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        View detailed system performance metrics
                      </p>
                      <Button variant="outline" size="sm" disabled>
                        View Analytics
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-dashed">
                    <CardContent className="p-6 text-center">
                      <Settings className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                      <h3 className="font-medium mb-1">System Settings</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Configure system-wide settings and preferences
                      </p>
                      <Button variant="outline" size="sm" disabled>
                        Open Settings
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-dashed">
                    <CardContent className="p-6 text-center">
                      <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                      <h3 className="font-medium mb-1">Backup Management</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Schedule and manage system backups
                      </p>
                      <Button variant="outline" size="sm" disabled>
                        Manage Backups
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button 
                variant="outline"
                onClick={() => window.location.href = "/client"}
              >
                <Eye className="mr-2 h-4 w-4" />
                View as Client
              </Button>
              <Button variant="outline" disabled>
                <Server className="mr-2 h-4 w-4" />
                Server Status
              </Button>
              <Button variant="outline" disabled>
                <BarChart3 className="mr-2 h-4 w-4" />
                Generate Report
              </Button>
              <Button variant="outline" disabled>
                <Settings className="mr-2 h-4 w-4" />
                System Maintenance
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
