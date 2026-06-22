import { Router } from "express";
import { db } from "@hrms/db";
import {
  employeesTable,
  attendanceTable,
  leaveRequestsTable,
  payrollTable,
  timesheetsTable,
  departmentsTable,
} from "@hrms/db/schema";
import { eq, sql, and, gte, lte } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";

const router = Router();
router.use(requireAuth);

function getLastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

router.get("/stats", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalEmpResult,
      activeEmpResult,
      onLeaveResult,
      newHiresResult,
      todayAttResult,
      pendingLeavesResult,
      pendingTimesheetsResult,
      payrollResult,
      deptResult,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(employeesTable),
      db
        .select({ count: sql<number>`count(*)` })
        .from(employeesTable)
        .where(eq(employeesTable.status, "active")),
      db
        .select({ count: sql<number>`count(*)` })
        .from(employeesTable)
        .where(eq(employeesTable.status, "on_leave")),
      db
        .select({ count: sql<number>`count(*)` })
        .from(employeesTable)
        .where(
          gte(
            employeesTable.joinDate,
            thirtyDaysAgo.toISOString().split("T")[0],
          ),
        ),
      db
        .select({
          status: attendanceTable.status,
          count: sql<number>`count(*)`,
        })
        .from(attendanceTable)
        .where(eq(attendanceTable.date, today))
        .groupBy(attendanceTable.status),
      db
        .select({ count: sql<number>`count(*)` })
        .from(leaveRequestsTable)
        .where(eq(leaveRequestsTable.status, "pending")),
      db
        .select({ count: sql<number>`count(*)` })
        .from(timesheetsTable)
        .where(eq(timesheetsTable.status, "pending")),
      db
        .select({ total: sql<number>`sum(net_salary)` })
        .from(payrollTable)
        .where(
          and(
            eq(payrollTable.month, new Date().getMonth() + 1),
            eq(payrollTable.year, new Date().getFullYear()),
          ),
        ),
      db.select({ count: sql<number>`count(*)` }).from(departmentsTable),
    ]);

    const attendanceCounts = todayAttResult.reduce(
      (acc, r) => {
        acc[r.status] = Number(r.count);
        return acc;
      },
      {} as Record<string, number>,
    );

    res.json({
      totalEmployees: Number(totalEmpResult[0]?.count || 0),
      activeEmployees: Number(activeEmpResult[0]?.count || 0),
      onLeave: Number(onLeaveResult[0]?.count || 0),
      newHires: Number(newHiresResult[0]?.count || 0),
      presentToday: attendanceCounts["present"] || 0,
      absentToday: attendanceCounts["absent"] || 0,
      pendingLeaves: Number(pendingLeavesResult[0]?.count || 0),
      pendingTimesheets: Number(pendingTimesheetsResult[0]?.count || 0),
      totalPayrollThisMonth: Number(payrollResult[0]?.total || 0),
      departments: Number(deptResult[0]?.count || 0),
    });
  } catch (err) {
    req.log.error({ err }, "Dashboard stats error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/charts", async (req, res) => {
  try {
    const attendanceTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const monthStr = d.toLocaleString("default", { month: "short" });
      const lastDay = getLastDayOfMonth(y, m);
      const start = `${y}-${String(m).padStart(2, "0")}-01`;
      const end = `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

      const counts = await db
        .select({
          status: attendanceTable.status,
          count: sql<number>`count(*)`,
        })
        .from(attendanceTable)
        .where(
          and(gte(attendanceTable.date, start), lte(attendanceTable.date, end)),
        )
        .groupBy(attendanceTable.status);

      const byStatus = counts.reduce(
        (acc, c) => {
          acc[c.status] = Number(c.count);
          return acc;
        },
        {} as Record<string, number>,
      );
      attendanceTrend.push({
        month: monthStr,
        present: byStatus["present"] || 0,
        absent: byStatus["absent"] || 0,
        late: byStatus["late"] || 0,
      });
    }

    const depts = await db
      .select({
        name: departmentsTable.name,
        count: sql<number>`count(${employeesTable.id})`,
      })
      .from(departmentsTable)
      .leftJoin(
        employeesTable,
        eq(employeesTable.departmentId, departmentsTable.id),
      )
      .groupBy(departmentsTable.name);

    const departmentDistribution = depts.map((d) => ({
      department: d.name,
      count: Number(d.count),
    }));

    const payrollTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const monthStr = d.toLocaleString("default", { month: "short" });

      const result = await db
        .select({ total: sql<number>`sum(net_salary)` })
        .from(payrollTable)
        .where(and(eq(payrollTable.month, m), eq(payrollTable.year, y)));

      payrollTrend.push({
        month: monthStr,
        amount: Number(result[0]?.total || 0),
      });
    }

    const leaves = await db
      .select({
        type: leaveRequestsTable.leaveType,
        count: sql<number>`count(*)`,
      })
      .from(leaveRequestsTable)
      .groupBy(leaveRequestsTable.leaveType);
    const leaveByType = leaves.map((l) => ({
      type: l.type,
      count: Number(l.count),
    }));

    res.json({
      attendanceTrend,
      departmentDistribution,
      payrollTrend,
      leaveByType,
    });
  } catch (err) {
    req.log.error({ err }, "Dashboard charts error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
