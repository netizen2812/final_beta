set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
echo Building FaithTech Android App Bundle (.aab)...
cd android
call gradlew.bat bundleRelease
echo.
echo If successful, your AAB is at:
echo FaithTech\android\app\build\outputs\bundle\release\app-release.aab
pause
