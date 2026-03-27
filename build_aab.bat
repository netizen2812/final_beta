set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
echo Building Imam App Frontend...
cd frontend
call npm run build:app
cd ..

echo Building Imam Android App Bundle (.aab)...
cd android
call gradlew.bat bundleRelease
echo.
echo If successful, your branded AAB is at:
echo android\app\build\outputs\bundle\release\app-release.aab
pause
