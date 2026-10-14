@echo off
TITLE RescuELINK - Production Server
COLOR 0A

echo ===============================================================================
echo   RescuELINK: Autonomous Smart City Emergency Dispatch & Resilience Platform
echo   PRODUCTION SERVER LAUNCHER
echo ===============================================================================
echo.

echo [1/2] Building React 19 Frontend for Production...
cd /d "%~dp0frontend"
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Frontend build failed. Please inspect errors above.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/2] Starting Production ASGI Server on Port 8000...
echo.
echo -------------------------------------------------------------------------------
echo   PRODUCTION URL:  http://localhost:8000
echo   API DOCS:        http://localhost:8000/docs
echo   HEALTH STATUS:   http://localhost:8000/health
echo -------------------------------------------------------------------------------
echo.

cd /d "%~dp0backend"
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --proxy-headers --forwarded-allow-ips *

pause
