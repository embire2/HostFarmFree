import {
  users,
  hostingAccounts,
  plugins,
  pluginDownloads,
  donations,
  apiSettings,
  hostingPackages,
  packageUsage,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, ilike, and, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined>;
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
      .select()
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
}

export const storage = new DatabaseStorage();
