@echo off
title Heritage and Cultural Preservation - Dev Environment
color 0A

echo ============================================================
echo   Heritage and Cultural Preservation - Starting All Services
echo ============================================================
echo.

:: -------------------------------------------------------
:: 1. Start PostgreSQL (PostGIS) via Docker Compose
:: -------------------------------------------------------
echo [1/4] Starting PostgreSQL (PostGIS) database via Docker...
cd /d "%~dp0docker"
docker compose up -d
if %errorlevel% neq 0 (
    echo [WARN] Docker Compose failed. Make sure Docker Desktop is running.
    echo        The backend will fall back to local SQLite if DATABASE_URL is not set.
) else (
    echo [OK] PostgreSQL database started on port 5432.
)
echo.

:: -------------------------------------------------------
:: 2. Wait for database to be ready
:: -------------------------------------------------------
echo [2/4] Waiting for database to initialize...
timeout /t 5 /nobreak >nul
echo [OK] Proceeding...
echo.

:: -------------------------------------------------------
:: 3. Start Backend (FastAPI + Uvicorn)
:: -------------------------------------------------------
echo [3/4] Starting Backend server (FastAPI on port 8000)...
cd /d "%~dp0backend"
start "Backend - FastAPI" cmd /k ".venv\Scripts\python.exe run_server.py"
echo [OK] Backend server launched in a new window.
echo.

:: -------------------------------------------------------
:: 4. Start Frontend (Vite Dev Server)
:: -------------------------------------------------------
echo [4/4] Starting Frontend dev server (Vite on port 5173)...
cd /d "%~dp0frontend"
start "Frontend - Vite" cmd /k "npm run dev"
echo [OK] Frontend dev server launched in a new window.
echo.

:: -------------------------------------------------------
:: Done
:: -------------------------------------------------------
echo ============================================================
echo   All services launched!
echo -----------------------------------------------------------
echo   Backend  : http://127.0.0.1:8000
echo   Frontend : http://localhost:5173
echo   API Docs : http://127.0.0.1:8000/docs
echo   Database : localhost:5432 (PostGIS) or SQLite fallback
echo ============================================================
echo.
echo Press any key to close this launcher window...
pause >nul
