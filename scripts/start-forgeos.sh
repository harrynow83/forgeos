#!/bin/bash

# ForgeOS Kiosk Mode Startup Script
# Turns Raspberry Pi into dedicated 3D printer appliance

echo "Starting ForgeOS in Kiosk Mode..."

# Hide mouse cursor after startup
unclutter -idle 0 &

# Wait for network to be ready
sleep 5

# Start backend server
echo "Starting backend server..."
cd /home/pi/forgOS
node backend/server.js &

# Start frontend (production mode)
echo "Starting frontend..."
pnpm start &

# Wait for servers to fully start
sleep 5

# Launch Chromium in kiosk mode (fullscreen, no browser UI)
echo "Launching Chromium in kiosk mode..."
chromium-browser \
  --kiosk \
  --noerrdialogs \
  --disable-infobars \
  --disable-session-crashed-bubble \
  --incognito \
  --disable-features=TranslateUI,BlinkGenPropertyTrees \
  --disable-background-networking \
  --disable-background-timer-throttling \
  --disable-background-mode-automotive \
  --disable-renderer-backgrounding \
  --disable-extensions \
  --disable-sync \
  --disable-default-apps \
  --no-first-run \
  --disable-restore-session-state \
  --disable-component-extensions-with-background-pages \
  http://localhost:3000

echo "ForgeOS Kiosk Mode started successfully!"
