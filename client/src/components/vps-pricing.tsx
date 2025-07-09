import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  Server, 
  Cpu, 
  HardDrive, 
  MemoryStick, 
  Network,
  Shield,
  CreditCard,
  CheckCircle,
  Globe
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

interface VpsPackageCardProps {
  pkg: VpsPackage;
  isSelected: boolean;
  onSelect: (pkg: VpsPackage) => void;
}

function VpsPackageCard({ pkg, isSelected, onSelect }: VpsPackageCardProps) {
  const osOptions = JSON.parse(pkg.osChoices || "[]");
  const isPopular = pkg.name === "professional";

  return (
    <Card 
      className={`relative cursor-pointer transition-all duration-300 hover:scale-105 ${
        isSelected 
          ? "border-blue-500 bg-blue-500/10 shadow-lg" 
          : "border-white/20 bg-white/5 hover:bg-white/10"
      }`}
      onClick={() => onSelect(pkg)}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1">
            Most Popular
          </Badge>
        </div>
      )}
      
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-xl font-bold text-white">
          {pkg.displayName}
        </CardTitle>
        <p className="text-gray-300 text-sm">{pkg.description}</p>
        
        <div className="mt-4">
          <span className="text-3xl font-bold text-white">
            ${(pkg.price / 100).toFixed(2)}
          </span>
          <span className="text-gray-300 ml-1">/month</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Specifications */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-gray-300">
              <Cpu className="w-4 h-4 mr-2" />
              <span className="text-sm">vCPU</span>
            </div>
            <span className="text-white font-medium">{pkg.vcpu}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center text-gray-300">
              <MemoryStick className="w-4 h-4 mr-2" />
              <span className="text-sm">RAM</span>
            </div>
            <span className="text-white font-medium">{pkg.memory / 1024}GB</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center text-gray-300">
              <HardDrive className="w-4 h-4 mr-2" />
              <span className="text-sm">Storage</span>
            </div>
            <span className="text-white font-medium">
              {pkg.storage}GB
              {pkg.additionalStorage > 0 && ` + ${pkg.additionalStorage}GB`}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center text-gray-300">
              <Network className="w-4 h-4 mr-2" />
              <span className="text-sm">Network</span>
            </div>
            <span className="text-white font-medium">{pkg.trafficPort}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center text-gray-300">
              <Globe className="w-4 h-4 mr-2" />
              <span className="text-sm">IPv4</span>
            </div>
            <span className="text-white font-medium">{pkg.ipv4Addresses}</span>
          </div>
        </div>

        <Separator className="bg-white/20" />

        {/* OS Options */}
        <div>
          <p className="text-gray-300 text-sm mb-2">Operating Systems:</p>
          <div className="flex flex-wrap gap-1">
            {osOptions.slice(0, 2).map((os: any, index: number) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {os.label}
              </Badge>
            ))}
            {osOptions.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{osOptions.length - 2} more
              </Badge>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="space-y-2">
          <div className="flex items-center text-green-400">
            <CheckCircle className="w-4 h-4 mr-2" />
            <span className="text-sm">100% Anonymous</span>
          </div>
          <div className="flex items-center text-green-400">
            <CheckCircle className="w-4 h-4 mr-2" />
            <span className="text-sm">Instant Setup</span>
          </div>
          <div className="flex items-center text-green-400">
            <CheckCircle className="w-4 h-4 mr-2" />
            <span className="text-sm">Root Access</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function VpsPricing() {
  const [selectedPackage, setSelectedPackage] = useState<VpsPackage | null>(null);
  const [customerEmail, setCustomerEmail] = useState("");
  const [selectedOS, setSelectedOS] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const { data: packages, isLoading } = useQuery<VpsPackage[]>({
    queryKey: ["/api/vps-packages"],
    queryFn: () => apiRequest("GET", "/api/vps-packages").then(res => res.json()),
  });

  const handleSelectPackage = (pkg: VpsPackage) => {
    setSelectedPackage(pkg);
    
    // Reset OS selection when package changes
    const osOptions = JSON.parse(pkg.osChoices || "[]");
    if (osOptions.length > 0) {
      setSelectedOS(osOptions[0].value);
    }
  };

  const handleCreateSubscription = async () => {
    if (!selectedPackage || !customerEmail || !selectedOS) {
      toast({
        title: "Missing Information",
        description: "Please select a package, enter an email, and choose an operating system.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Create VPS subscription
      const response = await apiRequest("POST", "/api/create-vps-subscription", {
        packageId: selectedPackage.id,
        customerEmail,
        operatingSystem: selectedOS,
      });

      const result = await response.json();

      if (result.clientSecret) {
        console.log("[VPS Subscription] ✅ VPS subscription created successfully:", {
          subscriptionId: result.subscriptionId,
          orderId: result.orderId,
          packageName: result.packageName
        });
        
        // Store order ID and user account info globally for checkout success redirect
        (window as any).vpsOrderId = result.orderId;
        (window as any).vpsUserAccount = result.userAccount;
        
        try {
          // Store VPS subscription data for conversion tracking
          const vpsData = {
            type: 'vps',
            subscriptionInfo: {
              subscriptionId: result.subscriptionId,
              orderId: result.orderId,
              packageName: result.packageName,
              monthlyPrice: result.monthlyPrice,
              customerEmail: customerEmail,
              operatingSystem: selectedOS
            },
            userAccount: result.userAccount,
            timestamp: new Date().toISOString()
          };
          
          console.log("[VPS Subscription] Storing VPS data for conversion tracking");
          sessionStorage.setItem('vpsSubscriptionData', JSON.stringify(vpsData));
          
          // Redirect to conversion tracking page for 5 seconds, then to VPS checkout
          const checkoutUrl = `/vps-checkout?subscription_id=${result.subscriptionId}&client_secret=${result.clientSecret}&order_id=${result.orderId}`;
          const conversionUrl = `/conversion?type=vps&destination=${encodeURIComponent(checkoutUrl)}`;
          console.log(`[VPS Subscription] Redirecting to conversion page: ${conversionUrl}`);
          window.location.href = conversionUrl;
        } catch (error) {
          console.error("[VPS Subscription] ❌ Error setting up conversion tracking:", error);
          // Fallback to direct checkout redirect
          window.location.href = `/vps-checkout?subscription_id=${result.subscriptionId}&client_secret=${result.clientSecret}&order_id=${result.orderId}`;
        }
      } else {
        throw new Error("Failed to create subscription");
      }
    } catch (error) {
      console.error("Error creating VPS subscription:", error);
      toast({
        title: "Subscription Error",
        description: "Failed to create VPS subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
        <p className="text-gray-300 mt-4">Loading VPS packages...</p>
      </div>
    );
  }

  if (!packages || packages.length === 0) {
    return (
      <Alert className="border-yellow-500 bg-yellow-500/10">
        <AlertDescription className="text-yellow-200">
          No VPS packages are currently available. Please check back later.
        </AlertDescription>
      </Alert>
    );
  }

  const osOptions = selectedPackage ? JSON.parse(selectedPackage.osChoices || "[]") : [];

  return (
    <div className="space-y-8">
      {/* VPS Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {packages.map((pkg) => (
          <VpsPackageCard
            key={pkg.id}
            pkg={pkg}
            isSelected={selectedPackage?.id === pkg.id}
            onSelect={handleSelectPackage}
          />
        ))}
      </div>

      {/* Configuration Form */}
      {selectedPackage && (
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Server className="mr-2 h-5 w-5" />
              Configure Your {selectedPackage.displayName}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Anonymous Notice */}
            <Alert className="border-green-500 bg-green-500/10">
              <Shield className="h-4 w-4" />
              <AlertDescription className="text-green-200">
                <strong>100% Anonymous:</strong> Only email required for billing. No personal information needed.
              </AlertDescription>
            </Alert>

            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">
                Email Address (for billing only)
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your-email@example.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              />
            </div>

            {/* OS Selection */}
            <div className="space-y-2">
              <Label htmlFor="os" className="text-white">
                Operating System
              </Label>
              <select
                id="os"
                value={selectedOS}
                onChange={(e) => setSelectedOS(e.target.value)}
                className="w-full p-3 bg-white/10 border border-white/20 rounded-md text-white"
              >
                <option value="" disabled>Select an operating system</option>
                {osOptions.map((os: any) => (
                  <option key={os.value} value={os.value} className="bg-gray-900">
                    {os.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Pricing Summary */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Monthly Cost:</span>
                <span className="text-2xl font-bold text-white">
                  ${(selectedPackage.price / 100).toFixed(2)}/month
                </span>
              </div>
              <p className="text-sm text-gray-400 mt-2">
                Billed monthly via Stripe. Cancel anytime.
              </p>
            </div>

            {/* Create Button */}
            <Button 
              onClick={handleCreateSubscription}
              disabled={isProcessing || !customerEmail || !selectedOS}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-3"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              {isProcessing ? "Processing..." : `Create VPS - $${(selectedPackage.price / 100).toFixed(2)}/month`}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Features Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="p-6 text-center">
            <Shield className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Anonymous Hosting</h3>
            <p className="text-gray-300 text-sm">
              No personal information required. Only email for billing. Complete privacy protection.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="p-6 text-center">
            <Server className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Instant Setup</h3>
            <p className="text-gray-300 text-sm">
              Your VPS will be ready within minutes. Full root access included.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="p-6 text-center">
            <CreditCard className="w-12 h-12 text-purple-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Flexible Billing</h3>
            <p className="text-gray-300 text-sm">
              Monthly billing via Stripe. Cancel anytime. No contracts or commitments.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}