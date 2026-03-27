import { pgTable, serial, text, timestamp, integer, boolean, numeric, date, time, jsonb } from "drizzle-orm/pg-core";

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

export const attendanceSettingsTable = pgTable("attendance_settings", {
  id: serial("id").primaryKey(),
  lateRuleEnabled: boolean("late_rule_enabled").notNull().default(true),
  lateAfterTime: time("late_after_time").notNull().default("10:15:00"),
  graceMinutes: integer("grace_minutes").notNull().default(10),
  allowedLates: integer("allowed_lates").notNull().default(3),
  penaltyType: text("penalty_type").notNull().default("half_day"),
  penaltyValue: numeric("penalty_value", { precision: 3, scale: 1 }).notNull().default("0.5"),

  workingHoursEnabled: boolean("working_hours_enabled").notNull().default(true),
  fullDayHours: numeric("full_day_hours", { precision: 4, scale: 1 }).notNull().default("9"),
  halfDayThreshold: numeric("half_day_threshold", { precision: 4, scale: 1 }).notNull().default("4.5"),
  absentThreshold: numeric("absent_threshold", { precision: 4, scale: 1 }).notNull().default("2"),

  shiftEnabled: boolean("shift_enabled").notNull().default(true),
  shiftStartTime: time("shift_start_time").notNull().default("09:30:00"),
  shiftEndTime: time("shift_end_time").notNull().default("18:30:00"),

  autoRegularizationEnabled: boolean("auto_regularization_enabled").notNull().default(true),
  autoApproveBelowMinutes: integer("auto_approve_below_minutes").notNull().default(30),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const featureFlagsTable = pgTable("feature_flags", {
  id: serial("id").primaryKey(),
  flagKey: text("flag_key").notNull().unique(),
  enabled: boolean("enabled").notNull().default(false),
  description: text("description"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const attendanceLogsTable = pgTable("attendance_logs", {
  id: serial("id").primaryKey(),
  attendanceId: integer("attendance_id").notNull(),
  employeeId: integer("employee_id").notNull(),
  date: date("date").notNull(),
  events: jsonb("events").notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
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
