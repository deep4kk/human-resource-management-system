import { Router } from "express";
import { db } from "@workspace/db";
import { biometricSettingsTable, attendanceTable, employeesTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth.js";

const router = Router();
router.use(requireAuth);
const adminOnly = requireRole("admin", "hr");

router.get("/settings", async (req, res) => {
  try {
    const settings = await db.select().from(biometricSettingsTable).orderBy(biometricSettingsTable.createdAt);
    res.json(settings.map(s => ({ ...s, createdAt: s.createdAt.toISOString(), updatedAt: s.updatedAt.toISOString(), lastSyncAt: s.lastSyncAt?.toISOString() || null })));
  } catch (err) {
    req.log.error({ err }, "List biometric settings error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/settings", adminOnly, async (req, res) => {
  try {
    const { deviceBrand, deviceModel, serialNumber, location, importFormat, dateFormat, timeFormat } = req.body;
    const [setting] = await db.insert(biometricSettingsTable).values({
      deviceBrand, deviceModel: deviceModel || null, serialNumber: serialNumber || null,
      location: location || null, importFormat: importFormat || "csv",
      dateFormat: dateFormat || "YYYY-MM-DD", timeFormat: timeFormat || "HH:mm",
    }).returning();
    res.status(201).json({ ...setting, createdAt: setting.createdAt.toISOString(), updatedAt: setting.updatedAt.toISOString(), lastSyncAt: null });
  } catch (err) {
    req.log.error({ err }, "Create biometric setting error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/settings/:id", adminOnly, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { deviceBrand, deviceModel, serialNumber, location, importFormat, dateFormat, timeFormat, isActive } = req.body;
    const [updated] = await db.update(biometricSettingsTable).set({
      ...(deviceBrand && { deviceBrand }),
      ...(deviceModel !== undefined && { deviceModel }),
      ...(serialNumber !== undefined && { serialNumber }),
      ...(location !== undefined && { location }),
      ...(importFormat && { importFormat }),
      ...(dateFormat && { dateFormat }),
      ...(timeFormat && { timeFormat }),
      ...(isActive !== undefined && { isActive }),
      updatedAt: new Date(),
    }).where(eq(biometricSettingsTable.id, id)).returning();
    if (!updated) { res.status(404).json({ error: "Not Found" }); return; }
    res.json({ ...updated, createdAt: updated.createdAt.toISOString(), updatedAt: updated.updatedAt.toISOString(), lastSyncAt: updated.lastSyncAt?.toISOString() || null });
  } catch (err) {
    req.log.error({ err }, "Update biometric setting error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/settings/:id", adminOnly, async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(biometricSettingsTable).where(eq(biometricSettingsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Delete biometric setting error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/import", adminOnly, async (req, res) => {
  try {
    const { records } = req.body;
    if (!Array.isArray(records) || records.length === 0) {
      res.status(400).json({ error: "records array is required" });
      return;
    }

    let imported = 0;
    let skipped = 0;
    let errors: string[] = [];

    for (const record of records) {
      try {
        const { employeeCode, date, checkIn, checkOut, status } = record;
        if (!employeeCode || !date) { skipped++; continue; }

        const emp = await db.select({ id: employeesTable.id })
          .from(employeesTable)
          .where(eq(employeesTable.employeeCode, String(employeeCode)))
          .limit(1);
        
        if (!emp[0]) { errors.push(`Employee ${employeeCode} not found`); skipped++; continue; }

        const existing = await db.select({ id: attendanceTable.id })
          .from(attendanceTable)
          .where(and(eq(attendanceTable.employeeId, emp[0].id), eq(attendanceTable.date, date)))
          .limit(1);
        
        if (existing[0]) {
          await db.update(attendanceTable).set({
            checkIn: checkIn || null,
            checkOut: checkOut || null,
            status: status || "present",
            workHours: calcWorkHours(checkIn, checkOut),
          }).where(eq(attendanceTable.id, existing[0].id));
        } else {
          await db.insert(attendanceTable).values({
            employeeId: emp[0].id,
            date,
            checkIn: checkIn || null,
            checkOut: checkOut || null,
            status: status || "present",
            workHours: calcWorkHours(checkIn, checkOut),
          });
        }
        imported++;
      } catch (e: any) {
        errors.push(e.message);
        skipped++;
      }
    }

    await db.update(biometricSettingsTable).set({ lastSyncAt: new Date(), updatedAt: new Date() });

    res.json({ imported, skipped, total: records.length, errors: errors.slice(0, 10) });
  } catch (err) {
    req.log.error({ err }, "Biometric import error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

function calcWorkHours(checkIn: string | null, checkOut: string | null): string | null {
  if (!checkIn || !checkOut) return null;
  try {
    const [ih, im] = checkIn.split(":").map(Number);
    const [oh, om] = checkOut.split(":").map(Number);
    const mins = (oh * 60 + om) - (ih * 60 + im);
    if (mins > 0) return (mins / 60).toFixed(2);
  } catch {}
  return null;
}

export default router;
