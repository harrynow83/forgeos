#!/bin/bash
set -e

# ForgeOS Installation Stage
# Installs ForgeOS application and configures kiosk mode

echo "🔧 Installing ForgeOS..."

# Install system dependencies
apt-get update
apt-get install -y nodejs npm git chromium-browser unclutter xdotool

# Install X server and window manager for kiosk mode
apt-get install -y --no-install-recommends xserver-xorg xinit openbox

# Install global package manager
npm install -g pnpm

# Clone ForgeOS repository
cd /home/pi
git clone https://github.com/YOUR_REPO/forgOS.git

cd forgOS

# Install dependencies and build
pnpm install
pnpm build

# Create ForgeOS startup script
cat << 'EOF' > /home/pi/start-forgeos.sh
#!/bin/bash

# ForgeOS Kiosk Mode Startup
echo "Starting ForgeOS..."

# Hide mouse cursor
unclutter -idle 0 &

# Wait for network and services
sleep 5

# Start backend server
cd /home/pi/forgOS
node backend/server.js &

# Start frontend in production mode
pnpm start &

# Wait for servers to start
sleep 5

# Launch Chromium in kiosk mode
chromium-browser \
    --kiosk \
    --noerrdialogs \
    --disable-infobars \
    --disable-session-crashed-bubble \
    --incognito \
    --disable-features=TranslateUI,BlinkGenPropertyTrees \
    --disable-background-networking \
    --disable-default-apps \
    --no-first-run \
    http://localhost:3000

EOF

# Make startup script executable
chmod +x /home/pi/start-forgeos.sh

# Configure auto-start for pi user
mkdir -p /home/pi/.config/lxsession/LXDE-pi

# Add ForgeOS to autostart
echo "@/home/pi/start-forgeos.sh" >> /home/pi/.config/lxsession/LXDE-pi/autostart

# Disable screen blanking
echo "@xset s off" >> /home/pi/.config/lxsession/LXDE-pi/autostart
echo "@xset -dpms" >> /home/pi/.config/lxsession/LXDE-pi/autostart
echo "@xset s noblank" >> /home/pi/.config/lxsession/LXDE-pi/autostart

# Set proper ownership
chown -R pi:pi /home/pi

echo "✅ ForgeOS installation complete!"
