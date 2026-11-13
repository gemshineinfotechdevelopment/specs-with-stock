#!/usr/bin/env bash
# ==============================================================================
# Automated Deployment Script for Specs Stock Management
# Subdomain: specs-stock.gemshine.tech | Port: 5028
# ==============================================================================

set -e

echo "🚀 Starting Deployment for specs-stock.gemshine.tech on Port 5028..."

# 1. Always navigate to the correct project directory
PROJECT_DIR="/var/www/specs-with-stock"
if [ -d "$PROJECT_DIR" ]; then
    cd "$PROJECT_DIR"
else
    cd "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
fi

echo "📂 Current working directory: $(pwd)"

# 2. Pull latest code cleanly (discarding any local build artifacts or dirty files)
if [ -d ".git" ]; then
    echo "📦 Fetching latest changes from Git origin/main..."
    git fetch origin main
    echo "🔄 Hard resetting working tree to origin/main..."
    git reset --hard origin/main
    # Clean untracked files while preserving .env files
    git clean -fd -e .env -e .env.production -e server/.env.production -e server/.env -e logs
fi

# 3. Install dependencies
echo "📥 Installing NPM dependencies..."
npm install --production=false

# 4. Clean and rebuild frontend and backend
echo "🔨 Building frontend (dist) and backend (dist-server)..."
npm run build:all

# 5. Ensure logs folder exists
mkdir -p logs

# 6. Start or reload PM2
echo "🔄 Reloading PM2 process (specs-stock-server)..."
if pm2 describe specs-stock-server > /dev/null 2>&1; then
    pm2 restart ecosystem.config.cjs --env production
else
    pm2 start ecosystem.config.cjs --env production
fi

pm2 save

# 7. Reload Nginx to ensure new dist assets are served immediately
echo "🌐 Reloading Nginx..."
if command -v systemctl > /dev/null 2>&1; then
    sudo systemctl reload nginx || true
elif command -v nginx > /dev/null 2>&1; then
    sudo nginx -s reload || true
fi

echo "=========================================================="
echo "✅ Application deployed successfully and running on Port 5028!"
echo "🌐 Access via: https://specs-stock.gemshine.tech"
echo "=========================================================="
