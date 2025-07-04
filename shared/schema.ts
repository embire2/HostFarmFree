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

// User storage table - Anonymous registration support
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username").notNull().unique(),
  email: varchar("email"), // Optional for anonymous users
  password: varchar("password").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  recoveryPhrase: varchar("recovery_phrase").unique(), // For anonymous account recovery
  isAnonymous: boolean("is_anonymous").default(true), // Track if user is anonymous
  role: varchar("role").notNull().default("client"), // 'admin' | 'client'
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

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  hostingAccounts: many(hostingAccounts),
  pluginDownloads: many(pluginDownloads),
  uploadedPlugins: many(plugins),
  donations: many(donations),
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
