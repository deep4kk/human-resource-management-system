import { Router } from "express";
import { db } from "@workspace/db";
import { attendanceTable, leaveRequestsTable, employeesTable } from "@workspace/db/schema";
import { eq, and, sql, gte, lte } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const { employeeId, startDate, endDate, month, year } = req.query;

    const conditions: any[] = [];
    if (employeeId) conditions.push(eq(attendanceTable.employeeId, Number(employeeId)));
    if (startDate) conditions.push(gte(attendanceTable.date, startDate as string));
    if (endDate) conditions.push(lte(attendanceTable.date, endDate as string));
    if (month && year) {
      const start = `${year}-${String(month).padStart(2, "0")}-01`;
      const end = `${year}-${String(month).padStart(2, "0")}-31`;
      conditions.push(gte(attendanceTable.date, start));
      conditions.push(lte(attendanceTable.date, end));
    }

    const records = await db
      .select({
        id: attendanceTable.id,
        employeeId: attendanceTable.employeeId,
        firstName: employeesTable.firstName,
        lastName: employeesTable.lastName,
        date: attendanceTable.date,
        checkIn: attendanceTable.checkIn,
        checkOut: attendanceTable.checkOut,
        status: attendanceTable.status,
        workHours: attendanceTable.workHours,
        notes: attendanceTable.notes,
      })
      .from(attendanceTable)
      .leftJoin(employeesTable, eq(attendanceTable.employeeId, employeesTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(attendanceTable.date);

    res.json(records.map(r => ({
      ...r,
      employeeName: `${r.firstName || ''} ${r.lastName || ''}`.trim(),
      workHours: r.workHours ? Number(r.workHours) : null,
    })));
  } catch (err) {
    req.log.error({ err }, "List attendance error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/today", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    
    const [employees, todayRecords] = await Promise.all([
      db.select({ id: employeesTable.id }).from(employeesTable).where(eq(employeesTable.status, "active")),
      db
        .select({
          id: attendanceTable.id,
          employeeId: attendanceTable.employeeId,
          firstName: employeesTable.firstName,
          lastName: employeesTable.lastName,
          date: attendanceTable.date,
          checkIn: attendanceTable.checkIn,
          checkOut: attendanceTable.checkOut,
          status: attendanceTable.status,
          workHours: attendanceTable.workHours,
          notes: attendanceTable.notes,
        })
        .from(attendanceTable)
        .leftJoin(employeesTable, eq(attendanceTable.employeeId, employeesTable.id))
        .where(eq(attendanceTable.date, today)),
    ]);

    const records = todayRecords.map(r => ({
      ...r,
      employeeName: `${r.firstName || ''} ${r.lastName || ''}`.trim(),
      workHours: r.workHours ? Number(r.workHours) : null,
    }));

    const statusCounts = records.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      date: today,
      totalEmployees: employees.length,
      present: statusCounts["present"] || 0,
      absent: statusCounts["absent"] || 0,
      late: statusCounts["late"] || 0,
      onLeave: statusCounts["on_leave"] || 0,
      records,
    });
  } catch (err) {
    req.log.error({ err }, "Today attendance error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { employeeId, date, checkIn, checkOut, status, notes } = req.body;
    
    let workHours = null;
    if (checkIn && checkOut) {
      const [ih, im] = checkIn.split(":").map(Number);
      const [oh, om] = checkOut.split(":").map(Number);
      workHours = String(((oh * 60 + om) - (ih * 60 + im)) / 60);
    }

    const [record] = await db.insert(attendanceTable).values({
      employeeId,
      date,
      checkIn: checkIn || null,
      checkOut: checkOut || null,
      status,
      workHours,
      notes: notes || null,
    }).returning();

    const emp = await db.select({ firstName: employeesTable.firstName, lastName: employeesTable.lastName })
      .from(employeesTable).where(eq(employeesTable.id, employeeId)).limit(1);

    res.status(201).json({
      ...record,
      employeeName: emp[0] ? `${emp[0].firstName} ${emp[0].lastName}` : "",
      workHours: record.workHours ? Number(record.workHours) : null,
    });
  } catch (err) {
    req.log.error({ err }, "Create attendance error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Leave routes
router.get("/leaves", async (req, res) => {
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

router.post("/leaves", async (req, res) => {
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

router.put("/leaves/:id/status", async (req, res) => {
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
