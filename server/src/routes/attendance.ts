import { Router } from "express";
import { Attendance, LeaveRequest, Employee } from "@hrms/db";
import { requireAuth } from "../lib/auth.js";

const router = Router();
router.use(requireAuth);

function getLastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

router.get("/", async (req, res) => {
  try {
    const { companyId } = (req as any).user;
    const { employeeId, startDate, endDate, month, year } = req.query;
    const filter: any = { companyId };
    if (employeeId) filter.employeeId = employeeId;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = startDate;
      if (endDate) filter.date.$lte = endDate;
    }
    if (month && year) {
      const m = Number(month);
      const y = Number(year);
      const lastDay = getLastDayOfMonth(y, m);
      filter.date = { $gte: `${y}-${String(m).padStart(2, "0")}-01`, $lte: `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}` };
    }

    const records = await Attendance.find(filter).populate("employeeId", "firstName lastName").sort({ date: -1 });

    res.json(records.map((r) => ({
      id: r._id,
      employeeId: r.employeeId?._id,
      employeeName: (r.employeeId as any) ? `${(r.employeeId as any).firstName} ${(r.employeeId as any).lastName}` : "",
      date: r.date,
      checkIn: r.checkIn,
      checkOut: r.checkOut,
      status: r.status,
      workHours: r.workHours,
      notes: r.notes,
    })));
  } catch (err) {
    req.log.error({ err }, "List attendance error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/today", async (req, res) => {
  try {
    const { companyId } = (req as any).user;
    const today = new Date().toISOString().split("T")[0];

    const [employees, todayRecords] = await Promise.all([
      Employee.find({ status: "active", companyId }, "_id"),
      Attendance.find({ date: today, companyId }).populate("employeeId", "firstName lastName"),
    ]);

    const records = todayRecords.map((r) => ({
      id: r._id,
      employeeId: r.employeeId?._id,
      employeeName: (r.employeeId as any) ? `${(r.employeeId as any).firstName} ${(r.employeeId as any).lastName}` : "",
      date: r.date,
      checkIn: r.checkIn,
      checkOut: r.checkOut,
      status: r.status,
      workHours: r.workHours,
      notes: r.notes,
    }));

    const statusCounts = records.reduce((acc: any, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; }, {});

    res.json({ date: today, totalEmployees: employees.length, present: statusCounts["present"] || 0, absent: statusCounts["absent"] || 0, late: statusCounts["late"] || 0, onLeave: statusCounts["on_leave"] || 0, records });
  } catch (err) {
    req.log.error({ err }, "Today attendance error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { companyId } = (req as any).user;
    const { employeeId, date, checkIn, checkOut, status, notes } = req.body;
    if (!employeeId || !date || !status) {
      res.status(400).json({ error: "employeeId, date, and status are required" });
      return;
    }

    let workHours = null;
    if (checkIn && checkOut) {
      const [ih, im] = checkIn.split(":").map(Number);
      const [oh, om] = checkOut.split(":").map(Number);
      const mins = oh * 60 + om - (ih * 60 + im);
      if (mins > 0) workHours = parseFloat((mins / 60).toFixed(2));
    }

    const record = await Attendance.create({ employeeId, date, checkIn: checkIn || null, checkOut: checkOut || null, status, workHours, notes: notes || null, companyId });

    const emp = await Employee.findById(employeeId, "firstName lastName");

    res.status(201).json({ id: record._id, employeeId: record.employeeId, employeeName: emp ? `${emp.firstName} ${emp.lastName}` : "", date: record.date, checkIn: record.checkIn, checkOut: record.checkOut, status: record.status, workHours: record.workHours, notes: record.notes });
  } catch (err) {
    req.log.error({ err }, "Create attendance error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { checkOut, status, notes } = req.body;
    const existing = await Attendance.findById(req.params.id);
    if (!existing) { res.status(404).json({ error: "Not Found" }); return; }

    let workHours = existing.workHours;
    if (existing.checkIn && checkOut) {
      const [ih, im] = existing.checkIn.split(":").map(Number);
      const [oh, om] = checkOut.split(":").map(Number);
      const mins = oh * 60 + om - (ih * 60 + im);
      if (mins > 0) workHours = parseFloat((mins / 60).toFixed(2));
    }

    const update: any = { workHours };
    if (checkOut) update.checkOut = checkOut;
    if (status) update.status = status;
    if (notes !== undefined) update.notes = notes || null;

    const record = await Attendance.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });
    const emp = await Employee.findById(record!.employeeId, "firstName lastName");
    res.json({ id: record!._id, employeeId: record!.employeeId, employeeName: emp ? `${emp.firstName} ${emp.lastName}` : "", date: record!.date, checkIn: record!.checkIn, checkOut: record!.checkOut, status: record!.status, workHours: record!.workHours, notes: record!.notes });
  } catch (err) {
    req.log.error({ err }, "Update attendance error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/leaves", async (req, res) => {
  try {
    const { companyId } = (req as any).user;
    const { employeeId, status } = req.query;
    const filter: any = { companyId };
    if (employeeId) filter.employeeId = employeeId;
    if (status) filter.status = status;

    const leaves = await LeaveRequest.find(filter).populate("employeeId", "firstName lastName").sort({ createdAt: -1 });

    res.json(leaves.map((l) => ({
      id: l._id,
      employeeId: l.employeeId?._id,
      employeeName: (l.employeeId as any) ? `${(l.employeeId as any).firstName} ${(l.employeeId as any).lastName}` : "",
      leaveType: l.leaveType,
      startDate: l.startDate,
      endDate: l.endDate,
      days: l.days,
      reason: l.reason,
      status: l.status,
      approvedBy: l.approvedBy,
      approvedByName: null,
      createdAt: l.createdAt!.toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "List leaves error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/leaves", async (req, res) => {
  try {
    const { companyId } = (req as any).user;
    const { employeeId, leaveType, startDate, endDate, reason } = req.body;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const leave = await LeaveRequest.create({ employeeId, leaveType, startDate, endDate, days, reason, status: "pending", companyId });
    const emp = await Employee.findById(employeeId, "firstName lastName");

    res.status(201).json({ id: leave._id, employeeId: leave.employeeId, employeeName: emp ? `${emp.firstName} ${emp.lastName}` : "", leaveType: leave.leaveType, startDate: leave.startDate, endDate: leave.endDate, days: leave.days, reason: leave.reason, status: leave.status, approvedBy: null, approvedByName: null, createdAt: leave.createdAt!.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Apply leave error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/leaves/:id/status", async (req, res) => {
  try {
    const { status, approvedBy } = req.body;
    const updated = await LeaveRequest.findByIdAndUpdate(req.params.id, { $set: { status, approvedBy: approvedBy || null } }, { new: true });
    if (!updated) { res.status(404).json({ error: "Not Found" }); return; }

    const emp = await Employee.findById(updated.employeeId, "firstName lastName");
    res.json({ id: updated._id, employeeId: updated.employeeId, employeeName: emp ? `${emp.firstName} ${emp.lastName}` : "", leaveType: updated.leaveType, startDate: updated.startDate, endDate: updated.endDate, days: updated.days, reason: updated.reason, status: updated.status, approvedBy: updated.approvedBy, approvedByName: null, createdAt: updated.createdAt!.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Update leave status error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
