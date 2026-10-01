package com.bakawali.android

import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.webkit.JavascriptInterface
import android.widget.Toast
import org.json.JSONObject

/**
 * JavaScript Bridge for the Bakawali WebView.
 * Provides native Android capabilities to the bundled HTML5 learning adventure.
 */
class BakawaliWebInterface(
    private val activity: MainActivity,
    private val onActionCallback: ((action: String, payload: JSONObject?) -> Unit)? = null
) {

    private val vibrator: Vibrator? = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        val vibratorManager = activity.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
        vibratorManager?.defaultVibrator
    } else {
        @Suppress("DEPRECATION")
        activity.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
    }

    /**
     * General message handler from JavaScript.
     * Expected format: { "action": "...", "data": { ... } }
     */
    @JavascriptInterface
    fun postMessage(jsonString: String) {
        activity.runOnUiThread {
            try {
                val json = JSONObject(jsonString)
                val action = json.optString("action", "")
                val data = json.optJSONObject("data")

                when (action) {
                    "vibrate" -> {
                        val duration = data?.optLong("duration", 50L) ?: 50L
                        vibrate(duration)
                    }
                    "toast" -> {
                        val message = data?.optString("message", "") ?: ""
                        showToast(message)
                    }
                    "exit" -> {
                        activity.finish()
                    }
                    "openExternal" -> {
                        val url = data?.optString("url", "") ?: ""
                        if (url.isNotEmpty()) {
                            activity.openExternalLink(url)
                        }
                    }
                    else -> {
                        onActionCallback?.invoke(action, data)
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    /**
     * Trigger native haptic feedback for game events (e.g. Starfighter hit, Sky Runner jump, correct answer).
     */
    @JavascriptInterface
    fun vibrate(durationMs: Long) {
        try {
            if (vibrator?.hasVibrator() == true) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator.vibrate(
                        VibrationEffect.createOneShot(
                            durationMs.coerceIn(10L, 500L),
                            VibrationEffect.DEFAULT_AMPLITUDE
                        )
                    )
                } else {
                    @Suppress("DEPRECATION")
                    vibrator.vibrate(durationMs.coerceIn(10L, 500L))
                }
            }
        } catch (e: SecurityException) {
            // VIBRATE permission catch
        }
    }

    /**
     * Display a native Android toast.
     */
    @JavascriptInterface
    fun showToast(message: String) {
        activity.runOnUiThread {
            Toast.makeText(activity, message, Toast.LENGTH_SHORT).show()
        }
    }

    /**
     * Query whether Android has an active internet connection.
     * Used by YouTube Music and external components to degrade gracefully.
     */
    @JavascriptInterface
    fun isOnline(): Boolean {
        return activity.isNetworkAvailable()
    }

    /**
     * Get Android App Version Name.
     */
    @JavascriptInterface
    fun getAppVersion(): String {
        return "1.0.0"
    }

    /**
     * Log learning progress from JavaScript into Android logs/preferences.
     */
    @JavascriptInterface
    fun recordTrainingProgress(moduleId: Int, missionId: Int, stars: Int) {
        activity.runOnUiThread {
            activity.saveTrainingProgress(moduleId, missionId, stars)
        }
    }

    /**
     * Allow web app to request exit confirmation or app minimization.
     */
    @JavascriptInterface
    fun exitApp() {
        activity.runOnUiThread {
            activity.finish()
        }
    }
}
