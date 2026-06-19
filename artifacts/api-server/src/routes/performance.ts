import { Router } from "express";
import { db } from "@workspace/db";
import {
  kpisTable,
  appraisalsTable,
  employeesTable,
} from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/kpis", async (req, res) => {
  try {
    const { employeeId } = req.query;
    const query = db
      .select({
        id: kpisTable.id,
        employeeId: kpisTable.employeeId,
        firstName: employeesTable.firstName,
        lastName: employeesTable.lastName,
        title: kpisTable.title,
        description: kpisTable.description,
        target: kpisTable.target,
        achieved: kpisTable.achieved,
        unit: kpisTable.unit,
        period: kpisTable.period,
        status: kpisTable.status,
        createdAt: kpisTable.createdAt,
      })
      .from(kpisTable)
      .leftJoin(employeesTable, eq(kpisTable.employeeId, employeesTable.id));

    const records = employeeId
      ? await query.where(eq(kpisTable.employeeId, Number(employeeId)))
      : await query;

    res.json(
      records.map((r) => ({
        ...r,
        employeeName: `${r.firstName || ""} ${r.lastName || ""}`.trim(),
        target: Number(r.target),
        achieved: Number(r.achieved),
        createdAt: r.createdAt.toISOString(),
      })),
    );
  } catch (err) {
    req.log.error({ err }, "List KPIs error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/kpis", async (req, res) => {
  try {
    const {
      employeeId,
      title,
      description,
      target,
      achieved,
      unit,
      period,
      status,
    } = req.body;
    const [record] = await db
      .insert(kpisTable)
      .values({
        employeeId,
        title,
        description: description || null,
        target: String(target),
        achieved: String(achieved || 0),
        unit,
        period,
        status: status || "on_track",
      })
      .returning();

    const emp = await db
      .select({
        firstName: employeesTable.firstName,
        lastName: employeesTable.lastName,
      })
      .from(employeesTable)
      .where(eq(employeesTable.id, employeeId))
      .limit(1);

    res.status(201).json({
      ...record,
      employeeName: emp[0] ? `${emp[0].firstName} ${emp[0].lastName}` : "",
      target: Number(record.target),
      achieved: Number(record.achieved),
      createdAt: record.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Create KPI error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/appraisals", async (req, res) => {
  try {
    const { employeeId } = req.query;
    const query = db
      .select({
        id: appraisalsTable.id,
        employeeId: appraisalsTable.employeeId,
        firstName: employeesTable.firstName,
        lastName: employeesTable.lastName,
        reviewerId: appraisalsTable.reviewerId,
        period: appraisalsTable.period,
        overallRating: appraisalsTable.overallRating,
        technicalSkills: appraisalsTable.technicalSkills,
        communication: appraisalsTable.communication,
        teamwork: appraisalsTable.teamwork,
        leadership: appraisalsTable.leadership,
        comments: appraisalsTable.comments,
        status: appraisalsTable.status,
        createdAt: appraisalsTable.createdAt,
      })
      .from(appraisalsTable)
      .leftJoin(
        employeesTable,
        eq(appraisalsTable.employeeId, employeesTable.id),
      );

    const records = employeeId
      ? await query.where(eq(appraisalsTable.employeeId, Number(employeeId)))
      : await query;

    const reviewerIds = [...new Set(records.map((r) => r.reviewerId))];
    const reviewers: Record<number, string> = {};
    if (reviewerIds.length > 0) {
      for (const rid of reviewerIds) {
        const r = await db
          .select({
            firstName: employeesTable.firstName,
            lastName: employeesTable.lastName,
          })
          .from(employeesTable)
          .where(eq(employeesTable.id, rid))
          .limit(1);
        if (r[0]) reviewers[rid] = `${r[0].firstName} ${r[0].lastName}`;
      }
    }

    res.json(
      records.map((r) => ({
        ...r,
        employeeName: `${r.firstName || ""} ${r.lastName || ""}`.trim(),
        reviewerName: reviewers[r.reviewerId] || "",
        overallRating: Number(r.overallRating),
        technicalSkills: Number(r.technicalSkills),
        communication: Number(r.communication),
        teamwork: Number(r.teamwork),
        leadership: Number(r.leadership),
        createdAt: r.createdAt.toISOString(),
      })),
    );
  } catch (err) {
    req.log.error({ err }, "List appraisals error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/appraisals", async (req, res) => {
  try {
    const {
      employeeId,
      reviewerId,
      period,
      overallRating,
      technicalSkills,
      communication,
      teamwork,
      leadership,
      comments,
    } = req.body;
    const [record] = await db
      .insert(appraisalsTable)
      .values({
        employeeId,
        reviewerId,
        period,
        overallRating: String(overallRating),
        technicalSkills: String(technicalSkills),
        communication: String(communication),
        teamwork: String(teamwork),
        leadership: String(leadership),
        comments: comments || null,
        status: "submitted",
      })
      .returning();

    const [emp, rev] = await Promise.all([
      db
        .select({
          firstName: employeesTable.firstName,
          lastName: employeesTable.lastName,
        })
        .from(employeesTable)
        .where(eq(employeesTable.id, employeeId))
        .limit(1),
      db
        .select({
          firstName: employeesTable.firstName,
          lastName: employeesTable.lastName,
        })
        .from(employeesTable)
        .where(eq(employeesTable.id, reviewerId))
        .limit(1),
    ]);

    res.status(201).json({
      ...record,
      employeeName: emp[0] ? `${emp[0].firstName} ${emp[0].lastName}` : "",
      reviewerName: rev[0] ? `${rev[0].firstName} ${rev[0].lastName}` : "",
      overallRating: Number(record.overallRating),
      technicalSkills: Number(record.technicalSkills),
      communication: Number(record.communication),
      teamwork: Number(record.teamwork),
      leadership: Number(record.leadership),
      createdAt: record.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Create appraisal error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
