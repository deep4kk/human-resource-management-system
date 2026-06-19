import { Router } from "express";
import { db } from "@workspace/db";
import { holidaysTable } from "@workspace/db/schema";
import { eq, gte, lte, and, asc } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth.js";

const router = Router();
router.use(requireAuth);
const adminOnly = requireRole("admin", "hr");

router.get("/", async (req, res) => {
  try {
    const { year } = req.query;
    const y = year ? Number(year) : new Date().getFullYear();
    const holidays = await db
      .select()
      .from(holidaysTable)
      .where(
        and(
          gte(holidaysTable.date, `${y}-01-01`),
          lte(holidaysTable.date, `${y}-12-31`),
        ),
      )
      .orderBy(asc(holidaysTable.date));
    res.json(
      holidays.map((h) => ({ ...h, createdAt: h.createdAt.toISOString() })),
    );
  } catch (err) {
    req.log.error({ err }, "List holidays error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/", adminOnly, async (req, res) => {
  try {
    const { name, date, type, isOptional } = req.body;
    const [holiday] = await db
      .insert(holidaysTable)
      .values({
        name,
        date,
        type: type || "public",
        isOptional: isOptional || false,
      })
      .returning();
    res
      .status(201)
      .json({ ...holiday, createdAt: holiday.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Create holiday error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/:id", adminOnly, async (req, res) => {
  try {
    const { name, date, type, isOptional } = req.body;
    const [updated] = await db
      .update(holidaysTable)
      .set({
        ...(name && { name }),
        ...(date && { date }),
        ...(type && { type }),
        ...(isOptional !== undefined && { isOptional }),
      })
      .where(eq(holidaysTable.id, Number(req.params.id)))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    res.json({ ...updated, createdAt: updated.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Update holiday error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/:id", adminOnly, async (req, res) => {
  try {
    await db
      .delete(holidaysTable)
      .where(eq(holidaysTable.id, Number(req.params.id)));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Delete holiday error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
