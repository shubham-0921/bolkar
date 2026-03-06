package com.mobile.floating

import android.app.*
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.graphics.*
import android.graphics.drawable.GradientDrawable
import android.media.MediaRecorder
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.view.*
import android.widget.*
import androidx.core.app.NotificationCompat
import kotlinx.coroutines.*
import java.io.File
import java.net.HttpURLConnection
import java.net.URL

class FloatingService : Service() {

    companion object {
        const val NOTIF_CHANNEL_ID = "bolkar_floating"
        const val NOTIF_ID = 1001
        const val EXTRA_API_KEY = "api_key"
        const val EXTRA_MODE = "mode"
        const val EXTRA_BACKEND_URL = "backend_url"
        const val EXTRA_DEVICE_ID = "device_id"
        private const val BAR_COUNT = 5
    }

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

    private var isRecording = false
    private var isProcessing = false

    private lateinit var micButton: View
    private lateinit var statusText: TextView
    private lateinit var resultCard: View
    private lateinit var resultText: TextView
    private lateinit var waveformContainer: LinearLayout
    private val waveformBars = mutableListOf<View>()

    // Polls amplitude every 80ms and animates bars
    private val amplitudeRunnable = object : Runnable {
        override fun run() {
            if (!isRecording) return
            val rawAmp = (mediaRecorder?.maxAmplitude ?: 0) / 6000f
            val amp = Math.sqrt(rawAmp.toDouble().coerceIn(0.0, 1.0)).toFloat()
            waveformBars.forEachIndexed { i, bar ->
                val phase = Math.sin((System.currentTimeMillis() / 200.0) + i * 0.8).toFloat()
                val jitter = 0.6f + (phase + 1f) / 5f  // 0.6..1.0
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
        createNotificationChannel()
        startForeground(NOTIF_ID, buildNotification("Bolkar ready — tap the mic"))
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
        createOverlay()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        apiKey = intent?.getStringExtra(EXTRA_API_KEY) ?: ""
        mode = intent?.getStringExtra(EXTRA_MODE) ?: "translate"
        backendUrl = intent?.getStringExtra(EXTRA_BACKEND_URL) ?: ""
        deviceId = intent?.getStringExtra(EXTRA_DEVICE_ID) ?: ""
        return START_STICKY
    }

    override fun onDestroy() {
        super.onDestroy()
        handler.removeCallbacks(amplitudeRunnable)
        scope.cancel()
        mediaRecorder?.release()
        rootView?.let { windowManager.removeView(it) }
    }

    // ─── Overlay ────────────────────────────────────────────────────────────

    private fun createOverlay() {
        val ctx = this

        val container = LinearLayout(ctx).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
        }

        // Mic bubble — click handled in makeDraggable via ACTION_UP
        val bubble = buildBubble(ctx)
        micButton = bubble
        container.addView(bubble, 72.dp, 72.dp)

        // Waveform bars (hidden until recording)
        val wf = LinearLayout(ctx).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(8.dp, 6.dp, 8.dp, 0)
            visibility = View.GONE
        }
        waveformContainer = wf
        repeat(BAR_COUNT) { i ->
            val bar = View(ctx).apply {
                background = GradientDrawable().apply {
                    setColor(Color.parseColor("#7c3aed"))
                    cornerRadius = 3.dp.toFloat()
                }
            }
            val lp = LinearLayout.LayoutParams(6.dp, 5.dp).apply {
                marginStart = if (i == 0) 0 else 5.dp
            }
            wf.addView(bar, lp)
            waveformBars.add(bar)
        }
        container.addView(wf, ViewGroup.LayoutParams.WRAP_CONTENT, 44.dp)

        // Status label
        val status = TextView(ctx).apply {
            textSize = 11f
            setTextColor(Color.parseColor("#a1a1aa"))
            gravity = Gravity.CENTER
            setPadding(0, 4.dp, 0, 0)
            text = ""
        }
        statusText = status
        container.addView(status, ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT)

        // Result card (hidden initially)
        val card = buildResultCard(ctx)
        resultCard = card
        card.visibility = View.GONE
        container.addView(card, 260.dp, ViewGroup.LayoutParams.WRAP_CONTENT)

        rootView = container

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
            gravity = Gravity.TOP or Gravity.END
            x = 16.dp
            y = 200.dp
        }

        windowManager.addView(container, params)
        makeDraggable(container, params)
    }

    private fun buildBubble(ctx: Context): View {
        val view = View(ctx)
        view.background = GradientDrawable().apply {
            shape = GradientDrawable.OVAL
            setColor(Color.parseColor("#7c3aed"))
            setStroke(2.dp, Color.parseColor("#c4b5fd"))
        }
        return view
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

    // Fixed drag: return true on ACTION_DOWN so MOVE events are delivered.
    // Distinguish tap (small movement) from drag (large movement) in ACTION_UP.
    private fun makeDraggable(view: View, params: WindowManager.LayoutParams) {
        var startX = 0
        var startY = 0
        var initialX = 0
        var initialY = 0
        var isDragging = false

        view.setOnTouchListener { _, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    startX = event.rawX.toInt()
                    startY = event.rawY.toInt()
                    initialX = params.x
                    initialY = params.y
                    isDragging = false
                    true // must return true to receive subsequent MOVE/UP events
                }
                MotionEvent.ACTION_MOVE -> {
                    val dx = event.rawX.toInt() - startX
                    val dy = event.rawY.toInt() - startY
                    if (!isDragging && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
                        isDragging = true
                    }
                    if (isDragging) {
                        params.x = initialX - dx
                        params.y = initialY + dy
                        windowManager.updateViewLayout(view, params)
                    }
                    true
                }
                MotionEvent.ACTION_UP -> {
                    if (!isDragging) handleMicTap()
                    true
                }
                else -> false
            }
        }
    }

    // ─── Recording ──────────────────────────────────────────────────────────

    private fun handleMicTap() {
        if (isProcessing) return
        if (isRecording) stopRecording() else startRecording()
    }

    private fun startRecording() {
        val file = File(cacheDir, "bolkar_recording.m4a")
        recordingFile = file

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

        isRecording = true
        setBubbleColor("#ef4444")
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

        handler.removeCallbacks(amplitudeRunnable)
        waveformContainer.visibility = View.GONE

        setBubbleColor("#27272a")
        showStatus("Processing…")
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
                        isProcessing = false
                        setBubbleColor("#7c3aed")
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
        val headers = if (deviceId.isNotBlank()) mapOf("x-device-id" to deviceId) else emptyMap()
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
        resultText.text = text
        resultCard.visibility = View.VISIBLE
        showStatus("")
        updateNotification("Result ready — tap Copy")
    }

    private fun hideResult() {
        resultCard.visibility = View.GONE
        showStatus("")
    }

    private fun showStatus(text: String) { statusText.text = text }

    private fun setBubbleColor(hex: String) {
        (micButton.background as? GradientDrawable)?.setColor(Color.parseColor(hex))
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

    // ─── Extension helpers ──────────────────────────────────────────────────
    private val Int.dp: Int get() = (this * resources.displayMetrics.density).toInt()
}
