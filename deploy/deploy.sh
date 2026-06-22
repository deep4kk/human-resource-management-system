#!/bin/bash
# HRMS Deployment Script
# Deploys the HRMS application to production

set -e

APP_DIR="/opt/hrms"
BACKUP_DIR="/opt/hrms/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🚀 HRMS Deployment Script"
echo "========================"

# Check if running as correct user
if [ "$(id -un)" != "ubuntu" ] && [ "$(id -un)" != "root" ]; then
    echo "Please run as ubuntu user or root"
    exit 1
fi

# Function to deploy a service
deploy_service() {
    local service_name=$1
    local service_dir=$2
    
    echo "📦 Deploying $service_name..."
    
    # Create backup
    if [ -d "$APP_DIR/$service_dir" ]; then
        mkdir -p $BACKUP_DIR
        backup_file="$BACKUP_DIR/${service_dir}_${TIMESTAMP}.tar.gz"
        tar -czf "$backup_file" -C "$APP_DIR" "$service_dir" 2>/dev/null || true
        echo "  📁 Backup created: $backup_file"
    fi
    
    # Install dependencies
    cd "$APP_DIR/$service_dir"
    pnpm install --frozen-lockfile
    
    # Build
    if [ -f "package.json" ] && grep -q '"build"' package.json; then
        pnpm run build
    fi
    
    echo "  ✅ $service_name deployed"
}

# Pull latest code from git
if [ -d "$APP_DIR/.git" ]; then
    echo "📥 Pulling latest code..."
    cd $APP_DIR
    git pull origin main
else
    echo "⚠️  Not a git repository. Skipping pull."
fi

# Install root dependencies
echo "📦 Installing root dependencies..."
cd $APP_DIR
pnpm install --frozen-lockfile

# Deploy services
deploy_service "Server API" "server"
deploy_service "Frontend" "frontend"

# Setup systemd services
echo "⚙️  Setting up systemd services..."
if [ "$(id -un)" = "root" ]; then
    # Copy service files
    cp $APP_DIR/deploy/services/*.service /etc/systemd/system/
    
    # Reload systemd
    systemctl daemon-reload
    
    # Enable and start services
    systemctl enable hrms-api
    systemctl enable hrms-web
    
    # Restart services
    systemctl restart hrms-api
    systemctl restart hrms-web
    
    echo "  ✅ Systemd services enabled and started"
else
    echo "  ⚠️  Run with sudo to enable systemd services"
fi

# Setup Nginx
echo "⚙️  Setting up Nginx..."
if [ "$(id -un)" = "root" ]; then
    cp $APP_DIR/deploy/nginx/hrms.conf /etc/nginx/sites-available/hrms
    
    # Enable site
    if [ -f /etc/nginx/sites-enabled/default ]; then
        rm /etc/nginx/sites-enabled/default
    fi
    ln -sf /etc/nginx/sites-available/hrms /etc/nginx/sites-enabled/
    
    # Test and reload nginx
    nginx -t && systemctl reload nginx
    echo "  ✅ Nginx configured"
else
    echo "  ⚠️  Run with sudo to configure Nginx"
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Services status:"
systemctl status hrms-api --no-pager || true
systemctl status hrms-web --no-pager || true
