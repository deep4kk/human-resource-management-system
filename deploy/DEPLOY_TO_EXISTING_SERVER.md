# HRMS Deployment Guide for Existing EC2 Server

This guide helps you deploy HRMS alongside your existing apps (like `purchase-bill-automation`) in your `~/apps/` directory.

## Prerequisites

- SSH access to `ubuntu@ip-172-31-39-147`
- Existing apps in `~/apps/`
- Node.js 22+ installed (uses `--env-file` flag)
- pnpm installed (`npm install -g pnpm`)
- PostgreSQL database (can use local or cloud like Supabase)

---

## Step 1: Clone the Repository

SSH into your server and clone the repository:

```bash
ssh ubuntu@ip-172-31-39-147
cd ~/apps
git clone https://github.com/deep4kk/human-resource-management-system.git hrms
cd hrms
```

---

## Step 2: Install Dependencies

```bash
cd ~/apps/hrms
pnpm install
```

---

## Step 3: Configure Environment

Create the environment file for the server:

```bash
cp server/.env.example server/.env
nano server/.env  # or use your preferred editor
```

Edit `server/.env` with your values:

```env
# Database - Use your existing PostgreSQL or create a new one
DATABASE_URL=postgresql://user:password@host:5432/hrms

# JWT Secret - Generate a secure random string (min 32 chars)
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long

# Server Configuration
PORT=5001
NODE_ENV=production
CORS_ORIGINS=https://your-domain.com
```

Create the environment file for the frontend:

```bash
cp frontend/.env.example frontend/.env
nano frontend/.env
```

Edit `frontend/.env`:

```env
VITE_API_URL=https://your-api-domain.com
BASE_PATH=/
```

---

## Step 4: Build the Application

```bash
# Build server
cd ~/apps/hrms/server
pnpm run build

# Build frontend
cd ~/apps/hrms/frontend
pnpm run build
```

---

## Step 5: Setup Database

```bash
cd ~/apps/hrms/server

# Push database schema
pnpm run db:push

# Seed demo data (optional but recommended for testing)
pnpm run db:seed
```

---

## Step 6: Start the Services

> **Port Configuration**: API on **5001**, Frontend on **3001**

### Option A: PM2 (Recommended for existing apps)

```bash
# Install PM2 if not already installed
npm install -g pm2

# Start API server (port 5001)
cd ~/apps/hrms/server
PORT=5001 pm2 start pnpm --name "hrms-api" -- start

# Start Frontend (port 3001)
cd ~/apps/hrms/frontend
PORT=3001 pm2 start pnpm --name "hrms-web" -- serve
```

### Option B: Systemd Services

```bash
# Create the service files
sudo nano /etc/systemd/system/hrms-api.service
```

```ini
[Unit]
Description=HRMS API Server
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/apps/hrms/server
Environment=PORT=5001
Environment=NODE_ENV=production
ExecStart=/usr/bin/pnpm run start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
sudo nano /etc/systemd/system/hrms-web.service
```

```ini
[Unit]
Description=HRMS Web Frontend
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/apps/hrms/frontend
Environment=PORT=3001
Environment=NODE_ENV=production
ExecStart=/usr/bin/pnpm run serve
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start services
sudo systemctl daemon-reload
sudo systemctl enable hrms-api
sudo systemctl enable hrms-web
sudo systemctl start hrms-api
sudo systemctl start hrms-web
```

---

## Step 7: Configure Nginx

Create a separate Nginx config file for HRMS (doesn't touch your existing configs):

```bash
sudo nano /etc/nginx/sites-available/hrms
```

```nginx
# HRMS API (runs on port 5001)
upstream hrms_api {
    server 127.0.0.1:5001;
    keepalive 32;
}

# HRMS Web (runs on port 3001)
upstream hrms_web {
    server 127.0.0.1:3001;
    keepalive 32;
}

# API subdomain
server {
    listen 80;
    server_name hrserver.flowmative.in;

    location / {
        proxy_pass http://hrms_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Frontend subdomain
server {
    listen 80;
    server_name hrms.flowmative.in;

    root /home/ubuntu/apps/hrms/frontend/dist/public;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://hrms_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# Enable the site (creates symlink)
sudo ln -sf /etc/nginx/sites-available/hrms /etc/nginx/sites-enabled/hrms

# Test and reload Nginx
sudo nginx -t
sudo systemctl reload nginx
```

---

## Step 8: Setup SSL (Let's Encrypt)

```bash
# Install certbot
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# Generate certificates
sudo certbot --nginx -d hrserver.flowmative.in -d hrms.flowmative.in

# Auto-renewal (optional but recommended)
sudo crontab -e
# Add this line:
# 0 0 * * * sudo certbot renew --quiet
```

---

## Step 9: Verify Deployment

```bash
# Check service status
sudo systemctl status hrms-api
sudo systemctl status hrms-web

# Or with PM2
pm2 list

# Test API (port 5001)
curl http://localhost:5001/health

# Test frontend (port 3001)
curl http://localhost:3001
```

---

## Useful Commands

```bash
# Restart services
sudo systemctl restart hrms-api
sudo systemctl restart hrms-web

# View logs
sudo journalctl -u hrms-api -f
sudo journalctl -u hrms-web -f

# Or with PM2
pm2 logs hrms-api
pm2 logs hrms-web

# Update and redeploy
cd ~/apps/hrms
git pull origin main
pnpm install
cd server && pnpm run build && cd ..
cd frontend && pnpm run build && cd ..
sudo systemctl restart hrms-api
sudo systemctl restart hrms-web
```

---

## Port Configuration

If ports 3000 or 3001 are already in use by other apps, you can change them:

1. Edit `server/.env`: `PORT=3010`
2. Edit `frontend/.env`: `VITE_API_URL=http://localhost:3010` (for local testing)
3. Update Nginx config to proxy to the new port
4. Update systemd service ports accordingly

---

## Demo Accounts

After seeding the database:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@flowmative.com | admin123 |
| HR | hr@flowmative.com | hr123 |
| Employee | employee@flowmative.com | emp123 |
| Manager | manager@flowmative.com | mgr123 |
