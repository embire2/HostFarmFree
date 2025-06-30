import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Settings, AlertCircle, Wifi, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Alert, AlertDescription } from "@/components/ui/alert";

type ApiSettings = {
  id: number;
  whmApiUrl: string;
  whmApiToken: string;
  cpanelBaseUrl: string;
  emailFromAddress: string;
  emailFromName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

const apiSettingsSchema = z.object({
  whmApiUrl: z.string().url("Please enter a valid URL"),
  whmApiToken: z.string().min(1, "API token is required"),
  cpanelBaseUrl: z.string().url("Please enter a valid URL"),
  emailFromAddress: z.string().email("Please enter a valid email address"),
  emailFromName: z.string().min(1, "From name is required"),
});

type ApiSettingsFormData = z.infer<typeof apiSettingsSchema>;

export default function ApiSettings() {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  const { data: settings, isLoading } = useQuery<ApiSettings | null>({
    queryKey: ["/api/api-settings"],
    retry: false,
  });

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<ApiSettingsFormData>({
    resolver: zodResolver(apiSettingsSchema),
    defaultValues: {
      whmApiUrl: "",
      whmApiToken: "",
      cpanelBaseUrl: "",
      emailFromAddress: "",
      emailFromName: "",
    },
  });

  // Set form values when settings are loaded
  useEffect(() => {
    if (settings) {
      setValue("whmApiUrl", settings.whmApiUrl || "");
      setValue("whmApiToken", settings.whmApiToken || "");
      setValue("cpanelBaseUrl", settings.cpanelBaseUrl || "");
      setValue("emailFromAddress", settings.emailFromAddress || "");
      setValue("emailFromName", settings.emailFromName || "");
    }
  }, [settings, setValue]);

  const saveMutation = useMutation({
    mutationFn: async (data: ApiSettingsFormData) => {
      const res = await apiRequest("POST", "/api/api-settings", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/api-settings"] });
      setIsEditing(false);
      toast({
        title: "Settings saved",
        description: "API settings have been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/test-whm-connection");
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Connection Successful",
        description: `Connected to WHM successfully. Version: ${data.version || 'Unknown'}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Connection Failed",
        description: error.message || "Unable to connect to WHM API",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ApiSettingsFormData) => {
    saveMutation.mutate(data);
  };

  const handleCancel = () => {
    reset();
    setIsEditing(false);
    if (settings) {
      setValue("whmApiUrl", settings.whmApiUrl || "");
      setValue("whmApiToken", settings.whmApiToken || "");
      setValue("cpanelBaseUrl", settings.cpanelBaseUrl || "");
      setValue("emailFromAddress", settings.emailFromAddress || "");
      setValue("emailFromName", settings.emailFromName || "");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            API Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          API Settings
        </CardTitle>
        <CardDescription>
          Configure WHM/cPanel API settings for automatic hosting account creation and management.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!settings && !isEditing && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No API settings configured. Set up your WHM/cPanel API credentials to enable automatic hosting account creation.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="whmApiUrl">WHM API URL</Label>
              <Input
                id="whmApiUrl"
                placeholder="https://your-server.com:2087/json-api/"
                disabled={!isEditing}
                {...register("whmApiUrl")}
              />
              {errors.whmApiUrl && (
                <p className="text-sm text-red-500">{errors.whmApiUrl.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="whmApiToken">WHM API Token</Label>
              <Input
                id="whmApiToken"
                type="password"
                placeholder="Your WHM API token"
                disabled={!isEditing}
                {...register("whmApiToken")}
              />
              {errors.whmApiToken && (
                <p className="text-sm text-red-500">{errors.whmApiToken.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpanelBaseUrl">cPanel Base URL</Label>
              <Input
                id="cpanelBaseUrl"
                placeholder="https://cpanel.your-server.com"
                disabled={!isEditing}
                {...register("cpanelBaseUrl")}
              />
              {errors.cpanelBaseUrl && (
                <p className="text-sm text-red-500">{errors.cpanelBaseUrl.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="emailFromAddress">Email From Address</Label>
              <Input
                id="emailFromAddress"
                type="email"
                placeholder="noreply@hostfarm.org"
                disabled={!isEditing}
                {...register("emailFromAddress")}
              />
              {errors.emailFromAddress && (
                <p className="text-sm text-red-500">{errors.emailFromAddress.message}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="emailFromName">Email From Name</Label>
              <Input
                id="emailFromName"
                placeholder="HostFarm.org"
                disabled={!isEditing}
                {...register("emailFromName")}
              />
              {errors.emailFromName && (
                <p className="text-sm text-red-500">{errors.emailFromName.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center pt-6 border-t">
            {settings && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => testConnectionMutation.mutate()}
                disabled={testConnectionMutation.isPending || !settings.whmApiUrl || !settings.whmApiToken}
                className="flex items-center gap-2"
              >
                {testConnectionMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Wifi className="w-4 h-4" />
                )}
                Test API Connection
              </Button>
            )}
            
            <div className="flex gap-3">
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} variant="outline">
                  Edit Settings
                </Button>
              ) : (
                <>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleCancel}
                    disabled={saveMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={saveMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    {saveMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save Settings
                  </Button>
                </>
              )}
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}