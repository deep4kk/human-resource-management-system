import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  boolean,
  numeric,
  date,
} from "drizzle-orm/pg-core";

export const biometricSettingsTable = pgTable("biometric_settings", {
  id: serial("id").primaryKey(),
  deviceBrand: text("device_brand").notNull(),
  deviceModel: text("device_model"),
  serialNumber: text("serial_number"),
  location: text("location"),
  importFormat: text("import_format").notNull().default("csv"),
  dateFormat: text("date_format").notNull().default("YYYY-MM-DD"),
  timeFormat: text("time_format").notNull().default("HH:mm"),
  isActive: boolean("is_active").notNull().default(true),
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const documentTemplatesTable = pgTable("document_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  content: text("content").notNull(),
  variables: text("variables").notNull().default("[]"),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const generatedDocumentsTable = pgTable("generated_documents", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").notNull(),
  employeeId: integer("employee_id").notNull(),
  name: text("name").notNull(),
  content: text("content").notNull(),
  generatedBy: integer("generated_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const holidaysTable = pgTable("holidays", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  date: date("date").notNull(),
  type: text("type").notNull().default("public"),
  isOptional: boolean("is_optional").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const announcementsTable = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  priority: text("priority").notNull().default("normal"),
  targetRoles: text("target_roles").notNull().default("all"),
  publishedBy: integer("published_by"),
  isActive: boolean("is_active").notNull().default(true),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const companyPoliciesTable = pgTable("company_policies", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  content: text("content").notNull(),
  version: text("version").notNull().default("1.0"),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
