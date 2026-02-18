@echo off
setlocal
echo ==========================================
echo 🚀 IMAM Platform: Smart Deployment Assistant
echo ==========================================

:: 1. CHECK FOR GIT INSTALLATION
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo ❌ ERROR: Git is not installed or not in your PATH.
    echo.
    echo I will now open the Git download page for you.
    echo 👉 Please download and install "Git for Windows".
    echo 👉 During installation, just click "Next" until finished.
    echo 👉 After installing, restart this script.
    echo.
    range error
    start https://git-scm.com/download/win
    pause
    exit /b
)

:: 2. CHECK IF REPO IS INITIALIZED
if not exist ".git" (
    echo.
    echo 📂 Initializing new Git repository...
    git init
    git branch -M main
    
    echo.
    echo 🔗 CONNECT TO GITHUB
    echo I need to know where to send your code.
    echo Go to GitHub.com -> Create New Repository -> Copy the HTTPS URL.
    echo (Example: https://github.com/YourName/FaithTech-App.git)
    echo.
    set /p REPO_URL="Paste your Repository URL here: "
    
    git remote add origin %REPO_URL%
    echo ✅ Connected to remote repository.
)

:: 3. DEPLOYMENT SEQUENCE
echo.
echo [1/3] Staging files...
git add . --all

echo.
echo [2/3] Committing changes...
git commit -m "chore: production deployment release (v1.0-beta)"

echo.
echo [3/3] Pushing to GitHub...
echo (A browser window may pop up asking you to sign in to GitHub)
git push -u origin main

echo.
echo ==========================================
echo ✅ DONE! Your code is now on GitHub.
echo ==========================================
echo.
echo Next Steps:
echo 1. Go to Render.com -> New Web Service -> Select this repo.
echo 2. Go to Vercel.com -> Add New -> Select this repo.
echo 3. Use 'prod_secrets.env' for your environment variables.
echo ==========================================
pause
