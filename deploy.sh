#!/usr/bin/env bash
# ==============================================================================
# Automated Deployment Script for Specs Stock Management
# Subdomain: specs-stock.gemshine.tech | Port: 5028
# ==============================================================================

set -e

echo "🚀 Starting Deployment for specs-stock.gemshine.tech on Port 5028..."

# 1. Pull latest code (if using git)
if [ -d ".git" ]; then
    echo "📦 Pulling latest changes from Git..."
    git pull origin main || true
fi

# 2. Install dependencies
echo "📥 Installing NPM dependencies..."
npm install --production=false

# 3. Build frontend and backend bundles
echo "🔨 Building frontend (dist) and backend (dist-server)..."
npm run build:all

# 4. Ensure logs folder exists
mkdir -p logs

# 5. Start or reload PM2
echo "🔄 Reloading PM2 process (specs-stock-server)..."
if pm2 describe specs-stock-server > /dev/null 2>&1; then
    pm2 restart ecosystem.config.cjs --env production
else
    pm2 start ecosystem.config.cjs --env production
fi

pm2 save

echo "✅ Application deployed successfully and running on Port 5028!"
echo "🌐 Access via: https://specs-stock.gemshine.tech"
