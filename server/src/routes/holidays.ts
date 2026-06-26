import { Router } from "express";
import { Holiday } from "@hrms/db";
import { requireAuth, requireRole } from "../lib/auth.js";

const router = Router();
router.use(requireAuth);
const adminOnly = requireRole("admin", "hr");

router.get("/", async (req, res) => {
  try {
    const { companyId } = (req as any).user;
    const { year } = req.query;
    const y = year ? Number(year) : new Date().getFullYear();
    const holidays = await Holiday.find({ date: { $gte: `${y}-01-01`, $lte: `${y}-12-31` }, companyId }).sort({ date: 1 });
    res.json(holidays.map((h) => ({ ...h.toObject(), id: h._id, createdAt: h.createdAt!.toISOString() })));
  } catch (err) {
    req.log.error({ err }, "List holidays error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/", adminOnly, async (req, res) => {
  try {
    const { companyId } = (req as any).user;
    const { name, date, type, isOptional } = req.body;
    const holiday = await Holiday.create({ name, date, type: type || "public", isOptional: isOptional || false, companyId });
    res.status(201).json({ ...holiday.toObject(), id: holiday._id, createdAt: holiday.createdAt!.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Create holiday error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/:id", adminOnly, async (req, res) => {
  try {
    const { name, date, type, isOptional } = req.body;
    const update: any = {};
    if (name) update.name = name;
    if (date) update.date = date;
    if (type) update.type = type;
    if (isOptional !== undefined) update.isOptional = isOptional;

    const updated = await Holiday.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });
    if (!updated) { res.status(404).json({ error: "Not Found" }); return; }
    res.json({ ...updated.toObject(), id: updated._id, createdAt: updated.createdAt!.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Update holiday error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/:id", adminOnly, async (req, res) => {
  try {
    await Holiday.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Delete holiday error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
