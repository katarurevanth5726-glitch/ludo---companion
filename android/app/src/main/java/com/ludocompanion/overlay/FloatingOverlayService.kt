package com.ludocompanion.overlay

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
import android.widget.ImageView
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
    private var selectedPlayerDice: Int = 6 // Default 6
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
            // Android 14+ / 15: Specify foregroundServiceType
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

        // Setup 1-6 selector buttons
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

        // Roll Player Selected button
        val btnRollSelected: Button = view.findViewById(R.id.btnRollSelected)
        btnRollSelected.setOnClickListener {
            simulatePlayerRoll()
        }

        // Opponent Random Simulator button
        val btnSimulateOpponent: Button = view.findViewById(R.id.btnSimulateOpponent)
        btnSimulateOpponent.setOnClickListener {
            simulateOpponentRoll()
        }

        // Reset History button
        val btnResetStats: ImageButton = view.findViewById(R.id.btnResetStats)
        btnResetStats.setOnClickListener {
            resetSimulationHistory()
        }

        // Minimize / Collapse button
        val btnMinimize: ImageButton = view.findViewById(R.id.btnMinimize)
        btnMinimize.setOnClickListener {
            toggleExpandedState(false)
        }

        // Expand button inside collapsed pill
        collapsedLayout?.setOnClickListener {
            toggleExpandedState(true)
        }

        // Close button
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
        tvSelectedRollDisplay?.text = "Rolled: ${roll.value}"
        tvCurrentRollBadge?.text = "${roll.value}"
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
        tvSelectedRollDisplay?.text = "Opponent: ${roll.value}"
        tvCurrentRollBadge?.text = "${roll.value}"
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
        tvTotalRolls?.text = "Rolls: ${stats.totalRolls}"
        tvSixRate?.text = String.format("6s: %d (%.0f%%)", stats.sixCount, stats.sixPercentage)

        if (stats.lastRoll != null) {
            val sourceLabel = if (stats.lastRoll.source == RollSource.PLAYER_SELECTED) "Player" else "Opponent"
            tvLastRollInfo?.text = "Last: $sourceLabel rolled ${stats.lastRoll.value} at ${stats.lastRoll.formattedTime}"
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
        // Also allow dragging collapsed HUD directly
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
        } catch (_: Exception) {
            // Non-critical if vibration is disabled on device
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        if (overlayView != null) {
            windowManager.removeView(overlayView)
            overlayView = null
        }
    }
}
