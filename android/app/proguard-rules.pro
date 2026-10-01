# Keep JavaScript interface methods
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

-keepclassmembers class com.bakawali.android.BakawaliWebInterface {
    <methods>;
}
