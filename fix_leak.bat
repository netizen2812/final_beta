@echo off
echo ==========================================
echo 🚨 SECURITY FIX: Removing exposed secrets
echo ==========================================

echo.
echo [1/3] Removing prod_secrets.env from Git tracking...
git rm --cached prod_secrets.env
git rm --cached backend/preflight_check.js

echo.
echo [2/3] Committing security fix...
git add .gitignore
git commit -m "security: remove exposed secrets from repository"

echo.
echo [3/3] Pushing changes...
git push origin main

echo.
echo ==========================================
echo ✅ Fix Pushed.
echo ⚠️ IMPORTANT: You MUST revoke your Gemini API Key in Google Cloud Console.
echo The key is considered compromised and should be rotated immediately.
echo ==========================================
pause
