import {
  pgTable,
  serial,
  integer,
  text,
  numeric,
  boolean,
  timestamp,
  date,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const timesheetsTable = pgTable("timesheets", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  date: date("date").notNull(),
  project: text("project").notNull(),
  task: text("task").notNull(),
  hours: numeric("hours", { precision: 5, scale: 2 }).notNull(),
  billable: boolean("billable").notNull().default(true),
  description: text("description"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertTimesheetSchema = createInsertSchema(timesheetsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertTimesheet = z.infer<typeof insertTimesheetSchema>;
export type Timesheet = typeof timesheetsTable.$inferSelect;
