import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Save, TestTube, Eye, DollarSign, BarChart3, AlertTriangle, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

type FacebookPixelSettings = {
  id: number;
  pixelId: string;
  accessToken?: string;
  isActive: boolean;
  trackPageViews: boolean;
  trackPurchases: boolean;
  purchaseEventValue: string;
  testMode: boolean;
  createdAt: string;
  updatedAt: string;
};

export function FacebookPixelSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    pixelId: '',
    accessToken: '',
    isActive: true,
    trackPageViews: true,
    trackPurchases: true,
    purchaseEventValue: '5.00',
    testMode: false,
  });

  const { data: settings, isLoading } = useQuery<FacebookPixelSettings | null>({
    queryKey: ["/api/facebook-pixel-settings"],
  });

  // Initialize form with existing settings
  useEffect(() => {
    if (settings) {
      setFormData({
        pixelId: settings.pixelId || '',
        accessToken: settings.accessToken || '',
        isActive: settings.isActive ?? true,
        trackPageViews: settings.trackPageViews ?? true,
        trackPurchases: settings.trackPurchases ?? true,
        purchaseEventValue: settings.purchaseEventValue || '5.00',
        testMode: settings.testMode ?? false,
      });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/facebook-pixel-settings", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Facebook Pixel settings saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/facebook-pixel-settings"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", "/api/facebook-pixel-settings");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Facebook Pixel settings deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/facebook-pixel-settings"] });
      setFormData({
        pixelId: '',
        accessToken: '',
        isActive: true,
        trackPageViews: true,
        trackPurchases: true,
        purchaseEventValue: '5.00',
        testMode: false,
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete the Facebook Pixel configuration?")) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Facebook Pixel Configuration
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure Facebook Pixel tracking for conversion campaigns and analytics.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Pixel ID */}
            <div className="space-y-2">
              <Label htmlFor="pixelId">Facebook Pixel ID *</Label>
              <Input
                id="pixelId"
                type="text"
                placeholder="Enter your Facebook Pixel ID (e.g., 123456789012345)"
                value={formData.pixelId}
                onChange={(e) => setFormData({ ...formData, pixelId: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">
                Find your Pixel ID in Facebook Events Manager → Data Sources → Pixels
              </p>
            </div>

            {/* Access Token (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="accessToken">Access Token (Optional)</Label>
              <Textarea
                id="accessToken"
                placeholder="Enter Facebook Access Token for advanced features (optional)"
                value={formData.accessToken}
                onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Access token enables advanced conversion tracking features
              </p>
            </div>

            <Separator />

            {/* Tracking Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Tracking Settings</h3>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Enable Pixel Tracking</Label>
                  <p className="text-xs text-muted-foreground">
                    Master switch to enable/disable all Facebook Pixel tracking
                  </p>
                </div>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Track Page Views
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically track page views across the website
                  </p>
                </div>
                <Switch
                  checked={formData.trackPageViews}
                  onCheckedChange={(checked) => setFormData({ ...formData, trackPageViews: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Track Purchases (Account Creation)
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Track new account registrations as purchase events
                  </p>
                </div>
                <Switch
                  checked={formData.trackPurchases}
                  onCheckedChange={(checked) => setFormData({ ...formData, trackPurchases: checked })}
                />
              </div>

              {/* Purchase Value */}
              <div className="space-y-2">
                <Label htmlFor="purchaseEventValue">Purchase Event Value (USD)</Label>
                <Input
                  id="purchaseEventValue"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="5.00"
                  value={formData.purchaseEventValue}
                  onChange={(e) => setFormData({ ...formData, purchaseEventValue: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Value assigned to each account creation event for conversion tracking
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base flex items-center gap-2">
                    <TestTube className="w-4 h-4" />
                    Test Mode
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Enable test mode for debugging (events won't affect live campaigns)
                  </p>
                </div>
                <Switch
                  checked={formData.testMode}
                  onCheckedChange={(checked) => setFormData({ ...formData, testMode: checked })}
                />
              </div>
            </div>

            <Separator />

            {/* Status Display */}
            {settings && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Current Status</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    {settings.isActive ? (
                      <Badge variant="default" className="bg-green-500">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Inactive
                      </Badge>
                    )}
                    <span className="text-sm text-muted-foreground">Pixel Status</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {settings.testMode ? (
                      <Badge variant="outline">Test Mode</Badge>
                    ) : (
                      <Badge variant="default">Live Mode</Badge>
                    )}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Last updated: {new Date(settings.updatedAt).toLocaleString()}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={!settings || deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete Configuration"}
              </Button>
              
              <Button
                type="submit"
                disabled={saveMutation.isPending}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saveMutation.isPending ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div>
            <h4 className="font-semibold text-foreground mb-2">Page View Tracking:</h4>
            <p>Automatically tracks when users visit any page on your website, helping measure reach and engagement.</p>
          </div>
          
          <div>
            <h4 className="font-semibold text-foreground mb-2">Purchase Event Tracking:</h4>
            <p>When a user creates a new hosting account, it's tracked as a "Purchase" event with the configured value. This enables:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Conversion tracking for Facebook ad campaigns</li>
              <li>ROI measurement and optimization</li>
              <li>Lookalike audience creation based on converters</li>
              <li>Retargeting campaigns for similar users</li>
            </ul>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Privacy Note:</strong> All tracking complies with privacy regulations. 
              The Facebook Pixel only tracks user actions and doesn't collect personal information.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}