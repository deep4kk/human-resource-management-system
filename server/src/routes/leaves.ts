import { Router } from "express";
import { LeaveRequest, Employee } from "@hrms/db";
import { requireAuth } from "../lib/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
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

router.post("/", async (req, res) => {
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

router.put("/:id/status", async (req, res) => {
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
