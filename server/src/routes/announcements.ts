import { Router } from "express";
import { db } from "@hrms/db";
import { announcementsTable } from "@hrms/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth.js";

const router = Router();
router.use(requireAuth);
const adminOnly = requireRole("admin", "hr");

router.get("/", async (req, res) => {
  try {
    const announcements = await db
      .select()
      .from(announcementsTable)
      .orderBy(desc(announcementsTable.createdAt));
    res.json(
      announcements.map((a) => ({
        ...a,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
        expiresAt: a.expiresAt?.toISOString() || null,
      })),
    );
  } catch (err) {
    req.log.error({ err }, "List announcements error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/", adminOnly, async (req, res) => {
  try {
    const { title, content, priority, targetRoles, expiresAt } = req.body;
    const userId = (req as any).user?.userId;
    const [ann] = await db
      .insert(announcementsTable)
      .values({
        title,
        content,
        priority: priority || "normal",
        targetRoles: targetRoles || "all",
        publishedBy: userId || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      })
      .returning();
    res
      .status(201)
      .json({
        ...ann,
        createdAt: ann.createdAt.toISOString(),
        updatedAt: ann.updatedAt.toISOString(),
        expiresAt: ann.expiresAt?.toISOString() || null,
      });
  } catch (err) {
    req.log.error({ err }, "Create announcement error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/:id", adminOnly, async (req, res) => {
  try {
    const { title, content, priority, targetRoles, isActive, expiresAt } =
      req.body;
    const [updated] = await db
      .update(announcementsTable)
      .set({
        ...(title && { title }),
        ...(content && { content }),
        ...(priority && { priority }),
        ...(targetRoles && { targetRoles }),
        ...(isActive !== undefined && { isActive }),
        ...(expiresAt !== undefined && {
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        }),
        updatedAt: new Date(),
      })
      .where(eq(announcementsTable.id, Number(req.params.id)))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    res.json({
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      expiresAt: updated.expiresAt?.toISOString() || null,
    });
  } catch (err) {
    req.log.error({ err }, "Update announcement error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/:id", adminOnly, async (req, res) => {
  try {
    await db
      .delete(announcementsTable)
      .where(eq(announcementsTable.id, Number(req.params.id)));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Delete announcement error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
