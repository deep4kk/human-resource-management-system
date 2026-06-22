#!/bin/bash
# HRMS Server Setup Script
# Run this script as root or with sudo on a fresh Ubuntu 22.04 server

set -e

echo "🚀 HRMS Server Setup Script"
echo "============================"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root or with sudo"
    exit 1
fi

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install essential packages
echo "📦 Installing essential packages..."
apt install -y \
    curl \
    wget \
    git \
    nginx \
    certbot \
    python3-certbot-nginx \
    software-properties-common \
    unzip

# Install Node.js 20.x
echo "📦 Installing Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Verify Node.js installation
node_version=$(node -v)
npm_version=$(npm -v)
echo "✅ Node.js $node_version and npm $npm_version installed"

# Install pnpm globally
echo "📦 Installing pnpm globally..."
npm install -g pnpm

# Install PostgreSQL
echo "📦 Installing PostgreSQL 16..."
apt install -y postgresql postgresql-contrib

# Start PostgreSQL
systemctl enable postgresql
systemctl start postgresql

# Create HRMS database and user
echo "📦 Setting up PostgreSQL database..."
sudo -u postgres psql <<EOF
CREATE DATABASE hrms;
CREATE USER hrms_user WITH PASSWORD 'change_this_password';
GRANT ALL PRIVILEGES ON DATABASE hrms TO hrms_user;
\c hrms
GRANT ALL ON SCHEMA public TO hrms_user;
EOF

echo "✅ PostgreSQL database 'hrms' created with user 'hrms_user'"

# Create HRMS application directory
echo "📦 Creating application directory..."
mkdir -p /opt/hrms
chown ubuntu:ubuntu /opt/hrms

# Setup firewall (optional but recommended)
echo "📦 Configuring firewall..."
ufw allow 22/tcp    # SSH
ufw allow 80/tcp     # HTTP
ufw allow 443/tcp   # HTTPS
ufw --force enable

echo ""
echo "✅ Server setup complete!"
echo ""
echo "Next steps:"
echo "1. Copy your application code to /opt/hrms"
echo "2. Create environment files (see .env.example files)"
echo "3. Run ./deploy.sh to deploy the application"
echo ""
echo "Database connection string:"
echo "postgresql://hrms_user:change_this_password@localhost:5432/hrms"
