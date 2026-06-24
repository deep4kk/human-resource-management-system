# 1. OBJECTIVE

Restructure the HRMS project and deploy to AWS EC2 with:
- **Frontend:** `hrms.flowmative.in` (React SPA, port 3001)
- **Backend API:** `hrserver.flowmative.in` (Express.js, port 5001)
- **Database:** PostgreSQL on same EC2 or external
- Clean project structure without Replit-specific artifacts (`artifacts/`, `scripts/`, etc.)
- Production-ready with Nginx reverse proxy, SSL (Let's Encrypt), systemd services

---

## ANALYSIS SUMMARY

### Items to DELETE:
| Item | Reason |
|------|--------|
| `artifacts/mockup-sandbox/` | Replit sandbox - not used in production |
| `scripts/` | Only has "hello.ts" - completely useless |
| `replit.md` | Replit-specific documentation |
| Replit vite plugins | `@replit/vite-plugin-cartographer`, `@replit/vite-plugin-dev-banner`, `@replit/vite-plugin-runtime-error-modal` |

### Items to KEEP:
| Item | Purpose |
|------|---------|
| `lib/db/` | Database schema (Drizzle ORM) |
| `lib/api-zod/` | Zod validation schemas |
| `lib/api-client-react/` | React Query hooks (generated) |
| `lib/api-spec/` | OpenAPI spec + Orval config |
| `docker-compose.yml` | Local PostgreSQL setup |
| `attached_assets/` | Project assets |

### New Structure:
```
hrms/
├── server/              # API server (moved from artifacts/api-server)
├── frontend/            # React frontend (moved from artifacts/hrms)
├── packages/
│   ├── db/             # Database schema (moved from lib/db)
│   ├── api-zod/        # Zod schemas (moved from lib/api-zod)
│   └── api-client/     # React hooks (moved from lib/api-client-react)
├── deploy/              # AWS deployment scripts
│   ├── nginx/           # Nginx subdomain config
│   ├── setup-server.sh  # Initial server setup
│   ├── setup-ssl.sh     # SSL certificate setup
│   └── deploy.sh        # Deployment automation
├── docker-compose.yml    # Local development PostgreSQL
├── .env.example         # Environment template
├── README.md            # Project documentation
├── HOSTING.md           # AWS deployment guide
└── LOCAL_DEV.md         # Development guide
```

---

# 2. CONTEXT SUMMARY

**Project Overview:**
- **Application:** Full-stack HRMS (Human Resource Management System) for Flowmative
- **Frontend:** React 19 + Vite 7 + TailwindCSS v4 + shadcn/ui with glassmorphism design
- **Backend:** Express 5 API server with TypeScript
- **Database:** PostgreSQL + Drizzle ORM
- **Monorepo:** pnpm workspaces with shared libraries
- **Build:** esbuild for backend, Vite for frontend

**Current Architecture (from Replit):**
- API Server: `artifacts/api-server` → runs on PORT env variable, serves `/api/*` routes
- Frontend: `artifacts/hrms` → Vite dev server with PORT and BASE_PATH env variables
- Shared: `lib/api-zod`, `lib/api-client-react`, `lib/db`, `lib/api-spec`

**Key Files to Modify for Hosting:**
- `artifacts/api-server/src/index.ts` - API entry point
- `artifacts/api-server/src/app.ts` - Express app setup
- `artifacts/hrms/vite.config.ts` - Vite configuration
- `pnpm-workspace.yaml` - Contains Replit-specific plugins to remove

**Database Requirements:**
- PostgreSQL 14+ (required for Drizzle ORM)
- Connection via `DATABASE_URL` environment variable

---

# 3. APPROACH OVERVIEW

**AWS EC2 Architecture:**
```
                    ┌─────────────────────────────────────────┐
                    │           AWS EC2 Instance             │
                    │         (Ubuntu 22.04 LTS)             │
                    │                                         │
  ┌──────────────┐ │  ┌─────────────┐    ┌────────────────┐ │
  │   Internet   │ │  │   Nginx     │    │  PostgreSQL    │ │
  │              │◄┼──│ (Reverse    │    │  (Port 5432)   │ │
  └──────────────┘ │  │  Proxy)     │    └────────────────┘ │
                   │  │             │                       │
  ┌──────────────┐ │  │ :443 (SSL)  │    ┌────────────────┐ │
  │ hrms.flow... │◄┼──│ ├─:3001 Web │    │   Services     │ │
  │              │ │  │ └─:5001 API│    │ - PM2          │ │
  └──────────────┘ │  └─────────────┘    │ - hrms-api     │ │
                   │                      │ - hrms-web     │ │
  ┌──────────────┐ │                      └────────────────┘ │
  │hrserver.fl..│◄┼──│                        │            │
  │              │ │  │                        ▼            │
  └──────────────┘ │  │         ┌─────────────────────┐   │
                   │  │         │  Backend (Port 5001) │   │
                   │  │         │  Frontend (Port 3001)│   │
                   │  │         └─────────────────────┘   │
                   │                                        │
                   └────────────────────────────────────────┘
```

**Key Changes Required:**
1. Restructure project (remove artifacts/, scripts/, replit.md)
2. Remove Replit-specific dependencies and plugins
3. Update all import paths (@workspace/* → @hrms/*)
4. Create Nginx configuration for subdomain routing
5. Create systemd service files for auto-restart
6. Create deployment and SSL setup scripts
7. Update documentation for new structure (server/, frontend/, packages/)

---

# 4. IMPLEMENTATION STEPS

## Phase 1: Prepare Application for Production

### Step 1: Clean Up Replit Dependencies
- **Goal:** Remove Replit-specific packages and plugins
- **Method:** Update `pnpm-workspace.yaml` and package.json files to remove `@replit/*` packages
- **Files:**
  - `pnpm-workspace.yaml` - Remove `@replit/vite-plugin-*` from catalog
  - `artifacts/hrms/package.json` - Remove `@replit/vite-plugin-*` devDependencies
  - `artifacts/hrms/vite.config.ts` - Remove Replit plugin imports and checks

### Step 2: Create Production Environment Files
- **Goal:** Set up environment configuration for production
- **Method:** Create `.env.example` files for both frontend and backend
- **Files:**
  - `artifacts/api-server/.env.example` - Database URL, JWT secret, PORT
  - `artifacts/hrms/.env.example` - API base URL, Base path

### Step 3: Update API Server for Production
- **Goal:** Add production-ready features to the backend
- **Method:** Enhance the Express app with:
  - CORS configuration with allowed origins
  - Health check endpoint (`/health`)
  - Security headers middleware
  - Request body size limits
  - Error handling improvements
- **Files:**
  - `artifacts/api-server/src/app.ts` - Add security middleware
  - `artifacts/api-server/src/index.ts` - Update for production readiness

### Step 4: Configure Frontend for Production Build
- **Goal:** Ensure frontend builds correctly for hosting
- **Method:** 
  - Update Vite config to remove Replit plugins
  - Add proper base path configuration
  - Ensure API URL is configurable
- **Files:**
  - `artifacts/hrms/vite.config.ts` - Clean production config

## Phase 2: Database Setup

### Step 5: Set Up PostgreSQL Database
- **Goal:** Provision a production PostgreSQL database
- **Method:** 
  - Option A: Use Supabase (free tier available)
  - Option B: Use Neon (serverless PostgreSQL)
  - Option C: Use Railway PostgreSQL
- **Reference:** Create DATABASE_URL in format: `postgresql://user:password@host:5432/dbname`

### Step 6: Create Database Migration Scripts
- **Goal:** Set up schema deployment process
- **Method:** Create scripts to run Drizzle migrations
- **Files:**
  - `artifacts/api-server/package.json` - Add migration scripts
  - `lib/db/drizzle.config.ts` - Ensure compatible with production

## Phase 3: AWS EC2 Deployment Files

### Step 7: Create Nginx Configuration
- **Goal:** Configure subdomain routing with SSL
- **Files to create:**
  - `deploy/nginx/hrms.conf` - Nginx config for both subdomains
  - `deploy/setup-ssl.sh` - SSL certificate setup script

### Step 8: Create Systemd Service Files
- **Goal:** Auto-restart services on failure
- **Files to create:**
  - `server/hrms-api.service` - API server systemd service
  - `frontend/hrms-web.service` - Frontend systemd service

### Step 9: Create Deployment Scripts
- **Goal:** Automate deployment process
- **Files to create:**
  - `deploy/setup-server.sh` - Initial server setup (Node.js, Nginx, PostgreSQL)
  - `deploy/deploy.sh` - Deployment script (pull, build, restart)

## Phase 4: Documentation Updates

### Step 10: Update Documentation
- **Goal:** Update all docs for new project structure
- **Files to update:**
  - `HOSTING.md` - Complete rewrite for AWS EC2 deployment
  - `LOCAL_DEV.md` - Update for new directory structure (server/, frontend/, packages/)
  - `replit.md` - DELETE (Replit-specific)

### Step 11: Create New Documentation
- **Goal:** Add proper documentation
- **Files to create:**
  - `README.md` - Project overview, quick start, tech stack

## Phase 5: AWS EC2 Setup (On Server)

### Step 12: Initial Server Setup
- **Goal:** Configure fresh AWS EC2 instance
- **Method:** Run `deploy/setup-server.sh` which installs:
  - Node.js 20.x
  - pnpm
  - Nginx
  - PostgreSQL
  - PM2

### Step 13: Deploy Application
- **Goal:** Deploy to AWS EC2
- **Method:** Run `deploy/deploy.sh` which:
  - Pulls latest code from Git
  - Installs dependencies
  - Builds frontend & backend
  - Restarts systemd services

### Step 14: Configure DNS & SSL
- **Goal:** Point domains and enable HTTPS
- **Method:**
  - Create DNS A records for both subdomains
  - Run `deploy/setup-ssl.sh` for Let's Encrypt certificates

### Step 15: Verify Deployment
- **Goal:** Confirm everything works
- **Method:**
  - Test `https://hrms.flowmative.in`
  - Test `https://hrserver.flowmative.in/health`
  - Login with demo accounts

---

# 5. DNS CONFIGURATION

Create these DNS records in your domain provider:

| Type | Name | Value | Purpose |
|------|------|-------|---------|
| A | hrms | your-ec2-public-ip | Frontend subdomain |
| A | hrserver | your-ec2-public-ip | Backend subdomain |

---

# 6. FILES TO CREATE/MODIFY SUMMARY

## Create:
- `deploy/nginx/hrms.conf` - Nginx subdomain routing
- `deploy/setup-server.sh` - Initial server setup
- `deploy/setup-ssl.sh` - SSL certificate setup
- `deploy/deploy.sh` - Deployment script
- `server/hrms-api.service` - systemd service
- `frontend/hrms-web.service` - systemd service
- `README.md` - Project documentation

## Delete:
- `artifacts/mockup-sandbox/` - Replit sandbox
- `scripts/` - Useless directory
- `replit.md` - Replit-specific docs
- `lib/` - Will be moved to packages/
- `artifacts/` - Will be restructured

## Move & Rename:
- `artifacts/api-server/` → `server/`
- `artifacts/hrms/` → `frontend/`
- `lib/db/` → `packages/db/`
- `lib/api-zod/` → `packages/api-zod/`
- `lib/api-client-react/` → `packages/api-client/`
- `lib/api-spec/` → `packages/api-spec/`

## Update:
- `pnpm-workspace.yaml` - New structure
- `pnpm-lock.yaml` - Regenerated
- All `package.json` - Update workspace refs
- All import paths - `@workspace/*` → `@hrms/*`
- `server/src/app.ts` - CORS config
- `server/src/index.ts` - Production ready
- `frontend/vite.config.ts` - Remove Replit plugins
- `HOSTING.md` - AWS EC2 guide
- `LOCAL_DEV.md` - New structure docs

---

# 7. DEPLOYMENT CHECKLIST

## Pre-Deployment:
- [ ] Restructure project (Phase 1)
- [ ] Update configs (Phase 2)
- [ ] Create deployment files (Phase 3)
- [ ] Update documentation (Phase 4)
- [ ] Test builds locally

## On AWS EC2:
- [ ] Run setup-server.sh
- [ ] Upload code to /opt/hrms
- [ ] Configure PostgreSQL database
- [ ] Create .env file
- [ ] Install dependencies & build
- [ ] Install systemd services
- [ ] Configure Nginx
- [ ] Setup SSL
- [ ] Configure DNS records

## Post-Deployment:
- [ ] Run database migrations
- [ ] Seed demo data
- [ ] Verify both subdomains
- [ ] Test login functionality

---

# 8. POST-DEPLOYMENT IMPROVEMENTS

## High Priority Improvements

### 1. Security Enhancements
- **Add rate limiting** to prevent brute force attacks on login
- **Implement proper CORS** with specific allowed origins (not `*`)
- **Add security headers** (helmet.js or manual CSP headers)
- **Hash passwords** with bcrypt instead of plain text storage
- **Add input sanitization** for all user inputs

### 2. Database Improvements
- **Add database indexing** on frequently queried columns (employee_id, date, department_id)
- **Implement soft deletes** for employees and records
- **Add database migrations versioning** for safer schema changes

### 3. Error Handling & Logging
- **Add structured error responses** with error codes
- **Implement global error handler** middleware
- **Add alerting** for critical errors (Slack/email notifications)
- **Log to file** in addition to stdout for debugging

## Medium Priority Improvements

### 4. Performance Optimizations
- **Add pagination** to all list endpoints (currently may return all records)
- **Implement caching** for dashboard stats and reference data
- **Add database connection pooling** configuration
- **Optimize frontend bundle** with code splitting

### 5. API Improvements
- **Add request validation** with detailed error messages
- **Implement API versioning** (e.g., `/api/v1/`)
- **Add OpenAPI documentation** with Swagger UI
- **Add batch endpoints** for bulk operations

### 6. Monitoring & Observability
- **Add health check endpoint** with dependency checks (database, external services)
- **Implement request ID tracking** for debugging
- **Add metrics endpoint** for monitoring (Prometheus format)
- **Set up uptime monitoring** (UptimeRobot, Pingdom)

## Lower Priority (Nice to Have)

### 7. Feature Enhancements
- **Email notifications** for leave approvals, payroll, announcements
- **File upload** for employee documents and profile pictures
- **Audit logging** for all data changes
- **Two-factor authentication** for admin accounts

### 8. DevOps Improvements
- **Add CI/CD pipeline** (GitHub Actions)
- **Implement blue-green deployment** strategy
- **Add Docker containers** for easier deployment
- **Create staging environment** for testing changes

### 9. Documentation
- **Add README** with setup instructions
- **Document API endpoints** with examples
- **Create deployment guide** for future reference
- **Add inline code comments** for complex business logic

---

# 8. PROFITABLE SaaS FEATURES (Business Plan)

## 🎯 Revenue Strategy: B2B SaaS Model

**Target Market:** Indian SMBs (10-500 employees)
**Pricing Model:** ₹999-4999/month based on employee count
**TAM:** ₹5000 Crore HR software market in India

---

## 🔴 CORE MONETIZATION FEATURES (Must Have)

### 1. Multi-Tenancy Architecture
- **What:** Host multiple companies (tenants) on single infrastructure
- **Why:** Essential for SaaS - reduces cost, enables subscription model
- **Implementation:**
  - Add `tenant_id` to all tables
  - Create tenant isolation middleware
  - Add tenant onboarding flow with subdomain (company.hrms.com)
  - White-label settings per tenant (logo, colors, branding)

### 2. Subscription & Billing System
- **What:** Handle payments, plans, and usage tracking
- **Features:**
  - Plan tiers: Starter (₹49/employee), Pro (₹99/employee), Enterprise (₹199/employee)
  - Monthly/annual billing with discount (2 months free annually)
  - Usage-based billing (overage charges)
  - Invoice generation (PDF export)
  - Payment gateway integration (Razorpay, Stripe India)
  - Free trial period (14 days)
  - Auto-renewal & reminders

### 3. Self-Service Employee Portal (ESS)
- **What:** Employees manage their own data
- **Features:**
  - View payslips and download
  - Apply leaves and track status
  - Update personal info (bank details, emergency contact)
  - View attendance records
  - Tax declaration submission
  - Document upload (photos, certificates)
  - Personal profile with avatar
  - Mobile-responsive for all screens

### 4. Manager Dashboard
- **What:** Empower team leads to manage their teams
- **Features:**
  - Team attendance overview
  - Leave approval workflow (customizable)
  - Team timesheet review
  - Direct report performance view
  - Delegation management (when manager is absent)
  - Team analytics (work hours, overtime)

---

## 🟡 HIGH-VALUE DIFFERENTIATORS

### 5. Indian Compliance Engine
- **What:** Built-in compliance for Indian labor laws
- **Features:**
  - PF calculation with ECR file generation
  - ESI calculation and filing
  - TDS on salary (Section 192)
  - Form 16 Part A/B generation (PDF)
  - Professional Tax (PT) per state
  - Gratuity calculator
  - LWF (Labour Welfare Fund)
  - Bonus Act calculations
  - State-wise holiday calendar accuracy
  - Correctable for Karnataka, Maharashtra, Tamil Nadu, Delhi, etc.

### 6. Payroll Disbursement Integration
- **What:** Connect to banks for salary transfer
- **Features:**
  - NEFT/RTGS batch file generation
  - Bank format templates (SBI, HDFC, ICICI, Axis)
  - Salary slip email to employees
  - Reimbursement processing
  - TDS adjustment from investments
  - Salary revision tracking
  - Arrears calculation

### 7. Document Generation & E-Signature
- **What:** Generate legal HR documents automatically
- **Features:**
  - Offer letter generation (already have template engine)
  - Appointment letter
  - Experience letter
  - Relieving letter
  - NDA generation
  - Promotion letter
  - Increment letter
  - E-signature integration (DocuSign, HelloSign API)
  - Bulk document generation
  - Document templates library

### 8. Attendance & Geofencing
- **What:** Smart attendance tracking
- **Features:**
  - Geo-fencing for office locations (define allowed zones)
  - Mobile check-in/out with GPS
  - Overtime calculation
  - Shift management (day/night/rotational)
  - Late arrival policies with auto-deduction
  - Early leaving tracking
  - Comp-off calculation
  - Holiday vs weekly off handling

---

## 🟢 ADVANCED FEATURES (Premium Tier)

### 9. Recruitment Module
- **What:** End-to-end hiring pipeline
- **Features:**
  - Job posting creation
  - Resume parsing (AI extraction)
  - Candidate tracking (Applied → Screening → Interview → Offer → Hired)
  - Interview scheduling with calendar sync
  - Offer letter generation
  - Onboarding checklist
  - Background verification integration
  - LinkedIn Naukri Indeed import

### 10. Performance Management System
- **What:** Goal tracking and reviews
- **Features:**
  - OKR (Objectives & Key Results) setup
  - Performance review cycles (quarterly/annual)
  - 360-degree feedback
  - Competency matrix
  - Promotion recommendation engine
  - Goal progress tracking
  - Peer reviews
  - Self-assessment forms

### 11. Advanced Analytics & BI
- **What:** Data-driven HR insights
- **Features:**
  - Attrition rate tracking & prediction
  - Cost per hire
  - Time to fill
  - Employee satisfaction scores
  - Headcount planning
  - Diversity analytics
  - Compensation benchmarking
  - Custom report builder
  - Export to Excel/PDF
  - Scheduled reports (monthly email)

### 12. Integrations Ecosystem
- **What:** Connect with business tools
- **Integrations:**
  - Zoho Books / Tally / QuickBooks (accounting sync)
  - Google Workspace (calendar sync)
  - Microsoft Teams / Slack (notifications)
  - Dropbox / Google Drive (document storage)
  - Zapier/Make (automation workflows)
  - HR APIs for custom integrations

---

## 🔵 GROWTH FEATURES (Long-term)

### 13. AI-Powered Automation
- **What:** Smart HR assistant
- **Features:**
  - Chatbot for employee queries (leave balance, policy questions)
  - Anomaly detection (unusual attendance patterns)
  - Attrition risk scoring
  - Resume matching for jobs
  - Auto-approve leave (based on policies)
  - Smart scheduling suggestions

### 14. Mobile App (React Native)
- **What:** Native mobile experience
- **Features:**
  - iOS and Android apps
  - Push notifications
  - Biometric login (fingerprint/face)
  - Offline attendance sync
  - Expense capture with receipt photos
  - Company news feed

### 15. Helpdesk & Support
- **What:** In-app support system
- **Features:**
  - Ticket raising system
  - Knowledge base / FAQ
  - Live chat with HR admin
  - Video tutorial library
  - Community forum

---

## 💰 PRICING TIER STRUCTURE

| Feature | Starter (₹49/emp) | Pro (₹99/emp) | Enterprise (₹199/emp) |
|---------|-------------------|--------------|----------------------|
| Employees | Up to 50 | Up to 200 | Unlimited |
| Core HR | ✅ | ✅ | ✅ |
| Payroll | ❌ | ✅ | ✅ |
| Compliance | ❌ | ✅ | ✅ |
| Self-Service | Basic | Full | Full |
| Manager Dashboard | ❌ | ✅ | ✅ |
| Analytics | Basic | Advanced | Custom |
| Integrations | 1 | 5 | Unlimited |
| Support | Email | Priority | Dedicated |
| SLA | 99% | 99.5% | 99.9% |
| White-label | ❌ | ❌ | ✅ |
| Custom domain | ❌ | ❌ | ✅ |

---

## 📋 IMPLEMENTATION PRIORITY

### Phase 1: Foundation (Months 1-2)
1. Multi-tenancy architecture
2. Tenant onboarding & white-label
3. Basic subscription billing (Razorpay)
4. Self-service employee portal

### Phase 2: Payroll (Months 3-4)
5. Full payroll with compliance
6. Bank integration (NEFT/RTGS)
7. Document generation
8. Manager dashboard

### Phase 3: Growth (Months 5-6)
9. Recruitment module
10. Performance management
11. Analytics dashboard
12. Mobile app MVP

### Phase 4: Scale (Months 7+)
13. AI automation
14. API marketplace
15. Partner program
16. Enterprise features

---

## 🎯 QUICK WINS (Add in 1-2 weeks each)

1. **WhatsApp Notifications** - Send leave approvals, payslip links via WhatsApp Business API
2. **Google Calendar Sync** - Show company holidays in personal calendar
3. **Excel Import/Export** - Bulk data upload for employees, attendance
4. **Company Blog** - HR tips, policy updates, company news
5. **Employee Directory** - Searchable org chart with photos
6. **Birthday/Work Anniversary Alerts** - Team celebrations
7. **Quick Links Widget** - Frequently accessed documents, forms
8. **Dark Mode** - Already have glassmorphism, add dark theme option

---

## 9. HOSTING PROVIDERS SUMMARY

| Service | Free Tier | Best For | Database Included |
|---------|-----------|----------|-------------------|
| **Railway** | 500 hours/month | Easy Node.js deployment | Yes (paid) |
| **Render** | 750 hours/month | Simple deployment | Yes (paid) |
| **Fly.io** | 3 shared VMs | Global distribution | No |
| **Vercel** | Generous free | Frontend (React) | No |
| **Supabase** | Good free tier | Full stack with DB | Yes (PostgreSQL) |
| **Neon** | Serverless PostgreSQL | Serverless database | Yes (PostgreSQL) |

**Recommended Combination:**
- Frontend: **Vercel** (best for React/Vite, excellent CDN)
- Backend: **Railway** or **Render** (easy Node.js support)
- Database: **Supabase** or **Neon** (free PostgreSQL tiers available)
