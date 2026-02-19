@echo off
echo ===================================================
echo   FaithTech Deployment Script
echo   Pushing changes to GitHub...
echo ===================================================

echo.
echo [1/3] Adding all files...
git add .

echo.
echo [2/3] Committing changes...
git commit -m "feat: Dynamic Tarbiyah Content, Admin Portal, and Production Readiness"

echo.
echo [3/3] Pushing to origin main...
git push origin main

echo.
echo ===================================================
echo   Deployment Triggered!
echo   - Backend: Deploying to Render...
echo   - Frontend: Deploying to Vercel...
echo.
echo   Wait for ~2-3 minutes for changes to go live.
echo ===================================================
pause
