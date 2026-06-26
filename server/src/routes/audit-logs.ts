import { Router } from "express";
import { AuditLog } from "@hrms/db";
import { requireAuth, requireRole } from "../lib/auth.js";
import { injectCompanyId } from "../lib/tenant.js";

const router = Router();
router.use(requireAuth);
router.use(requireRole("superadmin", "admin"));
router.use(injectCompanyId);

router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 50, action, resource } = req.query;
    const filter: any = {};
    if (req.companyId) filter.companyId = req.companyId;
    if (action) filter.action = action;
    if (resource) filter.resource = resource;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit)),
      AuditLog.countDocuments(filter),
    ]);

    res.json({
      logs: logs.map((l) => ({
        id: l._id,
        actorId: l.actorId,
        actorName: l.actorName,
        actorRole: l.actorRole,
        action: l.action,
        resource: l.resource,
        resourceId: l.resourceId,
        details: l.details,
        ip: l.ip,
        createdAt: l.createdAt.toISOString(),
      })),
      total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (err) {
    req.log.error({ err }, "List audit logs error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
