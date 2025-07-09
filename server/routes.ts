import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { setupAuth, isAuthenticated, generateUsername, generatePassword, generateRecoveryPhrase, hashPassword } from "./auth";
import { insertHostingAccountSchema, insertPluginSchema, insertDonationSchema, insertVpsPackageSchema, insertVpsInstanceSchema, insertUserSchema, insertPluginRequestSchema, donations } from "@shared/schema";
import { eq } from "drizzle-orm";
import multer from "multer";
import path from "path";
import fs from "fs";
import Stripe from "stripe";
import nodemailer from "nodemailer";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

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
  // Stripe webhook endpoint (must be before express.json() middleware to get raw body)
  app.post("/api/stripe-webhook", express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    
    let event;
    try {
      // Get webhook secret from environment variables
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!webhookSecret) {
        console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET not set');
        return res.status(400).send('Webhook secret not configured');
      }
      
      event = stripe.webhooks.constructEvent(req.body, sig!, webhookSecret);
    } catch (err: any) {
      console.log(`[Stripe Webhook] Signature verification failed:`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log(`[Stripe Webhook] Processing event: ${event.type}`);

    try {
      switch (event.type) {
        case 'invoice.payment_failed':
          const failedInvoice = event.data.object;
          console.log(`[Stripe Webhook] Payment failed for subscription: ${failedInvoice.subscription}`);
          
          // Get customer email from the subscription
          const subscription = await stripe.subscriptions.retrieve(failedInvoice.subscription as string);
          const customer = await stripe.customers.retrieve(subscription.customer as string);
          const customerEmail = (customer as any).email;
          
          // Send failure notification email
          try {
            await sendEmail({
              to: customerEmail,
              subject: '🚨 VPS Payment Failed - Action Required',
              html: `
                <h2>VPS Payment Failed</h2>
                <p>Your VPS subscription payment has failed. You have 24 hours to update your payment method before your VPS is flagged for deletion.</p>
                <p><strong>Subscription ID:</strong> ${subscription.id}</p>
                <p><strong>Amount Due:</strong> $${(failedInvoice.amount_due / 100).toFixed(2)}</p>
                <p>Please update your payment method immediately to avoid service interruption.</p>
                <p>Visit your dashboard to manage your subscription.</p>
              `
            });
            console.log(`[Stripe Webhook] Sent payment failure notification to ${customerEmail}`);
          } catch (emailError) {
            console.error(`[Stripe Webhook] Failed to send email notification:`, emailError);
          }
          
          // Update VPS order status to "payment_failed" 
          try {
            await storage.updateVpsOrderByStripeSubscription(subscription.id, { 
              status: 'payment_failed',
              paymentFailedAt: new Date()
            } as any);
            console.log(`[Stripe Webhook] Updated VPS order status to payment_failed`);
          } catch (dbError) {
            console.error(`[Stripe Webhook] Failed to update VPS order status:`, dbError);
          }
          break;

        case 'invoice.payment_succeeded':
          const successInvoice = event.data.object;
          console.log(`[Stripe Webhook] Payment succeeded for subscription: ${successInvoice.subscription}`);
          
          // Update VPS order status to "active" if it was payment_failed
          try {
            const subscription = await stripe.subscriptions.retrieve(successInvoice.subscription as string);
            await storage.updateVpsOrderByStripeSubscription(subscription.id, { 
              status: 'active',
              paymentFailedAt: null
            } as any);
            console.log(`[Stripe Webhook] Updated VPS order status to active`);
          } catch (dbError) {
            console.error(`[Stripe Webhook] Failed to update VPS order status:`, dbError);
          }
          break;

        case 'subscription_schedule.canceled':
        case 'customer.subscription.deleted':
          const canceledSubscription = event.data.object;
          console.log(`[Stripe Webhook] Subscription canceled: ${canceledSubscription.id}`);
          
          // Update VPS order status to "canceled"
          try {
            await storage.updateVpsOrderByStripeSubscription(canceledSubscription.id, { 
              status: 'canceled'
            } as any);
            console.log(`[Stripe Webhook] Updated VPS order status to canceled`);
          } catch (dbError) {
            console.error(`[Stripe Webhook] Failed to update VPS order status:`, dbError);
          }
          break;

        default:
          console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error(`[Stripe Webhook] Error processing event:`, error);
      return res.status(500).send('Webhook processing failed');
    }

    res.json({ received: true });
  });

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

  // Update user email
  app.post("/api/update-email", isAuthenticated, async (req: any, res) => {
    try {
      const { email } = req.body;
      
      if (!email || typeof email !== "string") {
        return res.status(400).json({ message: "Email is required" });
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }

      // Check if email is already taken by another user
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser && existingUser.id !== req.user.id) {
        return res.status(400).json({ message: "Email is already registered by another user" });
      }

      // Update user email
      const updatedUser = await storage.updateUserEmail(req.user.id, email);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ message: "Email updated successfully", user: updatedUser });
    } catch (error) {
      console.error("Error updating email:", error);
      res.status(500).json({ message: "Failed to update email" });
    }
  });

  // Update user email (legacy route)
  app.patch("/api/user/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      // Check if user is updating their own account
      if (req.user.id !== userId) {
        return res.status(403).json({ message: "You can only update your own account" });
      }

      const { email } = req.body;
      
      // Validate email if provided
      if (email && typeof email !== 'string') {
        return res.status(400).json({ message: "Invalid email format" });
      }

      const updatedUser = await storage.updateUser(userId, { email });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(updatedUser);
    } catch (error: any) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
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

      // Get API settings for WHM credentials
      const apiSettings = await storage.getApiSettings();
      if (!apiSettings || !apiSettings.whmApiUrl || !apiSettings.whmApiToken) {
        return res.status(500).json({ message: "WHM API configuration not found. Please configure API settings first." });
      }

      // Get default hosting package
      const defaultPackage = await storage.getFreeHostingPackage();
      const packageName = defaultPackage?.whmPackageName || 'default';

      // Generate secure username and password
      const username = `u${subdomain.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 6)}${Date.now().toString().slice(-2)}`;
      const password = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase() + '1!';

      console.log(`[WHM] Creating cPanel account for domain: ${domain}, username: ${username}, package: ${packageName}`);

      // Create cPanel account via WHM API
      try {
        const whmApiUrl = apiSettings.whmApiUrl.replace(/\/+$/, ''); // Remove trailing slashes
        const createUrl = `${whmApiUrl}/json-api/createacct?api.version=1`;
        
        const whmResponse = await fetch(createUrl, {
          method: 'POST',
          headers: {
            'Authorization': `whm root:${apiSettings.whmApiToken}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            username: username,
            domain: domain,
            plan: packageName,
            password: password,
            email: `admin@${domain}`,
            quota: '512',
            hasshell: '0',
            maxftp: '5',
            maxsql: '5',
            maxsub: '5',
            maxpark: '2',
            maxaddon: '2',
            bwlimit: '1024',
            ip: 'n',
            cgi: '1',
            frontpage: '0',
            maxlst: '20',
            savepkg: '0'
          }),
        });

        // Try to parse as JSON first, if that fails, parse as HTML
        let whmResult;
        let isSuccess = false;
        
        const responseText = await whmResponse.text();
        console.log('[WHM] Response body (first 500 chars):', responseText.substring(0, 500));
        
        try {
          whmResult = JSON.parse(responseText);
          console.log('[WHM] Parsed JSON response:', JSON.stringify(whmResult, null, 2));
          
          // Check JSON response for success - multiple formats possible
          if (whmResult.metadata?.result === 1 || 
              whmResult.cpanelresult?.event?.result === 1 ||
              (whmResult.data && whmResult.data.length > 0 && whmResult.data[0].statusmsg === "Account Creation Ok") ||
              (Array.isArray(whmResult) && whmResult.some(item => item.statusmsg === "Account Creation Ok"))) {
            console.log('[WHM] SUCCESS: JSON response indicates success');
            isSuccess = true;
          } else {
            console.log('[WHM] JSON response does not indicate success:', whmResult);
          }
        } catch (jsonError) {
          // Response is likely HTML, check for success indicators in the text
          console.log('[WHM] Response is not valid JSON, treating as HTML format');
          console.log('[WHM] JSON parse error:', jsonError instanceof Error ? jsonError.message : String(jsonError));
          console.log('[WHM] Full response text length:', responseText.length);
          console.log('[WHM] Response text (first 2000 chars):');
          console.log(responseText.substring(0, 2000));
          
          // Check for multiple success indicators that WHM uses
          const successIndicators = [
            'Account Creation Complete',
            'Account Creation Ok',
            'wwwacct creation finished',
            'Account Creation Complete!!!',
            'creation finished',
            'statusmsg":"Account Creation Ok"'
          ];
          
          console.log('[WHM] Checking for success indicators...');
          
          let foundIndicator = null;
          const hasSuccessIndicator = successIndicators.some(indicator => {
            const found = responseText.includes(indicator);
            if (found) {
              foundIndicator = indicator;
              console.log(`[WHM] FOUND SUCCESS INDICATOR: "${indicator}"`);
            }
            return found;
          });
          
          if (hasSuccessIndicator) {
            console.log(`[WHM] SUCCESS: Found success indicator "${foundIndicator}" in HTML response`);
            isSuccess = true;
            whmResult = { success: true, message: `Account created successfully (HTML response - found: ${foundIndicator})` };
          } else if (responseText.includes('failed') || responseText.includes('error')) {
            console.log('[WHM] FAILED: Found error indicator in HTML response');
            whmResult = { success: false, message: 'Account creation failed (HTML response)' };
          } else {
            console.log('[WHM] UNKNOWN: Could not determine status from HTML response');
            console.log('[WHM] No success or error indicators found');
            whmResult = { success: false, message: 'Unknown response format - no clear success/error indicators' };
          }
        }
        
        if (!isSuccess) {
          const errorMessage = whmResult.metadata?.reason || whmResult.message || 'Unknown WHM error';
          console.error('[WHM] Account creation failed with error:', errorMessage);
          console.error('[WHM] Full response:', JSON.stringify(whmResult, null, 2));
          return res.status(500).json({ 
            message: "Failed to create hosting account on server", 
            details: errorMessage
          });
        }

        console.log('[WHM] cPanel account created successfully for:', domain);
        
        // Create hosting account in database
        const account = await storage.createHostingAccount({
          userId,
          domain,
          subdomain,
          status: "active",
          packageId: defaultPackage?.id || null,
        });

        res.json({
          ...account,
          credentials: {
            username,
            password,
            cpanelUrl: `https://${domain}:2083`,
            loginUrl: `${apiSettings.cpanelBaseUrl}/login/?user=${username}&pass=${password}&goto_uri=/`
          }
        });
      } catch (whmError) {
        console.error('[WHM] API Error:', whmError);
        return res.status(500).json({ 
          message: "Failed to create hosting account on server", 
          details: whmError instanceof Error ? whmError.message : 'Unknown error'
        });
      }
    } catch (error) {
      console.error("Error creating hosting account:", error);
      res.status(500).json({ message: "Failed to create hosting account" });
    }
  });

  app.get("/api/hosting-accounts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const accounts = await storage.getHostingAccountsByUserId(userId);
      
      // Get API settings for WHM integration
      const apiSettings = await storage.getApiSettings();
      let whmData: { [key: string]: any } | null = null;
      
      if (apiSettings?.whmApiUrl && apiSettings?.whmApiToken) {
        try {
          console.log('[Client Hosting Accounts] Fetching live WHM data...');
          const baseUrl = apiSettings.whmApiUrl.replace(/\/+$/, '').replace(/:2087$/, ''); // Remove any existing port
          const apiToken = process.env.WHM_API_TOKEN || apiSettings.whmApiToken;
          
          // Fetch account list with disk usage from WHM
          const listacctsUrl = `${baseUrl}:2087/json-api/listaccts?api.version=1`;
          const listacctsResponse = await fetch(listacctsUrl, {
            method: 'GET',
            headers: {
              'Authorization': `whm root:${apiToken}`,
            },
          });

          if (listacctsResponse.ok) {
            const listacctsResult = await listacctsResponse.json();
            console.log('[Client Hosting Accounts] WHM listaccts response received');
            
            if (listacctsResult.data?.acct) {
              whmData = {};
              listacctsResult.data.acct.forEach((account: any) => {
                whmData![account.user] = {
                  diskUsed: parseFloat(account.diskused) || 0, // in MB
                  diskLimit: parseFloat(account.disklimit) || 0, // in MB  
                  email: account.email,
                  domain: account.domain,
                  ip: account.ip,
                  package: account.plan,
                  suspended: account.suspended === '1',
                  theme: account.theme,
                  shell: account.shell,
                  maxftp: account.maxftp,
                  maxsql: account.maxsql,
                  maxpop: account.maxpop,
                  maxlst: account.maxlst,
                  maxsub: account.maxsub,
                  maxpark: account.maxpark,
                  maxaddon: account.maxaddon,
                  startdate: account.startdate,
                  unix_startdate: account.unix_startdate
                };
              });
              console.log(`[Client Hosting Accounts] Processed ${Object.keys(whmData).length} WHM accounts`);
            }
          }

          // Fetch bandwidth data for current month
          const currentDate = new Date();
          const currentMonth = currentDate.getMonth() + 1;
          const currentYear = currentDate.getFullYear();
          
          const showbwUrl = `${baseUrl}:2087/json-api/showbw?api.version=1&month=${currentMonth}&year=${currentYear}`;
          const showbwResponse = await fetch(showbwUrl, {
            method: 'GET',
            headers: {
              'Authorization': `whm root:${apiToken}`,
            },
          });

          if (showbwResponse.ok) {
            const showbwResult = await showbwResponse.json();
            console.log('[Client Hosting Accounts] WHM bandwidth response received');
            
            if (showbwResult.data?.bandwidth) {
              showbwResult.data.bandwidth.forEach((bwData: any) => {
                const username = bwData.acct;
                if (whmData && whmData[username]) {
                  whmData[username].bandwidthUsed = parseFloat(bwData.totalbytes) / (1024 * 1024) || 0; // Convert bytes to MB
                  whmData[username].bandwidthLimit = whmData[username].bandwidthLimit || 10240; // Default 10GB if not specified
                }
              });
              console.log(`[Client Hosting Accounts] Updated bandwidth data for ${Object.keys(whmData || {}).length} accounts`);
            }
          }

        } catch (whmError) {
          console.error('[Client Hosting Accounts] Error fetching WHM data:', whmError);
        }
      }
      
      // Enhance accounts with WHM live data
      const enhancedAccounts = accounts.map((account: any) => {
        // Generate proper cPanel username using same logic as account creation
        let username = account.subdomain.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        // If username starts with a number, prepend 'h' (for "host")
        if (/^[0-9]/.test(username)) {
          username = 'h' + username;
        }
        
        // If username is still empty or too long, use fallback
        if (!username || username.length > 16) {
          username = account.cpanelUsername || account.subdomain;
        }
        
        const whmAccountData = whmData?.[username];
        
        if (whmAccountData) {
          return {
            ...account,
            // Override with live WHM data (keep in bytes for frontend compatibility)
            diskUsage: Math.round(whmAccountData.diskUsed * 1024 * 1024), // Convert MB to bytes
            diskLimit: Math.round(whmAccountData.diskLimit * 1024 * 1024), // Convert MB to bytes  
            bandwidthUsed: Math.round(whmAccountData.bandwidthUsed * 1024 * 1024), // Convert MB to bytes
            // Add additional WHM data
            whmData: {
              email: whmAccountData.email,
              ip: whmAccountData.ip,
              package: whmAccountData.package,
              suspended: whmAccountData.suspended,
              theme: whmAccountData.theme,
              shell: whmAccountData.shell,
              startdate: whmAccountData.startdate,
              unix_startdate: whmAccountData.unix_startdate,
              limits: {
                maxftp: whmAccountData.maxftp,
                maxsql: whmAccountData.maxsql,
                maxpop: whmAccountData.maxpop,
                maxlst: whmAccountData.maxlst,
                maxsub: whmAccountData.maxsub,
                maxpark: whmAccountData.maxpark,
                maxaddon: whmAccountData.maxaddon
              }
            }
          };
        }
        return account;
      });

      res.json(enhancedAccounts);
    } catch (error) {
      console.error("Error fetching hosting accounts:", error);
      res.status(500).json({ message: "Failed to fetch hosting accounts" });
    }
  });

  // Check domain availability endpoint
  app.post("/api/check-domain-availability", async (req, res) => {
    try {
      const { domain } = req.body;
      
      if (!domain || typeof domain !== 'string') {
        return res.status(400).json({ 
          available: false, 
          message: "Invalid domain provided" 
        });
      }

      // Check if domain exists in our database
      const existingAccount = await storage.getHostingAccountByDomain(domain);
      
      if (existingAccount) {
        return res.json({
          available: false,
          message: `${domain} is already taken`,
          domain: domain
        });
      }

      // Optional: Check with WHM API for additional validation
      try {
        const apiSettings = await storage.getApiSettings();
        if (apiSettings && apiSettings.whmApiUrl && apiSettings.whmApiToken) {
          const whmApiUrl = apiSettings.whmApiUrl.replace(/\/+$/, '');
          const checkUrl = `${whmApiUrl}/json-api/listaccts?api.version=1&searchtype=domain&search=${domain}`;
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const whmResponse = await fetch(checkUrl, {
            method: 'GET',
            headers: {
              'Authorization': `whm root:${apiSettings.whmApiToken}`,
            },
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);

          if (whmResponse.ok) {
            const whmResult = await whmResponse.json();
            
            // Check if domain exists on the server
            if (whmResult.data && Array.isArray(whmResult.data) && whmResult.data.length > 0) {
              return res.json({
                available: false,
                message: `${domain} is already taken on the server`,
                domain: domain
              });
            }
          }
        }
      } catch (whmError) {
        console.log('WHM availability check failed, proceeding with database check only:', whmError);
        // Continue with database check only if WHM check fails
      }

      // Domain is available
      res.json({
        available: true,
        message: `${domain} is available`,
        domain: domain
      });

    } catch (error) {
      console.error("Error checking domain availability:", error);
      res.status(500).json({ 
        available: false, 
        message: "Error checking domain availability" 
      });
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

  // Get VPS orders for current user
  app.get("/api/user-vps-orders", isAuthenticated, async (req: any, res) => {
    try {
      const userEmail = req.user.email;
      const vpsOrders = await storage.getVpsOrdersByEmail(userEmail);
      res.json(vpsOrders);
    } catch (error) {
      console.error("Error fetching VPS orders:", error);
      res.status(500).json({ message: "Failed to fetch VPS orders" });
    }
  });

  // Remove duplicate routes since they're now properly ordered above

  // Complete domain registration - creates hosting account first, then user account
  app.post("/api/register-domain", async (req, res) => {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substring(7);
    
    try {
      const { subdomain, packageId = 1 } = req.body;
      
      console.log(`[Domain Registration ${requestId}] START - Subdomain: ${subdomain}, Package: ${packageId}`);
      
      if (!subdomain) {
        console.error(`[Domain Registration ${requestId}] ERROR - No subdomain provided`);
        return res.status(400).json({ message: "Subdomain is required" });
      }

      // Step 1: Get API settings and validate WHM access
      const apiSettings = await storage.getApiSettings();
      const envToken = process.env.WHM_API_TOKEN;
      const apiToken = envToken || apiSettings?.whmApiToken;
      
      console.log(`[Domain Registration ${requestId}] WHM API Settings:`, {
        hasDbSettings: !!apiSettings,
        hasUrl: !!apiSettings?.whmApiUrl,
        hasDbToken: !!apiSettings?.whmApiToken,
        hasEnvToken: !!envToken,
        usingToken: envToken ? 'environment' : 'database'
      });
      
      if (!apiSettings?.whmApiUrl || !apiToken) {
        console.error(`[Domain Registration ${requestId}] ERROR - Missing WHM API configuration`);
        return res.status(500).json({ message: "WHM API settings not configured" });
      }

      // Step 2: Check if domain is available
      const domain = `${subdomain}.hostme.today`;
      console.log(`[Domain Registration ${requestId}] Checking domain availability: ${domain}`);
      
      const existingAccount = await storage.getHostingAccountByDomain(domain);
      if (existingAccount) {
        console.error(`[Domain Registration ${requestId}] ERROR - Domain already exists: ${domain}`);
        return res.status(400).json({ message: "Domain is already taken" });
      }

      // Step 3: Check device fingerprint limits BEFORE creating account
      const { fingerprintHash } = req.body;
      if (fingerprintHash) {
        console.log(`[Domain Registration ${requestId}] Checking device limits for fingerprint: ${fingerprintHash.substring(0, 10)}...`);
        
        const deviceCount = await storage.getDeviceCountByFingerprint(fingerprintHash);
        console.log(`[Domain Registration ${requestId}] Current device count for fingerprint: ${deviceCount}`);
        
        // Get default user group limits (Free group allows 2 devices)
        const freeGroup = await storage.getUserGroupByName("Free");
        const maxDevices = freeGroup?.maxDevices || 2;
        
        if (deviceCount >= maxDevices) {
          console.error(`[Domain Registration ${requestId}] ERROR - Device limit exceeded: ${deviceCount}/${maxDevices}`);
          return res.status(403).json({ 
            message: `Device registration limit exceeded. You can only register accounts from ${maxDevices} devices. Currently registered on ${deviceCount} devices.`,
            error: "DEVICE_LIMIT_EXCEEDED",
            currentDevices: deviceCount,
            maxDevices: maxDevices
          });
        }
        
        console.log(`[Domain Registration ${requestId}] ✓ Device limits check passed: ${deviceCount}/${maxDevices}`);
      } else {
        console.warn(`[Domain Registration ${requestId}] WARNING - No device fingerprint provided`);
      }

      // Step 4: Get hosting package
      const hostingPackage = await storage.getHostingPackageById(packageId);
      if (!hostingPackage) {
        console.error(`[Domain Registration ${requestId}] ERROR - Invalid package ID: ${packageId}`);
        return res.status(400).json({ message: "Invalid hosting package" });
      }
      
      console.log(`[Domain Registration ${requestId}] Using hosting package: ${hostingPackage.name}`);

      // Step 4: Generate username and password for WHM
      let username = subdomain.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (/^[0-9]/.test(username)) {
        username = 'h' + username;
      }
      if (!username || username.length > 16) {
        username = subdomain.substring(0, 16);
      }
      
      const generatedPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-4).toUpperCase();
      
      console.log(`[Domain Registration ${requestId}] Generated WHM username: ${username}`);

      // Step 5: Create hosting account on WHM first
      console.log(`[Domain Registration ${requestId}] Creating hosting account on WHM...`);
      
      const baseUrl = apiSettings.whmApiUrl.replace(/\/+$/, '').replace(/\/json-api.*$/, '').replace(/:2087.*$/, '');
      const createUrl = `${baseUrl}:2087/json-api/createacct`;
      
      const formData = new URLSearchParams({
        'api.version': '1',
        'username': username,
        'domain': domain,
        'plan': hostingPackage.whmPackageName || '512MB Free Hosting',
        'featurelist': 'default',
        'password': generatedPassword,
        'ip': 'n', // Use shared IP
        'cgi': '1',
        'hasshell': '0',
        'contactemail': '',
        'cpmod': 'jupiter',
        'maxftp': 'unlimited',
        'maxsql': hostingPackage.databases?.toString() || '1',
        'maxpop': hostingPackage.emailAccounts?.toString() || '1',
        'maxlst': '0',
        'maxsub': hostingPackage.subdomains?.toString() || '1',
        'maxpark': '0',
        'maxaddon': '0',
        'bwlimit': hostingPackage.bandwidthQuota?.toString() || '10240', // Already in MB
        'language': 'en'
      });

      const whmResponse = await fetch(createUrl, {
        method: 'POST',
        headers: {
          'Authorization': `whm root:${apiToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData
      });

      if (!whmResponse.ok) {
        const errorText = await whmResponse.text();
        console.error(`[Domain Registration ${requestId}] WHM API Error:`, {
          status: whmResponse.status,
          statusText: whmResponse.statusText,
          response: errorText
        });
        return res.status(500).json({ message: "Failed to create hosting account on server" });
      }

      const whmResult = await whmResponse.json();
      console.log(`[Domain Registration ${requestId}] WHM Response:`, JSON.stringify(whmResult, null, 2));

      // Check if WHM account creation was successful
      const whmSuccess = whmResult.metadata?.result === 1 || whmResult.result?.[0]?.status === 1;
      if (!whmSuccess) {
        const errorReason = whmResult.metadata?.reason || whmResult.result?.[0]?.statusmsg || 'Unknown error';
        console.error(`[Domain Registration ${requestId}] WHM Account Creation Failed:`, errorReason);
        return res.status(500).json({ message: `Failed to create hosting account: ${errorReason}` });
      }

      console.log(`[Domain Registration ${requestId}] ✓ WHM hosting account created successfully`);

      // Step 6: Create anonymous user account
      console.log(`[Domain Registration ${requestId}] Creating anonymous user account...`);
      
      let userUsername: string;
      let attempts = 0;
      const maxAttempts = 10;

      do {
        userUsername = generateUsername();
        const existingUser = await storage.getUserByUsername(userUsername);
        if (!existingUser) break;
        attempts++;
      } while (attempts < maxAttempts);

      if (attempts >= maxAttempts) {
        console.error(`[Domain Registration ${requestId}] ERROR - Unable to generate unique username`);
        return res.status(500).json({ message: "Unable to generate unique username. Please try again." });
      }

      const userPassword = generatePassword();
      const recoveryPhrase = generateRecoveryPhrase();

      const user = await storage.createUser({
        username: userUsername,
        password: await hashPassword(userPassword),
        displayPassword: userPassword, // Store plain text password for display
        recoveryPhrase,
        isAnonymous: true,
        role: "client",
      });

      console.log(`[Domain Registration ${requestId}] ✓ User account created: ${user.username}`);

      // Step 7: Create hosting account record in database
      console.log(`[Domain Registration ${requestId}] Creating hosting account database record...`);
      
      const hostingAccount = await storage.createHostingAccount({
        userId: user.id,
        domain: domain,
        subdomain: subdomain,
        status: "active",
        packageId: packageId,
        cpanelUsername: username,
        cpanelPassword: generatedPassword,
        diskLimit: hostingPackage.diskSpaceQuota || 5120, // Already in MB
        bandwidthLimit: hostingPackage.bandwidthQuota || 10240, // Already in MB
      });

      console.log(`[Domain Registration ${requestId}] ✓ Hosting account database record created: ID ${hostingAccount.id}`);

      // Step 8: Record device fingerprint for new user
      if (fingerprintHash) {
        console.log(`[Domain Registration ${requestId}] Recording device fingerprint...`);
        
        try {
          // Extract device info from request
          const userAgent = req.headers['user-agent'] || '';
          const ipAddress = req.ip || req.connection.remoteAddress || '';
          const { macAddress, screenResolution, timezone, language, platformInfo } = req.body;
          
          await storage.createDeviceFingerprint({
            userId: user.id,
            fingerprintHash,
            macAddress,
            userAgent,
            screenResolution,
            timezone,
            language,
            platformInfo: platformInfo ? JSON.stringify(platformInfo) : null,
            ipAddress,
          });
          
          console.log(`[Domain Registration ${requestId}] ✓ Device fingerprint recorded`);
        } catch (error) {
          console.error(`[Domain Registration ${requestId}] WARNING - Failed to record device fingerprint:`, error);
          // Continue registration even if fingerprint recording fails
        }
      }

      // Step 9: Automatically log in the newly created user
      console.log(`[Domain Registration ${requestId}] Authenticating user...`);
      
      // Use Promise wrapper for req.login
      await new Promise<void>((resolve, reject) => {
        req.login(user, (err) => {
          if (err) {
            console.error(`[Domain Registration ${requestId}] Login error:`, err);
            reject(err);
          } else {
            console.log(`[Domain Registration ${requestId}] ✓ User automatically authenticated`);
            resolve();
          }
        });
      });

      const totalTime = Date.now() - startTime;
      console.log(`[Domain Registration ${requestId}] COMPLETE - Total time: ${totalTime}ms`);

      // Step 9: Return complete registration data
      res.status(201).json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          password: userPassword,
          recoveryPhrase: recoveryPhrase,
          role: user.role,
          isAnonymous: true,
        },
        hostingAccount: {
          id: hostingAccount.id,
          domain: hostingAccount.domain,
          subdomain: hostingAccount.subdomain,
          status: hostingAccount.status,
          cpanelUsername: username,
          package: hostingPackage.name,
        },
        message: "Account and hosting created successfully! Please save your credentials.",
        processingTime: totalTime
      });

    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error(`[Domain Registration ${requestId}] FATAL ERROR after ${totalTime}ms:`, error);
      console.error(`[Domain Registration ${requestId}] Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
      
      res.status(500).json({ 
        message: "Domain registration failed. Please try again.",
        error: error instanceof Error ? error.message : String(error),
        processingTime: totalTime
      });
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

  // Facebook Pixel Settings endpoints (admin only)
  app.get("/api/facebook-pixel-settings", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const settings = await storage.getFacebookPixelSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch Facebook Pixel settings" });
    }
  });

  app.post("/api/facebook-pixel-settings", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const settings = await storage.upsertFacebookPixelSettings(req.body);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to save Facebook Pixel settings" });
    }
  });

  app.delete("/api/facebook-pixel-settings", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const success = await storage.deleteFacebookPixelSettings();
      res.json({ success });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete Facebook Pixel settings" });
    }
  });

  // Admin cPanel auto-login endpoint using WHM API (allows admin to access any account)
  app.get("/api/admin/cpanel-login/:domain", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { domain } = req.params;
      
      // Admin can access any hosting account
      const hostingAccount = await storage.getHostingAccountByDomain(domain);
      if (!hostingAccount) {
        return res.status(404).json({ error: "Hosting account not found" });
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
        
        console.log(`[Admin cPanel Login] Creating session for user: ${hostingAccount.subdomain}`);
        
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
        console.log(`[Admin cPanel Login] WHM API Response:`, result);

        if (result.metadata?.result === 1 && result.data?.url) {
          // Success - return the auto-login URL
          res.json({ 
            loginUrl: result.data.url,
            domain: domain,
            username: hostingAccount.subdomain,
            message: "Admin auto-login session created successfully"
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
        console.error("[Admin cPanel Login] WHM API Error:", apiError);
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
      console.error("Error generating admin cPanel login:", error);
      res.status(500).json({ error: "Failed to generate cPanel login" });
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
        // Use the stored cpanelUsername if available, otherwise use subdomain
        let username = account.cpanelUsername || account.subdomain;
        
        // If no cpanelUsername is stored, generate it using the same logic as account creation
        if (!account.cpanelUsername) {
          username = account.subdomain.toLowerCase().replace(/[^a-z0-9]/g, '');
          
          // If username starts with a number, prepend 'h' (for "host")
          if (/^[0-9]/.test(username)) {
            username = 'h' + username;
          }
          
          // Ensure username is valid
          if (!username || username.length > 16) {
            username = account.subdomain;
          }
        }
        
        console.log(`[Account Stats] Subdomain: ${account.subdomain} -> Username: ${username}`);
        
        // Get account summary from WHM API using proper username and form data
        const accountUrl = `${baseUrl}:2087/json-api/accountsummary`;
        
        console.log(`[Account Stats] Fetching stats for user: ${username} via POST form data`);
        
        // Use form data instead of query parameters for WHM API
        const formData = new URLSearchParams({
          'api.version': '1',
          'user': username
        });
        
        const response = await fetch(accountUrl, {
          method: 'POST',
          headers: {
            'Authorization': `whm root:${apiToken}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData
        });

        if (!response.ok) {
          const responseText = await response.text();
          console.error(`[Account Stats] WHM API Error Response:`, {
            status: response.status,
            statusText: response.statusText,
            responseBody: responseText,
            url: accountUrl
          });
          throw new Error(`WHM API returned ${response.status}: ${response.statusText}. Response: ${responseText}`);
        }

        const result = await response.json();
        console.log(`[Account Stats] WHM API Response for ${username}:`, JSON.stringify(result, null, 2));

        if (result.metadata?.result === 1 && result.data?.acct) {
          const accountData = result.data.acct[0] || result.data.acct;
          
          // Get email account count via separate API call
          let emailAccountCount = 0;
          try {
            console.log(`[Account Stats] Attempting to fetch email count for user: ${username}`);
            
            const emailFormData = new URLSearchParams({
              'api.version': '1',
              'user': username
            });
            
            const emailUrl = `${apiSettings.whmApiUrl.replace(/\/json-api.*$/, '')}:2087/json-api/list_pops`;
            console.log(`[Account Stats] Email API URL: ${emailUrl}`);
            console.log(`[Account Stats] Email API Form Data: ${emailFormData.toString()}`);
            
            const emailResponse = await fetch(emailUrl, {
              method: 'POST',
              headers: {
                'Authorization': `whm root:${apiToken}`,
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: emailFormData
            });
            
            console.log(`[Account Stats] Email API Response Status: ${emailResponse.status} ${emailResponse.statusText}`);
            
            if (emailResponse.ok) {
              const emailResult = await emailResponse.json();
              console.log(`[Account Stats] Email API Response:`, JSON.stringify(emailResult, null, 2));
              
              if (emailResult.metadata?.result === 1) {
                // Different response formats possible
                if (emailResult.data && Array.isArray(emailResult.data)) {
                  emailAccountCount = emailResult.data.length;
                } else if (emailResult.data && emailResult.data.pop) {
                  emailAccountCount = Array.isArray(emailResult.data.pop) ? emailResult.data.pop.length : 0;
                } else if (emailResult.data && typeof emailResult.data === 'object') {
                  // Count keys in data object (each key might be an email account)
                  emailAccountCount = Object.keys(emailResult.data).length;
                } else {
                  console.log(`[Account Stats] Unexpected email data format:`, emailResult.data);
                  emailAccountCount = 0;
                }
                console.log(`[Account Stats] Calculated email account count: ${emailAccountCount}`);
              } else {
                console.log(`[Account Stats] Email API returned error result:`, emailResult.metadata);
                emailAccountCount = 0;
              }
            } else {
              const errorText = await emailResponse.text();
              console.log(`[Account Stats] Email API Error Response: ${errorText}`);
              emailAccountCount = 0;
            }
          } catch (emailError: any) {
            console.error(`[Account Stats] Email API Exception for ${username}:`, emailError?.message || emailError);
            // Default to 0 if we can't get email count
            emailAccountCount = 0;
          }
          
          // Parse WHM account data
          const stats = {
            diskUsage: parseFloat(accountData.diskused || 0),
            diskLimit: parseFloat(accountData.disklimit || 5120),
            bandwidthUsed: parseFloat(accountData.bwused || 0),
            bandwidthLimit: parseFloat(accountData.bwlimit || 10240),
            emailAccounts: emailAccountCount,
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

  // Get all hosting accounts grouped by client with WHM live data (admin only)
  app.get("/api/admin/hosting-accounts", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      // Get all users
      const allUsers = await storage.getAllUsers();
      
      // Get API settings for WHM integration
      const apiSettings = await storage.getApiSettings();
      let whmData: { [key: string]: any } | null = null;
      
      if (apiSettings?.whmApiUrl && apiSettings?.whmApiToken) {
        try {
          console.log('[Admin Hosting Accounts] Fetching live WHM data...');
          const baseUrl = apiSettings.whmApiUrl.replace(/\/+$/, '').replace(/:2087$/, ''); // Remove any existing port
          const apiToken = process.env.WHM_API_TOKEN || apiSettings.whmApiToken;
          
          // Fetch account list with disk usage from WHM
          const listacctsUrl = `${baseUrl}:2087/json-api/listaccts?api.version=1`;
          const listacctsResponse = await fetch(listacctsUrl, {
            method: 'GET',
            headers: {
              'Authorization': `whm root:${apiToken}`,
            },
          });

          if (listacctsResponse.ok) {
            const listacctsResult = await listacctsResponse.json();
            console.log('[Admin Hosting Accounts] WHM listaccts response received');
            
            if (listacctsResult.data?.acct) {
              whmData = {};
              listacctsResult.data.acct.forEach((account: any) => {
                whmData![account.user] = {
                  diskUsed: parseFloat(account.diskused) || 0, // in MB
                  diskLimit: parseFloat(account.disklimit) || 0, // in MB  
                  email: account.email,
                  domain: account.domain,
                  ip: account.ip,
                  package: account.plan,
                  suspended: account.suspended === '1',
                  theme: account.theme,
                  shell: account.shell,
                  maxftp: account.maxftp,
                  maxsql: account.maxsql,
                  maxpop: account.maxpop,
                  maxlst: account.maxlst,
                  maxsub: account.maxsub,
                  maxpark: account.maxpark,
                  maxaddon: account.maxaddon,
                  startdate: account.startdate,
                  unix_startdate: account.unix_startdate
                };
              });
              console.log(`[Admin Hosting Accounts] Processed ${Object.keys(whmData).length} WHM accounts`);
            }
          } else {
            console.warn('[Admin Hosting Accounts] Failed to fetch WHM account data:', listacctsResponse.status);
          }

          // Fetch bandwidth data for current month
          const currentDate = new Date();
          const currentMonth = currentDate.getMonth() + 1;
          const currentYear = currentDate.getFullYear();
          
          const showbwUrl = `${baseUrl}:2087/json-api/showbw?api.version=1&month=${currentMonth}&year=${currentYear}`;
          const showbwResponse = await fetch(showbwUrl, {
            method: 'GET',
            headers: {
              'Authorization': `whm root:${apiToken}`,
            },
          });

          if (showbwResponse.ok) {
            const showbwResult = await showbwResponse.json();
            console.log('[Admin Hosting Accounts] WHM bandwidth response received');
            
            if (showbwResult.data?.bandwidth) {
              showbwResult.data.bandwidth.forEach((bwData: any) => {
                const username = bwData.acct;
                if (whmData && whmData[username]) {
                  whmData[username].bandwidthUsed = parseFloat(bwData.totalbytes) / (1024 * 1024) || 0; // Convert bytes to MB
                  whmData[username].bandwidthLimit = whmData[username].bandwidthLimit || 10240; // Default 10GB if not specified
                }
              });
              console.log(`[Admin Hosting Accounts] Updated bandwidth data for ${Object.keys(whmData || {}).length} accounts`);
            }
          } else {
            console.warn('[Admin Hosting Accounts] Failed to fetch WHM bandwidth data:', showbwResponse.status);
          }

        } catch (whmError) {
          console.error('[Admin Hosting Accounts] Error fetching WHM data:', whmError);
        }
      }
      
      // Get hosting accounts for each user
      const clientAccounts = await Promise.all(
        allUsers.map(async (user) => {
          const hostingAccounts = await storage.getHostingAccountsByUserId(user.id);
          
          // Enhance accounts with WHM live data
          const enhancedAccounts = hostingAccounts.map((account: any) => {
            const username = account.cpanelUsername || account.subdomain;
            const whmAccountData = whmData?.[username];
            
            if (whmAccountData) {
              return {
                ...account,
                // Override with live WHM data (keep in bytes for frontend compatibility)
                diskUsage: Math.round(whmAccountData.diskUsed * 1024 * 1024), // Convert MB to bytes
                diskLimit: Math.round(whmAccountData.diskLimit * 1024 * 1024), // Convert MB to bytes  
                bandwidthUsed: Math.round(whmAccountData.bandwidthUsed * 1024 * 1024), // Convert MB to bytes
                // Add additional WHM data
                whmData: {
                  email: whmAccountData.email,
                  ip: whmAccountData.ip,
                  package: whmAccountData.package,
                  suspended: whmAccountData.suspended,
                  theme: whmAccountData.theme,
                  shell: whmAccountData.shell,
                  startdate: whmAccountData.startdate,
                  unix_startdate: whmAccountData.unix_startdate,
                  limits: {
                    maxftp: whmAccountData.maxftp,
                    maxsql: whmAccountData.maxsql,
                    maxpop: whmAccountData.maxpop,
                    maxlst: whmAccountData.maxlst,
                    maxsub: whmAccountData.maxsub,
                    maxpark: whmAccountData.maxpark,
                    maxaddon: whmAccountData.maxaddon
                  }
                }
              };
            }
            return account;
          });
          
          return {
            user,
            hostingAccounts: enhancedAccounts || []
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

  // Create anonymous account (admin only)
  app.post("/api/admin/create-anonymous-account", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      // Import the auth functions directly
      const { generateUsername, generatePassword, hashPassword } = await import('./auth.js');
      
      const username = generateUsername();
      const password = generatePassword();
      const hashedPassword = await hashPassword(password);

      const userData = {
        username,
        password: hashedPassword,
        role: "client" as const
      };

      const user = await storage.createUser(userData);
      
      res.json({
        id: user.id,
        username: user.username,
        password: password, // Return plaintext password for admin display
        role: user.role
      });
    } catch (error) {
      console.error("Error creating anonymous account:", error);
      res.status(500).json({ message: "Failed to create anonymous account" });
    }
  });

  // Create hosting account with WHM integration (admin only)
  app.post("/api/admin/create-hosting-account", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const { domain, packageId, userId } = req.body;

      if (!domain || !packageId) {
        return res.status(400).json({ message: "Domain and package ID are required" });
      }

      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      // Get user information
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get package information
      const hostingPackage = await storage.getHostingPackageById(packageId);
      if (!hostingPackage) {
        return res.status(404).json({ message: "Hosting package not found" });
      }

      // Generate subdomain for the hosting account
      const subdomain = domain.replace('.hostme.today', '');
      const fullDomain = `${subdomain}.hostme.today`;

      // Check if domain already exists
      const existingAccount = await storage.getHostingAccountByDomain(fullDomain);
      if (existingAccount) {
        return res.status(400).json({ message: "Domain already exists" });
      }

      // Create hosting account in database
      const accountData = {
        userId: user.id,
        domain: fullDomain,
        subdomain,
        packageId: packageId,
        status: "pending" as const
      };

      const account = await storage.createHostingAccount(accountData);

      // Generate WHM-compliant username and password outside try-catch for scope access
      let username = subdomain.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      // If username starts with a number, prepend 'h' (for "host")
      if (/^[0-9]/.test(username)) {
        username = 'h' + username;
      }
      
      // If username is still empty or too long, generate a safe alternative
      if (!username || username.length > 16) {
        // Generate a random username starting with 'h' followed by random letters/numbers
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        username = 'h' + randomSuffix;
      }
      
      console.log('[Admin WHM] Original subdomain:', subdomain);
      console.log('[Admin WHM] Generated WHM-compliant username:', username);
      const { generatePassword } = await import('./auth.js');
      const password = generatePassword();

      // Create WHM account
      try {
        const apiSettings = await storage.getApiSettings();
        if (!apiSettings) {
          return res.status(400).json({ message: "API settings not configured" });
        }

        const whmData = {
          username,
          password,
          domain: fullDomain,
          contactemail: user.email || "admin@hostfarm.org",
          plan: hostingPackage.whmPackageName || "10GB Free",
          ip: "n" // Use shared IP
        };

        const authHeader = `whm root:${apiSettings.whmApiToken}`;
        // Check if URL already has port, if not add it
        const baseUrl = apiSettings.whmApiUrl.includes(':2087') ? apiSettings.whmApiUrl : `${apiSettings.whmApiUrl}:2087`;
        const whmUrl = `${baseUrl}/json-api/createacct`;

        console.log('[Admin WHM] Creating account for:', fullDomain);
        console.log('[Admin WHM] WHM API URL:', whmUrl);
        console.log('[Admin WHM] Base URL from settings:', apiSettings.whmApiUrl);
        console.log('[Admin WHM] WHM Data being sent:', JSON.stringify(whmData, null, 2));
        console.log('[Admin WHM] URL Parameters:', new URLSearchParams(whmData).toString());

        const whmResponse = await fetch(whmUrl, {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams(whmData).toString(),
        });

        console.log('[Admin WHM] Response status:', whmResponse.status);
        console.log('[Admin WHM] Response headers:', Object.fromEntries(whmResponse.headers.entries()));

        if (!whmResponse.ok) {
          const errorText = await whmResponse.text();
          throw new Error(`WHM API returned ${whmResponse.status}: ${whmResponse.statusText} - ${errorText}`);
        }

        // Try to parse as JSON first, if that fails, parse as text (HTML)
        let whmResult;
        let isSuccess = false;
        
        const responseText = await whmResponse.text();
        console.log('[Admin WHM] Response body (first 500 chars):', responseText.substring(0, 500));
        
        try {
          whmResult = JSON.parse(responseText);
          console.log('[Admin WHM] Parsed JSON response:', JSON.stringify(whmResult, null, 2));
          
          // Check JSON response for success - multiple formats possible
          if (whmResult.metadata?.result === 1 || 
              whmResult.cpanelresult?.event?.result === 1 ||
              (whmResult.data && whmResult.data.length > 0 && whmResult.data[0].statusmsg === "Account Creation Ok") ||
              (Array.isArray(whmResult) && whmResult.some((item: any) => item.statusmsg === "Account Creation Ok")) ||
              (whmResult.result && Array.isArray(whmResult.result) && whmResult.result.some((item: any) => 
                item.status === 1 || item.statusmsg === "Account Creation Ok" || 
                (typeof item.statusmsg === 'string' && item.statusmsg.includes("Account Creation Ok")))) ||
              (whmResult.status === 1) ||
              (Array.isArray(whmResult.result) && whmResult.result.length > 0 && whmResult.result[0].status === 1)) {
            console.log('[Admin WHM] SUCCESS: JSON response indicates success');
            isSuccess = true;
          } else {
            console.log('[Admin WHM] JSON response does not indicate success:', whmResult);
          }
        } catch (jsonError) {
          // Response is likely HTML, check for success indicators in the text
          console.log('[Admin WHM] Response is not valid JSON, treating as HTML format');
          console.log('[Admin WHM] JSON parse error:', jsonError instanceof Error ? jsonError.message : String(jsonError));
          console.log('[Admin WHM] Full response text length:', responseText.length);
          console.log('[Admin WHM] Response text (first 2000 chars):');
          console.log(responseText.substring(0, 2000));
          
          // Since the response contains HTML but the console shows JSON-like data,
          // let's try to extract JSON from within the HTML response
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              console.log('[Admin WHM] Found JSON-like content in HTML, attempting to parse...');
              const extractedJson = JSON.parse(jsonMatch[0]);
              console.log('[Admin WHM] Extracted JSON:', JSON.stringify(extractedJson, null, 2));
              
              // Check the extracted JSON for success indicators
              if (extractedJson.data && extractedJson.data.length > 0 && 
                  extractedJson.data[0].statusmsg === "Account Creation Ok") {
                console.log('[Admin WHM] SUCCESS: Found "Account Creation Ok" in extracted JSON');
                isSuccess = true;
                whmResult = { success: true, message: 'Account created successfully (JSON extracted from HTML)' };
              }
            } catch (extractError) {
              console.log('[Admin WHM] Failed to parse extracted JSON:', extractError);
            }
          }
          
          // If JSON extraction didn't work, check HTML for success indicators
          if (!isSuccess) {
            const successIndicators = [
              'Account Creation Complete',
              'Account Creation Ok',
              'wwwacct creation finished',
              'Account Creation Complete!!!',
              'creation finished',
              'statusmsg":"Account Creation Ok"',
              '"status": 1',
              '"status":1',
              'status": 1',
              'status":1'
            ];
            
            console.log('[Admin WHM] Checking HTML for success indicators...');
            
            let foundIndicator = null;
            const hasSuccessIndicator = successIndicators.some(indicator => {
              const found = responseText.includes(indicator);
              if (found) {
                foundIndicator = indicator;
                console.log(`[Admin WHM] FOUND SUCCESS INDICATOR: "${indicator}"`);
              }
              return found;
            });
            
            if (hasSuccessIndicator) {
              console.log(`[Admin WHM] SUCCESS: Found success indicator "${foundIndicator}" in HTML response`);
              isSuccess = true;
              whmResult = { success: true, message: `Account created successfully (HTML response - found: ${foundIndicator})` };
            } else if (responseText.includes('failed') || responseText.includes('error')) {
              console.log('[Admin WHM] FAILED: Found error indicator in HTML response');
              whmResult = { success: false, message: 'Account creation failed (HTML response)' };
            } else {
              console.log('[Admin WHM] UNKNOWN: Could not determine status from HTML response');
              console.log('[Admin WHM] No success or error indicators found');
              whmResult = { success: false, message: 'Unknown response format - no clear success/error indicators' };
            }
          }
        }

        if (!isSuccess) {
          const errorMessage = whmResult.metadata?.reason || whmResult.message || 'Unknown error';
          console.error('[Admin WHM] DETAILED ERROR REPORT:');
          console.error('[Admin WHM] - Error:', errorMessage);
          console.error('[Admin WHM] - WHM API URL:', whmUrl);
          console.error('[Admin WHM] - Username used:', username);
          console.error('[Admin WHM] - Domain:', fullDomain);
          console.error('[Admin WHM] - Package:', hostingPackage.whmPackageName);
          console.error('[Admin WHM] - Full response:', JSON.stringify(whmResult, null, 2));
          console.error('[Admin WHM] - Original subdomain:', subdomain);
          
          // Check for specific WHM error messages
          if (whmResult.result && whmResult.result[0] && whmResult.result[0].statusmsg) {
            const statusMsg = whmResult.result[0].statusmsg;
            console.error('[Admin WHM] - WHM Status Message:', statusMsg);
            
            if (statusMsg.includes('not a valid username')) {
              console.error('[Admin WHM] - USERNAME VALIDATION ERROR: WHM rejected the username');
              console.error('[Admin WHM] - Username requirements: 1-16 chars, start with letter, only letters/numbers/underscores');
              console.error('[Admin WHM] - Generated username:', username);
              console.error('[Admin WHM] - Username length:', username.length);
              console.error('[Admin WHM] - Starts with letter:', /^[a-zA-Z]/.test(username));
              console.error('[Admin WHM] - Contains only valid chars:', /^[a-zA-Z0-9_]+$/.test(username));
            }
          }
          
          throw new Error(`WHM account creation failed: ${errorMessage}`);
        }

        console.log('[Admin WHM] Account created successfully for:', fullDomain);

        // Update account status and store credentials
        const updatedAccount = await storage.updateHostingAccount(account.id, { 
          status: "active",
          cpanelUsername: username,  // Store the WHM-compliant username
          cpanelPassword: password   // Store password for auto-login (unencrypted as requested)
        });

        console.log('[Admin WHM] Stored credentials for account:', { 
          accountId: account.id, 
          username: username,
          passwordLength: password.length 
        });

        res.json({
          ...updatedAccount,
          status: "active",
          credentials: {
            username,
            password,
            domain: fullDomain
          }
        });
      } catch (whmError) {
        console.error('[Admin WHM] API Error:', whmError);
        
        // CRITICAL: Store credentials even if WHM creation fails 
        // This allows manual cPanel access and future auto-login functionality
        console.log('[Admin WHM] WHM creation failed, but storing credentials for manual access');
        
        const updatedAccount = await storage.updateHostingAccount(account.id, { 
          status: "failed",
          cpanelUsername: username,  // Store the generated username
          cpanelPassword: password   // Store password for manual/future auto-login
        });
        
        console.log('[Admin WHM] Stored credentials despite WHM failure:', { 
          accountId: account.id, 
          username: username,
          passwordLength: password.length,
          status: 'failed'
        });
        
        return res.status(500).json({ 
          message: "Failed to create hosting account on server", 
          details: whmError instanceof Error ? whmError.message : 'Unknown error',
          credentials: {
            username,
            password,
            domain: fullDomain,
            note: "Credentials stored for manual login"
          }
        });
      }
    } catch (error) {
      console.error("Error creating hosting account:", error);
      res.status(500).json({ message: "Failed to create hosting account" });
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

  // cPanel auto-login endpoint for hosting accounts
  app.post("/api/cpanel-login", isAuthenticated, async (req, res) => {
    try {
      const { domain } = req.body;
      console.log(`[cPanel Login] START - Request for domain: ${domain}`);
      
      if (!domain) {
        console.log(`[cPanel Login] ERROR - No domain provided`);
        return res.status(400).json({ message: "Domain is required" });
      }

      // Get API settings
      const apiSettings = await storage.getApiSettings();
      const envToken = process.env.WHM_API_TOKEN;
      const apiToken = envToken || apiSettings?.whmApiToken;
      
      console.log(`[cPanel Login] API Settings check:`, {
        hasDbSettings: !!apiSettings,
        hasUrl: !!apiSettings?.whmApiUrl,
        hasDbToken: !!apiSettings?.whmApiToken,
        hasEnvToken: !!envToken,
        usingToken: envToken ? 'environment' : 'database'
      });
      
      if (!apiSettings?.whmApiUrl || !apiToken) {
        console.log(`[cPanel Login] ERROR - Missing API configuration`);
        return res.status(400).json({ message: "WHM API settings not configured" });
      }

      // Get the hosting account details
      const hostingAccount = await storage.getHostingAccountByDomain(domain);
      console.log(`[cPanel Login] Hosting account lookup:`, {
        found: !!hostingAccount,
        id: hostingAccount?.id,
        userId: hostingAccount?.userId,
        cpanelUsername: hostingAccount?.cpanelUsername,
        subdomain: hostingAccount?.subdomain,
        hasPassword: !!hostingAccount?.cpanelPassword
      });
      
      if (!hostingAccount) {
        console.log(`[cPanel Login] ERROR - Hosting account not found for domain: ${domain}`);
        return res.status(404).json({ message: "Hosting account not found" });
      }

      // Verify the user owns this hosting account (or is admin)
      const user = req.user as any;
      console.log(`[cPanel Login] User authorization check:`, {
        hasUser: !!user,
        userId: user?.id,
        userRole: user?.role,
        accountUserId: hostingAccount.userId,
        isAdmin: user?.role === 'admin',
        isOwner: hostingAccount.userId === user?.id
      });
      
      if (!user) {
        console.log(`[cPanel Login] ERROR - User not authenticated`);
        return res.status(401).json({ message: "User not authenticated" });
      }

      if (user.role !== 'admin' && hostingAccount.userId !== user.id) {
        console.log(`[cPanel Login] ERROR - Access denied. User ${user.id} cannot access account ${hostingAccount.id}`);
        return res.status(403).json({ message: "Access denied to this hosting account" });
      }

      // Clean up the base URL
      let baseUrl = apiSettings.whmApiUrl.replace(/\/+$/, '');
      baseUrl = baseUrl.replace(/\/json-api.*$/, '');
      baseUrl = baseUrl.replace(/:2087.*$/, '');
      
      console.log(`[cPanel Login] Using base URL: ${baseUrl}`);

      // Generate proper cPanel username using the same logic as account creation
      let username = hostingAccount.subdomain.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      // If username starts with a number, prepend 'h' (for "host")
      if (/^[0-9]/.test(username)) {
        username = 'h' + username;
      }
      
      // If username is still empty or too long, try stored cpanelUsername as fallback
      if (!username || username.length > 16) {
        username = hostingAccount.cpanelUsername || hostingAccount.subdomain;
      }
      
      console.log(`[cPanel Login] Subdomain: ${hostingAccount.subdomain} -> Username: ${username}`);

      // Try multiple cPanel login methods
      console.log(`[cPanel Login] ATTEMPT 1 - WHM create_user_session API (JSON API 1) with form data`);
      
      try {
        // Method 1: Use WHM API 1 create_user_session for secure auto-login with form data
        const sessionUrl = `${baseUrl}:2087/json-api/create_user_session`;
        console.log(`[cPanel Login] Session URL: ${sessionUrl}`);
        
        const formData = new URLSearchParams({
          'api.version': '1',
          'user': username,
          'service': 'cpaneld'
        });
        
        const sessionResponse = await fetch(sessionUrl, {
          method: 'POST',
          headers: {
            'Authorization': `whm root:${apiToken}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData
        });

        if (!sessionResponse.ok) {
          throw new Error(`WHM create_user_session failed: ${sessionResponse.status} ${sessionResponse.statusText}`);
        }

        const sessionResult = await sessionResponse.json();
        console.log(`[cPanel Login] Session creation result:`, sessionResult);

        if (sessionResult.metadata?.result === 1 && sessionResult.data?.url) {
          // Success - return the auto-login URL
          res.json({ 
            loginUrl: sessionResult.data.url,
            domain: domain,
            username: username,
            message: "Auto-login session created successfully"
          });
          return;
        } else {
          console.log(`[cPanel Login] Session creation failed, trying fallback method`);
          throw new Error('Session creation unsuccessful');
        }
      } catch (sessionError) {
        console.error(`[cPanel Login] Session creation failed:`, sessionError);
        
        // Fallback: Try direct cPanel URL access
        console.log(`[cPanel Login] ATTEMPT 2 - Direct cPanel URL`);
        
        try {
          const directUrl = `${apiSettings.cpanelBaseUrl || baseUrl}:2083/login/?user=${username}`;
          
          const testResponse = await fetch(directUrl, {
            method: 'GET',
            redirect: 'manual' // Don't follow redirects to test availability
          });
          
          if (testResponse.status === 200 || testResponse.status === 302) {
            res.json({ 
              loginUrl: directUrl,
              domain: domain,
              username: username,
              message: "Opening cPanel - manual login required (auto-login failed)"
            });
            return;
          }
        } catch (directError) {
          console.error(`[cPanel Login] Direct access test failed:`, directError);
        }
        
        // Final fallback: Return basic cPanel URL
        const fallbackUrl = `${apiSettings.cpanelBaseUrl || baseUrl}:2083/`;
        res.json({ 
          loginUrl: fallbackUrl,
          domain: domain,
          username: username,
          message: "Opening cPanel - manual login required (auto-login failed)"
        });
      }
    } catch (error) {
      console.error("[cPanel Login] Error generating cPanel login:", error);
      res.status(500).json({ error: "Failed to generate cPanel login" });
    }
  });

  // Admin cPanel login with WHM integration  
  app.post("/api/admin/cpanel-login", isAuthenticated, async (req, res) => {
    try {
      const { domain } = req.body;
      
      if (!domain) {
        return res.status(400).json({ error: "Domain is required" });
      }

      const apiSettings = await storage.getApiSettings();
      if (!apiSettings || !apiSettings.whmApiUrl || !apiSettings.whmApiToken) {
        return res.status(500).json({ error: "WHM API settings not configured" });
      }

      // Find the hosting account by domain
      const hostingAccount = await storage.getHostingAccountByDomain(domain);
      if (!hostingAccount) {
        return res.status(404).json({ error: "Hosting account not found" });
      }

      const apiToken = process.env.WHM_API_TOKEN || apiSettings.whmApiToken;
      
      // Clean base URL
      let baseUrl = apiSettings.whmApiUrl.replace(/\/+$/, '');
      baseUrl = baseUrl.replace(/\/json-api.*$/, '');
      baseUrl = baseUrl.replace(/:2087.*$/, '');
      
      console.log(`[Admin cPanel Login] Using base URL: ${baseUrl}`);

      // Generate proper cPanel username
      let username = hostingAccount.subdomain.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      if (/^[0-9]/.test(username)) {
        username = 'h' + username;
      }
      
      if (!username || username.length > 16) {
        username = hostingAccount.cpanelUsername || hostingAccount.subdomain;
      }

      try {
        
        console.log(`[Admin cPanel Login] Using username: ${username}`);
        
        // Use WHM API to create user session
        const sessionUrl = `${baseUrl}:2087/json-api/create_user_session`;
        
        const formData = new URLSearchParams({
          'api.version': '1',
          'user': username,
          'service': 'cpaneld'
        });

        const response = await fetch(sessionUrl, {
          method: 'POST',
          headers: {
            'Authorization': `whm root:${apiToken}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData
        });

        console.log(`[cPanel Login] Session response status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          const sessionResult = await response.json();
          console.log(`[cPanel Login] Session API response:`, JSON.stringify(sessionResult, null, 2));

          // Check multiple success formats
          if (sessionResult.metadata?.result === 1 && sessionResult.data?.url) {
            console.log(`[cPanel Login] SUCCESS - Session URL method worked`);
            return res.json({ 
              loginUrl: sessionResult.data.url,
              message: "cPanel auto-login URL generated successfully (session method)"
            });
          } else if (sessionResult.data?.url) {
            console.log(`[cPanel Login] SUCCESS - Session URL found without metadata check`);
            return res.json({ 
              loginUrl: sessionResult.data.url,
              message: "cPanel auto-login URL generated successfully (session method - alt format)"
            });
          } else {
            console.log(`[cPanel Login] Session method failed - no URL in response`);
          }
        } else {
          const errorText = await response.text();
          console.log(`[cPanel Login] Session API error response: ${errorText}`);
        }
      } catch (sessionError) {
        console.log(`[cPanel Login] Session method failed with error:`, sessionError);
      }

        // Fallback: Direct cPanel URL
        console.log(`[Admin cPanel Login] Session creation failed, using direct cPanel URL`);
        const fallbackUrl = `${apiSettings.cpanelBaseUrl || baseUrl}:2083/`;
        res.json({ 
          loginUrl: fallbackUrl,
          domain: domain,
          username: username,
          message: "Opening cPanel - manual login required (auto-login failed)"
        });

    } catch (error) {
      console.error(`[cPanel Login] FATAL ERROR:`, error);
      console.error(`[cPanel Login] Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
      
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to generate cPanel login URL",
        debug: error instanceof Error ? error.message : String(error)
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
      
      // Get package details before deletion
      const packageToDelete = await storage.getHostingPackageById(packageId);
      if (!packageToDelete) {
        return res.status(404).json({ message: "Package not found" });
      }
      
      console.log(`[Package Delete] Attempting to delete package: ${packageToDelete.name} (WHM: ${packageToDelete.whmPackageName})`);
      
      // First, try to delete the package from WHM server
      let whmDeletionSuccess = false;
      try {
        const apiSettings = await storage.getApiSettings();
        const envToken = process.env.WHM_API_TOKEN;
        const apiToken = envToken || apiSettings?.whmApiToken;
        
        if (apiSettings?.whmApiUrl && apiToken && packageToDelete.whmPackageName) {
          const baseUrl = apiSettings.whmApiUrl.replace(/\/+$/, '').replace(/\/json-api.*$/, '').replace(/:2087.*$/, '');
          
          // Use WHM API deletepackage function
          const deleteParams = new URLSearchParams({
            'api.version': '1',
            'name': packageToDelete.whmPackageName
          });
          
          const whmDeleteUrl = `${baseUrl}:2087/json-api/deletepackage?${deleteParams.toString()}`;
          
          console.log(`[Package Delete] WHM deletepackage URL: ${whmDeleteUrl}`);
          
          const whmResponse = await fetch(whmDeleteUrl, {
            method: 'GET',
            headers: {
              'Authorization': `whm root:${apiToken}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (whmResponse.ok) {
            const whmResult = await whmResponse.json();
            console.log(`[Package Delete] WHM response:`, JSON.stringify(whmResult, null, 2));
            
            // Check for success using multiple possible response formats
            if (whmResult.metadata?.result === 1 ||
                whmResult.status === 1 ||
                (whmResult.result && Array.isArray(whmResult.result) && whmResult.result.some((item: any) => item.status === 1))) {
              whmDeletionSuccess = true;
              console.log(`[Package Delete] Successfully deleted package from WHM: ${packageToDelete.whmPackageName}`);
            } else {
              console.warn(`[Package Delete] WHM deletion may have failed: ${whmResult.metadata?.reason || 'Unknown error'}`);
            }
          } else {
            console.warn(`[Package Delete] WHM API returned ${whmResponse.status}: ${whmResponse.statusText}`);
          }
        } else {
          console.warn(`[Package Delete] Skipping WHM deletion - missing API settings or package name`);
        }
      } catch (whmError) {
        console.error(`[Package Delete] WHM deletion error:`, whmError);
        // Continue with local deletion even if WHM deletion fails
      }
      
      // Delete from local database
      await storage.deleteHostingPackage(packageId);
      console.log(`[Package Delete] Successfully deleted package from local database: ${packageToDelete.name}`);
      
      res.json({ 
        message: "Package deleted successfully",
        whmDeleted: whmDeletionSuccess,
        localDeleted: true
      });
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

      // Check WHM server for existing accounts
      const apiSettings = await storage.getApiSettings();
      if (apiSettings && apiSettings.whmApiUrl && apiSettings.whmApiToken) {
        try {
          console.log(`[Subdomain Check] Checking WHM server for existing account: ${subdomain.toLowerCase()}`);
          
          const whmUrl = `${apiSettings.whmApiUrl}/json-api/listaccts?api.version=1&searchusers=${subdomain.toLowerCase()}`;
          const whmResponse = await fetch(whmUrl, {
            method: 'GET',
            headers: {
              'Authorization': `whm root:${apiSettings.whmApiToken}`,
              'Content-Type': 'application/json'
            }
          });

          if (whmResponse.ok) {
            const whmData = await whmResponse.json();
            console.log(`[Subdomain Check] WHM response:`, JSON.stringify(whmData, null, 2));
            
            // Check if any accounts exist with this username
            if (whmData.data?.acct && Array.isArray(whmData.data.acct) && whmData.data.acct.length > 0) {
              // Found existing account on WHM server
              const existingAccount = whmData.data.acct.find((acc: any) => 
                acc.user && acc.user.toLowerCase() === subdomain.toLowerCase()
              );
              
              if (existingAccount) {
                console.log(`[Subdomain Check] Account ${subdomain.toLowerCase()} already exists on WHM server`);
                return res.json({ 
                  available: false, 
                  message: "This subdomain is already taken on the server" 
                });
              }
            }
            
            console.log(`[Subdomain Check] Account ${subdomain.toLowerCase()} not found on WHM server - available`);
          } else {
            console.warn(`[Subdomain Check] WHM API call failed with status: ${whmResponse.status}`);
            // Continue with local check only if WHM fails
          }
        } catch (whmError) {
          console.error('[Subdomain Check] Error checking WHM server:', whmError);
          // Continue with local check only if WHM fails
        }
      } else {
        console.warn('[Subdomain Check] WHM API not configured, using local database only');
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
        diskLimit: selectedPackage.diskSpaceQuota, // Keep in MB as per schema
        bandwidthLimit: selectedPackage.bandwidthQuota, // Keep in MB as per schema
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
          
          // Generate WHM-compliant username (must start with letter, 1-16 chars, only letters/numbers/underscores)
          let username = subdomain.toLowerCase().replace(/[^a-z0-9]/g, '');
          
          // If username starts with a number, prepend 'h' (for "host")
          if (/^[0-9]/.test(username)) {
            username = 'h' + username;
          }
          
          // If username is still empty or too long, generate a safe alternative
          if (!username || username.length > 16) {
            // Generate a random username starting with 'h' followed by random letters/numbers
            const randomSuffix = Math.random().toString(36).substring(2, 8);
            username = 'h' + randomSuffix;
          }
          
          console.log(`[Account Creation] Original subdomain: ${subdomain.toLowerCase()}`);
          console.log(`[Account Creation] Generated WHM-compliant username: ${username}`);
          
          // Build WHM createacct API URL with parameters
          const createAccountParams = new URLSearchParams({
            'api.version': '1',
            'username': username,
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
          
          // Use POST with form data for WHM API to avoid URL length limits
          const whmCreateUrl = `${baseUrl}:2087/json-api/createacct`;
          
          console.log(`[Account Creation] WHM createacct URL: ${whmCreateUrl}`);
          console.log(`[Account Creation] Form data (password hidden):`, Object.fromEntries(
            Array.from(createAccountParams.entries()).map(([key, value]) => [
              key, 
              key === 'password' ? '***' : value
            ])
          ));
          
          const whmResponse = await fetch(whmCreateUrl, {
            method: 'POST',
            headers: {
              'Authorization': `whm root:${apiToken}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: createAccountParams
          });

          if (!whmResponse.ok) {
            throw new Error(`WHM API returned ${whmResponse.status}: ${whmResponse.statusText}`);
          }

          const whmResult = await whmResponse.json();
          console.log('[Account Creation] WHM account creation result:', JSON.stringify(whmResult, null, 2));
          
          // Check for success using multiple possible response formats
          let isSuccess = false;
          if (whmResult.metadata?.result === 1 || 
              whmResult.cpanelresult?.event?.result === 1 ||
              (whmResult.data && whmResult.data.length > 0 && whmResult.data[0].statusmsg === "Account Creation Ok") ||
              (Array.isArray(whmResult) && whmResult.some((item: any) => item.statusmsg === "Account Creation Ok")) ||
              (whmResult.result && Array.isArray(whmResult.result) && whmResult.result.some((item: any) => 
                item.status === 1 || item.statusmsg === "Account Creation Ok" || 
                (typeof item.statusmsg === 'string' && item.statusmsg.includes("Account Creation Ok")))) ||
              (whmResult.status === 1) ||
              (Array.isArray(whmResult.result) && whmResult.result.length > 0 && whmResult.result[0].status === 1)) {
            isSuccess = true;
          }

          if (isSuccess) {
            // WHM account created successfully
            console.log(`[Account Creation] Successfully created WHM account for ${subdomain.toLowerCase()}`);
            
            // Update the hosting account status to active
            await storage.updateHostingAccount(hostingAccount.id, { 
              status: 'active',
              cpanelUsername: username, // Use the WHM-compliant username, not the original subdomain
              cpanelPassword: randomPassword // Store for cPanel access
            });
            
            console.log(`[Account Creation] Updated local account status to active`);
            
          } else {
            const errorMessage = whmResult.metadata?.reason || whmResult.message || 'Unknown error';
            console.error('[Account Creation] DETAILED ERROR REPORT:');
            console.error('[Account Creation] - Error:', errorMessage);
            console.error('[Account Creation] - WHM Response:', JSON.stringify(whmResult, null, 2));
            console.error('[Account Creation] - Username used:', username);
            console.error('[Account Creation] - Domain:', fullDomain);
            console.error('[Account Creation] - Package:', selectedPackage.whmPackageName);
            throw new Error(`WHM account creation failed: ${errorMessage}`);
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
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2024-06-20",
      });

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

  // Create payment intent for one-time donations (plugin donations)
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const { amount, pluginId, pluginName } = req.body;
      
      console.log('=== PAYMENT INTENT CREATE START ===');
      console.log('Request body:', { amount, pluginId, pluginName });
      
      if (!amount) {
        console.error('Missing required amount');
        return res.status(400).json({ message: "Missing required payment amount" });
      }

      // Initialize Stripe
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2024-06-20",
      });
      if (!stripe) {
        console.error('Stripe not initialized - missing STRIPE_SECRET_KEY');
        return res.status(500).json({ message: "Payment system not configured" });
      }

      // Create payment intent for one-time payment
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount * 100, // Convert to cents
        currency: 'usd',
        metadata: {
          pluginId: pluginId?.toString() || '',
          pluginName: pluginName || '',
          donationType: 'one-time-plugin',
          userId: req.user?.id?.toString() || 'anonymous'
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      console.log('Payment intent created:', paymentIntent.id);

      // Store donation record as pending
      await storage.createDonation({
        userId: req.user?.id || null,
        amount: amount * 100, // Store in cents
        currency: 'USD',
        status: 'pending',
        paymentMethod: 'stripe',
        stripePaymentIntentId: paymentIntent.id,
        isRecurring: false,
        pluginId: pluginId || null,
        pluginName: pluginName || null,
      });

      console.log('=== PAYMENT INTENT CREATE SUCCESS ===');
      res.json({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } catch (error) {
      console.error('Payment intent creation error:', error);
      res.status(500).json({ 
        message: "Failed to create payment intent",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Stripe subscription routes for monthly donations with gifts
  app.post("/api/create-subscription", async (req, res) => {
    try {
      const { amount, giftTier, giftType, giftDetails } = req.body;
      
      console.log('=== SUBSCRIPTION CREATE START ===');
      console.log('Request body:', { amount, giftTier, giftType, giftDetails });
      
      if (!amount || !giftTier || !giftType) {
        console.error('Missing required data:', { amount, giftTier, giftType });
        return res.status(400).json({ message: "Missing required subscription data" });
      }

      // Create or get Stripe customer
      let customer;
      const userId = req.user?.id;
      console.log('User ID:', userId);
      
      if (userId) {
        // Get existing user
        const user = await storage.getUser(userId);
        console.log('User data:', user);
        
        if (user?.email) {
          console.log('Creating Stripe customer for authenticated user');
          customer = await stripe.customers.create({
            email: user.email,
            metadata: {
              userId: userId.toString(),
              giftTier,
              giftType
            }
          });
          console.log('Created customer:', customer.id);
        }
      }
      
      if (!customer) {
        // Anonymous donation - create customer without email
        console.log('Creating anonymous Stripe customer');
        customer = await stripe.customers.create({
          metadata: {
            giftTier,
            giftType,
            anonymous: 'true'
          }
        });
        console.log('Created anonymous customer:', customer.id);
      }

      // First create a product and price for the subscription
      const product = await stripe.products.create({
        name: `HostFarm.org Monthly Donation - ${giftTier}`,
        description: `Monthly donation with ${giftType} gift`,
      });

      const price = await stripe.prices.create({
        unit_amount: amount, // amount is already in cents
        currency: 'usd',
        recurring: {
          interval: 'month',
        },
        product: product.id,
      });

      // Create subscription with the created price
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{
          price: price.id,
        }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          giftTier,
          giftType,
          giftDetails: giftDetails || '',
          userId: userId?.toString() || 'anonymous'
        }
      });

      // Store donation record
      await storage.createDonation({
        userId: userId || null,
        amount: amount,
        currency: 'USD',
        status: 'pending',
        paymentMethod: 'stripe',
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: customer.id,
        isRecurring: true,
        subscriptionStatus: 'incomplete',
        giftTier,
        giftType,
        giftDetails: giftDetails || null
      });

      const clientSecret = (subscription.latest_invoice as any)?.payment_intent?.client_secret;
      console.log('Client secret extracted:', clientSecret ? 'SUCCESS' : 'FAILED');
      
      if (!clientSecret) {
        console.error('No client secret found in subscription response');
        console.log('Latest invoice:', JSON.stringify(subscription.latest_invoice, null, 2));
      }
      
      const responseData = {
        subscriptionId: subscription.id,
        clientSecret: clientSecret,
        customerId: customer.id
      };
      console.log('Sending response:', responseData);
      console.log('=== SUBSCRIPTION CREATE END ===');
      
      res.json(responseData);
    } catch (error: any) {
      console.error("=== SUBSCRIPTION CREATE ERROR ===");
      console.error("Error details:", error);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      console.error("=== END ERROR ===");
      res.status(500).json({ message: "Error creating subscription: " + error.message });
    }
  });

  // Handle Stripe webhooks for subscription updates
  app.post("/api/stripe-webhook", express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    
    if (!sig) {
      return res.status(400).send('Missing stripe signature');
    }

    try {
      // Skip webhook verification for now during development
      const body = JSON.parse(req.body.toString());
      const event = body;

      console.log('Stripe webhook event:', event.type);

      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object;
          console.log('One-time payment succeeded:', paymentIntent.id);
          
          // Update donation status for one-time payments
          try {
            const [donation] = await db.update(donations)
              .set({ status: 'completed' })
              .where(eq(donations.stripePaymentIntentId, paymentIntent.id))
              .returning();
            
            if (donation) {
              console.log('Updated donation status to completed:', donation.id);
            } else {
              console.warn('No donation found for payment intent:', paymentIntent.id);
            }
          } catch (error) {
            console.error('Failed to update donation status:', error);
          }
          break;

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          const subscription = event.data.object;
          console.log('Subscription updated:', subscription.id, subscription.status);
          
          // Update subscription status in database
          try {
            await db.update(donations)
              .set({ 
                subscriptionStatus: subscription.status,
                status: subscription.status === 'active' ? 'completed' : 'pending'
              })
              .where(eq(donations.stripeSubscriptionId, subscription.id));
            console.log('Updated subscription status:', subscription.status);
          } catch (error) {
            console.error('Failed to update subscription status:', error);
          }
          break;
        
        case 'invoice.payment_succeeded':
          const invoice = event.data.object;
          if (invoice.subscription) {
            console.log('Payment succeeded for subscription:', invoice.subscription);
            
            // Update subscription donation to completed
            try {
              await db.update(donations)
                .set({ status: 'completed' })
                .where(eq(donations.stripeSubscriptionId, invoice.subscription));
              console.log('Updated subscription donation to completed');
            } catch (error) {
              console.error('Failed to update subscription donation:', error);
            }
          }
          break;
        
        case 'customer.subscription.deleted':
          const deletedSubscription = event.data.object;
          console.log('Subscription canceled:', deletedSubscription.id);
          
          // Update subscription status to canceled
          try {
            await db.update(donations)
              .set({ 
                subscriptionStatus: 'canceled',
                status: 'failed'
              })
              .where(eq(donations.stripeSubscriptionId, deletedSubscription.id));
            console.log('Updated canceled subscription in database');
          } catch (error) {
            console.error('Failed to update canceled subscription:', error);
          }
          break;
      }

      res.json({received: true});
    } catch (error: any) {
      console.error('Webhook error:', error);
      res.status(400).send(`Webhook Error: ${error.message}`);
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

  // User Groups Management API
  app.get("/api/admin/user-groups", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const userGroups = await storage.getUserGroups();
      res.json(userGroups);
    } catch (error) {
      console.error("Error fetching user groups:", error);
      res.status(500).json({ message: "Failed to fetch user groups" });
    }
  });

  app.post("/api/admin/user-groups", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const { name, displayName, description, maxHostingAccounts, maxDevices } = req.body;
      const userGroup = await storage.createUserGroup({
        name,
        displayName,
        description,
        maxHostingAccounts,
        maxDevices,
      });
      res.json(userGroup);
    } catch (error) {
      console.error("Error creating user group:", error);
      res.status(500).json({ message: "Failed to create user group" });
    }
  });

  app.put("/api/admin/user-groups/:id", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const groupId = parseInt(req.params.id);
      const { name, displayName, description, maxHostingAccounts, maxDevices, isActive } = req.body;
      
      const userGroup = await storage.updateUserGroup(groupId, {
        name,
        displayName,
        description,
        maxHostingAccounts,
        maxDevices,
        isActive,
      });
      
      if (!userGroup) {
        return res.status(404).json({ message: "User group not found" });
      }
      
      res.json(userGroup);
    } catch (error) {
      console.error("Error updating user group:", error);
      res.status(500).json({ message: "Failed to update user group" });
    }
  });

  app.delete("/api/admin/user-groups/:id", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const groupId = parseInt(req.params.id);
      const success = await storage.deleteUserGroup(groupId);
      
      if (!success) {
        return res.status(404).json({ message: "User group not found" });
      }
      
      res.json({ message: "User group deleted successfully" });
    } catch (error) {
      console.error("Error deleting user group:", error);
      res.status(500).json({ message: "Failed to delete user group" });
    }
  });

  // Assign user to group
  app.post("/api/admin/users/:userId/assign-group", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { userGroupId } = req.body;
      
      const user = await storage.updateUser(userId, { userGroupId });
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error assigning user to group:", error);
      res.status(500).json({ message: "Failed to assign user to group" });
    }
  });

  // Device Fingerprint API
  app.post("/api/device-fingerprint", isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const { 
        fingerprintHash, 
        macAddress, 
        userAgent, 
        screenResolution, 
        timezone, 
        language, 
        platformInfo,
        ipAddress 
      } = req.body;

      // Check if fingerprint already exists for this user
      const existingFingerprint = await storage.getDeviceFingerprintByHash(fingerprintHash);
      
      if (existingFingerprint) {
        // Update last seen timestamp
        await storage.updateDeviceFingerprint(existingFingerprint.id, {});
        return res.json(existingFingerprint);
      }

      // Create new fingerprint with all available data
      const fingerprint = await storage.createDeviceFingerprint({
        userId,
        fingerprintHash,
        macAddress,
        userAgent,
        screenResolution,
        timezone,
        language,
        platformInfo,
        ipAddress,
        canvasFingerprint: req.body.canvasFingerprint,
        webglFingerprint: req.body.webglFingerprint,
        audioFingerprint: req.body.audioFingerprint,
        deviceMemory: req.body.deviceMemory,
        hardwareConcurrency: req.body.hardwareConcurrency,
        connectionType: req.body.connectionType,
      });

      res.json(fingerprint);
    } catch (error) {
      console.error("Error recording device fingerprint:", error);
      res.status(500).json({ message: "Failed to record device fingerprint" });
    }
  });

  // Get user's group limits
  app.get("/api/user/group-limits", isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const limits = await storage.getUserGroupLimits(userId);
      res.json(limits);
    } catch (error) {
      console.error("Error fetching user group limits:", error);
      res.status(500).json({ message: "Failed to fetch user group limits" });
    }
  });

  // Check if user can create new hosting account
  app.get("/api/user/can-create-hosting-account", isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const limits = await storage.getUserGroupLimits(userId);
      const canCreate = limits.currentHostingAccounts < limits.maxHostingAccounts;
      
      res.json({ 
        canCreate, 
        currentAccounts: limits.currentHostingAccounts, 
        maxAccounts: limits.maxHostingAccounts 
      });
    } catch (error) {
      console.error("Error checking hosting account limits:", error);
      res.status(500).json({ message: "Failed to check hosting account limits" });
    }
  });

  // Check if user can register new account based on device fingerprint
  app.post("/api/check-device-limits", async (req, res) => {
    try {
      console.log('[Device Limits API] Received request with body:', JSON.stringify(req.body));
      const { fingerprintHash } = req.body;
      
      if (!fingerprintHash) {
        console.error('[Device Limits API] No fingerprint hash provided');
        return res.status(400).json({ 
          message: "Fingerprint hash is required",
          canRegister: false,
          currentDevices: 0,
          maxDevices: 2
        });
      }
      
      console.log('[Device Limits API] Checking device count for fingerprint:', fingerprintHash.substring(0, 10) + '...');
      const deviceCount = await storage.getDeviceCountByFingerprint(fingerprintHash);
      console.log('[Device Limits API] Device count:', deviceCount);
      
      // Get default limits for Free group
      const freeGroup = await storage.getUserGroupByName("Free");
      const maxDevices = freeGroup?.maxDevices || 2;
      console.log('[Device Limits API] Max devices allowed:', maxDevices);
      
      const canRegister = deviceCount < maxDevices;
      
      const result = { 
        canRegister, 
        currentDevices: deviceCount, 
        maxDevices 
      };
      
      console.log('[Device Limits API] Returning result:', result);
      res.json(result);
    } catch (error) {
      console.error("[Device Limits API] Error checking device limits:", error);
      res.status(500).json({ 
        message: "Failed to check device limits",
        canRegister: true, // Fail open for better UX
        currentDevices: 0,
        maxDevices: 2
      });
    }
  });

  // Plugin Request endpoints
  app.post("/api/plugin-requests", isAuthenticated, async (req: any, res) => {
    try {
      const { firstName, lastName, email, pluginName } = req.body;
      const userId = req.user.id;

      // Check daily request limit (2 requests per day)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const requestsToday = await storage.getUserPluginRequestsToday(userId);
      if (requestsToday >= 2) {
        return res.status(429).json({ 
          message: "You can only submit 2 plugin requests per day. Please try again tomorrow." 
        });
      }

      // Create plugin request
      const request = await storage.createPluginRequest({
        userId,
        firstName,
        lastName,
        email,
        pluginName,
        status: "pending"
      });

      // Send email to admin (if SMTP is configured)
      try {
        const smtpSettings = await storage.getSmtpSettings();
        if (smtpSettings) {
          const nodemailer = require('nodemailer');
          
          const transporter = nodemailer.createTransporter({
            host: smtpSettings.host,
            port: smtpSettings.port,
            secure: smtpSettings.encryption === 'ssl',
            auth: {
              user: smtpSettings.username,
              pass: smtpSettings.password,
            },
          });

          // Send notification email to admin
          const adminMailOptions = {
            from: `"${smtpSettings.fromName}" <${smtpSettings.fromEmail}>`,
            to: 'ceo@openweb.email',
            subject: 'New Plugin Request - HostFarm.org',
            html: `
              <h2>New Plugin Request</h2>
              <p><strong>Name:</strong> ${firstName} ${lastName}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Plugin Requested:</strong> ${pluginName}</p>
              <p><strong>User ID:</strong> ${userId}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
              <p>You can manage this request in the admin dashboard.</p>
            `
          };

          // Send auto-reply email to user
          const userAutoReplyOptions = {
            from: `"HostFarm.org Support" <${smtpSettings.fromEmail}>`,
            to: email,
            subject: 'Plugin Request Received - HostFarm.org',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Plugin Request Received</h2>
                
                <p>Dear ${firstName},</p>
                
                <p>Thank you for your plugin request! We've successfully received your request for <strong>${pluginName}</strong>.</p>
                
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #374151;">Request Details:</h3>
                  <p><strong>Plugin Name:</strong> ${pluginName}</p>
                  <p><strong>Submitted by:</strong> ${firstName} ${lastName}</p>
                  <p><strong>Email:</strong> ${email}</p>
                  <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
                </div>
                
                <p><strong>What happens next?</strong></p>
                <ul>
                  <li>Our team will review your plugin request within the next 24 hours</li>
                  <li>If approved, the plugin will be loaded into our library within <strong>48 to 72 hours</strong></li>
                  <li>You'll receive a notification once the plugin is available for download</li>
                </ul>
                
                <p>You can submit up to 2 plugin requests per day. If you have any questions or need immediate assistance, please don't hesitate to contact us.</p>
                
                <p>Best regards,<br>
                The HostFarm.org Team</p>
                
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
                <p style="font-size: 12px; color: #6b7280;">
                  This is an automated message. Please do not reply to this email.
                </p>
              </div>
            `
          };

          // Send both emails
          await Promise.all([
            transporter.sendMail(adminMailOptions),
            transporter.sendMail(userAutoReplyOptions)
          ]);
        }
      } catch (emailError) {
        console.error('Error sending plugin request email:', emailError);
        // Don't fail the request if email fails
      }

      res.json(request);
    } catch (error) {
      console.error('Error creating plugin request:', error);
      res.status(500).json({ error: "Failed to create plugin request" });
    }
  });

  app.get("/api/plugin-requests", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const requests = await storage.getPluginRequestsByUserId(userId);
      res.json(requests);
    } catch (error) {
      console.error('Error fetching plugin requests:', error);
      res.status(500).json({ error: "Failed to fetch plugin requests" });
    }
  });

  // Admin plugin request endpoints
  app.get("/api/admin/plugin-requests", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const requests = await storage.getPluginRequests();
      res.json(requests);
    } catch (error) {
      console.error('Error fetching all plugin requests:', error);
      res.status(500).json({ error: "Failed to fetch plugin requests" });
    }
  });

  app.patch("/api/admin/plugin-requests/:id", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      const updated = await storage.updatePluginRequestStatus(id, status);
      if (!updated) {
        return res.status(404).json({ error: "Plugin request not found" });
      }
      
      res.json(updated);
    } catch (error) {
      console.error('Error updating plugin request:', error);
      res.status(500).json({ error: "Failed to update plugin request" });
    }
  });

  app.delete("/api/admin/plugin-requests/:id", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deletePluginRequest(id);
      
      if (!success) {
        return res.status(404).json({ error: "Plugin request not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting plugin request:', error);
      res.status(500).json({ error: "Failed to delete plugin request" });
    }
  });

  // SMTP Settings endpoints (admin only)
  app.get("/api/smtp-settings", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const settings = await storage.getSmtpSettings();
      res.json(settings);
    } catch (error) {
      console.error('Error fetching SMTP settings:', error);
      res.status(500).json({ error: "Failed to fetch SMTP settings" });
    }
  });

  app.post("/api/smtp-settings", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const settings = await storage.upsertSmtpSettings(req.body);
      res.json(settings);
    } catch (error) {
      console.error('Error saving SMTP settings:', error);
      res.status(500).json({ error: "Failed to save SMTP settings" });
    }
  });

  app.delete("/api/smtp-settings", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const success = await storage.deleteSmtpSettings();
      res.json({ success });
    } catch (error) {
      console.error('Error deleting SMTP settings:', error);
      res.status(500).json({ error: "Failed to delete SMTP settings" });
    }
  });

  // Test SMTP connection endpoint (without sending email)
  app.post("/api/smtp-settings/test-connection", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const { host, port, username, password, encryption } = req.body;
      
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: encryption === 'ssl', // true for SSL on port 465, false for other ports
        auth: {
          user: username,
          pass: password,
        },
        ...(encryption === 'tls' && {
          requireTLS: true,
          tls: {
            ciphers: 'SSLv3'
          }
        })
      });

      // Verify connection without sending email
      await transporter.verify();
      res.json({ success: true, message: "SMTP connection verified successfully" });
    } catch (error) {
      console.error('Error testing SMTP connection:', error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to connect to SMTP server", 
        details: error.message 
      });
    }
  });

  // Test SMTP settings endpoint
  app.post("/api/smtp-settings/test", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const { host, port, username, password, encryption, fromEmail, fromName, testEmail } = req.body;
      
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: encryption === 'ssl', // true for SSL on port 465, false for other ports
        auth: {
          user: username,
          pass: password,
        },
        ...(encryption === 'tls' && {
          requireTLS: true,
          tls: {
            ciphers: 'SSLv3'
          }
        })
      });

      const mailOptions = {
        from: `"${fromName}" <${fromEmail}>`,
        to: testEmail,
        subject: 'SMTP Test - HostFarm.org',
        html: `
          <h2>SMTP Configuration Test</h2>
          <p>This is a test email to verify your SMTP settings are working correctly.</p>
          <p><strong>Host:</strong> ${host}</p>
          <p><strong>Port:</strong> ${port}</p>
          <p><strong>Encryption:</strong> ${encryption}</p>
          <p><strong>Test Time:</strong> ${new Date().toLocaleString()}</p>
          <p>If you received this email, your SMTP configuration is working properly!</p>
        `
      };

      await transporter.sendMail(mailOptions);
      res.json({ success: true, message: "Test email sent successfully" });
    } catch (error) {
      console.error('Error testing SMTP settings:', error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to send test email", 
        details: error.message 
      });
    }
  });

  // Custom Header Code endpoints (admin only)
  app.get("/api/custom-header-codes", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const codes = await storage.getCustomHeaderCodes();
      res.json(codes);
    } catch (error) {
      console.error("Error fetching custom header codes:", error);
      res.status(500).json({ error: "Failed to fetch custom header codes" });
    }
  });

  // Public endpoint for active header codes (must come before /:id route)
  app.get("/api/custom-header-codes/active", async (req, res) => {
    try {
      const allCodes = await storage.getCustomHeaderCodes();
      const activeCodes = allCodes.filter(code => code.isActive);
      res.json(activeCodes);
    } catch (error) {
      console.error("Error fetching active custom header codes:", error);
      res.status(500).json({ error: "Failed to fetch active custom header codes" });
    }
  });

  app.get("/api/custom-header-codes/:id", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID parameter" });
      }
      const code = await storage.getCustomHeaderCodeById(id);
      if (!code) {
        return res.status(404).json({ error: "Custom header code not found" });
      }
      res.json(code);
    } catch (error) {
      console.error("Error fetching custom header code:", error);
      res.status(500).json({ error: "Failed to fetch custom header code" });
    }
  });

  app.post("/api/custom-header-codes", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const code = await storage.createCustomHeaderCode(req.body);
      res.json(code);
    } catch (error) {
      console.error("Error creating custom header code:", error);
      res.status(500).json({ error: "Failed to create custom header code" });
    }
  });

  app.put("/api/custom-header-codes/:id", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID parameter" });
      }
      const code = await storage.updateCustomHeaderCode(id, req.body);
      if (!code) {
        return res.status(404).json({ error: "Custom header code not found" });
      }
      res.json(code);
    } catch (error) {
      console.error("Error updating custom header code:", error);
      res.status(500).json({ error: "Failed to update custom header code" });
    }
  });

  app.delete("/api/custom-header-codes/:id", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID parameter" });
      }
      const success = await storage.deleteCustomHeaderCode(id);
      if (!success) {
        return res.status(404).json({ error: "Custom header code not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting custom header code:", error);
      res.status(500).json({ error: "Failed to delete custom header code" });
    }
  });

  // SEO Routes - Sitemap and SEO optimization
  app.get("/sitemap.xml", async (req, res) => {
    try {
      // Get all public plugins for sitemap
      const plugins = await storage.getPublicPlugins();
      
      const urls = [
        {
          url: 'https://hostfarm.org',
          lastmod: new Date().toISOString(),
          changefreq: 'daily',
          priority: '1.0'
        },
        {
          url: 'https://hostfarm.org/plugins',
          lastmod: new Date().toISOString(),
          changefreq: 'daily',
          priority: '0.9'
        },
        {
          url: 'https://hostfarm.org/plugin-library',
          lastmod: new Date().toISOString(),
          changefreq: 'daily',
          priority: '0.9'
        }
      ];

      // Add plugin pages to sitemap
      plugins.forEach(plugin => {
        if (plugin.slug) {
          urls.push({
            url: `https://hostfarm.org/plugin/${plugin.slug}`,
            lastmod: plugin.updatedAt || new Date().toISOString(),
            changefreq: 'weekly',
            priority: '0.8'
          });
        }
      });

      // Generate XML sitemap
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.url}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

      res.set('Content-Type', 'application/xml');
      res.send(sitemap);
    } catch (error) {
      console.error("Error generating sitemap:", error);
      res.status(500).send("Error generating sitemap");
    }
  });

  // VPS Package endpoints
  app.get("/api/vps-packages", async (req, res) => {
    try {
      const packages = await storage.getVpsPackages();
      res.json(packages);
    } catch (error) {
      console.error("Error fetching VPS packages:", error);
      res.status(500).json({ message: "Error fetching VPS packages" });
    }
  });

  app.get("/api/vps-packages/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const vpsPackage = await storage.getVpsPackageById(id);
      
      if (!vpsPackage) {
        return res.status(404).json({ message: "VPS package not found" });
      }
      
      res.json(vpsPackage);
    } catch (error) {
      console.error("Error fetching VPS package:", error);
      res.status(500).json({ message: "Error fetching VPS package" });
    }
  });

  // VPS Instance endpoints
  app.get("/api/vps-instances", isAuthenticated, async (req: any, res) => {
    try {
      const instances = await storage.getVpsInstancesByUserId(req.user.id);
      res.json(instances);
    } catch (error) {
      console.error("Error fetching VPS instances:", error);
      res.status(500).json({ message: "Error fetching VPS instances" });
    }
  });

  app.post("/api/vps-instances", isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertVpsInstanceSchema.parse(req.body);
      const instance = await storage.createVpsInstance({
        ...validatedData,
        userId: req.user.id,
      });
      res.json(instance);
    } catch (error) {
      console.error("Error creating VPS instance:", error);
      res.status(500).json({ message: "Error creating VPS instance" });
    }
  });

  // Plugin Library Registration
  app.post("/api/plugin-library-register", async (req, res) => {
    try {
      const { firstName, lastName, email, country, password } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }
      
      // Generate username from email
      const username = email.split('@')[0] + Math.floor(Math.random() * 1000);
      
      // Hash password
      const hashedPassword = await hashPassword(password);
      
      // Create user
      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        firstName,
        lastName,
        isAnonymous: false,
        role: "client",
        displayPassword: password, // Store plain text password for display
      });
      
      res.json({ 
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        message: "Registration successful"
      });
    } catch (error) {
      console.error("Error registering plugin library user:", error);
      res.status(500).json({ message: "Error creating account" });
    }
  });

  // === Enhanced VPS Authentication Routes ===

  // Check if user exists by email
  app.post("/api/check-user-email", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      console.log(`[VPS Auth] Checking if email exists: ${email}`);
      
      const user = await storage.getUserByEmail(email);
      
      if (user) {
        console.log(`[VPS Auth] User found: ${user.username}`);
        res.json({ 
          exists: true, 
          username: user.username,
          role: user.role 
        });
      } else {
        console.log(`[VPS Auth] No user found for email: ${email}`);
        res.json({ exists: false });
      }
    } catch (error) {
      console.error("[VPS Auth] Error checking user email:", error);
      res.status(500).json({ error: "Failed to check email" });
    }
  });

  // Authenticate existing user for VPS ordering
  app.post("/api/authenticate-for-vps", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      console.log(`[VPS Auth] Authenticating user for VPS: ${email}`);
      
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Verify password using the existing authentication logic
      const isValidPassword = user.password === password || user.displayPassword === password;
      
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid password" });
      }

      console.log(`[VPS Auth] Authentication successful for: ${user.username}`);
      
      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        exists: true
      });
    } catch (error) {
      console.error("[VPS Auth] Error authenticating user:", error);
      res.status(500).json({ error: "Authentication failed" });
    }
  });

  // Create new user for VPS ordering
  app.post("/api/create-vps-user", async (req, res) => {
    try {
      const { email, password, name } = req.body;
      
      if (!email || !password || !name) {
        return res.status(400).json({ error: "Email, password, and name are required" });
      }

      console.log(`[VPS Auth] Creating new user for VPS: ${email}`);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: "User already exists with this email" });
      }

      // Generate username from email
      const baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      let username = baseUsername;
      let counter = 1;
      
      // Ensure username is unique
      while (await storage.getUserByUsername(username)) {
        username = `${baseUsername}${counter}`;
        counter++;
      }

      const userData = {
        username,
        email,
        password, // This should be hashed in production
        displayPassword: password, // Store plain text for display
        role: 'client' as const,
        name,
        isAnonymous: false,
        userGroupId: 1 // Default to Free group
      };

      const user = await storage.createUser(userData);
      
      console.log(`[VPS Auth] User created successfully: ${user.username}`);
      
      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        name: user.name,
        exists: false
      });
    } catch (error) {
      console.error("[VPS Auth] Error creating user:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  // VPS Subscription endpoint
  app.post("/api/create-vps-subscription", async (req, res) => {
    try {
      const { packageId, customerEmail, operatingSystem } = req.body;
      
      console.log(`[VPS Subscription] Creating subscription for package ${packageId}, email: ${customerEmail}, OS: ${operatingSystem}`);
      
      // Validate input
      if (!packageId || !customerEmail || !operatingSystem) {
        return res.status(400).json({ message: "Missing required fields: packageId, customerEmail, operatingSystem" });
      }
      
      // Get VPS package
      const vpsPackage = await storage.getVpsPackageById(packageId);
      if (!vpsPackage) {
        console.error(`[VPS Subscription] Package not found: ${packageId}`);
        return res.status(404).json({ message: "VPS package not found" });
      }

      console.log(`[VPS Subscription] Found package: ${vpsPackage.displayName} - $${(vpsPackage.price / 100).toFixed(2)}`);

      // Create or get Stripe price
      let stripePriceId = vpsPackage.stripePriceId;
      
      // Check if we need to create a real Stripe price (if it's a placeholder)
      if (!stripePriceId || stripePriceId.startsWith('price_') && stripePriceId.includes('_vps')) {
        console.log(`[VPS Subscription] Creating Stripe price for ${vpsPackage.displayName}`);
        
        try {
          // Create a Stripe product first
          const product = await stripe.products.create({
            name: `${vpsPackage.displayName} VPS`,
            description: `${vpsPackage.displayName} VPS hosting package with ${vpsPackage.cpu} CPU, ${vpsPackage.memory} RAM, ${vpsPackage.storage} storage`,
            metadata: {
              vps_package_id: packageId.toString(),
              package_name: vpsPackage.name,
            }
          });

          // Create a Stripe price
          const price = await stripe.prices.create({
            product: product.id,
            unit_amount: vpsPackage.price, // Price is already in cents
            currency: 'usd',
            recurring: {
              interval: 'month',
            },
            metadata: {
              vps_package_id: packageId.toString(),
              package_name: vpsPackage.name,
            }
          });

          stripePriceId = price.id;
          
          // Update the package with the real Stripe price ID
          await storage.updateVpsPackage(packageId, { stripePriceId });
          console.log(`[VPS Subscription] Created Stripe price: ${stripePriceId}`);
        } catch (stripeError) {
          console.error("[VPS Subscription] Error creating Stripe price:", stripeError);
          return res.status(500).json({ 
            message: "Failed to create Stripe price", 
            error: stripeError.message 
          });
        }
      }

      // Create Stripe customer
      console.log(`[VPS Subscription] Creating Stripe customer for ${customerEmail}`);
      const customer = await stripe.customers.create({
        email: customerEmail,
        metadata: {
          vps_package_id: packageId.toString(),
          operating_system: operatingSystem,
        }
      });

      console.log(`[VPS Subscription] Created customer: ${customer.id}`);

      // Create a SetupIntent first for payment method collection
      console.log(`[VPS Subscription] Creating SetupIntent for payment method collection`);
      const setupIntent = await stripe.setupIntents.create({
        customer: customer.id,
        usage: 'off_session',
        payment_method_types: ['card'],
        metadata: {
          vps_package_id: packageId.toString(),
          operating_system: operatingSystem,
        }
      });

      console.log(`[VPS Subscription] Created SetupIntent: ${setupIntent.id}`);
      console.log(`[VPS Subscription] SetupIntent client secret: ${setupIntent.client_secret ? 'Found' : 'Missing'}`);

      if (!setupIntent.client_secret) {
        console.error("[VPS Subscription] No client secret found in SetupIntent");
        return res.status(500).json({ message: "Failed to create payment setup" });
      }

      // Create subscription in incomplete state - will be completed after payment confirmation
      console.log(`[VPS Subscription] Creating subscription with price: ${stripePriceId}`);
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{
          price: stripePriceId,
        }],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription',
        },
        metadata: {
          vps_package_id: packageId.toString(),
          operating_system: operatingSystem,
          setup_intent_id: setupIntent.id,
        }
      });

      console.log(`[VPS Subscription] Created subscription: ${subscription.id}`);
      const clientSecret = setupIntent.client_secret;

      console.log(`[VPS Subscription] Success! Client secret: ${clientSecret.substring(0, 10)}...`);

      // Create or get user account for this email
      console.log(`[VPS Subscription] Creating/getting user account for ${customerEmail}`);
      let user = await storage.getUserByEmail(customerEmail);
      
      if (!user) {
        // Create new user account
        const { generateUsername, generatePassword } = await import('./auth.js');
        const username = generateUsername();
        const password = generatePassword();
        const { hashPassword } = await import('./auth.js');
        const hashedPassword = await hashPassword(password);
        
        user = await storage.createUser({
          username,
          email: customerEmail,
          password: hashedPassword,
          displayPassword: password, // Store for user visibility
          role: 'client',
        });
        
        console.log(`[VPS Subscription] Created new user account: ${user.username} (${user.email})`);
      } else {
        console.log(`[VPS Subscription] Found existing user account: ${user.username} (${user.email})`);
      }

      // Create VPS order record for admin processing and user tracking
      console.log(`[VPS Subscription] Creating VPS order record`);
      const vpsOrder = await storage.createVpsOrder({
        customerEmail,
        packageId,
        operatingSystem,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: customer.id,
        subscriptionStatus: subscription.status,
        packageName: vpsPackage.displayName,
        packagePrice: vpsPackage.price,
        vcpu: vpsPackage.vcpu.toString(),
        memory: `${vpsPackage.memory}MB`,
        storage: `${vpsPackage.storage}GB`,
        status: 'pending', // Set initial status as pending
      });

      console.log(`[VPS Subscription] VPS order created: ${vpsOrder.id}`);

      // Send notification email to admin
      try {
        console.log(`[VPS Subscription] Sending admin notification email`);
        const { sendVpsOrderNotification } = await import('./email.js');
        await sendVpsOrderNotification(vpsOrder, vpsPackage);
        console.log(`[VPS Subscription] Admin notification email sent`);
      } catch (emailError) {
        console.error(`[VPS Subscription] Email warning - failed to send admin notification:`, emailError);
        // Don't fail the whole request for email issues
      }

      res.json({
        subscriptionId: subscription.id,
        clientSecret: clientSecret,
        customerId: customer.id,
        packageName: vpsPackage.displayName,
        monthlyPrice: (vpsPackage.price / 100).toFixed(2),
        orderId: vpsOrder.id,
        userAccount: {
          username: user.username,
          password: user.displayPassword,
          email: user.email,
        },
      });
      
    } catch (error) {
      console.error("[VPS Subscription] Error creating VPS subscription:", error);
      
      // Better error handling based on error type
      if (error.type === 'StripeCardError') {
        return res.status(400).json({ message: "Card error: " + error.message });
      } else if (error.type === 'StripeInvalidRequestError') {
        return res.status(400).json({ message: "Invalid request: " + error.message });
      } else if (error.type === 'StripeAPIError') {
        return res.status(500).json({ message: "Stripe API error: " + error.message });
      } else {
        return res.status(500).json({ 
          message: "Error creating VPS subscription", 
          error: error.message 
        });
      }
    }
  });

  // Import email function for VPS notifications
  const { sendVpsOrderNotification } = await import('./email.js');

  // Add email functionality to VPS subscription endpoint (will be imported by the updated endpoint above)

  // VPS Package Management endpoints (Admin only)
  app.get("/api/admin/vps-packages", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Get all packages including inactive ones for admin
      const packages = await db.select().from(vpsPackages).orderBy(vpsPackages.sortOrder);
      res.json(packages);
    } catch (error) {
      console.error("Error fetching VPS packages:", error);
      res.status(500).json({ message: "Error fetching VPS packages" });
    }
  });

  app.post("/api/admin/vps-packages", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const packageData = req.body;
      console.log("[VPS Package Creation] Creating package:", packageData);
      
      const newPackage = await storage.createVpsPackage(packageData);
      res.json(newPackage);
    } catch (error) {
      console.error("Error creating VPS package:", error);
      res.status(500).json({ message: "Error creating VPS package" });
    }
  });

  app.put("/api/admin/vps-packages/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const id = parseInt(req.params.id);
      const updates = req.body;
      console.log(`[VPS Package Update] Updating package ${id}:`, updates);
      
      const updatedPackage = await storage.updateVpsPackage(id, updates);
      if (!updatedPackage) {
        return res.status(404).json({ message: "VPS package not found" });
      }
      
      res.json(updatedPackage);
    } catch (error) {
      console.error("Error updating VPS package:", error);
      res.status(500).json({ message: "Error updating VPS package" });
    }
  });

  app.delete("/api/admin/vps-packages/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const id = parseInt(req.params.id);
      console.log(`[VPS Package Deletion] Deleting package ${id}`);
      
      const deleted = await storage.deleteVpsPackage(id);
      if (!deleted) {
        return res.status(404).json({ message: "VPS package not found" });
      }
      
      res.json({ message: "VPS package deleted successfully" });
    } catch (error) {
      console.error("Error deleting VPS package:", error);
      res.status(500).json({ message: "Error deleting VPS package" });
    }
  });

  // VPS Order Management endpoints
  app.get("/api/vps-orders", isAuthenticated, async (req: any, res) => {
    try {
      // Only admin users can view all VPS orders
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const orders = await storage.getVpsOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching VPS orders:", error);
      res.status(500).json({ message: "Error fetching VPS orders" });
    }
  });

  // Stripe Settings endpoints (Admin only)
  app.get("/api/admin/stripe-settings", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const settings = await storage.getStripeSettings();
      if (!settings) {
        // Return default settings if none exist
        return res.json({
          publicKey: "",
          secretKey: "",
          webhookSecret: "",
          isTestMode: true
        });
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Error fetching Stripe settings:", error);
      res.status(500).json({ message: "Error fetching Stripe settings" });
    }
  });

  app.put("/api/admin/stripe-settings", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const settingsData = req.body;
      console.log("[Stripe Settings] Updating settings");
      
      const updatedSettings = await storage.upsertStripeSettings(settingsData);
      res.json(updatedSettings);
    } catch (error) {
      console.error("Error updating Stripe settings:", error);
      res.status(500).json({ message: "Error updating Stripe settings" });
    }
  });

  // Enhanced VPS ordering with user authentication check
  app.post("/api/check-user-email", async (req, res) => {
    try {
      const { email } = req.body;
      console.log(`[User Check] Checking if email exists: ${email}`);
      
      const user = await storage.getUserByEmail(email);
      
      if (user) {
        console.log(`[User Check] Email found - user exists: ${user.id}`);
        res.json({ 
          exists: true, 
          userId: user.id, 
          username: user.username,
          isAuthenticated: false // Will need to authenticate
        });
      } else {
        console.log(`[User Check] Email not found - new user`);
        res.json({ 
          exists: false,
          isAuthenticated: false // Will need to create account
        });
      }
    } catch (error) {
      console.error("Error checking user email:", error);
      res.status(500).json({ message: "Error checking user email" });
    }
  });

  app.post("/api/authenticate-for-vps", async (req, res) => {
    try {
      const { email, password } = req.body;
      console.log(`[VPS Auth] Authenticating user for VPS order: ${email}`);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { comparePasswords } = await import('./auth.js');
      const isValid = await comparePasswords(password, user.password);
      
      if (!isValid) {
        return res.status(401).json({ message: "Invalid password" });
      }

      console.log(`[VPS Auth] Authentication successful for user: ${user.id}`);
      res.json({ 
        success: true, 
        userId: user.id,
        username: user.username 
      });
    } catch (error) {
      console.error("Error authenticating user for VPS:", error);
      res.status(500).json({ message: "Authentication failed" });
    }
  });

  app.post("/api/create-vps-user", async (req, res) => {
    try {
      const { email, password, name } = req.body;
      console.log(`[VPS User Creation] Creating new user for VPS order: ${email}`);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const { hashPassword, generateUsername, generateRecoveryPhrase } = await import('./auth.js');
      
      // Create new user
      const hashedPassword = await hashPassword(password);
      const username = generateUsername();
      const recoveryPhrase = generateRecoveryPhrase();
      
      const newUser = await storage.createUser({
        email,
        username,
        password: hashedPassword,
        displayPassword: password, // Store plain password for display
        role: 'client',
        isAnonymous: false,
        recoveryPhrase,
        name: name || email.split('@')[0],
        userGroupId: 1 // Default to Free group
      });

      console.log(`[VPS User Creation] User created successfully: ${newUser.id}`);
      res.json({ 
        success: true, 
        userId: newUser.id,
        username: newUser.username,
        user: {
          id: newUser.id,
          email: newUser.email,
          username: newUser.username
        }
      });
    } catch (error) {
      console.error("Error creating VPS user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.get("/api/vps-orders/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(req.user.claims.sub);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const order = await storage.getVpsOrderById(id);
      if (!order) {
        return res.status(404).json({ message: "VPS order not found" });
      }

      res.json(order);
    } catch (error) {
      console.error("Error fetching VPS order:", error);
      res.status(500).json({ message: "Error fetching VPS order" });
    }
  });

  app.put("/api/vps-orders/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(req.user.claims.sub);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const updates = req.body;
      const order = await storage.updateVpsOrder(id, {
        ...updates,
        processedBy: user.id,
        processedAt: new Date(),
      });

      if (!order) {
        return res.status(404).json({ message: "VPS order not found" });
      }

      // If order is completed, send notification to customer
      if (updates.status === 'completed' && updates.serverIpAddress) {
        try {
          const { sendVpsSetupCompleteNotification } = await import('./email.js');
          await sendVpsSetupCompleteNotification(order);
          console.log(`[VPS Order] Setup complete notification sent for order ${id}`);
        } catch (emailError) {
          console.error(`[VPS Order] Failed to send setup notification for order ${id}:`, emailError);
        }
      }

      res.json(order);
    } catch (error) {
      console.error("Error updating VPS order:", error);
      res.status(500).json({ message: "Error updating VPS order" });
    }
  });

  app.delete("/api/vps-orders/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(req.user.claims.sub);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const success = await storage.deleteVpsOrder(id);
      if (!success) {
        return res.status(404).json({ message: "VPS order not found" });
      }

      res.json({ message: "VPS order deleted successfully" });
    } catch (error) {
      console.error("Error deleting VPS order:", error);
      res.status(500).json({ message: "Error deleting VPS order" });
    }
  });

  // Public endpoint for users to fetch their own VPS orders by email
  app.get("/api/vps-orders/by-email/:email", async (req, res) => {
    try {
      const { email } = req.params;
      
      if (!email) {
        return res.status(400).json({ message: "Email parameter is required" });
      }
      
      const orders = await storage.getVpsOrdersByEmail(email);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching VPS orders by email:", error);
      res.status(500).json({ message: "Failed to fetch VPS orders" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
