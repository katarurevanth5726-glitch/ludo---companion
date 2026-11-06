#!/usr/bin/env bash
set -e

echo "=== 1. Setting up Android SDK ==="
export ANDROID_HOME=/opt/android-sdk
mkdir -p "$ANDROID_HOME/cmdline-tools"

if [ ! -d "$ANDROID_HOME/cmdline-tools/latest" ]; then
    echo "Downloading Android Command-Line Tools..."
    curl -sSL "https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip" -o /tmp/cmdline-tools.zip
    mkdir -p /tmp/cmdline-tools-extracted
    unzip -q /tmp/cmdline-tools.zip -d /tmp/cmdline-tools-extracted
    mv /tmp/cmdline-tools-extracted/cmdline-tools "$ANDROID_HOME/cmdline-tools/latest"
    rm -rf /tmp/cmdline-tools.zip /tmp/cmdline-tools-extracted
fi

export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"

echo "Accepting SDK licenses..."
yes | sdkmanager --licenses > /dev/null 2>&1 || true

echo "Installing platforms;android-35 and build-tools;35.0.0..."
sdkmanager "platforms;android-35" "build-tools;35.0.0" "platform-tools" > /dev/null 2>&1

echo "=== 2. Setting up Gradle 8.10.2 ==="
if [ ! -d "/opt/gradle/gradle-8.10.2" ]; then
    echo "Downloading Gradle 8.10.2..."
    mkdir -p /opt/gradle
    curl -sSL "https://services.gradle.org/distributions/gradle-8.10.2-bin.zip" -o /tmp/gradle.zip
    unzip -q /tmp/gradle.zip -d /opt/gradle
    rm -f /tmp/gradle.zip
fi

export PATH="/opt/gradle/gradle-8.10.2/bin:$PATH"

echo "Gradle version:"
gradle --version

echo "=== 3. Building Android Project ==="
cd /app/applet/android
echo "sdk.dir=/opt/android-sdk" > local.properties

echo "Running gradle assembleDebug..."
gradle assembleDebug --no-daemon --stacktrace

echo "=== 4. Copying APK for Download ==="
mkdir -p /app/applet/public
if [ -f "/app/applet/android/app/build/outputs/apk/debug/app-debug.apk" ]; then
    cp "/app/applet/android/app/build/outputs/apk/debug/app-debug.apk" "/app/applet/public/LudoCompanion-debug.apk"
    cp "/app/applet/android/app/build/outputs/apk/debug/app-debug.apk" "/app/applet/android/LudoCompanion-debug.apk"
    echo "SUCCESS: APK successfully built and placed at /app/applet/public/LudoCompanion-debug.apk"
    ls -lh /app/applet/public/LudoCompanion-debug.apk
else
    echo "ERROR: APK output not found"
    exit 1
fi
