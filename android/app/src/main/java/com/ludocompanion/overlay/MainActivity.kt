package com.ludocompanion.overlay

import android.Manifest
import android.content.Intent
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

    // Permission launcher for Android 13+ notifications
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
}
