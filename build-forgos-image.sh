#!/bin/bash

# ForgeOS Real Bootable Image Builder using pi-gen
# Creates production-ready Raspberry Pi firmware image

set -e

# Configuration
PI_GEN_DIR="pi-gen"
FORGEOS_DIR="forgeos"
BUILD_DIR="build"

echo "🔧 Building ForgeOS Bootable Image with pi-gen"
echo "=============================================="

# Step 1: Clone pi-gen if not exists
if [ ! -d "$PI_GEN_DIR" ]; then
    echo "📥 Cloning pi-gen repository..."
    git clone https://github.com/RPi-Distro/pi-gen.git
fi

cd $PI_GEN_DIR

# Step 2: Copy ForgeOS configuration
echo "⚙️ Setting up ForgeOS configuration..."
cp ../$FORGEOS_DIR/pi-gen/config ./config

# Step 3: Copy ForgeOS custom stage
echo "📋 Installing ForgeOS custom stage..."
mkdir -p stage2/04-forgeos
cp -r ../$FORGEOS_DIR/pi-gen/stage2/04-forgeos/* stage2/04-forgeos/

# Step 4: Build dependencies
echo "📦 Installing build dependencies..."
if [ -f "Dockerfile" ]; then
    echo "🐳 Using Docker build..."
    docker build -t pi-gen .
    docker run --privileged -v $(pwd):/pi-gen pi-gen ./build.sh
else
    echo "🔨 Native build..."
    ./build.sh
fi

# Step 5: Check if image was created
if [ -f "deploy/forgeos.img" ]; then
    echo "✅ Build successful!"
    echo "📍 Image location: $(pwd)/deploy/forgeos.img"
    echo "📊 Image size: $(ls -lh deploy/forgeos.img | awk '{print $5}')"
    
    # Copy to build directory
    mkdir -p ../$BUILD_DIR
    cp deploy/forgeos.img ../$BUILD_DIR/
    
    echo "📦 Image copied to: ../$BUILD_DIR/forgeos.img"
else
    echo "❌ Build failed!"
    echo "Check pi-gen logs for errors"
    exit 1
fi

# Step 6: Generate checksum
echo "🔐 Generating checksum..."
cd ../$BUILD_DIR
sha256sum forgeos.img > forgeos.img.sha256

echo "✅ ForgeOS image build complete!"
echo "================================"
echo "📍 Final image: $BUILD_DIR/forgeos.img"
echo "🔐 Checksum: $BUILD_DIR/forgeos.img.sha256"
echo ""
echo "📱 Flash with:"
echo "   sudo dd if=forgeos.img of=/dev/sdX bs=4M status=progress"
echo "   or use Raspberry Pi Imager"
