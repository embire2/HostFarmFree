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

    // Remove any existing injected codes first
    const existingCodes = document.querySelectorAll('[data-header-code-id]');
    existingCodes.forEach(el => el.remove());

    console.log(`[Custom Header Code] Processing ${sortedHeaderCodes.length} codes for direct injection.`);

    // Inject each active header code directly into the head
    sortedHeaderCodes.forEach((headerCode, index) => {
      try {
        // Create a temporary container to parse the HTML
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = headerCode.code.trim();
        
        // Process each child element from the parsed HTML
        Array.from(tempContainer.children).forEach(element => {
          // Clone the element to avoid reference issues
          const clonedElement = element.cloneNode(true) as HTMLElement;
          
          // Add identification attributes
          clonedElement.setAttribute('data-header-code-id', headerCode.id.toString());
          clonedElement.setAttribute('data-header-code-name', headerCode.name);
          
          // Insert before the closing head tag
          document.head.appendChild(clonedElement);
        });

        // Also handle script tags that might be directly in the code (not wrapped in other elements)
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = headerCode.code.trim();
        const scriptMatch = headerCode.code.match(/<script[^>]*>[\s\S]*?<\/script>/gi);
        
        if (scriptMatch) {
          scriptMatch.forEach(scriptHtml => {
            const scriptElement = document.createElement('script');
            const scriptContent = scriptHtml.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
            
            // Check if it's an external script or inline script
            const srcMatch = scriptHtml.match(/src="([^"]+)"/);
            if (srcMatch) {
              scriptElement.src = srcMatch[1];
              scriptElement.async = true;
            } else {
              scriptElement.textContent = scriptContent;
            }
            
            scriptElement.setAttribute('data-header-code-id', headerCode.id.toString());
            scriptElement.setAttribute('data-header-code-name', headerCode.name);
            
            document.head.appendChild(scriptElement);
          });
        }

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

    console.log(`[Custom Header Code] ✅ All codes injected successfully! Added directly to document head.`);

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
      const existingCodes = document.querySelectorAll('[data-header-code-id]');
      existingCodes.forEach(el => el.remove());
      console.log(`[Custom Header Code] 🧹 Cleanup: Removed ${existingCodes.length} injected codes from DOM.`);
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