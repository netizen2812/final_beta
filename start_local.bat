@echo off
echo ==========================================
echo 🚀 Starting IMAM Platform Locally...
echo ==========================================

echo [1/2] Starting Backend Server (Port 5000)...
start "IMAM Backend" cmd /k "cd backend && npm run dev"

echo [2/2] Starting Frontend Client (Port 5173)...
start "IMAM Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ==========================================
echo ✅ Servers are launching in new windows!
echo 👉 Backend: Waiting for "Server running on port 5000"
echo 👉 Frontend: Waiting for "Local: http://localhost:5173"
echo.
echo Once ready, open http://localhost:5173 in your browser.
echo ==========================================
pause
