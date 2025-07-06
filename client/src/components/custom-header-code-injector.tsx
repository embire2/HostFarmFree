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
    // Sort header codes by position (endpoint already returns only active codes)
    const sortedHeaderCodes = headerCodes.sort((a, b) => a.position - b.position);

    if (sortedHeaderCodes.length === 0) {
      return;
    }

    // Create a container element to hold our injected code
    const containerId = 'custom-header-codes-container';
    let container = document.getElementById(containerId);
    
    // Remove existing container if it exists
    if (container) {
      container.remove();
    }

    // Create new container
    container = document.createElement('div');
    container.id = containerId;
    container.style.display = 'none'; // Hide the container since it's just for script/style injection

    // Inject each active header code
    sortedHeaderCodes.forEach((headerCode) => {
      try {
        // Create a wrapper div for this specific code block
        const wrapper = document.createElement('div');
        wrapper.setAttribute('data-header-code-id', headerCode.id.toString());
        wrapper.setAttribute('data-header-code-name', headerCode.name);
        wrapper.innerHTML = headerCode.code;

        container.appendChild(wrapper);

        console.log(`[Custom Header Code] Injected: ${headerCode.name} (ID: ${headerCode.id})`);
      } catch (error) {
        console.warn(`[Custom Header Code] Failed to inject code "${headerCode.name}":`, error);
      }
    });

    // Append container to head
    document.head.appendChild(container);

    // Cleanup function to remove injected codes when component unmounts or codes change
    return () => {
      const existingContainer = document.getElementById(containerId);
      if (existingContainer) {
        existingContainer.remove();
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