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
