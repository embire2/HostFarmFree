import {
  users,
  hostingAccounts,
  plugins,
  pluginDownloads,
  donations,
  apiSettings,
  hostingPackages,
  packageUsage,
  userGroups,
  deviceFingerprints,
  facebookPixelSettings,
  pluginRequests,
  smtpSettings,
  customHeaderCode,
  vpsPackages,
  vpsInstances,
  vpsOrders,
  stripeSettings,
  type User,
  type InsertUser,
  type HostingAccount,
  type InsertHostingAccount,
  type Plugin,
  type InsertPlugin,
  type PluginDownload,
  type Donation,
  type InsertDonation,
  type ApiSettings,
  type InsertApiSettings,
  type HostingPackage,
  type InsertHostingPackage,
  type PackageUsage,
  type InsertPackageUsage,
  type UserGroup,
  type InsertUserGroup,
  type DeviceFingerprint,
  type InsertDeviceFingerprint,
  type FacebookPixelSettings,
  type InsertFacebookPixelSettings,
  type PluginRequest,
  type InsertPluginRequest,
  type SmtpSettings,
  type InsertSmtpSettings,
  type CustomHeaderCode,
  type InsertCustomHeaderCode,
  type VpsPackage,
  type InsertVpsPackage,
  type VpsInstance,
  type InsertVpsInstance,
  type VpsOrder,
  type InsertVpsOrder,
  type StripeSettings,
  type InsertStripeSettings,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, ilike, and, sql, max } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByRecoveryPhrase(recoveryPhrase: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined>;
  updateUserEmail(id: number, email: string): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;

  // Hosting account operations
  createHostingAccount(account: InsertHostingAccount): Promise<HostingAccount>;
  getHostingAccountsByUserId(userId: number): Promise<HostingAccount[]>;
  getHostingAccountByDomain(domain: string): Promise<HostingAccount | undefined>;
  updateHostingAccountUsage(id: number, diskUsage: number, bandwidthUsed: number): Promise<void>;
  updateHostingAccount(id: number, updates: Partial<InsertHostingAccount>): Promise<HostingAccount | undefined>;
  deleteHostingAccount(id: number): Promise<boolean>;

  // Plugin operations
  createPlugin(plugin: InsertPlugin): Promise<Plugin>;
  getPlugins(category?: string, search?: string): Promise<Plugin[]>;
  getPublicPlugins(): Promise<Plugin[]>;
  getPluginById(id: number): Promise<Plugin | undefined>;
  getPluginBySlug(slug: string): Promise<Plugin | undefined>;
  updatePlugin(id: number, updates: Partial<InsertPlugin>): Promise<Plugin | undefined>;
  deletePlugin(id: number): Promise<boolean>;
  incrementPluginDownloads(pluginId: number): Promise<void>;
  recordPluginDownload(pluginId: number, userId: number): Promise<void>;
  getPluginDownloadsByUser(userId: number): Promise<PluginDownload[]>;

  // Donation operations
  createDonation(donation: InsertDonation): Promise<Donation>;
  getDonations(): Promise<Donation[]>;

  // API Settings operations
  getApiSettings(): Promise<ApiSettings | undefined>;
  upsertApiSettings(settings: InsertApiSettings): Promise<ApiSettings>;
  
  // Package Management operations
  createHostingPackage(packageData: InsertHostingPackage): Promise<HostingPackage>;
  getHostingPackages(): Promise<HostingPackage[]>;
  getHostingPackageById(id: number): Promise<HostingPackage | undefined>;
  updateHostingPackage(id: number, packageData: Partial<InsertHostingPackage>): Promise<HostingPackage>;
  deleteHostingPackage(id: number): Promise<void>;
  getActiveHostingPackages(): Promise<HostingPackage[]>;
  getFreeHostingPackage(): Promise<HostingPackage | undefined>;
  
  // Package Usage operations
  createPackageUsage(usageData: InsertPackageUsage): Promise<PackageUsage>;
  getPackageUsageByAccountId(accountId: number): Promise<PackageUsage | undefined>;
  updatePackageUsage(accountId: number, usageData: Partial<InsertPackageUsage>): Promise<PackageUsage>;
  
  // WHM Package operations
  getWHMPackages(): Promise<any[]>; // Will fetch from WHM API
  
  // User Groups operations
  createUserGroup(group: InsertUserGroup): Promise<UserGroup>;
  getUserGroups(): Promise<UserGroup[]>;
  getUserGroupById(id: number): Promise<UserGroup | undefined>;
  getUserGroupByName(name: string): Promise<UserGroup | undefined>;
  updateUserGroup(id: number, updates: Partial<InsertUserGroup>): Promise<UserGroup | undefined>;
  deleteUserGroup(id: number): Promise<boolean>;
  
  // VPS Package operations
  createVpsPackage(packageData: InsertVpsPackage): Promise<VpsPackage>;
  getVpsPackages(): Promise<VpsPackage[]>;
  getVpsPackageById(id: number): Promise<VpsPackage | undefined>;
  updateVpsPackage(id: number, updates: Partial<InsertVpsPackage>): Promise<VpsPackage | undefined>;
  deleteVpsPackage(id: number): Promise<boolean>;
  
  // VPS Instance operations
  createVpsInstance(instanceData: InsertVpsInstance): Promise<VpsInstance>;
  getVpsInstances(): Promise<VpsInstance[]>;
  getVpsInstanceById(id: number): Promise<VpsInstance | undefined>;
  getVpsInstancesByUserId(userId: number): Promise<VpsInstance[]>;
  updateVpsInstance(id: number, updates: Partial<InsertVpsInstance>): Promise<VpsInstance | undefined>;
  deleteVpsInstance(id: number): Promise<boolean>;
  
  // Device Fingerprint operations  
  createDeviceFingerprint(fingerprint: InsertDeviceFingerprint): Promise<DeviceFingerprint>;
  getDeviceFingerprintsByUserId(userId: number): Promise<DeviceFingerprint[]>;
  getDeviceFingerprintByHash(hash: string): Promise<DeviceFingerprint | undefined>;
  updateDeviceFingerprint(id: number, updates: Partial<InsertDeviceFingerprint>): Promise<DeviceFingerprint | undefined>;
  deleteDeviceFingerprint(id: number): Promise<boolean>;
  getDeviceCountByFingerprint(fingerprintHash: string): Promise<number>;
  
  // Group Policy operations
  getUserGroupLimits(userId: number): Promise<{
    maxHostingAccounts: number;
    maxDevices: number;
    currentHostingAccounts: number;
    currentDevices: number;
  }>;
  
  // Facebook Pixel Settings operations
  getFacebookPixelSettings(): Promise<FacebookPixelSettings | undefined>;
  upsertFacebookPixelSettings(settings: InsertFacebookPixelSettings): Promise<FacebookPixelSettings>;
  deleteFacebookPixelSettings(): Promise<boolean>;
  
  // Plugin Request operations
  createPluginRequest(request: InsertPluginRequest): Promise<PluginRequest>;
  getPluginRequests(): Promise<PluginRequest[]>;
  getPluginRequestsByUserId(userId: number): Promise<PluginRequest[]>;
  getUserPluginRequestsToday(userId: number): Promise<number>;
  updatePluginRequestStatus(id: number, status: string): Promise<PluginRequest | undefined>;
  deletePluginRequest(id: number): Promise<boolean>;
  
  // SMTP Settings operations
  getSmtpSettings(): Promise<SmtpSettings | undefined>;
  upsertSmtpSettings(settings: InsertSmtpSettings): Promise<SmtpSettings>;
  deleteSmtpSettings(): Promise<boolean>;
  
  // Custom Header Code operations
  getCustomHeaderCodes(): Promise<CustomHeaderCode[]>;
  getCustomHeaderCodeById(id: number): Promise<CustomHeaderCode | undefined>;
  createCustomHeaderCode(code: InsertCustomHeaderCode): Promise<CustomHeaderCode>;
  updateCustomHeaderCode(id: number, updates: Partial<InsertCustomHeaderCode>): Promise<CustomHeaderCode | undefined>;
  deleteCustomHeaderCode(id: number): Promise<boolean>;
  
  // Statistics
  getStats(): Promise<{
    totalUsers: number;
    totalPlugins: number;
    totalWebsites: number;
    totalDonations: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByRecoveryPhrase(recoveryPhrase: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.recoveryPhrase, recoveryPhrase));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt));
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserEmail(id: number, email: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        email,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: number): Promise<boolean> {
    try {
      await db
        .delete(users)
        .where(eq(users.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  // Hosting account operations
  async createHostingAccount(account: InsertHostingAccount): Promise<HostingAccount> {
    const [hostingAccount] = await db
      .insert(hostingAccounts)
      .values(account)
      .returning();
    return hostingAccount;
  }

  async getHostingAccountsByUserId(userId: number): Promise<HostingAccount[]> {
    return await db
      .select()
      .from(hostingAccounts)
      .where(eq(hostingAccounts.userId, userId))
      .orderBy(desc(hostingAccounts.createdAt));
  }

  async getHostingAccountByDomain(domain: string): Promise<HostingAccount | undefined> {
    const [account] = await db
      .select({
        id: hostingAccounts.id,
        userId: hostingAccounts.userId,
        packageId: hostingAccounts.packageId,
        domain: hostingAccounts.domain,
        subdomain: hostingAccounts.subdomain,
        cpanelUsername: hostingAccounts.cpanelUsername,
        cpanelPassword: hostingAccounts.cpanelPassword,
        whmAccountId: hostingAccounts.whmAccountId,
        status: hostingAccounts.status,
        diskUsage: hostingAccounts.diskUsage,
        diskLimit: hostingAccounts.diskLimit,
        bandwidthUsed: hostingAccounts.bandwidthUsed,
        bandwidthLimit: hostingAccounts.bandwidthLimit,
        createdAt: hostingAccounts.createdAt,
        updatedAt: hostingAccounts.updatedAt,
      })
      .from(hostingAccounts)
      .where(eq(hostingAccounts.domain, domain));
    return account;
  }

  async updateHostingAccountUsage(
    id: number,
    diskUsage: number,
    bandwidthUsed: number
  ): Promise<void> {
    await db
      .update(hostingAccounts)
      .set({ diskUsage, bandwidthUsed, updatedAt: new Date() })
      .where(eq(hostingAccounts.id, id));
  }

  async updateHostingAccount(id: number, updates: Partial<InsertHostingAccount>): Promise<HostingAccount | undefined> {
    const [updatedAccount] = await db
      .update(hostingAccounts)
      .set({ 
        ...updates,
        updatedAt: new Date() 
      })
      .where(eq(hostingAccounts.id, id))
      .returning();
    return updatedAccount;
  }

  async deleteHostingAccount(id: number): Promise<boolean> {
    try {
      await db
        .delete(hostingAccounts)
        .where(eq(hostingAccounts.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting hosting account:', error);
      return false;
    }
  }

  // Plugin operations
  async createPlugin(plugin: InsertPlugin): Promise<Plugin> {
    const [newPlugin] = await db.insert(plugins).values(plugin).returning();
    return newPlugin;
  }

  async getPlugins(category?: string, search?: string): Promise<Plugin[]> {
    let query = db.select().from(plugins);
    let conditions = [eq(plugins.isActive, true)];

    if (category && category !== "all") {
      conditions.push(eq(plugins.category, category));
    }

    if (search) {
      conditions.push(ilike(plugins.name, `%${search}%`));
    }

    return await query
      .where(and(...conditions))
      .orderBy(desc(plugins.downloadCount));
  }

  async getPublicPlugins(): Promise<Plugin[]> {
    return await db.select().from(plugins)
      .where(and(
        eq(plugins.isActive, true),
        eq(plugins.isPublic, true)
      ))
      .orderBy(desc(plugins.downloadCount));
  }

  async getPluginBySlug(slug: string): Promise<Plugin | undefined> {
    const [plugin] = await db.select().from(plugins)
      .where(and(
        eq(plugins.slug, slug),
        eq(plugins.isActive, true)
      ));
    return plugin;
  }

  async getPluginById(id: number): Promise<Plugin | undefined> {
    const [plugin] = await db
      .select()
      .from(plugins)
      .where(and(eq(plugins.id, id), eq(plugins.isActive, true)));
    return plugin;
  }

  async updatePlugin(id: number, updates: Partial<InsertPlugin>): Promise<Plugin | undefined> {
    const [updatedPlugin] = await db
      .update(plugins)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(plugins.id, id))
      .returning();
    return updatedPlugin;
  }

  async deletePlugin(id: number): Promise<boolean> {
    try {
      // First delete related download records
      await db.delete(pluginDownloads).where(eq(pluginDownloads.pluginId, id));
      
      // Then delete the plugin
      const result = await db.delete(plugins).where(eq(plugins.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error("Error deleting plugin:", error);
      return false;
    }
  }

  async incrementPluginDownloads(pluginId: number): Promise<void> {
    await db
      .update(plugins)
      .set({ downloadCount: sql`${plugins.downloadCount} + 1` })
      .where(eq(plugins.id, pluginId));
  }

  async recordPluginDownload(pluginId: number, userId: number): Promise<void> {
    await db.insert(pluginDownloads).values({
      pluginId: pluginId,
      userId: userId,
    });
  }

  async getPluginDownloadsByUser(userId: number): Promise<PluginDownload[]> {
    return await db
      .select()
      .from(pluginDownloads)
      .where(eq(pluginDownloads.userId, userId))
      .orderBy(desc(pluginDownloads.downloadedAt));
  }

  // Donation operations
  async createDonation(donation: InsertDonation): Promise<Donation> {
    const [newDonation] = await db.insert(donations).values(donation).returning();
    return newDonation;
  }

  async getDonations(): Promise<Donation[]> {
    return await db
      .select()
      .from(donations)
      .orderBy(desc(donations.createdAt));
  }

  async getApiSettings(): Promise<ApiSettings | undefined> {
    const [settings] = await db
      .select()
      .from(apiSettings)
      .where(eq(apiSettings.isActive, true))
      .orderBy(desc(apiSettings.createdAt))
      .limit(1);
    return settings;
  }

  async upsertApiSettings(settingsData: InsertApiSettings): Promise<ApiSettings> {
    // First deactivate all existing settings
    await db.update(apiSettings).set({ isActive: false });
    
    // Insert new settings
    const [newSettings] = await db
      .insert(apiSettings)
      .values({
        ...settingsData,
        isActive: true,
        updatedAt: new Date(),
      })
      .returning();
    return newSettings;
  }

  // Package Management operations
  async createHostingPackage(packageData: InsertHostingPackage): Promise<HostingPackage> {
    const [hostingPackage] = await db
      .insert(hostingPackages)
      .values(packageData)
      .returning();
    return hostingPackage;
  }

  async getHostingPackages(): Promise<HostingPackage[]> {
    return await db.select().from(hostingPackages).orderBy(hostingPackages.createdAt);
  }

  async getHostingPackageById(id: number): Promise<HostingPackage | undefined> {
    const [hostingPackage] = await db.select().from(hostingPackages).where(eq(hostingPackages.id, id));
    return hostingPackage;
  }

  async updateHostingPackage(id: number, packageData: Partial<InsertHostingPackage>): Promise<HostingPackage> {
    const [hostingPackage] = await db
      .update(hostingPackages)
      .set({ ...packageData, updatedAt: new Date() })
      .where(eq(hostingPackages.id, id))
      .returning();
    return hostingPackage;
  }

  async deleteHostingPackage(id: number): Promise<void> {
    await db.delete(hostingPackages).where(eq(hostingPackages.id, id));
  }

  async getNextHostingPackageSortOrder(): Promise<number> {
    try {
      // Use raw SQL to avoid type casting issues with Neon serverless
      const result = await db.execute(sql`SELECT COALESCE(MAX(sort_order), 0) as max_sort_order FROM hosting_packages`);
      const maxSort = result.rows[0]?.max_sort_order || 0;
      return Number(maxSort) + 1;
    } catch (error) {
      console.error("Error getting next hosting package sort order:", error);
      // Fallback: return a default value if query fails
      return 1;
    }
  }

  async getActiveHostingPackages(): Promise<HostingPackage[]> {
    return await db.select().from(hostingPackages)
      .where(eq(hostingPackages.isActive, true))
      .orderBy(hostingPackages.price);
  }

  async getFreeHostingPackage(): Promise<HostingPackage | undefined> {
    const [freePackage] = await db.select().from(hostingPackages)
      .where(and(eq(hostingPackages.isFree, true), eq(hostingPackages.isActive, true)))
      .limit(1);
    return freePackage;
  }

  // Package Usage operations
  async createPackageUsage(usageData: InsertPackageUsage): Promise<PackageUsage> {
    const [usage] = await db
      .insert(packageUsage)
      .values(usageData)
      .returning();
    return usage;
  }

  async getPackageUsageByAccountId(accountId: number): Promise<PackageUsage | undefined> {
    const [usage] = await db.select().from(packageUsage)
      .where(eq(packageUsage.hostingAccountId, accountId));
    return usage;
  }

  async updatePackageUsage(accountId: number, usageData: Partial<InsertPackageUsage>): Promise<PackageUsage> {
    const [usage] = await db
      .update(packageUsage)
      .set({ ...usageData, lastUpdated: new Date() })
      .where(eq(packageUsage.hostingAccountId, accountId))
      .returning();
    return usage;
  }

  async getWHMPackages(): Promise<any[]> {
    // This will be implemented to fetch from WHM API
    return [];
  }

  // Statistics
  async getStats(): Promise<{
    totalUsers: number;
    totalPlugins: number;
    totalWebsites: number;
    totalDonations: number;
  }> {
    const [usersCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);
    
    const [pluginsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(plugins)
      .where(eq(plugins.isActive, true));
    
    const [websitesCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(hostingAccounts)
      .where(eq(hostingAccounts.status, "active"));
    
    const [donationsSum] = await db
      .select({ sum: sql<number>`coalesce(sum(amount), 0)` })
      .from(donations)
      .where(eq(donations.status, "completed"));

    return {
      totalUsers: usersCount.count,
      totalPlugins: pluginsCount.count,
      totalWebsites: websitesCount.count,
      totalDonations: donationsSum.sum,
    };
  }

  // User Groups operations
  async createUserGroup(groupData: InsertUserGroup): Promise<UserGroup> {
    const [group] = await db.insert(userGroups).values(groupData).returning();
    return group;
  }

  async getUserGroups(): Promise<UserGroup[]> {
    return await db.select().from(userGroups).orderBy(userGroups.name);
  }

  async getUserGroupById(id: number): Promise<UserGroup | undefined> {
    const [group] = await db.select().from(userGroups).where(eq(userGroups.id, id));
    return group;
  }

  async getUserGroupByName(name: string): Promise<UserGroup | undefined> {
    const [group] = await db.select().from(userGroups).where(eq(userGroups.name, name));
    return group;
  }

  async updateUserGroup(id: number, updates: Partial<InsertUserGroup>): Promise<UserGroup | undefined> {
    const [group] = await db.update(userGroups)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userGroups.id, id))
      .returning();
    return group;
  }

  async deleteUserGroup(id: number): Promise<boolean> {
    const result = await db.delete(userGroups).where(eq(userGroups.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Device Fingerprint operations
  async createDeviceFingerprint(fingerprintData: InsertDeviceFingerprint): Promise<DeviceFingerprint> {
    try {
      console.log('[Storage] Creating device fingerprint with data:', {
        ...fingerprintData,
        platformInfo: fingerprintData.platformInfo ? 'JSON data present' : 'null',
        canvasFingerprint: fingerprintData.canvasFingerprint ? 'Canvas data present' : 'null'
      });
      
      const [fingerprint] = await db.insert(deviceFingerprints).values(fingerprintData).returning();
      
      console.log('[Storage] Successfully created device fingerprint with ID:', fingerprint.id);
      return fingerprint;
    } catch (error) {
      console.error('[Storage] Error creating device fingerprint:', error);
      throw error;
    }
  }

  async getDeviceFingerprintsByUserId(userId: number): Promise<DeviceFingerprint[]> {
    return await db.select().from(deviceFingerprints).where(eq(deviceFingerprints.userId, userId));
  }

  async getDeviceFingerprintByHash(hash: string): Promise<DeviceFingerprint | undefined> {
    const [fingerprint] = await db.select().from(deviceFingerprints)
      .where(eq(deviceFingerprints.fingerprintHash, hash));
    return fingerprint;
  }

  async updateDeviceFingerprint(id: number, updates: Partial<InsertDeviceFingerprint>): Promise<DeviceFingerprint | undefined> {
    const [fingerprint] = await db.update(deviceFingerprints)
      .set({ ...updates, lastSeen: new Date() })
      .where(eq(deviceFingerprints.id, id))
      .returning();
    return fingerprint;
  }

  async deleteDeviceFingerprint(id: number): Promise<boolean> {
    const result = await db.delete(deviceFingerprints).where(eq(deviceFingerprints.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getDeviceCountByFingerprint(fingerprintHash: string): Promise<number> {
    const [result] = await db.select({ count: sql<number>`count(distinct ${deviceFingerprints.userId})` })
      .from(deviceFingerprints)
      .where(eq(deviceFingerprints.fingerprintHash, fingerprintHash));
    return result?.count ?? 0;
  }

  // Group Policy operations
  async getUserGroupLimits(userId: number): Promise<{
    maxHostingAccounts: number;
    maxDevices: number;
    currentHostingAccounts: number;
    currentDevices: number;
  }> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Get user's group or default to Free group
    let group: UserGroup | undefined;
    if (user.userGroupId) {
      group = await this.getUserGroupById(user.userGroupId);
    } else {
      group = await this.getUserGroupByName("Free");
    }

    if (!group) {
      // Default limits if no group is found
      group = {
        id: 0,
        name: "Free",
        displayName: "Free",
        description: null,
        maxHostingAccounts: 2,
        maxDevices: 2,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    // Get current counts
    const [currentHostingAccounts] = await db.select({ count: sql<number>`count(*)` })
      .from(hostingAccounts)
      .where(eq(hostingAccounts.userId, userId));

    const [currentDevices] = await db.select({ count: sql<number>`count(*)` })
      .from(deviceFingerprints)
      .where(eq(deviceFingerprints.userId, userId));

    return {
      maxHostingAccounts: group.maxHostingAccounts,
      maxDevices: group.maxDevices,
      currentHostingAccounts: currentHostingAccounts?.count ?? 0,
      currentDevices: currentDevices?.count ?? 0,
    };
  }

  // Facebook Pixel Settings operations
  async getFacebookPixelSettings(): Promise<FacebookPixelSettings | undefined> {
    try {
      const settings = await db.select()
        .from(facebookPixelSettings)
        .limit(1);
      return settings[0];
    } catch (error) {
      console.error('Error fetching Facebook Pixel settings:', error);
      return undefined;
    }
  }

  async upsertFacebookPixelSettings(settingsData: InsertFacebookPixelSettings): Promise<FacebookPixelSettings> {
    try {
      // First, try to update existing settings
      const existingSettings = await this.getFacebookPixelSettings();
      
      if (existingSettings) {
        // Update existing settings
        const [updatedSettings] = await db.update(facebookPixelSettings)
          .set({
            ...settingsData,
            updatedAt: new Date(),
          })
          .where(eq(facebookPixelSettings.id, existingSettings.id))
          .returning();
        
        return updatedSettings;
      } else {
        // Create new settings
        const [newSettings] = await db.insert(facebookPixelSettings)
          .values(settingsData)
          .returning();
        
        return newSettings;
      }
    } catch (error) {
      console.error('Error upserting Facebook Pixel settings:', error);
      throw error;
    }
  }

  async deleteFacebookPixelSettings(): Promise<boolean> {
    try {
      const result = await db.delete(facebookPixelSettings);
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('Error deleting Facebook Pixel settings:', error);
      return false;
    }
  }

  // Plugin Request operations
  async createPluginRequest(requestData: InsertPluginRequest): Promise<PluginRequest> {
    const [request] = await db.insert(pluginRequests)
      .values(requestData)
      .returning();
    return request;
  }

  async getPluginRequests(): Promise<PluginRequest[]> {
    return await db.select().from(pluginRequests).orderBy(desc(pluginRequests.createdAt));
  }

  async getPluginRequestsByUserId(userId: number): Promise<PluginRequest[]> {
    return await db.select().from(pluginRequests)
      .where(eq(pluginRequests.userId, userId))
      .orderBy(desc(pluginRequests.createdAt));
  }

  async getUserPluginRequestsToday(userId: number): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(pluginRequests)
      .where(
        and(
          eq(pluginRequests.userId, userId),
          sql`${pluginRequests.createdAt} >= ${today.toISOString()}`
        )
      );
    
    return Number(result[0]?.count || 0);
  }

  async updatePluginRequestStatus(id: number, status: string): Promise<PluginRequest | undefined> {
    const [updated] = await db.update(pluginRequests)
      .set({ status })
      .where(eq(pluginRequests.id, id))
      .returning();
    return updated;
  }

  async deletePluginRequest(id: number): Promise<boolean> {
    const result = await db.delete(pluginRequests)
      .where(eq(pluginRequests.id, id));
    return (result.rowCount || 0) > 0;
  }

  // SMTP Settings operations
  async getSmtpSettings(): Promise<SmtpSettings | undefined> {
    const [settings] = await db.select().from(smtpSettings).where(eq(smtpSettings.isActive, true));
    return settings;
  }

  async upsertSmtpSettings(settingsData: InsertSmtpSettings): Promise<SmtpSettings> {
    try {
      // Delete existing settings first
      await db.delete(smtpSettings);
      
      // Insert new settings
      const [newSettings] = await db.insert(smtpSettings)
        .values(settingsData)
        .returning();
      
      return newSettings;
    } catch (error) {
      console.error('Error upserting SMTP settings:', error);
      throw error;
    }
  }

  async deleteSmtpSettings(): Promise<boolean> {
    try {
      const result = await db.delete(smtpSettings);
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('Error deleting SMTP settings:', error);
      return false;
    }
  }

  // Custom Header Code operations
  async getCustomHeaderCodes(): Promise<CustomHeaderCode[]> {
    return await db
      .select()
      .from(customHeaderCode)
      .orderBy(customHeaderCode.position, customHeaderCode.createdAt);
  }

  async getCustomHeaderCodeById(id: number): Promise<CustomHeaderCode | undefined> {
    const [code] = await db
      .select()
      .from(customHeaderCode)
      .where(eq(customHeaderCode.id, id));
    return code;
  }

  async createCustomHeaderCode(codeData: InsertCustomHeaderCode): Promise<CustomHeaderCode> {
    const [code] = await db
      .insert(customHeaderCode)
      .values(codeData)
      .returning();
    return code;
  }

  async updateCustomHeaderCode(
    id: number,
    updates: Partial<InsertCustomHeaderCode>
  ): Promise<CustomHeaderCode | undefined> {
    try {
      const [code] = await db
        .update(customHeaderCode)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(customHeaderCode.id, id))
        .returning();
      return code;
    } catch (error) {
      console.error('Error updating custom header code:', error);
      return undefined;
    }
  }

  async deleteCustomHeaderCode(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(customHeaderCode)
        .where(eq(customHeaderCode.id, id));
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('Error deleting custom header code:', error);
      return false;
    }
  }

  // VPS Package operations
  async createVpsPackage(packageData: InsertVpsPackage): Promise<VpsPackage> {
    const [vpsPackage] = await db.insert(vpsPackages).values(packageData).returning();
    return vpsPackage;
  }

  async getVpsPackages(): Promise<VpsPackage[]> {
    return await db.select().from(vpsPackages)
      .where(eq(vpsPackages.isActive, true))
      .orderBy(vpsPackages.sortOrder);
  }

  async getVpsPackageById(id: number): Promise<VpsPackage | undefined> {
    const [vpsPackage] = await db.select().from(vpsPackages).where(eq(vpsPackages.id, id));
    return vpsPackage;
  }

  async updateVpsPackage(id: number, updates: Partial<InsertVpsPackage>): Promise<VpsPackage | undefined> {
    const [vpsPackage] = await db.update(vpsPackages)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(vpsPackages.id, id))
      .returning();
    return vpsPackage;
  }

  async deleteVpsPackage(id: number): Promise<boolean> {
    try {
      const result = await db.delete(vpsPackages).where(eq(vpsPackages.id, id));
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error("Error deleting VPS package:", error);
      return false;
    }
  }

  async getNextVpsPackageSortOrder(): Promise<number> {
    try {
      const result = await db.select({ maxSortOrder: max(vpsPackages.sortOrder) }).from(vpsPackages);
      const maxSort = result[0]?.maxSortOrder || 0;
      return maxSort + 1;
    } catch (error) {
      console.error("Error getting next VPS package sort order:", error);
      throw error;
    }
  }

  // VPS Instance operations
  async createVpsInstance(instanceData: InsertVpsInstance): Promise<VpsInstance> {
    const [vpsInstance] = await db.insert(vpsInstances).values(instanceData).returning();
    return vpsInstance;
  }

  // VPS Order operations
  async createVpsOrder(orderData: InsertVpsOrder): Promise<VpsOrder> {
    const [vpsOrder] = await db.insert(vpsOrders).values(orderData).returning();
    return vpsOrder;
  }

  async getVpsOrders(): Promise<VpsOrder[]> {
    return await db.select().from(vpsOrders)
      .orderBy(desc(vpsOrders.createdAt));
  }

  async getVpsOrderById(id: number): Promise<VpsOrder | undefined> {
    const [vpsOrder] = await db.select().from(vpsOrders).where(eq(vpsOrders.id, id));
    return vpsOrder;
  }

  async getVpsOrdersByEmail(email: string): Promise<VpsOrder[]> {
    return await db.select().from(vpsOrders)
      .where(eq(vpsOrders.customerEmail, email))
      .orderBy(desc(vpsOrders.createdAt));
  }

  async updateVpsOrderByStripeSubscription(subscriptionId: string, updates: Partial<InsertVpsOrder>): Promise<VpsOrder | undefined> {
    const [order] = await db.update(vpsOrders)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(vpsOrders.stripeSubscriptionId, subscriptionId))
      .returning();
    return order;
  }

  async updateVpsOrder(id: number, updates: Partial<InsertVpsOrder>): Promise<VpsOrder | undefined> {
    const [vpsOrder] = await db.update(vpsOrders)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(vpsOrders.id, id))
      .returning();
    return vpsOrder;
  }

  // Stripe Settings operations
  async getStripeSettings(): Promise<StripeSettings | undefined> {
    const [settings] = await db.select().from(stripeSettings).limit(1);
    return settings;
  }

  async createStripeSettings(settingsData: InsertStripeSettings): Promise<StripeSettings> {
    const [settings] = await db.insert(stripeSettings).values(settingsData).returning();
    return settings;
  }

  async updateStripeSettings(id: number, updates: Partial<InsertStripeSettings>): Promise<StripeSettings | undefined> {
    const [settings] = await db.update(stripeSettings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(stripeSettings.id, id))
      .returning();
    return settings;
  }

  async upsertStripeSettings(settingsData: InsertStripeSettings): Promise<StripeSettings> {
    // Check if settings exist
    const existing = await this.getStripeSettings();
    if (existing) {
      return this.updateStripeSettings(existing.id, settingsData) as Promise<StripeSettings>;
    } else {
      return this.createStripeSettings(settingsData);
    }
  }

  async deleteVpsOrder(id: number): Promise<boolean> {
    try {
      const result = await db.delete(vpsOrders).where(eq(vpsOrders.id, id));
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error("Error deleting VPS order:", error);
      return false;
    }
  }

  async getVpsInstances(): Promise<VpsInstance[]> {
    return await db.select().from(vpsInstances).orderBy(desc(vpsInstances.createdAt));
  }

  async getVpsInstanceById(id: number): Promise<VpsInstance | undefined> {
    const [vpsInstance] = await db.select().from(vpsInstances).where(eq(vpsInstances.id, id));
    return vpsInstance;
  }

  async getVpsInstancesByUserId(userId: number): Promise<VpsInstance[]> {
    return await db.select().from(vpsInstances).where(eq(vpsInstances.userId, userId));
  }

  async updateVpsInstance(id: number, updates: Partial<InsertVpsInstance>): Promise<VpsInstance | undefined> {
    const [vpsInstance] = await db.update(vpsInstances)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(vpsInstances.id, id))
      .returning();
    return vpsInstance;
  }

  async deleteVpsInstance(id: number): Promise<boolean> {
    try {
      const result = await db.delete(vpsInstances).where(eq(vpsInstances.id, id));
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error("Error deleting VPS instance:", error);
      return false;
    }
  }
}

export const storage = new DatabaseStorage();
