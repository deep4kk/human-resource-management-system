#!/bin/bash
# HRMS Deployment Script
# Deploys the HRMS application alongside existing apps in ~/apps/

set -e

# Configuration - Adjust these for your setup
APP_NAME="hrms"
APP_DIR="$HOME/apps/$APP_NAME"
BACKUP_DIR="$HOME/apps/$APP_NAME/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🚀 HRMS Deployment Script"
echo "========================"
echo "App will be deployed to: $APP_DIR"

# Check if app directory exists
if [ ! -d "$HOME/apps" ]; then
    echo "Creating apps directory..."
    mkdir -p "$HOME/apps"
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

# Clone or pull latest code from git
if [ -d "$APP_DIR/.git" ]; then
    echo "📥 Pulling latest code..."
    cd $APP_DIR
    git pull origin main
else
    echo "📥 Cloning repository..."
    git clone https://github.com/deep4kk/human-resource-management-system.git "$APP_DIR"
    cd $APP_DIR
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
if command -v systemctl &> /dev/null && [ "$(id -un)" = "root" ]; then
    # Copy service files with app-specific names
    sed "s|/opt/hrms|$APP_DIR|g" $APP_DIR/deploy/services/hrms-api.service > /etc/systemd/system/hrms-api.service
    sed "s|/opt/hrms|$APP_DIR|g" $APP_DIR/deploy/services/hrms-web.service > /etc/systemd/system/hrms-web.service
    
    # Also update User
    sed -i "s|^User=ubuntu$|User=$(whoami)|" /etc/systemd/system/hrms-api.service
    sed -i "s|^Group=ubuntu$|Group=$(id -gn)|" /etc/systemd/system/hrms-api.service
    sed -i "s|^User=ubuntu$|User=$(whoami)|" /etc/systemd/system/hrms-web.service
    sed -i "s|^Group=ubuntu$|Group=$(id -gn)|" /etc/systemd/system/hrms-web.service
    
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
    echo "  ⚠️  Systemd not available or not running as root"
    echo "  ⚠️  Services will need to be started manually"
fi

# Update Nginx config with correct paths
echo "⚙️  Setting up Nginx..."
if [ -f /etc/nginx/nginx.conf ]; then
    # Backup existing config if exists
    if [ -f /etc/nginx/sites-available/hrms ]; then
        cp /etc/nginx/sites-available/hrms /etc/nginx/sites-available/hrms.backup.$TIMESTAMP
    fi
    
    # Create nginx config
    sed "s|/opt/hrms|$APP_DIR|g" $APP_DIR/deploy/nginx/hrms.conf > /tmp/hrms.conf
    
    # Test and install
    nginx -t -c /tmp/hrms.conf 2>/dev/null || {
        echo "  ⚠️  Nginx config test failed, please check manually"
    }
    
    # The config needs to be added to nginx.conf or sites-available
    echo "  📝 Nginx config created at /tmp/hrms.conf"
    echo "  ⚠️  Please add to your nginx.conf or include it manually"
    echo ""
    echo "  Add this line to /etc/nginx/nginx.conf in http block:"
    echo "  include /tmp/hrms.conf;"
else
    echo "  ⚠️  Nginx not found"
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Copy $APP_DIR/.env.example to $APP_DIR/server/.env and configure"
echo "2. Setup database: cd $APP_DIR/server && pnpm run db:push && pnpm run db:seed"
echo "3. Configure Nginx (see above)"
echo "4. Setup SSL: sudo ./deploy/setup-ssl.sh"
echo ""
echo "Services status:"
systemctl status hrms-api --no-pager 2>/dev/null || echo "hrms-api service status unavailable"
systemctl status hrms-web --no-pager 2>/dev/null || echo "hrms-web service status unavailable"
