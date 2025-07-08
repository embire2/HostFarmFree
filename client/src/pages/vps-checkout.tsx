import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, CreditCard, Server, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/navbar";

// Load Stripe
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CheckoutForm = ({ subscriptionId, onSuccess }: { subscriptionId: string; onSuccess: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/vps-success?subscription_id=${subscriptionId}&order_id=${(window as any).vpsOrderId || ''}`,
      },
    });

    if (error) {
      console.error('Payment failed:', error);
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      onSuccess();
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || isLoading}
        className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-3"
      >
        <CreditCard className="mr-2 h-4 w-4" />
        {isLoading ? "Processing..." : "Complete VPS Setup"}
      </Button>
    </form>
  );
};

export default function VpsCheckout() {
  const [, setLocation] = useLocation();
  const [clientSecret, setClientSecret] = useState<string>("");
  const [subscriptionId, setSubscriptionId] = useState<string>("");
  const [paymentComplete, setPaymentComplete] = useState(false);

  useEffect(() => {
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const subscription_id = urlParams.get('subscription_id');
    const client_secret = urlParams.get('client_secret');

    if (subscription_id && client_secret) {
      setSubscriptionId(subscription_id);
      setClientSecret(client_secret);
    } else {
      // Redirect back if missing parameters
      setLocation('/');
    }
  }, [setLocation]);

  const handlePaymentSuccess = () => {
    setPaymentComplete(true);
  };

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full mx-auto" />
          <p className="text-white mt-4">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (paymentComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-lg mx-auto bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-8 text-center">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-4">VPS Setup Complete!</h2>
              <p className="text-gray-300 mb-6">
                Your VPS is being provisioned and will be ready within a few minutes. 
                You'll receive setup instructions via email shortly.
              </p>
              <Button 
                onClick={() => setLocation('/')}
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
              >
                Return to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const appearanceOptions = {
    theme: 'night' as const,
    variables: {
      colorPrimary: '#3b82f6',
      colorBackground: '#1f2937',
      colorText: '#ffffff',
      borderRadius: '8px',
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <Navbar />
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-4">
              Complete Your VPS Setup
            </h1>
            <p className="text-gray-300">
              Secure your anonymous VPS hosting with Stripe payment processing
            </p>
          </div>

          {/* Back Button */}
          <Button 
            variant="outline" 
            onClick={() => setLocation('/')}
            className="mb-6 border-white/20 text-white hover:bg-white/10"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to VPS Selection
          </Button>

          {/* Checkout Card */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Server className="mr-2 h-5 w-5" />
                VPS Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Security Notice */}
              <Alert className="border-green-500 bg-green-500/10">
                <AlertDescription className="text-green-200">
                  <strong>100% Anonymous:</strong> Your payment is processed securely by Stripe. 
                  No personal information is stored on our servers.
                </AlertDescription>
              </Alert>

              {/* Payment Form */}
              <Elements 
                stripe={stripePromise} 
                options={{ 
                  clientSecret,
                  appearance: appearanceOptions
                }}
              >
                <CheckoutForm 
                  subscriptionId={subscriptionId}
                  onSuccess={handlePaymentSuccess}
                />
              </Elements>

              {/* Features */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="text-white font-semibold mb-3">What's Included:</h3>
                <ul className="text-gray-300 text-sm space-y-2">
                  <li>• Full root access to your VPS</li>
                  <li>• Setup within 5 minutes</li>
                  <li>• 99.9% uptime guarantee</li>
                  <li>• Monthly billing, cancel anytime</li>
                  <li>• DDoS protection included</li>
                  <li>• Multiple operating system options</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}