import { Router } from "express";
import { db } from "@hrms/db";
import { brandingTable } from "@hrms/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try {
    let branding = await db.select().from(brandingTable).limit(1);
    if (branding.length === 0) {
      const [created] = await db
        .insert(brandingTable)
        .values({
          companyName: "Flowmative",
          primaryColor: "#1e40af",
          accentColor: "#d97706",
          theme: "light",
          tagline: "Empowering People, Driving Growth",
        })
        .returning();
      branding = [created];
    }
    res.json({
      ...branding[0],
      updatedAt: branding[0].updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Get branding error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/", async (req, res) => {
  try {
    const { companyName, logoUrl, primaryColor, accentColor, theme, tagline } =
      req.body;

    let existing = await db.select().from(brandingTable).limit(1);

    if (existing.length === 0) {
      const [created] = await db
        .insert(brandingTable)
        .values({
          companyName: companyName || "Flowmative",
          logoUrl: logoUrl || null,
          primaryColor: primaryColor || "#1e40af",
          accentColor: accentColor || "#d97706",
          theme: theme || "light",
          tagline: tagline || null,
        })
        .returning();
      res.json({ ...created, updatedAt: created.updatedAt.toISOString() });
    } else {
      const [updated] = await db
        .update(brandingTable)
        .set({
          ...(companyName !== undefined && { companyName }),
          ...(logoUrl !== undefined && { logoUrl: logoUrl || null }),
          ...(primaryColor !== undefined && { primaryColor }),
          ...(accentColor !== undefined && { accentColor }),
          ...(theme !== undefined && { theme }),
          ...(tagline !== undefined && { tagline: tagline || null }),
          updatedAt: new Date(),
        })
        .where(eq(brandingTable.id, existing[0].id))
        .returning();
      res.json({ ...updated, updatedAt: updated.updatedAt.toISOString() });
    }
  } catch (err) {
    req.log.error({ err }, "Update branding error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
