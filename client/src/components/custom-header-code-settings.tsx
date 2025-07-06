import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Code, Plus, Edit, Trash2, Eye, Info, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type CustomHeaderCode = {
  id: number;
  name: string;
  code: string;
  isActive: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
};

export function CustomHeaderCodeSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<CustomHeaderCode | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    isActive: true,
    position: 0,
  });

  const { data: headerCodes = [], isLoading } = useQuery<CustomHeaderCode[]>({
    queryKey: ["/api/custom-header-codes"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/custom-header-codes", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-header-codes"] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Custom header code created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create custom header code",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<typeof formData> }) => {
      const response = await apiRequest("PUT", `/api/custom-header-codes/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-header-codes"] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Custom header code updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update custom header code",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/custom-header-codes/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-header-codes"] });
      toast({
        title: "Success",
        description: "Custom header code deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete custom header code",
        variant: "destructive",
      });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const response = await apiRequest("PUT", `/api/custom-header-codes/${id}`, { isActive });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-header-codes"] });
      toast({
        title: "Success",
        description: "Header code status updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update header code status",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      isActive: true,
      position: 0,
    });
    setEditingCode(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingCode) {
      updateMutation.mutate({ id: editingCode.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (code: CustomHeaderCode) => {
    setEditingCode(code);
    setFormData({
      name: code.name,
      code: code.code,
      isActive: code.isActive,
      position: code.position,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this header code?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleStatus = (id: number, isActive: boolean) => {
    toggleStatusMutation.mutate({ id, isActive });
  };

  if (isLoading) {
    return <div>Loading custom header codes...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            Custom Header Code Management
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Add custom HTML, CSS, or JavaScript code that will appear in the head section of all pages.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">Header Code Blocks</h3>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Code Block
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingCode ? 'Edit Header Code' : 'Add New Header Code'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name / Description</Label>
                      <Input
                        id="name"
                        placeholder="e.g., Google Analytics, Custom CSS"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="position">Position Order</Label>
                      <Input
                        id="position"
                        type="number"
                        placeholder="0"
                        value={formData.position}
                        onChange={(e) => setFormData({ ...formData, position: parseInt(e.target.value) || 0 })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Lower numbers appear first in the head section
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="code">HTML/CSS/JavaScript Code</Label>
                    <Textarea
                      id="code"
                      placeholder="Paste your custom header code here..."
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      rows={12}
                      className="font-mono text-sm"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      This code will be inserted directly into the &lt;head&gt; section of all pages
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    />
                    <Label htmlFor="isActive">Active (include in pages)</Label>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createMutation.isPending || updateMutation.isPending}
                    >
                      {editingCode ? 'Update' : 'Create'} Header Code
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {headerCodes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Code className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No custom header codes configured yet.</p>
              <p className="text-sm">Click "Add New Code Block" to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {headerCodes.map((code) => (
                <Card key={code.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{code.name}</h4>
                          <Badge variant={code.isActive ? "default" : "secondary"}>
                            {code.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Badge variant="outline">Position: {code.position}</Badge>
                        </div>
                        <div className="relative">
                          <pre className="text-xs bg-muted p-3 rounded border max-h-32 overflow-y-auto font-mono">
                            {code.code}
                          </pre>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Created: {new Date(code.createdAt).toLocaleDateString()}
                          {code.updatedAt !== code.createdAt && 
                            ` • Updated: ${new Date(code.updatedAt).toLocaleDateString()}`
                          }
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Switch
                          checked={code.isActive}
                          onCheckedChange={(checked) => handleToggleStatus(code.id, checked)}
                          disabled={toggleStatusMutation.isPending}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(code)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(code.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div>
            <h4 className="font-semibold text-foreground mb-2">Universal Header Injection:</h4>
            <p>All active header code blocks are automatically injected into the &lt;head&gt; section of every page on your website, including public pages and admin panels.</p>
          </div>
          
          <div>
            <h4 className="font-semibold text-foreground mb-2">Supported Code Types:</h4>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Analytics tracking codes (Google Analytics, Facebook Pixel, etc.)</li>
              <li>Custom CSS stylesheets and style rules</li>
              <li>JavaScript libraries and custom scripts</li>
              <li>Meta tags for SEO and social media</li>
              <li>Font imports and external resource links</li>
            </ul>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Security Note:</strong> Be careful when adding JavaScript code. 
              Only paste code from trusted sources as it will execute on all pages.
            </AlertDescription>
          </Alert>

          <div>
            <h4 className="font-semibold text-foreground mb-2">Facebook Pixel Integration:</h4>
            <p>Your current Facebook Pixel code is managed separately in the Facebook Pixel Settings tab. You can also add additional tracking codes here if needed.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}