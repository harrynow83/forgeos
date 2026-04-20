#!/bin/bash

# ForgeOS OTA Update Script
# This script pulls the latest changes and rebuilds the system

set -e

echo "=== ForgeOS OTA Update Started ==="

# Navigate to the project root (assuming script is in backend directory)
cd "$(dirname "$0")/.."

echo "Step 1: Stashing local changes..."
git stash || true

echo "Step 2: Pulling latest changes from main..."
git pull origin main || { echo "Git pull failed"; exit 1; }

echo "Step 3: Installing dependencies..."
npm install || { echo "Frontend npm install failed"; exit 1; }

echo "Step 4: Building frontend..."
npm run build || { echo "Frontend build failed"; exit 1; }

echo "Step 5: Installing backend dependencies..."
cd backend
npm install || { echo "Backend npm install failed"; exit 1; }
cd ..

echo "=== ForgeOS OTA Update Completed Successfully ==="
exit 0
