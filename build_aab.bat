@echo off
setlocal
color 0A

echo ========================================================
echo  IMAM APP: ANDROID APP BUNDLE (.AAB) BUILD SCRIPT
echo ========================================================
echo.

:: 1. Verify Java Home matches Android Studio
set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
echo [INFO] JAVA_HOME set to: %JAVA_HOME%
echo.

:: 2. Build Frontend
echo [STEP 1/2] Building web frontend for Android Assets...
cd frontend
call npm run build:app
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Frontend build failed! Aborting...
    color 0C
    pause
    exit /b %ERRORLEVEL%
)
cd ..
echo [SUCCESS] Frontend built successfully.
echo.

:: 3. Build AAB
echo [STEP 2/2] Building Android App Bundle (Release)...
cd android
call gradlew.bat clean bundleRelease
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Gradle App Bundle build failed! Aborting...
    color 0C
    pause
    exit /b %ERRORLEVEL%
)
cd ..
echo [SUCCESS] Android App Bundle built successfully!

echo.
echo ========================================================
echo                    BUILD COMPLETE
echo ========================================================
echo You can find your signed AAB file at:
echo c:\Users\acer\Downloads\FaithTech\FaithTech\android\app\build\outputs\bundle\release\app-release.aab
echo.
echo Upload this file to the Google Play Console!
pause
