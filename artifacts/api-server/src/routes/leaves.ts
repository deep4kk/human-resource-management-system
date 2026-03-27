import { Router } from "express";
import { db } from "@workspace/db";
import { leaveRequestsTable, employeesTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const { employeeId, status } = req.query;
    const conditions: any[] = [];
    if (employeeId) conditions.push(eq(leaveRequestsTable.employeeId, Number(employeeId)));
    if (status) conditions.push(eq(leaveRequestsTable.status, status as string));

    const leaves = await db
      .select({
        id: leaveRequestsTable.id,
        employeeId: leaveRequestsTable.employeeId,
        firstName: employeesTable.firstName,
        lastName: employeesTable.lastName,
        leaveType: leaveRequestsTable.leaveType,
        startDate: leaveRequestsTable.startDate,
        endDate: leaveRequestsTable.endDate,
        days: leaveRequestsTable.days,
        reason: leaveRequestsTable.reason,
        status: leaveRequestsTable.status,
        approvedBy: leaveRequestsTable.approvedBy,
        createdAt: leaveRequestsTable.createdAt,
      })
      .from(leaveRequestsTable)
      .leftJoin(employeesTable, eq(leaveRequestsTable.employeeId, employeesTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(leaveRequestsTable.createdAt);

    res.json(leaves.map(l => ({
      ...l,
      employeeName: `${l.firstName || ''} ${l.lastName || ''}`.trim(),
      days: Number(l.days),
      approvedByName: null,
      createdAt: l.createdAt.toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "List leaves error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { employeeId, leaveType, startDate, endDate, reason } = req.body;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const [leave] = await db.insert(leaveRequestsTable).values({
      employeeId,
      leaveType,
      startDate,
      endDate,
      days: String(days),
      reason,
      status: "pending",
    }).returning();

    const emp = await db.select({ firstName: employeesTable.firstName, lastName: employeesTable.lastName })
      .from(employeesTable).where(eq(employeesTable.id, employeeId)).limit(1);

    res.status(201).json({
      ...leave,
      employeeName: emp[0] ? `${emp[0].firstName} ${emp[0].lastName}` : "",
      days: Number(leave.days),
      approvedByName: null,
      createdAt: leave.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Apply leave error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/:id/status", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status, approvedBy } = req.body;
    const [updated] = await db.update(leaveRequestsTable)
      .set({ status, approvedBy: approvedBy || null, updatedAt: new Date() })
      .where(eq(leaveRequestsTable.id, id))
      .returning();
    if (!updated) { res.status(404).json({ error: "Not Found" }); return; }

    const emp = await db.select({ firstName: employeesTable.firstName, lastName: employeesTable.lastName })
      .from(employeesTable).where(eq(employeesTable.id, updated.employeeId)).limit(1);

    res.json({
      ...updated,
      employeeName: emp[0] ? `${emp[0].firstName} ${emp[0].lastName}` : "",
      days: Number(updated.days),
      approvedByName: null,
      createdAt: updated.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Update leave status error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
