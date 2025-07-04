import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Heart, Gift, ArrowRight, Home } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";

export default function DonationSuccess() {
  const [countdown, setCountdown] = useState(24);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(prev => prev > 0 ? prev - 1 : 0);
    }, 3600000); // Update every hour

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <Card className="max-w-2xl mx-auto shadow-2xl">
        <CardContent className="p-8 text-center">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          
          <h1 className="text-3xl font-bold text-green-700 mb-4">
            Thank You for Your Donation! 🎉
          </h1>
          
          <p className="text-xl text-gray-600 mb-6">
            Your monthly subscription has been successfully created!
          </p>

          <div className="bg-gradient-to-r from-primary to-secondary text-white p-6 rounded-lg mb-6">
            <Gift className="w-8 h-8 mx-auto mb-3" />
            <h2 className="text-xl font-bold mb-2">Your Gift is Being Prepared</h2>
            <p className="text-sm opacity-90">
              Our team will provision your selected gift within the next 24 hours.
              You'll receive an email with your access details once ready.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg">
              <Heart className="w-6 h-6 text-red-500 mx-auto mb-2" />
              <h3 className="font-semibold text-blue-700">Monthly Support</h3>
              <p className="text-sm text-blue-600">Your subscription helps keep our services free</p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <Gift className="w-6 h-6 text-purple-500 mx-auto mb-2" />
              <h3 className="font-semibold text-purple-700">Gift Activation</h3>
              <p className="text-sm text-purple-600">
                {countdown > 0 ? `≤ ${countdown} hours` : 'Very soon'}
              </p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
              <h3 className="font-semibold text-green-700">Cancel Anytime</h3>
              <p className="text-sm text-green-600">No long-term commitments required</p>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
            <h3 className="font-bold text-yellow-800 mb-2">What Happens Next?</h3>
            <ul className="text-sm text-yellow-700 space-y-1 text-left">
              <li>• We'll process your gift selection within 24 hours</li>
              <li>• You'll receive an email with access credentials (if applicable)</li>
              <li>• Your subscription will continue monthly until cancelled</li>
              <li>• You can manage your subscription anytime through Stripe</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/">
              <Button className="bg-primary hover:bg-secondary text-white">
                <Home className="mr-2 w-4 h-4" />
                Return Home
              </Button>
            </Link>
            
            <Link to="/dashboard">
              <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
                <ArrowRight className="mr-2 w-4 h-4" />
                Go to Dashboard
              </Button>
            </Link>
          </div>

          <p className="text-sm text-muted-foreground mt-6">
            Need help? Contact us at support@hostfarm.org
          </p>
        </CardContent>
      </Card>
    </div>
  );
}