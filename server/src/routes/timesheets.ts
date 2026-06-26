import { Router } from "express";
import { Timesheet, Employee } from "@hrms/db";
import { requireAuth } from "../lib/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const { companyId } = (req as any).user;
    const { employeeId, startDate, endDate, status } = req.query;
    const filter: any = { companyId };
    if (employeeId) filter.employeeId = employeeId;
    if (status) filter.status = status;
    if (startDate || endDate) { filter.date = {}; if (startDate) filter.date.$gte = startDate; if (endDate) filter.date.$lte = endDate; }

    const records = await Timesheet.find(filter).populate("employeeId", "firstName lastName").sort({ date: 1 });

    res.json(records.map((r) => ({
      id: r._id, employeeId: r.employeeId?._id,
      employeeName: (r.employeeId as any) ? `${(r.employeeId as any).firstName} ${(r.employeeId as any).lastName}` : "",
      date: r.date, project: r.project, task: r.task, hours: r.hours, billable: r.billable,
      description: r.description, status: r.status, createdAt: r.createdAt!.toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "List timesheets error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { companyId } = (req as any).user;
    const { employeeId, date, project, task, hours, billable, description } = req.body;
    const record = await Timesheet.create({ employeeId, date, project, task, hours, billable: billable ?? true, description: description || null, status: "pending", companyId });
    const emp = await Employee.findById(employeeId, "firstName lastName");
    res.status(201).json({ id: record._id, employeeId: record.employeeId, employeeName: emp ? `${emp.firstName} ${emp.lastName}` : "", date: record.date, project: record.project, task: record.task, hours: record.hours, billable: record.billable, description: record.description, status: record.status, createdAt: record.createdAt!.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Create timesheet error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await Timesheet.findByIdAndUpdate(req.params.id, { $set: { status } }, { new: true });
    if (!updated) { res.status(404).json({ error: "Not Found" }); return; }
    const emp = await Employee.findById(updated.employeeId, "firstName lastName");
    res.json({ id: updated._id, employeeId: updated.employeeId, employeeName: emp ? `${emp.firstName} ${emp.lastName}` : "", date: updated.date, project: updated.project, task: updated.task, hours: updated.hours, billable: updated.billable, description: updated.description, status: updated.status, createdAt: updated.createdAt!.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Update timesheet status error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
