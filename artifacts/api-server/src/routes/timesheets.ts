import { Router } from "express";
import { db } from "@workspace/db";
import { timesheetsTable, employeesTable } from "@workspace/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const { employeeId, startDate, endDate, status } = req.query;
    const conditions: any[] = [];
    if (employeeId) conditions.push(eq(timesheetsTable.employeeId, Number(employeeId)));
    if (startDate) conditions.push(gte(timesheetsTable.date, startDate as string));
    if (endDate) conditions.push(lte(timesheetsTable.date, endDate as string));
    if (status) conditions.push(eq(timesheetsTable.status, status as string));

    const records = await db
      .select({
        id: timesheetsTable.id,
        employeeId: timesheetsTable.employeeId,
        firstName: employeesTable.firstName,
        lastName: employeesTable.lastName,
        date: timesheetsTable.date,
        project: timesheetsTable.project,
        task: timesheetsTable.task,
        hours: timesheetsTable.hours,
        billable: timesheetsTable.billable,
        description: timesheetsTable.description,
        status: timesheetsTable.status,
        createdAt: timesheetsTable.createdAt,
      })
      .from(timesheetsTable)
      .leftJoin(employeesTable, eq(timesheetsTable.employeeId, employeesTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(timesheetsTable.date);

    res.json(records.map(r => ({
      ...r,
      employeeName: `${r.firstName || ''} ${r.lastName || ''}`.trim(),
      hours: Number(r.hours),
      createdAt: r.createdAt.toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "List timesheets error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { employeeId, date, project, task, hours, billable, description } = req.body;
    const [record] = await db.insert(timesheetsTable).values({
      employeeId,
      date,
      project,
      task,
      hours: String(hours),
      billable: billable ?? true,
      description: description || null,
      status: "pending",
    }).returning();

    const emp = await db.select({ firstName: employeesTable.firstName, lastName: employeesTable.lastName })
      .from(employeesTable).where(eq(employeesTable.id, employeeId)).limit(1);

    res.status(201).json({
      ...record,
      employeeName: emp[0] ? `${emp[0].firstName} ${emp[0].lastName}` : "",
      hours: Number(record.hours),
      createdAt: record.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Create timesheet error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/:id/status", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;
    const [updated] = await db.update(timesheetsTable)
      .set({ status, updatedAt: new Date() })
      .where(eq(timesheetsTable.id, id))
      .returning();
    if (!updated) { res.status(404).json({ error: "Not Found" }); return; }

    const emp = await db.select({ firstName: employeesTable.firstName, lastName: employeesTable.lastName })
      .from(employeesTable).where(eq(employeesTable.id, updated.employeeId)).limit(1);

    res.json({
      ...updated,
      employeeName: emp[0] ? `${emp[0].firstName} ${emp[0].lastName}` : "",
      hours: Number(updated.hours),
      createdAt: updated.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Update timesheet status error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
