import { Router } from "express";
import { Payroll, Employee, Branding } from "@hrms/db";
import { requireAuth } from "../lib/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const { companyId } = (req as any).user;
    const { month, year, employeeId } = req.query;
    const filter: any = { companyId };
    if (month) filter.month = Number(month);
    if (year) filter.year = Number(year);
    if (employeeId) filter.employeeId = employeeId;

    const records = await Payroll.find(filter).populate("employeeId", "firstName lastName").sort({ year: -1, month: -1 });

    res.json(records.map((r) => {
      const emp = r.employeeId as any;
      return {
        id: r._id,
        employeeId: r.employeeId?._id,
        employeeName: emp ? `${emp.firstName} ${emp.lastName}` : "",
        month: r.month,
        year: r.year,
        basicSalary: r.basicSalary,
        hra: r.hra,
        allowances: r.allowances,
        grossSalary: r.grossSalary,
        pf: r.pf,
        esi: r.esi,
        tds: r.tds,
        deductions: r.deductions,
        netSalary: r.netSalary,
        workingDays: r.workingDays,
        presentDays: r.presentDays,
        status: r.status,
        processedAt: r.processedAt?.toISOString() || null,
      };
    }));
  } catch (err) {
    req.log.error({ err }, "List payroll error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { companyId } = (req as any).user;
    const { month, year } = req.body;

    const employees = await Employee.find({ status: "active", companyId });
    const payrollRecords = [];

    for (const emp of employees) {
      const existing = await Payroll.findOne({ employeeId: emp._id, month, year, companyId });
      if (existing) continue;

      const basicSalary = emp.salary || 30000;
      const hra = basicSalary * 0.4;
      const allowances = basicSalary * 0.1;
      const grossSalary = basicSalary + hra + allowances;
      const pf = basicSalary * 0.12;
      const esi = grossSalary <= 21000 ? grossSalary * 0.0075 : 0;
      const tds = grossSalary > 50000 ? grossSalary * 0.1 : 0;
      const deductions = pf + esi + tds;
      const netSalary = grossSalary - deductions;

      const record = await Payroll.create({
        employeeId: emp._id, month, year,
        basicSalary: parseFloat(basicSalary.toFixed(2)),
        hra: parseFloat(hra.toFixed(2)),
        allowances: parseFloat(allowances.toFixed(2)),
        grossSalary: parseFloat(grossSalary.toFixed(2)),
        pf: parseFloat(pf.toFixed(2)),
        esi: parseFloat(esi.toFixed(2)),
        tds: parseFloat(tds.toFixed(2)),
        deductions: parseFloat(deductions.toFixed(2)),
        netSalary: parseFloat(netSalary.toFixed(2)),
        workingDays: 26,
        presentDays: 26,
        status: "processed",
        processedAt: new Date(),
        companyId,
      });

      payrollRecords.push({
        id: record._id, employeeId: record.employeeId,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        month: record.month, year: record.year,
        basicSalary: record.basicSalary, hra: record.hra,
        allowances: record.allowances, grossSalary: record.grossSalary,
        pf: record.pf, esi: record.esi, tds: record.tds,
        deductions: record.deductions, netSalary: record.netSalary,
        workingDays: record.workingDays, presentDays: record.presentDays,
        status: record.status, processedAt: record.processedAt?.toISOString() || null,
      });
    }

    res.status(201).json(payrollRecords);
  } catch (err) {
    req.log.error({ err }, "Run payroll error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/:id/payslip", async (req, res) => {
  try {
    const record = await Payroll.findById(req.params.id);
    if (!record) { res.status(404).json({ error: "Not Found" }); return; }

    const emp = await Employee.findById(record.employeeId);
    const branding = await Branding.findOne({ companyId: record.companyId });

    res.json({
      payroll: {
        ...record.toObject(),
        id: record._id,
        employeeName: emp ? `${emp.firstName} ${emp.lastName}` : "",
        basicSalary: record.basicSalary, hra: record.hra,
        allowances: record.allowances, grossSalary: record.grossSalary,
        pf: record.pf, esi: record.esi, tds: record.tds,
        deductions: record.deductions, netSalary: record.netSalary,
        presentDays: record.presentDays,
        processedAt: record.processedAt?.toISOString() || null,
      },
      employee: emp ? { ...emp.toObject(), id: emp._id, salary: emp.salary, createdAt: emp.createdAt.toISOString() } : null,
      company: { name: branding?.companyName || "Flowmative", logo: branding?.logoUrl || null },
    });
  } catch (err) {
    req.log.error({ err }, "Get payslip error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
