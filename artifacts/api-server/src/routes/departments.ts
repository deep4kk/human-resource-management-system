import { Router } from "express";
import { db } from "@workspace/db";
import { departmentsTable, employeesTable } from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const departments = await db
      .select({
        id: departmentsTable.id,
        name: departmentsTable.name,
        description: departmentsTable.description,
        headId: departmentsTable.headId,
        createdAt: departmentsTable.createdAt,
      })
      .from(departmentsTable)
      .orderBy(departmentsTable.name);

    const deptIds = departments.map(d => d.id);
    const counts: Record<number, number> = {};
    if (deptIds.length > 0) {
      for (const did of deptIds) {
        const c = await db
          .select({ count: sql<number>`count(*)` })
          .from(employeesTable)
          .where(eq(employeesTable.departmentId, did));
        counts[did] = Number(c[0]?.count || 0);
      }
    }

    // Get head names
    const headIds = departments.filter(d => d.headId).map(d => d.headId!);
    const heads: Record<number, string> = {};
    if (headIds.length > 0) {
      for (const hid of headIds) {
        const h = await db
          .select({ id: employeesTable.id, firstName: employeesTable.firstName, lastName: employeesTable.lastName })
          .from(employeesTable)
          .where(eq(employeesTable.id, hid))
          .limit(1);
        if (h[0]) heads[h[0].id] = `${h[0].firstName} ${h[0].lastName}`;
      }
    }

    res.json(departments.map(d => ({
      ...d,
      employeeCount: counts[d.id] || 0,
      headName: d.headId ? heads[d.headId] || null : null,
      createdAt: d.createdAt.toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "List departments error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, description, headId } = req.body;
    const [dept] = await db.insert(departmentsTable).values({
      name,
      description: description || null,
      headId: headId || null,
    }).returning();
    res.status(201).json({ ...dept, employeeCount: 0, headName: null, createdAt: dept.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Create department error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, description, headId } = req.body;
    const [updated] = await db.update(departmentsTable)
      .set({ name, description: description || null, headId: headId || null, updatedAt: new Date() })
      .where(eq(departmentsTable.id, id))
      .returning();
    if (!updated) { res.status(404).json({ error: "Not Found" }); return; }
    res.json({ ...updated, employeeCount: 0, headName: null, createdAt: updated.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Update department error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(departmentsTable).where(eq(departmentsTable.id, id));
    res.json({ success: true, message: "Department deleted" });
  } catch (err) {
    req.log.error({ err }, "Delete department error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
