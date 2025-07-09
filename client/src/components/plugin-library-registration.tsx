import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  Library, 
  User, 
  Mail, 
  Globe, 
  Lock,
  CheckCircle,
  Download,
  Star,
  Puzzle
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

const registrationSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  country: z.string().min(2, "Please enter your country"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegistrationForm = z.infer<typeof registrationSchema>;

export default function PluginLibraryRegistration() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<RegistrationForm>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      country: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegistrationForm) => {
    setIsSubmitting(true);
    
    try {
      const response = await apiRequest("POST", "/api/plugin-library-register", {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        country: data.country,
        password: data.password,
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log("[Plugin Library Registration] ✅ Registration successful:", result);
        
        // Update auth cache immediately with the new user data
        const userData = {
          id: result.user.id,
          username: result.user.username,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          role: "client",
          isAnonymous: false,
          displayPassword: data.password // Include for potential display
        };
        
        console.log("[Plugin Library Registration] Updating auth cache with user data:", userData);
        queryClient.setQueryData(["/api/user"], userData);
        
        toast({
          title: "Registration Successful!",
          description: "Welcome to the WordPress Plugin Library. You can now access premium plugins.",
        });
        
        try {
          // Store registration success data for conversion tracking
          const registrationData = {
            type: 'plugin',
            userInfo: {
              firstName: data.firstName,
              lastName: data.lastName,
              email: data.email,
              country: data.country
            },
            timestamp: new Date().toISOString()
          };
          
          console.log("[Plugin Library Registration] Storing registration data for conversion tracking");
          sessionStorage.setItem('pluginRegistrationData', JSON.stringify(registrationData));
          
          // Redirect to conversion tracking page for 5 seconds, then to plugins
          const conversionUrl = `/conversion?type=plugin&destination=${encodeURIComponent('/plugins')}`;
          console.log(`[Plugin Library Registration] Redirecting to conversion page: ${conversionUrl}`);
          setLocation(conversionUrl);
        } catch (error) {
          console.error("[Plugin Library Registration] ❌ Error setting up conversion tracking:", error);
          // Fallback to original redirect
          setTimeout(() => {
            setLocation("/plugins");
          }, 2000);
        }
      } else {
        toast({
          title: "Registration Failed",
          description: result.message || "Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Registration Error",
        description: "An error occurred during registration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // If user is already authenticated, show access message
  if (user) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Alert className="border-green-500 bg-green-500/10">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription className="text-green-200">
            <strong>You already have access!</strong> You can browse and download premium WordPress plugins.
          </AlertDescription>
        </Alert>

        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="p-6 text-center space-y-4">
            <Library className="w-16 h-16 text-purple-400 mx-auto" />
            <h3 className="text-xl font-bold text-white">Access Plugin Library</h3>
            <p className="text-gray-300">
              Browse our collection of premium WordPress plugins and themes.
            </p>
            <Button
              onClick={() => setLocation("/plugins")}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
            >
              <Download className="mr-2 h-4 w-4" />
              Browse Plugins
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <Library className="w-16 h-16 text-purple-400 mx-auto" />
        <h2 className="text-2xl font-bold text-white">
          WordPress Plugin Library Access
        </h2>
        <p className="text-gray-300">
          Register to access our premium WordPress plugin collection. Unlike our anonymous services, 
          this requires your details for content access and support.
        </p>
      </div>

      {/* Registration Form */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <User className="mr-2 h-5 w-5" />
            Create Your Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* First Name */}
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-white">
                First Name
              </Label>
              <Input
                id="firstName"
                {...form.register("firstName")}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                placeholder="Enter your first name"
              />
              {form.formState.errors.firstName && (
                <p className="text-red-400 text-sm">
                  {form.formState.errors.firstName.message}
                </p>
              )}
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-white">
                Last Name
              </Label>
              <Input
                id="lastName"
                {...form.register("lastName")}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                placeholder="Enter your last name"
              />
              {form.formState.errors.lastName && (
                <p className="text-red-400 text-sm">
                  {form.formState.errors.lastName.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                {...form.register("email")}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                placeholder="your-email@example.com"
              />
              {form.formState.errors.email && (
                <p className="text-red-400 text-sm">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            {/* Country */}
            <div className="space-y-2">
              <Label htmlFor="country" className="text-white">
                Country
              </Label>
              <Input
                id="country"
                {...form.register("country")}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                placeholder="Enter your country"
              />
              {form.formState.errors.country && (
                <p className="text-red-400 text-sm">
                  {form.formState.errors.country.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                {...form.register("password")}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                placeholder="Create a secure password"
              />
              {form.formState.errors.password && (
                <p className="text-red-400 text-sm">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-white">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                {...form.register("confirmPassword")}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                placeholder="Confirm your password"
              />
              {form.formState.errors.confirmPassword && (
                <p className="text-red-400 text-sm">
                  {form.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3"
            >
              <Library className="mr-2 h-4 w-4" />
              {isSubmitting ? "Creating Account..." : "Create Account & Access Library"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Benefits Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="p-6 text-center">
            <Puzzle className="w-12 h-12 text-purple-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Premium Plugins</h3>
            <p className="text-gray-300 text-sm">
              Access to high-quality WordPress plugins and themes from top developers.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="p-6 text-center">
            <Download className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Instant Downloads</h3>
            <p className="text-gray-300 text-sm">
              Download plugins immediately after registration. No waiting periods.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="p-6 text-center">
            <Star className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Regular Updates</h3>
            <p className="text-gray-300 text-sm">
              Get notified when new plugins are added to our growing collection.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Privacy Notice */}
      <Alert className="border-blue-500 bg-blue-500/10">
        <Lock className="h-4 w-4" />
        <AlertDescription className="text-blue-200">
          <strong>Privacy Notice:</strong> Your information is only used for plugin access and support. 
          We don't share your data with third parties.
        </AlertDescription>
      </Alert>
    </div>
  );
}