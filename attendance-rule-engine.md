# Attendance Rule Engine — Complete Reference
**Project:** Toyo Kambocha HRMS
**Date:** June 2026
**Status:** Live & migrated

---

## 1. What It Is

The **Attendance Rule Engine** lets admins and HR managers define policies that govern how employee check-in/out data is interpreted. Instead of hard-coding rules, each rule is stored in the database and evaluated at runtime.

A rule answers questions like:
- When does "late" kick in vs. a normal arrival?
- How many hours must someone work to be "present" vs. "half-day" vs. "absent"?
- Is a 1-hour early departure a "short leave" or does it cost a full absence?
- Does overtime tracking apply?
- Which days are weekends?

---

## 2. The Prompt Used to Build This Feature

```
Build an Attendance Rule Engine page for the Toyo Kambocha HRMS app.

The page should be called "Attendance Rules" in the sidebar (visible to admin 
and hr roles only). Route: /leave-rules.

Each rule must configure:
  - Rule name, description, active/inactive status, applies-to scope
  - Shift start time, shift end time, expected daily hours
  - Grace period in minutes (before employee is flagged late)
  - Late threshold in minutes (after which it becomes a half-day)
  - Half-day detection toggle: min hours and max hours
    - Below min = Absent, between min–max = Half Day, above max = Present
  - Short-leave tracking toggle: max hours per instance, max allowed per month
    - Absence ≤ threshold = short leave (not absent)
  - Auto-absent: if no check-in by a cutoff time, auto-mark absent
  - Overtime tracking toggle: threshold hours per day
  - Weekend day picker (Mon–Sun multi-select buttons)
  - Holidays-count-as-present toggle

UI requirements:
  - Summary cards (Total, Active, Half-Day rules, Short-Leave rules)
  - Collapsible list rows with quick-glance badges
  - Expandable detail panel (4 columns)
  - 4-tab form modal: Shift & Timing / Half-Day / Short Leave / Other
  - Toggle active/inactive per rule without opening the form
  - Full CRUD (create, edit, delete)
  - Only admin/hr roles see Add/Edit/Delete/Toggle buttons

Stack: React + TypeScript + Tailwind, Drizzle ORM, PostgreSQL, Express.
Auth: Bearer token from localStorage ("hrms_token").
API base: import.meta.env.BASE_URL.replace(/\/$/, "").
```

---

## 3. File Map — Where Everything Lives

```
lib/db/src/schema/
  leave-rules.ts              ← PostgreSQL table definition (attendanceRulesTable)
  index.ts                    ← re-exports leave-rules (line: export * from "./leave-rules")

artifacts/api-server/src/routes/
  leave-rules.ts              ← Express router (GET / POST / PUT / DELETE / PATCH toggle)
  index.ts                    ← mounts the router at /api/leave-rules

artifacts/hrms/src/
  pages/leave-rules.tsx       ← Full page component (list + modal form)
  App.tsx                     ← Route: /leave-rules → <LeaveRules />
  components/layout/Sidebar.tsx ← Menu item "Attendance Rules", roles: admin/hr
```

---

## 4. Data Flow

```
User (browser)
    │
    │  click "Add Rule" → fill 4-tab form → submit
    ▼
Frontend: artifacts/hrms/src/pages/leave-rules.tsx
    │  POST /api/leave-rules   (with Bearer token)
    ▼
Backend: artifacts/api-server/src/routes/leave-rules.ts
    │  requireAuth middleware validates JWT
    │  Drizzle insert into attendance_rules
    ▼
Database: PostgreSQL — table: attendance_rules
    │
    │  (on GET) rows returned → serialized (numeric fields cast to Number)
    ▼
Frontend re-fetches → list updates → summary cards recalculate
```

---

## 5. Database Schema

**File:** `lib/db/src/schema/leave-rules.ts`

```typescript
import { pgTable, serial, text, integer, boolean, numeric, time, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const attendanceRulesTable = pgTable("attendance_rules", {
  id: serial("id").primaryKey(),

  // Rule identity
  ruleName: text("rule_name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  appliesTo: text("applies_to").notNull().default("all"), // "all" | "permanent" | "contract"
  departmentId: integer("department_id"),

  // Shift / work hours
  shiftStart: time("shift_start").notNull().default("09:00:00"),
  shiftEnd: time("shift_end").notNull().default("18:00:00"),
  expectedHours: numeric("expected_hours", { precision: 4, scale: 1 }).notNull().default("8.0"),

  // Grace & late rules
  gracePeriodMinutes: integer("grace_period_minutes").notNull().default(15),
  lateThresholdMinutes: integer("late_threshold_minutes").notNull().default(30),

  // Half-day rules
  halfDayEnabled: boolean("half_day_enabled").notNull().default(true),
  halfDayMaxHours: numeric("half_day_max_hours", { precision: 4, scale: 1 }).notNull().default("4.5"),
  halfDayMinHours: numeric("half_day_min_hours", { precision: 4, scale: 1 }).notNull().default("3.0"),

  // Short-leave rules
  shortLeaveEnabled: boolean("short_leave_enabled").notNull().default(true),
  shortLeaveMaxHours: numeric("short_leave_max_hours", { precision: 4, scale: 1 }).notNull().default("2.0"),
  shortLeaveMaxPerMonth: integer("short_leave_max_per_month").notNull().default(2),

  // Absent auto-marking
  absentIfNoCheckIn: boolean("absent_if_no_check_in").notNull().default(false),
  absentCheckInCutoff: time("absent_check_in_cutoff"),

  // Overtime
  overtimeEnabled: boolean("overtime_enabled").notNull().default(false),
  overtimeThresholdHours: numeric("overtime_threshold_hours", { precision: 4, scale: 1 }),

  // Weekend / holiday
  weekendDays: text("weekend_days").notNull().default("saturday,sunday"),
  countHolidaysAsPresent: boolean("count_holidays_as_present").notNull().default(true),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertAttendanceRuleSchema = createInsertSchema(attendanceRulesTable)
  .omit({ id: true, createdAt: true, updatedAt: true });

export type InsertAttendanceRule = z.infer<typeof insertAttendanceRuleSchema>;
export type AttendanceRule = typeof attendanceRulesTable.$inferSelect;
```

**Schema index export** (`lib/db/src/schema/index.ts`):
```typescript
export * from "./leave-rules";   // exports attendanceRulesTable
```

**Run migration (one-time per new environment):**
```bash
pnpm --filter @workspace/db run push
```

---

## 6. Backend API

**File:** `artifacts/api-server/src/routes/leave-rules.ts`

### Mounting point

In `artifacts/api-server/src/routes/index.ts`:
```typescript
import leaveRulesRouter from "./leave-rules.js";
// ...
router.use("/leave-rules", leaveRulesRouter);
```

### All endpoints

| Method   | Path                     | Description                        |
|----------|--------------------------|------------------------------------|
| GET      | /api/leave-rules         | List all rules (ordered by name)   |
| POST     | /api/leave-rules         | Create a new rule                  |
| PUT      | /api/leave-rules/:id     | Update an existing rule            |
| DELETE   | /api/leave-rules/:id     | Delete a rule                      |
| PATCH    | /api/leave-rules/:id/toggle | Toggle isActive on/off          |

All endpoints require: `Authorization: Bearer <token>`

### Full route code

```typescript
import { Router } from "express";
import { db } from "@workspace/db";
import { attendanceRulesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";

const router = Router();
router.use(requireAuth);

// Drizzle returns numeric columns as strings — cast them back to numbers
function serialize(r: any) {
  return {
    ...r,
    expectedHours:         r.expectedHours         != null ? Number(r.expectedHours)         : null,
    halfDayMaxHours:       r.halfDayMaxHours       != null ? Number(r.halfDayMaxHours)       : null,
    halfDayMinHours:       r.halfDayMinHours       != null ? Number(r.halfDayMinHours)       : null,
    shortLeaveMaxHours:    r.shortLeaveMaxHours    != null ? Number(r.shortLeaveMaxHours)    : null,
    overtimeThresholdHours:r.overtimeThresholdHours!= null ? Number(r.overtimeThresholdHours): null,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
    updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : r.updatedAt,
  };
}

// GET /api/leave-rules
router.get("/", async (req, res) => {
  const rules = await db.select().from(attendanceRulesTable).orderBy(attendanceRulesTable.ruleName);
  res.json(rules.map(serialize));
});

// POST /api/leave-rules
router.post("/", async (req, res) => {
  const b = req.body;
  const [rule] = await db.insert(attendanceRulesTable).values({
    ruleName: b.ruleName,
    description: b.description || null,
    isActive: b.isActive ?? true,
    appliesTo: b.appliesTo ?? "all",
    departmentId: b.departmentId || null,
    shiftStart: b.shiftStart ?? "09:00:00",
    shiftEnd: b.shiftEnd ?? "18:00:00",
    expectedHours: String(b.expectedHours ?? "8.0"),
    gracePeriodMinutes: b.gracePeriodMinutes ?? 15,
    lateThresholdMinutes: b.lateThresholdMinutes ?? 30,
    halfDayEnabled: b.halfDayEnabled ?? true,
    halfDayMaxHours: String(b.halfDayMaxHours ?? "4.5"),
    halfDayMinHours: String(b.halfDayMinHours ?? "3.0"),
    shortLeaveEnabled: b.shortLeaveEnabled ?? true,
    shortLeaveMaxHours: String(b.shortLeaveMaxHours ?? "2.0"),
    shortLeaveMaxPerMonth: b.shortLeaveMaxPerMonth ?? 2,
    absentIfNoCheckIn: b.absentIfNoCheckIn ?? false,
    absentCheckInCutoff: b.absentCheckInCutoff || null,
    overtimeEnabled: b.overtimeEnabled ?? false,
    overtimeThresholdHours: b.overtimeThresholdHours ? String(b.overtimeThresholdHours) : null,
    weekendDays: b.weekendDays ?? "saturday,sunday",
    countHolidaysAsPresent: b.countHolidaysAsPresent ?? true,
  }).returning();
  res.status(201).json(serialize(rule));
});

// PUT /api/leave-rules/:id
router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const b = req.body;
  const [updated] = await db.update(attendanceRulesTable).set({
    ruleName: b.ruleName,
    description: b.description || null,
    isActive: b.isActive,
    appliesTo: b.appliesTo,
    shiftStart: b.shiftStart,
    shiftEnd: b.shiftEnd,
    expectedHours: String(b.expectedHours),
    gracePeriodMinutes: b.gracePeriodMinutes,
    lateThresholdMinutes: b.lateThresholdMinutes,
    halfDayEnabled: b.halfDayEnabled,
    halfDayMaxHours: String(b.halfDayMaxHours),
    halfDayMinHours: String(b.halfDayMinHours),
    shortLeaveEnabled: b.shortLeaveEnabled,
    shortLeaveMaxHours: String(b.shortLeaveMaxHours),
    shortLeaveMaxPerMonth: b.shortLeaveMaxPerMonth,
    absentIfNoCheckIn: b.absentIfNoCheckIn,
    absentCheckInCutoff: b.absentCheckInCutoff || null,
    overtimeEnabled: b.overtimeEnabled,
    overtimeThresholdHours: b.overtimeThresholdHours ? String(b.overtimeThresholdHours) : null,
    weekendDays: b.weekendDays,
    countHolidaysAsPresent: b.countHolidaysAsPresent,
    updatedAt: new Date(),
  }).where(eq(attendanceRulesTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not Found" }); return; }
  res.json(serialize(updated));
});

// DELETE /api/leave-rules/:id
router.delete("/:id", async (req, res) => {
  await db.delete(attendanceRulesTable).where(eq(attendanceRulesTable.id, id));
  res.json({ success: true });
});

// PATCH /api/leave-rules/:id/toggle
router.patch("/:id/toggle", async (req, res) => {
  const id = Number(req.params.id);
  const [existing] = await db.select().from(attendanceRulesTable)
    .where(eq(attendanceRulesTable.id, id)).limit(1);
  if (!existing) { res.status(404).json({ error: "Not Found" }); return; }
  const [updated] = await db.update(attendanceRulesTable)
    .set({ isActive: !existing.isActive, updatedAt: new Date() })
    .where(eq(attendanceRulesTable.id, id)).returning();
  res.json(serialize(updated));
});

export default router;
```

---

## 7. Frontend Wiring

### App.tsx — Route registration

```typescript
// Import
import LeaveRules from "@/pages/leave-rules";

// Inside <Router>
<Route path="/leave-rules" component={() => <ProtectedRoute component={LeaveRules} />} />
```

### Sidebar.tsx — Navigation item

```typescript
import { Settings2 } from "lucide-react";

const menuItems = [
  // ... other items ...
  { path: "/leave-rules", label: "Attendance Rules", icon: Settings2, roles: ["admin", "hr"] },
  // ... other items ...
];
```

The sidebar uses the `roles` array to filter menu items — employees and managers do **not** see this item.

---

## 8. Frontend Page Structure

**File:** `artifacts/hrms/src/pages/leave-rules.tsx`

### Key pieces

| Piece | What it does |
|-------|-------------|
| `useAttendanceRules()` | Custom hook — fetches rules from API, exposes `rules`, `loading`, `error`, `refetch` |
| `EMPTY_FORM` | Default values for all form fields when creating a new rule |
| `WEEKDAYS` | Array of `{ val, label }` for the Mon–Sun weekend picker buttons |
| `AttendanceRules` (default export) | Main page: header, 4 summary cards, rules list with expand/collapse |
| `Chip` | Small badge pill for quick-glance info on each row |
| `DetailSection` / `DRow` | Helpers for the expanded detail panel (4-column grid) |
| `Toggle` | Reusable animated toggle switch component |
| `RuleFormModal` | 4-tab modal form — used for both create and edit |

### Summary cards

```
[ Total Rules ]  [ Active ]  [ Half-Day Rules ]  [ Short-Leave Rules ]
```
All computed live from the `rules` array — no extra API call needed.

### Rule row badges (quick-glance)

Each row shows inline badges computed from the rule's fields:
- Shift time range (e.g. "9:00 AM – 6:00 PM")
- Grace period (e.g. "15m grace")
- Half-day range if enabled (e.g. "Half-day: 3–4.5h") — amber
- Short leave limit if enabled (e.g. "Short ≤2h, max 2/mo") — purple
- Overtime threshold if enabled (e.g. "OT after 9h") — blue

### 4-tab modal form

| Tab | Fields |
|-----|--------|
| **Shift & Timing** | Rule Name, Description, Shift Start, Shift End, Expected Hours/Day, Grace Period, Late Threshold, Applies To, Active toggle |
| **Half-Day** | Enable toggle, Min hours (below = Absent), Max hours (above = Present); logic preview panel |
| **Short Leave** | Enable toggle, Max hours per instance, Max allowed per month; logic explanation panel |
| **Other** | Weekend day picker (Mon–Sun), Auto-absent toggle + cutoff time, Overtime toggle + threshold, Holidays = Present toggle |

### How numeric fields are handled

Postgres `numeric` columns come back as **strings** from Drizzle. The backend `serialize()` function converts them to `Number` before sending JSON. The frontend form stores everything as strings in state, and converts back to numbers in `handleSubmit()` before posting.

### Time field handling

Postgres `time` columns return `"HH:MM:SS"`. The form strips to `"HH:MM"` for `<input type="time">` and re-appends `":00"` on submit.

---

## 9. Half-Day Logic Explained

```
Worked hours = checkOut time − checkIn time

if workedHours < halfDayMinHours    → status: "Absent"
if workedHours <= halfDayMaxHours   → status: "Half Day"
if workedHours > halfDayMaxHours    → status: "Present"
```

Default thresholds (configurable per rule):
- `halfDayMinHours` = 3.0h → below this = Absent
- `halfDayMaxHours` = 4.5h → above this = Present
- Between 3.0 and 4.5h → Half Day

---

## 10. Short-Leave Logic Explained

```
Absence hours = expected shift hours − worked hours

if absenceHours <= shortLeaveMaxHours
  AND employee's short-leave count this month < shortLeaveMaxPerMonth
    → record as "Short Leave" (not Absent)
else
    → record as "Absent"
```

Default thresholds:
- `shortLeaveMaxHours` = 2.0h (absence of up to 2h counts as short leave)
- `shortLeaveMaxPerMonth` = 2 (only 2 short leaves allowed per month)

---

## 11. What This Feature Affects

| Area | Impact |
|------|--------|
| **Database** | New table `attendance_rules` added via Drizzle migration |
| **API Server** | New route group `/api/leave-rules` mounted in routes/index.ts |
| **Sidebar** | New "Attendance Rules" menu item (admin/hr only) |
| **Router** | New `/leave-rules` route in App.tsx |
| **Attendance module** | Rules are stored and managed here — future: attendance POST/PUT can query active rules and apply them when computing status |
| **Payroll module** | Future: payroll calculations can query active rules to determine half-day deductions and short-leave deductions |
| **Reports** | Future: attendance reports can pull the active rule for each employee's department to classify worked hours correctly |

---

## 12. Access Control

| Role | Can view page | Can add/edit/delete rules | Can toggle active |
|------|:---:|:---:|:---:|
| admin | ✅ | ✅ | ✅ |
| hr | ✅ | ✅ | ✅ |
| manager | ❌ | ❌ | ❌ |
| employee | ❌ | ❌ | ❌ |

The sidebar hides the link for non-admin/hr roles. The page itself also checks `user.role` before rendering action buttons.

---

## 13. How to Extend

### Add a new field to a rule

1. **Schema** (`lib/db/src/schema/leave-rules.ts`) — add the column definition
2. **Migration** — run `pnpm --filter @workspace/db run push`
3. **Backend** (`artifacts/api-server/src/routes/leave-rules.ts`) — add to `serialize()`, POST values, and PUT set
4. **Frontend** (`artifacts/hrms/src/pages/leave-rules.tsx`):
   - Add to `EMPTY_FORM`
   - Add the form input in the appropriate tab
   - Add to the `handleSubmit` body
   - Add to the expanded detail panel (`DetailSection`)
   - Optionally add a quick-glance `Chip` on the row

### Apply rules to attendance records

In `artifacts/api-server/src/routes/attendance.ts`, after computing worked hours from checkIn/checkOut:

```typescript
// Fetch the active rule for this employee
const [rule] = await db.select().from(attendanceRulesTable)
  .where(eq(attendanceRulesTable.isActive, true))
  .limit(1);

if (rule && workedHours < Number(rule.halfDayMinHours)) {
  status = "absent";
} else if (rule && workedHours <= Number(rule.halfDayMaxHours)) {
  status = "half_day";
} else {
  status = "present";
}
```

---

## 14. Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@toyokambocha.com | admin123 |
| HR Mgr | hr@toyokambocha.com | hr123 |
| Employee | emp@toyokambocha.com | emp123 |

Navigate to `/leave-rules` after logging in as Admin or HR Mgr.
