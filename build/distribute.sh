#!/bin/bash

# ForgeOS Image Distribution and Flashing Tools
# Prepares images for distribution and provides flashing utilities

set -e

# Configuration
BUILD_DIR="build"
DIST_DIR="dist"
VERSION=$(date +%Y%m%d-%H%M)

echo "📦 ForgeOS Distribution Tools"
echo "============================="

# Create distribution directory
mkdir -p $DIST_DIR

# Step 1: Package current image
echo "📦 Packaging image..."
if [ -f "$BUILD_DIR/forgeos-rpi-lite.img.gz" ]; then
    cp $BUILD_DIR/forgeos-rpi-lite.img.gz $DIST_DIR/forgeos-$VERSION.img.gz
    echo "✅ Image packaged: forgeos-$VERSION.img.gz"
else
    echo "❌ Built image not found"
    echo "Run: ./build-image.sh first"
    exit 1
fi

# Step 2: Generate checksum
echo "🔐 Generating checksum..."
cd $DIST_DIR
sha256sum forgeos-$VERSION.img.gz > forgeos-$VERSION.sha256
echo "✅ Checksum: forgeos-$VERSION.sha256"

# Step 3: Create flashing script
echo "📋 Creating flash script..."
cat > $DIST_DIR/flash-forgeos.sh << 'EOF'
#!/bin/bash
# ForgeOS Flashing Script for Version $VERSION

set -e
IMAGE_FILE="forgeos-$VERSION.img.gz"

echo "🚀 ForgeOS Flashing Utility v$VERSION"
echo "=================================="

# Check if image exists
if [ ! -f "$IMAGE_FILE" ]; then
    echo "❌ Image file not found: $IMAGE_FILE"
    exit 1
fi

# Detect SD card
echo "📱 Detecting SD cards..."
lsblk | grep -E "mmcblk[0-9]" | while read -r disk; do
    if [ -b "/dev/$disk" ]; then
        echo "Found SD card: /dev/$disk"
        SD_CARD="/dev/$disk"
        break
    fi
done

if [ -z "$SD_CARD" ]; then
    echo "❌ No SD card found"
    echo "Insert SD card and try again"
    exit 1
fi

# Confirm flash
echo "⚠️  WARNING: This will erase all data on $SD_CARD"
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Flashing cancelled"
    exit 1
fi

# Flash image
echo "📥 Flashing ForgeOS to $SD_CARD..."
sudo umount $SD_CARD* 2>/dev/null
sudo dd if=$IMAGE_FILE of=$SD_CARD bs=4M status=progress conv=fsync

# Verify flash
echo "🔍 Verifying flash..."
sync

echo "✅ ForgeOS flashed successfully!"
echo "📍 SD card ready for use"
echo "🔄 Remove and reinsert SD card into device"
EOF

chmod +x $DIST_DIR/flash-forgeos.sh

# Step 4: Create README
echo "📖 Creating documentation..."
cat > $DIST_DIR/README.md << 'EOF'
# ForgeOS v$VERSION

## Quick Start
1. Insert SD card into computer
2. Run: sudo ./flash-forgeos.sh
3. Follow prompts to flash image
4. Insert SD card into Raspberry Pi
5. Power on device

## Files
- \`forgeos-$VERSION.img.gz\` - Main OS image
- \`forgeos-$VERSION.sha256\` - Checksum verification
- \`flash-forgeos.sh\` - Automated flashing script

## Features
- Instant boot to ForgeOS interface
- Kiosk mode (fullscreen, no browser UI)
- Auto-restart on crashes
- Production-ready 3D printer appliance

## Requirements
- Raspberry Pi (3B+ recommended)
- 8GB+ SD card
- Computer for initial flashing

## Support
For issues and updates: https://github.com/YOUR_REPO/forgOS
EOF

echo "✅ Distribution package created!"
echo "📍 Location: $DIST_DIR/"
echo "📦 Image: forgeos-$VERSION.img.gz"
echo "📋 Flash script: flash-forgeos.sh"
echo "📖 Documentation: README.md"
echo "🔐 Checksum: forgeos-$VERSION.sha256"
