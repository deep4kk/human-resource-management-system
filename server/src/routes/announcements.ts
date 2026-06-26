import { Router } from "express";
import { Announcement } from "@hrms/db";
import { requireAuth, requireRole } from "../lib/auth.js";

const router = Router();
router.use(requireAuth);
const adminOnly = requireRole("admin", "hr");

router.get("/", async (req, res) => {
  try {
    const { companyId } = (req as any).user;
    const announcements = await Announcement.find({ companyId }).sort({ createdAt: -1 });
    res.json(announcements.map((a) => ({ ...a.toObject(), id: a._id, createdAt: a.createdAt!.toISOString(), updatedAt: a.updatedAt!.toISOString(), expiresAt: a.expiresAt?.toISOString() || null })));
  } catch (err) {
    req.log.error({ err }, "List announcements error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/", adminOnly, async (req, res) => {
  try {
    const { companyId } = (req as any).user;
    const userId = (req as any).user?.userId;
    const { title, content, priority, targetRoles, expiresAt } = req.body;
    const ann = await Announcement.create({ title, content, priority: priority || "normal", targetRoles: targetRoles || "all", publishedBy: userId || null, expiresAt: expiresAt ? new Date(expiresAt) : null, companyId });
    res.status(201).json({ ...ann.toObject(), id: ann._id, createdAt: ann.createdAt!.toISOString(), updatedAt: ann.updatedAt!.toISOString(), expiresAt: ann.expiresAt?.toISOString() || null });
  } catch (err) {
    req.log.error({ err }, "Create announcement error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/:id", adminOnly, async (req, res) => {
  try {
    const { title, content, priority, targetRoles, isActive, expiresAt } = req.body;
    const update: any = {};
    if (title) update.title = title;
    if (content) update.content = content;
    if (priority) update.priority = priority;
    if (targetRoles) update.targetRoles = targetRoles;
    if (isActive !== undefined) update.isActive = isActive;
    if (expiresAt !== undefined) update.expiresAt = expiresAt ? new Date(expiresAt) : null;

    const updated = await Announcement.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });
    if (!updated) { res.status(404).json({ error: "Not Found" }); return; }
    res.json({ ...updated.toObject(), id: updated._id, createdAt: updated.createdAt!.toISOString(), updatedAt: updated.updatedAt!.toISOString(), expiresAt: updated.expiresAt?.toISOString() || null });
  } catch (err) {
    req.log.error({ err }, "Update announcement error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/:id", adminOnly, async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Delete announcement error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
