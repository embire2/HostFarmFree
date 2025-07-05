import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

type FacebookPixelSettings = {
  id: number;
  pixelId: string;
  accessToken?: string;
  isActive: boolean;
  trackPageViews: boolean;
  trackPurchases: boolean;
  purchaseEventValue: string;
  testMode: boolean;
  createdAt: string;
  updatedAt: string;
};

interface FacebookPixelProps {
  enabled?: boolean;
}

export function FacebookPixel({ enabled = true }: FacebookPixelProps) {
  const { data: settings } = useQuery<FacebookPixelSettings | null>({
    queryKey: ["/api/facebook-pixel-settings"],
    enabled: enabled,
  });

  useEffect(() => {
    if (!settings || !settings.isActive || !settings.pixelId) {
      return;
    }

    // Initialize Facebook Pixel
    const initFacebookPixel = () => {
      // Facebook Pixel Code
      !(function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
        if (f.fbq) return;
        n = f.fbq = function () {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = !0;
        n.version = "2.0";
        n.queue = [];
        t = b.createElement(e);
        t.async = !0;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
      })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");

      // Initialize the pixel
      window.fbq("init", settings.pixelId);

      // Enable test mode if configured
      if (settings.testMode) {
        window.fbq("set", "debug", "true");
        console.log("[Facebook Pixel] Running in test mode");
      }

      // Track page view if enabled
      if (settings.trackPageViews) {
        window.fbq("track", "PageView");
        console.log("[Facebook Pixel] Page view tracked");
      }
    };

    initFacebookPixel();
  }, [settings]);

  return null;
}

// Helper function to track purchase events
export const trackPurchaseEvent = async (value?: number) => {
  try {
    // Fetch current settings
    const response = await fetch("/api/facebook-pixel-settings");
    if (!response.ok) {
      console.warn("[Facebook Pixel] Could not fetch settings for purchase tracking");
      return;
    }

    const settings: FacebookPixelSettings | null = await response.json();

    if (!settings || !settings.isActive || !settings.trackPurchases) {
      console.log("[Facebook Pixel] Purchase tracking disabled");
      return;
    }

    if (!window.fbq) {
      console.warn("[Facebook Pixel] Facebook Pixel not initialized");
      return;
    }

    const purchaseValue = value || parseFloat(settings.purchaseEventValue) || 5.0;

    // Track purchase event
    window.fbq("track", "Purchase", {
      value: purchaseValue,
      currency: "USD",
      content_category: "hosting",
      content_name: "hosting_account",
    });

    console.log(`[Facebook Pixel] Purchase event tracked with value: $${purchaseValue}`);
  } catch (error) {
    console.error("[Facebook Pixel] Error tracking purchase event:", error);
  }
};

// Helper function to track custom events
export const trackCustomEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (!window.fbq) {
    console.warn("[Facebook Pixel] Facebook Pixel not initialized");
    return;
  }

  window.fbq("track", eventName, parameters);
  console.log(`[Facebook Pixel] Custom event tracked: ${eventName}`, parameters);
};

export default FacebookPixel;