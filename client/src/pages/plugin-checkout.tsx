import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Heart } from 'lucide-react';
import Navbar from "@/components/navbar";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CheckoutForm = ({ pluginName }: { pluginName: string }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/plugin-checkout-success`,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Payment Successful",
        description: `Thank you for supporting ${pluginName}!`,
      });
      // Redirect to success page or back to plugin
      setTimeout(() => {
        setLocation('/plugins');
      }, 2000);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || !elements}
        className="w-full bg-green-600 hover:bg-green-700 text-white"
        size="lg"
      >
        <Heart className="w-4 h-4 mr-2" />
        Donate $5
      </Button>
    </form>
  );
};

export default function PluginCheckout() {
  const { slug } = useParams<{ slug: string }>();
  const [, setLocation] = useLocation();
  const [clientSecret, setClientSecret] = useState("");
  const [pluginName, setPluginName] = useState("");

  useEffect(() => {
    if (!slug) {
      setLocation('/plugins');
      return;
    }

    // Get plugin details and create payment intent
    const initializePayment = async () => {
      try {
        // Get plugin details first
        const pluginRes = await fetch(`/api/plugins/slug/${slug}`);
        if (!pluginRes.ok) {
          throw new Error('Plugin not found');
        }
        const plugin = await pluginRes.json();
        setPluginName(plugin.name);

        // Create payment intent
        const paymentRes = await apiRequest("POST", "/api/create-payment-intent", { 
          amount: 5,
          pluginId: plugin.id,
          pluginName: plugin.name 
        });
        const data = await paymentRes.json();
        setClientSecret(data.clientSecret);
      } catch (error) {
        console.error('Failed to initialize payment:', error);
        setLocation('/plugins');
      }
    };

    initializePayment();
  }, [slug, setLocation]);

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Setting up payment...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-md mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => setLocation(`/plugin/${slug}`)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Plugin
        </Button>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center">
              <Heart className="w-5 h-5 mr-2 text-green-600" />
              Support {pluginName}
            </CardTitle>
            <p className="text-gray-600">
              Help keep this plugin updated and maintained with a $5 donation
            </p>
          </CardHeader>
          <CardContent>
            <Elements 
              stripe={stripePromise} 
              options={{ 
                clientSecret,
                appearance: {
                  theme: 'stripe'
                }
              }}
            >
              <CheckoutForm pluginName={pluginName} />
            </Elements>
            
            <p className="text-xs text-gray-500 mt-4 text-center">
              Secure payment powered by Stripe • Your donation helps keep HostFarm.org free
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}