package com.bakawali.android

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.graphics.Color
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.webkit.WebSettings
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.WindowCompat
import androidx.webkit.WebViewAssetLoader
import com.bakawali.android.databinding.ActivityMainBinding

/**
 * MainActivity: The native Android shell for the Bakawali educational adventure app.
 *
 * Responsibilities:
 * 1. Hosts the full-screen edge-to-edge WebView in portrait orientation.
 * 2. Uses WebViewAssetLoader to securely load bundled HTML5/CSS/JS without insecure file:// URLs.
 * 3. Configures JavaScript, DOM Storage (localStorage & IndexedDB), and hardware acceleration.
 * 4. Bridges Android native capabilities (vibrations, online status, toasts) to the web layer.
 * 5. Handles Android back button navigation intelligently to keep a 5-year-old child inside the app.
 */
class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var assetLoader: WebViewAssetLoader
    private lateinit var webInterface: BakawaliWebInterface
    private lateinit var prefs: SharedPreferences

    private var backPressedTime: Long = 0
    private val exitCooldownMs: Long = 2000L

    companion object {
        private const val ASSET_BASE_URL = "https://appassets.androidplatform.net/assets/bakawali/index.html"
        private const val PREFS_NAME = "bakawali_progress_prefs"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Setup Edge-to-Edge UI
        setupEdgeToEdge()

        // Inflate view binding
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

        // Setup secure WebViewAssetLoader
        setupAssetLoader()

        // Setup WebView settings and interface
        setupWebView()

        // Handle Android Back Navigation
        setupBackNavigation()

        // Setup Error layout retry button
        binding.btnRetry.setOnClickListener {
            binding.errorLayout.visibility = View.GONE
            binding.splashOverlay.visibility = View.VISIBLE
            binding.webView.reload()
        }

        // Load the initial Bakawali application securely
        binding.webView.loadUrl(ASSET_BASE_URL)
    }

    /**
     * Configure Edge-to-Edge immersive full-screen presentation.
     */
    private fun setupEdgeToEdge() {
        WindowCompat.setDecorFitsSystemWindows(window, false)
        window.statusBarColor = Color.TRANSPARENT
        window.navigationBarColor = Color.TRANSPARENT

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.insetsController?.let { controller ->
                controller.systemBarsBehavior =
                    WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
                controller.hide(WindowInsets.Type.statusBars())
            }
        } else {
            @Suppress("DEPRECATION")
            window.decorView.systemUiVisibility = (
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                or View.SYSTEM_UI_FLAG_FULLSCREEN
                or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            )
        }
    }

    /**
     * Initializes WebViewAssetLoader to safely serve HTML, CSS, JavaScript, and assets
     * from the bundled `app/src/main/assets` directory over virtual HTTPS domain.
     */
    private fun setupAssetLoader() {
        assetLoader = WebViewAssetLoader.Builder()
            .setDomain("appassets.androidplatform.net")
            .addPathHandler(
                "/assets/",
                WebViewAssetLoader.AssetsPathHandler(this)
            )
            .addPathHandler(
                "/res/",
                WebViewAssetLoader.ResourcesPathHandler(this)
            )
            .build()
    }

    /**
     * Configures the WebView for high-performance offline HTML5 gaming and learning.
     */
    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        val webView = binding.webView
        val settings = webView.settings

        // 1. Enable JavaScript
        settings.javaScriptEnabled = true

        // 2. Enable DOM Storage & IndexedDB (critical for offline learning progress)
        settings.domStorageEnabled = true
        settings.databaseEnabled = true

        // 3. Prevent insecure file:// access
        settings.allowFileAccess = false
        settings.allowContentAccess = false
        settings.allowFileAccessFromFileURLs = false
        settings.allowUniversalAccessFromFileURLs = false

        // 4. Cache & Offline Strategy
        settings.cacheMode = WebSettings.LOAD_DEFAULT

        // 5. Rendering & Viewport optimizations
        settings.useWideViewPort = true
        settings.loadWithOverviewMode = true
        settings.setSupportZoom(false)
        settings.builtInZoomControls = false
        settings.displayZoomControls = false

        // 6. Media & Audio autoplay without explicit touch gesture requirements
        settings.mediaPlaybackRequiresUserGesture = false

        // 7. Inject Android-to-JavaScript Bridge
        webInterface = BakawaliWebInterface(this) { action, payload ->
            // Custom native event handling if needed
        }
        webView.addJavascriptInterface(webInterface, "BakawaliNative")

        // 8. Custom Clients
        webView.webViewClient = BakawaliWebViewClient(
            activity = this,
            assetLoader = assetLoader,
            onPageLoaded = {
                // Fade out splash overlay smoothly when web content is ready
                binding.splashOverlay.animate()
                    .alpha(0f)
                    .setDuration(400)
                    .withEndAction {
                        binding.splashOverlay.visibility = View.GONE
                        binding.errorLayout.visibility = View.GONE
                    }
                    .start()
            },
            onErrorEncountered = { desc ->
                binding.splashOverlay.visibility = View.GONE
                binding.errorLayout.visibility = View.VISIBLE
            }
        )

        webView.webChromeClient = BakawaliWebChromeClient { progress ->
            binding.progressBar.progress = progress
        }
    }

    /**
     * Modern Android 13+ OnBackPressedCallback implementation.
     * Prevents accidental app dismissal by children; navigates back in WebView history or prompts double-tap to exit.
     */
    private fun setupBackNavigation() {
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                val webView = binding.webView

                // First check if web app can handle the back navigation via custom JS method
                webView.evaluateJavascript("typeof window.onBakawaliBackPressed === 'function' ? window.onBakawaliBackPressed() : false") { result ->
                    val handledByWeb = result == "true"
                    if (!handledByWeb) {
                        if (webView.canGoBack()) {
                            webView.goBack()
                        } else {
                            // On root screen: require double tap to exit within 2 seconds
                            val currentTime = System.currentTimeMillis()
                            if (currentTime - backPressedTime < exitCooldownMs) {
                                isEnabled = false
                                onBackPressedDispatcher.onBackPressed()
                            } else {
                                backPressedTime = currentTime
                                Toast.makeText(
                                    this@MainActivity,
                                    getString(R.string.exit_prompt),
                                    Toast.LENGTH_SHORT
                                ).show()
                            }
                        }
                    }
                }
            }
        })
    }

    /**
     * Checks if device currently has active network connectivity.
     */
    fun isNetworkAvailable(): Boolean {
        val connectivityManager =
            getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager ?: return false
        val activeNetwork = connectivityManager.activeNetwork ?: return false
        val capabilities = connectivityManager.getNetworkCapabilities(activeNetwork) ?: return false
        return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }

    /**
     * Safely open external URLs (e.g. YouTube nursery rhymes) in external apps.
     */
    fun openExternalLink(url: String) {
        try {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
            startActivity(intent)
        } catch (e: Exception) {
            Toast.makeText(this, "Tidak dapat membuka pautan luar", Toast.LENGTH_SHORT).show()
        }
    }

    /**
     * Native persistence of module progress as an additional local backup alongside IndexedDB.
     */
    fun saveTrainingProgress(moduleId: Int, missionId: Int, stars: Int) {
        val key = "module_${moduleId}_mission_${missionId}"
        prefs.edit().putInt(key, stars).apply()
    }

    override fun onResume() {
        super.onResume()
        binding.webView.onResume()
    }

    override fun onPause() {
        binding.webView.onPause()
        super.onPause()
    }

    override fun onDestroy() {
        binding.webView.destroy()
        super.onDestroy()
    }
}
