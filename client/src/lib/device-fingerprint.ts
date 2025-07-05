import { useAuth } from "@/hooks/use-auth";

interface DeviceFingerprint {
  fingerprintHash: string;
  macAddress?: string;
  userAgent: string;
  screenResolution: string;
  timezone: string;
  language: string;
  platformInfo: string;
  ipAddress?: string;
}

export class DeviceFingerprintManager {
  private fingerprint: DeviceFingerprint | null = null;

  /**
   * Generate a unique device fingerprint based on various browser and system properties
   */
  async generateFingerprint(): Promise<DeviceFingerprint> {
    if (this.fingerprint) {
      return this.fingerprint;
    }

    const fingerprint: DeviceFingerprint = {
      fingerprintHash: '',
      userAgent: navigator.userAgent,
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platformInfo: JSON.stringify({
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled,
        doNotTrack: navigator.doNotTrack,
        hardwareConcurrency: navigator.hardwareConcurrency,
        maxTouchPoints: navigator.maxTouchPoints,
        vendor: navigator.vendor,
        vendorSub: navigator.vendorSub,
        productSub: navigator.productSub,
        oscpu: (navigator as any).oscpu || null,
        buildID: (navigator as any).buildID || null,
      })
    };

    // Try to get MAC address (limited browser support and requires permissions)
    try {
      if ('bluetooth' in navigator) {
        // Note: This would require user permission and is very limited
        // We'll skip this for now as it's not reliably available
      }
    } catch (error) {
      // MAC address not available, continue without it
    }

    // Get IP address from external service (optional)
    try {
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      if (ipResponse.ok) {
        const ipData = await ipResponse.json();
        fingerprint.ipAddress = ipData.ip;
      }
    } catch (error) {
      // IP detection failed, continue without it
    }

    // Generate hash from collected data
    fingerprint.fingerprintHash = await this.generateHash(fingerprint);
    
    this.fingerprint = fingerprint;
    return fingerprint;
  }

  /**
   * Generate a SHA-256 hash from the fingerprint data
   */
  private async generateHash(data: Omit<DeviceFingerprint, 'fingerprintHash'>): Promise<string> {
    const fingerprintString = JSON.stringify({
      userAgent: data.userAgent,
      screenResolution: data.screenResolution,
      timezone: data.timezone,
      language: data.language,
      platformInfo: data.platformInfo,
      // Include MAC and IP if available
      ...(data.macAddress && { macAddress: data.macAddress }),
      ...(data.ipAddress && { ipAddress: data.ipAddress })
    });

    // Use crypto.subtle to generate hash
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(fingerprintString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    
    // Convert to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
  }

  /**
   * Store the device fingerprint on the server (requires authentication)
   */
  async recordFingerprint(): Promise<void> {
    const fingerprint = await this.generateFingerprint();
    
    try {
      const response = await fetch('/api/device-fingerprint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fingerprint),
      });

      if (!response.ok) {
        throw new Error('Failed to record device fingerprint');
      }
    } catch (error) {
      console.warn('Failed to record device fingerprint:', error);
      // Don't throw error as this is not critical for user experience
    }
  }

  /**
   * Check if the current device can register a new account
   */
  async canRegisterAccount(): Promise<{
    canRegister: boolean;
    currentDevices: number;
    maxDevices: number;
  }> {
    const fingerprint = await this.generateFingerprint();
    
    try {
      const response = await fetch('/api/check-device-limits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fingerprintHash: fingerprint.fingerprintHash }),
      });

      if (!response.ok) {
        throw new Error('Failed to check device limits');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to check device limits:', error);
      // Return permissive defaults if check fails
      return {
        canRegister: true,
        currentDevices: 0,
        maxDevices: 2
      };
    }
  }

  /**
   * Check if the current user can create more hosting accounts
   */
  async canCreateHostingAccount(): Promise<{
    canCreate: boolean;
    currentAccounts: number;
    maxAccounts: number;
  }> {
    try {
      const response = await fetch('/api/user/can-create-hosting-account');

      if (!response.ok) {
        throw new Error('Failed to check hosting account limits');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to check hosting account limits:', error);
      // Return permissive defaults if check fails
      return {
        canCreate: true,
        currentAccounts: 0,
        maxAccounts: 2
      };
    }
  }

  /**
   * Get the current user's group limits
   */
  async getUserGroupLimits(): Promise<{
    maxHostingAccounts: number;
    maxDevices: number;
    currentHostingAccounts: number;
    currentDevices: number;
  }> {
    try {
      const response = await fetch('/api/user/group-limits');

      if (!response.ok) {
        throw new Error('Failed to fetch user group limits');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch user group limits:', error);
      // Return default limits if check fails
      return {
        maxHostingAccounts: 2,
        maxDevices: 2,
        currentHostingAccounts: 0,
        currentDevices: 0
      };
    }
  }

  /**
   * Clear cached fingerprint (useful for testing)
   */
  clearCache(): void {
    this.fingerprint = null;
  }
}

// Export a singleton instance
export const deviceFingerprint = new DeviceFingerprintManager();

// React hook for using device fingerprinting
export function useDeviceFingerprint() {
  const { user, isAuthenticated } = useAuth();

  const recordFingerprint = async () => {
    if (isAuthenticated && user) {
      await deviceFingerprint.recordFingerprint();
    }
  };

  const canRegisterAccount = () => deviceFingerprint.canRegisterAccount();
  const canCreateHostingAccount = () => deviceFingerprint.canCreateHostingAccount();
  const getUserGroupLimits = () => deviceFingerprint.getUserGroupLimits();

  return {
    recordFingerprint,
    canRegisterAccount,
    canCreateHostingAccount,
    getUserGroupLimits,
    generateFingerprint: () => deviceFingerprint.generateFingerprint(),
  };
}