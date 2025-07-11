import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Loader2, ArrowRight } from "lucide-react";
import Navbar from "@/components/navbar";

export default function Conversion() {
  const [, setLocation] = useLocation();
  const [countdown, setCountdown] = useState(5);
  const [redirectUrl, setRedirectUrl] = useState<string>("/");
  const [registrationType, setRegistrationType] = useState<string>("account");

  useEffect(() => {
    try {
      console.log("[Conversion Page] Initializing conversion tracking page");
      
      // Get URL parameters to determine registration type and redirect destination
      const urlParams = new URLSearchParams(window.location.search);
      const type = urlParams.get('type') || 'account';
      const destination = urlParams.get('destination') || '/';
      
      console.log(`[Conversion Page] Registration type: ${type}, Destination: ${destination}`);
      
      setRegistrationType(type);
      setRedirectUrl(destination);

      // Force refresh user authentication state for dashboard access
      if (destination === '/dashboard') {
        console.log("[Conversion Page] Refreshing user authentication for dashboard access");
        // Invalidate auth cache to force refresh
        fetch('/api/user', { credentials: 'include' })
          .then(response => {
            if (response.ok) {
              console.log("[Conversion Page] ✓ User authentication refreshed successfully");
            } else {
              console.log("[Conversion Page] ⚠️ User authentication refresh failed");
            }
          })
          .catch(error => {
            console.error("[Conversion Page] ❌ Error refreshing user authentication:", error);
          });
      }

      // Store conversion data for Facebook Pixel tracking
      const conversionData = {
        type: type,
        timestamp: new Date().toISOString(),
        destination: destination,
        userAgent: navigator.userAgent,
        referrer: document.referrer
      };
      
      console.log("[Conversion Page] Conversion data:", conversionData);
      
      // Track Facebook Pixel conversion event
      if (typeof window !== 'undefined' && (window as any).fbq) {
        try {
          console.log("[Conversion Page] Sending Facebook Pixel conversion event");
          (window as any).fbq('track', 'CompleteRegistration', {
            content_category: type,
            content_name: `${type}_registration`,
            value: 5.00,
            currency: 'USD'
          });
          console.log("[Conversion Page] ✅ Facebook Pixel conversion event sent successfully");
        } catch (fbError) {
          console.error("[Conversion Page] ❌ Facebook Pixel tracking error:", fbError);
        }
      } else {
        console.warn("[Conversion Page] ⚠️ Facebook Pixel not available for conversion tracking");
      }

      // Start countdown timer
      const timer = setInterval(() => {
        setCountdown((prev) => {
          const newCount = prev - 1;
          console.log(`[Conversion Page] Countdown: ${newCount} seconds remaining`);
          
          if (newCount <= 0) {
            console.log(`[Conversion Page] Countdown complete, redirecting to: ${destination}`);
            clearInterval(timer);
            // Use window.location.href with query param to ensure session cookies are maintained
            const finalUrl = destination.includes('?') ? 
              `${destination}&from=conversion` : 
              `${destination}?from=conversion`;
            window.location.href = finalUrl;
            return 0;
          }
          return newCount;
        });
      }, 1000);

      // Cleanup timer on unmount
      return () => {
        console.log("[Conversion Page] Cleaning up countdown timer");
        clearInterval(timer);
      };
    } catch (error) {
      console.error("[Conversion Page] ❌ Error initializing conversion page:", error);
      // Fallback redirect after 3 seconds if there's an error
      setTimeout(() => {
        console.log("[Conversion Page] Error fallback redirect");
        setLocation("/");
      }, 3000);
    }
  }, [setLocation]);

  const getRegistrationTypeDisplay = (type: string) => {
    switch (type) {
      case 'anonymous':
        return 'Anonymous Hosting Account';
      case 'plugin':
        return 'Plugin Library Access';
      case 'vps':
        return 'VPS Subscription';
      default:
        return 'Account Registration';
    }
  };

  const getRegistrationDescription = (type: string) => {
    switch (type) {
      case 'anonymous':
        return 'Your anonymous hosting account has been created successfully. You will be redirected to your dashboard shortly.';
      case 'plugin':
        return 'Your plugin library access has been activated. You will be redirected to browse premium plugins shortly.';
      case 'vps':
        return 'Your VPS subscription has been processed. You will be redirected to complete your setup shortly.';
      default:
        return 'Your registration has been completed successfully. You will be redirected shortly.';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <Navbar />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          {/* Success Icon */}
          <div className="mb-8">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">
              🎉 Registration Successful!
            </h1>
            <p className="text-xl text-gray-300">
              {getRegistrationTypeDisplay(registrationType)}
            </p>
          </div>

          {/* Registration Status Card */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 mb-8">
            <CardContent className="p-8">
              <div className="space-y-6">
                {/* Status Message */}
                <div className="text-center">
                  <div className="flex items-center justify-center mb-4">
                    <Loader2 className="w-6 h-6 text-blue-400 animate-spin mr-2" />
                    <span className="text-lg font-semibold text-white">
                      Processing Registration
                    </span>
                  </div>
                  <p className="text-gray-300">
                    {getRegistrationDescription(registrationType)}
                  </p>
                </div>

                {/* Countdown Display */}
                <div className="bg-blue-500/20 rounded-lg p-6 border border-blue-500/30">
                  <div className="flex items-center justify-center space-x-2">
                    <ArrowRight className="w-5 h-5 text-blue-400" />
                    <span className="text-white font-medium">
                      Redirecting in {countdown} second{countdown !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-4 bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${(5 - countdown) * 20}%` }}
                    />
                  </div>
                </div>

                {/* Additional Info */}
                <div className="text-sm text-gray-400 space-y-2">
                  <p>✅ Registration data logged in system</p>
                  <p>✅ Conversion tracking completed</p>
                  <p>✅ Preparing your account access</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer Note */}
          <p className="text-gray-400 text-sm">
            This page helps us track successful registrations for analytics and improvements.
          </p>
        </div>
      </div>
    </div>
  );
}