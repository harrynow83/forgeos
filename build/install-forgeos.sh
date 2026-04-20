#!/bin/bash

# ForgeOS Automated Installation Script
# One-command setup for production deployment

set -e

# Configuration
FORGEOS_REPO="https://github.com/YOUR_REPO/forgOS.git"
FORGEOS_DIR="/home/pi/forgOS"
SERVICE_USER="pi"

echo "🚀 ForgeOS Automated Installation"
echo "================================"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ This script must be run as root"
    echo "Use: sudo $0"
    exit 1
fi

# Step 1: System update
echo "📦 Updating system packages..."
apt update
apt upgrade -y

# Step 2: Install dependencies
echo "📦 Installing dependencies..."
apt install -y git curl wget gnupg2 unclutter xdotool

# Step 3: Install Node.js and package manager
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

echo "📦 Installing pnpm..."
npm install -g pnpm

# Step 4: Clone ForgeOS repository
echo "📋 Cloning ForgeOS repository..."
cd /home/pi
git clone $FORGEOS_REPO
cd forgOS

# Step 5: Install dependencies and build
echo "🔨 Building ForgeOS..."
pnpm install
pnpm build

# Step 6: Setup startup script
echo "⚙️ Configuring startup..."
cp /home/pi/forgOS/scripts/start-forgeos.sh /home/pi/start-forgeos.sh
chmod +x /home/pi/start-forgeos.sh

# Step 7: Setup systemd service
echo "🔧 Installing system service..."
cp /home/pi/forgOS/scripts/forgeos.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable forgeos

# Step 8: Configure boot options
echo "🚀 Optimizing boot configuration..."
if [ -f /boot/config.txt ]; then
    cp /boot/config.txt /boot/config.txt.bak
fi

cat >> /boot/config.txt << EOF
gpu_mem=128
disable_splash=1
hdmi_force_hotplug=1
EOF

# Step 9: Setup auto-login
echo "👤 Configuring auto-login..."
raspi-config nonint do_boot_change=1

# Step 10: Enable SSH
echo "🔐 Enabling SSH access..."
touch /boot/ssh

# Step 11: Configure default hotspot
echo "📶 Setting up default hotspot..."
nmcli dev wifi hotspot ssid ForgeOS_Setup password 12345678

# Step 12: Clean up
echo "🧹 Cleaning up..."
apt clean
rm -rf /tmp/*

# Step 13: Create first boot marker
echo "🏁 Setting up first boot..."
touch /home/pi/.first_boot

echo ""
echo "✅ ForgeOS Installation Complete!"
echo "================================"
echo "📍 Installation directory: $FORGEOS_DIR"
echo "🔧 System service: forgeos"
echo "🚀 Startup script: /home/pi/start-forgeos.sh"
echo "🌐 Default hotspot: ForgeOS_Setup (12345678)"
echo "🔐 SSH enabled: Yes"
echo ""
echo "🔄 Rebooting system in 5 seconds..."
echo "   After reboot, ForgeOS will start automatically"

sleep 5
reboot
