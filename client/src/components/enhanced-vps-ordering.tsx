import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  Lock, 
  Mail, 
  AlertCircle, 
  CheckCircle,
  ArrowRight,
  UserPlus,
  CreditCard
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

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

interface EnhancedVpsOrderingProps {
  selectedPackage: VpsPackage;
  selectedOS: string;
  onBack: () => void;
}

type AuthStep = 'email-check' | 'existing-user-auth' | 'new-user-creation' | 'payment';

export default function EnhancedVpsOrdering({ selectedPackage, selectedOS, onBack }: EnhancedVpsOrderingProps) {
  const [authStep, setAuthStep] = useState<AuthStep>('email-check');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Check if email exists in the system
  const checkEmailMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest("POST", "/api/check-user-email", { email });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.exists) {
        console.log("[VPS Auth] Email exists - user needs to authenticate");
        setUserInfo(data);
        setAuthStep('existing-user-auth');
      } else {
        console.log("[VPS Auth] Email not found - new user creation needed");
        setAuthStep('new-user-creation');
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to check email. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Authenticate existing user
  const authenticateUserMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await apiRequest("POST", "/api/authenticate-for-vps", { email, password });
      return response.json();
    },
    onSuccess: (data) => {
      console.log("[VPS Auth] Authentication successful");
      setUserInfo(data);
      setAuthStep('payment');
      toast({
        title: "Authentication Successful",
        description: "You can now proceed with your VPS order.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Authentication Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create new user
  const createUserMutation = useMutation({
    mutationFn: async ({ email, password, name }: { email: string; password: string; name: string }) => {
      const response = await apiRequest("POST", "/api/create-vps-user", { email, password, name });
      return response.json();
    },
    onSuccess: (data) => {
      console.log("[VPS Auth] User creation successful");
      setUserInfo(data);
      setAuthStep('payment');
      toast({
        title: "Account Created",
        description: "Your account has been created. You can now proceed with your VPS order.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Account Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Process VPS subscription
  const createVpsSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/create-vps-subscription", {
        packageId: selectedPackage.id,
        customerEmail: email,
        operatingSystem: selectedOS,
      });
      return response.json();
    },
    onSuccess: (data) => {
      console.log("[VPS Subscription] Subscription created successfully");
      
      // Store VPS order data for conversion tracking
      const vpsOrderData = {
        type: 'vps',
        packageName: selectedPackage.displayName,
        packagePrice: selectedPackage.price,
        operatingSystem: selectedOS,
        customerEmail: email,
        subscriptionId: data.subscription?.id,
        timestamp: new Date().toISOString()
      };
      
      sessionStorage.setItem('vpsOrderData', JSON.stringify(vpsOrderData));
      
      // Redirect to conversion tracking page for 5 seconds, then to checkout
      const conversionUrl = `/conversion?type=vps&destination=${encodeURIComponent(data.checkoutUrl)}`;
      console.log(`[VPS Subscription] Redirecting to conversion page: ${conversionUrl}`);
      setLocation(conversionUrl);
    },
    onError: (error: Error) => {
      toast({
        title: "VPS Order Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsProcessing(false);
    },
  });

  const handleEmailCheck = () => {
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }
    checkEmailMutation.mutate(email);
  };

  const handleAuthentication = () => {
    if (!password) {
      toast({
        title: "Password Required",
        description: "Please enter your password.",
        variant: "destructive",
      });
      return;
    }
    authenticateUserMutation.mutate({ email, password });
  };

  const handleUserCreation = () => {
    if (!password || !confirmPassword || !name) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    if (password !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }
    
    if (password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }
    
    createUserMutation.mutate({ email, password, name });
  };

  const handlePayment = () => {
    setIsProcessing(true);
    createVpsSubscriptionMutation.mutate();
  };

  const renderEmailCheckStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Mail className="mr-2 h-5 w-5" />
          Enter Your Email Address
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your.email@example.com"
            required
          />
        </div>
        
        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            Back to Packages
          </Button>
          <Button 
            onClick={handleEmailCheck}
            disabled={checkEmailMutation.isPending}
          >
            {checkEmailMutation.isPending ? "Checking..." : "Continue"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderExistingUserAuth = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Lock className="mr-2 h-5 w-5" />
          Welcome Back!
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            We found your account: <strong>{userInfo?.username}</strong>
            <br />
            Please enter your password to continue.
          </AlertDescription>
        </Alert>
        
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />
        </div>
        
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setAuthStep('email-check')}>
            Back
          </Button>
          <Button 
            onClick={handleAuthentication}
            disabled={authenticateUserMutation.isPending}
          >
            {authenticateUserMutation.isPending ? "Authenticating..." : "Sign In"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderNewUserCreation = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <UserPlus className="mr-2 h-5 w-5" />
          Create Your Account
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            We'll create a new account for <strong>{email}</strong>
          </AlertDescription>
        </Alert>
        
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="new-password">Password</Label>
          <Input
            id="new-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a password (min 6 characters)"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm Password</Label>
          <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your password"
            required
          />
        </div>
        
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setAuthStep('email-check')}>
            Back
          </Button>
          <Button 
            onClick={handleUserCreation}
            disabled={createUserMutation.isPending}
          >
            {createUserMutation.isPending ? "Creating Account..." : "Create Account"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderPaymentStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <CreditCard className="mr-2 h-5 w-5" />
          Complete Your Order
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Ready to proceed with your VPS order for <strong>{userInfo?.username || email}</strong>
          </AlertDescription>
        </Alert>
        
        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <h3 className="font-medium">Order Summary</h3>
          <div className="flex justify-between">
            <span>Package:</span>
            <span>{selectedPackage.displayName}</span>
          </div>
          <div className="flex justify-between">
            <span>Operating System:</span>
            <span>{selectedOS}</span>
          </div>
          <div className="flex justify-between">
            <span>Price:</span>
            <span className="font-bold">${(selectedPackage.price / 100).toFixed(2)}/month</span>
          </div>
        </div>
        
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setAuthStep(userInfo?.exists ? 'existing-user-auth' : 'new-user-creation')}>
            Back
          </Button>
          <Button 
            onClick={handlePayment}
            disabled={isProcessing}
            className="bg-green-600 hover:bg-green-700"
          >
            {isProcessing ? "Processing..." : "Proceed to Payment"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">VPS Order Process</h2>
        <p className="text-muted-foreground">
          {selectedPackage.displayName} - ${(selectedPackage.price / 100).toFixed(2)}/month
        </p>
      </div>

      <Separator />

      {authStep === 'email-check' && renderEmailCheckStep()}
      {authStep === 'existing-user-auth' && renderExistingUserAuth()}
      {authStep === 'new-user-creation' && renderNewUserCreation()}
      {authStep === 'payment' && renderPaymentStep()}
    </div>
  );
}