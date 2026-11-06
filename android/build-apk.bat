@echo off
echo ==========================================
echo  Building Ludo Companion Debug APK
echo ==========================================

call gradlew.bat assembleDebug

echo.
echo ==========================================
echo  BUILD SUCCESSFUL!
echo  APK location: app\build\outputs\apk\debug\app-debug.apk
echo ==========================================
pause
