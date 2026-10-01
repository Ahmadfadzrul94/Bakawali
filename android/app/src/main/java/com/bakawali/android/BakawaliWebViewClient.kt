package com.bakawali.android

import android.content.Intent
import android.graphics.Bitmap
import android.net.Uri
import android.webkit.WebResourceErrorCompat
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewClientCompat

/**
 * Custom WebViewClient that routes local asset requests securely via WebViewAssetLoader
 * (https://appassets.androidplatform.net/assets/...) and prevents accidental external navigation.
 */
class BakawaliWebViewClient(
    private val activity: MainActivity,
    private val assetLoader: WebViewAssetLoader,
    private val onPageLoaded: () -> Unit,
    private val onErrorEncountered: (description: String) -> Unit
) : WebViewClientCompat() {

    override fun shouldInterceptRequest(
        view: WebView,
        request: WebResourceRequest
    ): WebResourceResponse? {
        // Intercept local assets and serve them securely without file:// scheme
        return assetLoader.shouldInterceptRequest(request.url)
    }

    override fun shouldOverrideUrlLoading(
        view: WebView,
        request: WebResourceRequest
    ): Boolean {
        val uri = request.url
        val urlString = uri.toString()

        // 1. Keep local virtual domain inside the Bakawali WebView
        if (uri.host == "appassets.androidplatform.net" || uri.host == "localhost") {
            return false
        }

        // 2. Allow YouTube embeds and safe child-music links
        if (urlString.contains("youtube.com") || urlString.contains("youtu.be")) {
            return try {
                val intent = Intent(Intent.ACTION_VIEW, uri)
                activity.startActivity(intent)
                true
            } catch (e: Exception) {
                // If no external app can handle YouTube, allow web view to load or fail gracefully
                false
            }
        }

        // 3. For any other external web links, prompt external browser to prevent escaping child-safe sandbox
        return try {
            val intent = Intent(Intent.ACTION_VIEW, uri)
            activity.startActivity(intent)
            true
        } catch (e: Exception) {
            e.printStackTrace()
            true // block navigation silently if intent fails
        }
    }

    override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
        super.onPageStarted(view, url, favicon)
    }

    override fun onPageFinished(view: WebView?, url: String?) {
        super.onPageFinished(view, url)
        onPageLoaded()
    }

    override fun onReceivedError(
        view: WebView,
        request: WebResourceRequest,
        error: WebResourceErrorCompat
    ) {
        super.onReceivedError(view, request, error)
        
        // Only trigger error view for the main frame request
        if (request.isForMainFrame) {
            val desc = error.description?.toString() ?: "Unknown WebView Error"
            onErrorEncountered(desc)
        }
    }
}
