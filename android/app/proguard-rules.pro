# ProGuard rules for the FaithTech Android App (Imam)
# ====================================================

# ── WebView Core ──────────────────────────────────────
# Keep WebViewClient and WebChromeClient subclass methods
-keepclassmembers class * extends android.webkit.WebViewClient {
    public void *(android.webkit.WebView, java.lang.String);
    public void *(android.webkit.WebView, java.lang.String, android.graphics.Bitmap);
    public boolean *(android.webkit.WebView, java.lang.String);
    public void *(android.webkit.WebView, android.webkit.WebResourceRequest, android.webkit.WebResourceError);
    public android.webkit.WebResourceResponse *(android.webkit.WebView, android.webkit.WebResourceRequest);
}
-keepclassmembers class * extends android.webkit.WebChromeClient {
    public void *(android.webkit.WebView, java.lang.String);
    public boolean *(android.webkit.ConsoleMessage);
}

# Keep WebView itself and its settings
-keep class android.webkit.WebView { *; }
-keep class android.webkit.WebSettings { *; }
-keep class android.webkit.WebViewClient { *; }
-keep class android.webkit.WebChromeClient { *; }
-keep class android.webkit.CookieManager { *; }
-keep class android.webkit.RenderProcessGoneDetail { *; }

# ── JavaScript Interface (Critical for signed builds) ──
# Keep our specific interface class
-keep class com.imam.faithtech.WebAppInterface { *; }
-keepclassmembers class com.imam.faithtech.WebAppInterface {
    @android.webkit.JavascriptInterface <methods>;
}
-keepnames class com.imam.faithtech.WebAppInterface

# Broad rule: keep ALL classes with @JavascriptInterface annotated methods
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# ── AndroidX WebKit ──────────────────────────────────
-keep class androidx.webkit.** { *; }
-dontwarn androidx.webkit.**

# ── AndroidX SplashScreen ────────────────────────────
-keep class androidx.core.splashscreen.** { *; }

# ── Firebase Messaging ───────────────────────────────
-keep class com.google.firebase.messaging.** { *; }
-keep class com.imam.faithtech.fcm.** { *; }
-dontwarn com.google.firebase.**

# ── Google Play Services ─────────────────────────────
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**

# ── AndroidX Core & AppCompat ────────────────────────
-keep class androidx.core.** { *; }
-keep class androidx.appcompat.** { *; }
-dontwarn androidx.core.**

# ── SwipeRefreshLayout ───────────────────────────────
-keep class androidx.swiperefreshlayout.** { *; }

# ── Material Components ──────────────────────────────
-keep class com.google.android.material.** { *; }
-dontwarn com.google.android.material.**

# ── Activity Result APIs ─────────────────────────────
-keep class androidx.activity.result.** { *; }

# ── Prevent stripping of our app classes ─────────────
-keep class com.imam.faithtech.MainActivity { *; }
-keep class com.imam.faithtech.WebAppInterface { *; }
-keep class com.imam.faithtech.fcm.MyFirebaseMessagingService { *; }

# ── General safety ───────────────────────────────────
# Don't warn about missing classes in optional dependencies
-dontwarn org.bouncycastle.**
-dontwarn org.conscrypt.**
-dontwarn org.openjsse.**
-dontwarn javax.annotation.**

# Keep Parcelable implementations
-keep class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator *;
}

# Keep enums used by the app
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# Keep R class fields used by resource reflection
-keepclassmembers class **.R$* {
    public static <fields>;
}
