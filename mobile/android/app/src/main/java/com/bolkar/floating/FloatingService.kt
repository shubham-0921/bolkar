package com.bolkar.floating

import com.bolkar.R
import android.app.*
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.graphics.*
import android.graphics.drawable.GradientDrawable
import android.media.MediaRecorder
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager
import android.view.*
import android.view.animation.DecelerateInterpolator
import android.animation.ValueAnimator
import android.view.animation.AccelerateDecelerateInterpolator
import android.widget.*
import androidx.core.app.NotificationCompat
import kotlinx.coroutines.*
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import kotlin.math.abs
import kotlin.math.max

class FloatingService : Service() {

    companion object {
        const val NOTIF_CHANNEL_ID = "bolkar_floating"
        const val NOTIF_ID = 1001
        const val EXTRA_API_KEY = "api_key"
        const val EXTRA_MODE = "mode"
        const val EXTRA_BACKEND_URL = "backend_url"
        const val EXTRA_DEVICE_ID = "device_id"
        const val EXTRA_AUTH_TOKEN = "auth_token"
        const val ACTION_UPDATE_MODE = "bolkar.UPDATE_MODE"
        private const val PREFS_NAME = "bolkar_service"
        private const val BAR_COUNT = 5
        private const val DISMISS_TARGET_SIZE_DP = 96
        private const val DISMISS_TARGET_BOTTOM_MARGIN_DP = 28
    }

    private lateinit var prefs: SharedPreferences
    private var wakeLock: PowerManager.WakeLock? = null

    private lateinit var windowManager: WindowManager
    private var rootView: View? = null
    private var mediaRecorder: MediaRecorder? = null
    private var recordingFile: File? = null
    private val handler = Handler(Looper.getMainLooper())
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    private var apiKey = ""
    private var mode = "translate"
    private var backendUrl = ""
    private var deviceId = ""
    private var authToken = ""

    private var isRecording = false
    private var isProcessing = false

    private var idlePulseAnimator: ValueAnimator? = null
    private var dotsAnimator: ValueAnimator? = null
    private var bubbleView: View? = null
    private var bubbleBackground: GradientDrawable? = null
    private var dismissTargetView: View? = null
    private var dismissTargetBackground: GradientDrawable? = null
    private var xButtonView: View? = null
    private var processingIndicator: LinearLayout? = null
    private lateinit var statusText: TextView
    private lateinit var resultCard: View
    private lateinit var resultText: TextView
    private lateinit var waveformContainer: LinearLayout
    private val waveformBars = mutableListOf<View>()
    private var silenceStartMs = 0L
    private val SILENCE_THRESHOLD_AMP = 800  // raw amplitude below this = silence
    private val SILENCE_AUTO_STOP_MS = 2000L // 2s of silence → auto-stop

    // Polls amplitude every 80ms, animates bars, and auto-stops after 2s silence
    private val amplitudeRunnable = object : Runnable {
        override fun run() {
            if (!isRecording) return
            val rawAmpInt = mediaRecorder?.maxAmplitude ?: 0
            val rawAmp = rawAmpInt / 6000f
            val amp = Math.sqrt(rawAmp.toDouble().coerceIn(0.0, 1.0)).toFloat()

            // Silence detection
            if (rawAmpInt < SILENCE_THRESHOLD_AMP) {
                if (silenceStartMs == 0L) silenceStartMs = System.currentTimeMillis()
                else if (System.currentTimeMillis() - silenceStartMs >= SILENCE_AUTO_STOP_MS) {
                    stopRecording()
                    return
                }
            } else {
                silenceStartMs = 0L
            }

            waveformBars.forEachIndexed { i, bar ->
                val phase = Math.sin((System.currentTimeMillis() / 200.0) + i * 0.8).toFloat()
                val jitter = 0.6f + (phase + 1f) / 5f
                val minH = 4.dp
                val maxH = 52.dp
                val targetH = if (amp > 0.02f)
                    (minH + (maxH - minH) * amp * jitter).toInt()
                else minH
                val lp = bar.layoutParams
                lp.height = targetH
                bar.layoutParams = lp
            }
            handler.postDelayed(this, 80)
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        createNotificationChannel()
        startForeground(NOTIF_ID, buildNotification("Bolkar ready — tap the mic"))
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
        createOverlay()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // Fast path: just a mode switch from the app UI
        if (intent?.action == ACTION_UPDATE_MODE) {
            mode = intent.getStringExtra(EXTRA_MODE) ?: mode
            prefs.edit().putString(EXTRA_MODE, mode).apply()
            if (!isRecording && !isProcessing) setBubbleColor(idleBubbleColor())
            return START_REDELIVER_INTENT
        }
        // If restarted by OS (null intent / START_STICKY), restore config from SharedPreferences
        if (intent != null) {
            apiKey = intent.getStringExtra(EXTRA_API_KEY) ?: ""
            mode = intent.getStringExtra(EXTRA_MODE) ?: "translate"
            backendUrl = intent.getStringExtra(EXTRA_BACKEND_URL) ?: ""
            deviceId = intent.getStringExtra(EXTRA_DEVICE_ID) ?: ""
            authToken = intent.getStringExtra(EXTRA_AUTH_TOKEN) ?: ""
            // Persist so we can restore after OS kill + restart
            prefs.edit()
                .putString(EXTRA_API_KEY, apiKey)
                .putString(EXTRA_MODE, mode)
                .putString(EXTRA_BACKEND_URL, backendUrl)
                .putString(EXTRA_DEVICE_ID, deviceId)
                .putString(EXTRA_AUTH_TOKEN, authToken)
                .apply()
        } else {
            // OS restarted the service with null intent — restore from prefs
            apiKey = prefs.getString(EXTRA_API_KEY, "") ?: ""
            mode = prefs.getString(EXTRA_MODE, "translate") ?: "translate"
            backendUrl = prefs.getString(EXTRA_BACKEND_URL, "") ?: ""
            deviceId = prefs.getString(EXTRA_DEVICE_ID, "") ?: ""
            authToken = prefs.getString(EXTRA_AUTH_TOKEN, "") ?: ""
        }
        // Apply mode color + label now that mode is known
        if (!isRecording && !isProcessing) {
            setBubbleColor(idleBubbleColor())
            updateWaveformColor()
            showIdleStatus()
            startIdlePulse()
        }
        return START_REDELIVER_INTENT
    }

    override fun onDestroy() {
        super.onDestroy()
        idlePulseAnimator?.cancel()
        dotsAnimator?.cancel()
        handler.removeCallbacks(amplitudeRunnable)
        scope.cancel()
        releaseWakeLock()
        mediaRecorder?.release()
        rootView?.let { windowManager.removeView(it) }
        dismissTargetView?.let { windowManager.removeView(it) }
    }

    private fun acquireWakeLock() {
        if (wakeLock?.isHeld == true) return
        val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
        wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "bolkar:recording")
        wakeLock?.acquire(5 * 60 * 1000L) // max 5 minutes
    }

    private fun releaseWakeLock() {
        if (wakeLock?.isHeld == true) wakeLock?.release()
        wakeLock = null
    }

    // ─── Overlay ────────────────────────────────────────────────────────────

    private fun createOverlay() {
        val ctx = this

        // Root: vertical (row on top, result card below)
        val root = LinearLayout(ctx).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.START
            clipChildren = false
            clipToPadding = false
        }

        // Horizontal row: diya | recording pill (hidden until recording)
        val row = LinearLayout(ctx).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            clipChildren = false
            clipToPadding = false
        }

        val bubble = buildBubble(ctx)
        bubbleView = bubble
        row.addView(bubble, 52.dp, 52.dp)

        // Recording pill: waveform bars + ✕  (hidden by default)
        val recPanel = LinearLayout(ctx).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(14.dp, 0, 12.dp, 0)
            background = GradientDrawable().apply {
                setColor(Color.parseColor("#1a1a22"))
                cornerRadius = 26.dp.toFloat()
                setStroke(1.dp, Color.parseColor("#333344"))
            }
            visibility = View.GONE
        }
        waveformContainer = recPanel

        // Waveform bars inside the pill
        repeat(BAR_COUNT) { i ->
            val bar = View(ctx).apply {
                background = GradientDrawable().apply {
                    setColor(Color.WHITE)
                    cornerRadius = 3.dp.toFloat()
                }
            }
            val lp = LinearLayout.LayoutParams(5.dp, 5.dp).apply {
                marginStart = if (i == 0) 0 else 5.dp
            }
            recPanel.addView(bar, lp)
            waveformBars.add(bar)
        }

        // ✕ button — entire container tap also stops recording (touch listener)
        val xBtn = TextView(ctx).apply {
            text = "✕"
            textSize = 15f
            setTextColor(Color.parseColor("#71717a"))
            gravity = Gravity.CENTER
            setPadding(14.dp, 0, 0, 0)
        }
        xButtonView = xBtn
        recPanel.addView(xBtn, LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT
        ))

        // Processing dots (hidden until processing state)
        val dotsRow = LinearLayout(ctx).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            visibility = View.GONE
            setPadding(2.dp, 0, 2.dp, 0)
        }
        val dotList = mutableListOf<View>()
        repeat(3) { i ->
            val dot = View(ctx).apply {
                background = GradientDrawable().apply {
                    shape = GradientDrawable.OVAL
                    setColor(Color.parseColor("#a1a1aa"))
                }
                alpha = 0.3f
            }
            val lp = LinearLayout.LayoutParams(8.dp, 8.dp).apply {
                marginStart = if (i == 0) 0 else 7.dp
            }
            dotsRow.addView(dot, lp)
            dotList.add(dot)
        }
        processingIndicator = dotsRow
        recPanel.addView(dotsRow, LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT
        ))

        row.addView(recPanel, LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT, 52.dp
        ).apply { marginStart = 10.dp })

        root.addView(row)

        // Status text — hidden, kept for compatibility
        statusText = TextView(ctx).apply { visibility = View.GONE }
        root.addView(statusText, 0, 0)

        // Result card
        val card = buildResultCard(ctx)
        resultCard = card
        card.visibility = View.GONE
        root.addView(card, 260.dp, ViewGroup.LayoutParams.WRAP_CONTENT)

        rootView = root

        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            else
                @Suppress("DEPRECATION") WindowManager.LayoutParams.TYPE_PHONE,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = (resources.displayMetrics.widthPixels - 52.dp - 16.dp).coerceAtLeast(16.dp)
            y = ((resources.displayMetrics.heightPixels - 52.dp) / 2).coerceAtLeast(16.dp)
        }

        windowManager.addView(root, params)
        createDismissTarget()
        makeDraggable(root, params)
        startIdlePulse()
    }

    private fun createDismissTarget() {
        val target = FrameLayout(this).apply {
            visibility = View.GONE
            alpha = 0f
            clipChildren = false
            clipToPadding = false
        }

        val bg = GradientDrawable().apply {
            shape = GradientDrawable.OVAL
            setColor(Color.parseColor("#14141f"))
            setStroke(2.dp, Color.parseColor("#3f3f46"))
        }
        dismissTargetBackground = bg
        target.background = bg

        val cross = TextView(this).apply {
            text = "X"
            textSize = 28f
            setTextColor(Color.parseColor("#a1a1aa"))
            gravity = Gravity.CENTER
        }
        target.addView(cross, FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.MATCH_PARENT
        ))

        val params = WindowManager.LayoutParams(
            DISMISS_TARGET_SIZE_DP.dp,
            DISMISS_TARGET_SIZE_DP.dp,
            overlayWindowType(),
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.BOTTOM or Gravity.CENTER_HORIZONTAL
            y = DISMISS_TARGET_BOTTOM_MARGIN_DP.dp
        }

        dismissTargetView = target
        windowManager.addView(target, params)
    }

    private fun buildBubble(ctx: Context): View {
        val bg = GradientDrawable().apply {
            shape = GradientDrawable.OVAL
            setColor(Color.parseColor(idleBubbleColor()))
        }
        bubbleBackground = bg
        val frame = FrameLayout(ctx).apply {
            clipToPadding = false
            clipChildren = false
            background = bg
        }
        val logo = android.widget.ImageView(ctx).apply {
            setImageResource(R.drawable.bolkar_logo)
            scaleType = android.widget.ImageView.ScaleType.FIT_CENTER
            setPadding(8.dp, 8.dp, 8.dp, 8.dp)
            setColorFilter(Color.parseColor("#fbbf24"), android.graphics.PorterDuff.Mode.SRC_IN) // warm amber
        }
        frame.addView(logo, FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.MATCH_PARENT,
            Gravity.CENTER
        ))
        return frame
    }

    private fun buildResultCard(ctx: Context): LinearLayout {
        val card = LinearLayout(ctx).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(12.dp, 10.dp, 12.dp, 10.dp)
            background = GradientDrawable().apply {
                setColor(Color.parseColor("#1a1a22"))
                cornerRadius = 14.dp.toFloat()
                setStroke(1.dp, Color.parseColor("#333344"))
            }
        }

        val text = TextView(ctx).apply {
            setTextColor(Color.WHITE)
            textSize = 14f
            text = ""
        }
        resultText = text
        card.addView(text)

        val btnRow = LinearLayout(ctx).apply {
            orientation = LinearLayout.HORIZONTAL
            setPadding(0, 8.dp, 0, 0)
        }

        val copyBtn = buildSmallButton(ctx, "Copy", "#7c3aed") {
            val t = resultText.text.toString()
            val cm = getSystemService(CLIPBOARD_SERVICE) as ClipboardManager
            cm.setPrimaryClip(ClipData.newPlainText("bolkar", t))
            showStatus("Copied!")
            handler.postDelayed({ hideResult() }, 1500)
        }
        btnRow.addView(copyBtn, 0, LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT).apply { weight = 1f })

        val dismissBtn = buildSmallButton(ctx, "Dismiss", "#3f3f46") { hideResult() }
        btnRow.addView(dismissBtn, LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT).apply { weight = 1f })

        card.addView(btnRow)
        return card
    }

    private fun buildSmallButton(ctx: Context, label: String, colorHex: String, onClick: () -> Unit): View {
        val btn = TextView(ctx).apply {
            text = label
            setTextColor(Color.WHITE)
            textSize = 13f
            gravity = Gravity.CENTER
            setPadding(8.dp, 8.dp, 8.dp, 8.dp)
            background = GradientDrawable().apply {
                setColor(Color.parseColor(colorHex))
                cornerRadius = 8.dp.toFloat()
            }
            setOnClickListener { onClick() }
        }
        return btn
    }

    private fun makeDraggable(view: View, params: WindowManager.LayoutParams) {
        var startRawX = 0
        var startY = 0
        var initialX = 0
        var initialY = 0
        var isDragging = false
        var touchSlop = 8.dp

        view.setOnTouchListener { _, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    startRawX = event.rawX.toInt()
                    startY = event.rawY.toInt()
                    initialX = params.x
                    initialY = params.y
                    isDragging = false
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    val dx = event.rawX.toInt() - startRawX
                    val dy = event.rawY.toInt() - startY
                    if (!isDragging && (abs(dx) > touchSlop || abs(dy) > touchSlop)) {
                        isDragging = true
                    }
                    if (isDragging) {
                        showDismissTarget()
                        val targetX = initialX + dx
                        val targetY = initialY + dy
                        params.x = (params.x + ((targetX - params.x) * 0.42f)).toInt()
                        params.y = (params.y + ((targetY - params.y) * 0.42f)).toInt()
                        constrainToScreen(params, view)
                        setDismissTargetActive(isBubbleOverDismissTarget(params, view))
                        windowManager.updateViewLayout(view, params)
                    }
                    true
                }
                MotionEvent.ACTION_UP -> {
                    if (!isDragging) {
                        view.performClick()
                        handleMicTap()
                    } else {
                        val shouldClose = isBubbleOverDismissTarget(params, view)
                        hideDismissTarget()
                        if (shouldClose) {
                            stopSelf()
                            return@setOnTouchListener true
                        }
                        snapToEdge(params, view, animate = true)
                    }
                    true
                }
                MotionEvent.ACTION_CANCEL -> {
                    hideDismissTarget()
                    true
                }
                else -> false
            }
        }
    }

    private fun showDismissTarget() {
        val target = dismissTargetView ?: return
        if (target.visibility == View.VISIBLE) return
        target.visibility = View.VISIBLE
        target.animate().cancel()
        target.animate().alpha(1f).setDuration(140).start()
    }

    private fun hideDismissTarget() {
        val target = dismissTargetView ?: return
        setDismissTargetActive(false)
        target.animate().cancel()
        target.animate().alpha(0f).setDuration(120).withEndAction {
            target.visibility = View.GONE
        }.start()
    }

    private fun setDismissTargetActive(active: Boolean) {
        dismissTargetBackground?.apply {
            if (active) {
                setColor(Color.parseColor("#3b1f1f"))
                setStroke(2.dp, Color.parseColor("#ef4444"))
            } else {
                setColor(Color.parseColor("#14141f"))
                setStroke(2.dp, Color.parseColor("#3f3f46"))
            }
        }
    }

    private fun isBubbleOverDismissTarget(params: WindowManager.LayoutParams, view: View): Boolean {
        val dm = resources.displayMetrics
        val vw = max(view.width, 72.dp)
        val vh = max(view.height, 72.dp)

        val bubbleCenterX = params.x + (vw / 2f)
        val bubbleCenterY = params.y + (vh / 2f)

        val targetSize = max(dismissTargetView?.width ?: 0, DISMISS_TARGET_SIZE_DP.dp).toFloat()
        val targetCenterX = dm.widthPixels / 2f
        val targetCenterY = dm.heightPixels - DISMISS_TARGET_BOTTOM_MARGIN_DP.dp - (targetSize / 2f)

        val dx = bubbleCenterX - targetCenterX
        val dy = bubbleCenterY - targetCenterY
        val threshold = (targetSize * 0.5f) + (vw * 0.28f)
        return (dx * dx + dy * dy) <= threshold * threshold
    }

    private fun constrainToScreen(params: WindowManager.LayoutParams, view: View) {
        val dm = resources.displayMetrics
        val vw = max(view.width, 72.dp)
        val vh = max(view.height, 72.dp)
        val maxX = max(16.dp, dm.widthPixels - vw - 16.dp)
        val maxY = max(16.dp, dm.heightPixels - vh - 16.dp)
        params.x = params.x.coerceIn(16.dp, maxX)
        params.y = params.y.coerceIn(16.dp, maxY)
    }

    private fun snapToEdge(params: WindowManager.LayoutParams, view: View, animate: Boolean) {
        constrainToScreen(params, view)
        val dm = resources.displayMetrics
        val vw = max(view.width, 72.dp)
        val centerX = params.x + vw / 2f
        // Snap X to nearest edge; keep Y exactly where user released
        val snapX = if (centerX < dm.widthPixels / 2f) 16.dp
                    else max(16.dp, dm.widthPixels - vw - 16.dp)

        if (!animate) {
            params.x = snapX
            windowManager.updateViewLayout(view, params)
            return
        }

        val startX = params.x
        ValueAnimator.ofFloat(0f, 1f).apply {
            duration = 260
            interpolator = DecelerateInterpolator()
            addUpdateListener { anim ->
                val t = anim.animatedFraction
                params.x = (startX + (snapX - startX) * t).toInt()
                windowManager.updateViewLayout(view, params)
            }
        }.start()
    }

    private fun idleBubbleColor(): String =
        if (mode == "translate") "#3b0764" else "#1e1b4b" // deep violet / deep indigo

    private fun idleModeLabel(): String =
        if (mode == "translate") "→ English" else "As Spoken"

    private fun updateWaveformColor() { /* bars are always white for contrast */ }

    private fun showIdleStatus() {
        showStatus(idleModeLabel())
        statusText.setTextColor(Color.parseColor("#1e293b"))
    }

    private fun startIdlePulse() { /* pulse removed */ }

    private fun stopIdlePulse() {
        idlePulseAnimator?.cancel()
        idlePulseAnimator = null
        bubbleView?.scaleX = 1f
        bubbleView?.scaleY = 1f
    }

    // ─── Recording ──────────────────────────────────────────────────────────

    private fun handleMicTap() {
        if (isProcessing) return
        if (isRecording) stopRecording() else startRecording()
    }

    private fun startRecording() {
        val file = File(cacheDir, "bolkar_recording.m4a")
        recordingFile = file

        try {
            mediaRecorder = (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S)
                MediaRecorder(this) else @Suppress("DEPRECATION") MediaRecorder()
            ).apply {
                setAudioSource(MediaRecorder.AudioSource.MIC)
                setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
                setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
                setAudioSamplingRate(16000)
                setAudioEncodingBitRate(64000)
                setOutputFile(file.absolutePath)
                prepare()
                start()
            }
        } catch (e: Exception) {
            mediaRecorder?.release()
            mediaRecorder = null
            showStatus("Mic unavailable")
            return
        }

        acquireWakeLock()
        isRecording = true
        silenceStartMs = 0L
        stopIdlePulse()
        setBubbleColor("#dc2626") // red while recording
        waveformContainer.visibility = View.VISIBLE
        handler.post(amplitudeRunnable)
        showStatus("Recording…")
        updateNotification("Recording…")
    }

    private fun stopRecording() {
        try { mediaRecorder?.stop() } catch (_: Exception) {}
        mediaRecorder?.release()
        mediaRecorder = null
        isRecording = false
        isProcessing = true
        releaseWakeLock()

        handler.removeCallbacks(amplitudeRunnable)

        // Swap bars + X for bouncing dots
        waveformBars.forEach { it.visibility = View.GONE }
        xButtonView?.visibility = View.GONE
        processingIndicator?.visibility = View.VISIBLE
        startDotsAnimation()
        updateNotification("Processing…")

        recordingFile?.let { file ->
            scope.launch {
                try {
                    val transcript = if (backendUrl.isNotBlank()) sendToBackend(file) else sendToSarvam(file)
                    handler.post { showResult(transcript) }
                } catch (e: Exception) {
                    handler.post { showStatus("Error: ${e.message?.take(40)}") }
                } finally {
                    handler.post {
                        stopDotsAnimation()
                        waveformContainer.visibility = View.GONE
                        waveformBars.forEach { it.visibility = View.VISIBLE }
                        xButtonView?.visibility = View.VISIBLE
                        processingIndicator?.visibility = View.GONE
                        isProcessing = false
                        setBubbleColor(idleBubbleColor())
                        startIdlePulse()
                        updateNotification("Bolkar ready — tap the mic")
                    }
                }
            }
        }
    }

    // ─── API Calls ──────────────────────────────────────────────────────────

    private fun sendToSarvam(file: File): String {
        val endpoint = if (mode == "translate")
            "https://api.sarvam.ai/speech-to-text-translate"
        else
            "https://api.sarvam.ai/speech-to-text"
        return multipartPost(endpoint, file, mapOf("api-subscription-key" to apiKey))
    }

    private fun sendToBackend(file: File): String {
        val endpoint = backendUrl.trimEnd('/') + "/api/transcribe"
        val headers = when {
            authToken.isNotBlank() -> mapOf("Authorization" to "Bearer $authToken")
            deviceId.isNotBlank() -> mapOf("x-device-id" to deviceId)
            else -> emptyMap()
        }
        return multipartPost(endpoint, file, headers, extraFields = mapOf("mode" to mode))
    }

    private fun multipartPost(
        urlStr: String,
        file: File,
        headers: Map<String, String>,
        extraFields: Map<String, String> = mapOf("model" to "saaras:v3", "language_code" to "unknown")
    ): String {
        val boundary = "BolkarBoundary${System.currentTimeMillis()}"
        val url = URL(urlStr)
        val conn = url.openConnection() as HttpURLConnection
        conn.requestMethod = "POST"
        conn.doOutput = true
        conn.setRequestProperty("Content-Type", "multipart/form-data; boundary=$boundary")
        headers.forEach { (k, v) -> conn.setRequestProperty(k, v) }
        conn.connectTimeout = 30_000
        conn.readTimeout = 30_000

        conn.outputStream.use { out ->
            val writer = out.bufferedWriter(Charsets.UTF_8)

            val fields = if (extraFields.isEmpty())
                mapOf("model" to "saaras:v3", "language_code" to "unknown")
            else extraFields + mapOf("model" to "saaras:v3", "language_code" to "unknown")

            fields.forEach { (k, v) ->
                writer.write("--$boundary\r\n")
                writer.write("Content-Disposition: form-data; name=\"$k\"\r\n\r\n")
                writer.write("$v\r\n")
                writer.flush()
            }

            val fieldName = if (backendUrl.isNotBlank()) "audio" else "file"
            writer.write("--$boundary\r\n")
            writer.write("Content-Disposition: form-data; name=\"$fieldName\"; filename=\"recording.m4a\"\r\n")
            writer.write("Content-Type: audio/mp4\r\n\r\n")
            writer.flush()
            file.inputStream().use { it.copyTo(out) }
            writer.write("\r\n--$boundary--\r\n")
            writer.flush()
        }

        val responseCode = conn.responseCode
        val body = if (responseCode in 200..299)
            conn.inputStream.bufferedReader().readText()
        else
            conn.errorStream?.bufferedReader()?.readText() ?: "Error $responseCode"

        if (responseCode !in 200..299) throw Exception("API error $responseCode: ${body.take(200)}")

        val match = Regex("\"transcript\"\\s*:\\s*\"((?:[^\"\\\\]|\\\\.)*)\"").find(body)
        return match?.groupValues?.getOrNull(1)?.replace("\\n", "\n")?.replace("\\\"", "\"") ?: ""
    }

    // ─── UI Helpers ─────────────────────────────────────────────────────────

    private fun showResult(text: String) {
        if (text.isBlank()) {
            showStatus("Nothing detected — try again")
            return
        }

        // Try direct text insertion into the focused field of whatever app is open
        val inserted = BolkarAccessibilityService.instance?.insertText(text) == true

        // Always copy to clipboard as backup
        val cm = getSystemService(CLIPBOARD_SERVICE) as ClipboardManager
        cm.setPrimaryClip(ClipData.newPlainText("bolkar", text))

        resultText.text = text
        resultCard.visibility = View.VISIBLE
        if (inserted) {
            updateNotification("Text inserted")
            // Auto-dismiss result card after 3s — text is already in the field
            handler.postDelayed({ hideResult() }, 3000)
        } else {
            updateNotification("Copied to clipboard")
        }
    }

    private fun hideResult() {
        resultCard.visibility = View.GONE
        showStatus("")
    }

    private fun showStatus(text: String) {
        statusText.text = text
        // Neutral color for transient messages; showIdleStatus sets the mode color
        if (text != idleModeLabel()) {
            statusText.setTextColor(Color.parseColor("#1e293b"))
        }
    }

    private fun setBubbleColor(hex: String) {
        bubbleBackground?.setColor(Color.parseColor(hex))
    }

    private fun startDotsAnimation() {
        dotsAnimator?.cancel()
        val dots = processingIndicator ?: return
        dotsAnimator = ValueAnimator.ofFloat(0f, 3f).apply {
            duration = 800
            repeatCount = ValueAnimator.INFINITE
            addUpdateListener { anim ->
                val t = anim.animatedValue as Float
                for (i in 0 until dots.childCount) {
                    val phase = (t - i * 1f + 3f) % 3f
                    dots.getChildAt(i).alpha = when {
                        phase < 1f -> 0.3f + phase * 0.7f
                        phase < 2f -> 1f - (phase - 1f) * 0.7f
                        else       -> 0.3f
                    }
                }
            }
        }
        dotsAnimator?.start()
    }

    private fun stopDotsAnimation() {
        dotsAnimator?.cancel()
        dotsAnimator = null
    }

    // ─── Notifications ───────────────────────────────────────────────────────

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                NOTIF_CHANNEL_ID, "Bolkar Floating Mic", NotificationManager.IMPORTANCE_LOW
            ).apply { description = "Persistent notification for floating mic" }
            (getSystemService(NOTIFICATION_SERVICE) as NotificationManager).createNotificationChannel(channel)
        }
    }

    private fun buildNotification(text: String): Notification {
        val intent = packageManager.getLaunchIntentForPackage(packageName)
        val pi = PendingIntent.getActivity(this, 0, intent, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
        return NotificationCompat.Builder(this, NOTIF_CHANNEL_ID)
            .setContentTitle("Bolkar")
            .setContentText(text)
            .setSmallIcon(android.R.drawable.ic_btn_speak_now)
            .setContentIntent(pi)
            .setOngoing(true)
            .build()
    }

    private fun updateNotification(text: String) {
        val nm = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
        nm.notify(NOTIF_ID, buildNotification(text))
    }

    private fun overlayWindowType(): Int {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_PHONE
        }
    }

    // ─── Extension helpers ──────────────────────────────────────────────────
    private val Int.dp: Int get() = (this * resources.displayMetrics.density).toInt()

}
