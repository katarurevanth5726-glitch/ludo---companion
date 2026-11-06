export interface AndroidFile {
  path: string;
  name: string;
  language: 'kotlin' | 'xml' | 'groovy' | 'markdown' | 'properties' | 'toml' | 'bash' | 'yaml';
  content: string;
}

export const ANDROID_FILES: AndroidFile[] = [
  {
    path: 'android/app/src/main/AndroidManifest.xml',
    name: 'AndroidManifest.xml',
    language: 'xml',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

    <!-- Permission to draw floating overlay over other applications -->
    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />

    <!-- Foreground Service permissions for Android 14/15+ -->
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_SPECIAL_USE" />

    <!-- Post notifications permission for Android 13+ (API 33+) -->
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <!-- Tactile haptic feedback when dice is simulated -->
    <uses-permission android:name="android.permission.VIBRATE" />

    <application
        android:allowBackup="true"
        android:dataExtractionRules="@xml/data_extraction_rules"
        android:fullBackupContent="@xml/backup_rules"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.LudoCompanion">

        <!-- Main Onboarding & Settings Activity -->
        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- Floating Overlay Foreground Service (Compatible with Android 14 & 15) -->
        <service
            android:name=".FloatingOverlayService"
            android:enabled="true"
            android:exported="false"
            android:foregroundServiceType="specialUse">
            <property
                android:name="android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE"
                android:value="Overlay HUD for independent dice roll simulation and statistical analysis" />
        </service>

    </application>

</manifest>`
  },
  {
    path: 'android/app/src/main/java/com/ludocompanion/overlay/FloatingOverlayService.kt',
    name: 'FloatingOverlayService.kt',
    language: 'kotlin',
    content: `package com.ludocompanion.overlay

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.graphics.PixelFormat
import android.os.Build
import android.os.IBinder
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.view.Gravity
import android.view.LayoutInflater
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.ImageButton
import android.widget.TextView
import androidx.core.app.NotificationCompat
import com.ludocompanion.overlay.model.DiceRoll
import com.ludocompanion.overlay.model.DiceStatistics
import com.ludocompanion.overlay.model.RollSource
import kotlin.random.Random

class FloatingOverlayService : Service() {

    private lateinit var windowManager: WindowManager
    private var overlayView: View? = null
    private lateinit var layoutParams: WindowManager.LayoutParams

    // State
    private var isExpanded: Boolean = true
    private var selectedPlayerDice: Int = 6
    private val rollHistory = mutableListOf<DiceRoll>()

    // UI references in overlay
    private var collapsedLayout: View? = null
    private var expandedLayout: View? = null
    private var tvCurrentRollBadge: TextView? = null
    private var tvSelectedRollDisplay: TextView? = null
    private var tvTotalRolls: TextView? = null
    private var tvSixRate: TextView? = null
    private var tvLastRollInfo: TextView? = null
    private val diceButtons = mutableMapOf<Int, Button>()

    companion object {
        const val CHANNEL_ID = "ludo_overlay_channel"
        const val NOTIFICATION_ID = 1001
        const val ACTION_STOP_SERVICE = "com.ludocompanion.STOP_OVERLAY"

        fun start(context: Context) {
            val intent = Intent(context, FloatingOverlayService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stop(context: Context) {
            val intent = Intent(context, FloatingOverlayService::class.java)
            context.stopService(intent)
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
        startForegroundServiceNotification()
        setupFloatingWindow()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP_SERVICE) {
            stopSelf()
            return START_NOT_STICKY
        }
        return START_STICKY
    }

    private fun startForegroundServiceNotification() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Ludo Companion Overlay",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Keeps the floating companion overlay active during gameplay."
                setShowBadge(false)
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }

        val launchIntent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            launchIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val stopIntent = Intent(this, FloatingOverlayService::class.java).apply {
            action = ACTION_STOP_SERVICE
        }
        val stopPendingIntent = PendingIntent.getService(
            this,
            1,
            stopIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val notification: Notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Ludo Companion Active")
            .setContentText("Floating overlay is running over applications.")
            .setSmallIcon(android.R.drawable.ic_menu_compass)
            .setContentIntent(pendingIntent)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Close Overlay", stopPendingIntent)
            .setOngoing(true)
            .build()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            startForeground(
                NOTIFICATION_ID,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE
            )
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }
    }

    private fun setupFloatingWindow() {
        val inflater = LayoutInflater.from(this)
        overlayView = inflater.inflate(R.layout.layout_floating_overlay_expanded, null)

        layoutParams = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            else
                @Suppress("DEPRECATION")
                WindowManager.LayoutParams.TYPE_PHONE,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                    WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = 80
            y = 180
        }

        bindViews(overlayView!!)
        setupTouchDrag(overlayView!!)
        windowManager.addView(overlayView, layoutParams)
    }

    private fun bindViews(view: View) {
        collapsedLayout = view.findViewById(R.id.layoutCollapsed)
        expandedLayout = view.findViewById(R.id.layoutExpanded)
        tvCurrentRollBadge = view.findViewById(R.id.tvCurrentRollBadge)
        tvSelectedRollDisplay = view.findViewById(R.id.tvSelectedRollDisplay)
        tvTotalRolls = view.findViewById(R.id.tvTotalRolls)
        tvSixRate = view.findViewById(R.id.tvSixRate)
        tvLastRollInfo = view.findViewById(R.id.tvLastRollInfo)

        val btn1: Button = view.findViewById(R.id.btnDice1)
        val btn2: Button = view.findViewById(R.id.btnDice2)
        val btn3: Button = view.findViewById(R.id.btnDice3)
        val btn4: Button = view.findViewById(R.id.btnDice4)
        val btn5: Button = view.findViewById(R.id.btnDice5)
        val btn6: Button = view.findViewById(R.id.btnDice6)

        diceButtons[1] = btn1
        diceButtons[2] = btn2
        diceButtons[3] = btn3
        diceButtons[4] = btn4
        diceButtons[5] = btn5
        diceButtons[6] = btn6

        for (i in 1..6) {
            diceButtons[i]?.setOnClickListener {
                selectDiceNumber(i)
            }
        }
        updateDiceButtonStyles()

        val btnRollSelected: Button = view.findViewById(R.id.btnRollSelected)
        btnRollSelected.setOnClickListener {
            simulatePlayerRoll()
        }

        val btnSimulateOpponent: Button = view.findViewById(R.id.btnSimulateOpponent)
        btnSimulateOpponent.setOnClickListener {
            simulateOpponentRoll()
        }

        val btnResetStats: ImageButton = view.findViewById(R.id.btnResetStats)
        btnResetStats.setOnClickListener {
            resetSimulationHistory()
        }

        val btnMinimize: ImageButton = view.findViewById(R.id.btnMinimize)
        btnMinimize.setOnClickListener {
            toggleExpandedState(false)
        }

        collapsedLayout?.setOnClickListener {
            toggleExpandedState(true)
        }

        val btnClose: ImageButton = view.findViewById(R.id.btnCloseOverlay)
        btnClose.setOnClickListener {
            stopSelf()
        }

        updateStatsUI()
    }

    private fun selectDiceNumber(number: Int) {
        selectedPlayerDice = number
        triggerHaptic(30)
        updateDiceButtonStyles()
        tvSelectedRollDisplay?.text = "Ready: $number"
    }

    private fun updateDiceButtonStyles() {
        for (i in 1..6) {
            val btn = diceButtons[i] ?: continue
            if (i == selectedPlayerDice) {
                btn.setBackgroundResource(R.drawable.bg_dice_button_selected)
                btn.setTextColor(getColor(R.color.hud_accent_gold))
                btn.elevation = 8f
            } else {
                btn.setBackgroundResource(R.drawable.bg_dice_button)
                btn.setTextColor(getColor(R.color.hud_text_secondary))
                btn.elevation = 2f
            }
        }
    }

    private fun simulatePlayerRoll() {
        triggerHaptic(60)
        val roll = DiceRoll(
            value = selectedPlayerDice,
            source = RollSource.PLAYER_SELECTED
        )
        rollHistory.add(roll)
        tvSelectedRollDisplay?.text = "Rolled: \${roll.value}"
        tvCurrentRollBadge?.text = "\${roll.value}"
        updateStatsUI()
    }

    private fun simulateOpponentRoll() {
        triggerHaptic(40)
        val randomValue = Random.nextInt(1, 7)
        val roll = DiceRoll(
            value = randomValue,
            source = RollSource.OPPONENT_RANDOM
        )
        rollHistory.add(roll)
        tvSelectedRollDisplay?.text = "Opponent: \${roll.value}"
        tvCurrentRollBadge?.text = "\${roll.value}"
        updateStatsUI()
    }

    private fun resetSimulationHistory() {
        triggerHaptic(80)
        rollHistory.clear()
        tvSelectedRollDisplay?.text = "Ready: $selectedPlayerDice"
        tvCurrentRollBadge?.text = "$selectedPlayerDice"
        updateStatsUI()
    }

    private fun updateStatsUI() {
        val stats = DiceStatistics.compute(rollHistory)
        tvTotalRolls?.text = "Rolls: \${stats.totalRolls}"
        tvSixRate?.text = String.format("6s: %d (%.0f%%)", stats.sixCount, stats.sixPercentage)

        if (stats.lastRoll != null) {
            val sourceLabel = if (stats.lastRoll.source == RollSource.PLAYER_SELECTED) "Player" else "Opponent"
            tvLastRollInfo?.text = "Last: $sourceLabel rolled \${stats.lastRoll.value} at \${stats.lastRoll.formattedTime}"
        } else {
            tvLastRollInfo?.text = "No rolls recorded yet."
        }
    }

    private fun toggleExpandedState(expand: Boolean) {
        isExpanded = expand
        triggerHaptic(25)
        if (isExpanded) {
            collapsedLayout?.visibility = View.GONE
            expandedLayout?.visibility = View.VISIBLE
        } else {
            collapsedLayout?.visibility = View.VISIBLE
            expandedLayout?.visibility = View.GONE
        }
        windowManager.updateViewLayout(overlayView, layoutParams)
    }

    private fun setupTouchDrag(view: View) {
        val dragHandle: View = view.findViewById(R.id.dragHandleBar)
        var initialX = 0
        var initialY = 0
        var initialTouchX = 0f
        var initialTouchY = 0f

        val touchListener = View.OnTouchListener { _, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    initialX = layoutParams.x
                    initialY = layoutParams.y
                    initialTouchX = event.rawX
                    initialTouchY = event.rawY
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    layoutParams.x = initialX + (event.rawX - initialTouchX).toInt()
                    layoutParams.y = initialY + (event.rawY - initialTouchY).toInt()
                    windowManager.updateViewLayout(overlayView, layoutParams)
                    true
                }
                else -> false
            }
        }

        dragHandle.setOnTouchListener(touchListener)
        collapsedLayout?.setOnTouchListener { v, event ->
            if (event.action == MotionEvent.ACTION_UP) {
                val diffX = Math.abs(event.rawX - initialTouchX)
                val diffY = Math.abs(event.rawY - initialTouchY)
                if (diffX < 10 && diffY < 10) {
                    v.performClick()
                }
            }
            touchListener.onTouch(v, event)
        }
    }

    private fun triggerHaptic(durationMs: Long) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vibratorManager = getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
                vibratorManager?.defaultVibrator?.vibrate(
                    VibrationEffect.createOneShot(durationMs, VibrationEffect.DEFAULT_AMPLITUDE)
                )
            } else {
                @Suppress("DEPRECATION")
                val vibrator = getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator?.vibrate(VibrationEffect.createOneShot(durationMs, VibrationEffect.DEFAULT_AMPLITUDE))
                } else {
                    @Suppress("DEPRECATION")
                    vibrator?.vibrate(durationMs)
                }
            }
        } catch (_: Exception) {}
    }

    override fun onDestroy() {
        super.onDestroy()
        if (overlayView != null) {
            windowManager.removeView(overlayView)
            overlayView = null
        }
    }
}`
  },
  {
    path: 'android/app/src/main/java/com/ludocompanion/overlay/MainActivity.kt',
    name: 'MainActivity.kt',
    language: 'kotlin',
    content: `package com.ludocompanion.overlay

import android.Manifest
import android.os.Build
import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.snackbar.Snackbar
import com.ludocompanion.overlay.util.PermissionHelper

class MainActivity : AppCompatActivity() {

    private lateinit var tvOverlayPermissionStatus: TextView
    private lateinit var tvNotificationStatus: TextView
    private lateinit var btnGrantOverlayPermission: Button
    private lateinit var btnStartOverlay: Button
    private lateinit var btnStopOverlay: Button

    private val notificationPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        updateUI()
        if (isGranted) {
            Toast.makeText(this, "Notification permission granted", Toast.LENGTH_SHORT).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        tvOverlayPermissionStatus = findViewById(R.id.tvOverlayPermissionStatus)
        tvNotificationStatus = findViewById(R.id.tvNotificationStatus)
        btnGrantOverlayPermission = findViewById(R.id.btnGrantOverlayPermission)
        btnStartOverlay = findViewById(R.id.btnStartOverlay)
        btnStopOverlay = findViewById(R.id.btnStopOverlay)

        btnGrantOverlayPermission.setOnClickListener {
            requestOverlayPermission()
        }

        btnStartOverlay.setOnClickListener {
            startOverlayService()
        }

        btnStopOverlay.setOnClickListener {
            stopOverlayService()
        }

        checkNotificationPermission()
    }

    override fun onResume() {
        super.onResume()
        updateUI()
    }

    private fun updateUI() {
        val hasOverlay = PermissionHelper.hasOverlayPermission(this)
        val hasNotification = PermissionHelper.hasNotificationPermission(this)

        if (hasOverlay) {
            tvOverlayPermissionStatus.text = "Granted (Ready)"
            tvOverlayPermissionStatus.setTextColor(getColor(R.color.hud_accent_green))
            btnGrantOverlayPermission.isEnabled = false
            btnGrantOverlayPermission.text = "Permission Active"
            btnStartOverlay.isEnabled = true
        } else {
            tvOverlayPermissionStatus.text = "Missing SYSTEM_ALERT_WINDOW"
            tvOverlayPermissionStatus.setTextColor(getColor(R.color.hud_accent_red))
            btnGrantOverlayPermission.isEnabled = true
            btnGrantOverlayPermission.text = "Grant Overlay Permission"
            btnStartOverlay.isEnabled = false
        }

        if (hasNotification) {
            tvNotificationStatus.text = "Active"
            tvNotificationStatus.setTextColor(getColor(R.color.hud_accent_green))
        } else {
            tvNotificationStatus.text = "Not Granted (Android 13+)"
            tvNotificationStatus.setTextColor(getColor(R.color.hud_accent_yellow))
        }
    }

    private fun requestOverlayPermission() {
        if (!PermissionHelper.hasOverlayPermission(this)) {
            val intent = PermissionHelper.getOverlayPermissionIntent(this)
            startActivity(intent)
            Toast.makeText(this, "Enable 'Display over other apps' for Ludo Companion", Toast.LENGTH_LONG).show()
        }
    }

    private fun checkNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (!PermissionHelper.hasNotificationPermission(this)) {
                notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        }
    }

    private fun startOverlayService() {
        if (!PermissionHelper.hasOverlayPermission(this)) {
            requestOverlayPermission()
            return
        }

        FloatingOverlayService.start(this)
        Snackbar.make(btnStartOverlay, "Floating Overlay started! You can switch to your games.", Snackbar.LENGTH_LONG).show()
    }

    private fun stopOverlayService() {
        FloatingOverlayService.stop(this)
        Snackbar.make(btnStopOverlay, "Floating Overlay stopped.", Snackbar.LENGTH_SHORT).show()
    }
}`
  },
  {
    path: 'android/build-apk.sh',
    name: 'build-apk.sh',
    language: 'bash',
    content: `#!/usr/bin/env bash
# Quick build script to compile the debug APK
set -e

echo "=========================================="
echo " Building Ludo Companion Debug APK        "
echo "=========================================="

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
echo "=========================================="`
  },
  {
    path: 'android/build-apk.bat',
    name: 'build-apk.bat',
    language: 'bash',
    content: `@echo off
echo ==========================================
echo  Building Ludo Companion Debug APK
echo ==========================================

call gradlew.bat assembleDebug

echo.
echo ==========================================
echo  BUILD SUCCESSFUL!
echo  APK location: app\\build\\outputs\\apk\\debug\\app-debug.apk
echo ==========================================
pause`
  },
  {
    path: '.github/workflows/build-apk.yml',
    name: 'build-apk.yml (GitHub CI)',
    language: 'yaml',
    content: `name: Build Android Debug APK

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]
  workflow_dispatch:

jobs:
  build:
    name: Build & Package APK
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
          cache: gradle

      - name: Grant execute permission for gradlew
        run: chmod +x android/gradlew || true

      - name: Build Debug APK with Gradle
        working-directory: ./android
        run: ./gradlew assembleDebug --stacktrace

      - name: Upload Debug APK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: LudoCompanion-debug-apk
          path: android/app/build/outputs/apk/debug/app-debug.apk`
  },
  {
    path: 'android/gradle/wrapper/gradle-wrapper.properties',
    name: 'gradle-wrapper.properties',
    language: 'properties',
    content: `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.10.2-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists`
  },
  {
    path: 'android/gradle/libs.versions.toml',
    name: 'libs.versions.toml',
    language: 'toml',
    content: `[versions]
agp = "8.6.1"
kotlin = "2.0.21"
coreKtx = "1.15.0"
appcompat = "1.7.0"
material = "1.12.0"
constraintlayout = "2.2.0"
lifecycle = "2.8.7"
coroutines = "1.9.0"

[libraries]
androidx-core-ktx = { group = "androidx.core", name = "core-ktx", version.ref = "coreKtx" }
androidx-appcompat = { group = "androidx.appcompat", name = "appcompat", version.ref = "appcompat" }
material = { group = "com.google.android.material", name = "material", version.ref = "material" }
androidx-constraintlayout = { group = "androidx.constraintlayout", name = "constraintlayout", version.ref = "constraintlayout" }
androidx-lifecycle-runtime-ktx = { group = "androidx.lifecycle", name = "lifecycle-runtime-ktx", version.ref = "lifecycle" }
kotlinx-coroutines-android = { group = "org.jetbrains.kotlinx", name = "kotlinx-coroutines-android", version.ref = "coroutines" }

[plugins]
android-application = { id = "com.android.application", version.ref = "agp" }
kotlin-android = { id = "org.jetbrains.kotlin.android", version.ref = "kotlin" }`
  },
  {
    path: 'android/app/build.gradle.kts',
    name: 'app/build.gradle.kts',
    language: 'kotlin',
    content: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
}

android {
    namespace = "com.ludocompanion.overlay"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.ludocompanion.overlay"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
        debug {
            applicationIdSuffix = ".debug"
            isDebuggable = true
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        viewBinding = true
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.appcompat)
    implementation(libs.material)
    implementation(libs.androidx.constraintlayout)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.kotlinx.coroutines.android)
}`
  },
  {
    path: 'android/app/src/main/res/layout/layout_floating_overlay_expanded.xml',
    name: 'layout_floating_overlay_expanded.xml',
    language: 'xml',
    content: `<?xml version="1.0" encoding="utf-8"?>
<FrameLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="wrap_content"
    android:layout_height="wrap_content">

    <!-- COLLAPSED / MINIMIZED FLOATING PILL -->
    <LinearLayout
        android:id="@+id/layoutCollapsed"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:visibility="gone"
        android:orientation="horizontal"
        android:gravity="center_vertical"
        android:background="@drawable/bg_floating_panel"
        android:paddingHorizontal="14dp"
        android:paddingVertical="8dp">

        <TextView
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="🎲"
            android:textSize="18sp" />

        <TextView
            android:id="@+id/tvCurrentRollBadge"
            android:layout_width="28dp"
            android:layout_height="28dp"
            android:layout_marginStart="8dp"
            android:gravity="center"
            android:background="@drawable/bg_dice_button_selected"
            android:text="6"
            android:textColor="@color/hud_accent_gold"
            android:textStyle="bold"
            android:textSize="14sp" />
    </LinearLayout>

    <!-- EXPANDED FLOATING GAMING HUD -->
    <LinearLayout
        android:id="@+id/layoutExpanded"
        android:layout_width="290dp"
        android:layout_height="wrap_content"
        android:orientation="vertical"
        android:background="@drawable/bg_floating_panel"
        android:padding="14dp">

        <LinearLayout
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:orientation="horizontal"
            android:gravity="center_vertical">

            <LinearLayout
                android:id="@+id/dragHandleBar"
                android:layout_width="0dp"
                android:layout_height="32dp"
                android:layout_weight="1"
                android:gravity="center_vertical"
                android:orientation="horizontal">

                <View
                    android:layout_width="24dp"
                    android:layout_height="4dp"
                    android:background="#475569"
                    android:layout_marginEnd="8dp" />

                <TextView
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:text="Ludo Companion"
                    android:textColor="@color/hud_text_primary"
                    android:textStyle="bold"
                    android:textSize="13sp" />
            </LinearLayout>

            <ImageButton
                android:id="@+id/btnMinimize"
                android:layout_width="32dp"
                android:layout_height="32dp"
                android:background="?attr/selectableItemBackgroundBorderless"
                android:src="@android:drawable/arrow_down_float"
                android:contentDescription="Minimize Overlay" />

            <ImageButton
                android:id="@+id/btnCloseOverlay"
                android:layout_width="32dp"
                android:layout_height="32dp"
                android:layout_marginStart="4dp"
                android:background="?attr/selectableItemBackgroundBorderless"
                android:src="@android:drawable/ic_menu_close_clear_cancel"
                android:contentDescription="Close Overlay" />
        </LinearLayout>

        <TextView
            android:id="@+id/tvSelectedRollDisplay"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:layout_marginTop="6dp"
            android:text="Ready: 6"
            android:textColor="@color/hud_accent_gold"
            android:textStyle="bold"
            android:textSize="12sp" />

        <TextView
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:layout_marginTop="10dp"
            android:text="PLAYER SELECTOR"
            android:textColor="@color/hud_text_muted"
            android:textSize="10sp"
            android:textStyle="bold" />

        <LinearLayout
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:layout_marginTop="4dp"
            android:orientation="horizontal">

            <Button
                android:id="@+id/btnDice1"
                android:layout_width="0dp"
                android:layout_height="40dp"
                android:layout_weight="1"
                android:layout_marginEnd="2dp"
                android:text="1"
                android:textStyle="bold"
                android:textSize="14sp" />

            <Button
                android:id="@+id/btnDice2"
                android:layout_width="0dp"
                android:layout_height="40dp"
                android:layout_weight="1"
                android:layout_marginHorizontal="2dp"
                android:text="2"
                android:textStyle="bold"
                android:textSize="14sp" />

            <Button
                android:id="@+id/btnDice3"
                android:layout_width="0dp"
                android:layout_height="40dp"
                android:layout_weight="1"
                android:layout_marginHorizontal="2dp"
                android:text="3"
                android:textStyle="bold"
                android:textSize="14sp" />

            <Button
                android:id="@+id/btnDice4"
                android:layout_width="0dp"
                android:layout_height="40dp"
                android:layout_weight="1"
                android:layout_marginHorizontal="2dp"
                android:text="4"
                android:textStyle="bold"
                android:textSize="14sp" />

            <Button
                android:id="@+id/btnDice5"
                android:layout_width="0dp"
                android:layout_height="40dp"
                android:layout_weight="1"
                android:layout_marginHorizontal="2dp"
                android:text="5"
                android:textStyle="bold"
                android:textSize="14sp" />

            <Button
                android:id="@+id/btnDice6"
                android:layout_width="0dp"
                android:layout_height="40dp"
                android:layout_weight="1"
                android:layout_marginStart="2dp"
                android:text="6"
                android:textStyle="bold"
                android:textSize="14sp" />
        </LinearLayout>

        <LinearLayout
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:layout_marginTop="10dp"
            android:orientation="horizontal">

            <Button
                android:id="@+id/btnRollSelected"
                android:layout_width="0dp"
                android:layout_height="42dp"
                android:layout_weight="1"
                android:layout_marginEnd="4dp"
                android:text="Roll Selected"
                android:textColor="#FFFFFF"
                android:textSize="11sp"
                android:textStyle="bold"
                android:backgroundTint="@color/hud_accent_gold_dark" />

            <Button
                android:id="@+id/btnSimulateOpponent"
                android:layout_width="0dp"
                android:layout_height="42dp"
                android:layout_weight="1"
                android:layout_marginStart="4dp"
                android:text="Opponent RNG"
                android:textColor="#FFFFFF"
                android:textSize="11sp"
                android:textStyle="bold"
                android:backgroundTint="#334155" />
        </LinearLayout>

        <LinearLayout
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:layout_marginTop="12dp"
            android:background="#1E293B"
            android:padding="8dp"
            android:orientation="vertical">

            <LinearLayout
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:gravity="center_vertical"
                android:orientation="horizontal">

                <TextView
                    android:id="@+id/tvTotalRolls"
                    android:layout_width="0dp"
                    android:layout_height="wrap_content"
                    android:layout_weight="1"
                    android:text="Rolls: 0"
                    android:textColor="@color/hud_text_secondary"
                    android:textSize="11sp" />

                <TextView
                    android:id="@+id/tvSixRate"
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:text="6s: 0 (0%)"
                    android:textColor="@color/hud_accent_gold"
                    android:textSize="11sp"
                    android:textStyle="bold" />

                <ImageButton
                    android:id="@+id/btnResetStats"
                    android:layout_width="24dp"
                    android:layout_height="24dp"
                    android:layout_marginStart="6dp"
                    android:background="?attr/selectableItemBackgroundBorderless"
                    android:src="@android:drawable/ic_menu_revert"
                    android:contentDescription="Reset History" />
            </LinearLayout>

            <TextView
                android:id="@+id/tvLastRollInfo"
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:layout_marginTop="4dp"
                android:text="No rolls recorded yet."
                android:textColor="@color/hud_text_muted"
                android:textSize="10sp" />
        </LinearLayout>
    </LinearLayout>

</FrameLayout>`
  },
  {
    path: 'android/app/src/main/res/values/colors.xml',
    name: 'colors.xml',
    language: 'xml',
    content: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="hud_background_dark">#F00F172A</color>
    <color name="hud_surface_dark">#E61E293B</color>
    <color name="hud_card_dark">#D9334155</color>
    <color name="hud_border_dark">#33FFFFFF</color>
    
    <color name="hud_text_primary">#F8FAFC</color>
    <color name="hud_text_secondary">#94A3B8</color>
    <color name="hud_text_muted">#64748B</color>

    <color name="hud_accent_gold">#F59E0B</color>
    <color name="hud_accent_gold_dark">#D97706</color>
    <color name="hud_accent_cyan">#06B6D4</color>
    <color name="hud_accent_green">#10B981</color>
    <color name="hud_accent_red">#EF4444</color>
    <color name="hud_accent_yellow">#FBBF24</color>
</resources>`
  },
  {
    path: 'android/settings.gradle.kts',
    name: 'settings.gradle.kts',
    language: 'kotlin',
    content: `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "LudoCompanion"
include(":app")`
  },
  {
    path: 'android/README.md',
    name: 'README.md',
    language: 'markdown',
    content: `# Ludo Companion – Android Floating Overlay (Native Kotlin)

A private, offline floating gaming companion and dice simulator for Android. It runs as a foreground service using Android's \`WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY\`, rendering an interactive dark premium gaming HUD over any screen.

## How to Build Debug APK
\`\`\`bash
cd android
./gradlew assembleDebug
# Generated APK: app/build/outputs/apk/debug/app-debug.apk
\`\`\`

## How to Install via ADB
\`\`\`bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
adb shell appops set com.ludocompanion.overlay SYSTEM_ALERT_WINDOW allow
adb shell pm grant com.ludocompanion.overlay android.permission.POST_NOTIFICATIONS
\`\`\`
`
  }
];
