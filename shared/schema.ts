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

// User storage table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username").notNull().unique(),
  email: varchar("email").unique(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("client"), // 'admin' | 'client'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Hosting accounts table
export const hostingAccounts = pgTable("hosting_accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  domain: varchar("domain").notNull().unique(),
  subdomain: varchar("subdomain").notNull(), // e.g., "mysite" for mysite.hostme.today
  status: varchar("status").notNull().default("active"), // 'active' | 'suspended' | 'pending'
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
  fileSize: integer("file_size"), // in bytes
  downloadCount: integer("download_count").default(0),
  imageUrl: varchar("image_url"),
  isActive: boolean("is_active").default(true),
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

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertHostingAccount = z.infer<typeof insertHostingAccountSchema>;
export type HostingAccount = typeof hostingAccounts.$inferSelect;
export type InsertPlugin = z.infer<typeof insertPluginSchema>;
export type Plugin = typeof plugins.$inferSelect;
export type PluginDownload = typeof pluginDownloads.$inferSelect;
export type InsertDonation = z.infer<typeof insertDonationSchema>;
export type Donation = typeof donations.$inferSelect;
