import { db } from "@workspace/db";
import { attendanceSettingsTable, featureFlagsTable, attendanceLogsTable, attendanceTable } from "@workspace/db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";

export interface AttendanceRecord {
  id?: number;
  employeeId: number;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
  workHours: string | null;
  notes: string | null;
}

export interface EngineResult {
  status: string;
  workHours: string | null;
  isLate: boolean;
  lateMinutes: number;
  events: string[];
  penaltyApplied: boolean;
  penaltyType: string | null;
}

function timeToMinutes(t: string): number {
  const parts = t.split(":");
  return parseInt(parts[0]) * 60 + parseInt(parts[1]);
}

function addMinutesToTime(t: string, mins: number): number {
  return timeToMinutes(t) + mins;
}

export async function getAttendanceSettings() {
  const rows = await db.select().from(attendanceSettingsTable).limit(1);
  if (rows.length === 0) {
    const [defaultSettings] = await db.insert(attendanceSettingsTable).values({}).returning();
    return defaultSettings;
  }
  return rows[0];
}

export async function getFeatureFlags(): Promise<Record<string, boolean>> {
  const rows = await db.select().from(featureFlagsTable);
  const flags: Record<string, boolean> = {
    late_rule: true,
    working_hours_rule: true,
    shift_rule: true,
    auto_regularization: true,
  };
  for (const row of rows) {
    flags[row.flagKey] = row.enabled;
  }
  return flags;
}

export async function initDefaultFlags() {
  const existing = await db.select().from(featureFlagsTable);
  const existingKeys = new Set(existing.map(f => f.flagKey));
  
  const defaults = [
    { flagKey: "late_rule", enabled: true, description: "Enable late arrival detection and penalties" },
    { flagKey: "working_hours_rule", enabled: true, description: "Enable automatic status based on working hours" },
    { flagKey: "shift_rule", enabled: true, description: "Enable shift timing enforcement" },
    { flagKey: "auto_regularization", enabled: true, description: "Enable auto-regularization of minor lates" },
  ];

  for (const d of defaults) {
    if (!existingKeys.has(d.flagKey)) {
      await db.insert(featureFlagsTable).values(d);
    }
  }
}

async function getMonthlyLateCount(employeeId: number, dateStr: string, excludeAttendanceId?: number): Promise<number> {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const conditions = [
    eq(attendanceTable.employeeId, employeeId),
    gte(attendanceTable.date, start),
    lte(attendanceTable.date, end),
    eq(attendanceTable.status, "late"),
  ];

  if (excludeAttendanceId) {
    conditions.push(sql`${attendanceTable.id} != ${excludeAttendanceId}` as any);
  }

  const result = await db.select({ count: sql<number>`count(*)::int` })
    .from(attendanceTable)
    .where(and(...conditions));

  return result[0]?.count || 0;
}

function calculateWorkHours(checkIn: string | null, checkOut: string | null): number {
  if (!checkIn || !checkOut) return 0;
  const inMins = timeToMinutes(checkIn);
  const outMins = timeToMinutes(checkOut);
  const diff = outMins - inMins;
  return diff > 0 ? diff / 60 : 0;
}

export async function processAttendance(record: AttendanceRecord): Promise<EngineResult> {
  const settings = await getAttendanceSettings();
  const flags = await getFeatureFlags();

  const events: string[] = [];
  let status = record.status || "present";
  let isLate = false;
  let lateMinutes = 0;
  let penaltyApplied = false;
  let penaltyType: string | null = null;
  const hours = calculateWorkHours(record.checkIn, record.checkOut);
  let workHours = hours > 0 ? hours.toFixed(2) : record.workHours;

  if (flags.shift_rule && settings.shiftEnabled && record.checkIn) {
    const shiftStart = timeToMinutes(settings.shiftStartTime);
    const checkInMins = timeToMinutes(record.checkIn);
    if (checkInMins > shiftStart) {
      events.push(`Checked in after shift start (${settings.shiftStartTime.substring(0, 5)})`);
    }
  }

  if (flags.late_rule && settings.lateRuleEnabled && record.checkIn) {
    const lateThreshold = addMinutesToTime(settings.lateAfterTime, settings.graceMinutes);
    const checkInMins = timeToMinutes(record.checkIn);
    
    if (checkInMins > lateThreshold) {
      isLate = true;
      lateMinutes = checkInMins - timeToMinutes(settings.lateAfterTime);
      events.push(`Late detected — arrived ${lateMinutes} min after ${settings.lateAfterTime.substring(0, 5)} (grace: ${settings.graceMinutes} min)`);

      if (flags.auto_regularization && settings.autoRegularizationEnabled) {
        if (lateMinutes <= settings.autoApproveBelowMinutes) {
          events.push(`Auto-regularized — late by only ${lateMinutes} min (threshold: ${settings.autoApproveBelowMinutes} min)`);
          isLate = false;
        }
      }

      if (isLate) {
        const monthlyLateCount = await getMonthlyLateCount(record.employeeId, record.date, record.id);
        const totalLates = monthlyLateCount + 1;
        events.push(`Monthly late count: ${totalLates}/${settings.allowedLates} allowed`);
        
        if (totalLates > settings.allowedLates) {
          penaltyApplied = true;
          penaltyType = settings.penaltyType;
          const penaltyVal = Number(settings.penaltyValue);
          events.push(`Penalty applied: ${settings.penaltyType} (exceeded ${settings.allowedLates} lates)`);
          
          if (settings.penaltyType === "half_day") {
            status = "half_day";
          } else if (settings.penaltyType === "deduction") {
            events.push(`Salary deduction: ${penaltyVal} day(s) worth`);
          }
        }
        
        if (status === "present") {
          status = "late";
        }
      }
    }
  }

  if (flags.working_hours_rule && settings.workingHoursEnabled && record.checkIn && record.checkOut) {
    const fullDay = Number(settings.fullDayHours);
    const halfDay = Number(settings.halfDayThreshold);
    const absentThreshold = Number(settings.absentThreshold);

    if (hours < absentThreshold) {
      status = "absent";
      events.push(`Marked Absent — worked ${hours.toFixed(1)}h (threshold: ${absentThreshold}h)`);
    } else if (hours < halfDay) {
      status = "half_day";
      events.push(`Marked Half Day — worked ${hours.toFixed(1)}h (full day: ${fullDay}h)`);
    } else if (hours >= fullDay && status !== "late") {
      status = "present";
      events.push(`Full day — worked ${hours.toFixed(1)}h`);
    } else if (status !== "late") {
      events.push(`Worked ${hours.toFixed(1)}h`);
    }
  }

  if (events.length === 0 && record.checkIn) {
    events.push("Attendance recorded");
  }

  return {
    status,
    workHours,
    isLate,
    lateMinutes,
    events,
    penaltyApplied,
    penaltyType,
  };
}

export async function saveAttendanceLog(attendanceId: number, employeeId: number, date: string, events: string[]) {
  const existing = await db.select().from(attendanceLogsTable)
    .where(and(eq(attendanceLogsTable.attendanceId, attendanceId), eq(attendanceLogsTable.employeeId, employeeId)))
    .limit(1);

  if (existing[0]) {
    await db.update(attendanceLogsTable)
      .set({ events })
      .where(eq(attendanceLogsTable.id, existing[0].id));
  } else {
    await db.insert(attendanceLogsTable).values({
      attendanceId,
      employeeId,
      date,
      events,
    });
  }
}
