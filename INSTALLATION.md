# ForgeOS Kiosk Mode Installation

## Overview
Transforms Raspberry Pi into dedicated 3D printer appliance with instant boot, fullscreen UI, and auto-restart.

## Prerequisites
```bash
# Update system packages
sudo apt update

# Install required packages
sudo apt install -y chromium-browser unclutter xdotool
```

## Installation Steps

### 1. Copy Files
```bash
# Copy ForgeOS to home directory
sudo cp -r /path/to/forgOS /home/pi/

# Set ownership
sudo chown -R pi:pi /home/pi/forgOS
```

### 2. Make Startup Script Executable
```bash
chmod +x /home/pi/forgOS/scripts/start-forgeos.sh
```

### 3. Configure Auto-Login
```bash
# Open Raspberry Pi configuration
sudo raspi-config

# Navigate to:
System Options → Boot/Auto Login
→ Enable: Desktop Autologin → Desktop CLI Autologin
→ Set user: pi
```

### 4. Install System Service
```bash
# Copy service file
sudo cp /home/pi/forgOS/scripts/forgeos.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable service
sudo systemctl enable forgeos

# Start service
sudo systemctl start forgeos
```

### 5. Optimize Boot Configuration
```bash
# Backup original config
sudo cp /boot/config.txt /boot/config.txt.bak

# Add optimizations
sudo cat /home/pi/forgOS/scripts/config.txt >> /boot/config.txt
```

### 6. Optional - Disable Screen Sleep
```bash
# Edit LXDE autostart
sudo nano /etc/xdg/lxsession/LXDE-pi/autostart

# Add these lines:
@xset s off
@xset -dpms
@xset s noblank
```

## Configuration Files

### Startup Script: `/home/pi/forgOS/scripts/start-forgeos.sh`
- Hides mouse cursor
- Starts backend server
- Starts frontend in production mode
- Launches Chromium in kiosk mode
- Optimized for Raspberry Pi performance

### System Service: `/etc/systemd/system/forgeos.service`
- Auto-starts ForgeOS on boot
- Auto-restarts if crashes
- Runs as pi user
- 10-second restart delay

### Boot Config: `/boot/config.txt`
- 128MB GPU memory allocation
- Disabled splash screen
- HDMI force hotplug
- SD card performance optimizations

## Usage

### Manual Start
```bash
/home/pi/forgOS/scripts/start-forgeos.sh
```

### Service Management
```bash
# Check status
sudo systemctl status forgeos

# Restart service
sudo systemctl restart forgeos

# View logs
sudo journalctl -u forgeos -f
```

## Features

✅ **Instant Boot**: No desktop, direct to UI
✅ **Fullscreen**: Chromium kiosk mode
✅ **Auto-Restart**: Service monitors and recovers
✅ **Touch Ready**: No mouse cursor, optimized for touch
✅ **Production**: Hardware-optimized configuration
✅ **No Browser UI**: Clean appliance experience

## Result
ForgeOS becomes a true hardware appliance - power on → instant 3D printer control interface.
