import { Router } from "express";
import { CompanyPolicy } from "@hrms/db";
import { requireAuth, requireRole } from "../lib/auth.js";

const router = Router();
router.use(requireAuth);
const adminOnly = requireRole("admin", "hr");

router.get("/", async (req, res) => {
  try {
    const { companyId } = (req as any).user;
    const { category } = req.query;
    const filter: any = { companyId };
    if (category) filter.category = category;

    const policies = await CompanyPolicy.find(filter).sort({ createdAt: -1 });
    res.json(policies.map((p) => ({ ...p.toObject(), id: p._id, createdAt: p.createdAt!.toISOString(), updatedAt: p.updatedAt!.toISOString() })));
  } catch (err) {
    req.log.error({ err }, "List policies error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/", adminOnly, async (req, res) => {
  try {
    const { companyId } = (req as any).user;
    const userId = (req as any).user?.userId;
    const { title, category, content, version } = req.body;
    const policy = await CompanyPolicy.create({ title, category, content, version: version || "1.0", createdBy: userId || null, companyId });
    res.status(201).json({ ...policy.toObject(), id: policy._id, createdAt: policy.createdAt!.toISOString(), updatedAt: policy.updatedAt!.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Create policy error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/:id", adminOnly, async (req, res) => {
  try {
    const { title, category, content, version, isActive } = req.body;
    const update: any = {};
    if (title) update.title = title;
    if (category) update.category = category;
    if (content) update.content = content;
    if (version) update.version = version;
    if (isActive !== undefined) update.isActive = isActive;

    const updated = await CompanyPolicy.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });
    if (!updated) { res.status(404).json({ error: "Not Found" }); return; }
    res.json({ ...updated.toObject(), id: updated._id, createdAt: updated.createdAt!.toISOString(), updatedAt: updated.updatedAt!.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Update policy error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/:id", adminOnly, async (req, res) => {
  try {
    await CompanyPolicy.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Delete policy error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
