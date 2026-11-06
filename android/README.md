# Ludo Companion – Android Floating Overlay (Native Kotlin)

A private, offline floating gaming companion and dice simulator for Android. It runs as a foreground service using Android's `WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY`, rendering an interactive dark premium gaming HUD over any screen.

---

## 🌟 Key Features

1. **System Floating Overlay (`SYSTEM_ALERT_WINDOW`)**:
   - Draggable across the entire screen using high-precision touch delta handling.
   - Expand and minimize states (collapses into an ergonomic floating status pill).
   - Premium dark gaming aesthetic with golden accents and tactile feedback.

2. **Tactile Dice Selector (1–6)**:
   - Six interactive buttons numbered 1 to 6.
   - Visual highlighting of selected values.
   - Player roll simulator with haptic response.
   - Separate Opponent Random Simulator with independent RNG.

3. **Simulation Analytics & History**:
   - Roll history tracker with timestamps and source tags (Player vs Opponent).
   - Frequency distribution and roll statistics (total rolls, 6s count & percentage).
   - 1-click history reset.

4. **Android 15 Compatibility & Architecture**:
   - Written in 100% modern Kotlin with Gradle Kotlin DSL (`build.gradle.kts`).
   - Uses `FOREGROUND_SERVICE` and Android 14/15 `FOREGROUND_SERVICE_SPECIAL_USE` with subtype declaration.
   - Proper `POST_NOTIFICATIONS` runtime permission handling for Android 13+.
   - Target SDK 35 (Android 15), Compile SDK 35, Min SDK 26 (Android 8.0 Oreo).
   - **No Root Required**.

5. **Privacy & Integrity**:
   - 100% local operation.
   - Zero internet requests, zero analytics, zero credential collection.
   - Completely independent simulation companion; does NOT modify or intercept network traffic or memories of other apps.

---

## 🛠️ How to Build and Run in Android Studio

### Prerequisites
- **Android Studio** Ladybug (2024.2+) or newer.
- **JDK 17** (bundled with Android Studio).
- **Android SDK** API 35 (Android 15) installed via SDK Manager.

### Option A: Build via Android Studio GUI
1. Open Android Studio.
2. Select **File > Open...** and navigate to this `android` folder.
3. Wait for Gradle Sync to complete.
4. Connect an Android device (or launch an Android 15 emulator with Google APIs).
5. Click **Run > Run 'app'** (or press Shift + F10).

### Option B: Build via Command Line (Gradle)
```bash
# Navigate to the android folder
cd android

# Build debug APK
./gradlew assembleDebug

# The compiled debug APK will be generated at:
# app/build/outputs/apk/debug/app-debug.apk
```

### Install onto Device via ADB:
```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

### Granting Overlay Permission:
On the device, open **Ludo Companion** and tap **"Grant Overlay Permission"**, then toggle **"Allow display over other apps"**.

Or grant instantly via ADB:
```bash
adb shell appops set com.ludocompanion.overlay SYSTEM_ALERT_WINDOW allow
adb shell pm grant com.ludocompanion.overlay android.permission.POST_NOTIFICATIONS
```

Then tap **"Launch Floating Overlay"** in the app to activate the companion!

---

## 📁 Source Code Architecture

- `android/app/src/main/AndroidManifest.xml` — System overlay permission and Foreground Service declarations.
- `android/app/src/main/java/com/ludocompanion/overlay/FloatingOverlayService.kt` — Core WindowManager floating service, touch drag physics, view inflation, and roll simulation logic.
- `android/app/src/main/java/com/ludocompanion/overlay/MainActivity.kt` — Permission onboarding and service control UI.
- `android/app/src/main/java/com/ludocompanion/overlay/model/` — Data classes (`DiceRoll`, `DiceStatistics`, `RollSource`).
- `android/app/src/main/res/layout/` — XML layouts for collapsed pill and expanded gaming HUD.
