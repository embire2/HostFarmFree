import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, CheckCircle, XCircle, UserPlus, LogIn, AlertTriangle, Shield } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useDeviceFingerprint } from "@/lib/device-fingerprint";
import { trackPurchaseEvent } from "@/components/facebook-pixel";

interface DomainSearchProps {
  onSuccess?: () => void;
}

export default function DomainSearch({ onSuccess }: DomainSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [lastSearched, setLastSearched] = useState("");
  const [deviceLimits, setDeviceLimits] = useState<{
    canRegister: boolean;
    currentDevices: number;
    maxDevices: number;
  } | null>(null);
  const { toast } = useToast();
  const { isAuthenticated, anonymousRegisterMutation } = useAuth();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { canRegisterAccount, recordFingerprint } = useDeviceFingerprint();

  // Check device limits on component mount (only once)
  useEffect(() => {
    const checkDeviceLimits = async () => {
      try {
        const limits = await canRegisterAccount();
        setDeviceLimits(limits);
      } catch (error) {
        console.error("Failed to check device limits:", error);
      }
    };

    // Only check once when component mounts
    if (!deviceLimits) {
      checkDeviceLimits();
    }
  }, []); // Remove canRegisterAccount dependency to prevent frequent calls

  const { data: searchResult, isLoading: isSearching } = useQuery({
    queryKey: ["/api/check-subdomain", lastSearched],
    queryFn: async () => {
      if (!lastSearched) return null;
      const subdomain = lastSearched.replace('.hostme.today', '');
      const response = await fetch(`/api/check-subdomain/${subdomain}`);
      return response.json();
    },
    enabled: !!lastSearched,
    retry: false,
  });

  const domainRegistrationMutation = useMutation({
    mutationFn: async (subdomain: string) => {
      // Generate device fingerprint data for registration
      const fingerprint = await useDeviceFingerprint().generateFingerprint();
      
      const response = await apiRequest("POST", "/api/register-domain", {
        subdomain,
        packageId: 1, // Default to free package
        // Include device fingerprint data for enforcement
        fingerprintHash: fingerprint.fingerprintHash,
        macAddress: fingerprint.macAddress,
        userAgent: fingerprint.userAgent,
        screenResolution: fingerprint.screenResolution,
        timezone: fingerprint.timezone,
        language: fingerprint.language,
        platformInfo: fingerprint.platformInfo,
      });
      return response.json();
    },
    onSuccess: async (data) => {
      console.log("[Domain Registration] Success:", data);
      
      // Track Facebook Pixel purchase event for new account creation
      try {
        await trackPurchaseEvent();
        console.log("[Domain Registration] Facebook Pixel purchase event tracked successfully");
      } catch (error) {
        console.warn("[Domain Registration] Failed to track Facebook Pixel purchase event:", error);
      }
      
      // Store credentials temporarily for display
      sessionStorage.setItem('newCredentials', JSON.stringify({
        username: data.user.username,
        password: data.user.password,
        recoveryPhrase: data.user.recoveryPhrase,
        domain: data.hostingAccount.domain,
        registrationTime: Date.now()
      }));
      
      toast({
        title: "🎉 Account Created Successfully!",
        description: `Your website ${data.hostingAccount.domain} is ready! Redirecting to dashboard...`,
      });
      
      setSearchTerm("");
      setLastSearched("");
      
      // Redirect to dashboard immediately - account is already created and ready
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);
      
      onSuccess?.();
    },
    onError: (error: Error) => {
      console.error("[Domain Registration] Error:", error);
      
      // Handle device limit exceeded error specifically
      if (error.message.includes("Device registration limit exceeded")) {
        toast({
          title: "Device Registration Limit Reached",
          description: "You've reached the maximum number of devices for account registration. Please use an existing account or contact support.",
          variant: "destructive",
        });
        
        // Update device limits state to show warning
        setDeviceLimits({
          canRegister: false,
          currentDevices: 2,
          maxDevices: 2
        });
      } else {
        toast({
          title: "Registration Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });

  const hostingAccountMutation = useMutation({
    mutationFn: async (subdomain: string) => {
      const response = await apiRequest("POST", "/api/hosting-accounts", {
        subdomain,
        packageId: 1, // Default to free package
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success!",
        description: "Your hosting account has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/hosting-accounts"] });
      setSearchTerm("");
      setLastSearched("");
      // Redirect to dashboard
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSearch = () => {
    if (!searchTerm.trim()) return;
    setLastSearched(searchTerm.trim());
  };

  const handleCreateHosting = () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create a hosting account.",
        variant: "destructive",
      });
      return;
    }
    // If user is authenticated, use hosting account creation for existing users
    const subdomain = searchTerm.trim().replace('.hostme.today', '');
    hostingAccountMutation.mutate(subdomain);
  };

  const handleSignUp = async () => {
    // Check device limits before allowing registration
    if (deviceLimits && !deviceLimits.canRegister) {
      toast({
        title: "Device Limit Reached",
        description: `You can only register accounts from ${deviceLimits.maxDevices} devices. Currently registered on ${deviceLimits.currentDevices} devices.`,
        variant: "destructive",
      });
      return;
    }

    // Use new integrated domain registration that creates everything at once
    const subdomain = lastSearched.replace('.hostme.today', '');
    domainRegistrationMutation.mutate(subdomain);
  };

  const handleSignIn = async () => {
    // Check device limits before allowing registration
    if (deviceLimits && !deviceLimits.canRegister) {
      toast({
        title: "Device Limit Reached",
        description: `You can only register accounts from ${deviceLimits.maxDevices} devices. Currently registered on ${deviceLimits.currentDevices} devices.`,
        variant: "destructive",
      });
      return;
    }

    // For new domain registration, create everything at once
    const subdomain = lastSearched.replace('.hostme.today', '');
    domainRegistrationMutation.mutate(subdomain);
  };

  const isAvailable = lastSearched && searchResult?.available && !isSearching;
  const isUnavailable = lastSearched && searchResult && !searchResult.available && !isSearching;

  return (
    <Card className="max-w-2xl mx-auto glass border-white/20">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-white">
          Search Your Free Domain
        </h3>

        {/* Device Limit Warning */}
        {deviceLimits && !deviceLimits.canRegister && (
          <Alert className="mb-4 border-red-500 bg-red-500/10">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-200">
              <strong>Device Limit Reached:</strong> You can only register accounts from {deviceLimits.maxDevices} devices. 
              Currently registered on {deviceLimits.currentDevices} devices. Please use an existing account or contact support.
            </AlertDescription>
          </Alert>
        )}

        {/* Group Limits Info */}
        {deviceLimits && deviceLimits.canRegister && (
          <Alert className="mb-4 border-blue-500 bg-blue-500/10">
            <Shield className="h-4 w-4" />
            <AlertDescription className="text-blue-200">
              <strong>Account Limits:</strong> You can register accounts from {deviceLimits.maxDevices} devices. 
              Currently using {deviceLimits.currentDevices} of {deviceLimits.maxDevices} devices.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1 relative">
            <Input
              type="text"
              placeholder="Enter your desired domain name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              className="bg-white text-dark placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent pr-36"
            />
            <span className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold px-2.5 py-1.5 rounded-md shadow-md text-xs border border-blue-500/30">
              .hostme.today
            </span>
          </div>
          <Button
            onClick={handleSearch}
            disabled={!searchTerm.trim() || isSearching}
            className="bg-accent hover:bg-green-600 text-white"
          >
            <Search className="w-4 h-4 mr-2" />
            {isSearching ? "Searching..." : "Search"}
          </Button>
        </div>

        {lastSearched && (
          <div className="mt-4">
            {isSearching && (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                <span className="ml-2 text-white">Checking availability...</span>
              </div>
            )}

            {isAvailable && (
              <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center text-green-100">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    <span className="font-medium">
                      {searchResult?.domain || `${lastSearched}.hostme.today`} is available!
                    </span>
                  </div>
                  {searchResult?.message && (
                    <p className="text-green-200 text-sm mt-1">{searchResult.message}</p>
                  )}
                </div>
                
                {isAuthenticated ? (
                  <div className="flex justify-end">
                    <Button
                      onClick={handleCreateHosting}
                      disabled={hostingAccountMutation.isPending}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {hostingAccountMutation.isPending ? "Creating..." : "Create Hosting Account"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-green-100 text-base font-medium text-center">
                      🎉 Claim this domain now!
                    </p>
                    <div className="flex justify-center">
                      <Button
                        onClick={handleSignUp}
                        size="lg"
                        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                      >
                        <UserPlus className="w-5 h-5 mr-3" />
                        Create Your Free Account
                      </Button>
                    </div>
                    <p className="text-green-200 text-xs text-center opacity-80">
                      No credit card required • Setup takes less than 30 seconds
                    </p>
                  </div>
                )}
              </div>
            )}

            {isUnavailable && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-center text-red-100">
                  <XCircle className="w-5 h-5 mr-2" />
                  <span className="font-medium">
                    {searchResult?.domain || `${lastSearched}.hostme.today`} is not available
                  </span>
                </div>
                {searchResult?.message && (
                  <div className="mt-2 text-sm text-red-200">
                    {searchResult.message}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
