# Toyo Kambocha HRMS

## Overview

Full-stack enterprise HRMS (Human Resource Management System) built for Toyo Kambocha with Apple macOS-style glassmorphism design, mobile-first responsive layout, and comprehensive HR modules.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **Build**: esbuild (ESM bundle)
- **Frontend**: React + Vite + TailwindCSS v4 + shadcn/ui
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Auth**: Custom JWT (sha256 HMAC token)
- **Currency**: ₹ INR (en-IN locale)
- **Design**: Glassmorphism (backdrop-blur, glass-card, glass-sidebar, glass-header, glass-input, glass-btn)
- **Fonts**: Outfit (display), Inter (body)

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
│       └── src/schema/
│           ├── users.ts
│           ├── employees.ts
│           ├── departments.ts
│           ├── attendance.ts
│           ├── payroll.ts
│           ├── timesheets.ts
│           ├── performance.ts
│           ├── branding.ts
│           └── settings.ts    # biometric_settings, document_templates, generated_documents, holidays, announcements, company_policies
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## HRMS Modules

1. **Dashboard** — Stats cards + charts (attendance, payroll, department distribution)
2. **Employees** — Full CRUD with search, filter, department assignment
3. **Attendance** — Biometric-imported daily attendance (no manual check-in/out)
4. **Leaves** — Apply/approve/reject leave requests
5. **Payroll** — Monthly payroll with PF/ESI/TDS calculations + payslips (₹ INR)
6. **Timesheets** — Daily time entries with billable/non-billable tracking
7. **Performance** — KPI tracking and employee appraisals
8. **Documents** — HR document templates (offer letters, experience letters, relieving letters) with variable substitution and PDF generation
9. **Holidays** — Company holiday calendar with types (public, national, religious, optional), grouped by month
10. **Announcements** — Company-wide notices with priority levels (urgent, high, normal, low) and target audience
11. **Company Policies** — HR policies organized by category with versioning and expandable content
12. **Biometrics Settings** — Biometric device configuration + CSV attendance import
13. **Branding Settings** — Live branding control (name, logo, colors, theme)

## Auth

- JWT-based (custom sha256 HMAC)
- Roles: admin, hr, manager, employee
- Role-based access control (RBAC) enforced server-side via `requireRole()` middleware
- Demo accounts:
  - Admin: admin@toyo-kambocha.com / admin123
  - HR: hr@toyo-kambocha.com / hr123
  - Employee: employee@toyo-kambocha.com / emp123
  - Manager: manager@toyo-kambocha.com / mgr123

## Database Schema

Tables: `users`, `employees`, `departments`, `attendance`, `leave_requests`, `payroll`, `timesheets`, `kpis`, `appraisals`, `branding`, `biometric_settings`, `document_templates`, `generated_documents`, `holidays`, `announcements`, `company_policies`

## Key API Routes

All routes prefixed with `/api/`. Write endpoints for new modules require admin/hr role.

- `POST /auth/login` — Login (no auth required)
- `GET /auth/me` — Current user
- `GET/POST /employees` — Employee CRUD
- `PUT /employees/:id` — Update employee
- `DELETE /employees/:id` — Delete employee
- `GET/POST /departments` — Department CRUD
- `GET/POST /attendance` — Attendance records
- `PUT /attendance/:id` — Update attendance
- `GET /attendance/today` — Today's summary with per-employee records
- `GET/POST /leaves` — Leave requests
- `PUT /leaves/:id/status` — Approve/reject leave
- `GET/POST /payroll` — Payroll records
- `GET /payroll/:id/payslip` — Payslip detail
- `GET/POST /timesheets` — Timesheets
- `PUT /timesheets/:id/status` — Approve/reject timesheet
- `GET/POST /performance/kpis` — KPI tracking
- `GET/POST /performance/appraisals` — Appraisals
- `GET /dashboard/stats` — Dashboard stats
- `GET /dashboard/charts` — Chart data
- `GET/PUT /branding` — Branding settings
- `GET /biometrics/settings` — Biometric device list
- `POST/PUT/DELETE /biometrics/settings` — Device CRUD (admin/hr only)
- `POST /biometrics/import` — CSV attendance import (admin/hr only)
- `GET /documents/templates` — Document templates
- `POST/PUT/DELETE /documents/templates` — Template CRUD (admin/hr only)
- `POST /documents/generate` — Generate document from template (admin/hr only)
- `GET /documents/generated` — List generated documents
- `GET /holidays` — Holiday list (filterable by year)
- `POST/PUT/DELETE /holidays` — Holiday CRUD (admin/hr only)
- `GET /announcements` — Announcements list
- `POST/PUT/DELETE /announcements` — Announcement CRUD (admin/hr only)
- `GET /policies` — Company policies (filterable by category)
- `POST/PUT/DELETE /policies` — Policy CRUD (admin/hr only)

## Frontend Architecture

- Direct `fetch()` with Bearer token from `localStorage.getItem("hrms_token")`
- Base URL: `import.meta.env.BASE_URL.replace(/\/$/, "")`
- Reusable Modal component (`components/ui/Modal.tsx`)
- Role-based UI: admin/hr users see action buttons; employees see read-only views
- Mobile-first responsive: hamburger menu + overlay sidebar on mobile, glassmorphism throughout
- Glass CSS classes: `.glass`, `.glass-card`, `.glass-sidebar`, `.glass-header`, `.glass-input`, `.glass-btn`
- Dark mode toggle in header
- Currency formatting via `formatCurrency()` in `lib/utils.ts` (₹ INR)
- Document templates use `{{variable_name}}` placeholders; auto-filled: employee_name, designation, department, salary, join_date, email, date, company_name
- Biometric CSV format: `employee_code,date,check_in,check_out,status`
