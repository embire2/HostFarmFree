import { Express, Request, Response } from "express";
import { createServer } from "http";
import { db } from "./db";
import { storage } from "./storage";
import { isAuthenticated } from "./replitAuth";
import { sendEmail } from "./email";
import { Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";

// Middleware to require admin role
const requireAdmin = (req: any, res: Response, next: any) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

// Configure multer for file uploads
const upload = multer({ 
  dest: "uploads/",
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // User routes
  app.get("/api/user", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin user management
  app.get("/api/admin/users", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Hosting accounts for client
  app.get("/api/hosting-accounts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const accounts = await storage.getHostingAccountsByUserId(userId);
      res.json(accounts);
    } catch (error) {
      console.error('Error fetching hosting accounts:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin hosting accounts with WHM data
  app.get("/api/admin/hosting-accounts", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const clientAccounts = [];
      
      for (const user of allUsers) {
        const hostingAccounts = await storage.getHostingAccountsByUserId(user.id);
        if (hostingAccounts.length > 0) {
          clientAccounts.push({
            user,
            hostingAccounts
          });
        }
      }
      
      res.json(clientAccounts);
    } catch (error) {
      console.error('Error fetching admin hosting accounts:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create hosting account (admin)
  app.post("/api/admin/create-hosting-account", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const { domain, packageId, userId } = req.body;

      if (!domain || !packageId || !userId) {
        return res.status(400).json({ message: "Domain, package ID, and user ID are required" });
      }

      // Get user information
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Generate subdomain for the hosting account
      const subdomain = domain.replace('.hostme.today', '');
      const fullDomain = `${subdomain}.hostme.today`;

      // Create hosting account in database
      const accountData = {
        userId: user.id,
        domain: fullDomain,
        subdomain,
        packageId: packageId,
        status: "active"
      };

      const hostingAccount = await storage.createHostingAccount(accountData);
      res.json(hostingAccount);

    } catch (error) {
      console.error('Error creating hosting account:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Fix broken WHM account
  app.post("/api/admin/recreate-whm-account/:accountId", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const accountId = parseInt(req.params.accountId);
      
      // Get the hosting account details
      const allUsers = await storage.getAllUsers();
      let account = null;
      
      // Find the account across all users
      for (const user of allUsers) {
        const userAccounts = await storage.getHostingAccountsByUserId(user.id);
        const foundAccount = userAccounts.find((acc: any) => acc.id === accountId);
        if (foundAccount) {
          account = foundAccount;
          break;
        }
      }

      if (!account) {
        return res.status(404).json({ error: "Hosting account not found" });
      }

      // Get API settings for WHM integration
      const apiSettings = await storage.getApiSettings();
      
      if (!apiSettings?.whmApiUrl || !apiSettings?.whmApiToken) {
        return res.status(500).json({ error: "WHM API not configured" });
      }

      // Get package information for WHM creation
      const hostingPackage = await storage.getHostingPackageById(account.packageId);
      if (!hostingPackage) {
        return res.status(404).json({ error: "Hosting package not found" });
      }

      const baseUrl = apiSettings.whmApiUrl.replace(/\/+$/, '').replace(/:2087$/, '');
      const apiToken = process.env.WHM_API_TOKEN || apiSettings.whmApiToken;
      
      // Generate username from subdomain (same logic as original creation)
      const username = account.subdomain.match(/^\d/) ? `h${account.subdomain}` : account.subdomain;
      
      // Generate new password (since we can't recover the old one)
      const newPassword = Math.random().toString(36).slice(-12) + 'A1!';
      
      console.log(`[Fix WHM Account] Creating WHM account for domain: ${account.domain}, username: ${username}`);

      // Create WHM account using form data (same as successful account creation)
      const createParams = new URLSearchParams({
        'username': username,
        'domain': account.domain,
        'password': newPassword,
        'package': hostingPackage.whmPackageName || 'default',
        'ip': 'n', // Use shared IP
        'savepkg': '0'
      });

      const createacctsUrl = `${baseUrl}:2087/json-api/createacct?api.version=1`;
      const createResponse = await fetch(createacctsUrl, {
        method: 'POST',
        headers: {
          'Authorization': `whm root:${apiToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: createParams.toString(),
      });

      const createData = await createResponse.json();
      console.log(`[Fix WHM Account] WHM createacct response:`, JSON.stringify(createData, null, 2));

      // Check for success in multiple possible response formats
      let isSuccess = false;
      if (createData.metadata) {
        // Check result field
        isSuccess = createData.metadata.result === 1;
        
        // Also check in result array if present
        if (!isSuccess && createData.data?.result && Array.isArray(createData.data.result)) {
          isSuccess = createData.data.result.some((r: any) => r.status === 1);
        }
      }

      if (!isSuccess) {
        const errorMsg = createData.metadata?.reason || createData.data?.result?.[0]?.statusmsg || 'Unknown WHM error';
        console.log(`[Fix WHM Account] WHM account creation failed: ${errorMsg}`);
        return res.status(500).json({ error: `WHM account creation failed: ${errorMsg}` });
      }

      // Update the account in the database with new credentials
      await storage.updateHostingAccountUsage(accountId, 0, 0); // Reset usage
      
      console.log(`[Fix WHM Account] ✓ Successfully recreated WHM account: ${username}`);

      res.json({
        success: true,
        domain: account.domain,
        username: username,
        message: `WHM account recreated successfully`,
        newPassword: newPassword // Return new password for admin reference
      });

    } catch (error) {
      console.error('[Fix WHM Account] Error:', error);
      res.status(500).json({ 
        error: 'Failed to recreate WHM account',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Check domain availability
  app.post("/api/check-domain-availability", async (req, res) => {
    try {
      const { domain } = req.body;
      
      if (!domain) {
        return res.status(400).json({ error: "Domain is required" });
      }

      // Check if domain already exists in database
      const existingAccount = await storage.getHostingAccountByDomain(domain);
      
      res.json({
        available: !existingAccount,
        message: existingAccount ? "Domain is already taken" : "Domain is available"
      });

    } catch (error) {
      console.error('Error checking domain availability:', error);
      res.status(500).json({ error: "Failed to check domain availability" });
    }
  });

  // Get hosting packages
  app.get("/api/admin/packages", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const packages = await storage.getAllHostingPackages();
      res.json(packages);
    } catch (error) {
      console.error('Error fetching packages:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // API Settings
  app.get("/api/api-settings", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const settings = await storage.getApiSettings();
      res.json(settings || {});
    } catch (error) {
      console.error('Error fetching API settings:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/api-settings", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const settings = await storage.saveApiSettings(req.body);
      res.json(settings);
    } catch (error) {
      console.error('Error saving API settings:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Statistics
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Plugin routes
  app.get("/api/plugins", async (req, res) => {
    try {
      const plugins = await storage.getAllPlugins();
      res.json(plugins);
    } catch (error) {
      console.error('Error fetching plugins:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Custom header codes
  app.get("/api/custom-header-codes/active", async (req, res) => {
    try {
      const codes = await storage.getActiveCustomHeaderCodes();
      res.json(codes);
    } catch (error) {
      console.error('Error fetching header codes:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Device limits check
  app.post("/api/check-device-limits", async (req, res) => {
    try {
      const { fingerprintHash } = req.body;
      
      console.log('[Device Limits API] Received request with body:', req.body);
      console.log('[Device Limits API] Checking device count for fingerprint:', fingerprintHash ? fingerprintHash.substring(0, 10) + '...' : 'undefined');
      
      if (!fingerprintHash) {
        return res.status(400).json({ error: "Fingerprint hash is required" });
      }

      const deviceCount = await storage.getDeviceCount(fingerprintHash);
      const maxDevices = 2; // Default limit
      
      console.log('[Device Limits API] Device count:', deviceCount);
      console.log('[Device Limits API] Max devices allowed:', maxDevices);
      
      const canRegister = deviceCount < maxDevices;
      
      const result = {
        canRegister,
        currentDevices: deviceCount.toString(),
        maxDevices
      };
      
      console.log('[Device Limits API] Returning result:', result);
      res.json(result);

    } catch (error) {
      console.error('[Device Limits API] Error:', error);
      res.status(500).json({ error: "Failed to check device limits" });
    }
  });

  // VPS orders
  app.get("/api/vps-orders/by-email/:email", async (req, res) => {
    try {
      const email = decodeURIComponent(req.params.email);
      const orders = await storage.getVpsOrdersByEmail(email);
      res.json(orders || []);
    } catch (error) {
      console.error('Error fetching VPS orders:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Plugin downloads
  app.get("/api/plugin-downloads", isAuthenticated, async (req: any, res) => {
    try {
      const downloads = await storage.getPluginDownloadsByUser(req.user.id);
      res.json(downloads || []);
    } catch (error) {
      console.error('Error fetching plugin downloads:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create and return the HTTP server (required for Vite HMR)
  const server = createServer(app);
  return server;
}