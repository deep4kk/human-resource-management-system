import { Router } from "express";
import { db } from "@hrms/db";
import {
  employeesTable,
  departmentsTable,
  usersTable,
} from "@hrms/db/schema";
import { eq, ilike, and, sql, or } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import { hashPassword } from "../lib/auth.js";

const router = Router();

router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const { department, search, status, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const conditions: any[] = [];
    if (status) conditions.push(eq(employeesTable.status, status as string));
    if (department)
      conditions.push(eq(employeesTable.departmentId, Number(department)));
    if (search) {
      conditions.push(
        or(
          ilike(employeesTable.firstName, `%${search}%`),
          ilike(employeesTable.lastName, `%${search}%`),
          ilike(employeesTable.email, `%${search}%`),
          ilike(employeesTable.employeeCode, `%${search}%`),
        ),
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [employees, countResult] = await Promise.all([
      db
        .select({
          id: employeesTable.id,
          employeeCode: employeesTable.employeeCode,
          firstName: employeesTable.firstName,
          lastName: employeesTable.lastName,
          email: employeesTable.email,
          phone: employeesTable.phone,
          avatar: employeesTable.avatar,
          departmentId: employeesTable.departmentId,
          departmentName: departmentsTable.name,
          designation: employeesTable.designation,
          role: employeesTable.role,
          status: employeesTable.status,
          joinDate: employeesTable.joinDate,
          salary: employeesTable.salary,
          managerId: employeesTable.managerId,
          address: employeesTable.address,
          dateOfBirth: employeesTable.dateOfBirth,
          gender: employeesTable.gender,
          createdAt: employeesTable.createdAt,
        })
        .from(employeesTable)
        .leftJoin(
          departmentsTable,
          eq(employeesTable.departmentId, departmentsTable.id),
        )
        .where(whereClause)
        .limit(Number(limit))
        .offset(offset)
        .orderBy(employeesTable.createdAt),
      db
        .select({ count: sql<number>`count(*)` })
        .from(employeesTable)
        .where(whereClause),
    ]);

    // Attach manager names
    const managerIds = [
      ...new Set(employees.filter((e) => e.managerId).map((e) => e.managerId!)),
    ];
    const managers: Record<number, string> = {};
    if (managerIds.length > 0) {
      for (const mid of managerIds) {
        const m = await db
          .select({
            id: employeesTable.id,
            firstName: employeesTable.firstName,
            lastName: employeesTable.lastName,
          })
          .from(employeesTable)
          .where(eq(employeesTable.id, mid))
          .limit(1);
        if (m[0]) managers[m[0].id] = `${m[0].firstName} ${m[0].lastName}`;
      }
    }

    const result = employees.map((e) => ({
      ...e,
      managerName: e.managerId ? managers[e.managerId] || null : null,
      salary: e.salary ? Number(e.salary) : null,
      createdAt: e.createdAt.toISOString(),
      joinDate: e.joinDate || null,
    }));

    res.json({
      employees: result,
      total: Number(countResult[0]?.count || 0),
      page: Number(page),
      limit: Number(limit),
    });
  } catch (err) {
    req.log.error({ err }, "List employees error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      departmentId,
      designation,
      role,
      joinDate,
      salary,
      managerId,
      address,
      dateOfBirth,
      gender,
      password,
    } = req.body;

    // Generate employee code
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(employeesTable);
    const count = Number(countResult[0]?.count || 0) + 1;
    const employeeCode = `TK${String(count).padStart(4, "0")}`;

    const [employee] = await db
      .insert(employeesTable)
      .values({
        employeeCode,
        firstName,
        lastName,
        email,
        phone: phone || null,
        departmentId: departmentId || null,
        designation: designation || null,
        role: role || "employee",
        joinDate: joinDate || null,
        salary: salary ? String(salary) : null,
        managerId: managerId || null,
        address: address || null,
        dateOfBirth: dateOfBirth || null,
        gender: gender || null,
      })
      .returning();

    // Create user account
    if (password) {
      await db
        .insert(usersTable)
        .values({
          email,
          passwordHash: hashPassword(password),
          name: `${firstName} ${lastName}`,
          role: role || "employee",
          employeeId: employee.id,
        })
        .onConflictDoNothing();
    }

    const dept = departmentId
      ? await db
          .select({ name: departmentsTable.name })
          .from(departmentsTable)
          .where(eq(departmentsTable.id, departmentId))
          .limit(1)
      : [];

    res.status(201).json({
      ...employee,
      departmentName: dept[0]?.name || null,
      managerName: null,
      salary: employee.salary ? Number(employee.salary) : null,
      createdAt: employee.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Create employee error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const employees = await db
      .select({
        id: employeesTable.id,
        employeeCode: employeesTable.employeeCode,
        firstName: employeesTable.firstName,
        lastName: employeesTable.lastName,
        email: employeesTable.email,
        phone: employeesTable.phone,
        avatar: employeesTable.avatar,
        departmentId: employeesTable.departmentId,
        departmentName: departmentsTable.name,
        designation: employeesTable.designation,
        role: employeesTable.role,
        status: employeesTable.status,
        joinDate: employeesTable.joinDate,
        salary: employeesTable.salary,
        managerId: employeesTable.managerId,
        address: employeesTable.address,
        dateOfBirth: employeesTable.dateOfBirth,
        gender: employeesTable.gender,
        createdAt: employeesTable.createdAt,
      })
      .from(employeesTable)
      .leftJoin(
        departmentsTable,
        eq(employeesTable.departmentId, departmentsTable.id),
      )
      .where(eq(employeesTable.id, id))
      .limit(1);

    if (!employees[0]) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    const e = employees[0];
    let managerName = null;
    if (e.managerId) {
      const mgr = await db
        .select({
          firstName: employeesTable.firstName,
          lastName: employeesTable.lastName,
        })
        .from(employeesTable)
        .where(eq(employeesTable.id, e.managerId))
        .limit(1);
      if (mgr[0]) managerName = `${mgr[0].firstName} ${mgr[0].lastName}`;
    }
    res.json({
      ...e,
      managerName,
      salary: e.salary ? Number(e.salary) : null,
      createdAt: e.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Get employee error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const {
      firstName,
      lastName,
      email,
      phone,
      departmentId,
      designation,
      role,
      status,
      joinDate,
      salary,
      managerId,
      address,
      dateOfBirth,
      gender,
    } = req.body;

    const [updated] = await db
      .update(employeesTable)
      .set({
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(departmentId !== undefined && {
          departmentId: departmentId || null,
        }),
        ...(designation !== undefined && { designation: designation || null }),
        ...(role !== undefined && { role }),
        ...(status !== undefined && { status }),
        ...(joinDate !== undefined && { joinDate: joinDate || null }),
        ...(salary !== undefined && { salary: salary ? String(salary) : null }),
        ...(managerId !== undefined && { managerId: managerId || null }),
        ...(address !== undefined && { address: address || null }),
        ...(dateOfBirth !== undefined && { dateOfBirth: dateOfBirth || null }),
        ...(gender !== undefined && { gender: gender || null }),
        updatedAt: new Date(),
      })
      .where(eq(employeesTable.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Not Found" });
      return;
    }

    res.json({
      ...updated,
      salary: updated.salary ? Number(updated.salary) : null,
      createdAt: updated.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Update employee error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(employeesTable).where(eq(employeesTable.id, id));
    res.json({ success: true, message: "Employee deleted" });
  } catch (err) {
    req.log.error({ err }, "Delete employee error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
