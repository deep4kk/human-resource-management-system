import { Router } from "express";
import { AttendanceRule } from "@hrms/db";
import { requireAuth } from "../lib/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const { companyId } = (req as any).user;
    const rules = await AttendanceRule.find({ companyId }).sort({ ruleName: 1 });
    res.json(rules);
  } catch (err) {
    req.log.error({ err }, "List attendance rules error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { companyId } = (req as any).user;
    const b = req.body;
    const rule = await AttendanceRule.create({
      ruleName: b.ruleName, description: b.description || null,
      isActive: b.isActive ?? true, appliesTo: b.appliesTo ?? "all",
      shiftStart: b.shiftStart ?? "09:00:00", shiftEnd: b.shiftEnd ?? "18:00:00",
      expectedHours: b.expectedHours ?? 8.0,
      gracePeriodMinutes: b.gracePeriodMinutes ?? 15,
      lateThresholdMinutes: b.lateThresholdMinutes ?? 30,
      halfDayEnabled: b.halfDayEnabled ?? true,
      halfDayMaxHours: b.halfDayMaxHours ?? 4.5,
      halfDayMinHours: b.halfDayMinHours ?? 3.0,
      shortLeaveEnabled: b.shortLeaveEnabled ?? true,
      shortLeaveMaxHours: b.shortLeaveMaxHours ?? 2.0,
      shortLeaveMaxPerMonth: b.shortLeaveMaxPerMonth ?? 2,
      absentIfNoCheckIn: b.absentIfNoCheckIn ?? false,
      absentCheckInCutoff: b.absentCheckInCutoff || null,
      overtimeEnabled: b.overtimeEnabled ?? false,
      overtimeThresholdHours: b.overtimeThresholdHours || null,
      weekendDays: b.weekendDays ?? "saturday,sunday",
      countHolidaysAsPresent: b.countHolidaysAsPresent ?? true,
      companyId,
    });
    res.status(201).json(rule);
  } catch (err) {
    req.log.error({ err }, "Create attendance rule error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const b = req.body;
    const update: any = {
      ruleName: b.ruleName, description: b.description || null,
      isActive: b.isActive, appliesTo: b.appliesTo,
      shiftStart: b.shiftStart, shiftEnd: b.shiftEnd,
      expectedHours: b.expectedHours,
      gracePeriodMinutes: b.gracePeriodMinutes,
      lateThresholdMinutes: b.lateThresholdMinutes,
      halfDayEnabled: b.halfDayEnabled,
      halfDayMaxHours: b.halfDayMaxHours, halfDayMinHours: b.halfDayMinHours,
      shortLeaveEnabled: b.shortLeaveEnabled,
      shortLeaveMaxHours: b.shortLeaveMaxHours,
      shortLeaveMaxPerMonth: b.shortLeaveMaxPerMonth,
      absentIfNoCheckIn: b.absentIfNoCheckIn,
      absentCheckInCutoff: b.absentCheckInCutoff || null,
      overtimeEnabled: b.overtimeEnabled,
      overtimeThresholdHours: b.overtimeThresholdHours || null,
      weekendDays: b.weekendDays,
      countHolidaysAsPresent: b.countHolidaysAsPresent,
    };
    const updated = await AttendanceRule.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });
    if (!updated) { res.status(404).json({ error: "Not Found" }); return; }
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Update attendance rule error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await AttendanceRule.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Delete attendance rule error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.patch("/:id/toggle", async (req, res) => {
  try {
    const rule = await AttendanceRule.findById(req.params.id);
    if (!rule) { res.status(404).json({ error: "Not Found" }); return; }
    rule.isActive = !rule.isActive;
    await rule.save();
    res.json(rule);
  } catch (err) {
    req.log.error({ err }, "Toggle attendance rule error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
