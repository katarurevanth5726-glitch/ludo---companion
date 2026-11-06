# Add project specific ProGuard rules here.
-keep class com.ludocompanion.overlay.model.** { *; }
-keepclassmembers class * extends android.app.Service {
    public <init>();
}
