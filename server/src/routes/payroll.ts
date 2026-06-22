import { Router } from "express";
import { db } from "@hrms/db";
import {
  payrollTable,
  employeesTable,
  brandingTable,
} from "@hrms/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const { month, year, employeeId } = req.query;
    const conditions: any[] = [];
    if (month) conditions.push(eq(payrollTable.month, Number(month)));
    if (year) conditions.push(eq(payrollTable.year, Number(year)));
    if (employeeId)
      conditions.push(eq(payrollTable.employeeId, Number(employeeId)));

    const records = await db
      .select({
        id: payrollTable.id,
        employeeId: payrollTable.employeeId,
        firstName: employeesTable.firstName,
        lastName: employeesTable.lastName,
        month: payrollTable.month,
        year: payrollTable.year,
        basicSalary: payrollTable.basicSalary,
        hra: payrollTable.hra,
        allowances: payrollTable.allowances,
        grossSalary: payrollTable.grossSalary,
        pf: payrollTable.pf,
        esi: payrollTable.esi,
        tds: payrollTable.tds,
        deductions: payrollTable.deductions,
        netSalary: payrollTable.netSalary,
        workingDays: payrollTable.workingDays,
        presentDays: payrollTable.presentDays,
        status: payrollTable.status,
        processedAt: payrollTable.processedAt,
      })
      .from(payrollTable)
      .leftJoin(employeesTable, eq(payrollTable.employeeId, employeesTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(payrollTable.year, payrollTable.month);

    res.json(
      records.map((r) => ({
        ...r,
        employeeName: `${r.firstName || ""} ${r.lastName || ""}`.trim(),
        basicSalary: Number(r.basicSalary),
        hra: Number(r.hra),
        allowances: Number(r.allowances),
        grossSalary: Number(r.grossSalary),
        pf: Number(r.pf),
        esi: Number(r.esi),
        tds: Number(r.tds),
        deductions: Number(r.deductions),
        netSalary: Number(r.netSalary),
        presentDays: Number(r.presentDays),
        processedAt: r.processedAt?.toISOString() || null,
      })),
    );
  } catch (err) {
    req.log.error({ err }, "List payroll error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { month, year } = req.body;

    // Get all active employees
    const employees = await db
      .select()
      .from(employeesTable)
      .where(eq(employeesTable.status, "active"));

    const payrollRecords = [];
    for (const emp of employees) {
      // Check if payroll already exists
      const existing = await db
        .select({ id: payrollTable.id })
        .from(payrollTable)
        .where(
          and(
            eq(payrollTable.employeeId, emp.id),
            eq(payrollTable.month, month),
            eq(payrollTable.year, year),
          ),
        )
        .limit(1);
      if (existing.length > 0) continue;

      const basicSalary = Number(emp.salary || 30000);
      const hra = basicSalary * 0.4;
      const allowances = basicSalary * 0.1;
      const grossSalary = basicSalary + hra + allowances;
      const pf = basicSalary * 0.12;
      const esi = grossSalary <= 21000 ? grossSalary * 0.0075 : 0;
      const tds = grossSalary > 50000 ? grossSalary * 0.1 : 0;
      const deductions = pf + esi + tds;
      const netSalary = grossSalary - deductions;

      const [record] = await db
        .insert(payrollTable)
        .values({
          employeeId: emp.id,
          month,
          year,
          basicSalary: String(basicSalary.toFixed(2)),
          hra: String(hra.toFixed(2)),
          allowances: String(allowances.toFixed(2)),
          grossSalary: String(grossSalary.toFixed(2)),
          pf: String(pf.toFixed(2)),
          esi: String(esi.toFixed(2)),
          tds: String(tds.toFixed(2)),
          deductions: String(deductions.toFixed(2)),
          netSalary: String(netSalary.toFixed(2)),
          workingDays: 26,
          presentDays: "26",
          status: "processed",
          processedAt: new Date(),
        })
        .returning();

      payrollRecords.push({
        ...record,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        basicSalary: Number(record.basicSalary),
        hra: Number(record.hra),
        allowances: Number(record.allowances),
        grossSalary: Number(record.grossSalary),
        pf: Number(record.pf),
        esi: Number(record.esi),
        tds: Number(record.tds),
        deductions: Number(record.deductions),
        netSalary: Number(record.netSalary),
        presentDays: Number(record.presentDays),
        processedAt: record.processedAt?.toISOString() || null,
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
    const id = Number(req.params.id);
    const [record] = await db
      .select()
      .from(payrollTable)
      .where(eq(payrollTable.id, id))
      .limit(1);
    if (!record) {
      res.status(404).json({ error: "Not Found" });
      return;
    }

    const [emp] = await db
      .select()
      .from(employeesTable)
      .where(eq(employeesTable.id, record.employeeId))
      .limit(1);
    const branding = await db.select().from(brandingTable).limit(1);

    res.json({
      payroll: {
        ...record,
        employeeName: emp ? `${emp.firstName} ${emp.lastName}` : "",
        basicSalary: Number(record.basicSalary),
        hra: Number(record.hra),
        allowances: Number(record.allowances),
        grossSalary: Number(record.grossSalary),
        pf: Number(record.pf),
        esi: Number(record.esi),
        tds: Number(record.tds),
        deductions: Number(record.deductions),
        netSalary: Number(record.netSalary),
        presentDays: Number(record.presentDays),
        processedAt: record.processedAt?.toISOString() || null,
      },
      employee: emp
        ? {
            ...emp,
            salary: emp.salary ? Number(emp.salary) : null,
            createdAt: emp.createdAt.toISOString(),
          }
        : null,
      company: {
        name: branding[0]?.companyName || "Toyo Kambocha",
        logo: branding[0]?.logoUrl || null,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Get payslip error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
