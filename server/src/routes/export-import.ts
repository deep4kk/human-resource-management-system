import { Router } from "express";
import { Employee, Attendance, Payroll, Department } from "@hrms/db";
import { requireAuth, requireRole } from "../lib/auth.js";
import { injectCompanyId, requireCompanyId } from "../lib/tenant.js";
import { parse } from "csv-parse/sync";

const router = Router();
router.use(requireAuth);
router.use(requireRole("admin", "hr"));
router.use(injectCompanyId);
router.use(requireCompanyId);

router.get("/employees/csv", async (req, res) => {
  try {
    const employees = await Employee.find({ companyId: req.companyId })
      .populate("departmentId", "name")
      .lean();

    const headers = ["EmployeeCode", "FirstName", "LastName", "Email", "Phone", "Department", "Designation", "Status", "JoinDate", "Salary"];
    const rows = employees.map((e: any) => [
      e.employeeCode, e.firstName, e.lastName, e.email, e.phone || "",
      (e.departmentId as any)?.name || "", e.designation || "", e.status, e.joinDate || "", e.salary || "",
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.map((v: string) => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=employees.csv");
    res.send(csv);
  } catch (err) {
    req.log.error({ err }, "Export employees CSV error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/attendance/csv", async (req, res) => {
  try {
    const records = await Attendance.find({ companyId: req.companyId })
      .populate("employeeId", "firstName lastName employeeCode")
      .sort({ date: -1 })
      .lean();

    const headers = ["EmployeeCode", "EmployeeName", "Date", "CheckIn", "CheckOut", "Status", "WorkHours", "Notes"];
    const rows = records.map((r: any) => [
      (r.employeeId as any)?.employeeCode || "",
      `${(r.employeeId as any)?.firstName || ""} ${(r.employeeId as any)?.lastName || ""}`,
      r.date, r.checkIn || "", r.checkOut || "", r.status, r.workHours || "", r.notes || "",
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.map((v: string) => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=attendance.csv");
    res.send(csv);
  } catch (err) {
    req.log.error({ err }, "Export attendance CSV error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/payroll/csv", async (req, res) => {
  try {
    const records = await Payroll.find({ companyId: req.companyId })
      .populate("employeeId", "firstName lastName employeeCode")
      .sort({ year: -1, month: -1 })
      .lean();

    const headers = ["EmployeeCode", "EmployeeName", "Month", "Year", "BasicSalary", "HRA", "Allowances", "GrossSalary", "PF", "ESI", "TDS", "Deductions", "NetSalary", "Status"];
    const rows = records.map((r: any) => [
      (r.employeeId as any)?.employeeCode || "",
      `${(r.employeeId as any)?.firstName || ""} ${(r.employeeId as any)?.lastName || ""}`,
      r.month, r.year, r.basicSalary || "", r.hra || "", r.allowances || "",
      r.grossSalary || "", r.pf || "", r.esi || "", r.tds || "", r.deductions || "",
      r.netSalary || "", r.status,
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.map((v: string) => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=payroll.csv");
    res.send(csv);
  } catch (err) {
    req.log.error({ err }, "Export payroll CSV error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/employees/import", async (req, res) => {
  try {
    const { csv } = req.body;
    if (!csv) {
      res.status(400).json({ error: "Bad Request", message: "CSV data required" });
      return;
    }

    const records = parse(csv, { columns: true, skip_empty_lines: true, trim: true }) as Record<string, string>[];
    const results: any[] = [];

    for (const record of records) {
      try {
        const count = await Employee.countDocuments({ companyId: req.companyId });
        const employeeCode = record.EmployeeCode || `IMP${String(count + 1).padStart(4, "0")}`;

        const dept = record.Department
          ? await Department.findOne({ name: record.Department, companyId: req.companyId })
          : null;

        const employee = await Employee.create({
          employeeCode,
          firstName: record.FirstName,
          lastName: record.LastName,
          email: record.Email,
          phone: record.Phone || null,
          departmentId: dept?._id || null,
          designation: record.Designation || null,
          status: record.Status || "active",
          joinDate: record.JoinDate || null,
          salary: record.Salary ? Number(record.Salary) : null,
          companyId: req.companyId,
        });

        results.push({ success: true, employeeCode: employee.employeeCode });
      } catch (err: any) {
        results.push({ success: false, row: record, error: err.message });
      }
    }

    res.json({ imported: results.filter((r) => r.success).length, failed: results.filter((r) => !r.success).length, details: results });
  } catch (err) {
    req.log.error({ err }, "Import employees error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
