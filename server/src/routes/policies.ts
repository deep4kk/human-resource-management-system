import { Router } from "express";
import { db } from "@hrms/db";
import { companyPoliciesTable } from "@hrms/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth.js";

const router = Router();
router.use(requireAuth);
const adminOnly = requireRole("admin", "hr");

router.get("/", async (req, res) => {
  try {
    const { category } = req.query;
    const conditions = category
      ? eq(companyPoliciesTable.category, category as string)
      : undefined;
    const policies = await db
      .select()
      .from(companyPoliciesTable)
      .where(conditions)
      .orderBy(desc(companyPoliciesTable.createdAt));
    res.json(
      policies.map((p) => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
    );
  } catch (err) {
    req.log.error({ err }, "List policies error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/", adminOnly, async (req, res) => {
  try {
    const { title, category, content, version } = req.body;
    const userId = (req as any).user?.userId;
    const [policy] = await db
      .insert(companyPoliciesTable)
      .values({
        title,
        category,
        content,
        version: version || "1.0",
        createdBy: userId || null,
      })
      .returning();
    res
      .status(201)
      .json({
        ...policy,
        createdAt: policy.createdAt.toISOString(),
        updatedAt: policy.updatedAt.toISOString(),
      });
  } catch (err) {
    req.log.error({ err }, "Create policy error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/:id", adminOnly, async (req, res) => {
  try {
    const { title, category, content, version, isActive } = req.body;
    const [updated] = await db
      .update(companyPoliciesTable)
      .set({
        ...(title && { title }),
        ...(category && { category }),
        ...(content && { content }),
        ...(version && { version }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date(),
      })
      .where(eq(companyPoliciesTable.id, Number(req.params.id)))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    res.json({
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Update policy error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/:id", adminOnly, async (req, res) => {
  try {
    await db
      .delete(companyPoliciesTable)
      .where(eq(companyPoliciesTable.id, Number(req.params.id)));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Delete policy error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
