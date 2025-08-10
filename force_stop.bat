@echo off
title NearUs - Force Stop Services

echo.
echo ========================================
echo      Force Stop NeighborAPP Services
echo ========================================
echo.

echo Force stopping all related services...

:: Force stop Python processes
echo Stopping Python processes...
taskkill /f /im python.exe >nul 2>&1
taskkill /f /im pythonw.exe >nul 2>&1

:: Force stop Node.js processes
echo Stopping Node.js processes...
taskkill /f /im node.exe >nul 2>&1

:: Force stop npm processes
echo Stopping npm processes...
taskkill /f /im npm.cmd >nul 2>&1

:: Force stop port occupied processes
echo Stopping port occupied processes...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do (
    taskkill /f /pid %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000') do (
    taskkill /f /pid %%a >nul 2>&1
)

:: Close related windows
echo Closing related windows...
taskkill /f /fi "WINDOWTITLE eq NearUs*" >nul 2>&1

echo.
echo Force stop completed!
echo.
echo Usage:
echo    - All related processes have been force terminated
echo    - To restart, use start_app.bat
echo.
pause
