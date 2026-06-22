import { Router } from "express";
import { db } from "@hrms/db";
import {
  documentTemplatesTable,
  generatedDocumentsTable,
  employeesTable,
  departmentsTable,
} from "@hrms/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth.js";

const router = Router();
router.use(requireAuth);
const adminOnly = requireRole("admin", "hr");

router.get("/templates", async (req, res) => {
  try {
    const templates = await db
      .select()
      .from(documentTemplatesTable)
      .orderBy(desc(documentTemplatesTable.createdAt));
    res.json(
      templates.map((t) => ({
        ...t,
        variables: JSON.parse(t.variables || "[]"),
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      })),
    );
  } catch (err) {
    req.log.error({ err }, "List templates error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/templates", adminOnly, async (req, res) => {
  try {
    const { name, type, content, variables } = req.body;
    const userId = (req as any).user?.userId;
    const [template] = await db
      .insert(documentTemplatesTable)
      .values({
        name,
        type,
        content,
        variables: JSON.stringify(variables || []),
        createdBy: userId || null,
      })
      .returning();
    res
      .status(201)
      .json({
        ...template,
        variables: JSON.parse(template.variables),
        createdAt: template.createdAt.toISOString(),
        updatedAt: template.updatedAt.toISOString(),
      });
  } catch (err) {
    req.log.error({ err }, "Create template error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/templates/:id", adminOnly, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, type, content, variables, isActive } = req.body;
    const [updated] = await db
      .update(documentTemplatesTable)
      .set({
        ...(name && { name }),
        ...(type && { type }),
        ...(content && { content }),
        ...(variables && { variables: JSON.stringify(variables) }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date(),
      })
      .where(eq(documentTemplatesTable.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    res.json({
      ...updated,
      variables: JSON.parse(updated.variables),
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Update template error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/templates/:id", adminOnly, async (req, res) => {
  try {
    await db
      .delete(documentTemplatesTable)
      .where(eq(documentTemplatesTable.id, Number(req.params.id)));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Delete template error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/generate", adminOnly, async (req, res) => {
  try {
    const { templateId, employeeId, variables } = req.body;
    const userId = (req as any).user?.userId;

    const template = await db
      .select()
      .from(documentTemplatesTable)
      .where(eq(documentTemplatesTable.id, templateId))
      .limit(1);
    if (!template[0]) {
      res.status(404).json({ error: "Template not found" });
      return;
    }

    const emp = await db
      .select()
      .from(employeesTable)
      .where(eq(employeesTable.id, employeeId))
      .limit(1);
    if (!emp[0]) {
      res.status(404).json({ error: "Employee not found" });
      return;
    }

    let deptName = "";
    if (emp[0].departmentId) {
      const dept = await db
        .select({ name: departmentsTable.name })
        .from(departmentsTable)
        .where(eq(departmentsTable.id, emp[0].departmentId))
        .limit(1);
      deptName = dept[0]?.name || "";
    }

    const allVars: Record<string, string> = {
      employee_name: `${emp[0].firstName} ${emp[0].lastName}`,
      first_name: emp[0].firstName,
      last_name: emp[0].lastName,
      employee_code: emp[0].employeeCode,
      email: emp[0].email,
      phone: emp[0].phone || "",
      designation: emp[0].designation || "",
      department: deptName,
      join_date: emp[0].joinDate || "",
      salary: emp[0].salary
        ? Number(emp[0].salary).toLocaleString("en-IN")
        : "",
      date: new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      company_name: "Toyo Kambocha",
      ...variables,
    };

    let content = template[0].content;
    for (const [key, value] of Object.entries(allVars)) {
      content = content.replace(new RegExp(`\\{\\{${key}\\}\\}`, "gi"), value);
    }

    const docName = `${template[0].name} - ${emp[0].firstName} ${emp[0].lastName}`;
    const [doc] = await db
      .insert(generatedDocumentsTable)
      .values({
        templateId,
        employeeId,
        name: docName,
        content,
        generatedBy: userId || null,
      })
      .returning();

    res.status(201).json({ ...doc, createdAt: doc.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Generate document error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/generated", async (req, res) => {
  try {
    const { employeeId } = req.query;
    const conditions = employeeId
      ? eq(generatedDocumentsTable.employeeId, Number(employeeId))
      : undefined;

    const docs = await db
      .select({
        id: generatedDocumentsTable.id,
        templateId: generatedDocumentsTable.templateId,
        employeeId: generatedDocumentsTable.employeeId,
        name: generatedDocumentsTable.name,
        content: generatedDocumentsTable.content,
        generatedBy: generatedDocumentsTable.generatedBy,
        createdAt: generatedDocumentsTable.createdAt,
        firstName: employeesTable.firstName,
        lastName: employeesTable.lastName,
      })
      .from(generatedDocumentsTable)
      .leftJoin(
        employeesTable,
        eq(generatedDocumentsTable.employeeId, employeesTable.id),
      )
      .where(conditions)
      .orderBy(desc(generatedDocumentsTable.createdAt));

    res.json(
      docs.map((d) => ({
        ...d,
        employeeName: `${d.firstName || ""} ${d.lastName || ""}`.trim(),
        createdAt: d.createdAt.toISOString(),
      })),
    );
  } catch (err) {
    req.log.error({ err }, "List generated documents error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/generated/:id", async (req, res) => {
  try {
    const doc = await db
      .select()
      .from(generatedDocumentsTable)
      .where(eq(generatedDocumentsTable.id, Number(req.params.id)))
      .limit(1);
    if (!doc[0]) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    res.json({ ...doc[0], createdAt: doc[0].createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Get document error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
