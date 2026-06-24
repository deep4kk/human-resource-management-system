# Flowmative HRMS - Production Hosting Guide

This guide provides step-by-step instructions for deploying the HRMS application to production hosting environments.

## Prerequisites

- Node.js 22+ installed locally (uses `--env-file` flag)
- pnpm package manager (`npm install -g pnpm`)
- Git repository for your project
- PostgreSQL 14+ database (or use a cloud provider)

---

## Project Structure

```
hrms/
├── server/              # API server (Express.js)
├── frontend/            # React frontend (Vite)
├── packages/
│   ├── db/            # Database schema (Drizzle ORM)
│   ├── api-zod/       # Zod validation schemas
│   └── api-client/    # React Query hooks
├── deploy/             # AWS deployment scripts
├── docker-compose.yml  # Local PostgreSQL
└── .env.example       # Environment template
```

---

## Recommended Hosting Stack

| Service | Purpose | Recommended Provider |
|---------|---------|---------------------|
| **Frontend** | React/Vite static hosting | Vercel (recommended) |
| **Backend** | Express.js API server | Railway, Render, or AWS EC2 |
| **Database** | PostgreSQL | Supabase, Neon, or AWS RDS |

---

## Quick Start (TL;DR)

For a quick production deployment:

1. Clone repo: `git clone https://github.com/deep4kk/human-resource-management-system.git`
2. Install deps: `pnpm install`
3. Configure env files: `cp server/.env.example server/.env`
4. Set up database and run migrations: `cd server && pnpm run db:push && pnpm run db:seed`
5. Deploy backend to Railway/Render/AWS EC2
6. Deploy frontend to Vercel/Netlify

---

## Phase 1: Prepare Your Repository

### 1.1 Get Latest Code

```bash
git clone https://github.com/deep4kk/human-resource-management-system.git
cd human-resource-management-system
pnpm install
```

### 1.2 Environment Configuration

Create environment files based on the examples:

**Backend (`server/.env`):**
```bash
cp server/.env.example server/.env
```

Edit `server/.env` with your production values:
```env
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
PORT=5001
NODE_ENV=production
CORS_ORIGINS=https://your-frontend.vercel.app,http://localhost:3001
```

**Frontend (`frontend/.env`):**
```bash
cp frontend/.env.example frontend/.env
```

Edit `frontend/.env` with your production values:
```env
VITE_API_URL=https://your-api-domain.com
BASE_PATH=/
```

---

## Phase 2: Database Setup

### Option A: Supabase (Recommended - Free Tier Available)

1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Get connection string from Settings > Database
4. Use connection string as `DATABASE_URL`

### Option B: Neon (Serverless PostgreSQL)

1. Create account at [neon.tech](https://neon.tech)
2. Create new project
3. Get connection string from Dashboard
4. Use connection string as `DATABASE_URL`

### Option C: Railway PostgreSQL

1. Create account at [railway.app](https://railway.app)
2. Create new project > Add PostgreSQL
3. Get connection string from variables tab

### Run Database Setup

Once your database is set up:

```bash
cd server

# Push schema to database (creates/updates tables)
pnpm run db:push

# Seed demo data (creates admin/HR/employee/manager accounts)
pnpm run db:seed
```

---

## Phase 3: Deploy Backend API

### Option A: Railway (Recommended)

1. Push your code to GitHub
2. Go to [railway.app](https://railway.app) and create new project
3. Connect your GitHub repository
4. Select the `server` directory as the root
5. Add environment variables:
   - `DATABASE_URL` - Your PostgreSQL connection string
   - `JWT_SECRET` - Your JWT secret key
   - `PORT` - 3000
   - `NODE_ENV` - production
   - `CORS_ORIGINS` - Your frontend URL
6. Deploy!

### Option B: Render

1. Push your code to GitHub
2. Go to [render.com](https://render.com) and create new Web Service
3. Connect your GitHub repository
4. Configure:
   - **Root Directory:** `server`
   - **Build Command:** `pnpm install && pnpm run build`
   - **Start Command:** `pnpm run start`
5. Add environment variables (same as Railway)
6. Deploy!

### Option C: Fly.io

1. Install Fly CLI: `npm install -g fly`
2. Login: `fly auth login`
3. Create `fly.toml` in `server/`:
   ```toml
   app = "your-app-name"
   primary_region = "sin"

   [build]

   [env]
   PORT = "8080"

   [http_service]
   internal_port = 8080
   force_https = true
   auto_stop_machines = true
   auto_start_machines = true
   min_machines_running = 0
   processes = ["app"]
   ```
4. Launch: `fly launch`
5. Set secrets: `fly secrets set DATABASE_URL=... JWT_SECRET=...`
6. Deploy: `fly deploy`

### Verify Backend

Test your deployed API:
```bash
curl https://your-api-domain.com/health
```

Expected response:
```json
{"status": "healthy", "timestamp": "2024-01-01T00:00:00.000Z"}
```

---

## Phase 4: Deploy Frontend

### Vercel (Recommended)

1. Push your code to GitHub (if not already)
2. Go to [vercel.com](https://vercel.com) and import project
3. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `./frontend`
   - **Build Command:** `pnpm run build`
   - **Output Directory:** `dist/public`
   - **Install Command:** `pnpm install`
4. Add environment variable:
   - `VITE_API_URL` - Your backend API URL (e.g., `https://your-api.railway.app`)
   - `BASE_PATH` - `/` (or your subdirectory path)
5. Deploy!

### Netlify

1. Push your code to GitHub
2. Go to [netlify.com](https://netlify.com)
3. Import from Git > Select repository
4. Configure:
   - **Base directory:** `frontend`
   - **Build command:** `pnpm run build`
   - **Publish directory:** `dist/public`
5. Add environment variables
6. Deploy!

---

## Password Hash Consistency

The server and seed script use the same password hashing algorithm:

- Algorithm: `SHA256`
- Salt: `"hrms_salt_flowmative"` appended to the password before hashing
- Output: lowercase hex string

If you change the salt in `server/src/lib/auth.ts`, you **must** also update it in `packages/db/src/seed.ts` line 16 (`const SALT = "hrms_salt_flowmative"`), then re-seed the database. Otherwise seeded passwords won't match server verification (401 on login).

---

## Phase 5: Post-Deployment Configuration

### Configure Environment Variables on Hosting Platforms

Ensure these environment variables are set:

**Backend:**
| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | `your-secret-key-here` |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `production` |
| `CORS_ORIGINS` | Allowed frontend domains | `https://your-hrms.vercel.app` |

**Frontend:**
| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://your-api.railway.app` |
| `BASE_PATH` | Application base path | `/` |

---

## Testing Your Deployment

### 1. Health Check
```bash
curl https://your-api-domain.com/health
```

### 2. Login Test
```bash
curl -X POST https://your-api-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@flowmative.com","password":"admin123"}'
```

### 3. Frontend Test
Visit your frontend URL and:
- Login with demo accounts (see below)
- Navigate through dashboard
- Test employee management CRUD

### Demo Accounts

| Role | Email | Password |
|------|-------|---------|
| Admin | admin@flowmative.com | admin123 |
| HR Manager | hr@flowmative.com | hr123 |
| Employee | employee@flowmative.com | emp123 |
| Manager | manager@flowmative.com | mgr123 |

---

## Troubleshooting

### CORS Errors

If you see CORS errors:
1. Verify `CORS_ORIGINS` includes your frontend URL
2. Check for trailing slashes (remove them)
3. Ensure frontend URL uses `https://`

### Database Connection Failed

1. Verify `DATABASE_URL` is correct
2. Check database is accessible from hosting platform
3. Ensure SSL is enabled for cloud databases

### Build Failed

1. Run `pnpm install` locally first
2. Check all dependencies are in `package.json`
3. Verify Node.js version is 18+

### API Returns 500

1. Check server logs for errors
2. Verify all required environment variables are set
3. Test database connection directly

---

## Security Checklist

- [ ] JWT_SECRET is at least 32 characters
- [ ] CORS_ORIGINS is configured with specific domains (not `*`)
- [ ] `NODE_ENV=production` is set
- [ ] Database uses SSL connection
- [ ] No sensitive data in `.env` files committed to git

---

## Scaling Considerations

### Backend Scaling
- Railway: Upgrade to paid tier for more memory/CPU
- Render: Scale to higher instance type
- Fly.io: Adjust auto-stop/start settings

### Database Scaling
- Supabase: Upgrade to Pro tier for more connections
- Neon: Scale compute to higher tier
- Add read replicas for heavy read workloads

### Frontend Scaling
- Vercel handles scaling automatically
- Enable edge caching for static assets

---

## Monitoring & Logging

### Recommended Tools
- **Sentry** - Error tracking
- **Datadog** - APM and monitoring
- **LogSnag** - Simple event logging

### Health Check Monitoring
Set up uptime monitoring for:
- `https://your-api.com/health` - API health
- `https://your-api.com/ready` - Readiness probe

---

## Support

For issues or questions:
1. Check the application logs
2. Verify environment variables
3. Test database connectivity
4. Review hosting platform documentation

---

## Related Documentation

- [Local Development Guide](./LOCAL_DEV.md) - For setting up development environment
- [Main README](./README.md) - Project overview and architecture
