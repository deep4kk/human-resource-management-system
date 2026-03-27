# Toyo Kambocha HRMS

## Overview

Full-stack enterprise HRMS (Human Resource Management System) built for Toyo Kambocha.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (ESM bundle)
- **Frontend**: React + Vite + TailwindCSS v4 + shadcn/ui
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod
- **Auth**: Custom JWT (sha256 token)

## Structure

```text
workspace/
├── artifacts/
│   ├── api-server/         # Express 5 backend API
│   └── hrms/               # React + Vite frontend
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## HRMS Modules

1. **Dashboard** — Stats cards + charts (attendance, payroll, department distribution)
2. **Employees** — Full CRUD with search, filter, department assignment
3. **Attendance** — Daily attendance tracking with check-in/out, status
4. **Leaves** — Apply/approve/reject leave requests
5. **Payroll** — Monthly payroll run with PF/ESI/TDS calculations + payslips
6. **Timesheets** — Daily time entries with billable/non-billable tracking
7. **Performance** — KPI tracking and employee appraisals
8. **Branding Settings** — Live branding control (name, logo, colors, theme)

## Auth

- JWT-based (custom sha256 HMAC)
- Roles: admin, hr, manager, employee
- Demo accounts:
  - Admin: admin@toyokambocha.com / admin123
  - HR: hr@toyokambocha.com / hr123
  - Employee: emp@toyokambocha.com / emp123
  - Manager: sneha@toyokambocha.com / manager123

## Database Schema

Tables: `users`, `employees`, `departments`, `attendance`, `leave_requests`, `payroll`, `timesheets`, `kpis`, `appraisals`, `branding`

## Key API Routes

All routes prefixed with `/api/`

- `POST /auth/login` — Login (no auth required)
- `GET /auth/me` — Current user
- `GET/POST /employees` — Employee CRUD
- `PUT /employees/:id` — Update employee
- `DELETE /employees/:id` — Delete employee
- `GET/POST /departments` — Department CRUD
- `GET/POST /attendance` — Attendance records (POST creates check-in, checkIn/checkOut are HH:MM:SS time format)
- `PUT /attendance/:id` — Update attendance (check-out, auto-calculates work hours)
- `GET /attendance/today` — Today's summary with per-employee records
- `GET/POST /leaves` — Leave requests
- `PUT /leaves/:id/status` — Approve/reject leave
- `GET/POST /payroll` — Payroll records (POST runs payroll for month/year)
- `GET /payroll/:id/payslip` — Payslip detail with earnings/deductions breakdown
- `GET/POST /timesheets` — Timesheets
- `PUT /timesheets/:id/status` — Approve/reject timesheet
- `GET/POST /performance/kpis` — KPI tracking with target/achieved/progress
- `GET/POST /performance/appraisals` — Appraisals with multi-dimension ratings
- `GET /dashboard/stats` — Stats (uses getLastDayOfMonth for correct date ranges)
- `GET /dashboard/charts` — Chart data (attendance trend, dept distribution, payroll trend, leave types)
- `GET/PUT /branding` — Branding settings

## Frontend Architecture

- Direct `fetch()` with Bearer token from `localStorage.getItem("hrms_token")` for API calls
- Base URL: `import.meta.env.BASE_URL.replace(/\/$/, "")`
- Reusable Modal component (`components/ui/Modal.tsx`) with animation, keyboard close, overlay dismiss
- Role-based UI: admin/hr users see action buttons (Add, Edit, Delete, Approve/Reject)
- `user.employeeId` links auth user to employee record for attendance check-in/out
- Attendance uses PostgreSQL `time` type — always send HH:MM:SS format, never ISO datetime
