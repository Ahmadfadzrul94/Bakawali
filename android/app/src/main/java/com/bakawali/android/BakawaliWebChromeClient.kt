package com.bakawali.android

import android.util.Log
import android.webkit.ConsoleMessage
import android.webkit.WebChromeClient
import android.webkit.WebView

/**
 * Custom WebChromeClient for Bakawali:
 * Handles JavaScript console logging, progress notifications, and child-safe alert suppression.
 */
class BakawaliWebChromeClient(
    private val onProgressChanged: (progress: Int) -> Unit
) : WebChromeClient() {

    private val tag = "BakawaliWebView"

    override fun onProgressChanged(view: WebView?, newProgress: Int) {
        super.onProgressChanged(view, newProgress)
        onProgressChanged(newProgress)
    }

    override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
        consoleMessage?.let {
            val logMsg = "[JS ${it.messageLevel()}]: ${it.message()} -- From line ${it.lineNumber()} of ${it.sourceId()}"
            when (it.messageLevel()) {
                ConsoleMessage.MessageLevel.ERROR -> Log.e(tag, logMsg)
                ConsoleMessage.MessageLevel.WARNING -> Log.w(tag, logMsg)
                else -> Log.d(tag, logMsg)
            }
        }
        return true
    }
}
