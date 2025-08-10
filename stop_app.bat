@echo off
title NearUs - Stop Services

echo.
echo ========================================
echo        Stop NeighborAPP Services
echo ========================================
echo.

echo Stopping services...

:: Stop frontend service (port 3000)
echo Stopping frontend service (port: 3000)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do (
    taskkill /f /pid %%a >nul 2>&1
)

:: Stop backend service (port 5000)
echo Stopping backend service (port: 5000)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000') do (
    taskkill /f /pid %%a >nul 2>&1
)

:: Close related windows
echo Closing related windows...
taskkill /f /fi "WINDOWTITLE eq NearUs - Backend Service*" >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq NearUs - Frontend Service*" >nul 2>&1

echo.
echo Services stopped!
echo.
echo Usage:
echo    - If services are still running, use force_stop.bat
echo    - To restart, use start_app.bat
echo.
pause
