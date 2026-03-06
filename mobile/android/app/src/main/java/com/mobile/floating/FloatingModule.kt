package com.mobile.floating

import android.app.ActivityManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import com.facebook.react.bridge.*

class FloatingModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "FloatingBubble"

    @ReactMethod
    fun startFloating(apiKey: String, mode: String, backendUrl: String, deviceId: String) {
        val ctx = reactApplicationContext

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(ctx)) {
            val intent = Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:${ctx.packageName}")
            ).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            ctx.startActivity(intent)
            return
        }

        val intent = Intent(ctx, FloatingService::class.java).apply {
            putExtra(FloatingService.EXTRA_API_KEY, apiKey)
            putExtra(FloatingService.EXTRA_MODE, mode)
            putExtra(FloatingService.EXTRA_BACKEND_URL, backendUrl)
            putExtra(FloatingService.EXTRA_DEVICE_ID, deviceId)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            ctx.startForegroundService(intent)
        } else {
            ctx.startService(intent)
        }
    }

    @ReactMethod
    fun stopFloating() {
        val ctx = reactApplicationContext
        ctx.stopService(Intent(ctx, FloatingService::class.java))
    }

    @ReactMethod
    fun isRunning(promise: Promise) {
        try {
            val ctx = reactApplicationContext
            val am = ctx.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
            @Suppress("DEPRECATION")
            val running = am.getRunningServices(Int.MAX_VALUE).any {
                it.service.className == FloatingService::class.java.name
            }
            promise.resolve(running)
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }
}
