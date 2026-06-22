import {
  pgTable,
  serial,
  integer,
  text,
  numeric,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const kpisTable = pgTable("kpis", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  target: numeric("target", { precision: 10, scale: 2 }).notNull(),
  achieved: numeric("achieved", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  unit: text("unit").notNull(),
  period: text("period").notNull(),
  status: text("status").notNull().default("on_track"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const appraisalsTable = pgTable("appraisals", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  reviewerId: integer("reviewer_id").notNull(),
  period: text("period").notNull(),
  overallRating: numeric("overall_rating", {
    precision: 3,
    scale: 1,
  }).notNull(),
  technicalSkills: numeric("technical_skills", {
    precision: 3,
    scale: 1,
  }).notNull(),
  communication: numeric("communication", { precision: 3, scale: 1 }).notNull(),
  teamwork: numeric("teamwork", { precision: 3, scale: 1 }).notNull(),
  leadership: numeric("leadership", { precision: 3, scale: 1 }).notNull(),
  comments: text("comments"),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertKpiSchema = createInsertSchema(kpisTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertKpi = z.infer<typeof insertKpiSchema>;
export type Kpi = typeof kpisTable.$inferSelect;

export const insertAppraisalSchema = createInsertSchema(appraisalsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertAppraisal = z.infer<typeof insertAppraisalSchema>;
export type Appraisal = typeof appraisalsTable.$inferSelect;
