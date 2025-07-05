import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  decimal,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User groups table
export const userGroups = pgTable("user_groups", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull().unique(), // 'Free' | 'Donor'
  displayName: varchar("display_name").notNull(),
  description: text("description"),
  maxHostingAccounts: integer("max_hosting_accounts").notNull().default(2),
  maxDevices: integer("max_devices").notNull().default(2),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Device fingerprints table
export const deviceFingerprints = pgTable("device_fingerprints", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  fingerprintHash: varchar("fingerprint_hash").notNull(), // Hash of device fingerprint
  macAddress: varchar("mac_address"), // MAC address if available
  userAgent: text("user_agent"),
  screenResolution: varchar("screen_resolution"),
  timezone: varchar("timezone"),
  language: varchar("language"),
  platformInfo: text("platform_info"), // JSON string with additional device info
  ipAddress: varchar("ip_address"),
  lastSeen: timestamp("last_seen").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_device_fingerprint_hash").on(table.fingerprintHash),
  index("IDX_device_user_id").on(table.userId),
]);

// User storage table - Anonymous registration support
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username").notNull().unique(),
  email: varchar("email"), // Optional for anonymous users
  password: varchar("password").notNull(),
  displayPassword: varchar("display_password"), // Plain text password for display (anonymous users only)
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  recoveryPhrase: varchar("recovery_phrase").unique(), // For anonymous account recovery
  isAnonymous: boolean("is_anonymous").default(true), // Track if user is anonymous
  role: varchar("role").notNull().default("client"), // 'admin' | 'client'
  userGroupId: integer("user_group_id").references(() => userGroups.id), // Link to user group
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Hosting accounts table
export const hostingAccounts = pgTable("hosting_accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  packageId: integer("package_id").references(() => hostingPackages.id),
  domain: varchar("domain").notNull().unique(),
  subdomain: varchar("subdomain").notNull(), // e.g., "mysite" for mysite.hostme.today
  cpanelUsername: varchar("cpanel_username", { length: 255 }),
  cpanelPassword: varchar("cpanel_password", { length: 255 }), // encrypted
  whmAccountId: varchar("whm_account_id", { length: 255 }), // WHM account identifier
  status: varchar("status").notNull().default("active"), // 'active' | 'suspended' | 'pending' | 'error'
  diskUsage: integer("disk_usage").default(0), // in MB
  diskLimit: integer("disk_limit").default(5120), // 5GB in MB
  bandwidthUsed: integer("bandwidth_used").default(0), // in MB
  bandwidthLimit: integer("bandwidth_limit").default(10240), // 10GB in MB
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// WordPress plugins table
export const plugins = pgTable("plugins", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  slug: varchar("slug").notNull().unique(),
  description: text("description"),
  category: varchar("category").notNull(),
  version: varchar("version").notNull(),
  author: varchar("author"),
  fileName: varchar("file_name").notNull(),
  filePath: varchar("file_path").notNull(), // relative path from project root for deployment
  fileSize: integer("file_size"), // in bytes
  downloadCount: integer("download_count").default(0),
  imageUrl: varchar("image_url"),
  isActive: boolean("is_active").default(true),
  isPublic: boolean("is_public").default(false),
  uploadedBy: integer("uploaded_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Plugin downloads tracking
export const pluginDownloads = pgTable("plugin_downloads", {
  id: serial("id").primaryKey(),
  pluginId: integer("plugin_id").notNull().references(() => plugins.id),
  userId: integer("user_id").notNull().references(() => users.id),
  downloadedAt: timestamp("downloaded_at").defaultNow(),
});

// Donations table
export const donations = pgTable("donations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // can be null for anonymous donations
  amount: integer("amount").notNull(), // in cents
  currency: varchar("currency").notNull().default("USD"),
  status: varchar("status").notNull().default("pending"), // 'pending' | 'completed' | 'failed'
  paymentMethod: varchar("payment_method"),
  donorEmail: varchar("donor_email"),
  message: text("message"),
  // Subscription fields
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  stripeCustomerId: varchar("stripe_customer_id"),
  isRecurring: boolean("is_recurring").notNull().default(false),
  subscriptionStatus: varchar("subscription_status"), // 'active' | 'canceled' | 'past_due' | 'incomplete'
  giftTier: varchar("gift_tier"), // '$5', '$10', '$15', '$20'
  giftType: varchar("gift_type"), // 'vps' | 'hosting' | 'both'
  giftDetails: text("gift_details"), // JSON string with gift specifications
  createdAt: timestamp("created_at").defaultNow(),
});

// API Settings table for WHM/cPanel configuration
export const apiSettings = pgTable("api_settings", {
  id: serial("id").primaryKey(),
  whmApiUrl: varchar("whm_api_url", { length: 255 }).notNull(),
  whmApiToken: varchar("whm_api_token", { length: 500 }).notNull(),
  cpanelBaseUrl: varchar("cpanel_base_url", { length: 255 }).notNull(),
  emailFromAddress: varchar("email_from_address", { length: 255 }).notNull(),
  emailFromName: varchar("email_from_name", { length: 255 }).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Hosting packages that can be assigned to users
export const hostingPackages = pgTable("hosting_packages", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  displayName: varchar("display_name", { length: 255 }).notNull(),
  description: text("description"),
  price: integer("price").notNull().default(0), // in cents
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  diskSpaceQuota: integer("disk_space_quota").notNull(), // in MB
  bandwidthQuota: integer("bandwidth_quota").notNull(), // in MB
  emailAccounts: integer("email_accounts").notNull().default(0),
  databases: integer("databases").notNull().default(0),
  subdomains: integer("subdomains").notNull().default(0),
  whmPackageName: varchar("whm_package_name", { length: 255 }).notNull(), // WHM package identifier
  isActive: boolean("is_active").default(true),
  isFree: boolean("is_free").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Track package usage statistics
export const packageUsage = pgTable("package_usage", {
  id: serial("id").primaryKey(),
  hostingAccountId: integer("hosting_account_id").references(() => hostingAccounts.id, { onDelete: "cascade" }).notNull(),
  diskUsed: integer("disk_used").notNull().default(0), // in MB
  bandwidthUsed: integer("bandwidth_used").notNull().default(0), // in MB
  emailAccountsUsed: integer("email_accounts_used").notNull().default(0),
  databasesUsed: integer("databases_used").notNull().default(0),
  subdomainsUsed: integer("subdomains_used").notNull().default(0),
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Facebook Pixel Settings table for conversion tracking
export const facebookPixelSettings = pgTable("facebook_pixel_settings", {
  id: serial("id").primaryKey(),
  pixelId: text("pixel_id").notNull(),
  accessToken: text("access_token"), // For advanced features
  isActive: boolean("is_active").default(true),
  trackPageViews: boolean("track_page_views").default(true),
  trackPurchases: boolean("track_purchases").default(true),
  purchaseEventValue: decimal("purchase_event_value", { precision: 10, scale: 2 }).default('5.00'), // Default $5 purchase value
  testMode: boolean("test_mode").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const userGroupsRelations = relations(userGroups, ({ many }) => ({
  users: many(users),
}));

export const deviceFingerprintsRelations = relations(deviceFingerprints, ({ one }) => ({
  user: one(users, { fields: [deviceFingerprints.userId], references: [users.id] }),
}));

export const usersRelations = relations(users, ({ many, one }) => ({
  hostingAccounts: many(hostingAccounts),
  pluginDownloads: many(pluginDownloads),
  uploadedPlugins: many(plugins),
  donations: many(donations),
  deviceFingerprints: many(deviceFingerprints),
  userGroup: one(userGroups, { fields: [users.userGroupId], references: [userGroups.id] }),
}));

export const hostingAccountsRelations = relations(hostingAccounts, ({ one }) => ({
  user: one(users, { fields: [hostingAccounts.userId], references: [users.id] }),
  package: one(hostingPackages, { fields: [hostingAccounts.packageId], references: [hostingPackages.id] }),
  usage: one(packageUsage, { fields: [hostingAccounts.id], references: [packageUsage.hostingAccountId] }),
}));

export const hostingPackagesRelations = relations(hostingPackages, ({ many }) => ({
  hostingAccounts: many(hostingAccounts),
}));

export const packageUsageRelations = relations(packageUsage, ({ one }) => ({
  hostingAccount: one(hostingAccounts, { fields: [packageUsage.hostingAccountId], references: [hostingAccounts.id] }),
}));

export const pluginsRelations = relations(plugins, ({ one, many }) => ({
  uploader: one(users, { fields: [plugins.uploadedBy], references: [users.id] }),
  downloads: many(pluginDownloads),
}));

export const pluginDownloadsRelations = relations(pluginDownloads, ({ one }) => ({
  plugin: one(plugins, { fields: [pluginDownloads.pluginId], references: [plugins.id] }),
  user: one(users, { fields: [pluginDownloads.userId], references: [users.id] }),
}));

export const donationsRelations = relations(donations, ({ one }) => ({
  user: one(users, { fields: [donations.userId], references: [users.id] }),
}));

// Schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  userGroupId: z.number().optional(), // Make userGroupId optional for backward compatibility
});

export const insertHostingAccountSchema = createInsertSchema(hostingAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPluginSchema = createInsertSchema(plugins).omit({
  id: true,
  downloadCount: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDonationSchema = createInsertSchema(donations).omit({
  id: true,
  createdAt: true,
});

export const insertApiSettingsSchema = createInsertSchema(apiSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserGroupSchema = createInsertSchema(userGroups).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDeviceFingerprintSchema = createInsertSchema(deviceFingerprints).omit({
  id: true,
  createdAt: true,
  lastSeen: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertHostingAccount = z.infer<typeof insertHostingAccountSchema>;
export type HostingAccount = typeof hostingAccounts.$inferSelect & {
  whmData?: {
    email: string;
    ip: string;
    package: string;
    suspended: boolean;
    theme: string;
    shell: string;
    startdate: string;
    unix_startdate: number;
    limits: {
      maxftp: string;
      maxsql: string;
      maxpop: string;
      maxlst: string;
      maxsub: string;
      maxpark: string;
      maxaddon: string;
    };
  };
};
export type InsertPlugin = z.infer<typeof insertPluginSchema>;
export type Plugin = typeof plugins.$inferSelect;
export type PluginDownload = typeof pluginDownloads.$inferSelect;
export type InsertDonation = z.infer<typeof insertDonationSchema>;
export type Donation = typeof donations.$inferSelect;
export type InsertApiSettings = z.infer<typeof insertApiSettingsSchema>;
export type ApiSettings = typeof apiSettings.$inferSelect;
export type InsertUserGroup = z.infer<typeof insertUserGroupSchema>;
export type UserGroup = typeof userGroups.$inferSelect;
export type InsertDeviceFingerprint = z.infer<typeof insertDeviceFingerprintSchema>;
export type DeviceFingerprint = typeof deviceFingerprints.$inferSelect;

// Package management schemas
export const insertHostingPackageSchema = createInsertSchema(hostingPackages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPackageUsageSchema = createInsertSchema(packageUsage).omit({
  id: true,
  createdAt: true,
});

export type InsertHostingPackage = z.infer<typeof insertHostingPackageSchema>;
export type HostingPackage = typeof hostingPackages.$inferSelect;
export type InsertPackageUsage = z.infer<typeof insertPackageUsageSchema>;
export type PackageUsage = typeof packageUsage.$inferSelect;

// Facebook Pixel Settings schema
export const insertFacebookPixelSettingsSchema = createInsertSchema(facebookPixelSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertFacebookPixelSettings = z.infer<typeof insertFacebookPixelSettingsSchema>;
export type FacebookPixelSettings = typeof facebookPixelSettings.$inferSelect;
