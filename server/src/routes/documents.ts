import { Router } from "express";
import { DocumentTemplate, GeneratedDocument, Employee, Department } from "@hrms/db";
import { requireAuth, requireRole } from "../lib/auth.js";

const router = Router();
router.use(requireAuth);
const adminOnly = requireRole("admin", "hr");

router.get("/templates", async (req, res) => {
  try {
    const { companyId } = (req as any).user;
    const templates = await DocumentTemplate.find({ companyId }).sort({ createdAt: -1 });
    res.json(templates.map((t) => ({ ...t.toObject(), id: t._id, variables: t.variables || [], createdAt: t.createdAt!.toISOString(), updatedAt: t.updatedAt!.toISOString() })));
  } catch (err) {
    req.log.error({ err }, "List templates error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/templates", adminOnly, async (req, res) => {
  try {
    const { companyId } = (req as any).user;
    const userId = (req as any).user?.userId;
    const { name, type, content, variables } = req.body;
    const template = await DocumentTemplate.create({ name, type, content, variables: variables || [], createdBy: userId || null, companyId });
    res.status(201).json({ ...template.toObject(), id: template._id, variables: template.variables, createdAt: template.createdAt!.toISOString(), updatedAt: template.updatedAt!.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Create template error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/templates/:id", adminOnly, async (req, res) => {
  try {
    const { name, type, content, variables, isActive } = req.body;
    const update: any = {};
    if (name) update.name = name;
    if (type) update.type = type;
    if (content) update.content = content;
    if (variables) update.variables = variables;
    if (isActive !== undefined) update.isActive = isActive;

    const updated = await DocumentTemplate.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });
    if (!updated) { res.status(404).json({ error: "Not Found" }); return; }
    res.json({ ...updated.toObject(), id: updated._id, variables: updated.variables, createdAt: updated.createdAt!.toISOString(), updatedAt: updated.updatedAt!.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Update template error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/templates/:id", adminOnly, async (req, res) => {
  try {
    await DocumentTemplate.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Delete template error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/generate", adminOnly, async (req, res) => {
  try {
    const { companyId } = (req as any).user;
    const userId = (req as any).user?.userId;
    const { templateId, employeeId, variables } = req.body;

    const template = await DocumentTemplate.findOne({ _id: templateId, companyId });
    if (!template) { res.status(404).json({ error: "Template not found" }); return; }

    const emp = await Employee.findById(employeeId);
    if (!emp) { res.status(404).json({ error: "Employee not found" }); return; }

    let deptName = "";
    if (emp.departmentId) {
      const dept = await Department.findById(emp.departmentId);
      deptName = dept?.name || "";
    }

    const allVars: Record<string, string> = {
      employee_name: `${emp.firstName} ${emp.lastName}`,
      first_name: emp.firstName, last_name: emp.lastName,
      employee_code: emp.employeeCode, email: emp.email,
      phone: emp.phone || "", designation: emp.designation || "",
      department: deptName, join_date: emp.joinDate || "",
      salary: emp.salary ? emp.salary.toLocaleString("en-IN") : "",
      date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
      company_name: "HRMS", ...variables,
    };

    let content = template.content;
    for (const [key, value] of Object.entries(allVars)) {
      content = content.replace(new RegExp(`\\{\\{${key}\\}\\}`, "gi"), value);
    }

    const docName = `${template.name} - ${emp.firstName} ${emp.lastName}`;
    const doc = await GeneratedDocument.create({ templateId: template._id, employeeId: emp._id, name: docName, content, generatedBy: userId || null, companyId });

    res.status(201).json({ ...doc.toObject(), id: doc._id, createdAt: doc.createdAt!.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Generate document error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/generated", async (req, res) => {
  try {
    const { companyId } = (req as any).user;
    const { employeeId } = req.query;
    const filter: any = { companyId };
    if (employeeId) filter.employeeId = employeeId;

    const docs = await GeneratedDocument.find(filter).populate("employeeId", "firstName lastName").sort({ createdAt: -1 });

    res.json(docs.map((d) => ({ ...d.toObject(), id: d._id, employeeName: (d.employeeId as any) ? `${(d.employeeId as any).firstName} ${(d.employeeId as any).lastName}` : "", createdAt: d.createdAt!.toISOString() })));
  } catch (err) {
    req.log.error({ err }, "List generated documents error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/generated/:id", async (req, res) => {
  try {
    const doc = await GeneratedDocument.findById(req.params.id);
    if (!doc) { res.status(404).json({ error: "Not Found" }); return; }
    res.json({ ...doc.toObject(), id: doc._id, createdAt: doc.createdAt!.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Get document error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
