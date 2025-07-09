import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Server, 
  Plus, 
  Edit, 
  Trash2, 
  Copy,
  Settings, 
  CreditCard,
  Cpu,
  HardDrive,
  MemoryStick,
  DollarSign,
  Save,
  X
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface VpsPackage {
  id: number;
  name: string;
  displayName: string;
  description: string;
  price: number;
  currency: string;
  vcpu: string;
  memory: number;
  storage: number;
  additionalStorage: number;
  ipv4Addresses: number;
  trafficPort: string;
  osChoices: string;
  isAnonymous: boolean;
  stripePriceId: string;
  isActive: boolean;
  sortOrder: number;
}

interface VpsOrder {
  id: number;
  customerEmail: string;
  packageName: string;
  status: string;
  subscriptionStatus: string;
  packagePrice: number;
  createdAt: string;
  operatingSystem: string;
  stripeSubscriptionId: string;
}

interface StripeSettings {
  publicKey: string;
  secretKey: string;
  webhookSecret: string;
  isTestMode: boolean;
}

export default function VpsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingPackage, setEditingPackage] = useState<VpsPackage | null>(null);
  const [isCreatingPackage, setIsCreatingPackage] = useState(false);
  const [duplicatingPackage, setDuplicatingPackage] = useState<VpsPackage | null>(null);
  const [stripeSettings, setStripeSettings] = useState<StripeSettings>({
    publicKey: "",
    secretKey: "",
    webhookSecret: "",
    isTestMode: true
  });

  // Fetch VPS packages
  const { data: packages = [], isLoading: packagesLoading } = useQuery<VpsPackage[]>({
    queryKey: ["/api/admin/vps-packages"],
    queryFn: () => apiRequest("GET", "/api/admin/vps-packages").then(res => res.json()),
  });

  // Fetch VPS orders
  const { data: orders = [], isLoading: ordersLoading } = useQuery<VpsOrder[]>({
    queryKey: ["/api/vps-orders"],
    queryFn: () => apiRequest("GET", "/api/vps-orders").then(res => res.json()),
  });

  // Fetch Stripe settings
  const { data: currentStripeSettings } = useQuery<StripeSettings>({
    queryKey: ["/api/admin/stripe-settings"],
    queryFn: () => apiRequest("GET", "/api/admin/stripe-settings").then(res => res.json()),
  });

  // Update local Stripe settings when data is fetched
  useEffect(() => {
    if (currentStripeSettings) {
      setStripeSettings(currentStripeSettings);
    }
  }, [currentStripeSettings]);

  // Create package mutation
  const createPackageMutation = useMutation({
    mutationFn: async (packageData: Partial<VpsPackage>) => {
      const response = await apiRequest("POST", "/api/admin/vps-packages", packageData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vps-packages"] });
      setIsCreatingPackage(false);
      toast({ title: "Success", description: "VPS package created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Update package mutation
  const updatePackageMutation = useMutation({
    mutationFn: async ({ id, ...packageData }: Partial<VpsPackage> & { id: number }) => {
      const response = await apiRequest("PUT", `/api/admin/vps-packages/${id}`, packageData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vps-packages"] });
      setEditingPackage(null);
      toast({ title: "Success", description: "VPS package updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Delete package mutation
  const deletePackageMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/admin/vps-packages/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vps-packages"] });
      toast({ title: "Success", description: "VPS package deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Duplicate package mutation  
  const duplicatePackageMutation = useMutation({
    mutationFn: async (packageId: number) => {
      const response = await apiRequest("POST", `/api/admin/vps-packages/${packageId}/duplicate`);
      return response.json();
    },
    onSuccess: (duplicatedPackage) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vps-packages"] });
      // Open the duplicated package for editing immediately
      setEditingPackage(duplicatedPackage);
      setDuplicatingPackage(null);
      toast({ title: "Success", description: "VPS package duplicated successfully. You can now edit the copy." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setDuplicatingPackage(null);
    },
  });

  // Update Stripe settings mutation
  const updateStripeSettingsMutation = useMutation({
    mutationFn: async (settings: StripeSettings) => {
      const response = await apiRequest("PUT", "/api/admin/stripe-settings", settings);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Stripe settings updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleCreatePackage = (formData: FormData) => {
    const packageData = {
      name: formData.get("name") as string,
      displayName: formData.get("displayName") as string,
      description: formData.get("description") as string,
      price: parseInt(formData.get("price") as string) * 100, // Convert to cents
      currency: "USD",
      vcpu: formData.get("vcpu") as string,
      memory: parseInt(formData.get("memory") as string),
      storage: parseInt(formData.get("storage") as string),
      additionalStorage: parseInt(formData.get("additionalStorage") as string) || 0,
      ipv4Addresses: parseInt(formData.get("ipv4Addresses") as string) || 1,
      trafficPort: formData.get("trafficPort") as string,
      osChoices: formData.get("osChoices") as string,
      isAnonymous: formData.get("isAnonymous") === "on",
      isActive: true,
      sortOrder: packages.length,
    };
    createPackageMutation.mutate(packageData);
  };

  const handleUpdatePackage = (formData: FormData) => {
    if (!editingPackage) return;
    
    const packageData = {
      id: editingPackage.id,
      name: formData.get("name") as string,
      displayName: formData.get("displayName") as string,
      description: formData.get("description") as string,
      price: parseInt(formData.get("price") as string) * 100, // Convert to cents
      currency: "USD",
      vcpu: formData.get("vcpu") as string,
      memory: parseInt(formData.get("memory") as string),
      storage: parseInt(formData.get("storage") as string),
      additionalStorage: parseInt(formData.get("additionalStorage") as string) || 0,
      ipv4Addresses: parseInt(formData.get("ipv4Addresses") as string) || 1,
      trafficPort: formData.get("trafficPort") as string,
      osChoices: formData.get("osChoices") as string,
      isAnonymous: formData.get("isAnonymous") === "on",
      isActive: formData.get("isActive") === "on",
    };
    updatePackageMutation.mutate(packageData);
  };

  const handleDuplicatePackage = (pkg: VpsPackage) => {
    setDuplicatingPackage(pkg);
    duplicatePackageMutation.mutate(pkg.id);
  };

  const handleUpdateStripeSettings = (formData: FormData) => {
    const settings = {
      publicKey: formData.get("publicKey") as string,
      secretKey: formData.get("secretKey") as string,
      webhookSecret: formData.get("webhookSecret") as string,
      isTestMode: formData.get("isTestMode") === "on",
    };
    updateStripeSettingsMutation.mutate(settings);
  };

  const PackageForm = ({ 
    package: pkg, 
    onSubmit, 
    onCancel, 
    isLoading 
  }: { 
    package?: VpsPackage | null; 
    onSubmit: (formData: FormData) => void; 
    onCancel: () => void; 
    isLoading: boolean;
  }) => (
    <Card>
      <CardHeader>
        <CardTitle>{pkg ? "Edit Package" : "Create New Package"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(new FormData(e.currentTarget)); }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Package Name</Label>
              <Input 
                id="name" 
                name="name" 
                defaultValue={pkg?.name || ""} 
                placeholder="basic" 
                required 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input 
                id="displayName" 
                name="displayName" 
                defaultValue={pkg?.displayName || ""} 
                placeholder="Basic VPS" 
                required 
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                name="description" 
                defaultValue={pkg?.description || ""} 
                placeholder="Perfect for small websites and development"
                rows={2}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="price">Price (USD)</Label>
              <Input 
                id="price" 
                name="price" 
                type="number" 
                step="0.01"
                defaultValue={pkg ? (pkg.price / 100).toString() : ""} 
                placeholder="5.00" 
                required 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="vcpu">vCPU</Label>
              <Input 
                id="vcpu" 
                name="vcpu" 
                defaultValue={pkg?.vcpu || ""} 
                placeholder="1.0" 
                required 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="memory">Memory (MB)</Label>
              <Input 
                id="memory" 
                name="memory" 
                type="number"
                defaultValue={pkg?.memory || ""} 
                placeholder="1024" 
                required 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="storage">Storage (GB)</Label>
              <Input 
                id="storage" 
                name="storage" 
                type="number"
                defaultValue={pkg?.storage || ""} 
                placeholder="25" 
                required 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="additionalStorage">Additional Storage (GB)</Label>
              <Input 
                id="additionalStorage" 
                name="additionalStorage" 
                type="number"
                defaultValue={pkg?.additionalStorage || 0} 
                placeholder="0" 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="ipv4Addresses">IPv4 Addresses</Label>
              <Input 
                id="ipv4Addresses" 
                name="ipv4Addresses" 
                type="number"
                defaultValue={pkg?.ipv4Addresses || 1} 
                placeholder="1" 
                required 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="trafficPort">Traffic Port</Label>
              <Input 
                id="trafficPort" 
                name="trafficPort" 
                defaultValue={pkg?.trafficPort || ""} 
                placeholder="1Gbps" 
                required 
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="osChoices">OS Choices (JSON)</Label>
              <Textarea 
                id="osChoices" 
                name="osChoices" 
                defaultValue={pkg?.osChoices || '[{"label":"Ubuntu 22.04","value":"ubuntu-22.04"},{"label":"CentOS 8","value":"centos-8"}]'} 
                placeholder='[{"label":"Ubuntu 22.04","value":"ubuntu-22.04"}]'
                rows={3}
                required 
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="isAnonymous" 
                name="isAnonymous" 
                defaultChecked={pkg?.isAnonymous !== false} 
              />
              <Label htmlFor="isAnonymous">Anonymous Orders Allowed</Label>
            </div>
            
            {pkg && (
              <div className="flex items-center space-x-2">
                <Switch 
                  id="isActive" 
                  name="isActive" 
                  defaultChecked={pkg?.isActive !== false} 
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-2 mt-6">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              <Save className="mr-2 h-4 w-4" />
              {isLoading ? "Saving..." : "Save Package"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Server className="mr-2 h-6 w-6" />
        <h2 className="text-2xl font-bold">VPS Management</h2>
      </div>

      <Tabs defaultValue="packages" className="space-y-6">
        <TabsList>
          <TabsTrigger value="packages">VPS Packages</TabsTrigger>
          <TabsTrigger value="orders">VPS Orders</TabsTrigger>
          <TabsTrigger value="stripe">Stripe Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="packages" className="space-y-6">
          {!isCreatingPackage && !editingPackage && (
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">VPS Packages</h3>
              <Button onClick={() => setIsCreatingPackage(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Package
              </Button>
            </div>
          )}

          {isCreatingPackage && (
            <PackageForm 
              onSubmit={handleCreatePackage}
              onCancel={() => setIsCreatingPackage(false)}
              isLoading={createPackageMutation.isPending}
            />
          )}

          {editingPackage && (
            <PackageForm 
              package={editingPackage}
              onSubmit={handleUpdatePackage}
              onCancel={() => setEditingPackage(null)}
              isLoading={updatePackageMutation.isPending}
            />
          )}

          {!isCreatingPackage && !editingPackage && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {packages.map((pkg) => (
                <Card key={pkg.id} className="relative">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{pkg.displayName}</span>
                      <Badge variant={pkg.isActive ? "default" : "secondary"}>
                        {pkg.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <DollarSign className="h-4 w-4 text-green-500" />
                      <span className="font-bold">${(pkg.price / 100).toFixed(2)}/month</span>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <Cpu className="mr-2 h-4 w-4" />
                        <span>{pkg.vcpu} vCPU</span>
                      </div>
                      <div className="flex items-center">
                        <MemoryStick className="mr-2 h-4 w-4" />
                        <span>{pkg.memory} MB RAM</span>
                      </div>
                      <div className="flex items-center">
                        <HardDrive className="mr-2 h-4 w-4" />
                        <span>{pkg.storage} GB Storage</span>
                      </div>
                    </div>
                    
                    {pkg.description && (
                      <p className="text-sm text-muted-foreground">{pkg.description}</p>
                    )}
                    
                    <div className="flex justify-end space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setEditingPackage(pkg)}
                        title="Edit package"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={() => handleDuplicatePackage(pkg)}
                        disabled={duplicatePackageMutation.isPending && duplicatingPackage?.id === pkg.id}
                        title="Duplicate package"
                      >
                        {duplicatePackageMutation.isPending && duplicatingPackage?.id === pkg.id ? (
                          <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => deletePackageMutation.mutate(pkg.id)}
                        title="Delete package"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <h3 className="text-xl font-semibold">VPS Orders</h3>
          
          {ordersLoading ? (
            <div className="text-center">Loading orders...</div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{order.packageName}</h4>
                        <p className="text-sm text-muted-foreground">{order.customerEmail}</p>
                        <p className="text-sm text-muted-foreground">OS: {order.operatingSystem}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={order.status === "completed" ? "default" : "secondary"}>
                          {order.status}
                        </Badge>
                        <p className="text-sm font-medium">${(order.packagePrice / 100).toFixed(2)}/month</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="stripe" className="space-y-6">
          <h3 className="text-xl font-semibold">Stripe Integration Settings</h3>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="mr-2 h-5 w-5" />
                Stripe Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => { e.preventDefault(); handleUpdateStripeSettings(new FormData(e.currentTarget)); }}>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="isTestMode" 
                      name="isTestMode" 
                      checked={stripeSettings.isTestMode}
                      onCheckedChange={(checked) => setStripeSettings({...stripeSettings, isTestMode: checked})}
                    />
                    <Label htmlFor="isTestMode">Test Mode</Label>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="publicKey">
                      {stripeSettings.isTestMode ? "Test " : "Live "}Publishable Key
                    </Label>
                    <Input 
                      id="publicKey" 
                      name="publicKey" 
                      value={stripeSettings.publicKey}
                      onChange={(e) => setStripeSettings({...stripeSettings, publicKey: e.target.value})}
                      placeholder={stripeSettings.isTestMode ? "pk_test_..." : "pk_live_..."}
                      required 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="secretKey">
                      {stripeSettings.isTestMode ? "Test " : "Live "}Secret Key
                    </Label>
                    <Input 
                      id="secretKey" 
                      name="secretKey" 
                      type="password"
                      value={stripeSettings.secretKey}
                      onChange={(e) => setStripeSettings({...stripeSettings, secretKey: e.target.value})}
                      placeholder={stripeSettings.isTestMode ? "sk_test_..." : "sk_live_..."}
                      required 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="webhookSecret">Webhook Endpoint Secret</Label>
                    <Input 
                      id="webhookSecret" 
                      name="webhookSecret" 
                      type="password"
                      value={stripeSettings.webhookSecret}
                      onChange={(e) => setStripeSettings({...stripeSettings, webhookSecret: e.target.value})}
                      placeholder="whsec_..."
                      required 
                    />
                  </div>
                </div>
                
                <Button type="submit" className="mt-6" disabled={updateStripeSettingsMutation.isPending}>
                  <Settings className="mr-2 h-4 w-4" />
                  {updateStripeSettingsMutation.isPending ? "Saving..." : "Save Settings"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}