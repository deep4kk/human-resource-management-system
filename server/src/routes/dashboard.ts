import { Router } from "express";
import { Employee, Attendance, LeaveRequest, Payroll, Timesheet, Department } from "@hrms/db";
import { requireAuth } from "../lib/auth.js";

const router = Router();
router.use(requireAuth);

function getLastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

router.get("/stats", async (req, res) => {
  try {
    const { companyId } = (req as any).user;
    const today = new Date().toISOString().split("T")[0];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

    const [totalEmployees, activeEmployees, onLeave, newHires, todayAttendance, pendingLeaves, pendingTimesheets, payrollTotal, departments] = await Promise.all([
      Employee.countDocuments({ companyId }),
      Employee.countDocuments({ status: "active", companyId }),
      Employee.countDocuments({ status: "on_leave", companyId }),
      Employee.countDocuments({ joinDate: { $gte: thirtyDaysAgoStr }, companyId }),
      Attendance.find({ date: today, companyId }),
      LeaveRequest.countDocuments({ status: "pending", companyId }),
      Timesheet.countDocuments({ status: "pending", companyId }),
      Payroll.aggregate([{ $match: { month: new Date().getMonth() + 1, year: new Date().getFullYear(), companyId } }, { $group: { _id: null, total: { $sum: "$netSalary" } } }]),
      Department.countDocuments({ companyId }),
    ]);

    const attendanceCounts: Record<string, number> = {};
    todayAttendance.forEach((r) => { attendanceCounts[r.status] = (attendanceCounts[r.status] || 0) + 1; });

    res.json({
      totalEmployees, activeEmployees, onLeave, newHires,
      presentToday: attendanceCounts["present"] || 0,
      absentToday: attendanceCounts["absent"] || 0,
      pendingLeaves, pendingTimesheets,
      totalPayrollThisMonth: payrollTotal[0]?.total || 0,
      departments,
    });
  } catch (err) {
    req.log.error({ err }, "Dashboard stats error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/charts", async (req, res) => {
  try {
    const { companyId } = (req as any).user;
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

      const counts = await Attendance.aggregate([
        { $match: { date: { $gte: start, $lte: end }, companyId } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]);
      const byStatus: Record<string, number> = {};
      counts.forEach((c: any) => { byStatus[c._id] = c.count; });

      attendanceTrend.push({ month: monthStr, present: byStatus["present"] || 0, absent: byStatus["absent"] || 0, late: byStatus["late"] || 0 });
    }

    const deptData = await Department.aggregate([
      { $match: { companyId } },
      { $lookup: { from: "employees", localField: "_id", foreignField: "departmentId", as: "emps" } },
      { $project: { name: 1, count: { $size: "$emps" } } },
    ]);
    const departmentDistribution = deptData.map((d: any) => ({ department: d.name, count: d.count }));

    const payrollTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const monthStr = d.toLocaleString("default", { month: "short" });
      const result = await Payroll.aggregate([{ $match: { month: m, year: y, companyId } }, { $group: { _id: null, total: { $sum: "$netSalary" } } }]);
      payrollTrend.push({ month: monthStr, amount: result[0]?.total || 0 });
    }

    const leaveData = await LeaveRequest.aggregate([{ $match: { companyId } }, { $group: { _id: "$leaveType", count: { $sum: 1 } } }]);
    const leaveByType = leaveData.map((l: any) => ({ type: l._id, count: l.count }));

    res.json({ attendanceTrend, departmentDistribution, payrollTrend, leaveByType });
  } catch (err) {
    req.log.error({ err }, "Dashboard charts error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
