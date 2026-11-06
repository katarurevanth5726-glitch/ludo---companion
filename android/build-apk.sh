#!/usr/bin/env bash
# Quick build script to compile the debug APK
set -e

echo "=========================================="
echo " Building Ludo Companion Debug APK        "
echo "=========================================="

# Check if gradlew is present
if [ -f "./gradlew" ]; then
    chmod +x ./gradlew
    ./gradlew assembleDebug --stacktrace
else
    gradle assembleDebug --stacktrace
fi

echo ""
echo "=========================================="
echo " BUILD SUCCESSFUL!                        "
echo " APK location: app/build/outputs/apk/debug/app-debug.apk"
echo "=========================================="
