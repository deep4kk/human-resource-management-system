#!/bin/bash
# HRMS SSL Setup Script
# Obtain SSL certificates for both subdomains using Let's Encrypt

set -e

echo "🔒 HRMS SSL Setup Script"
echo "========================"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root or with sudo"
    exit 1
fi

EMAIL="admin@flowmative.in"  # Change this to your email
DOMAINS=("hrserver.flowmative.in" "hrms.flowmative.in")

# Install certbot if not present
if ! command -v certbot &> /dev/null; then
    echo "📦 Installing Certbot..."
    apt update
    apt install -y certbot python3-certbot-nginx
fi

# Stop nginx temporarily for standalone mode
echo "⏸️  Stopping Nginx for certificate generation..."
systemctl stop nginx

# Generate certificates
echo "🔐 Generating SSL certificates..."
for domain in "${DOMAINS[@]}"; do
    echo "  Processing $domain..."
    
    certbot certonly --standalone \
        --non-interactive \
        --agree-tos \
        --email "$EMAIL" \
        --domains "$domain" \
        --http-01-port 80 \
        --keep-until-expiring
    
    if [ $? -eq 0 ]; then
        echo "  ✅ Certificate for $domain created"
    else
        echo "  ⚠️  Certificate for $domain may already exist or failed"
    fi
done

# Restart nginx
echo "▶️  Starting Nginx..."
systemctl start nginx

# Setup auto-renewal
echo "🔄 Setting up auto-renewal..."
echo "0 0 * * * root certbot renew --quiet" >> /etc/cron.d/certbot

echo ""
echo "✅ SSL setup complete!"
echo ""
echo "Certificate locations:"
for domain in "${DOMAINS[@]}"; do
    echo "  /etc/letsencrypt/live/$domain/"
done
