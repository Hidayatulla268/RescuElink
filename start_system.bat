@echo off
echo =====================================================================
echo Starting RescuELINK Autonomous Smart City Emergency Dispatch System
echo =====================================================================

start "RescuELINK Backend Server (FastAPI)" cmd /k "cd backend && python run.py"
timeout /t 3 /nobreak >nul
start "RescuELINK Frontend Console (Vite React)" cmd /k "cd frontend && npm run dev"

echo.
echo Both services are launching:
echo - Backend API:  http://localhost:8000 (Docs: http://localhost:8000/docs)
echo - Frontend HUD: http://localhost:5173
echo =====================================================================
