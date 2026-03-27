package com.imam.faithtech

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.webkit.JavascriptInterface
import android.widget.Toast
import androidx.core.app.NotificationManagerCompat

/**
 * Interface to communicate between JavaScript in WebView and Native Android.
 * Use this to call Android features from your web code:
 * example: window.Android.showToast("Hello from Web!");
 */
class WebAppInterface(private val mContext: Context) {

    @JavascriptInterface
    fun showToast(toast: String) {
        Toast.makeText(mContext, toast, Toast.LENGTH_SHORT).show()
    }

    @JavascriptInterface
    fun getAppVersion(): String {
        return "1.0.0"
    }

    @JavascriptInterface
    fun shareUrl(url: String, title: String = "Share via Imam App") {
        val sendIntent: Intent = Intent().apply {
            action = Intent.ACTION_SEND
            putExtra(Intent.EXTRA_TEXT, url)
            putExtra(Intent.EXTRA_TITLE, title)
            type = "text/plain"
        }
        val shareIntent = Intent.createChooser(sendIntent, null)
        mContext.startActivity(shareIntent)
    }

    @JavascriptInterface
    fun triggerVibration(milliseconds: Long) {
        val vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val vibratorManager = mContext.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
            vibratorManager.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            mContext.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator.vibrate(VibrationEffect.createOneShot(milliseconds, VibrationEffect.DEFAULT_AMPLITUDE))
        } else {
            @Suppress("DEPRECATION")
            vibrator.vibrate(milliseconds)
        }
    }

    @JavascriptInterface
    fun copyToClipboard(text: String) {
        val clipboard = mContext.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
        val clip = ClipData.newPlainText("Copied Text", text)
        clipboard.setPrimaryClip(clip)
        Toast.makeText(mContext, "Copied to clipboard", Toast.LENGTH_SHORT).show()
    }

    @JavascriptInterface
    fun openExternalBrowser(url: String) {
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
        mContext.startActivity(intent)
    }

    /**
     * Called when the user signs in on the web side.
     * Use this to sync userId for FCM or Analytics.
     */
    @JavascriptInterface
    fun onUserSignIn(userId: String) {
        // Store userId for future use (e.g., associating with FCM token)
        val prefs = mContext.getSharedPreferences("ImamAppPrefs", Context.MODE_PRIVATE)
        prefs.edit().putString("userId", userId).apply()
        // showToast("Signed in as: $userId") // Optional: only for debug
    }

    @JavascriptInterface
    fun onUserSignOut() {
        val prefs = mContext.getSharedPreferences("ImamAppPrefs", Context.MODE_PRIVATE)
        prefs.edit().remove("userId").apply()
    }

    @JavascriptInterface
    fun logError(error: String) {
        android.util.Log.e("ImamAppJS", error)
        // Show as long toast for visibility during debugging
        Toast.makeText(mContext, "JS Error: $error", Toast.LENGTH_LONG).show()
    }

    @JavascriptInterface
    fun isNotificationEnabled(): Boolean {
        return NotificationManagerCompat.from(mContext).areNotificationsEnabled()
    }
}
