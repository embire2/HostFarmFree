import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Mail, TestTube, Settings, Check, X, Wifi } from "lucide-react";

const smtpSettingsSchema = z.object({
  host: z.string().min(1, "Host is required"),
  port: z.number().min(1, "Port must be at least 1").max(65535, "Port must be less than 65536"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  encryption: z.enum(["tls", "ssl", "none"]),
  fromEmail: z.string().email("Please enter a valid email address"),
  fromName: z.string().min(1, "From name is required"),
});

type SmtpSettingsForm = z.infer<typeof smtpSettingsSchema>;

export default function SmtpSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [testEmail, setTestEmail] = useState("");

  const { data: smtpSettings, isLoading } = useQuery({
    queryKey: ["/api/smtp-settings"],
  });

  const form = useForm<SmtpSettingsForm>({
    resolver: zodResolver(smtpSettingsSchema),
    defaultValues: {
      host: "",
      port: 587,
      username: "",
      password: "",
      encryption: "tls",
      fromEmail: "",
      fromName: "HostFarm.org",
    },
  });

  // Update form when data loads
  useEffect(() => {
    if (smtpSettings) {
      form.reset({
        host: smtpSettings.host || "",
        port: smtpSettings.port || 587,
        username: smtpSettings.username || "",
        password: smtpSettings.password || "",
        encryption: smtpSettings.encryption || "tls",
        fromEmail: smtpSettings.fromEmail || "",
        fromName: smtpSettings.fromName || "HostFarm.org",
      });
    }
  }, [smtpSettings, form]);

  const saveSettingsMutation = useMutation({
    mutationFn: async (data: SmtpSettingsForm) => {
      const res = await apiRequest("POST", "/api/smtp-settings", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings Saved",
        description: "SMTP settings have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/smtp-settings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save SMTP settings.",
        variant: "destructive",
      });
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: async (data: SmtpSettingsForm) => {
      const res = await apiRequest("POST", "/api/smtp-settings/test-connection", data);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Connection Successful",
        description: data.message || "SMTP connection is working correctly!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to SMTP server.",
        variant: "destructive",
      });
    },
  });

  const testSettingsMutation = useMutation({
    mutationFn: async (data: SmtpSettingsForm & { testEmail: string }) => {
      const res = await apiRequest("POST", "/api/smtp-settings/test", data);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Test Email Sent",
        description: data.message || "Test email sent successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Test Failed",
        description: error.message || "Failed to send test email.",
        variant: "destructive",
      });
    },
  });

  const deleteSettingsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/smtp-settings");
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings Deleted",
        description: "SMTP settings have been deleted successfully.",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/smtp-settings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete SMTP settings.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SmtpSettingsForm) => {
    saveSettingsMutation.mutate(data);
  };

  const handleTestConnection = () => {
    const formData = form.getValues();
    testConnectionMutation.mutate(formData);
  };

  const handleTestSettings = () => {
    if (!testEmail) {
      toast({
        title: "Test Email Required",
        description: "Please enter an email address to receive the test email.",
        variant: "destructive",
      });
      return;
    }

    const formData = form.getValues();
    testSettingsMutation.mutate({ ...formData, testEmail });
  };

  const handleDeleteSettings = () => {
    if (confirm("Are you sure you want to delete the SMTP settings? This will disable email notifications.")) {
      deleteSettingsMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading SMTP settings...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="mr-2 h-5 w-5" />
            SMTP Configuration Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {smtpSettings ? (
                <>
                  <Check className="h-5 w-5 text-green-500" />
                  <span>SMTP Configured</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Active
                  </Badge>
                </>
              ) : (
                <>
                  <X className="h-5 w-5 text-red-500" />
                  <span>SMTP Not Configured</span>
                  <Badge variant="secondary" className="bg-red-100 text-red-800">
                    Inactive
                  </Badge>
                </>
              )}
            </div>
            {smtpSettings && (
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleDeleteSettings}
                disabled={deleteSettingsMutation.isPending}
              >
                Delete Settings
              </Button>
            )}
          </div>
          {smtpSettings && (
            <div className="mt-4 text-sm text-gray-600">
              <p><strong>Host:</strong> {smtpSettings.host}:{smtpSettings.port}</p>
              <p><strong>From:</strong> {smtpSettings.fromName} &lt;{smtpSettings.fromEmail}&gt;</p>
              <p><strong>Encryption:</strong> {smtpSettings.encryption.toUpperCase()}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuration Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="mr-2 h-5 w-5" />
            SMTP Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="host"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SMTP Host</FormLabel>
                      <FormControl>
                        <Input placeholder="smtp.gmail.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="port"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Port</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="587" 
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 587)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="your-email@gmail.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="Your password or app password" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="encryption"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Encryption</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select encryption type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="tls">TLS (Recommended)</SelectItem>
                        <SelectItem value="ssl">SSL</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fromEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="noreply@hostfarm.org" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fromName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From Name</FormLabel>
                      <FormControl>
                        <Input placeholder="HostFarm.org" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={testConnectionMutation.isPending || !form.formState.isValid}
                  className="flex items-center"
                >
                  {testConnectionMutation.isPending ? (
                    <>
                      <TestTube className="mr-2 h-4 w-4 animate-spin" />
                      Testing Connection...
                    </>
                  ) : (
                    <>
                      <Wifi className="mr-2 h-4 w-4" />
                      Test SMTP Connection
                    </>
                  )}
                </Button>
                <Button 
                  type="submit"
                  disabled={saveSettingsMutation.isPending}
                >
                  {saveSettingsMutation.isPending ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Test Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TestTube className="mr-2 h-5 w-5" />
            Test SMTP Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Test Email Address</label>
              <Input 
                type="email"
                placeholder="test@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button 
              onClick={handleTestSettings}
              disabled={testSettingsMutation.isPending || !form.formState.isValid}
              className="w-full"
            >
              {testSettingsMutation.isPending ? "Sending Test Email..." : "Send Test Email"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}