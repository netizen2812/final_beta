# ProGuard rules for the FaithTech Android App

# Keep WebView and its Javascript interfaces
-keepclassmembers class * extends android.webkit.WebViewClient {
    public void *(android.webkit.WebView, java.lang.String);
}
-keepclassmembers class * extends android.webkit.WebChromeClient {
    public void *(android.webkit.WebView, java.lang.String);
}

# Firebase Messaging
-keep class com.google.firebase.messaging.** { *; }

# Clerk / Google Auth might require keeping some classes if they use reflection
# Add specific rules if Clerk provides Proguard recommendations

# Keep our JavaScript Interface
-keepclassmembers class com.imam.app.WebAppInterface {
    @android.webkit.JavascriptInterface <methods>;
}
