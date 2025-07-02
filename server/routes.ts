import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { insertHostingAccountSchema, insertPluginSchema, insertDonationSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure plugins directory exists
const pluginsDir = path.join(process.cwd(), "plugins");
if (!fs.existsSync(pluginsDir)) {
  fs.mkdirSync(pluginsDir, { recursive: true });
}

// Configure multer for plugin uploads with proper storage
const pluginStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, pluginsDir);
  },
  filename: (req, file, cb) => {
    // Use timestamp + original name to avoid conflicts
    const timestamp = Date.now();
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${timestamp}-${sanitizedName}`);
  }
});

const upload = multer({
  storage: pluginStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow ZIP files for plugins
    if (file.fieldname === 'pluginFile') {
      if (file.mimetype === "application/zip" || file.originalname.endsWith(".zip")) {
        cb(null, true);
      } else {
        cb(new Error("Only ZIP files are allowed for plugins"));
      }
    }
    // Allow images for plugin thumbnails
    else if (file.fieldname === 'imageFile') {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error("Only image files are allowed for thumbnails"));
      }
    } else {
      cb(new Error("Unexpected field"));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  setupAuth(app);

  // Routes are now handled in auth.ts for /api/register, /api/login, /api/logout, /api/user

  // Public routes
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Plugin routes
  app.get("/api/plugins", async (req, res) => {
    try {
      const { category, search } = req.query;
      const plugins = await storage.getPlugins(
        category as string,
        search as string
      );
      res.json(plugins);
    } catch (error) {
      console.error("Error fetching plugins:", error);
      res.status(500).json({ message: "Failed to fetch plugins" });
    }
  });

  // Get public plugins (no authentication required) - must come before /:id route
  app.get("/api/plugins/public", async (req, res) => {
    try {
      const plugins = await storage.getPublicPlugins();
      res.json(plugins);
    } catch (error) {
      console.error("Error fetching public plugins:", error);
      res.status(500).json({ message: "Failed to fetch public plugins" });
    }
  });

  // Get plugin by slug (for public pages) - must come before /:id route
  app.get("/api/plugins/slug/:slug", async (req, res) => {
    try {
      const plugin = await storage.getPluginBySlug(req.params.slug);
      if (!plugin) {
        return res.status(404).json({ message: "Plugin not found" });
      }
      res.json(plugin);
    } catch (error) {
      console.error("Error fetching plugin by slug:", error);
      res.status(500).json({ message: "Failed to fetch plugin" });
    }
  });

  app.get("/api/plugins/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid plugin ID" });
      }
      
      const plugin = await storage.getPluginById(id);
      if (!plugin) {
        return res.status(404).json({ message: "Plugin not found" });
      }
      res.json(plugin);
    } catch (error) {
      console.error("Error fetching plugin:", error);
      res.status(500).json({ message: "Failed to fetch plugin" });
    }
  });

  // Protected routes
  app.post("/api/hosting-accounts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { subdomain } = req.body;

      // Check if subdomain is available
      const domain = `${subdomain}.hostme.today`;
      const existing = await storage.getHostingAccountByDomain(domain);
      if (existing) {
        return res.status(400).json({ message: "Domain already exists" });
      }

      // Create cPanel account via WHM API
      try {
        const whmResponse = await fetch('https://cpanel3.openweb.co.za:2087/json-api/createacct', {
          method: 'POST',
          headers: {
            'Authorization': `whm root:10AV6VP7TZLIEREN78F4ZP62UP4JCEKXN`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            username: subdomain.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 8),
            domain: domain,
            plan: 'default',
            password: Math.random().toString(36).slice(-12) + 'A1!',
            email: `admin@${domain}`,
          }),
        });

        const whmResult = await whmResponse.json();
        
        if (!whmResult.metadata?.result || whmResult.metadata.result !== 1) {
          console.error('WHM API Error:', whmResult);
          throw new Error(whmResult.metadata?.reason || 'Failed to create cPanel account');
        }

        console.log('cPanel account created successfully:', whmResult);
      } catch (whmError) {
        console.error('WHM API Error:', whmError);
        // Continue with database creation even if WHM fails for now
      }

      // Create hosting account in database
      const account = await storage.createHostingAccount({
        userId,
        domain,
        subdomain,
        status: "active",
      });

      res.json(account);
    } catch (error) {
      console.error("Error creating hosting account:", error);
      res.status(500).json({ message: "Failed to create hosting account" });
    }
  });

  app.get("/api/hosting-accounts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const accounts = await storage.getHostingAccountsByUserId(userId);
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching hosting accounts:", error);
      res.status(500).json({ message: "Failed to fetch hosting accounts" });
    }
  });

  app.get("/api/hosting-accounts/search/:domain", async (req, res) => {
    try {
      const { domain } = req.params;
      const fullDomain = `${domain}.hostme.today`;
      const account = await storage.getHostingAccountByDomain(fullDomain);
      
      if (!account) {
        return res.status(404).json({ message: "Domain not found" });
      }

      // Return limited info for public search
      res.json({
        domain: account.domain,
        status: account.status,
        createdAt: account.createdAt,
      });
    } catch (error) {
      console.error("Error searching domain:", error);
      res.status(500).json({ message: "Failed to search domain" });
    }
  });

  app.post("/api/plugins/:id/download", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const pluginId = parseInt(req.params.id);

      const plugin = await storage.getPluginById(pluginId);
      if (!plugin) {
        return res.status(404).json({ message: "Plugin not found" });
      }

      // Record download
      await storage.recordPluginDownload(pluginId, userId);
      await storage.incrementPluginDownloads(pluginId);

      // Return download info (in real implementation, this would stream the file)
      res.json({
        message: "Download recorded",
        plugin: {
          name: plugin.name,
          fileName: plugin.fileName,
          fileSize: plugin.fileSize,
        },
      });
    } catch (error) {
      console.error("Error downloading plugin:", error);
      res.status(500).json({ message: "Failed to download plugin" });
    }
  });

  app.get("/api/plugin-downloads", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const downloads = await storage.getPluginDownloadsByUser(userId);
      res.json(downloads);
    } catch (error) {
      console.error("Error fetching plugin downloads:", error);
      res.status(500).json({ message: "Failed to fetch plugin downloads" });
    }
  });

  // Remove duplicate routes since they're now properly ordered above

  // Statistics endpoint
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Admin-only routes
  const requireAdmin = async (req: any, res: any, next: any) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      next();
    } catch (error) {
      res.status(500).json({ message: "Failed to verify admin status" });
    }
  };

  // User Management endpoints (admin only)
  app.get("/api/admin/users", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.put("/api/admin/users/:id", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const updates = req.body;
      
      // Prevent admin from removing their own admin role
      const currentUser = req.user;
      if (currentUser && currentUser.id === userId && updates.role !== "admin") {
        return res.status(400).json({ 
          message: "You cannot remove your own admin privileges" 
        });
      }
      
      const updatedUser = await storage.updateUser(userId, updates);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/admin/users/:id", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const currentUser = req.user;
      
      // Prevent admin from deleting their own account
      if (currentUser && currentUser.id === userId) {
        return res.status(400).json({ 
          message: "You cannot delete your own account" 
        });
      }
      
      const success = await storage.deleteUser(userId);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // API Settings endpoints (admin only)
  app.get("/api/api-settings", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const settings = await storage.getApiSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch API settings" });
    }
  });

  app.post("/api/api-settings", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const settings = await storage.upsertApiSettings(req.body);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to save API settings" });
    }
  });

  // cPanel auto-login endpoint using WHM API
  app.get("/api/cpanel-login/:domain", isAuthenticated, async (req: any, res) => {
    try {
      const { domain } = req.params;
      const userId = req.user.id;
      
      // Verify the user owns this hosting account
      const hostingAccount = await storage.getHostingAccountByDomain(domain);
      if (!hostingAccount || hostingAccount.userId !== userId) {
        return res.status(403).json({ error: "Access denied to this hosting account" });
      }

      // Get API settings
      const apiSettings = await storage.getApiSettings();
      const envToken = process.env.WHM_API_TOKEN;
      const apiToken = envToken || apiSettings?.whmApiToken;
      
      if (!apiSettings?.whmApiUrl || !apiToken) {
        return res.status(500).json({ error: "WHM API settings not configured" });
      }

      // Clean base URL
      const baseUrl = apiSettings.whmApiUrl.replace(/\/+$/, '').replace(/\/json-api.*$/, '').replace(/:2087.*$/, '');
      
      try {
        // Create user session using WHM API for auto-login
        const sessionUrl = `${baseUrl}:2087/json-api/create_user_session?api.version=1&user=${hostingAccount.subdomain}&service=cpaneld`;
        
        console.log(`[cPanel Login] Creating session for user: ${hostingAccount.subdomain}`);
        
        const response = await fetch(sessionUrl, {
          method: 'GET',
          headers: {
            'Authorization': `whm root:${apiToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`WHM API returned ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log(`[cPanel Login] WHM API Response:`, result);

        if (result.metadata?.result === 1 && result.data?.url) {
          // Success - return the auto-login URL
          res.json({ 
            loginUrl: result.data.url,
            domain: domain,
            username: hostingAccount.subdomain,
            message: "Auto-login session created successfully"
          });
        } else {
          // Fallback to direct cPanel URL if session creation fails
          const fallbackUrl = `${apiSettings.cpanelBaseUrl}:2083/login/?user=${hostingAccount.subdomain}`;
          res.json({ 
            loginUrl: fallbackUrl,
            domain: domain,
            username: hostingAccount.subdomain,
            message: "Direct cPanel access (manual login required)"
          });
        }
      } catch (apiError) {
        console.error("[cPanel Login] WHM API Error:", apiError);
        // Fallback to direct cPanel URL
        const fallbackUrl = `${apiSettings.cpanelBaseUrl}:2083/login/?user=${hostingAccount.subdomain}`;
        res.json({ 
          loginUrl: fallbackUrl,
          domain: domain,
          username: hostingAccount.subdomain,
          message: "Fallback cPanel access (manual login required)"
        });
      }
    } catch (error) {
      console.error("Error generating cPanel login:", error);
      res.status(500).json({ error: "Failed to generate cPanel login" });
    }
  });

  // Get detailed hosting account statistics from WHM API
  app.get("/api/hosting-accounts/:id/stats", isAuthenticated, async (req: any, res) => {
    try {
      const accountId = parseInt(req.params.id);
      const userId = req.user.id;
      
      // Verify the user owns this hosting account
      const hostingAccounts = await storage.getHostingAccountsByUserId(userId);
      const account = hostingAccounts.find((acc: any) => acc.id === accountId);
      
      if (!account) {
        return res.status(404).json({ error: "Hosting account not found" });
      }

      // Get API settings
      const apiSettings = await storage.getApiSettings();
      const envToken = process.env.WHM_API_TOKEN;
      const apiToken = envToken || apiSettings?.whmApiToken;
      
      if (!apiSettings?.whmApiUrl || !apiToken) {
        console.warn("[Account Stats] WHM API not configured, returning default stats");
        return res.json({
          diskUsage: 0,
          diskLimit: 5120, // 5GB default
          bandwidthUsed: 0,
          bandwidthLimit: 10240, // 10GB default
          emailAccounts: 0,
          emailLimit: 50,
          databases: 0,
          databaseLimit: 10,
          subdomains: 1,
          subdomainLimit: 5,
          addonDomains: 0,
          addonDomainLimit: 3,
          parkDomains: 0,
          parkDomainLimit: 3,
          ftpAccounts: 1,
          ftpAccountLimit: 5,
          lastUpdate: new Date().toISOString(),
          source: "default"
        });
      }

      // Clean base URL
      const baseUrl = apiSettings.whmApiUrl.replace(/\/+$/, '').replace(/\/json-api.*$/, '').replace(/:2087.*$/, '');
      
      try {
        // Get account summary from WHM API
        const accountUrl = `${baseUrl}:2087/json-api/accountsummary?api.version=1&user=${account.subdomain}`;
        
        console.log(`[Account Stats] Fetching stats for user: ${account.subdomain}`);
        
        const response = await fetch(accountUrl, {
          method: 'GET',
          headers: {
            'Authorization': `whm root:${apiToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`WHM API returned ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log(`[Account Stats] WHM API Response for ${account.subdomain}:`, JSON.stringify(result, null, 2));

        if (result.metadata?.result === 1 && result.data?.acct) {
          const accountData = result.data.acct[0] || result.data.acct;
          
          // Parse WHM account data
          const stats = {
            diskUsage: parseFloat(accountData.diskused || 0),
            diskLimit: parseFloat(accountData.disklimit || 5120),
            bandwidthUsed: parseFloat(accountData.bwused || 0),
            bandwidthLimit: parseFloat(accountData.bwlimit || 10240),
            emailAccounts: parseInt(accountData.email || 0),
            emailLimit: parseInt(accountData.maxpop || 50),
            databases: parseInt(accountData.mysql || 0),
            databaseLimit: parseInt(accountData.maxsql || 10),
            subdomains: parseInt(accountData.subdomain || 1),
            subdomainLimit: parseInt(accountData.maxsub || 5),
            addonDomains: parseInt(accountData.addon || 0),
            addonDomainLimit: parseInt(accountData.maxaddon || 3),
            parkDomains: parseInt(accountData.park || 0),
            parkDomainLimit: parseInt(accountData.maxpark || 3),
            ftpAccounts: parseInt(accountData.ftp || 1),
            ftpAccountLimit: parseInt(accountData.maxftp || 5),
            lastUpdate: new Date().toISOString(),
            source: "whm_api",
            packageName: accountData.plan || "Unknown",
            suspended: accountData.suspended === "1",
            domain: accountData.domain,
            ip: accountData.ip,
            user: accountData.user
          };
          
          // Update database with real statistics
          await storage.updateHostingAccountUsage(
            accountId, 
            Math.round(stats.diskUsage * 1024 * 1024), // Convert MB to bytes
            Math.round(stats.bandwidthUsed * 1024 * 1024) // Convert MB to bytes
          );
          
          res.json(stats);
        } else {
          throw new Error("Invalid response from WHM API");
        }
      } catch (apiError) {
        console.error("[Account Stats] WHM API Error:", apiError);
        // Return database values as fallback
        res.json({
          diskUsage: (account.diskUsage || 0) / (1024 * 1024), // Convert bytes to MB
          diskLimit: (account.diskLimit || 5120),
          bandwidthUsed: (account.bandwidthUsed || 0) / (1024 * 1024), // Convert bytes to MB
          bandwidthLimit: (account.bandwidthLimit || 10240),
          emailAccounts: 0,
          emailLimit: 50,
          databases: 0,
          databaseLimit: 10,
          subdomains: 1,
          subdomainLimit: 5,
          addonDomains: 0,
          addonDomainLimit: 3,
          parkDomains: 0,
          parkDomainLimit: 3,
          ftpAccounts: 1,
          ftpAccountLimit: 5,
          lastUpdate: new Date().toISOString(),
          source: "database_fallback",
          error: "Unable to fetch real-time statistics from WHM API"
        });
      }
    } catch (error) {
      console.error("Error fetching account statistics:", error);
      res.status(500).json({ error: "Failed to fetch account statistics" });
    }
  });

  // Get all hosting accounts grouped by client (admin only)
  app.get("/api/admin/hosting-accounts", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      // Get all users
      const allUsers = await storage.getAllUsers();
      
      // Get hosting accounts for each user
      const clientAccounts = await Promise.all(
        allUsers.map(async (user) => {
          const hostingAccounts = await storage.getHostingAccountsByUserId(user.id);
          return {
            user,
            hostingAccounts: hostingAccounts || []
          };
        })
      );

      // Filter to only include clients with hosting accounts
      const clientsWithAccounts = clientAccounts.filter(
        (client) => client.hostingAccounts.length > 0
      );

      res.json(clientsWithAccounts);
    } catch (error) {
      console.error("Error fetching client hosting accounts:", error);
      res.status(500).json({ error: "Failed to fetch client hosting accounts" });
    }
  });

  // Delete hosting account from both system and WHM (admin only)
  app.delete("/api/admin/hosting-accounts/:id", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const accountId = parseInt(req.params.id);
      
      // Get the hosting account details first
      const hostingAccounts = await storage.getHostingAccountsByUserId(0); // We need a better way to get all accounts
      let account = null;
      
      // Find the account across all users (this is not ideal, should improve storage interface)
      const allUsers = await storage.getAllUsers();
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

      console.log(`[Admin Delete] Attempting to delete hosting account: ${account.domain} (ID: ${accountId})`);

      // Get API settings for WHM integration
      const apiSettings = await storage.getApiSettings();
      const envToken = process.env.WHM_API_TOKEN;
      const apiToken = envToken || apiSettings?.whmApiToken;
      
      if (apiSettings?.whmApiUrl && apiToken) {
        try {
          // Extract username from domain (remove .hostme.today)
          const username = account.subdomain || account.domain.replace('.hostme.today', '');
          
          console.log(`[Admin Delete] Attempting to delete WHM account for user: ${username}`);
          
          // Clean base URL
          const baseUrl = apiSettings.whmApiUrl.replace(/\/+$/, '').replace(/\/json-api.*$/, '').replace(/:2087.*$/, '');
          
          // Call WHM API to remove the account completely
          const whmDeleteUrl = `${baseUrl}:2087/json-api/removeacct?api.version=1&user=${username}`;
          
          const whmResponse = await fetch(whmDeleteUrl, {
            method: 'GET', // WHM uses GET for removeacct
            headers: {
              'Authorization': `whm root:${apiToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (!whmResponse.ok) {
            console.error(`[Admin Delete] WHM API error: ${whmResponse.status} ${whmResponse.statusText}`);
            // Continue with local deletion even if WHM fails
          } else {
            const whmResult = await whmResponse.json();
            console.log('[Admin Delete] WHM account deletion result:', whmResult);
            
            if (whmResult.metadata?.result !== 1) {
              console.warn('[Admin Delete] WHM deletion may have failed:', whmResult.metadata?.reason);
            } else {
              console.log(`[Admin Delete] Successfully deleted WHM account for ${username}`);
            }
          }
        } catch (whmError) {
          console.error('[Admin Delete] Error deleting from WHM:', whmError);
          // Continue with local deletion even if WHM fails
        }
      } else {
        console.warn('[Admin Delete] WHM API not configured, skipping WHM deletion');
      }

      // Delete from local database
      const deleted = await storage.deleteHostingAccount(accountId);
      
      if (!deleted) {
        return res.status(500).json({ error: "Failed to delete hosting account from local database" });
      }

      console.log(`[Admin Delete] Successfully deleted hosting account ${account.domain} from local database`);

      res.json({ 
        message: "Hosting account deleted successfully",
        deletedAccount: {
          id: accountId,
          domain: account.domain,
          deletedFromWHM: !!(apiSettings?.whmApiUrl && apiToken),
          deletedFromLocal: true
        }
      });
    } catch (error) {
      console.error("Error deleting hosting account:", error);
      res.status(500).json({ error: "Failed to delete hosting account" });
    }
  });

  // Update hosting account (admin only)
  app.put("/api/admin/hosting-accounts/:id", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const accountId = parseInt(req.params.id);
      const updates = req.body;
      
      // Validate updates (basic validation)
      const allowedUpdates = ['status', 'packageId', 'diskLimit', 'bandwidthLimit'];
      const filteredUpdates = Object.keys(updates)
        .filter(key => allowedUpdates.includes(key))
        .reduce((obj: any, key) => {
          obj[key] = updates[key];
          return obj;
        }, {});

      if (Object.keys(filteredUpdates).length === 0) {
        return res.status(400).json({ error: "No valid updates provided" });
      }

      const updatedAccount = await storage.updateHostingAccount(accountId, filteredUpdates);
      
      if (!updatedAccount) {
        return res.status(404).json({ error: "Hosting account not found" });
      }

      res.json(updatedAccount);
    } catch (error) {
      console.error("Error updating hosting account:", error);
      res.status(500).json({ error: "Failed to update hosting account" });
    }
  });

  // Test WHM API connection endpoint
  app.post("/api/test-whm-connection", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      // Get API settings
      const apiSettings = await storage.getApiSettings();
      if (!apiSettings || !apiSettings.whmApiUrl || !apiSettings.whmApiToken) {
        console.log("WHM API test failed: Missing API settings");
        return res.status(400).json({ message: "WHM API settings not configured" });
      }

      console.log("Testing WHM API connection with:", {
        url: apiSettings.whmApiUrl,
        tokenLength: apiSettings.whmApiToken.length,
        tokenPrefix: apiSettings.whmApiToken.substring(0, 8) + "..."
      });

      // Clean up the base URL to avoid double slashes
      const baseUrl = apiSettings.whmApiUrl.replace(/\/+$/, ''); // Remove trailing slashes

      // Try multiple WHM API endpoints and authentication methods
      const testEndpoints: Array<{
        name: string;
        url: string;
        headers: Record<string, string>;
      }> = [
        {
          name: "WHM API v1 with token auth",
          url: `${baseUrl}/json-api/version?api.version=1`,
          headers: {
            "Authorization": `whm root:${apiSettings.whmApiToken}`,
          }
        },
        {
          name: "WHM API v1 with token parameter",
          url: `${baseUrl}/json-api/version?api.version=1&access_token=${apiSettings.whmApiToken}`,
          headers: {}
        },
        {
          name: "WHM API v2 with token auth",
          url: `${baseUrl}/json-api/version?api.version=2`,
          headers: {
            "Authorization": `whm root:${apiSettings.whmApiToken}`,
          }
        },
        {
          name: "WHM uAPI version endpoint",
          url: `${baseUrl}/execute/version`,
          headers: {
            "Authorization": `whm root:${apiSettings.whmApiToken}`,
            "Content-Type": "application/x-www-form-urlencoded",
          }
        },
        {
          name: "WHM XML API version",
          url: `${baseUrl}/xml-api/version`,
          headers: {
            "Authorization": `whm root:${apiSettings.whmApiToken}`,
          }
        },
        {
          name: "Basic auth with root user",
          url: `${baseUrl}/json-api/version?api.version=1`,
          headers: {
            "Authorization": `Basic ${Buffer.from(`root:${apiSettings.whmApiToken}`).toString('base64')}`,
          }
        }
      ];

      let lastError = null;
      
      for (const endpoint of testEndpoints) {
        try {
          console.log(`Trying ${endpoint.name}:`, endpoint.url);
          
          const response = await fetch(endpoint.url, {
            method: "GET",
            headers: endpoint.headers,
          });

          console.log(`Response status: ${response.status} ${response.statusText}`);
          
          // Log response headers for debugging
          const responseHeaders: Record<string, string> = {};
          response.headers.forEach((value, key) => {
            responseHeaders[key] = value;
          });
          console.log("Response headers:", responseHeaders);

          if (response.ok) {
            let data;
            const contentType = response.headers.get('content-type') || '';
            
            if (contentType.includes('application/json')) {
              data = await response.json();
            } else {
              const textData = await response.text();
              console.log("Non-JSON response:", textData);
              // Try to parse XML or other formats
              if (textData.includes('<cpanelresult>')) {
                // Handle XML response format
                console.log("WHM API connection successful (XML format)!");
                return res.json({ 
                  success: true, 
                  version: "XML API",
                  message: `WHM API connection successful using ${endpoint.name}`,
                  method: endpoint.name,
                  responseFormat: "XML"
                });
              }
              data = { text: textData };
            }
            
            console.log("WHM API response data:", data);
            
            // Check different response formats
            if (data.metadata && data.metadata.result === 1) {
              // Standard WHM API JSON format
              console.log("WHM API connection successful!");
              return res.json({ 
                success: true, 
                version: data.data?.version || "Unknown",
                message: `WHM API connection successful using ${endpoint.name}`,
                method: endpoint.name
              });
            } else if (data.cpanelresult && data.cpanelresult.data && data.cpanelresult.data.result !== "0") {
              // cPanel result format (success)
              console.log("WHM API connection successful (cPanel format)!");
              return res.json({ 
                success: true, 
                version: data.cpanelresult.data?.version || "cPanel API",
                message: `WHM API connection successful using ${endpoint.name}`,
                method: endpoint.name
              });
            } else if (data.result && data.result.status === 1) {
              // Alternative success format
              console.log("WHM API connection successful (alternative format)!");
              return res.json({ 
                success: true, 
                version: data.result?.version || "Unknown",
                message: `WHM API connection successful using ${endpoint.name}`,
                method: endpoint.name
              });
            } else if (response.status === 200) {
              // If we get a 200 response, consider it successful even if format is unexpected
              console.log("WHM API connection successful (200 OK)!");
              return res.json({ 
                success: true, 
                version: "Connected",
                message: `WHM API connection successful using ${endpoint.name}`,
                method: endpoint.name,
                note: "Connection established but response format may be non-standard"
              });
            } else {
              console.log("WHM API returned error:", data.metadata?.reason || data.cpanelresult?.error || "Unknown error");
              lastError = new Error(data.metadata?.reason || data.cpanelresult?.error || "Unknown WHM API error");
            }
          } else {
            const errorText = await response.text();
            console.log(`WHM API error response body:`, errorText);
            lastError = new Error(`WHM API returned ${response.status}: ${response.statusText}. Response: ${errorText}`);
          }
        } catch (fetchError) {
          console.log(`Error with ${endpoint.name}:`, fetchError);
          lastError = fetchError;
        }
      }

      // If we get here, all endpoints failed
      throw lastError || new Error("All WHM API connection attempts failed");

    } catch (error) {
      console.error("WHM connection test error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to connect to WHM API",
        details: "Check server logs for detailed error information"
      });
    }
  });

  // WHM admin login endpoint with automatic authentication
  app.post("/api/admin/whm-login", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      // Get API settings
      const apiSettings = await storage.getApiSettings();
      if (!apiSettings || !apiSettings.whmApiUrl || !apiSettings.whmApiToken) {
        return res.status(400).json({ message: "WHM API settings not configured" });
      }

      // Clean up the base URL and extract just the domain/host
      let baseUrl = apiSettings.whmApiUrl.replace(/\/+$/, ''); // Remove trailing slashes
      
      // Remove any API paths and port numbers from the URL
      baseUrl = baseUrl.replace(/\/json-api.*$/, ''); // Remove /json-api path
      baseUrl = baseUrl.replace(/:2087.*$/, ''); // Remove existing port
      
      // Generate WHM login URL with automatic authentication using API token
      // This uses WHM's auto-login feature with the API token for seamless access
      const loginUrl = `${baseUrl}:2087/login/?user=root&pass=${apiSettings.whmApiToken}&goto_uri=/`;
      
      console.log("Generated WHM auto-login URL with authentication token");
      
      res.json({ 
        loginUrl,
        message: "WHM panel auto-login URL generated successfully"
      });
    } catch (error) {
      console.error("Error generating WHM login:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to generate WHM login URL" 
      });
    }
  });

  // Package Management endpoints
  app.get("/api/packages", async (req, res) => {
    try {
      const packages = await storage.getActiveHostingPackages();
      res.json(packages);
    } catch (error) {
      console.error("Error fetching packages:", error);
      res.status(500).json({ message: "Failed to fetch packages" });
    }
  });

  app.get("/api/admin/packages", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const packages = await storage.getHostingPackages();
      res.json(packages);
    } catch (error) {
      console.error("Error fetching packages:", error);
      res.status(500).json({ message: "Failed to fetch packages" });
    }
  });

  app.post("/api/admin/packages", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const packageData = req.body;
      const newPackage = await storage.createHostingPackage(packageData);
      res.status(201).json(newPackage);
    } catch (error) {
      console.error("Error creating package:", error);
      res.status(500).json({ message: "Failed to create package" });
    }
  });

  app.put("/api/admin/packages/:id", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const packageId = parseInt(req.params.id);
      const packageData = req.body;
      const updatedPackage = await storage.updateHostingPackage(packageId, packageData);
      res.json(updatedPackage);
    } catch (error) {
      console.error("Error updating package:", error);
      res.status(500).json({ message: "Failed to update package" });
    }
  });

  app.delete("/api/admin/packages/:id", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const packageId = parseInt(req.params.id);
      await storage.deleteHostingPackage(packageId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting package:", error);
      res.status(500).json({ message: "Failed to delete package" });
    }
  });

  // WHM Package endpoints
  app.get("/api/admin/whm-packages", isAuthenticated, requireAdmin, async (req, res) => {
    console.log(`[WHM API] Starting package fetch request at ${new Date().toISOString()}`);
    
    try {
      const apiSettings = await storage.getApiSettings();
      const envToken = process.env.WHM_API_TOKEN;
      
      console.log(`[WHM API] Retrieved API settings:`, {
        hasUrl: !!apiSettings?.whmApiUrl,
        hasToken: !!apiSettings?.whmApiToken,
        hasEnvToken: !!envToken,
        urlLength: apiSettings?.whmApiUrl?.length,
        tokenLength: apiSettings?.whmApiToken?.length,
        envTokenLength: envToken?.length
      });

      // Use environment token if available, otherwise fall back to database token
      const apiToken = envToken || apiSettings?.whmApiToken;
      
      if (!apiSettings?.whmApiUrl || !apiToken) {
        console.error(`[WHM API] Missing API settings - URL: ${!!apiSettings?.whmApiUrl}, Token: ${!!apiToken}`);
        return res.status(400).json({ message: "WHM API settings not configured" });
      }

      const baseUrl = apiSettings.whmApiUrl.replace(/\/+$/, '').replace(/\/json-api.*$/, '').replace(/:2087.*$/, '');
      
      // According to WHM API documentation, the correct structure should match the working test endpoint
      console.log(`[WHM API] Using official WHM API documentation structure`);
      
      // Clean URL construction following official documentation pattern
      const cleanBaseUrl = apiSettings.whmApiUrl.replace(/\/+$/, '').replace(/\/json-api.*$/, '').replace(/:2087.*$/, '');
      console.log(`[WHM API] Clean base URL: ${cleanBaseUrl}`);
      
      // Test the exact working authentication method but with official API endpoints from documentation
      const packageEndpoints = [
        // Official WHM API 1 function from documentation
        { name: "listpkgs_official", url: `${cleanBaseUrl}:2087/json-api/listpkgs?api.version=1` },
        // Test without specifying port (might be handled automatically)
        { name: "listpkgs_no_port", url: `${cleanBaseUrl}/json-api/listpkgs?api.version=1` },
        // Test with different port variations that might work
        { name: "listpkgs_2086", url: `${cleanBaseUrl}:2086/json-api/listpkgs?api.version=1` },
        // Test the exact pattern that works for version but with listpkgs
        { name: "listpkgs_exact_pattern", url: `${cleanBaseUrl}/json-api/listpkgs?api.version=1` },
        // Try XML API which might be available
        { name: "listpkgs_xml", url: `${cleanBaseUrl}:2087/xml-api/listpkgs` },
        { name: "listpkgs_xml_no_port", url: `${cleanBaseUrl}/xml-api/listpkgs` },
      ];
      
      console.log(`[WHM API] Testing ${packageEndpoints.length} official API endpoint variations`);
      
      for (let i = 0; i < packageEndpoints.length; i++) {
        const endpoint = packageEndpoints[i];
        console.log(`[WHM API] Attempt ${i + 1}/${packageEndpoints.length} - Testing: ${endpoint.name}`);
        console.log(`[WHM API] Full URL: ${endpoint.url}`);
        
        try {
          const response = await fetch(endpoint.url, {
            method: 'GET',
            headers: {
              'Authorization': `whm root:${apiToken}`,
            },
          });
          
          console.log(`[WHM API] ${endpoint.name} - Status: ${response.status}, Status Text: ${response.statusText}`);
          
          if (response.ok) {
            const responseText = await response.text();
            console.log(`[WHM API] ${endpoint.name} - SUCCESS! Response (first 500 chars): ${responseText.substring(0, 500)}`);
            
            try {
              const data = JSON.parse(responseText);
              console.log(`[WHM API] ${endpoint.name} - JSON structure:`, {
                hasData: !!data.data,
                hasPkg: !!data.data?.pkg,
                hasPackages: !!data.data?.packages,
                topLevelKeys: Object.keys(data),
                dataKeys: data.data ? Object.keys(data.data) : []
              });
              
              // Handle different response structures
              if (data.data?.pkg && Array.isArray(data.data.pkg)) {
                console.log(`[WHM API] SUCCESS - Found ${data.data.pkg.length} packages in 'pkg' field`);
                return res.json({ packages: data.data.pkg });
              } else if (data.data?.packages && Array.isArray(data.data.packages)) {
                console.log(`[WHM API] SUCCESS - Found ${data.data.packages.length} packages in 'packages' field`);
                return res.json({ packages: data.data.packages });
              } else if (Array.isArray(data.data)) {
                console.log(`[WHM API] SUCCESS - Found ${data.data.length} packages in data array`);
                return res.json({ packages: data.data });
              } else if (data.pkg && Array.isArray(data.pkg)) {
                console.log(`[WHM API] SUCCESS - Found ${data.pkg.length} packages in root 'pkg' field`);
                return res.json({ packages: data.pkg });
              } else {
                console.log(`[WHM API] ${endpoint.name} - Successful response but no packages found. Full data:`, data);
                // Return empty array if response is successful but no packages
                return res.json({ packages: [] });
              }
              
            } catch (parseError) {
              console.log(`[WHM API] ${endpoint.name} - Response not JSON, checking for XML`);
              if (responseText.includes('<pkg>') || responseText.includes('<package>')) {
                console.log(`[WHM API] ${endpoint.name} - XML format detected, would need XML parser`);
                // For now, return empty array since we don't have XML parser
                return res.json({ packages: [] });
              }
            }
          } else {
            const errorText = await response.text();
            console.log(`[WHM API] ${endpoint.name} - Error ${response.status}: ${errorText.substring(0, 200)}`);
          }
          
        } catch (error) {
          console.error(`[WHM API] ${endpoint.name} - Exception:`, error);
        }
      }
      
      // If all endpoints fail, check if WHM API supports listpkgs at all
      console.error(`[WHM API] All official endpoints failed. This WHM server may not support the listpkgs function.`);
      console.log(`[WHM API] Working test connection URL was: ${cleanBaseUrl}/json-api/version?api.version=1`);
      console.log(`[WHM API] Consider checking WHM documentation or contacting hosting provider about available package management functions.`);
      
      return res.status(500).json({ 
        message: "WHM package listing not available", 
        details: "The WHM server does not appear to support the listpkgs function. Check with your hosting provider."
      });
      
    } catch (error) {
      console.error("Error fetching WHM packages:", error);
      res.status(500).json({ message: "Failed to fetch WHM packages" });
    }
  });

  // Check subdomain availability for *.hostme.today
  app.get("/api/check-subdomain/:subdomain", async (req, res) => {
    try {
      const { subdomain } = req.params;
      
      // Validate subdomain format
      if (!subdomain || subdomain.length < 3 || subdomain.length > 63) {
        return res.status(400).json({ 
          available: false, 
          message: "Subdomain must be between 3 and 63 characters" 
        });
      }

      // Check if subdomain contains only valid characters
      const validSubdomain = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/i.test(subdomain);
      if (!validSubdomain) {
        return res.status(400).json({ 
          available: false, 
          message: "Subdomain can only contain letters, numbers, and hyphens (not at start/end)" 
        });
      }

      // Check if subdomain already exists in database
      const fullDomain = `${subdomain.toLowerCase()}.hostme.today`;
      const existingAccount = await storage.getHostingAccountByDomain(fullDomain);
      
      if (existingAccount) {
        return res.json({ 
          available: false, 
          message: "This subdomain is already taken" 
        });
      }

      // Check reserved subdomains
      const reservedSubdomains = ['www', 'mail', 'ftp', 'cpanel', 'whm', 'webmail', 'admin', 'api', 'ns1', 'ns2'];
      if (reservedSubdomains.includes(subdomain.toLowerCase())) {
        return res.json({ 
          available: false, 
          message: "This subdomain is reserved and cannot be used" 
        });
      }

      res.json({ 
        available: true, 
        domain: fullDomain,
        message: "Subdomain is available!" 
      });
    } catch (error) {
      console.error("Error checking subdomain availability:", error);
      res.status(500).json({ 
        available: false, 
        message: "Unable to check subdomain availability" 
      });
    }
  });

  // Domain registration with package selection
  app.post("/api/create-hosting-account", isAuthenticated, async (req: any, res) => {
    try {
      const { subdomain, packageId = 1 } = req.body;
      const userId = req.user.id;

      // Validate subdomain
      if (!subdomain || subdomain.length < 3 || subdomain.length > 63) {
        return res.status(400).json({ 
          message: "Subdomain must be between 3 and 63 characters"
        });
      }

      // Check if subdomain is valid format
      const validSubdomain = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/i.test(subdomain);
      if (!validSubdomain) {
        return res.status(400).json({ 
          message: "Subdomain can only contain letters, numbers, and hyphens (not at start/end)"
        });
      }

      // Check if subdomain already exists
      const fullDomain = `${subdomain.toLowerCase()}.hostme.today`;
      const existingDomainAccount = await storage.getHostingAccountByDomain(fullDomain);
      
      if (existingDomainAccount) {
        return res.status(400).json({ 
          message: "This subdomain is already taken"
        });
      }

      // Get the selected package
      const selectedPackage = await storage.getHostingPackageById(packageId);
      if (!selectedPackage) {
        return res.status(400).json({ 
          message: "Selected package not found"
        });
      }

      console.log(`[Account Creation] Creating hosting account for ${fullDomain} using package: ${selectedPackage.name}`);

      // Get user details for WHM account creation
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(400).json({ 
          message: "User not found"
        });
      }

      // Create hosting account locally first (as pending)
      const hostingAccount = await storage.createHostingAccount({
        userId,
        domain: fullDomain,
        subdomain: subdomain.toLowerCase(),
        packageId,
        status: 'pending',
        diskUsage: 0,
        bandwidthUsed: 0,
        diskLimit: selectedPackage.diskSpaceQuota * 1024 * 1024, // Convert MB to bytes
        bandwidthLimit: selectedPackage.bandwidthQuota * 1024 * 1024, // Convert MB to bytes
      });

      console.log(`[Account Creation] Local hosting account created with ID: ${hostingAccount.id}`);

      // Get API settings for WHM integration
      const apiSettings = await storage.getApiSettings();
      const envToken = process.env.WHM_API_TOKEN;
      const apiToken = envToken || apiSettings?.whmApiToken;
      
      if (apiSettings?.whmApiUrl && apiToken && selectedPackage.whmPackageName) {
        try {
          // Clean base URL
          const baseUrl = apiSettings.whmApiUrl.replace(/\/+$/, '').replace(/\/json-api.*$/, '').replace(/:2087.*$/, '');
          
          console.log(`[Account Creation] Attempting to create WHM account for user: ${subdomain.toLowerCase()}`);
          
          // Generate a random password for the WHM account
          const randomPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12).toUpperCase() + '123!';
          
          // Build WHM createacct API URL with parameters
          const createAccountParams = new URLSearchParams({
            'api.version': '1',
            'username': subdomain.toLowerCase(),
            'domain': fullDomain,
            'plan': selectedPackage.whmPackageName,
            'password': randomPassword,
            'contactemail': user.email || `admin@${fullDomain}`,
            'quota': selectedPackage.diskSpaceQuota.toString(), // Disk quota in MB
            'bwlimit': selectedPackage.bandwidthQuota.toString(), // Bandwidth quota in MB
            'maxpop': selectedPackage.emailAccounts.toString(),
            'maxsql': selectedPackage.databases.toString(),
            'maxsub': selectedPackage.subdomains.toString(),
            'maxaddon': '0', // Addon domains
            'maxpark': '0', // Parked domains
            'maxftp': '5', // FTP accounts
          });
          
          const whmCreateUrl = `${baseUrl}:2087/json-api/createacct?${createAccountParams.toString()}`;
          
          console.log(`[Account Creation] WHM createacct URL (password hidden): ${whmCreateUrl.replace(/password=[^&]+/, 'password=***')}`);
          
          const whmResponse = await fetch(whmCreateUrl, {
            method: 'GET', // WHM uses GET for createacct
            headers: {
              'Authorization': `whm root:${apiToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (!whmResponse.ok) {
            throw new Error(`WHM API returned ${whmResponse.status}: ${whmResponse.statusText}`);
          }

          const whmResult = await whmResponse.json();
          console.log('[Account Creation] WHM account creation result:', JSON.stringify(whmResult, null, 2));
          
          if (whmResult.metadata?.result === 1) {
            // WHM account created successfully
            console.log(`[Account Creation] Successfully created WHM account for ${subdomain.toLowerCase()}`);
            
            // Update the hosting account status to active
            await storage.updateHostingAccount(hostingAccount.id, { 
              status: 'active',
              cpanelUsername: subdomain.toLowerCase(),
              cpanelPassword: randomPassword // Store for cPanel access
            });
            
            console.log(`[Account Creation] Updated local account status to active`);
            
          } else {
            throw new Error(`WHM account creation failed: ${whmResult.metadata?.reason || 'Unknown error'}`);
          }
        } catch (whmError: any) {
          console.error('[Account Creation] Error creating WHM account:', whmError);
          
          // Update the account with error status but don't fail the request
          await storage.updateHostingAccount(hostingAccount.id, { 
            status: 'error'
          });
          
          // Return success but with a warning about WHM
          return res.status(201).json({
            message: "Hosting account created locally, but WHM integration failed. Please contact support.",
            account: hostingAccount,
            domain: fullDomain,
            whmError: whmError?.message || 'Unknown WHM error',
            status: 'error'
          });
        }
      } else {
        console.warn('[Account Creation] WHM API not configured or package has no WHM package name, skipping WHM creation');
        
        // Update account to active since there's no WHM integration
        await storage.updateHostingAccount(hostingAccount.id, { 
          status: 'active'
        });
      }

      // Create package usage tracking
      await storage.createPackageUsage({
        hostingAccountId: hostingAccount.id,
        diskUsed: 0,
        bandwidthUsed: 0,
        emailAccountsUsed: 0,
        databasesUsed: 0,
        subdomainsUsed: 1, // The main subdomain counts as 1
      });

      // Get the updated account with current status
      const updatedAccount = await storage.getHostingAccountsByUserId(userId);
      const finalAccount = updatedAccount.find((acc: any) => acc.id === hostingAccount.id);

      res.status(201).json({
        message: "Hosting account created successfully",
        account: finalAccount || hostingAccount,
        domain: fullDomain,
        whmIntegration: !!(apiSettings?.whmApiUrl && apiToken && selectedPackage.whmPackageName)
      });
    } catch (error) {
      console.error("Error creating hosting account:", error);
      res.status(500).json({ message: "Failed to create hosting account" });
    }
  });

  // cPanel login endpoint
  app.post("/api/cpanel-login/:accountId", isAuthenticated, async (req: any, res) => {
    try {
      const accountId = parseInt(req.params.accountId);
      const userId = req.user.id;

      // Get hosting account
      const accounts = await storage.getHostingAccountsByUserId(userId);
      const userAccount = accounts.find((acc: any) => acc.id === accountId);
      
      if (!userAccount) {
        return res.status(404).json({ message: "Hosting account not found" });
      }

      // Get API settings for cPanel URL
      const apiSettings = await storage.getApiSettings();
      if (!apiSettings || !apiSettings.cpanelBaseUrl) {
        return res.status(400).json({ message: "cPanel settings not configured" });
      }

      // Generate cPanel login URL
      const cpanelUrl = `${apiSettings.cpanelBaseUrl}:2083`;
      
      res.json({ 
        loginUrl: cpanelUrl,
        username: userAccount.cpanelUsername,
        message: "cPanel access URL generated successfully"
      });
    } catch (error) {
      console.error("Error generating cPanel login:", error);
      res.status(500).json({ message: "Failed to generate cPanel login URL" });
    }
  });

  app.post("/api/admin/plugins", isAuthenticated, requireAdmin, upload.fields([
    { name: 'pluginFile', maxCount: 1 },
    { name: 'imageFile', maxCount: 1 }
  ]), async (req: any, res) => {
    try {
      // Fixed: Use correct user ID structure for custom auth
      const userId = req.user.id;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      if (!files || !files.pluginFile || !files.pluginFile[0]) {
        return res.status(400).json({ message: "Plugin file is required" });
      }

      const pluginFile = files.pluginFile[0];
      const imageFile = files.imageFile ? files.imageFile[0] : null;

      console.log(`[Plugin Upload] Plugin file: ${pluginFile.filename}, Size: ${pluginFile.size} bytes`);
      if (imageFile) {
        console.log(`[Plugin Upload] Image file: ${imageFile.filename}, Size: ${imageFile.size} bytes`);
      }

      // Generate slug from name (required field)
      const slug = req.body.name
        ? req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
        : pluginFile.filename.replace(/\.[^/.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, '-');

      // Store relative paths for production deployment
      const relativePluginPath = path.relative(process.cwd(), pluginFile.path);
      const imageUrl = imageFile ? `/static/plugins/${imageFile.filename}` : req.body.imageUrl || null;

      // Prepare complete plugin data with all required fields
      const pluginData = {
        ...req.body,
        author: "HostFarm.org", // Hardcoded as requested
        slug: slug,
        fileName: pluginFile.filename,
        filePath: relativePluginPath,
        fileSize: pluginFile.size,
        imageUrl: imageUrl,
        uploadedBy: userId,
        isPublic: req.body.isPublic === 'true',
      };

      console.log('[Plugin Upload] Validating plugin data:', JSON.stringify(pluginData, null, 2));
      
      const validation = insertPluginSchema.safeParse(pluginData);
      if (!validation.success) {
        console.error('[Plugin Upload] Validation failed:', JSON.stringify(validation.error.errors, null, 2));
        return res.status(400).json({
          message: "Invalid plugin data",
          errors: validation.error.errors,
        });
      }

      // Create plugin with validated data (all fields already prepared)
      const plugin = await storage.createPlugin(validation.data);

      console.log(`[Plugin Upload] Plugin created in database with ID: ${plugin.id}`);
      res.json(plugin);
    } catch (error) {
      console.error("Error uploading plugin:", error);
      res.status(500).json({ message: "Failed to upload plugin" });
    }
  });

  // Update plugin route
  app.put("/api/admin/plugins/:id", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const pluginId = parseInt(req.params.id);
      const updates = req.body;
      
      // Get the existing plugin to verify it exists
      const existingPlugin = await storage.getPluginById(pluginId);
      if (!existingPlugin) {
        return res.status(404).json({ message: "Plugin not found" });
      }
      
      // Update the plugin
      const updatedPlugin = await storage.updatePlugin(pluginId, updates);
      if (!updatedPlugin) {
        return res.status(500).json({ message: "Failed to update plugin" });
      }
      
      res.json(updatedPlugin);
    } catch (error) {
      console.error("Error updating plugin:", error);
      res.status(500).json({ message: "Failed to update plugin" });
    }
  });

  // Delete plugin route
  app.delete("/api/admin/plugins/:id", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const pluginId = parseInt(req.params.id);
      
      // Get the plugin to access its file path before deletion
      const plugin = await storage.getPluginById(pluginId);
      if (!plugin) {
        return res.status(404).json({ message: "Plugin not found" });
      }
      
      // Delete the plugin from database
      const success = await storage.deletePlugin(pluginId);
      if (!success) {
        return res.status(500).json({ message: "Failed to delete plugin from database" });
      }
      
      // Try to delete the physical file (but don't fail if file doesn't exist)
      try {
        const filePath = path.join(process.cwd(), plugin.filePath || `plugins/${plugin.fileName}`);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`[Plugin Delete] File deleted: ${filePath}`);
        }
      } catch (fileError) {
        console.warn(`[Plugin Delete] Could not delete file: ${fileError}`);
        // Continue - database deletion succeeded
      }
      
      res.json({ message: "Plugin deleted successfully" });
    } catch (error) {
      console.error("Error deleting plugin:", error);
      res.status(500).json({ message: "Failed to delete plugin" });
    }
  });

  // Plugin download route - serves plugin files from the plugins directory
  app.get("/api/plugins/:id/download", async (req, res) => {
    try {
      const plugin = await storage.getPluginById(parseInt(req.params.id));
      if (!plugin) {
        return res.status(404).json({ message: "Plugin not found" });
      }

      // Construct the absolute file path
      const filePath = path.join(process.cwd(), plugin.filePath || `plugins/${plugin.fileName}`);
      
      console.log(`[Plugin Download] Serving file: ${filePath}`);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.error(`[Plugin Download] File not found: ${filePath}`);
        return res.status(404).json({ message: "Plugin file not found" });
      }

      // Increment download count
      await storage.incrementPluginDownloads(plugin.id);

      // Set appropriate headers for download
      res.setHeader('Content-Disposition', `attachment; filename="${plugin.fileName}"`);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Length', plugin.fileSize || fs.statSync(filePath).size);

      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

      fileStream.on('error', (error) => {
        console.error('[Plugin Download] Stream error:', error);
        if (!res.headersSent) {
          res.status(500).json({ message: "Error streaming file" });
        }
      });

    } catch (error) {
      console.error("Error downloading plugin:", error);
      res.status(500).json({ message: "Failed to download plugin" });
    }
  });

  // Serve static plugin files and images
  app.use("/static/plugins", express.static(path.join(process.cwd(), "plugins")));

  // Stripe payment routes for donations
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const { amount, pluginId, pluginName } = req.body;
      
      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(500).json({ message: "Stripe not configured" });
      }
      
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        metadata: {
          pluginId: pluginId ? pluginId.toString() : '',
          pluginName: pluginName || '',
          type: 'plugin-donation'
        }
      });
      
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  // Donation routes
  app.post("/api/donations", async (req, res) => {
    try {
      const validation = insertDonationSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid donation data",
          errors: validation.error.errors,
        });
      }

      const donation = await storage.createDonation(validation.data);
      res.json(donation);
    } catch (error) {
      console.error("Error creating donation:", error);
      res.status(500).json({ message: "Failed to create donation" });
    }
  });

  app.get("/api/admin/donations", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const donations = await storage.getDonations();
      res.json(donations);
    } catch (error) {
      console.error("Error fetching donations:", error);
      res.status(500).json({ message: "Failed to fetch donations" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
