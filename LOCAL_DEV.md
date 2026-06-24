# Local Development Guide

This guide helps you set up and run the Flowmative HRMS application on your local machine.

## Prerequisites

- **Node.js** 22+ (uses `--env-file` flag; requires `node --version` ≥ 22)
- **pnpm** package manager (install: `npm install -g pnpm`)
- **PostgreSQL** 14+ (local installation OR cloud provider)
- **Platform:** Windows (PowerShell), macOS, or Linux

> **Windows users:** Use **PowerShell** (not Command Prompt).  
> The preinstall script is cross-platform (Node.js inline, no `sh` dependency).

---

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/deep4kk/human-resource-management-system.git
cd human-resource-management-system
pnpm install
```

> If `pnpm install` fails with a shell-related error on Windows, run  
> `git checkout -- package.json` to restore the preinstall script, then  
> `pnpm install` again — the script is now cross-platform.

### 2. Set Up Database

#### Local PostgreSQL

1. Install PostgreSQL and ensure the service is running:
   - **Windows:** `net start postgresql-x64-18` (or your version)
   - **macOS:** `brew services start postgresql`
   - **Linux:** `sudo systemctl start postgresql`

2. Create the database:

```bash
psql -U postgres
CREATE DATABASE hrms;
\q
```

> **Windows:** Add `C:\Program Files\PostgreSQL\18\bin` to your `PATH` or use the full path to `psql`.

#### Cloud PostgreSQL

1. Create a free account at [Supabase](https://supabase.com), [Neon](https://neon.tech), or [Aiven](https://aiven.io)
2. Create a new project and copy the connection string

### 3. Configure Environment

**Backend `.env`:**

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:
```env
DATABASE_URL=postgresql://postgres:your-password@localhost:5432/hrms
JWT_SECRET=change-this-to-a-secure-random-string-at-least-32-chars
PORT=5001
NODE_ENV=development
CORS_ORIGINS=http://localhost:5173,http://localhost:3001
```

**Frontend `.env`:**

```bash
cp frontend/.env.example frontend/.env
```

Edit `frontend/.env`:
```env
VITE_API_URL=http://localhost:5001
PORT=3001
BASE_PATH=/
```

> The frontend dev server proxies all `/api` requests to `http://localhost:5001`  
> via Vite's built-in proxy (`frontend/vite.config.ts`). This avoids CORS issues in  
> development. The `VITE_API_URL` is used as a fallback for production builds.

### 4. Initialize Database Schema

```bash
cd server
pnpm run db:push
```

> ⚠️ Always run `db:*` commands from the `server/` directory, not the root.  
> The scripts delegate to `@hrms/db` via `pnpm --filter @hrms/db`.

### 5. Seed Demo Data

```bash
cd server
pnpm run db:seed
```

> The seed creates 4 demo users, 5 employees, 5 departments, and 1 branding  
> record. The password hashes use `SHA256(password + "hrms_salt_flowmative")`  
> which must match the same salt in `server/src/lib/auth.ts` — both use it.

### 6. Start Development Servers

Open **two separate terminal windows** and keep them running:

**Terminal 1 — Backend (API server on port 5001):**
```bash
cd server
pnpm run dev
```
This builds the TypeScript code with esbuild, then starts the Node.js server.  
It reads settings from `server/.env` via the `--env-file` flag (Node 22+).

**Terminal 2 — Frontend (Vite dev server on port 3001):**
```bash
cd frontend
pnpm run dev
```
Vite starts with hot-reload and proxies `/api/*` requests to the backend.

> Both terminals must stay open. Press **Ctrl+C** to stop either one.

### 7. Access the Application

- **Frontend:** http://localhost:3001
- **Backend API:** http://localhost:5001
- **Health Check:** http://localhost:5001/health

---

## Demo Accounts

After seeding, you can log in with these accounts:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@flowmative.com | admin123 |
| HR Manager | hr@flowmative.com | hr123 |
| Employee | employee@flowmative.com | emp123 |
| Manager | manager@flowmative.com | mgr123 |

---

## Project Structure

```
human-resource-management-system/
├── server/                # Express.js API server
│   ├── src/
│   │   ├── index.ts       # Entry point
│   │   ├── app.ts         # Express app setup
│   │   ├── routes/        # API routes
│   │   └── lib/           # Auth, utils
│   ├── .env.example       # Environment template
│   └── package.json
├── frontend/              # React frontend (Vite)
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # UI components
│   │   └── hooks/         # Custom hooks
│   ├── .env.example       # Environment template
│   └── package.json
├── packages/              # Shared packages
│   ├── db/                # Database schema (Drizzle ORM)
│   ├── api-zod/           # Zod validation schemas
│   └── api-client/        # React Query hooks
└── deploy/                # Deployment scripts
    ├── nginx/             # Nginx configuration
    ├── services/          # Systemd service files
    ├── setup-server.sh    # Initial server setup
    └── deploy.sh          # Deployment automation
```

---

## Common Commands

### Build for Production

```bash
# Build all packages
pnpm run build

# Build only backend
cd server && pnpm run build

# Build only frontend
cd frontend && pnpm run build
```

### Type Checking

```bash
pnpm run typecheck
```

### Database Operations

```bash
cd server

# Push schema to database (creates/updates tables)
pnpm run db:push

# Generate migration files
pnpm run db:generate

# Run migrations
pnpm run db:migrate

# Seed demo data
pnpm run db:seed

# Open Drizzle Studio (visual DB editor)
pnpm run db:studio

# Check migration status
pnpm run db:check
```

---

## Troubleshooting

### Server starts but returns 401 on login

This usually means the password hashes in the database don't match what the server expects.

```bash
# 1. Clear old data
psql -U postgres -d hrms -c "TRUNCATE TABLE users, employees, departments, branding RESTART IDENTITY CASCADE;"

# 2. Re-seed (from server directory)
cd server
pnpm run db:seed

# 3. Restart the server (Ctrl+C then pnpm run dev again)
```

Both seed and server auth must use the same salt: `"hrms_salt_flowmative"`.  
If you changed the salt in `server/src/lib/auth.ts`, update the seed at `packages/db/src/seed.ts` too.

### "DATABASE_URL must be set"

Make sure you created the `.env` file in `server/`:

```bash
cp server/.env.example server/.env
# Then edit it with your database URL
```

### Server exits immediately after "Server listening"

On Windows this can happen if the Node.js process encounters an unhandled error.  
Start the server manually to see the full error:

```bash
cd server
node --env-file=.env --enable-source-maps ./dist/index.mjs
```

If the issue repeats, rebuild first:

```bash
cd server
pnpm run build
pnpm run start
```

### "Port already in use"

Another process is using port 3001 or 5001. Find and kill it:

```powershell
# PowerShell
netstat -ano | Select-String ":3001 "
Stop-Process -Id <PID> -Force
```

Or change the ports in `.env`:

```env
PORT=5001        # server port
```

And `frontend/.env`:

```env
PORT=3001        # frontend port
```

### Database connection refused

1. Make sure PostgreSQL is running:
   - macOS: `brew services start postgresql`
   - Linux: `sudo systemctl start postgresql`
   - Windows: `net start postgresql-x64-18` (adjust version)

2. Check your connection string in `server/.env`:
   ```
   DATABASE_URL=postgresql://postgres:your-password@localhost:5432/hrms
   ```

### "Cannot find module"

Run `pnpm install` from the project root. If native binaries fail on Windows,  
the `pnpm-workspace.yaml` `overrides` section was updated to allow `win32-x64`  
builds — ensure you have the latest version of that file.

### Node version too old

Requires Node.js 22+ (uses `--env-file` flag). Check your version:

```bash
node --version  # Must be 22.x or higher
```

### pnpm preinstall script fails

The root `package.json` has a cross-platform preinstall script that checks  
for `pnpm` and cleans up lock files. If it still fails on Windows, run:

```bash
pnpm install --ignore-scripts
```

### Frontend API calls return 404

The Vite dev server proxies `/api` requests to the backend. If you see 404,  
the backend may not be running. Open a second terminal and start it:

```bash
cd server
pnpm run dev
```

If you disabled the proxy or need to test without it, ensure  
`VITE_API_URL=http://localhost:5001` in `frontend/.env`.

---

## Development Workflow

1. **Start developing:**
   ```bash
   # Run backend (in terminal 1): cd server && pnpm run dev
   # Run frontend (in terminal 2): cd frontend && pnpm run dev
   ```

2. **Make changes** to source files

3. **Test your changes** at http://localhost:3001

4. **Check types:**
   ```bash
   pnpm run typecheck
   ```

5. **Commit changes:**
   ```bash
   git add .
   git commit -m "Your descriptive commit message"
   ```

---

## Database Schema

The application uses Drizzle ORM with PostgreSQL. Schema files are in `packages/db/src/schema/`:

- `users.ts` - User accounts with roles
- `employees.ts` - Employee records
- `departments.ts` - Department organization
- `attendance.ts` - Attendance records
- `payroll.ts` - Salary and payroll data
- `timesheets.ts` - Time tracking
- `performance.ts` - KPIs and appraisals
- `branding.ts` - Company branding settings
- `settings.ts` - Biometrics, holidays, announcements, policies

---

## API Documentation

The API runs at `http://localhost:5001/api/`:

- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `GET/POST /api/employees` - Employee CRUD
- `GET/POST /api/departments` - Department CRUD
- `GET/POST /api/attendance` - Attendance records
- `GET/POST /api/leaves` - Leave management
- `GET/POST /api/payroll` - Payroll processing
- `GET/POST /api/timesheets` - Time tracking
- `GET/POST /api/performance/kpis` - KPI tracking
- `GET/POST /api/performance/appraisals` - Appraisals
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/dashboard/charts` - Chart data

---

## Useful Tips

1. **Frontend hot reload** - Vite automatically refreshes on file changes
2. **Backend watch mode** - The dev script rebuilds on changes
3. **Database changes** - Use `pnpm run db:push` after schema changes
4. **Reset database** - Drop all tables and re-run `pnpm run db:push && pnpm run db:seed`
