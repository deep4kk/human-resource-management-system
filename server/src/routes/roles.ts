import { Router } from "express";
import { Role, ALL_PERMISSIONS } from "@hrms/db";
import { requireAuth, requireRole } from "../lib/auth.js";
import { injectCompanyId, requireCompanyId } from "../lib/tenant.js";
import { logAudit } from "../lib/audit.js";

const router = Router();
router.use(requireAuth);
router.use(requireRole("superadmin", "admin"));
router.use(injectCompanyId);

router.get("/", async (req, res) => {
  try {
    const filter: any = {};
    if (req.companyId) filter.companyId = req.companyId;
    const roles = await Role.find(filter).sort({ name: 1 });
    res.json(roles.map((r) => ({
      id: r._id,
      name: r.name,
      description: r.description,
      permissions: r.permissions,
      isSystem: r.isSystem,
      companyId: r.companyId,
    })));
  } catch (err) {
    req.log.error({ err }, "List roles error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/permissions", async (_req, res) => {
  res.json(ALL_PERMISSIONS);
});

router.post("/", requireCompanyId, async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    if (!name) {
      res.status(400).json({ error: "Bad Request", message: "Name required" });
      return;
    }
    const role = await Role.create({ name, description, permissions: permissions || [], companyId: req.companyId });
    await logAudit(req, "role.create", "Role", role._id.toString(), { name });
    res.status(201).json({ id: role._id, name: role.name, description: role.description, permissions: role.permissions, isSystem: role.isSystem });
  } catch (err: any) {
    if (err.code === 11000) {
      res.status(409).json({ error: "Conflict", message: "Role name already exists" });
      return;
    }
    req.log.error({ err }, "Create role error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/:id", requireCompanyId, async (req, res) => {
  try {
    const role = await Role.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!role) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    if (role.isSystem) {
      res.status(400).json({ error: "Bad Request", message: "Cannot modify system roles" });
      return;
    }
    const { name, description, permissions } = req.body;
    if (name) role.name = name;
    if (description !== undefined) role.description = description;
    if (permissions) role.permissions = permissions;
    await role.save();
    await logAudit(req, "role.update", "Role", role._id.toString(), { name: role.name });
    res.json({ id: role._id, name: role.name, description: role.description, permissions: role.permissions, isSystem: role.isSystem });
  } catch (err) {
    req.log.error({ err }, "Update role error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/:id", requireCompanyId, async (req, res) => {
  try {
    const role = await Role.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!role) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    if (role.isSystem) {
      res.status(400).json({ error: "Bad Request", message: "Cannot delete system roles" });
      return;
    }
    await Role.deleteOne({ _id: role._id });
    await logAudit(req, "role.delete", "Role", role._id.toString(), { name: role.name });
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Delete role error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
