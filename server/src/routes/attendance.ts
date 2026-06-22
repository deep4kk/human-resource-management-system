import { Router } from "express";
import { db } from "@hrms/db";
import {
  attendanceTable,
  leaveRequestsTable,
  employeesTable,
} from "@hrms/db/schema";
import { eq, and, sql, gte, lte, desc } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";

const router = Router();
router.use(requireAuth);

function getLastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function extractTime(val: string | null | undefined): string | null {
  if (!val) return null;
  if (val.includes("T")) {
    const d = new Date(val);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
  }
  if (/^\d{1,2}:\d{2}/.test(val)) return val;
  return null;
}

router.get("/", async (req, res) => {
  try {
    const { employeeId, startDate, endDate, month, year } = req.query;

    const conditions: any[] = [];
    if (employeeId)
      conditions.push(eq(attendanceTable.employeeId, Number(employeeId)));
    if (startDate)
      conditions.push(gte(attendanceTable.date, startDate as string));
    if (endDate) conditions.push(lte(attendanceTable.date, endDate as string));
    if (month && year) {
      const m = Number(month);
      const y = Number(year);
      const lastDay = getLastDayOfMonth(y, m);
      const start = `${y}-${String(m).padStart(2, "0")}-01`;
      const end = `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
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
      .leftJoin(
        employeesTable,
        eq(attendanceTable.employeeId, employeesTable.id),
      )
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(attendanceTable.date));

    res.json(
      records.map((r) => ({
        ...r,
        employeeName: `${r.firstName || ""} ${r.lastName || ""}`.trim(),
        workHours: r.workHours ? Number(r.workHours) : null,
      })),
    );
  } catch (err) {
    req.log.error({ err }, "List attendance error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/today", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const [employees, todayRecords] = await Promise.all([
      db
        .select({ id: employeesTable.id })
        .from(employeesTable)
        .where(eq(employeesTable.status, "active")),
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
        .leftJoin(
          employeesTable,
          eq(attendanceTable.employeeId, employeesTable.id),
        )
        .where(eq(attendanceTable.date, today)),
    ]);

    const records = todayRecords.map((r) => ({
      ...r,
      employeeName: `${r.firstName || ""} ${r.lastName || ""}`.trim(),
      workHours: r.workHours ? Number(r.workHours) : null,
    }));

    const statusCounts = records.reduce(
      (acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

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

    if (!employeeId || !date || !status) {
      res
        .status(400)
        .json({ error: "employeeId, date, and status are required" });
      return;
    }

    const timeIn = extractTime(checkIn);
    const timeOut = extractTime(checkOut);

    let workHours: string | null = null;
    if (timeIn && timeOut) {
      const [ih, im] = timeIn.split(":").map(Number);
      const [oh, om] = timeOut.split(":").map(Number);
      const mins = oh * 60 + om - (ih * 60 + im);
      if (mins > 0) workHours = (mins / 60).toFixed(2);
    }

    const [record] = await db
      .insert(attendanceTable)
      .values({
        employeeId,
        date,
        checkIn: timeIn,
        checkOut: timeOut,
        status,
        workHours,
        notes: notes || null,
      })
      .returning();

    const emp = await db
      .select({
        firstName: employeesTable.firstName,
        lastName: employeesTable.lastName,
      })
      .from(employeesTable)
      .where(eq(employeesTable.id, employeeId))
      .limit(1);

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

router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { checkOut, status, notes } = req.body;

    const timeOut = extractTime(checkOut);

    const existing = await db
      .select()
      .from(attendanceTable)
      .where(eq(attendanceTable.id, id))
      .limit(1);
    if (!existing[0]) {
      res.status(404).json({ error: "Not Found" });
      return;
    }

    let workHours: string | null = existing[0].workHours;
    if (existing[0].checkIn && timeOut) {
      const [ih, im] = existing[0].checkIn.split(":").map(Number);
      const [oh, om] = timeOut.split(":").map(Number);
      const mins = oh * 60 + om - (ih * 60 + im);
      if (mins > 0) workHours = (mins / 60).toFixed(2);
    }

    const [updated] = await db
      .update(attendanceTable)
      .set({
        ...(timeOut && { checkOut: timeOut }),
        ...(status && { status }),
        ...(notes !== undefined && { notes: notes || null }),
        workHours,
      })
      .where(eq(attendanceTable.id, id))
      .returning();

    const emp = await db
      .select({
        firstName: employeesTable.firstName,
        lastName: employeesTable.lastName,
      })
      .from(employeesTable)
      .where(eq(employeesTable.id, updated.employeeId))
      .limit(1);

    res.json({
      ...updated,
      employeeName: emp[0] ? `${emp[0].firstName} ${emp[0].lastName}` : "",
      workHours: updated.workHours ? Number(updated.workHours) : null,
    });
  } catch (err) {
    req.log.error({ err }, "Update attendance error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/leaves", async (req, res) => {
  try {
    const { employeeId, status } = req.query;
    const conditions: any[] = [];
    if (employeeId)
      conditions.push(eq(leaveRequestsTable.employeeId, Number(employeeId)));
    if (status)
      conditions.push(eq(leaveRequestsTable.status, status as string));

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
      .leftJoin(
        employeesTable,
        eq(leaveRequestsTable.employeeId, employeesTable.id),
      )
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(leaveRequestsTable.createdAt);

    res.json(
      leaves.map((l) => ({
        ...l,
        employeeName: `${l.firstName || ""} ${l.lastName || ""}`.trim(),
        days: Number(l.days),
        approvedByName: null,
        createdAt: l.createdAt.toISOString(),
      })),
    );
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
    const days =
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const [leave] = await db
      .insert(leaveRequestsTable)
      .values({
        employeeId,
        leaveType,
        startDate,
        endDate,
        days: String(days),
        reason,
        status: "pending",
      })
      .returning();

    const emp = await db
      .select({
        firstName: employeesTable.firstName,
        lastName: employeesTable.lastName,
      })
      .from(employeesTable)
      .where(eq(employeesTable.id, employeeId))
      .limit(1);

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
    const [updated] = await db
      .update(leaveRequestsTable)
      .set({ status, approvedBy: approvedBy || null, updatedAt: new Date() })
      .where(eq(leaveRequestsTable.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Not Found" });
      return;
    }

    const emp = await db
      .select({
        firstName: employeesTable.firstName,
        lastName: employeesTable.lastName,
      })
      .from(employeesTable)
      .where(eq(employeesTable.id, updated.employeeId))
      .limit(1);

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
