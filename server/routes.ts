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
  console.log('RequireAdmin middleware - user:', JSON.stringify(req.user, null, 2));
  if (req.user?.role !== "admin") {
    console.log('Access denied - user role:', req.user?.role);
    return res.status(403).json({ message: "Admin access required" });
  }
  console.log('Admin access granted');
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
      console.log('[Admin Users API] Starting user fetch...');
      const users = await storage.getAllUsers();
      console.log(`[Admin Users API] ✓ Successfully fetched ${users.length} users`);
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
      console.log('[Admin Hosting Accounts API] Starting hosting accounts fetch...');
      const allUsers = await storage.getAllUsers();
      console.log(`[Admin Hosting Accounts API] Found ${allUsers.length} total users`);
      
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
      
      console.log(`[Admin Hosting Accounts API] ✓ Successfully fetched ${clientAccounts.length} clients with hosting accounts`);
      res.json(clientAccounts);
    } catch (error) {
      console.error('[Admin Hosting Accounts API] Error fetching admin hosting accounts:', error);
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

  // Integrated domain registration endpoint - creates WHM account first, then user account
  app.post("/api/register-domain", async (req, res) => {
    try {
      const { 
        subdomain, 
        packageId = 1,
        fingerprintHash,
        macAddress,
        userAgent,
        screenResolution,
        timezone,
        language,
        platformInfo
      } = req.body;

      console.log('[Domain Registration API] ===== START DOMAIN REGISTRATION =====');
      console.log('[Domain Registration API] Received registration data:', {
        subdomain,
        packageId,
        fingerprintHash: fingerprintHash?.substring(0, 10) + '...',
        deviceInfo: { userAgent, screenResolution, timezone, language }
      });

      if (!subdomain) {
        console.error('[Domain Registration API] ERROR: Missing subdomain');
        return res.status(400).json({ error: "Subdomain is required" });
      }

      const fullDomain = `${subdomain}.hostme.today`;

      // Check device limits if fingerprint provided
      if (fingerprintHash) {
        const deviceCount = await storage.getDeviceCountByFingerprint(fingerprintHash);
        const maxDevices = 2; // Default limit for free users
        
        if (deviceCount >= maxDevices) {
          console.error('[Domain Registration API] ERROR: Device registration limit exceeded');
          return res.status(400).json({ 
            error: "Device registration limit exceeded. You can only register accounts from 2 devices.",
            deviceLimitReached: true
          });
        }
      }

      // Check if domain already exists in our database
      const existingAccount = await storage.getHostingAccountByDomain(fullDomain);
      if (existingAccount) {
        console.log('[Domain Registration API] Found existing account for domain:', fullDomain);
        console.log('[Domain Registration API] Existing account status:', existingAccount.status);
        console.log('[Domain Registration API] Existing account ID:', existingAccount.id);
        
        // If the account is in error status, we can try to clean it up
        if (existingAccount.status === 'error') {
          console.log('[Domain Registration API] Existing account is in error status, attempting cleanup...');
          
          // Try to remove from WHM first
          const apiSettings = await storage.getApiSettings();
          if (apiSettings && apiSettings.whmApiUrl && apiSettings.whmApiToken && existingAccount.cpanelUsername) {
            try {
              const terminateUrl = `${apiSettings.whmApiUrl}/removeacct`;
              const terminateData = new URLSearchParams({
                user: existingAccount.cpanelUsername,
                keepdns: '0'
              });
              
              console.log('[Domain Registration API] Attempting to remove WHM account:', existingAccount.cpanelUsername);
              const terminateResponse = await fetch(terminateUrl, {
                method: 'POST',
                headers: {
                  'Authorization': `whm root:${apiSettings.whmApiToken}`,
                  'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: terminateData
              });
              
              const terminateResult = await terminateResponse.json();
              console.log('[Domain Registration API] WHM cleanup response:', JSON.stringify(terminateResult, null, 2));
            } catch (cleanupError) {
              console.error('[Domain Registration API] Failed to cleanup WHM account:', cleanupError);
            }
          }
          
          // Delete the error account from our database
          await storage.deleteHostingAccount(existingAccount.id);
          console.log('[Domain Registration API] ✓ Cleaned up error account from database');
          
          // Also delete the associated user if it's an anonymous user
          const existingUser = await storage.getUser(existingAccount.userId);
          if (existingUser && existingUser.isAnonymous) {
            await storage.deleteUser(existingAccount.userId);
            console.log('[Domain Registration API] ✓ Cleaned up associated anonymous user');
          }
        } else {
          // Account exists and is not in error status
          console.error('[Domain Registration API] ERROR: Domain already taken by active account:', fullDomain);
          return res.status(400).json({ error: "Domain is already taken" });
        }
      }

      // Generate anonymous user credentials
      const generateUsername = () => {
        const prefixes = ['user', 'host', 'web', 'site', 'my'];
        const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const randomNum = Math.floor(Math.random() * 100000);
        return `${randomPrefix}${randomNum}`;
      };

      const generatePassword = () => {
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < 12; i++) {
          password += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return password;
      };

      const generateRecoveryPhrase = () => {
        const words = ['apple', 'banana', 'cherry', 'dragon', 'eagle', 'forest', 'garden', 'happy', 'island', 'jungle'];
        const phrase = [];
        for (let i = 0; i < 4; i++) {
          phrase.push(words[Math.floor(Math.random() * words.length)]);
        }
        return phrase.join('-');
      };

      const username = generateUsername();
      const password = generatePassword();
      const recoveryPhrase = generateRecoveryPhrase();

      console.log('[Domain Registration API] Generated credentials for user:', username);

      // First, create the WHM hosting account
      const apiSettings = await storage.getApiSettings();
      if (!apiSettings || !apiSettings.whmApiUrl || !apiSettings.whmApiToken) {
        console.error('[Domain Registration API] ERROR: WHM API settings not configured');
        return res.status(500).json({ error: "Server configuration incomplete" });
      }

      // Get the hosting package details to find the WHM package name
      const hostingPackage = await storage.getHostingPackageById(packageId);
      if (!hostingPackage) {
        console.error('[Domain Registration API] ERROR: Invalid package ID:', packageId);
        return res.status(400).json({ error: "Invalid package selected" });
      }

      console.log('[Domain Registration API] Using hosting package:', hostingPackage.displayName);
      console.log('[Domain Registration API] WHM package name:', hostingPackage.whmPackageName);

      // Generate WHM username (must start with letter for WHM validation)
      const whmUsername = subdomain.match(/^\d/) ? `h${subdomain}` : subdomain;
      const whmPassword = generatePassword();

      console.log('[Domain Registration API] Creating WHM account:', whmUsername);

      // Create WHM hosting account
      const createAccountUrl = `${apiSettings.whmApiUrl}/createacct`;
      const formData = new URLSearchParams({
        username: whmUsername,
        domain: fullDomain,
        password: whmPassword,
        pkg: hostingPackage.whmPackageName || '512MB Free Hosting', // Use the package assigned by admin
        contactemail: `admin@${fullDomain}`,
        ip: 'n' // Use shared IP
      });

      const whmResponse = await fetch(createAccountUrl, {
        method: 'POST',
        headers: {
          'Authorization': `whm root:${apiSettings.whmApiToken}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData
      });

      const whmData = await whmResponse.json();
      console.log('[Domain Registration API] WHM response:', JSON.stringify(whmData, null, 2));

      // Check if WHM account creation was successful
      const isSuccess = whmData.metadata?.result === 1 || 
                       (whmData.data && Array.isArray(whmData.data) && whmData.data.some((item: any) => item.status === 1)) ||
                       (whmData.result && whmData.result[0]?.status === 1);

      // Check for specific error cases
      const errorMessage = whmData.result?.[0]?.statusmsg || whmData.metadata?.reason || '';
      const isDomainExists = errorMessage.includes('already exists');

      if (!isSuccess) {
        console.error('[Domain Registration API] WHM account creation failed:', errorMessage);
        
        // If domain already exists in WHM, try to check if we can recover the account
        if (isDomainExists) {
          console.log('[Domain Registration API] Domain already exists in WHM, checking if we can recover...');
          
          // Check if there's already a hosting account in our database with error status
          const existingErrorAccount = await storage.getHostingAccountByDomain(fullDomain);
          if (existingErrorAccount && existingErrorAccount.status === 'error') {
            console.log('[Domain Registration API] Found existing error account, will clean up and retry');
            // Delete the error account from our database
            await storage.deleteHostingAccount(existingErrorAccount.id);
            // Try to remove from WHM too
            try {
              const terminateUrl = `${apiSettings.whmApiUrl}/removeacct`;
              const terminateData = new URLSearchParams({
                user: existingErrorAccount.cpanelUsername || whmUsername,
                keepdns: '0'
              });
              await fetch(terminateUrl, {
                method: 'POST',
                headers: {
                  'Authorization': `whm root:${apiSettings.whmApiToken}`,
                  'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: terminateData
              });
              console.log('[Domain Registration API] Removed existing WHM account');
            } catch (cleanupError) {
              console.error('[Domain Registration API] Failed to cleanup WHM account:', cleanupError);
            }
          }
          
          return res.status(400).json({ 
            error: `Domain ${fullDomain} already exists. Please choose a different subdomain.`,
            domainExists: true 
          });
        }
        
        return res.status(500).json({ error: `Hosting account creation failed: ${errorMessage}` });
      }

      console.log('[Domain Registration API] ✓ WHM account created successfully');

      // Create user account in local database
      const userData = {
        username,
        email: `admin@${fullDomain}`,
        firstName: 'Anonymous',
        lastName: 'User',
        password: password,
        displayPassword: password,
        recoveryPhrase: recoveryPhrase,
        role: 'client' as const,
        isAnonymous: true
      };

      let newUser;
      try {
        newUser = await storage.createUser(userData);
        console.log('[Domain Registration API] ✓ User account created with ID:', newUser.id);
      } catch (userError) {
        console.error('[Domain Registration API] Failed to create user account:', userError);
        // If user creation fails but WHM account was created, we have a problem
        // Try to clean up the WHM account
        try {
          const terminateUrl = `${apiSettings.whmApiUrl}/removeacct`;
          const terminateData = new URLSearchParams({
            user: whmUsername,
            keepdns: '0'
          });
          await fetch(terminateUrl, {
            method: 'POST',
            headers: {
              'Authorization': `whm root:${apiSettings.whmApiToken}`,
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: terminateData
          });
          console.log('[Domain Registration API] Cleaned up WHM account after user creation failure');
        } catch (cleanupError) {
          console.error('[Domain Registration API] Failed to cleanup WHM account:', cleanupError);
        }
        throw userError;
      }

      // Create hosting account record in database
      const hostingAccountData = {
        userId: newUser.id,
        domain: fullDomain,
        subdomain: subdomain, // Add the required subdomain field
        packageId: packageId,
        status: 'active',
        diskUsage: 0,
        bandwidthUsage: 0,
        cpanelUsername: whmUsername,
        cpanelPassword: whmPassword
      };

      let hostingAccount;
      try {
        hostingAccount = await storage.createHostingAccount(hostingAccountData);
        console.log('[Domain Registration API] ✓ Hosting account record created with ID:', hostingAccount.id);
      } catch (accountError) {
        console.error('[Domain Registration API] Failed to create hosting account record:', accountError);
        // Clean up the user we just created
        await storage.deleteUser(newUser.id);
        // Try to clean up the WHM account too
        try {
          const terminateUrl = `${apiSettings.whmApiUrl}/removeacct`;
          const terminateData = new URLSearchParams({
            user: whmUsername,
            keepdns: '0'
          });
          await fetch(terminateUrl, {
            method: 'POST',
            headers: {
              'Authorization': `whm root:${apiSettings.whmApiToken}`,
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: terminateData
          });
          console.log('[Domain Registration API] Cleaned up WHM account after hosting account creation failure');
        } catch (cleanupError) {
          console.error('[Domain Registration API] Failed to cleanup WHM account:', cleanupError);
        }
        throw accountError;
      }

      // Record device fingerprint if provided
      if (fingerprintHash) {
        try {
          await storage.createDeviceFingerprint({
            fingerprintHash,
            userId: newUser.id,
            macAddress: macAddress || null,
            userAgent: userAgent || '',
            screenResolution: screenResolution || '',
            timezone: timezone || '',
            language: language || '',
            platformInfo: platformInfo || ''
          });
          console.log('[Domain Registration API] ✓ Device fingerprint recorded');
        } catch (fingerprintError) {
          console.error('[Domain Registration API] Failed to record device fingerprint:', fingerprintError);
          // Don't fail the entire registration for fingerprint errors
        }
      }

      // Set up user session for automatic login - make it synchronous
      await new Promise<void>((resolve, reject) => {
        req.login(newUser, (err) => {
          if (err) {
            console.error('[Domain Registration API] Failed to login user automatically:', err);
            reject(err);
          } else {
            console.log('[Domain Registration API] ✓ User automatically logged in');
            // Force session save to ensure persistence
            req.session.save((saveErr) => {
              if (saveErr) {
                console.error('[Domain Registration API] Failed to save session:', saveErr);
                reject(saveErr);
              } else {
                console.log('[Domain Registration API] ✓ Session saved successfully');
                console.log('[Domain Registration API] Session ID:', req.session.id);
                resolve();
              }
            });
          }
        });
      });

      console.log('[Domain Registration API] ✅ Registration completed successfully');
      console.log('[Domain Registration API] ===== END DOMAIN REGISTRATION =====');

      // Return success response with user and hosting account data
      res.json({
        success: true,
        domain: fullDomain,
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          password: password,
          displayPassword: password,
          recoveryPhrase: recoveryPhrase,
          isAnonymous: true
        },
        account: {
          id: hostingAccount.id,
          domain: fullDomain,
          subdomain: subdomain,
          status: 'active',
          cpanelUsername: whmUsername,
          cpanelPassword: whmPassword
        },
        credentials: {
          username: whmUsername,
          password: whmPassword,
          domain: fullDomain,
          cpanelUrl: `https://${fullDomain}:2083`
        },
        message: `Account created successfully for ${fullDomain}`
      });

    } catch (error) {
      console.error('[Domain Registration API] ===== CRITICAL ERROR IN DOMAIN REGISTRATION =====');
      console.error('[Domain Registration API] Error type:', error?.constructor?.name);
      console.error('[Domain Registration API] Error message:', error?.message);
      console.error('[Domain Registration API] Full error object:', error);
      console.error('[Domain Registration API] Stack trace:', error?.stack);
      console.error('[Domain Registration API] Request body was:', req.body);
      console.error('[Domain Registration API] ===== END CRITICAL ERROR =====');
      
      res.status(500).json({ 
        error: "Registration failed due to internal error",
        details: error?.message
      });
    }
  });

  // Get hosting packages
  app.get("/api/admin/packages", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      console.log('[Admin Packages API] Starting package fetch...');
      const packages = await storage.getHostingPackages();
      console.log(`[Admin Packages API] ✓ Successfully fetched ${packages.length} packages`);
      res.json(packages);
    } catch (error) {
      console.error('[Admin Packages API] Error fetching packages:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create new package
  app.post("/api/admin/packages", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      console.log('[Admin Packages API] Creating new package:', req.body);
      const newPackage = await storage.createHostingPackage(req.body);
      console.log('[Admin Packages API] ✓ Package created successfully:', newPackage.id);
      res.json(newPackage);
    } catch (error) {
      console.error("[Admin Packages API] Error creating package:", error);
      res.status(500).json({ message: "Failed to create package" });
    }
  });

  // Update package
  app.put("/api/admin/packages/:id", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const packageId = parseInt(req.params.id);
      console.log(`[Admin Packages API] Updating package ${packageId}:`, req.body);
      const updatedPackage = await storage.updateHostingPackage(packageId, req.body);
      console.log('[Admin Packages API] ✓ Package updated successfully');
      res.json(updatedPackage);
    } catch (error) {
      console.error("[Admin Packages API] Error updating package:", error);
      res.status(500).json({ message: "Failed to update package" });
    }
  });

  // Delete package
  app.delete("/api/admin/packages/:id", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const packageId = parseInt(req.params.id);
      console.log(`[Admin Packages API] Deleting package ${packageId}`);
      await storage.deleteHostingPackage(packageId);
      console.log('[Admin Packages API] ✓ Package deleted successfully');
      res.json({ success: true });
    } catch (error) {
      console.error("[Admin Packages API] Error deleting package:", error);
      res.status(500).json({ message: "Failed to delete package" });
    }
  });

  // Duplicate package
  app.post("/api/admin/packages/:id/duplicate", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const packageId = parseInt(req.params.id);
      console.log(`[Admin Packages API] Duplicating package ${packageId}`);
      
      // Get the original package
      const originalPackage = await storage.getHostingPackageById(packageId);
      if (!originalPackage) {
        return res.status(404).json({ message: "Package not found" });
      }
      
      // Create a copy with a new name
      const duplicatedData = {
        ...originalPackage,
        name: `${originalPackage.name}-copy`,
        displayName: `${originalPackage.displayName} (Copy)`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      delete (duplicatedData as any).id;
      
      const newPackage = await storage.createHostingPackage(duplicatedData);
      console.log('[Admin Packages API] ✓ Package duplicated successfully:', newPackage.id);
      res.json(newPackage);
    } catch (error) {
      console.error("[Admin Packages API] Error duplicating package:", error);
      res.status(500).json({ message: "Failed to duplicate package" });
    }
  });

  // Get WHM packages (live from WHM API)
  app.get("/api/admin/whm-packages", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      console.log('[WHM Packages API] ===== START WHM PACKAGES FETCH =====');
      
      // Get API settings
      const apiSettings = await storage.getApiSettings();
      if (!apiSettings?.whmApiUrl || !apiSettings?.whmApiToken) {
        console.log('[WHM Packages API] WHM API not configured');
        return res.json({ packages: [] });
      }

      // Call WHM API to list packages
      const baseUrl = apiSettings.whmApiUrl.replace(/\/+$/, '');
      const listPkgsUrl = `${baseUrl}/listpkgs?api.version=1`;
      const authHeader = `whm root:${apiSettings.whmApiToken}`;

      console.log('[WHM Packages API] Fetching from WHM:', listPkgsUrl);
      console.log('[WHM Packages API] Using auth header:', authHeader.substring(0, 20) + '...');

      const whmResponse = await fetch(listPkgsUrl, {
        method: 'GET',
        headers: {
          'Authorization': authHeader
        }
      });

      if (!whmResponse.ok) {
        console.error('[WHM Packages API] WHM API error:', whmResponse.status);
        const errorText = await whmResponse.text();
        console.error('[WHM Packages API] Error response:', errorText.substring(0, 200));
        return res.json({ packages: [] });
      }

      const responseText = await whmResponse.text();
      console.log('[WHM Packages API] Raw response text (first 500 chars):', responseText.substring(0, 500));
      
      let whmData;
      try {
        whmData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('[WHM Packages API] Failed to parse JSON:', parseError);
        console.error('[WHM Packages API] Response was:', responseText.substring(0, 1000));
        return res.json({ packages: [] });
      }

      console.log('[WHM Packages API] WHM response received:', {
        status: whmResponse.status,
        hasData: !!whmData?.data,
        hasPackages: !!whmData?.data?.pkg,
        dataKeys: whmData?.data ? Object.keys(whmData.data) : [],
        metadataResult: whmData?.metadata?.result
      });

      // Extract packages from WHM response
      const packages = [];
      
      // Check different possible response structures
      let packageList = null;
      if (whmData?.data?.pkg) {
        packageList = whmData.data.pkg;
        console.log('[WHM Packages API] Found packages at data.pkg');
      } else if (whmData?.metadata?.result && whmData?.data) {
        // Sometimes WHM returns packages directly in data
        packageList = whmData.data;
        console.log('[WHM Packages API] Found packages at data (direct)');
      }

      console.log('[WHM Packages API] Package list type:', typeof packageList);
      console.log('[WHM Packages API] Is array?', Array.isArray(packageList));
      
      if (packageList) {
        // If it's an object with package names as keys, convert to array
        if (!Array.isArray(packageList) && typeof packageList === 'object') {
          console.log('[WHM Packages API] Converting object to array');
          packageList = Object.values(packageList);
        }
        
        if (Array.isArray(packageList)) {
          console.log(`[WHM Packages API] Processing ${packageList.length} packages`);
          for (const pkg of packageList) {
            console.log('[WHM Packages API] Processing package:', pkg.name || 'unnamed');
            console.log('[WHM Packages API] Package data:', {
              QUOTA: pkg.QUOTA,
              BWLIMIT: pkg.BWLIMIT,
              MAXPOP: pkg.MAXPOP,
              MAXSQL: pkg.MAXSQL,
              MAXSUB: pkg.MAXSUB,
              MAXFTP: pkg.MAXFTP,
              MAXADDON: pkg.MAXADDON,
              MAXPARK: pkg.MAXPARK
            });
            
            // Helper function to convert WHM values to numbers
            const parseWhmValue = (value: any): number => {
              if (value === 'unlimited' || value === 'UNLIMITED') return -1; // -1 represents unlimited
              const parsed = parseInt(value);
              return isNaN(parsed) ? 0 : parsed;
            };
            
            packages.push({
              name: pkg.name || pkg.pkgname || 'unknown',
              displayname: pkg.name || pkg.pkgname || 'unknown',
              diskquota: parseWhmValue(pkg.QUOTA || pkg.quota || pkg.diskquota),
              bwlimit: parseWhmValue(pkg.BWLIMIT || pkg.bwlimit),
              maxpop: parseWhmValue(pkg.MAXPOP || pkg.maxpop),
              maxsql: parseWhmValue(pkg.MAXSQL || pkg.maxsql),
              maxsub: parseWhmValue(pkg.MAXSUB || pkg.maxsub),
              maxftp: parseWhmValue(pkg.MAXFTP || pkg.maxftp),
              maxaddon: parseWhmValue(pkg.MAXADDON || pkg.maxaddon),
              maxpark: parseWhmValue(pkg.MAXPARK || pkg.maxpark),
              maxlst: parseWhmValue(pkg.MAXLST || pkg.maxlst),
              feature_list: pkg.FEATURELIST || pkg.featurelist || 'default',
              ip: pkg.IP || pkg.ip || 'shared'
            });
          }
        } else {
          console.log('[WHM Packages API] packageList is not an array:', packageList);
        }
      } else {
        console.log('[WHM Packages API] No package list found in response');
      }

      console.log(`[WHM Packages API] ✓ Successfully retrieved ${packages.length} packages from WHM`);
      console.log('[WHM Packages API] ===== END WHM PACKAGES FETCH =====');
      
      res.json({ packages });

    } catch (error) {
      console.error('[WHM Packages API] ===== CRITICAL ERROR IN WHM PACKAGES FETCH =====');
      console.error('[WHM Packages API] Error:', error);
      console.error('[WHM Packages API] ===== END CRITICAL ERROR =====');
      
      res.json({ packages: [] });
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
      console.log('[Plugin API] ===== START PLUGIN FETCH =====');
      console.log('[Plugin API] Fetching all plugins from storage...');
      
      const plugins = await storage.getAllPlugins();
      
      console.log('[Plugin API] ✓ Successfully retrieved plugins count:', plugins?.length || 0);
      console.log('[Plugin API] ===== END PLUGIN FETCH =====');
      res.json(plugins);
    } catch (error) {
      console.error('[Plugin API] ===== CRITICAL ERROR IN PLUGIN FETCH =====');
      console.error('[Plugin API] Error type:', error?.constructor?.name);
      console.error('[Plugin API] Error message:', error?.message);
      console.error('[Plugin API] Full error object:', error);
      console.error('[Plugin API] Stack trace:', error?.stack);
      console.error('[Plugin API] ===== END CRITICAL ERROR =====');
      res.status(500).json({ message: "Internal server error", details: error?.message });
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
      
      console.log('[Device Limits API] ===== START DEVICE LIMITS CHECK =====');
      console.log('[Device Limits API] Received request body:', req.body);
      console.log('[Device Limits API] Fingerprint hash provided:', fingerprintHash ? `${fingerprintHash.substring(0, 10)}...` : 'undefined');
      
      if (!fingerprintHash) {
        console.error('[Device Limits API] ERROR: No fingerprint hash provided');
        return res.status(400).json({ error: "Fingerprint hash is required" });
      }

      console.log('[Device Limits API] Calling storage.getDeviceCountByFingerprint...');
      const deviceCount = await storage.getDeviceCountByFingerprint(fingerprintHash);
      const maxDevices = 2; // Default limit
      
      console.log('[Device Limits API] ✓ Successfully retrieved device count:', deviceCount);
      console.log('[Device Limits API] Max devices allowed:', maxDevices);
      
      const canRegister = deviceCount < maxDevices;
      
      const result = {
        canRegister,
        currentDevices: deviceCount,
        maxDevices
      };
      
      console.log('[Device Limits API] ✓ Computed result:', result);
      console.log('[Device Limits API] ===== END DEVICE LIMITS CHECK =====');
      res.json(result);

    } catch (error) {
      console.error('[Device Limits API] ===== CRITICAL ERROR IN DEVICE LIMITS CHECK =====');
      console.error('[Device Limits API] Error type:', error?.constructor?.name);
      console.error('[Device Limits API] Error message:', error?.message);
      console.error('[Device Limits API] Full error object:', error);
      console.error('[Device Limits API] Stack trace:', error?.stack);
      console.error('[Device Limits API] ===== END CRITICAL ERROR =====');
      res.status(500).json({ error: "Failed to check device limits", details: error?.message });
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

  // Plugin file download endpoint
  app.get("/api/plugins/:id/download", async (req, res) => {
    try {
      const pluginId = parseInt(req.params.id);
      console.log('[Plugin Download] Request for plugin ID:', pluginId);
      
      const plugin = await storage.getPluginById(pluginId);
      if (!plugin) {
        console.error('[Plugin Download] Plugin not found:', pluginId);
        return res.status(404).json({ message: "Plugin not found" });
      }

      console.log('[Plugin Download] Plugin found:', plugin.name);
      console.log('[Plugin Download] File path:', plugin.filePath);

      // Construct full path from project root
      const filePath = path.join(process.cwd(), plugin.filePath);
      console.log('[Plugin Download] Full file path:', filePath);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.error('[Plugin Download] File not found:', filePath);
        return res.status(404).json({ message: "Plugin file not found" });
      }

      // Increment download count
      await storage.incrementPluginDownloads(pluginId);

      // Record download if user is authenticated
      if ((req as any).isAuthenticated && (req as any).isAuthenticated()) {
        await storage.recordPluginDownload(pluginId, (req as any).user.id);
      }

      // Set proper headers for file download
      res.setHeader('Content-Disposition', `attachment; filename="${plugin.fileName}"`);
      res.setHeader('Content-Type', 'application/zip');
      
      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
      
      console.log('[Plugin Download] ✓ Download started for:', plugin.name);
    } catch (error) {
      console.error('[Plugin Download] Error:', error);
      res.status(500).json({ message: "Failed to download plugin" });
    }
  });

  // Plugin POST download endpoint (for authenticated tracking)
  app.post("/api/plugins/:id/download", isAuthenticated, async (req: any, res) => {
    try {
      const pluginId = parseInt(req.params.id);
      const plugin = await storage.getPluginById(pluginId);
      
      if (!plugin) {
        return res.status(404).json({ message: "Plugin not found" });
      }

      // Record the download
      await storage.recordPluginDownload(pluginId, req.user.id);
      await storage.incrementPluginDownloads(pluginId);

      res.json({ 
        success: true, 
        message: "Download recorded",
        downloadUrl: `/api/plugins/${pluginId}/download`
      });
    } catch (error) {
      console.error('Error recording plugin download:', error);
      res.status(500).json({ message: "Failed to record download" });
    }
  });

  // Plugin image serving endpoint
  app.get("/api/plugins/image/*", async (req, res) => {
    try {
      // Extract the image path from URL
      const imagePath = req.params[0];
      console.log('[Plugin Image] Request for image:', imagePath);
      
      if (!imagePath) {
        return res.status(404).json({ message: "Image path not provided" });
      }

      // Security check - ensure path doesn't escape plugins directory
      const normalizedPath = path.normalize(imagePath);
      if (normalizedPath.includes('..')) {
        console.error('[Plugin Image] Invalid path attempted:', normalizedPath);
        return res.status(403).json({ message: "Invalid image path" });
      }

      // Construct full path
      const fullPath = path.join(process.cwd(), 'plugins', normalizedPath);
      console.log('[Plugin Image] Full image path:', fullPath);

      // Check if file exists
      if (!fs.existsSync(fullPath)) {
        console.error('[Plugin Image] Image not found:', fullPath);
        return res.status(404).json({ message: "Image not found" });
      }

      // Determine content type based on extension
      const ext = path.extname(fullPath).toLowerCase();
      const contentTypes: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp'
      };

      const contentType = contentTypes[ext] || 'application/octet-stream';
      
      // Set headers
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
      
      // Stream the image
      const imageStream = fs.createReadStream(fullPath);
      imageStream.pipe(res);
      
      console.log('[Plugin Image] ✓ Serving image:', normalizedPath);
    } catch (error) {
      console.error('[Plugin Image] Error:', error);
      res.status(500).json({ message: "Failed to serve image" });
    }
  });

  // Plugin Library Registration
  app.post("/api/plugin-library-register", async (req, res) => {
    try {
      const { firstName, lastName, email, country, password } = req.body;
      
      console.log('[Plugin Library Registration API] ===== START PLUGIN LIBRARY REGISTRATION =====');
      console.log('[Plugin Library Registration API] Received registration data:', {
        firstName,
        lastName, 
        email,
        country,
        passwordProvided: !!password
      });

      // Validate required fields
      if (!firstName || !lastName || !email || !country || !password) {
        console.error('[Plugin Library Registration API] ERROR: Missing required fields');
        return res.status(400).json({ 
          message: "All fields are required",
          missing: {
            firstName: !firstName,
            lastName: !lastName,
            email: !email,
            country: !country,
            password: !password
          }
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        console.error('[Plugin Library Registration API] ERROR: Invalid email format:', email);
        return res.status(400).json({ message: "Invalid email format" });
      }

      // Check if user already exists with this email
      console.log('[Plugin Library Registration API] Checking if user exists with email:', email);
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        console.error('[Plugin Library Registration API] ERROR: User already exists with email:', email);
        return res.status(400).json({ message: "User with this email already exists" });
      }

      // Generate username from email or name
      const username = email.split('@')[0] + Math.random().toString(36).substring(2, 7);
      console.log('[Plugin Library Registration API] Generated username:', username);

      // Create user account
      console.log('[Plugin Library Registration API] Creating new user account...');
      const userData = {
        username,
        email,
        firstName,
        lastName,
        password, // Will be hashed in storage
        displayPassword: password, // Store for display purposes
        country,
        role: "client" as const,
        isAnonymous: false
      };

      const newUser = await storage.createUser(userData);
      console.log('[Plugin Library Registration API] ✓ Successfully created user with ID:', newUser.id);

      // Remove password from response
      const responseUser = {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        isAnonymous: newUser.isAnonymous,
        displayPassword: password
      };

      console.log('[Plugin Library Registration API] ✓ Registration completed successfully');
      console.log('[Plugin Library Registration API] ===== END PLUGIN LIBRARY REGISTRATION =====');

      res.json({
        success: true,
        message: "Plugin library registration successful",
        user: responseUser
      });

    } catch (error) {
      console.error('[Plugin Library Registration API] ===== CRITICAL ERROR IN PLUGIN LIBRARY REGISTRATION =====');
      console.error('[Plugin Library Registration API] Error type:', error?.constructor?.name);
      console.error('[Plugin Library Registration API] Error message:', error?.message);
      console.error('[Plugin Library Registration API] Full error object:', error);
      console.error('[Plugin Library Registration API] Stack trace:', error?.stack);
      console.error('[Plugin Library Registration API] Request body was:', req.body);
      console.error('[Plugin Library Registration API] ===== END CRITICAL ERROR =====');
      
      res.status(500).json({ 
        message: "Registration failed due to internal error",
        details: error?.message
      });
    }
  });

  // cPanel login endpoint
  app.post("/api/cpanel-login", isAuthenticated, async (req, res) => {
    try {
      const { domain } = req.body;
      console.log(`[cPanel Login API] ===== START CPANEL LOGIN =====`);
      console.log(`[cPanel Login API] Requested domain: ${domain}`);
      console.log(`[cPanel Login API] User ID: ${req.user?.id}, Role: ${req.user?.role}`);

      if (!domain) {
        console.log(`[cPanel Login API] Error: No domain provided`);
        return res.status(400).json({ 
          success: false,
          message: "Domain is required",
          error: "Missing domain parameter"
        });
      }

      // Find the hosting account for this domain
      let hostingAccount;
      if (req.user?.role === 'admin') {
        // Admin can access any account by domain
        console.log(`[cPanel Login API] Admin access - searching for account by domain`);
        const allUsers = await storage.getAllUsers();
        for (const user of allUsers) {
          const userAccounts = await storage.getHostingAccountsByUserId(user.id);
          const foundAccount = userAccounts.find(acc => acc.domain === domain);
          if (foundAccount) {
            hostingAccount = foundAccount;
            console.log(`[cPanel Login API] Found account for domain ${domain}, owner: ${user.username}`);
            break;
          }
        }
      } else {
        // Regular user can only access their own accounts
        console.log(`[cPanel Login API] User access - searching user's accounts`);
        const userAccounts = await storage.getHostingAccountsByUserId(req.user.id);
        hostingAccount = userAccounts.find(acc => acc.domain === domain);
        if (hostingAccount) {
          console.log(`[cPanel Login API] Found user's account for domain ${domain}`);
        }
      }

      if (!hostingAccount) {
        console.log(`[cPanel Login API] Error: No hosting account found for domain ${domain}`);
        return res.status(404).json({ 
          success: false,
          message: `No hosting account found for domain: ${domain}`,
          error: "Account not found"
        });
      }

      console.log(`[cPanel Login API] Account status: ${hostingAccount.status}`);
      console.log(`[cPanel Login API] Has cpanelUsername: ${!!hostingAccount.cpanelUsername}`);
      console.log(`[cPanel Login API] Has cpanelPassword: ${!!hostingAccount.cpanelPassword}`);

      // Check if account has cPanel credentials
      if (!hostingAccount.cpanelUsername || !hostingAccount.cpanelPassword) {
        console.log(`[cPanel Login API] Error: Account missing cPanel credentials`);
        return res.status(400).json({ 
          success: false,
          message: `cPanel credentials not available for ${domain}`,
          error: "Missing cPanel credentials",
          debug: {
            accountId: hostingAccount.id,
            status: hostingAccount.status,
            hasCpanelUsername: !!hostingAccount.cpanelUsername,
            hasCpanelPassword: !!hostingAccount.cpanelPassword
          }
        });
      }

      // Generate cPanel auto-login URL
      const apiSettings = await storage.getApiSettings();
      if (!apiSettings || !apiSettings.whmApiUrl || !apiSettings.whmApiToken) {
        console.log(`[cPanel Login API] Error: WHM API settings not configured`);
        return res.status(500).json({ 
          success: false,
          message: "Server configuration incomplete - contact administrator",
          error: "WHM API settings missing"
        });
      }

      console.log(`[cPanel Login API] Attempting cPanel auto-login for user: ${hostingAccount.cpanelUsername}`);

      // Try to create a WHM session for auto-login
      try {
        // Extract base URL properly - parse the full URL to get just the protocol and host
        const apiUrl = new URL(apiSettings.whmApiUrl);
        const baseUrl = `${apiUrl.protocol}//${apiUrl.hostname}`;
        
        // Create the correct WHM API URL with query parameters
        const createSessionUrl = `${baseUrl}:2087/json-api/create_user_session?api.version=1&user=${hostingAccount.cpanelUsername}&service=cpaneld`;
        const authHeader = `whm root:${apiSettings.whmApiToken}`;

        console.log(`[cPanel Login API] Base URL extracted: ${baseUrl}`);
        console.log(`[cPanel Login API] Making WHM create_user_session request to: ${createSessionUrl}`);

        const sessionResponse = await fetch(createSessionUrl, {
          method: 'GET',
          headers: {
            'Authorization': authHeader
          }
        });

        const sessionData = await sessionResponse.json();
        console.log(`[cPanel Login API] WHM session response:`, {
          status: sessionResponse.status,
          ok: sessionResponse.ok,
          data: sessionData
        });

        if (sessionResponse.ok && sessionData.data && sessionData.data.url) {
          // Auto-login successful
          const loginUrl = sessionData.data.url;
          console.log(`[cPanel Login API] ✓ Auto-login URL generated: ${loginUrl}`);
          console.log(`[cPanel Login API] ===== END CPANEL LOGIN (SUCCESS) =====`);

          return res.json({
            success: true,
            message: `Opening cPanel for ${domain}`,
            loginUrl: loginUrl,
            username: hostingAccount.cpanelUsername,
            autoLogin: true
          });
        } else {
          // Auto-login failed, fall back to manual login
          console.log(`[cPanel Login API] Auto-login failed, providing manual login info`);
          const cpanelUrl = `${baseUrl}:2083`;
          console.log(`[cPanel Login API] Manual cPanel URL: ${cpanelUrl}`);
          
          console.log(`[cPanel Login API] ===== END CPANEL LOGIN (MANUAL FALLBACK) =====`);
          return res.json({
            success: true,
            message: `Manual cPanel login required for ${domain}`,
            loginUrl: cpanelUrl,
            username: hostingAccount.cpanelUsername,
            autoLogin: false,
            debug: {
              whmResponse: sessionData,
              fallbackReason: "WHM auto-login failed"
            }
          });
        }
      } catch (whmError) {
        console.error(`[cPanel Login API] WHM API error:`, whmError);
        
        // Fall back to manual login
        const apiUrl = new URL(apiSettings.whmApiUrl);
        const baseUrl = `${apiUrl.protocol}//${apiUrl.hostname}`;
        const cpanelUrl = `${baseUrl}:2083`;
        console.log(`[cPanel Login API] Error fallback - Base URL: ${baseUrl}`);
        console.log(`[cPanel Login API] Error fallback - cPanel URL: ${cpanelUrl}`);
        console.log(`[cPanel Login API] ===== END CPANEL LOGIN (ERROR FALLBACK) =====`);
        
        return res.json({
          success: true,
          message: `Manual cPanel login for ${domain}`,
          loginUrl: cpanelUrl,
          username: hostingAccount.cpanelUsername,
          autoLogin: false,
          debug: {
            error: whmError.message,
            fallbackReason: "WHM API connection failed"
          }
        });
      }

    } catch (error) {
      console.error(`[cPanel Login API] ===== CRITICAL ERROR IN CPANEL LOGIN =====`);
      console.error(`[cPanel Login API] Error type:`, error?.constructor?.name);
      console.error(`[cPanel Login API] Error message:`, error?.message);
      console.error(`[cPanel Login API] Full error object:`, error);
      console.error(`[cPanel Login API] Stack trace:`, error?.stack);
      console.error(`[cPanel Login API] Request body:`, req.body);
      console.error(`[cPanel Login API] ===== END CRITICAL ERROR =====`);
      
      res.status(500).json({ 
        success: false,
        message: "cPanel login failed due to internal error",
        error: error?.message || "Unknown error",
        debug: {
          errorType: error?.constructor?.name,
          timestamp: new Date().toISOString()
        }
      });
    }
  });

  // Fix WHM account - recreate missing WHM account for existing database record
  app.post("/api/admin/fix-whm-account/:accountId", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const accountId = parseInt(req.params.accountId);
      console.log(`[Fix WHM Account API] ===== START FIX WHM ACCOUNT =====`);
      console.log(`[Fix WHM Account API] Account ID: ${accountId}`);

      if (!accountId || isNaN(accountId)) {
        console.log(`[Fix WHM Account API] Error: Invalid account ID`);
        return res.status(400).json({ 
          success: false,
          message: "Invalid account ID",
          error: "Account ID must be a valid number"
        });
      }

      // Get the hosting account
      const hostingAccount = await storage.getHostingAccountById(accountId);
      if (!hostingAccount) {
        console.log(`[Fix WHM Account API] Error: Account not found`);
        return res.status(404).json({ 
          success: false,
          message: "Hosting account not found",
          error: "Account does not exist"
        });
      }

      console.log(`[Fix WHM Account API] Found account: ${hostingAccount.domain}`);
      console.log(`[Fix WHM Account API] Current status: ${hostingAccount.status}`);
      console.log(`[Fix WHM Account API] Has cPanel credentials: ${!!hostingAccount.cpanelUsername}`);

      // Get user information
      const user = await storage.getUser(hostingAccount.userId);
      if (!user) {
        console.log(`[Fix WHM Account API] Error: User not found`);
        return res.status(404).json({ 
          success: false,
          message: "Account owner not found",
          error: "User does not exist"
        });
      }

      console.log(`[Fix WHM Account API] Account owner: ${user.username}`);

      // Get API settings for WHM integration
      const apiSettings = await storage.getApiSettings();
      if (!apiSettings || !apiSettings.whmApiUrl || !apiSettings.whmApiToken) {
        console.log(`[Fix WHM Account API] Error: WHM API settings not configured`);
        return res.status(500).json({ 
          success: false,
          message: "Please configure WHM API settings in Admin Dashboard → API Settings tab",
          error: "WHM API settings not configured"
        });
      }

      console.log(`[Fix WHM Account API] Using WHM API: ${apiSettings.whmApiUrl}`);

      // Generate username for WHM (same logic as account creation)
      const subdomain = hostingAccount.domain.replace('.hostme.today', '');
      let whmUsername = subdomain;
      
      // Ensure username starts with a letter (WHM requirement)
      if (/^\d/.test(whmUsername)) {
        whmUsername = 'h' + whmUsername;
      }
      
      // Limit to 16 characters for cPanel
      if (whmUsername.length > 16) {
        whmUsername = whmUsername.substring(0, 16);
      }

      console.log(`[Fix WHM Account API] Generated WHM username: ${whmUsername}`);

      // Create account on WHM server
      try {
        const baseUrl = apiSettings.whmApiUrl.replace(/\/+$/, '');
        const createAccountUrl = `${baseUrl}/createacct?api.version=1`;
        const authHeader = `whm root:${apiSettings.whmApiToken}`;

        const whmPassword = Math.random().toString(36).slice(-8) + 'A1!';
        console.log(`[Fix WHM Account API] Creating WHM account with username: ${whmUsername}`);
        console.log(`[Fix WHM Account API] Using URL: ${createAccountUrl}`);

        // Get the hosting package to get the correct WHM package name
        const hostingPackage = await storage.getHostingPackageById(hostingAccount.packageId);
        if (!hostingPackage) {
          console.error(`[Fix WHM Account API] Package not found for ID: ${hostingAccount.packageId}`);
          return res.status(400).json({ error: "Hosting package not found" });
        }
        const whmPackageName = hostingPackage.whmPackageName;
        
        console.log(`[Fix WHM Account API] Using WHM package: ${whmPackageName}`);

        const whmFormData = new URLSearchParams({
          username: whmUsername,
          password: whmPassword,
          domain: hostingAccount.domain,
          email: user.email || `${whmUsername}@${hostingAccount.domain}`,
          plan: whmPackageName,
          ip: 'n', // Use shared IP
          cgi: '1',
          frontpage: '0',
          hasagreestotearms: '1'
        });

        console.log(`[Fix WHM Account API] Making request with Authorization: ${authHeader}`);
        const whmResponse = await fetch(createAccountUrl, {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: whmFormData.toString()
        });

        console.log(`[Fix WHM Account API] Response status: ${whmResponse.status}`);
        console.log(`[Fix WHM Account API] Response headers:`, Object.fromEntries(whmResponse.headers.entries()));
        
        const responseText = await whmResponse.text();
        console.log(`[Fix WHM Account API] Raw response: ${responseText.substring(0, 500)}...`);
        
        let whmData;
        try {
          whmData = JSON.parse(responseText);
        } catch (parseError) {
          console.error(`[Fix WHM Account API] Failed to parse JSON response:`, parseError);
          console.error(`[Fix WHM Account API] Response was: ${responseText}`);
          throw new Error(`WHM API returned invalid JSON: ${responseText.substring(0, 100)}...`);
        }
        console.log(`[Fix WHM Account API] WHM response:`, {
          status: whmResponse.status,
          ok: whmResponse.ok,
          data: whmData
        });

        // Check if WHM account creation was successful
        let success = false;
        if (whmResponse.ok && whmData) {
          // Check multiple success indicators like the working account creation endpoint
          if (whmData.metadata && whmData.metadata.result === 1) {
            success = true;
          }
        }

        if (!success) {
          const errorMsg = whmData?.metadata?.reason || whmData?.data?.result?.[0]?.statusmsg || 'Unknown WHM error';
          console.log(`[Fix WHM Account API] WHM account creation failed: ${errorMsg}`);
          console.log(`[Fix WHM Account API] ===== END FIX WHM ACCOUNT (WHM ERROR) =====`);
          
          return res.status(500).json({
            success: false,
            message: `Failed to create WHM account: ${errorMsg}`,
            error: errorMsg,
            debug: {
              whmResponse: whmData,
              accountId: accountId,
              domain: hostingAccount.domain,
              username: whmUsername
            }
          });
        }

        if (success) {
          // Update the database with WHM credentials
          const updatedAccount = await storage.updateHostingAccount(accountId, {
            cpanelUsername: whmUsername,
            cpanelPassword: whmPassword,
            status: 'active',
            whmAccountId: whmUsername
          });

          console.log(`[Fix WHM Account API] ✓ Successfully fixed WHM account`);
          console.log(`[Fix WHM Account API] ===== END FIX WHM ACCOUNT (SUCCESS) =====`);

          return res.json({
            success: true,
            message: `Successfully fixed WHM account for ${hostingAccount.domain}`,
            account: updatedAccount,
            credentials: {
              username: whmUsername,
              password: whmPassword,
              domain: hostingAccount.domain
            }
          });
        } else {
          console.log(`[Fix WHM Account API] WHM account creation failed`);
          console.log(`[Fix WHM Account API] ===== END FIX WHM ACCOUNT (FAILED) =====`);

          return res.status(500).json({
            success: false,
            message: `Failed to create WHM account for ${hostingAccount.domain}`,
            error: "WHM account creation failed",
            debug: {
              whmResponse: whmData,
              username: whmUsername
            }
          });
        }

      } catch (whmError) {
        console.error(`[Fix WHM Account API] WHM API error:`, whmError);
        console.log(`[Fix WHM Account API] ===== END FIX WHM ACCOUNT (ERROR) =====`);

        return res.status(500).json({
          success: false,
          message: `Failed to connect to WHM server`,
          error: whmError.message,
          debug: {
            username: whmUsername,
            errorType: whmError.constructor.name
          }
        });
      }

    } catch (error) {
      console.error(`[Fix WHM Account API] ===== CRITICAL ERROR IN FIX WHM ACCOUNT =====`);
      console.error(`[Fix WHM Account API] Error type:`, error?.constructor?.name);
      console.error(`[Fix WHM Account API] Error message:`, error?.message);
      console.error(`[Fix WHM Account API] Full error object:`, error);
      console.error(`[Fix WHM Account API] Stack trace:`, error?.stack);
      console.error(`[Fix WHM Account API] Account ID:`, req.params.accountId);
      console.error(`[Fix WHM Account API] ===== END CRITICAL ERROR =====`);
      
      res.status(500).json({ 
        success: false,
        message: "Failed to fix WHM account due to internal error",
        error: error?.message || "Unknown error",
        debug: {
          errorType: error?.constructor?.name,
          timestamp: new Date().toISOString()
        }
      });
    }
  });

  // Get hosting account statistics from WHM API
  app.get("/api/hosting-accounts/:id/stats", isAuthenticated, async (req: any, res) => {
    try {
      const accountId = parseInt(req.params.id);
      console.log(`[Hosting Stats API] ===== START HOSTING STATS FETCH =====`);
      console.log(`[Hosting Stats API] Account ID: ${accountId}`);
      console.log(`[Hosting Stats API] User ID: ${req.user?.id}`);

      // Get the hosting account
      const hostingAccount = await storage.getHostingAccountById(accountId);
      if (!hostingAccount) {
        console.log(`[Hosting Stats API] Account not found`);
        return res.status(404).json({ 
          success: false,
          message: "Hosting account not found",
          source: 'error'
        });
      }

      // Check if user owns this account (unless admin)
      if (req.user.role !== 'admin' && hostingAccount.userId !== req.user.id) {
        console.log(`[Hosting Stats API] Unauthorized access attempt`);
        return res.status(403).json({ 
          success: false,
          message: "Unauthorized access",
          source: 'error'
        });
      }

      // Get API settings
      const apiSettings = await storage.getApiSettings();
      if (!apiSettings?.whmApiUrl || !apiSettings?.whmApiToken) {
        console.log(`[Hosting Stats API] WHM API not configured, returning default stats`);
        return res.json({
          source: 'default',
          error: 'WHM API not configured',
          diskUsage: 0,
          diskLimit: 5120,
          bandwidthUsed: 0,
          bandwidthLimit: 10240,
          emailAccounts: 0,
          emailLimit: 10,
          databases: 0,
          databaseLimit: 5,
          subdomains: 0,
          subdomainLimit: 10,
          ftpAccounts: 0,
          ftpAccountLimit: 5,
          addonDomains: 0,
          addonDomainLimit: 0,
          parkDomains: 0,
          parkDomainLimit: 0,
          lastUpdate: new Date().toISOString()
        });
      }

      // Generate the correct username from domain
      const subdomain = hostingAccount.domain.replace('.hostme.today', '');
      let whmUsername = subdomain;
      
      // Ensure username starts with a letter (WHM requirement)
      if (/^\d/.test(whmUsername)) {
        whmUsername = 'h' + whmUsername;
      }
      
      // Limit to 16 characters for cPanel
      if (whmUsername.length > 16) {
        whmUsername = whmUsername.substring(0, 16);
      }

      console.log(`[Hosting Stats API] Using WHM username: ${whmUsername}`);

      try {
        // Call WHM API to get account information
        const baseUrl = apiSettings.whmApiUrl.replace(/\/+$/, '');
        const accountSummaryUrl = `${baseUrl}/accountsummary?api.version=1&user=${whmUsername}`;
        const authHeader = `whm root:${apiSettings.whmApiToken}`;

        console.log(`[Hosting Stats API] Fetching from WHM: ${accountSummaryUrl}`);

        const whmResponse = await fetch(accountSummaryUrl, {
          method: 'GET',
          headers: {
            'Authorization': authHeader
          }
        });

        if (!whmResponse.ok) {
          console.log(`[Hosting Stats API] WHM API error: ${whmResponse.status}`);
          throw new Error(`WHM API returned ${whmResponse.status}`);
        }

        const whmData = await whmResponse.json();
        console.log(`[Hosting Stats API] WHM response received:`, {
          status: whmResponse.status,
          hasData: !!whmData?.data,
          hasAcctInfo: !!whmData?.data?.acct
        });

        if (whmData?.data?.acct && whmData.data.acct.length > 0) {
          const acctInfo = whmData.data.acct[0];
          console.log(`[Hosting Stats API] ✓ Successfully retrieved WHM data for ${whmUsername}`);

          // Extract all available stats from WHM response
          const stats = {
            source: 'whm_api',
            // Disk usage (convert from MB strings to numbers)
            diskUsage: parseInt(acctInfo.diskused?.replace('M', '') || '0'),
            diskLimit: acctInfo.disklimit === 'unlimited' ? 999999 : parseInt(acctInfo.disklimit?.replace('M', '') || '5120'),
            
            // Bandwidth (already in MB)
            bandwidthUsed: parseInt(acctInfo.diskused || '0'), // WHM often reports disk as bandwidth
            bandwidthLimit: acctInfo.bwlimit === 'unlimited' ? 999999 : parseInt(acctInfo.bwlimit || '10240'),
            
            // Email accounts
            emailAccounts: parseInt(acctInfo.email_quota?.used || '0'),
            emailLimit: acctInfo.maxpop === 'unlimited' ? 999 : parseInt(acctInfo.maxpop || '10'),
            
            // Databases
            databases: parseInt(acctInfo.mysql_disk_usage ? '1' : '0'), // Estimate based on usage
            databaseLimit: acctInfo.maxsql === 'unlimited' ? 999 : parseInt(acctInfo.maxsql || '5'),
            
            // Subdomains
            subdomains: parseInt(acctInfo.subdomains_used || '0'),
            subdomainLimit: acctInfo.maxsub === 'unlimited' ? 999 : parseInt(acctInfo.maxsub || '10'),
            
            // FTP accounts
            ftpAccounts: parseInt(acctInfo.ftpaccounts || '0'),
            ftpAccountLimit: acctInfo.maxftp === 'unlimited' ? 999 : parseInt(acctInfo.maxftp || '5'),
            
            // Addon domains
            addonDomains: parseInt(acctInfo.addondomains_used || '0'),
            addonDomainLimit: acctInfo.maxaddon === 'unlimited' ? 999 : parseInt(acctInfo.maxaddon || '0'),
            
            // Parked domains
            parkDomains: parseInt(acctInfo.parkeddomains_used || '0'),
            parkDomainLimit: acctInfo.maxpark === 'unlimited' ? 999 : parseInt(acctInfo.maxpark || '0'),
            
            // Additional info
            ip: acctInfo.ip || 'Shared',
            packageName: acctInfo.plan || 'Unknown',
            suspended: acctInfo.suspended === 1 || acctInfo.suspendreason !== 'not suspended',
            suspendReason: acctInfo.suspendreason,
            lastUpdate: new Date().toISOString(),
            
            // Include raw data for debugging
            _raw: acctInfo
          };

          console.log(`[Hosting Stats API] Returning comprehensive WHM stats`);
          console.log(`[Hosting Stats API] ===== END HOSTING STATS FETCH (SUCCESS) =====`);
          return res.json(stats);
        } else {
          console.log(`[Hosting Stats API] No account data in WHM response`);
          throw new Error('No account data returned from WHM');
        }

      } catch (whmError) {
        console.error(`[Hosting Stats API] WHM API error:`, whmError);
        console.log(`[Hosting Stats API] Falling back to database values`);
        
        // Return database values as fallback
        const fallbackStats = {
          source: 'database_fallback',
          error: `WHM API error: ${whmError.message}`,
          diskUsage: hostingAccount.diskUsage || 0,
          diskLimit: hostingAccount.diskLimit || 5120,
          bandwidthUsed: hostingAccount.bandwidthUsed || 0,
          bandwidthLimit: hostingAccount.bandwidthLimit || 10240,
          emailAccounts: 0,
          emailLimit: 10,
          databases: 0,
          databaseLimit: 5,
          subdomains: 0,
          subdomainLimit: 10,
          ftpAccounts: 0,
          ftpAccountLimit: 5,
          addonDomains: 0,
          addonDomainLimit: 0,
          parkDomains: 0,
          parkDomainLimit: 0,
          lastUpdate: new Date().toISOString()
        };

        console.log(`[Hosting Stats API] ===== END HOSTING STATS FETCH (FALLBACK) =====`);
        return res.json(fallbackStats);
      }

    } catch (error) {
      console.error(`[Hosting Stats API] ===== CRITICAL ERROR IN STATS FETCH =====`);
      console.error(`[Hosting Stats API] Error:`, error);
      console.error(`[Hosting Stats API] ===== END CRITICAL ERROR =====`);
      
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch hosting statistics",
        error: error?.message || "Unknown error",
        source: 'error'
      });
    }
  });

  // Create and return the HTTP server (required for Vite HMR)
  const server = createServer(app);
  return server;
}