import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  Server, 
  User, 
  DollarSign, 
  Calendar, 
  Settings, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Edit3,
  Trash2,
  Mail,
  Copy
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface VpsOrder {
  id: number;
  customerEmail: string;
  packageId: number;
  packageName: string;
  operatingSystem: string;
  packagePrice: number;
  vcpu: string;
  memory: string;
  storage: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  subscriptionStatus: string;
  status: string;
  serverIpAddress?: string;
  serverUsername?: string;
  serverPassword?: string;
  serverSshPort?: number;
  serverRdpPort?: number;
  serverNotes?: string;
  processedBy?: number;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminVpsOrders() {
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<VpsOrder | null>(null);
  const [editingOrder, setEditingOrder] = useState<VpsOrder | null>(null);

  const { data: orders, isLoading } = useQuery<VpsOrder[]>({
    queryKey: ["/api/vps-orders"],
    retry: false,
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<VpsOrder> }) => {
      const response = await apiRequest("PUT", `/api/vps-orders/${id}`, updates);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/vps-orders"] });
      setEditingOrder(null);
      setSelectedOrder(data);
      toast({
        title: "Order Updated",
        description: `VPS Order #${data.id} has been updated successfully.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/vps-orders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vps-orders"] });
      setSelectedOrder(null);
      setEditingOrder(null);
      toast({
        title: "Order Deleted",
        description: "VPS order has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleUpdateOrder = (updates: Partial<VpsOrder>) => {
    if (!editingOrder) return;
    updateOrderMutation.mutate({ id: editingOrder.id, updates });
  };

  const handleCompleteOrder = (order: VpsOrder) => {
    if (!order.serverIpAddress || !order.serverUsername || !order.serverPassword) {
      toast({
        title: "Missing Server Details",
        description: "Please fill in all server details before marking as completed.",
        variant: "destructive",
      });
      return;
    }

    updateOrderMutation.mutate({
      id: order.id,
      updates: { status: 'completed' }
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to Clipboard",
      description: `${label} copied to clipboard.`,
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: "bg-yellow-500", label: "Pending" },
      processing: { color: "bg-blue-500", label: "Processing" },
      completed: { color: "bg-green-500", label: "Completed" },
      cancelled: { color: "bg-red-500", label: "Cancelled" },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <Badge className={`${config.color} text-white`}>
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
        <p className="text-gray-600 mt-4">Loading VPS orders...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">VPS Orders Management</h1>
        <div className="text-sm text-gray-500">
          Total Orders: {orders?.length || 0}
        </div>
      </div>

      {!orders || orders.length === 0 ? (
        <Alert>
          <Server className="h-4 w-4" />
          <AlertDescription>
            No VPS orders found. Orders will appear here when customers purchase VPS packages.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Orders List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">All Orders</h2>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {orders.map((order) => (
                <Card 
                  key={order.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedOrder?.id === order.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedOrder(order)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Server className="w-4 h-4 text-blue-500" />
                        <span className="font-semibold">Order #{order.id}</span>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3" />
                        <span>{order.customerEmail}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-3 h-3" />
                        <span>{order.packageName} - ${(order.packagePrice / 100).toFixed(2)}/month</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Order Details */}
          <div className="space-y-4">
            {selectedOrder ? (
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="details">Order Details</TabsTrigger>
                  <TabsTrigger value="server">Server Setup</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Order #{selectedOrder.id}</span>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingOrder(selectedOrder)}
                          >
                            <Edit3 className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteOrderMutation.mutate(selectedOrder.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Customer Email</Label>
                          <p className="flex items-center gap-2">
                            {selectedOrder.customerEmail}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(selectedOrder.customerEmail, "Email")}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Status</Label>
                          <p>{getStatusBadge(selectedOrder.status)}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Package</Label>
                          <p>{selectedOrder.packageName}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Operating System</Label>
                          <p>{selectedOrder.operatingSystem}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Monthly Price</Label>
                          <p>${(selectedOrder.packagePrice / 100).toFixed(2)}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Subscription Status</Label>
                          <p className="capitalize">{selectedOrder.subscriptionStatus}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-500">vCPU</Label>
                          <p>{selectedOrder.vcpu}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Memory</Label>
                          <p>{selectedOrder.memory}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Storage</Label>
                          <p>{selectedOrder.storage}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-500">Stripe Details</Label>
                        <div className="text-sm space-y-1">
                          <p className="flex items-center gap-2">
                            <span className="font-medium">Subscription ID:</span>
                            <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                              {selectedOrder.stripeSubscriptionId}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(selectedOrder.stripeSubscriptionId, "Subscription ID")}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </p>
                          <p className="flex items-center gap-2">
                            <span className="font-medium">Customer ID:</span>
                            <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                              {selectedOrder.stripeCustomerId}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(selectedOrder.stripeCustomerId, "Customer ID")}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="server" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Server Configuration</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {editingOrder?.id === selectedOrder.id ? (
                        <ServerSetupForm
                          order={editingOrder}
                          onSubmit={handleUpdateOrder}
                          onCancel={() => setEditingOrder(null)}
                          isLoading={updateOrderMutation.isPending}
                        />
                      ) : (
                        <ServerDetails
                          order={selectedOrder}
                          onEdit={() => setEditingOrder(selectedOrder)}
                          onComplete={() => handleCompleteOrder(selectedOrder)}
                          onCopy={copyToClipboard}
                        />
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Server className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">Select an Order</h3>
                  <p className="text-gray-500">Choose an order from the list to view details and manage server setup.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Server Setup Form Component
function ServerSetupForm({ 
  order, 
  onSubmit, 
  onCancel, 
  isLoading 
}: { 
  order: VpsOrder; 
  onSubmit: (updates: Partial<VpsOrder>) => void; 
  onCancel: () => void; 
  isLoading: boolean; 
}) {
  const [formData, setFormData] = useState({
    status: order.status,
    serverIpAddress: order.serverIpAddress || '',
    serverUsername: order.serverUsername || '',
    serverPassword: order.serverPassword || '',
    serverSshPort: order.serverSshPort || 22,
    serverRdpPort: order.serverRdpPort || 3389,
    serverNotes: order.serverNotes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="serverIpAddress">Server IP Address *</Label>
          <Input
            id="serverIpAddress"
            value={formData.serverIpAddress}
            onChange={(e) => setFormData({ ...formData, serverIpAddress: e.target.value })}
            placeholder="192.168.1.100"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="serverUsername">Username *</Label>
          <Input
            id="serverUsername"
            value={formData.serverUsername}
            onChange={(e) => setFormData({ ...formData, serverUsername: e.target.value })}
            placeholder="root"
            required
          />
        </div>
        <div>
          <Label htmlFor="serverPassword">Password *</Label>
          <Input
            id="serverPassword"
            type="password"
            value={formData.serverPassword}
            onChange={(e) => setFormData({ ...formData, serverPassword: e.target.value })}
            placeholder="Generate secure password"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="serverSshPort">SSH Port</Label>
          <Input
            id="serverSshPort"
            type="number"
            value={formData.serverSshPort}
            onChange={(e) => setFormData({ ...formData, serverSshPort: parseInt(e.target.value) })}
            placeholder="22"
          />
        </div>
        <div>
          <Label htmlFor="serverRdpPort">RDP Port (Windows only)</Label>
          <Input
            id="serverRdpPort"
            type="number"
            value={formData.serverRdpPort}
            onChange={(e) => setFormData({ ...formData, serverRdpPort: parseInt(e.target.value) })}
            placeholder="3389"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="serverNotes">Server Notes</Label>
        <Textarea
          id="serverNotes"
          value={formData.serverNotes}
          onChange={(e) => setFormData({ ...formData, serverNotes: e.target.value })}
          placeholder="Any additional setup notes or special instructions..."
          rows={3}
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
              Updating...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Update Order
            </>
          )}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

// Server Details Display Component
function ServerDetails({ 
  order, 
  onEdit, 
  onComplete, 
  onCopy 
}: { 
  order: VpsOrder; 
  onEdit: () => void; 
  onComplete: () => void; 
  onCopy: (text: string, label: string) => void; 
}) {
  const hasServerDetails = order.serverIpAddress && order.serverUsername && order.serverPassword;

  return (
    <div className="space-y-4">
      {!hasServerDetails ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Server details not configured yet. Click "Edit" to add server configuration.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-500">IP Address</Label>
              <p className="flex items-center gap-2">
                <span className="font-mono bg-gray-100 px-2 py-1 rounded">{order.serverIpAddress}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onCopy(order.serverIpAddress!, "IP Address")}
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Username</Label>
              <p className="flex items-center gap-2">
                <span className="font-mono bg-gray-100 px-2 py-1 rounded">{order.serverUsername}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onCopy(order.serverUsername!, "Username")}
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-500">Password</Label>
              <p className="flex items-center gap-2">
                <span className="font-mono bg-gray-100 px-2 py-1 rounded">••••••••</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onCopy(order.serverPassword!, "Password")}
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">SSH Port</Label>
              <p>{order.serverSshPort || 22}</p>
            </div>
          </div>

          {order.serverNotes && (
            <div>
              <Label className="text-sm font-medium text-gray-500">Notes</Label>
              <p className="text-sm bg-gray-50 p-3 rounded">{order.serverNotes}</p>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2 pt-4">
        <Button onClick={onEdit} variant="outline">
          <Edit3 className="w-4 h-4 mr-2" />
          {hasServerDetails ? 'Edit Details' : 'Setup Server'}
        </Button>
        
        {hasServerDetails && order.status !== 'completed' && (
          <Button onClick={onComplete} className="bg-green-500 hover:bg-green-600">
            <CheckCircle className="w-4 h-4 mr-2" />
            Mark Complete & Send Email
          </Button>
        )}
        
        {order.status === 'completed' && (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Order Completed</span>
          </div>
        )}
      </div>
    </div>
  );
}