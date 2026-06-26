import { Router } from "express";
import { Kpi, Appraisal, Employee } from "@hrms/db";
import { requireAuth } from "../lib/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/kpis", async (req, res) => {
  try {
    const { companyId } = (req as any).user;
    const { employeeId } = req.query;
    const filter: any = { companyId };
    if (employeeId) filter.employeeId = employeeId;

    const records = await Kpi.find(filter).populate("employeeId", "firstName lastName");
    res.json(records.map((r) => ({
      id: r._id, employeeId: r.employeeId?._id,
      employeeName: (r.employeeId as any) ? `${(r.employeeId as any).firstName} ${(r.employeeId as any).lastName}` : "",
      title: r.title, description: r.description, target: r.target, achieved: r.achieved,
      unit: r.unit, period: r.period, status: r.status, createdAt: r.createdAt!.toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "List KPIs error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/kpis", async (req, res) => {
  try {
    const { companyId } = (req as any).user;
    const { employeeId, title, description, target, achieved, unit, period, status } = req.body;
    const record = await Kpi.create({ employeeId, title, description: description || null, target, achieved: achieved || 0, unit, period, status: status || "on_track", companyId });
    const emp = await Employee.findById(employeeId, "firstName lastName");
    res.status(201).json({ id: record._id, employeeId: record.employeeId, employeeName: emp ? `${emp.firstName} ${emp.lastName}` : "", title: record.title, description: record.description, target: record.target, achieved: record.achieved, unit: record.unit, period: record.period, status: record.status, createdAt: record.createdAt!.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Create KPI error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/appraisals", async (req, res) => {
  try {
    const { companyId } = (req as any).user;
    const { employeeId } = req.query;
    const filter: any = { companyId };
    if (employeeId) filter.employeeId = employeeId;

    const records = await Appraisal.find(filter).populate("employeeId", "firstName lastName").populate("reviewerId", "firstName lastName");

    res.json(records.map((r) => {
      const emp = r.employeeId as any;
      const rev = r.reviewerId as any;
      return {
        id: r._id, employeeId: r.employeeId?._id,
        employeeName: emp ? `${emp.firstName} ${emp.lastName}` : "",
        reviewerId: r.reviewerId?._id,
        reviewerName: rev ? `${rev.firstName} ${rev.lastName}` : "",
        period: r.period, overallRating: r.overallRating,
        technicalSkills: r.technicalSkills, communication: r.communication,
        teamwork: r.teamwork, leadership: r.leadership, comments: r.comments,
        status: r.status, createdAt: r.createdAt!.toISOString(),
      };
    }));
  } catch (err) {
    req.log.error({ err }, "List appraisals error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/appraisals", async (req, res) => {
  try {
    const { companyId } = (req as any).user;
    const { employeeId, reviewerId, period, overallRating, technicalSkills, communication, teamwork, leadership, comments } = req.body;
    const record = await Appraisal.create({ employeeId, reviewerId, period, overallRating, technicalSkills, communication, teamwork, leadership, comments: comments || null, status: "submitted", companyId });
    const [emp, rev] = await Promise.all([
      Employee.findById(employeeId, "firstName lastName"),
      Employee.findById(reviewerId, "firstName lastName"),
    ]);
    res.status(201).json({ id: record._id, employeeId: record.employeeId, employeeName: emp ? `${emp.firstName} ${emp.lastName}` : "", reviewerId: record.reviewerId, reviewerName: rev ? `${rev.firstName} ${rev.lastName}` : "", period: record.period, overallRating: record.overallRating, technicalSkills: record.technicalSkills, communication: record.communication, teamwork: record.teamwork, leadership: record.leadership, comments: record.comments, status: record.status, createdAt: record.createdAt!.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Create appraisal error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
