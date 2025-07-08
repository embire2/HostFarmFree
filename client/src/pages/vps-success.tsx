import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Server, CreditCard, Clock, ArrowRight, User, Key, Copy, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import Navbar from "@/components/navbar";

export default function VpsSuccess() {
  const [, setLocation] = useLocation();
  const [subscriptionId, setSubscriptionId] = useState<string>("");
  const [orderId, setOrderId] = useState<string>("");
  const [userCredentials, setUserCredentials] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const subscription_id = urlParams.get('subscription_id');
    const order_id = urlParams.get('order_id');

    if (subscription_id) {
      setSubscriptionId(subscription_id);
    }
    if (order_id) {
      setOrderId(order_id);
    }

    // Get user credentials from global variable
    const credentials = (window as any).vpsCredentials;
    if (credentials) {
      setUserCredentials(credentials);
      // Clear the global variable for security
      delete (window as any).vpsCredentials;
    }

    // Track successful VPS purchase event for Facebook Pixel
    try {
      if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('track', 'Purchase', {
          value: 5.00, // Minimum VPS price
          currency: 'USD',
          content_category: 'VPS Hosting',
          content_name: 'Anonymous VPS Subscription',
        });
        console.log('[Facebook Pixel] VPS Purchase event tracked');
      }
    } catch (error) {
      console.error('[Facebook Pixel] Error tracking VPS purchase:', error);
    }
  }, []);

  const handleGoToDashboard = () => {
    setLocation('/dashboard');
  };

  const handleGoHome = () => {
    setLocation('/');
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <Navbar />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          {/* Success Icon */}
          <div className="mb-8">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">
              🎉 VPS Order Received!
            </h1>
            <p className="text-xl text-gray-300">
              Your anonymous VPS subscription has been successfully created
            </p>
          </div>

          {/* Order Details Card */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20 mb-8">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-center gap-2">
                <Server className="w-5 h-5" />
                Order Confirmation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {subscriptionId && (
                <div className="flex items-center justify-between text-gray-300">
                  <span className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Subscription ID:
                  </span>
                  <span className="font-mono text-sm bg-gray-800 px-2 py-1 rounded">
                    {subscriptionId}
                  </span>
                </div>
              )}
              
              {orderId && (
                <div className="flex items-center justify-between text-gray-300">
                  <span className="flex items-center gap-2">
                    <Server className="w-4 h-4" />
                    Order ID:
                  </span>
                  <span className="font-mono text-sm bg-gray-800 px-2 py-1 rounded">
                    #{orderId}
                  </span>
                </div>
              )}
              
              <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4 mt-6">
                <div className="flex items-center gap-3 text-blue-200">
                  <Clock className="w-5 h-5" />
                  <div className="text-left">
                    <h3 className="font-semibold">Processing Your Order</h3>
                    <p className="text-sm text-blue-300">
                      Our team will process your VPS setup within 24-48 hours. You'll receive an email with your server credentials once ready.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Credentials */}
          {userCredentials && (
            <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/30 mb-8">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-center">
                  <Key className="w-5 h-5 mr-2" />
                  Your Account Credentials
                </CardTitle>
                <p className="text-gray-300 text-sm text-center">
                  Save these credentials to access your dashboard and manage your VPS orders.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Username</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={userCredentials.username}
                        readOnly
                        className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-md font-mono text-sm text-white"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(userCredentials.username, "Username")}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Password</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={userCredentials.password}
                        readOnly
                        className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-md font-mono text-sm text-white"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(userCredentials.password, "Password")}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Email Address</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="email"
                      value={userCredentials.email}
                      readOnly
                      className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-sm text-white"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(userCredentials.email, "Email")}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="bg-amber-500/20 border border-amber-500/50 rounded-lg p-3">
                  <p className="text-amber-300 text-sm font-medium">
                    🔐 Important: Save these credentials safely!
                  </p>
                  <p className="text-amber-400 text-xs mt-1">
                    You'll need these to access your dashboard and manage your VPS orders.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Next Steps */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30">
              <CardContent className="p-6 text-center">
                <h3 className="text-lg font-semibold text-white mb-2">What's Next?</h3>
                <p className="text-gray-300 text-sm mb-4">
                  Monitor your subscription and manage settings in your dashboard
                </p>
                <Button 
                  onClick={handleGoToDashboard}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  Go to Dashboard
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 border-purple-500/30">
              <CardContent className="p-6 text-center">
                <h3 className="text-lg font-semibold text-white mb-2">Need Another Service?</h3>
                <p className="text-gray-300 text-sm mb-4">
                  Explore our free hosting and plugin library services
                </p>
                <Button 
                  onClick={handleGoHome}
                  variant="outline"
                  className="border-purple-500 text-purple-400 hover:bg-purple-500/20"
                >
                  Browse Services
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Important Notice */}
          <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-6">
            <h3 className="text-yellow-200 font-semibold mb-2">📧 Important Information</h3>
            <div className="text-yellow-100 text-sm space-y-2">
              <p>
                • Your VPS server will be provisioned within 24-48 hours
              </p>
              <p>
                • You'll receive an email with server credentials (IP, username, password)
              </p>
              <p>
                • Check your spam folder if you don't see the email within 48 hours
              </p>
              <p>
                • For urgent issues, contact us at ceo@openweb.email
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-gray-400 text-sm">
            <p>
              Thank you for choosing HostFarm.org for your anonymous VPS hosting needs!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}