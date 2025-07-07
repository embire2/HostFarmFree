import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import LoginModal from "@/components/login-modal";

const pluginRequestSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  pluginName: z.string().min(3, "Plugin name must be at least 3 characters"),
});

type PluginRequestForm = z.infer<typeof pluginRequestSchema>;

export default function PluginRequestForm() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);

  const form = useForm<PluginRequestForm>({
    resolver: zodResolver(pluginRequestSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: user?.email || "",
      pluginName: "",
    },
  });

  const submitRequestMutation = useMutation({
    mutationFn: async (data: PluginRequestForm) => {
      const res = await apiRequest("POST", "/api/plugin-requests", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Request Submitted",
        description: "Your plugin request has been submitted successfully. We'll review it and get back to you.",
      });
      form.reset();
      setShowForm(false);
    },
    onError: (error: any) => {
      toast({
        title: "Request Failed",
        description: error.message || "Failed to submit plugin request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PluginRequestForm) => {
    submitRequestMutation.mutate(data);
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center">
        <LoginModal>
          <Button 
            className="bg-white text-primary hover:bg-gray-100 px-8 py-3"
          >
            Sign In to Request Plugin
          </Button>
        </LoginModal>
        <p className="text-sm opacity-75 mt-2">
          You must be logged in to request plugins
        </p>
      </div>
    );
  }

  if (!showForm) {
    return (
      <div className="text-center">
        <Button 
          className="bg-white text-primary hover:bg-gray-100 px-8 py-3"
          onClick={() => setShowForm(true)}
        >
          Request a Plugin
        </Button>
      </div>
    );
  }

  return (
    <Card className="bg-white text-gray-900 mx-auto max-w-2xl">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">Request a Plugin</h3>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowForm(false)}
          >
            Cancel
          </Button>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your first name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your last name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="your.email@example.com" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pluginName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plugin Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Name of the WordPress plugin you need" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Daily Limit:</strong> You can submit up to 2 plugin requests per day. 
                We'll review your request and add popular plugins to our library.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={submitRequestMutation.isPending}
                className="bg-primary text-white hover:bg-primary/90"
              >
                {submitRequestMutation.isPending ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}