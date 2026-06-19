# Local Development Guide

This guide helps you set up and run the Toyo Kambocha HRMS application on your local machine.

## Prerequisites

- **Node.js** 18+ (recommended: 20.x or 24.x)
- **pnpm** package manager
- **PostgreSQL** 14+ (local installation OR cloud provider)

---

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/deep4kk/human-resource-management-system.git
cd human-resource-management-system
pnpm install
```

### 2. Set Up Database

You have two options:

#### Option A: Local PostgreSQL

1. Install PostgreSQL on your machine
2. Create a database:

```bash
psql -U postgres
CREATE DATABASE hrms;
\q
```

#### Option B: Cloud PostgreSQL (Recommended for Beginners)

1. Create a free account at [Supabase](https://supabase.com) or [Neon](https://neon.tech)
2. Create a new project
3. Copy the connection string (it looks like: `postgresql://user:password@host:5432/dbname`)

### 3. Configure Environment

Create the backend `.env` file:

```bash
cp artifacts/api-server/.env.example artifacts/api-server/.env
```

Edit `artifacts/api-server/.env`:
```env
DATABASE_URL=postgresql://your-user:your-password@localhost:5432/hrms
JWT_SECRET=your-super-secret-key-at-least-32-characters-long
PORT=3000
NODE_ENV=development
CORS_ORIGINS=http://localhost:5173
```

Create the frontend `.env` file:

```bash
cp artifacts/hrms/.env.example artifacts/hrms/.env
```

Edit `artifacts/hrms/.env`:
```env
VITE_API_URL=http://localhost:3000
BASE_PATH=/
```

### 4. Initialize Database Schema

Push the database schema:

```bash
cd artifacts/api-server
pnpm run db:push
```

### 5. Seed Demo Data

Run the seed script to create demo users and sample data:

```bash
cd artifacts/api-server
pnpm run db:seed
```

### 6. Start Development Servers

In one terminal, start the backend:
```bash
cd artifacts/api-server
pnpm run dev
```

In another terminal, start the frontend:
```bash
cd artifacts/hrms
pnpm run dev
```

### 7. Access the Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **Health Check:** http://localhost:3000/health

---

## Demo Accounts

After seeding, you can log in with these accounts:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@toyo-kambocha.com | admin123 |
| HR Manager | hr@toyo-kambocha.com | hr123 |
| Employee | employee@toyo-kambocha.com | emp123 |
| Manager | manager@toyo-kambocha.com | mgr123 |

---

## Project Structure

```
human-resource-management-system/
├── artifacts/
│   ├── api-server/         # Express.js backend
│   │   ├── src/
│   │   │   ├── index.ts    # Entry point
│   │   │   ├── app.ts      # Express app setup
│   │   │   ├── routes/     # API routes
│   │   │   └── lib/         # Auth, utils
│   │   ├── .env.example    # Environment template
│   │   └── package.json
│   └── hrms/               # React frontend
│       ├── src/
│       │   ├── pages/       # Page components
│       │   ├── components/  # UI components
│       │   └── hooks/       # Custom hooks
│       ├── .env.example     # Environment template
│       └── package.json
├── lib/                    # Shared libraries
│   ├── db/                 # Drizzle ORM schema
│   ├── api-zod/           # Zod validation schemas
│   └── api-client-react/  # React Query hooks
└── scripts/                # Utility scripts
```

---

## Common Commands

### Build for Production

```bash
# Build all packages
pnpm run build

# Build only backend
cd artifacts/api-server && pnpm run build

# Build only frontend
cd artifacts/hrms && pnpm run build
```

### Type Checking

```bash
pnpm run typecheck
```

### Database Operations

```bash
cd artifacts/api-server

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

### "DATABASE_URL must be set"

Make sure you created the `.env` file in `artifacts/api-server/`:

```bash
cp artifacts/api-server/.env.example artifacts/api-server/.env
# Then edit it with your database URL
```

### "Port already in use"

Change the port in `.env`:

```env
PORT=3001
```

And update the frontend `.env`:

```env
VITE_API_URL=http://localhost:3001
```

### Database connection refused

1. Make sure PostgreSQL is running:
   - macOS: `brew services start postgresql`
   - Linux: `sudo systemctl start postgresql`
   - Windows: Start the PostgreSQL service

2. Check your connection string format:
   ```
   postgresql://username:password@localhost:5432/database_name
   ```

### "Cannot find module"

Run `pnpm install` to ensure all dependencies are installed.

### Node version issues

Use Node.js 18+:
```bash
node --version  # Should be 18.x or higher
```

---

## Development Workflow

1. **Start developing:**
   ```bash
   pnpm run dev  # Runs both frontend and backend concurrently
   ```

2. **Make changes** to source files

3. **Test your changes** at http://localhost:5173

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

The application uses Drizzle ORM with PostgreSQL. Schema files are in `lib/db/src/schema/`:

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

The API runs at `http://localhost:3000/api/`:

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
