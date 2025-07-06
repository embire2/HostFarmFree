import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

export default function FacebookPixel() {
  const { data: pixelSettings } = useQuery({
    queryKey: ["/api/facebook-pixel-settings"],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: false, // Don't retry if no settings configured
  });

  useEffect(() => {
    if (!pixelSettings?.pixelId || !pixelSettings?.isEnabled) {
      return;
    }

    // Check if Facebook Pixel is already loaded
    if (window.fbq) {
      return;
    }

    // Facebook Pixel Code
    (function(f: any, b: any, e: any, v: any, n: any, t: any, s: any) {
      if (f.fbq) return;
      n = f.fbq = function() {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = '2.0';
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

    // Initialize pixel with dynamic ID
    window.fbq('init', pixelSettings.pixelId);
    
    // Track page view
    window.fbq('track', 'PageView');
    
    console.log('[Facebook Pixel] Initialized with ID:', pixelSettings.pixelId);

    // Add noscript fallback to document head
    const noscript = document.createElement('noscript');
    const img = document.createElement('img');
    img.height = 1;
    img.width = 1;
    img.style.display = 'none';
    img.src = `https://www.facebook.com/tr?id=${pixelSettings.pixelId}&ev=PageView&noscript=1`;
    noscript.appendChild(img);
    document.head.appendChild(noscript);

  }, [pixelSettings]);

  return null; // This component doesn't render anything visible
}

// Export utility function for tracking events
export function trackEvent(eventName: string, parameters?: any) {
  if (window.fbq) {
    window.fbq('track', eventName, parameters);
    console.log(`[Facebook Pixel] Event tracked: ${eventName}`, parameters);
  }
}

// Export utility function for tracking purchases
export function trackPurchase(value: number, currency: string = 'USD', parameters?: any) {
  if (window.fbq) {
    window.fbq('track', 'Purchase', {
      value: value,
      currency: currency,
      ...parameters
    });
    console.log(`[Facebook Pixel] Purchase tracked: ${value} ${currency}`, parameters);
  }
}