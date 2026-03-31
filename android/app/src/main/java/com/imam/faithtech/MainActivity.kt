package com.imam.faithtech

import android.Manifest
import android.annotation.SuppressLint
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.webkit.CookieManager
import android.webkit.GeolocationPermissions
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.net.http.SslError
import android.webkit.SslErrorHandler
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.content.Intent
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.Uri
import android.util.Log
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import android.widget.Toast
import com.imam.faithtech.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity() {

    companion object {
        private const val TAG = "ImamApp"
    }

    private lateinit var binding: ActivityMainBinding
    private val webUrl = "https://www.imamapp.co" // Official Production Domain

    override fun onCreate(savedInstanceState: Bundle?) {
        // Handle the splash screen transition.
        val splashScreen = installSplashScreen()
        super.onCreate(savedInstanceState)

        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupWebView()
        setupSwipeRefresh()
        checkPermissions()
        handleIntent(intent)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleIntent(intent)
    }

    private fun handleIntent(intent: Intent?) {
        val appLinkData: Uri? = intent?.data
        if (appLinkData != null) {
            // Navigate the WebView to the deep link path
            binding.webView.loadUrl(appLinkData.toString())
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        val webView = binding.webView
        val settings = webView.settings

        // Enable JavaScript and essential Web features
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.allowFileAccess = true
        settings.cacheMode = WebSettings.LOAD_DEFAULT
        settings.mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE

        // Better rendering and UX
        settings.useWideViewPort = true
        settings.loadWithOverviewMode = true
        settings.setSupportZoom(true)
        settings.builtInZoomControls = true
        settings.displayZoomControls = false
        settings.mediaPlaybackRequiresUserGesture = false

        // Disable Force Dark — Use API-level-appropriate method
        // forceDark is deprecated & removed in API 33+; using it on targetSdk 35 can crash
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            // API 33+: Use the AndroidX WebKit method
            try {
                androidx.webkit.WebSettingsCompat.setAlgorithmicDarkeningAllowed(
                    settings, false
                )
            } catch (e: Exception) {
                Log.w(TAG, "setAlgorithmicDarkeningAllowed not supported: ${e.message}")
            }
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            // API 29-32: Use the legacy forceDark
            @Suppress("DEPRECATION")
            settings.forceDark = WebSettings.FORCE_DARK_OFF
        }

        // Visual Hardening: Ensure WebView base is Imam Green to match splash/fallback
        webView.setBackgroundColor(android.graphics.Color.parseColor("#052e16"))

        // Custom User Agent to ensure compatibility with Clerk Social Logins
        val defaultUserAgent = settings.userAgentString
        settings.userAgentString = "$defaultUserAgent ImamApp/1.0"

        // Bridge: JavaScript Interface
        webView.addJavascriptInterface(WebAppInterface(this), "Android")

        // Persistence: Cookie Management for Clerk Sessions
        val cookieManager = CookieManager.getInstance()
        cookieManager.setAcceptCookie(true)
        cookieManager.setAcceptThirdPartyCookies(webView, true)

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url?.toString() ?: return false

                // Keep app domain navigation inside WebView
                if (url.contains("imamapp.co")) {
                    return false
                }

                // Clerk auth flows — keep inside WebView
                if (url.contains("clerk.") || url.contains("accounts.google.com") || url.contains("appleid.apple.com")) {
                    return false
                }

                // Open external links with system apps
                return try {
                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                    startActivity(intent)
                    true
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to open external URL: $url", e)
                    false
                }
            }

            @Deprecated("Deprecated in Java")
            override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean {
                if (url == null) return false

                // If the URL is for our app domain, load it in the WebView
                if (url.contains("imamapp.co")) {
                    return false
                }

                // Clerk auth flows
                if (url.contains("clerk.") || url.contains("accounts.google.com") || url.contains("appleid.apple.com")) {
                    return false
                }

                // Handle common protocols (tel, mailto, etc.) or external links
                return try {
                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                    startActivity(intent)
                    true // We handled it
                } catch (e: Exception) {
                    false // Let the system handle it
                }
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                binding.swipeRefreshLayout.isRefreshing = false
                cookieManager.flush()
                Log.d(TAG, "Page loaded: $url")
            }

            override fun onReceivedError(view: WebView?, request: WebResourceRequest?, error: WebResourceError?) {
                super.onReceivedError(view, request, error)
                if (request?.isForMainFrame == true) {
                    val errCode = error?.errorCode ?: -1
                    val errDesc = error?.description ?: "Unknown"
                    Log.e(TAG, "WebView error [$errCode]: $errDesc for ${request.url}")

                    if (errCode == ERROR_FAILED_SSL_HANDSHAKE) {
                        Toast.makeText(this@MainActivity, "SSL handshake failed", Toast.LENGTH_LONG).show()
                    } else if (errCode == ERROR_CONNECT || errCode == ERROR_HOST_LOOKUP || errCode == ERROR_TIMEOUT) {
                        // Network-related errors: show the offline page
                        showOfflineFallback()
                    } else {
                        Toast.makeText(this@MainActivity, "Error: $errDesc", Toast.LENGTH_LONG).show()
                    }
                }
            }

            override fun onReceivedHttpError(view: WebView?, request: WebResourceRequest?, errorResponse: WebResourceResponse?) {
                super.onReceivedHttpError(view, request, errorResponse)
                if (request?.isForMainFrame == true) {
                    Log.e(TAG, "HTTP Error ${errorResponse?.statusCode} for ${request.url}")
                    Toast.makeText(this@MainActivity, "HTTP Error: ${errorResponse?.statusCode}", Toast.LENGTH_LONG).show()
                }
            }

            @SuppressLint("WebViewClientOnReceivedSslError")
            override fun onReceivedSslError(view: WebView?, handler: SslErrorHandler?, error: SslError?) {
                // WARNING: In production, you should carefully decide whether to proceed or cancel.
                Log.w(TAG, "SSL Error: ${error?.toString()}")
                Toast.makeText(this@MainActivity, "SSL Error: ${error?.toString()}", Toast.LENGTH_LONG).show()
                handler?.proceed()
            }

            override fun onRenderProcessGone(view: WebView?, detail: android.webkit.RenderProcessGoneDetail?): Boolean {
                // WebView renderer crashed — recover gracefully instead of blank screen
                Log.e(TAG, "WebView render process gone! didCrash=${detail?.didCrash()}")
                if (detail?.didCrash() == true) {
                    // Renderer crashed: destroy and recreate
                    view?.destroy()
                    Toast.makeText(this@MainActivity, "Reloading...", Toast.LENGTH_SHORT).show()
                    recreate()
                } else {
                    // System killed the renderer to reclaim memory
                    view?.destroy()
                    recreate()
                }
                return true // We handled it
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                super.onProgressChanged(view, newProgress)
                if (newProgress < 100) {
                    binding.progressBar.visibility = android.view.View.VISIBLE
                    binding.progressBar.progress = newProgress
                } else {
                    binding.progressBar.visibility = android.view.View.GONE
                }
            }

            // Handle Location Permissions in WebView
            override fun onGeolocationPermissionsShowPrompt(
                origin: String?,
                callback: GeolocationPermissions.Callback?
            ) {
                callback?.invoke(origin, true, false)
            }

            override fun onConsoleMessage(consoleMessage: android.webkit.ConsoleMessage?): Boolean {
                Log.d(TAG, "JS Console [${consoleMessage?.messageLevel()}]: ${consoleMessage?.message()}")
                return true
            }
        }

        // Check connectivity before loading
        if (isNetworkAvailable()) {
            webView.loadUrl(webUrl)
        } else {
            showOfflineFallback()
        }
    }

    private fun isNetworkAvailable(): Boolean {
        val connectivityManager = getSystemService(CONNECTIVITY_SERVICE) as ConnectivityManager
        val network = connectivityManager.activeNetwork ?: return false
        val capabilities = connectivityManager.getNetworkCapabilities(network) ?: return false
        return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }

    private fun showOfflineFallback() {
        val offlineHtml = """
            <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body {
                        background: #052e16;
                        color: #F0FDF4;
                        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        height: 100vh;
                        margin: 0;
                        text-align: center;
                        padding: 20px;
                    }
                    h1 { font-size: 24px; margin-bottom: 12px; }
                    p { font-size: 16px; opacity: 0.8; margin-bottom: 24px; }
                    button {
                        background: #F0FDF4;
                        color: #052e16;
                        border: none;
                        border-radius: 12px;
                        padding: 14px 32px;
                        font-size: 16px;
                        font-weight: 600;
                        cursor: pointer;
                    }
                </style>
            </head>
            <body>
                <h1>No Internet Connection</h1>
                <p>Please check your connection and try again.</p>
                <button onclick="window.location.reload()">Retry</button>
            </body>
            </html>
        """.trimIndent()
        binding.webView.loadDataWithBaseURL(null, offlineHtml, "text/html", "UTF-8", null)
    }

    private fun setupSwipeRefresh() {
        binding.swipeRefreshLayout.setOnRefreshListener {
            if (isNetworkAvailable()) {
                binding.webView.reload()
            } else {
                binding.swipeRefreshLayout.isRefreshing = false
                showOfflineFallback()
            }
        }
    }

    private fun checkPermissions() {
        val permissionsToRequest = mutableListOf<String>()

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            permissionsToRequest.add(Manifest.permission.ACCESS_FINE_LOCATION)
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                permissionsToRequest.add(Manifest.permission.POST_NOTIFICATIONS)
            }
        }

        if (permissionsToRequest.isNotEmpty()) {
            requestPermissionLauncher.launch(permissionsToRequest.toTypedArray())
        }
    }

    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        // Handle permission results if needed
    }

    // Handle Back Button for WebView navigation
    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (binding.webView.canGoBack()) {
            binding.webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}
