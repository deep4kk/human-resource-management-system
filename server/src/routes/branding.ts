import { Router } from "express";
import { Branding } from "@hrms/db";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    let companyId = null;
    if (authHeader?.startsWith("Bearer ")) {
      const { verifyToken } = await import("../lib/auth.js");
      const payload = verifyToken(authHeader.slice(7));
      if (payload) companyId = payload.companyId;
    }
    if (!companyId) {
      const branding = await Branding.findOne();
      if (!branding) {
        const created = await Branding.create({ companyName: "Flowmative", primaryColor: "#6366f1", accentColor: "#8b5cf6", theme: "light", tagline: "Empowering Your Workforce" });
        res.json(created.toObject());
      } else {
        res.json(branding.toObject());
      }
      return;
    }
    let branding = await Branding.findOne({ companyId });
    if (!branding) {
      branding = await Branding.create({ companyName: "Company", primaryColor: "#6366f1", accentColor: "#8b5cf6", theme: "light", companyId });
    }
    res.json(branding.toObject());
  } catch (err) {
    req.log.error({ err }, "Get branding error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/", async (req, res) => {
  try {
    const { verifyToken } = await import("../lib/auth.js");
    const authHeader = req.headers.authorization;
    let companyId = null;
    if (authHeader?.startsWith("Bearer ")) {
      const payload = verifyToken(authHeader.slice(7));
      if (payload) companyId = payload.companyId;
    }

    const { companyName, logoUrl, primaryColor, accentColor, theme, tagline } = req.body;

    if (companyId) {
      const updated = await Branding.findOneAndUpdate(
        { companyId },
        { $set: { companyName: companyName || "Company", logoUrl: logoUrl || null, primaryColor: primaryColor || "#6366f1", accentColor: accentColor || "#8b5cf6", theme: theme || "light", tagline: tagline || null } },
        { new: true, upsert: true },
      );
      res.json(updated.toObject());
    } else {
      const existing = await Branding.findOne();
      if (existing) {
        const updated = await Branding.findByIdAndUpdate(existing._id, { $set: { companyName: companyName || "Flowmative", logoUrl: logoUrl || null, primaryColor: primaryColor || "#6366f1", accentColor: accentColor || "#8b5cf6", theme: theme || "light", tagline: tagline || null } }, { new: true });
        res.json(updated!.toObject());
      } else {
        const created = await Branding.create({ companyName: companyName || "Flowmative", logoUrl: logoUrl || null, primaryColor: primaryColor || "#6366f1", accentColor: accentColor || "#8b5cf6", theme: theme || "light", tagline: tagline || null });
        res.json(created.toObject());
      }
    }
  } catch (err) {
    req.log.error({ err }, "Update branding error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
