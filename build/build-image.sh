#!/bin/bash

# ForgeOS Custom OS Image Builder
# Creates flashable Raspberry Pi image with ForgeOS preinstalled

set -e

# Configuration
IMAGE_NAME="forgeos-rpi-lite.img"
IMAGE_SIZE="8G"
BASE_IMAGE="raspios_lite_arm64.img"
MOUNT_POINT="/mnt/forgeos"
FORGEOS_DIR="/home/pi/forgOS"

echo "🔧 Building ForgeOS Custom OS Image..."

# Check if base image exists
if [ ! -f "$BASE_IMAGE" ]; then
    echo "❌ Base image not found: $BASE_IMAGE"
    echo "Download Raspberry Pi OS Lite from: https://www.raspberrypi.org/software/operating-systems/"
    exit 1
fi

# Create working directory
mkdir -p build
cd build

# Step 1: Create base image
echo "📁 Creating base image..."
dd if=/dev/zero of=$IMAGE_NAME bs=1M count=$IMAGE_SIZE status=progress

# Step 2: Setup loop device and partitions
echo "⚙️ Setting up partitions..."
sudo losetup -Pf $IMAGE_NAME
sudo partprobe /dev/loop0

# Step 3: Format partitions
echo "🧹 Formatting partitions..."
sudo mkfs.vfat -F32 -n FORGEOS_BOOT /dev/loop0p1
sudo mkfs.ext4 -L FORGEOS_ROOT /dev/loop0p2

# Step 4: Mount partitions
echo "📂 Mounting partitions..."
sudo mkdir -p $MOUNT_POINT
sudo mount /dev/loop0p2 $MOUNT_POINT

# Step 5: Extract base OS
echo "📦 Extracting base OS..."
sudo unsquashfs -f -d $MOUNT_POINT /opt/raspberrypi-os/images/raspios_lite_arm64/rootfs

# Step 6: Setup chroot environment
echo "🔒 Setting up chroot..."
sudo mount /dev/loop0p1 $MOUNT_POINT/boot
sudo mount -t proc /proc $MOUNT_POINT/proc
sudo mount -t sysfs /sys $MOUNT_POINT/sys
sudo mount -t devtmpfs /dev $MOUNT_POINT/dev
sudo mount -t devpts /dev/pts $MOUNT_POINT/dev/pts

# Step 7: Copy ForgeOS files
echo "📋 Installing ForgeOS..."
sudo cp -r $FORGEOS_DIR $MOUNT_POINT/home/pi/

# Step 8: Install dependencies in chroot
echo "📦 Installing packages..."
sudo chroot $MOUNT_POINT /bin/bash -c "
    apt update
    apt install -y nodejs npm git chromium-browser unclutter
    npm install -g pnpm
"

# Step 9: Setup auto-start services
echo "⚙️ Configuring services..."
sudo chroot $MOUNT_POINT /bin/bash -c "
    # Enable SSH
    touch /boot/ssh
    
    # Setup systemd service
    cp /home/pi/forgOS/scripts/forgeos.service /etc/systemd/system/
    systemctl enable forgeos
    
    # Configure auto-login
    raspi-config nonint do_boot_change=1
    
    # Setup boot optimizations
    echo 'gpu_mem=128' >> /boot/config.txt
    echo 'disable_splash=1' >> /boot/config.txt
    echo 'hdmi_force_hotplug=1' >> /boot/config.txt
    
    # Enable hotspot by default
    nmcli dev wifi hotspot ssid ForgeOS_Setup password 12345678
"

# Step 10: Cleanup and unmount
echo "🧹 Cleaning up..."
sudo chroot $MOUNT_POINT /bin/bash -c "apt clean"
sudo umount $MOUNT_POINT/dev/pts
sudo umount $MOUNT_POINT/dev
sudo umount $MOUNT_POINT/proc
sudo umount $MOUNT_POINT/sys
sudo umount $MOUNT_POINT/boot
sudo umount $MOUNT_POINT

# Step 11: Detach loop device
echo "🔓 Finalizing image..."
sudo losetup -d /dev/loop0

# Step 12: Compress final image
echo "🗜️ Compressing image..."
gzip -c $IMAGE_NAME

echo "✅ ForgeOS image build complete!"
echo "📍 Location: build/${IMAGE_NAME}.gz"
echo "💾 Size: $(ls -lh build/${IMAGE_NAME}.gz | awk '{print $5}')"
echo ""
echo "Flash with: balenaEtcher or Raspberry Pi Imager"
