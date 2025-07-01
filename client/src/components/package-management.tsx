import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import {
  Package,
  Plus,
  Edit,
  Trash2,
  DollarSign,
  HardDrive,
  Network,
  Mail,
  Database,
  Globe,
  Loader2,
  Server,
  Link,
  CheckCircle,
  RefreshCw
} from "lucide-react";
import { z } from "zod";

const packageSchema = z.object({
  name: z.string().min(1, "Package name is required"),
  displayName: z.string().min(1, "Display name is required"),
  description: z.string().optional(),
  price: z.number().min(0, "Price must be 0 or greater"),
  currency: z.string().default("USD"),
  diskSpaceQuota: z.number().min(1, "Disk space quota is required"),
  bandwidthQuota: z.number().min(1, "Bandwidth quota is required"),
  emailAccounts: z.number().min(0, "Email accounts must be 0 or greater"),
  databases: z.number().min(0, "Databases must be 0 or greater"),
  subdomains: z.number().min(0, "Subdomains must be 0 or greater"),
  whmPackageName: z.string().min(1, "WHM package selection is required"),
  isActive: z.boolean().default(true),
  isFree: z.boolean().default(false),
});

type PackageFormData = z.infer<typeof packageSchema>;

export default function PackageManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any>(null);

  const form = useForm<PackageFormData>({
    resolver: zodResolver(packageSchema),
    defaultValues: {
      name: "",
      displayName: "",
      description: "",
      price: 0,
      currency: "USD",
      diskSpaceQuota: 1024,
      bandwidthQuota: 10240,
      emailAccounts: 10,
      databases: 5,
      subdomains: 10,
      whmPackageName: "",
      isActive: true,
      isFree: false,
    },
  });

  // Fetch existing packages
  const { data: packages = [], isLoading: packagesLoading } = useQuery({
    queryKey: ["/api/admin/packages"],
  });

  // Fetch WHM packages
  const { data: whmPackagesData, isLoading: whmLoading, refetch: refetchWhmPackages } = useQuery({
    queryKey: ["/api/admin/whm-packages"],
  });

  // Extract packages from the response object
  const whmPackages = (whmPackagesData as { packages?: any[] })?.packages || [];
  
  // Debug logging for WHM packages
  console.log("[Frontend] WHM packages data:", { 
    whmPackagesData, 
    extractedPackages: whmPackages, 
    packagesLength: whmPackages.length 
  });

  // Create package mutation
  const createPackageMutation = useMutation({
    mutationFn: async (data: PackageFormData) => {
      const res = await apiRequest("POST", "/api/admin/packages", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/packages"] });
      setIsDialogOpen(false);
      form.reset();
      setEditingPackage(null);
      toast({
        title: "Success",
        description: "Package created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update package mutation
  const updatePackageMutation = useMutation({
    mutationFn: async (data: PackageFormData & { id: number }) => {
      const { id, ...packageData } = data;
      const res = await apiRequest("PUT", `/api/admin/packages/${id}`, packageData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/packages"] });
      setIsDialogOpen(false);
      form.reset();
      setEditingPackage(null);
      toast({
        title: "Success",
        description: "Package updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete package mutation
  const deletePackageMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/packages/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/packages"] });
      toast({
        title: "Success",
        description: "Package deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PackageFormData) => {
    if (editingPackage) {
      updatePackageMutation.mutate({ ...data, id: editingPackage.id });
    } else {
      createPackageMutation.mutate(data);
    }
  };

  const handleEdit = (pkg: any) => {
    setEditingPackage(pkg);
    form.reset({
      name: pkg.name,
      displayName: pkg.displayName,
      description: pkg.description || "",
      price: pkg.price,
      currency: pkg.currency,
      diskSpaceQuota: pkg.diskSpaceQuota,
      bandwidthQuota: pkg.bandwidthQuota,
      emailAccounts: pkg.emailAccounts,
      databases: pkg.databases,
      subdomains: pkg.subdomains,
      whmPackageName: pkg.whmPackageName,
      isActive: pkg.isActive,
      isFree: pkg.isFree,
    });
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingPackage(null);
    form.reset();
    setIsDialogOpen(true);
  };

  const formatPrice = (price: number) => {
    return price === 0 ? "Free" : `$${(price / 100).toFixed(2)}`;
  };

  const formatSize = (mb: number) => {
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb} MB`;
  };

  if (packagesLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Package Management</h2>
          <p className="text-muted-foreground">
            Manage hosting packages and associate them with WHM packages
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew}>
              <Plus className="mr-2 h-4 w-4" />
              Add Package
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby="package-dialog-description">
            <DialogHeader>
              <DialogTitle>
                {editingPackage ? "Edit Package" : "Create New Package"}
              </DialogTitle>
              <div id="package-dialog-description" className="sr-only">
                Configure hosting package settings including WHM integration and resource quotas
              </div>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Package Name</FormLabel>
                        <FormControl>
                          <Input placeholder="starter" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Starter Package" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Perfect for small websites and blogs"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price (cents)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="whmPackageName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center justify-between">
                          WHM Package
                          <Button 
                            type="button"
                            variant="outline" 
                            size="sm"
                            onClick={() => refetchWhmPackages()}
                            disabled={whmLoading}
                            className="h-6 px-2 text-xs"
                          >
                            {whmLoading ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3 w-3" />
                            )}
                            Sync
                          </Button>
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select WHM package" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {whmLoading ? (
                              <SelectItem value="loading" disabled>
                                Loading packages...
                              </SelectItem>
                            ) : whmPackages.length > 0 ? (
                              whmPackages.map((pkg: any, index: number) => {
                                console.log(`[Frontend] Rendering WHM package ${index}:`, pkg);
                                return (
                                  <SelectItem key={pkg.name || index} value={pkg.name}>
                                    {pkg.displayname || pkg.name}
                                  </SelectItem>
                                );
                              })
                            ) : (
                              <SelectItem value="none" disabled>
                                No WHM packages found
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="diskSpaceQuota"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Disk Space (MB)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="1024"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="bandwidthQuota"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bandwidth (MB)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="10240"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="emailAccounts"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Accounts</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="10"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="databases"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Databases</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="5"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="subdomains"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subdomains</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="10"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex items-center space-x-6">
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel>Active</FormLabel>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="isFree"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel>Free Package</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createPackageMutation.isPending || updatePackageMutation.isPending}
                  >
                    {(createPackageMutation.isPending || updatePackageMutation.isPending) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {editingPackage ? "Update" : "Create"} Package
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.isArray(packages) && packages.map((pkg: any) => (
          <Card key={pkg.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{pkg.displayName}</CardTitle>
                <div className="flex items-center space-x-1">
                  {pkg.isFree && (
                    <Badge variant="secondary" className="text-xs">
                      FREE
                    </Badge>
                  )}
                  {!pkg.isActive && (
                    <Badge variant="destructive" className="text-xs">
                      INACTIVE
                    </Badge>
                  )}
                </div>
              </div>
              {pkg.description && (
                <p className="text-sm text-muted-foreground">{pkg.description}</p>
              )}
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="text-center py-2">
                <div className="text-3xl font-bold">{formatPrice(pkg.price)}</div>
                {pkg.price > 0 && (
                  <div className="text-sm text-muted-foreground">per month</div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <HardDrive className="mr-2 h-4 w-4 text-muted-foreground" />
                  {formatSize(pkg.diskSpaceQuota)} Storage
                </div>
                <div className="flex items-center text-sm">
                  <Network className="mr-2 h-4 w-4 text-muted-foreground" />
                  {formatSize(pkg.bandwidthQuota)} Bandwidth
                </div>
                <div className="flex items-center text-sm">
                  <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                  {pkg.emailAccounts} Email Accounts
                </div>
                <div className="flex items-center text-sm">
                  <Database className="mr-2 h-4 w-4 text-muted-foreground" />
                  {pkg.databases} Databases
                </div>
                <div className="flex items-center text-sm">
                  <Globe className="mr-2 h-4 w-4 text-muted-foreground" />
                  {pkg.subdomains} Subdomains
                </div>
                <div className="flex items-center text-sm">
                  <Server className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="text-xs bg-muted px-2 py-1 rounded">
                    WHM: {pkg.whmPackageName}
                  </span>
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleEdit(pkg)}
                  className="flex-1"
                >
                  <Edit className="mr-1 h-3 w-3" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => deletePackageMutation.mutate(pkg.id)}
                  disabled={deletePackageMutation.isPending}
                  className="text-destructive hover:text-destructive"
                >
                  {deletePackageMutation.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {Array.isArray(packages) && packages.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No packages yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first hosting package to get started
            </p>
            <Button onClick={handleAddNew}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Package
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}