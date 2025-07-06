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
  canvasFingerprint?: string;
  webglFingerprint?: string;
  audioFingerprint?: string;
  deviceMemory?: number;
  hardwareConcurrency?: number;
  connectionType?: string;
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
      screenResolution: `${screen.width}x${screen.height}x${screen.colorDepth}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      deviceMemory: (navigator as any).deviceMemory || 0,
      hardwareConcurrency: navigator.hardwareConcurrency || 0,
      connectionType: (navigator as any).connection?.effectiveType || 'unknown',
      platformInfo: JSON.stringify({
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled,
        doNotTrack: navigator.doNotTrack,
        maxTouchPoints: navigator.maxTouchPoints,
        vendor: navigator.vendor,
        vendorSub: navigator.vendorSub,
        productSub: navigator.productSub,
        oscpu: (navigator as any).oscpu || null,
        buildID: (navigator as any).buildID || null,
        fonts: await this.getFontList(),
        plugins: this.getPluginList(),
        screenDetails: {
          availWidth: screen.availWidth,
          availHeight: screen.availHeight,
          colorDepth: screen.colorDepth,
          pixelDepth: screen.pixelDepth
        }
      })
    };

    // Generate Canvas fingerprint
    fingerprint.canvasFingerprint = await this.generateCanvasFingerprint();
    
    // Generate WebGL fingerprint
    fingerprint.webglFingerprint = await this.generateWebGLFingerprint();
    
    // Generate Audio fingerprint
    fingerprint.audioFingerprint = await this.generateAudioFingerprint();

    // Get IP address (optional)
    try {
      const ipResponse = await fetch('https://api.ipify.org?format=json', { 
        signal: AbortSignal.timeout(3000) 
      });
      if (ipResponse.ok) {
        const ipData = await ipResponse.json();
        fingerprint.ipAddress = ipData.ip;
      }
    } catch (error) {
      // IP detection failed, continue without it
      console.log('IP detection failed, continuing without IP');
    }

    // Generate hash from collected data
    fingerprint.fingerprintHash = await this.generateHash(fingerprint);
    
    this.fingerprint = fingerprint;
    console.log('Generated device fingerprint:', fingerprint.fingerprintHash);
    return fingerprint;
  }

  /**
   * Generate Canvas fingerprint for unique device identification
   */
  private async generateCanvasFingerprint(): Promise<string> {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return 'no-canvas';

      canvas.width = 200;
      canvas.height = 50;
      
      // Draw unique patterns
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('Device fingerprint test 🚀', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('Device fingerprint test 🚀', 4, 17);

      return canvas.toDataURL();
    } catch (error) {
      return 'canvas-error';
    }
  }

  /**
   * Generate WebGL fingerprint
   */
  private async generateWebGLFingerprint(): Promise<string> {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) return 'no-webgl';

      const info = {
        vendor: gl.getParameter(gl.VENDOR),
        renderer: gl.getParameter(gl.RENDERER),
        version: gl.getParameter(gl.VERSION),
        shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
        extensions: gl.getSupportedExtensions()?.sort().join(',') || '',
      };

      return JSON.stringify(info);
    } catch (error) {
      return 'webgl-error';
    }
  }

  /**
   * Generate Audio fingerprint
   */
  private async generateAudioFingerprint(): Promise<string> {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const analyser = audioContext.createAnalyser();
      const gainNode = audioContext.createGain();
      const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);

      gainNode.gain.value = 0; // Mute
      oscillator.connect(analyser);
      analyser.connect(scriptProcessor);
      scriptProcessor.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.start(0);

      const fingerprint = analyser.frequencyBinCount.toString();
      oscillator.stop();
      audioContext.close();
      
      return fingerprint;
    } catch (error) {
      return 'audio-error';
    }
  }

  /**
   * Get available fonts (basic detection)
   */
  private async getFontList(): Promise<string[]> {
    const fonts = [
      'Arial', 'Arial Black', 'Comic Sans MS', 'Courier New', 'Georgia',
      'Helvetica', 'Impact', 'Lucida Console', 'Times New Roman', 'Trebuchet MS',
      'Verdana', 'Calibri', 'Cambria', 'Candara', 'Consolas', 'Constantia'
    ];
    
    const availableFonts: string[] = [];
    
    for (const font of fonts) {
      if (document.fonts && document.fonts.check) {
        if (document.fonts.check(`12px "${font}"`)) {
          availableFonts.push(font);
        }
      } else {
        // Fallback font detection
        availableFonts.push(font);
      }
    }
    
    return availableFonts;
  }

  /**
   * Get plugin list
   */
  private getPluginList(): string[] {
    const plugins: string[] = [];
    for (let i = 0; i < navigator.plugins.length; i++) {
      plugins.push(navigator.plugins[i].name);
    }
    return plugins.sort();
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
      canvasFingerprint: data.canvasFingerprint,
      webglFingerprint: data.webglFingerprint,
      audioFingerprint: data.audioFingerprint,
      deviceMemory: data.deviceMemory,
      hardwareConcurrency: data.hardwareConcurrency,
      connectionType: data.connectionType,
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
    try {
      console.log('[Device Fingerprint] Starting device registration check...');
      const fingerprint = await this.generateFingerprint();
      console.log('[Device Fingerprint] Generated fingerprint:', fingerprint.fingerprintHash.substring(0, 10) + '...');
      
      const requestBody = { fingerprintHash: fingerprint.fingerprintHash };
      console.log('[Device Fingerprint] Sending device limits request');
      
      const response = await fetch('/api/check-device-limits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        console.error('[Device Fingerprint] API request failed:', response.status, response.statusText);
        throw new Error(`Device limits API returned ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('[Device Fingerprint] Device limits check result:', result);
      return result;
    } catch (error) {
      console.error('[Device Fingerprint] Failed to check device limits:', error);
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