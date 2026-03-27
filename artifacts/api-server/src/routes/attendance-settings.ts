import { Router } from "express";
import { db } from "@workspace/db";
import { attendanceSettingsTable, featureFlagsTable, attendanceLogsTable } from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth.js";
import { getAttendanceSettings, getFeatureFlags, initDefaultFlags } from "../lib/attendance-engine.js";

const router = Router();
router.use(requireAuth);
const adminOnly = requireRole("admin", "hr");

router.get("/", adminOnly, async (req, res) => {
  try {
    const settings = await getAttendanceSettings();
    const flags = await getFeatureFlags();
    res.json({
      settings: {
        ...settings,
        penaltyValue: Number(settings.penaltyValue),
        fullDayHours: Number(settings.fullDayHours),
        halfDayThreshold: Number(settings.halfDayThreshold),
        absentThreshold: Number(settings.absentThreshold),
        lateAfterTime: settings.lateAfterTime?.substring(0, 5),
        shiftStartTime: settings.shiftStartTime?.substring(0, 5),
        shiftEndTime: settings.shiftEndTime?.substring(0, 5),
        createdAt: settings.createdAt.toISOString(),
        updatedAt: settings.updatedAt.toISOString(),
      },
      flags,
    });
  } catch (err) {
    req.log.error({ err }, "Get attendance settings error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/", adminOnly, async (req, res) => {
  try {
    const {
      lateRuleEnabled, lateAfterTime, graceMinutes, allowedLates, penaltyType, penaltyValue,
      workingHoursEnabled, fullDayHours, halfDayThreshold, absentThreshold,
      shiftEnabled, shiftStartTime, shiftEndTime,
      autoRegularizationEnabled, autoApproveBelowMinutes,
    } = req.body;

    const settings = await getAttendanceSettings();
    
    const fmtTime = (t: string | undefined) => t ? (t.length === 5 ? t + ":00" : t) : undefined;

    const [updated] = await db.update(attendanceSettingsTable).set({
      ...(lateRuleEnabled !== undefined && { lateRuleEnabled }),
      ...(lateAfterTime !== undefined && { lateAfterTime: fmtTime(lateAfterTime) }),
      ...(graceMinutes !== undefined && { graceMinutes }),
      ...(allowedLates !== undefined && { allowedLates }),
      ...(penaltyType !== undefined && { penaltyType }),
      ...(penaltyValue !== undefined && { penaltyValue: String(penaltyValue) }),
      ...(workingHoursEnabled !== undefined && { workingHoursEnabled }),
      ...(fullDayHours !== undefined && { fullDayHours: String(fullDayHours) }),
      ...(halfDayThreshold !== undefined && { halfDayThreshold: String(halfDayThreshold) }),
      ...(absentThreshold !== undefined && { absentThreshold: String(absentThreshold) }),
      ...(shiftEnabled !== undefined && { shiftEnabled }),
      ...(shiftStartTime !== undefined && { shiftStartTime: fmtTime(shiftStartTime) }),
      ...(shiftEndTime !== undefined && { shiftEndTime: fmtTime(shiftEndTime) }),
      ...(autoRegularizationEnabled !== undefined && { autoRegularizationEnabled }),
      ...(autoApproveBelowMinutes !== undefined && { autoApproveBelowMinutes }),
      updatedAt: new Date(),
    }).where(eq(attendanceSettingsTable.id, settings.id)).returning();

    res.json({
      ...updated,
      penaltyValue: Number(updated.penaltyValue),
      fullDayHours: Number(updated.fullDayHours),
      halfDayThreshold: Number(updated.halfDayThreshold),
      absentThreshold: Number(updated.absentThreshold),
      lateAfterTime: updated.lateAfterTime?.substring(0, 5),
      shiftStartTime: updated.shiftStartTime?.substring(0, 5),
      shiftEndTime: updated.shiftEndTime?.substring(0, 5),
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Update attendance settings error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/flags", adminOnly, async (req, res) => {
  try {
    const { flags } = req.body;
    if (!flags || typeof flags !== "object") {
      res.status(400).json({ error: "flags object is required" });
      return;
    }

    await initDefaultFlags();

    for (const [key, enabled] of Object.entries(flags)) {
      await db.update(featureFlagsTable)
        .set({ enabled: enabled as boolean, updatedAt: new Date() })
        .where(eq(featureFlagsTable.flagKey, key));
    }

    const updated = await getFeatureFlags();
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Update feature flags error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/flags/init", adminOnly, async (req, res) => {
  try {
    await initDefaultFlags();
    const flags = await getFeatureFlags();
    res.json(flags);
  } catch (err) {
    req.log.error({ err }, "Init flags error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/logs", adminOnly, async (req, res) => {
  try {
    const { employeeId, date, attendanceId } = req.query;
    const conditions: any[] = [];
    if (employeeId) conditions.push(eq(attendanceLogsTable.employeeId, Number(employeeId)));
    if (date) conditions.push(eq(attendanceLogsTable.date, date as string));
    if (attendanceId) conditions.push(eq(attendanceLogsTable.attendanceId, Number(attendanceId)));

    const logs = await db.select().from(attendanceLogsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(attendanceLogsTable.createdAt))
      .limit(200);

    res.json(logs.map(l => ({
      ...l,
      events: l.events || [],
      createdAt: l.createdAt.toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "Get attendance logs error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
