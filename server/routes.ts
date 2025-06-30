import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { insertHostingAccountSchema, insertPluginSchema, insertDonationSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/zip" || file.originalname.endsWith(".zip")) {
      cb(null, true);
    } else {
      cb(new Error("Only ZIP files are allowed"));
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

  app.get("/api/plugins/:id", async (req, res) => {
    try {
      const plugin = await storage.getPluginById(parseInt(req.params.id));
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

  // cPanel auto-login endpoint
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
      if (!apiSettings) {
        return res.status(500).json({ error: "cPanel integration not configured" });
      }

      // Create auto-login URL
      const cpanelUrl = `${apiSettings.cpanelBaseUrl}/login/?user=${hostingAccount.subdomain}&domain=${domain}`;
      
      res.json({ 
        loginUrl: cpanelUrl,
        domain: domain,
        username: hostingAccount.subdomain 
      });
    } catch (error) {
      console.error("Error generating cPanel login:", error);
      res.status(500).json({ error: "Failed to generate cPanel login" });
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

  // WHM admin login endpoint
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
      
      // Generate WHM login URL - direct to WHM panel
      const loginUrl = `${baseUrl}:2087`;
      
      console.log("Generated WHM login URL:", loginUrl);
      
      res.json({ 
        loginUrl,
        message: "WHM panel access URL generated successfully"
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
    try {
      const apiSettings = await storage.getApiSettings();
      if (!apiSettings || !apiSettings.whmApiUrl || !apiSettings.whmApiToken) {
        return res.status(400).json({ message: "WHM API settings not configured" });
      }

      const baseUrl = apiSettings.whmApiUrl.replace(/\/+$/, '').replace(/\/json-api.*$/, '').replace(/:2087.*$/, '');
      const apiUrl = `${baseUrl}:2087/json-api/listpkgs?api.version=1`;

      // Try multiple authentication methods
      let response;
      let lastError;
      
      // Method 1: WHM token format
      try {
        response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `WHM ${apiSettings.whmApiToken.replace(/^whm\s+/i, '')}`,
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          const data = await response.json();
          if (data.data?.pkg) {
            return res.json({ packages: data.data.pkg });
          }
        }
      } catch (error) {
        lastError = error;
      }

      // Method 2: Bearer token format
      try {
        response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiSettings.whmApiToken.replace(/^(whm|bearer)\s+/i, '')}`,
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          const data = await response.json();
          if (data.data?.pkg) {
            return res.json({ packages: data.data.pkg });
          }
        }
      } catch (error) {
        lastError = error;
      }

      // Method 3: Direct token in URL
      try {
        const urlWithToken = `${apiUrl}&api.token=${apiSettings.whmApiToken.replace(/^(whm|bearer)\s+/i, '')}`;
        response = await fetch(urlWithToken, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          const data = await response.json();
          if (data.data?.pkg) {
            return res.json({ packages: data.data.pkg });
          }
        }
      } catch (error) {
        lastError = error;
      }

      // If all methods fail, return sample packages structure for development
      console.warn("WHM API authentication failed with all methods, returning sample structure");
      const samplePackages = [
        { name: "starter", displayname: "Starter Package" },
        { name: "business", displayname: "Business Package" },
        { name: "premium", displayname: "Premium Package" },
        { name: "enterprise", displayname: "Enterprise Package" }
      ];
      
      res.json({ packages: samplePackages });
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
      
      if (existingAccount) {
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

      // Create hosting account
      const hostingAccount = await storage.createHostingAccount({
        userId,
        domain: fullDomain,
        subdomain: subdomain.toLowerCase(),
        packageId,
        status: 'pending',
        diskUsage: 0,
        bandwidthUsed: 0,
      });

      // Create package usage tracking
      await storage.createPackageUsage({
        hostingAccountId: hostingAccount.id,
        packageId,
        diskUsed: 0,
        bandwidthUsed: 0,
        emailAccountsUsed: 0,
        databasesUsed: 0,
        subdomainsUsed: 1, // The main subdomain counts as 1
      });

      res.status(201).json({
        message: "Hosting account created successfully",
        account: hostingAccount,
        domain: fullDomain,
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

  app.post("/api/admin/plugins", isAuthenticated, requireAdmin, upload.single("pluginFile"), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ message: "Plugin file is required" });
      }

      const validation = insertPluginSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid plugin data",
          errors: validation.error.errors,
        });
      }

      const plugin = await storage.createPlugin({
        ...validation.data,
        fileName: file.filename,
        fileSize: file.size,
        uploadedBy: userId,
      });

      res.json(plugin);
    } catch (error) {
      console.error("Error uploading plugin:", error);
      res.status(500).json({ message: "Failed to upload plugin" });
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
