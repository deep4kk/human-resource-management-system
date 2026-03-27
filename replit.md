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
- `GET/POST /departments` — Department CRUD
- `GET/POST /attendance` — Attendance records
- `GET /attendance/today` — Today's summary
- `GET/POST /leaves` — Leave requests
- `PUT /leaves/:id/status` — Approve/reject leave
- `GET/POST /payroll` — Payroll records
- `GET /payroll/:id/payslip` — Payslip detail
- `GET/POST /timesheets` — Timesheets
- `PUT /timesheets/:id/status` — Approve timesheet
- `GET/POST /performance/kpis` — KPI tracking
- `GET/POST /performance/appraisals` — Appraisals
- `GET /dashboard/stats` — Stats
- `GET /dashboard/charts` — Chart data
- `GET/PUT /branding` — Branding settings
