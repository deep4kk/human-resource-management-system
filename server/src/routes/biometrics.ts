import { Router } from "express";
import { BiometricSetting, Attendance, Employee } from "@hrms/db";
import { requireAuth, requireRole } from "../lib/auth.js";

const router = Router();
router.use(requireAuth);
const adminOnly = requireRole("admin", "hr");

router.get("/settings", async (req, res) => {
  try {
    const { companyId } = (req as any).user;
    const settings = await BiometricSetting.find({ companyId }).sort({ createdAt: -1 });
    res.json(settings.map((s) => ({ ...s.toObject(), id: s._id, createdAt: s.createdAt!.toISOString(), updatedAt: s.updatedAt!.toISOString(), lastSyncAt: s.lastSyncAt?.toISOString() || null })));
  } catch (err) {
    req.log.error({ err }, "List biometric settings error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/settings", adminOnly, async (req, res) => {
  try {
    const { companyId } = (req as any).user;
    const { deviceBrand, deviceModel, serialNumber, location, importFormat, dateFormat, timeFormat } = req.body;
    const setting = await BiometricSetting.create({ deviceBrand, deviceModel: deviceModel || null, serialNumber: serialNumber || null, location: location || null, importFormat: importFormat || "csv", dateFormat: dateFormat || "YYYY-MM-DD", timeFormat: timeFormat || "HH:mm", companyId });
    res.status(201).json({ ...setting.toObject(), id: setting._id, createdAt: setting.createdAt!.toISOString(), updatedAt: setting.updatedAt!.toISOString(), lastSyncAt: null });
  } catch (err) {
    req.log.error({ err }, "Create biometric setting error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/settings/:id", adminOnly, async (req, res) => {
  try {
    const { deviceBrand, deviceModel, serialNumber, location, importFormat, dateFormat, timeFormat, isActive } = req.body;
    const update: any = {};
    if (deviceBrand) update.deviceBrand = deviceBrand;
    if (deviceModel !== undefined) update.deviceModel = deviceModel;
    if (serialNumber !== undefined) update.serialNumber = serialNumber;
    if (location !== undefined) update.location = location;
    if (importFormat) update.importFormat = importFormat;
    if (dateFormat) update.dateFormat = dateFormat;
    if (timeFormat) update.timeFormat = timeFormat;
    if (isActive !== undefined) update.isActive = isActive;

    const updated = await BiometricSetting.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });
    if (!updated) { res.status(404).json({ error: "Not Found" }); return; }
    res.json({ ...updated.toObject(), id: updated._id, createdAt: updated.createdAt!.toISOString(), updatedAt: updated.updatedAt!.toISOString(), lastSyncAt: updated.lastSyncAt?.toISOString() || null });
  } catch (err) {
    req.log.error({ err }, "Update biometric setting error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/settings/:id", adminOnly, async (req, res) => {
  try {
    await BiometricSetting.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Delete biometric setting error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/import", adminOnly, async (req, res) => {
  try {
    const { companyId } = (req as any).user;
    const { records } = req.body;
    if (!Array.isArray(records) || records.length === 0) {
      res.status(400).json({ error: "records array is required" });
      return;
    }

    let imported = 0, skipped = 0;
    const errors: string[] = [];

    for (const record of records) {
      try {
        const { employeeCode, date, checkIn, checkOut, status } = record;
        if (!employeeCode || !date) { skipped++; continue; }

        const emp = await Employee.findOne({ employeeCode: String(employeeCode), companyId });
        if (!emp) { errors.push(`Employee ${employeeCode} not found`); skipped++; continue; }

        const existing = await Attendance.findOne({ employeeId: emp._id, date, companyId });
        if (existing) {
          await Attendance.findByIdAndUpdate(existing._id, { $set: { checkIn: checkIn || null, checkOut: checkOut || null, status: status || "present", workHours: calcWorkHours(checkIn, checkOut) } });
        } else {
          await Attendance.create({ employeeId: emp._id, date, checkIn: checkIn || null, checkOut: checkOut || null, status: status || "present", workHours: calcWorkHours(checkIn, checkOut), companyId });
        }
        imported++;
      } catch (e: any) { errors.push(e.message); skipped++; }
    }

    await BiometricSetting.findOneAndUpdate({ companyId }, { $set: { lastSyncAt: new Date() } });

    res.json({ imported, skipped, total: records.length, errors: errors.slice(0, 10) });
  } catch (err) {
    req.log.error({ err }, "Biometric import error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

function calcWorkHours(checkIn: string | null, checkOut: string | null): number | null {
  if (!checkIn || !checkOut) return null;
  try {
    const [ih, im] = checkIn.split(":").map(Number);
    const [oh, om] = checkOut.split(":").map(Number);
    const mins = oh * 60 + om - (ih * 60 + im);
    if (mins > 0) return parseFloat((mins / 60).toFixed(2));
  } catch {}
  return null;
}

export default router;
