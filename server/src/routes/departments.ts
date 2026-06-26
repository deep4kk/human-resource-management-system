import { Router } from "express";
import { Department, Employee } from "@hrms/db";
import { requireAuth } from "../lib/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const { companyId } = (req as any).user;
    const departments = await Department.find({ companyId }).sort({ name: 1 });

    const result = await Promise.all(
      departments.map(async (d) => {
        const count = await Employee.countDocuments({ departmentId: d._id, companyId });
        let headName = null;
        if (d.headId) {
          const head = await Employee.findById(d.headId, "firstName lastName");
          if (head) headName = `${head.firstName} ${head.lastName}`;
        }
        return {
          id: d._id,
          name: d.name,
          description: d.description,
          headId: d.headId,
          employeeCount: count,
          headName,
          createdAt: d.createdAt.toISOString(),
        };
      }),
    );

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "List departments error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { companyId } = (req as any).user;
    const { name, description, headId } = req.body;
    const dept = await Department.create({ name, description: description || null, headId: headId || null, companyId });
    res.status(201).json({ id: dept._id, name: dept.name, description: dept.description, headId: dept.headId, employeeCount: 0, headName: null, createdAt: dept.createdAt.toISOString() });
  } catch (err: any) {
    if (err.code === 11000) { res.status(409).json({ error: "Department name already exists" }); return; }
    req.log.error({ err }, "Create department error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { name, description, headId } = req.body;
    const updated = await Department.findByIdAndUpdate(
      req.params.id,
      { $set: { name, description: description || null, headId: headId || null } },
      { new: true },
    );
    if (!updated) { res.status(404).json({ error: "Not Found" }); return; }
    res.json({ id: updated._id, name: updated.name, description: updated.description, headId: updated.headId, employeeCount: 0, headName: null, createdAt: updated.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Update department error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await Department.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Department deleted" });
  } catch (err) {
    req.log.error({ err }, "Delete department error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
