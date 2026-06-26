import { AuditLog } from "@hrms/db";
import type { Request } from "express";

export async function logAudit(
  req: Request,
  action: string,
  resource: string,
  resourceId?: string,
  details?: Record<string, unknown>,
) {
  try {
    const user = req.user;
    if (!user) return;

    await AuditLog.create({
      actorId: user.userId,
      actorName: (req as any).userName || user.userId,
      actorRole: user.role,
      action,
      resource,
      resourceId,
      details,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      companyId: user.companyId,
    });
  } catch (err) {
    req.log?.error?.({ err }, "Failed to write audit log");
  }
}
