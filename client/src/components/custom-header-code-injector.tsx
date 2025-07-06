import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

type CustomHeaderCode = {
  id: number;
  name: string;
  code: string;
  isActive: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
};

export default function CustomHeaderCodeInjector() {
  const { data: headerCodes = [] } = useQuery<CustomHeaderCode[]>({
    queryKey: ["/api/custom-header-codes/active"],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: false, // Don't retry if no codes are configured
  });

  useEffect(() => {
    console.log(`[Custom Header Code] Starting injection process. Found ${headerCodes.length} header codes.`);
    
    // Sort header codes by position (endpoint already returns only active codes)
    const sortedHeaderCodes = headerCodes.sort((a, b) => a.position - b.position);

    if (sortedHeaderCodes.length === 0) {
      console.log(`[Custom Header Code] No active header codes found. Skipping injection.`);
      return;
    }

    // Create a container element to hold our injected code
    const containerId = 'custom-header-codes-container';
    let container = document.getElementById(containerId);
    
    // Remove existing container if it exists
    if (container) {
      console.log(`[Custom Header Code] Removing existing container for refresh.`);
      container.remove();
    }

    // Create new container
    container = document.createElement('div');
    container.id = containerId;
    container.style.display = 'none'; // Hide the container since it's just for script/style injection

    console.log(`[Custom Header Code] Created new container. Processing ${sortedHeaderCodes.length} codes.`);

    // Inject each active header code
    sortedHeaderCodes.forEach((headerCode, index) => {
      try {
        // Create a wrapper div for this specific code block
        const wrapper = document.createElement('div');
        wrapper.setAttribute('data-header-code-id', headerCode.id.toString());
        wrapper.setAttribute('data-header-code-name', headerCode.name);
        wrapper.innerHTML = headerCode.code;

        container.appendChild(wrapper);

        console.log(`[Custom Header Code] ✓ Injected (${index + 1}/${sortedHeaderCodes.length}): ${headerCode.name} (ID: ${headerCode.id})`);
        
        // Special logging for Facebook Pixel
        if (headerCode.name.toLowerCase().includes('facebook') || headerCode.name.toLowerCase().includes('pixel')) {
          console.log(`[Custom Header Code] 🎯 Facebook Pixel detected and injected!`);
          console.log(`[Custom Header Code] Facebook Pixel Code Preview:`, headerCode.code.substring(0, 100) + '...');
        }
      } catch (error) {
        console.error(`[Custom Header Code] ❌ Failed to inject code "${headerCode.name}":`, error);
      }
    });

    // Append container to head
    document.head.appendChild(container);
    console.log(`[Custom Header Code] ✅ All codes injected successfully! Container added to document head.`);

    // Verify injection worked
    setTimeout(() => {
      const verifyContainer = document.getElementById(containerId);
      if (verifyContainer) {
        console.log(`[Custom Header Code] 🔍 Verification: Container still present in DOM with ${verifyContainer.children.length} child elements.`);
        
        // Check for Facebook Pixel specifically
        const fbqScripts = document.querySelectorAll('script[src*="fbevents.js"]');
        const fbqInlineScripts = Array.from(document.querySelectorAll('script:not([src])')).filter(script => 
          script.textContent && script.textContent.includes('fbq')
        );
        
        console.log(`[Custom Header Code] 🎯 Facebook Pixel Scripts - External: ${fbqScripts.length}, Inline: ${fbqInlineScripts.length}`);
        
        // Check if fbq function is available
        if (typeof (window as any).fbq === 'function') {
          console.log(`[Custom Header Code] ✅ Facebook Pixel fbq function is available and ready!`);
          console.log(`[Custom Header Code] Facebook Pixel Queue:`, (window as any).fbq.queue?.length || 'No queue');
        } else {
          console.warn(`[Custom Header Code] ⚠️ Facebook Pixel fbq function not found. This may indicate loading issues.`);
        }
        
        // Check if Facebook Pixel is loaded
        if ((window as any).fbq && (window as any).fbq.loaded) {
          console.log(`[Custom Header Code] ✅ Facebook Pixel is fully loaded and initialized!`);
        } else {
          console.warn(`[Custom Header Code] ⚠️ Facebook Pixel may not be fully loaded yet.`);
        }
      } else {
        console.warn(`[Custom Header Code] ⚠️ Verification failed: Container not found in DOM!`);
      }
    }, 1000);

    // Additional verification after 3 seconds for Facebook Pixel
    setTimeout(() => {
      if ((window as any).fbq) {
        console.log(`[Custom Header Code] 🎯 Final Facebook Pixel Check:`);
        console.log(`[Custom Header Code] - fbq available: ${typeof (window as any).fbq}`);
        console.log(`[Custom Header Code] - fbq loaded: ${(window as any).fbq.loaded}`);
        console.log(`[Custom Header Code] - fbq version: ${(window as any).fbq.version}`);
        
        // Try to test the pixel
        try {
          (window as any).fbq('track', 'PageView');
          console.log(`[Custom Header Code] ✅ Facebook Pixel PageView event sent successfully!`);
        } catch (error) {
          console.error(`[Custom Header Code] ❌ Facebook Pixel PageView event failed:`, error);
        }
      }
    }, 3000);

    // Cleanup function to remove injected codes when component unmounts or codes change
    return () => {
      const existingContainer = document.getElementById(containerId);
      if (existingContainer) {
        existingContainer.remove();
        console.log(`[Custom Header Code] 🧹 Cleanup: Removed container from DOM.`);
      }
    };
  }, [headerCodes]);

  return null; // This component doesn't render anything visible
}

// Export utility function for manually injecting header code (if needed)
export function injectHeaderCode(code: string, name: string = 'manual') {
  try {
    const wrapper = document.createElement('div');
    wrapper.setAttribute('data-header-code-name', name);
    wrapper.innerHTML = code;
    document.head.appendChild(wrapper);
    console.log(`[Custom Header Code] Manually injected: ${name}`);
  } catch (error) {
    console.warn(`[Custom Header Code] Failed to manually inject code "${name}":`, error);
  }
}