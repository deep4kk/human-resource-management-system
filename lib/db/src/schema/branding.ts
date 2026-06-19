import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const brandingTable = pgTable("branding", {
  id: serial("id").primaryKey(),
  companyName: text("company_name").notNull().default("Toyo Kambocha"),
  logoUrl: text("logo_url"),
  primaryColor: text("primary_color").notNull().default("#1e40af"),
  accentColor: text("accent_color").notNull().default("#d97706"),
  theme: text("theme").notNull().default("light"),
  tagline: text("tagline"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertBrandingSchema = createInsertSchema(brandingTable).omit({
  id: true,
  updatedAt: true,
});
export type InsertBranding = z.infer<typeof insertBrandingSchema>;
export type Branding = typeof brandingTable.$inferSelect;
