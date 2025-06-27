import {
  users,
  hostingAccounts,
  plugins,
  pluginDownloads,
  donations,
  type User,
  type InsertUser,
  type HostingAccount,
  type InsertHostingAccount,
  type Plugin,
  type InsertPlugin,
  type PluginDownload,
  type Donation,
  type InsertDonation,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, ilike, and, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Hosting account operations
  createHostingAccount(account: InsertHostingAccount): Promise<HostingAccount>;
  getHostingAccountsByUserId(userId: number): Promise<HostingAccount[]>;
  getHostingAccountByDomain(domain: string): Promise<HostingAccount | undefined>;
  updateHostingAccountUsage(id: number, diskUsage: number, bandwidthUsed: number): Promise<void>;

  // Plugin operations
  createPlugin(plugin: InsertPlugin): Promise<Plugin>;
  getPlugins(category?: string, search?: string): Promise<Plugin[]>;
  getPluginById(id: number): Promise<Plugin | undefined>;
  incrementPluginDownloads(pluginId: number): Promise<void>;
  recordPluginDownload(pluginId: number, userId: number): Promise<void>;
  getPluginDownloadsByUser(userId: number): Promise<PluginDownload[]>;

  // Donation operations
  createDonation(donation: InsertDonation): Promise<Donation>;
  getDonations(): Promise<Donation[]>;

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

  async getPluginById(id: number): Promise<Plugin | undefined> {
    const [plugin] = await db
      .select()
      .from(plugins)
      .where(and(eq(plugins.id, id), eq(plugins.isActive, true)));
    return plugin;
  }

  async incrementPluginDownloads(pluginId: number): Promise<void> {
    await db
      .update(plugins)
      .set({ downloadCount: sql`${plugins.downloadCount} + 1` })
      .where(eq(plugins.id, pluginId));
  }

  async recordPluginDownload(pluginId: number, userId: number): Promise<void> {
    await db.insert(pluginDownloads).values({
      pluginId,
      userId,
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
