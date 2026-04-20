#!/bin/bash

# ForgeOS OTA Update System
# Secure over-the-air firmware updates for production devices

set -e

# Configuration
UPDATE_SERVER="https://updates.forgos.com"
VERSION_FILE="/etc/forgos-version"
SIGNATURE_KEY="/etc/forgos.pub"
TEMP_DIR="/tmp/forgos-update"
CURRENT_VERSION=$(cat $VERSION_FILE 2>/dev/null || echo "1.0.0")

echo "🔄 ForgeOS OTA Update System"
echo "Current version: $CURRENT_VERSION"

# Step 1: Check for updates
echo "📡 Checking for updates..."
curl -s "$UPDATE_SERVER/version.json" | jq -r '.latest' > $TEMP_DIR/latest-version

LATEST_VERSION=$(cat $TEMP_DIR/latest-version)

if [ "$LATEST_VERSION" = "$CURRENT_VERSION" ]; then
    echo "✅ ForgeOS is up to date (v$CURRENT_VERSION)"
    rm -rf $TEMP_DIR
    exit 0
fi

echo "🆕 Update available: v$LATEST_VERSION"

# Step 2: Download update
echo "📥 Downloading update package..."
curl -s "$UPDATE_SERVER/forgeos-$LATEST_VERSION.tar.gz" -o $TEMP_DIR/update.tar.gz

# Step 3: Verify signature
echo "🔐 Verifying update signature..."
curl -s "$UPDATE_SERVER/forgeos-$LATEST_VERSION.tar.gz.sig" -o $TEMP_DIR/update.tar.gz.sig

# Verify with GPG (if key available)
if command -v gpg >/dev/null 2>&1; then
    if ! gpg --verify --keyring $SIGNATURE_KEY $TEMP_DIR/update.tar.gz.sig $TEMP_DIR/update.tar.gz; then
        echo "❌ Signature verification failed"
        rm -rf $TEMP_DIR
        exit 1
    fi
else
    echo "⚠️  GPG not available, skipping signature verification"
fi

# Step 4: Extract update
echo "📦 Extracting update..."
cd $TEMP_DIR
tar -xzf update.tar.gz

# Step 5: Create backup
echo "💾 Creating system backup..."
BACKUP_DIR="/backup/forgos-$(date +%Y%m%d-%H%M%S)"
mkdir -p /backup
cp -r /home/pi/forgOS $BACKUP_DIR

# Step 6: Apply update
echo "🔄 Applying update..."
cd forgeos-update

# Update application files
cp -r * /home/pi/forgOS/
chown -R pi:pi /home/pi/forgOS

# Update systemd service if changed
if [ -f "forgeos.service" ]; then
    cp forgeos.service /etc/systemd/system/
    systemctl daemon-reload
fi

# Update configuration
if [ -f "config.txt" ]; then
    cat config.txt >> /boot/config.txt
fi

# Step 7: Update version
echo "$LATEST_VERSION" > $VERSION_FILE

# Step 8: Cleanup
echo "🧹 Cleaning up..."
cd /
rm -rf $TEMP_DIR

# Step 9: Restart services
echo "🔄 Restarting ForgeOS..."
systemctl restart forgeos

echo "✅ Update completed successfully!"
echo "📍 Current version: $LATEST_VERSION"
echo "💾 Backup location: $BACKUP_DIR"
echo "🔄 System restarting..."
