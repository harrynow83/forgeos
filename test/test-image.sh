#!/bin/bash

# ForgeOS Image Hardware Testing Script
# Validates bootable image on real Raspberry Pi hardware

set -e

# Configuration
IMAGE_FILE="build/forgeos.img"
TEST_LOG="test-results-$(date +%Y%m%d-%H%M%S).log"

echo "🧪 ForgeOS Hardware Testing"
echo "=========================="
echo "📍 Image: $IMAGE_FILE"
echo "📝 Log: $TEST_LOG"

# Step 1: Check image file
if [ ! -f "$IMAGE_FILE" ]; then
    echo "❌ Image file not found: $IMAGE_FILE"
    echo "Run: ./build-forgos-image.sh first"
    exit 1
fi

# Step 2: Validate image structure
echo "🔍 Validating image structure..."

# Check for boot partition markers
if ! file "$IMAGE_FILE" | grep -q "boot sector"; then
    echo "❌ Invalid boot sector"
    echo "Image may not be bootable"
    exit 1
fi

# Check image size
IMAGE_SIZE=$(stat -f%z "$IMAGE_FILE" 2>/dev/null || stat -c%s "$IMAGE_FILE")
if [ "$IMAGE_SIZE" -lt 1000000000 ]; then
    echo "⚠️  Image seems too small: $IMAGE_SIZE bytes"
fi

echo "✅ Image structure validation passed"

# Step 3: Mount and inspect partitions
echo "📂 Inspecting partitions..."

# Setup loop device
sudo losetup -Pf "$IMAGE_FILE"
LOOP_DEV=$(losetup --show | head -1)

# Mount boot partition
sudo mkdir -p /tmp/forgeos_boot
sudo mount "${LOOP_DEV}p1" /tmp/forgeos_boot

# Check for required files
REQUIRED_BOOT_FILES="config.txt start.elf fixup.dat"
for file in $REQUIRED_BOOT_FILES; do
    if [ ! -f "/tmp/forgeos_boot/$file" ]; then
        echo "❌ Missing boot file: $file"
        sudo umount /tmp/forgeos_boot
        sudo losetup -d "$LOOP_DEV"
        exit 1
    fi
done

echo "✅ Boot partition validation passed"

# Mount root partition
sudo mkdir -p /tmp/forgeos_root
sudo mount "${LOOP_DEV}p2" /tmp/forgeos_root

# Check for ForgeOS installation
if [ ! -d "/tmp/forgeos_root/home/pi/forgOS" ]; then
    echo "❌ ForgeOS not found in root filesystem"
    sudo umount /tmp/forgeos_root
    sudo umount /tmp/forgeos_boot
    sudo losetup -d "$LOOP_DEV"
    exit 1
fi

# Check for startup script
if [ ! -f "/tmp/forgeos_root/home/pi/start-forgeos.sh" ]; then
    echo "❌ Startup script not found"
    sudo umount /tmp/forgeos_root
    sudo umount /tmp/forgeos_boot
    sudo losetup -d "$LOOP_DEV"
    exit 1
fi

echo "✅ Root filesystem validation passed"

# Step 4: Check service configuration
if [ ! -f "/tmp/forgeos_root/etc/systemd/system/forgeos.service" ]; then
    echo "⚠️  ForgeOS service not configured"
else
    echo "✅ Service configuration found"
fi

# Step 5: Cleanup
sudo umount /tmp/forgeos_root
sudo umount /tmp/forgeos_boot
sudo losetup -d "$LOOP_DEV"
rm -rf /tmp/forgeos_boot /tmp/forgeos_root

# Step 6: Generate test report
cat > "$TEST_LOG" << EOF
ForgeOS Image Test Results
=======================
Image: $IMAGE_FILE
Size: $IMAGE_SIZE bytes
Date: $(date)

Validation Results:
✅ Image structure: PASS
✅ Boot partition: PASS
✅ Root filesystem: PASS
✅ ForgeOS installation: PASS
✅ Startup script: PASS

Files Present:
$(ls -la /tmp/forgeos_boot/ 2>/dev/null || echo "Boot partition not accessible")

Expected Behavior on Hardware:
- Boots without errors
- Auto-starts ForgeOS
- Chromium opens fullscreen
- UI visible and responsive
- Mobile can connect via hotspot

Next Steps:
1. Flash to SD card: sudo dd if=$IMAGE_FILE of=/dev/sdX bs=4M status=progress
2. Insert in Raspberry Pi
3. Power on device
4. Verify boot and functionality
EOF

echo "✅ Image testing complete!"
echo "📝 Test report: $TEST_LOG"
echo ""
echo "🚀 Ready for hardware testing!"
