@echo off
title NearUs - Main Console

echo.
echo ========================================
echo        NeighborAPP Startup Script
echo ========================================
echo.

:: Update Python PATH to use Python 3.12
set "PYTHON_PATH=C:\Program Files\Python312"
set "PYTHON_SCRIPTS=C:\Program Files\Python312\Scripts"
set "USER_PYTHON_SCRIPTS=C:\Users\LEGION\AppData\Roaming\Python\Python312\Scripts"

if exist "%PYTHON_PATH%\python.exe" (
    set "PATH=%PYTHON_PATH%;%PYTHON_SCRIPTS%;%USER_PYTHON_SCRIPTS%;%PATH%"
    echo Updated PATH to use Python 3.12
) else (
    echo Warning: Python 3.12 not found at %PYTHON_PATH%
    echo Using system Python
    set "PATH=%USER_PYTHON_SCRIPTS%;%PATH%"
)

:: Check Python environment
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not detected, please install Python 3.12+
    pause
    exit /b 1
)

:: Check Node.js environment
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not detected, please install Node.js 16+
    pause
    exit /b 1
)

echo Environment check passed
echo.

:: Check virtual environment
if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
    echo Virtual environment created
)

:: Activate virtual environment and install dependencies
echo Installing Python dependencies...
call venv\Scripts\activate.bat

:: Check if pip needs upgrade
echo Checking pip version...
python -m pip install --upgrade pip >nul 2>&1

echo Installing Python dependencies...
pip install -r requirements.txt --no-warn-script-location
if errorlevel 1 (
    echo.
    echo ERROR: Python dependencies installation failed
    echo.
    echo Possible solutions:
    echo    1. Run fix_venv.bat to repair virtual environment
    echo    2. Check network connection
    echo    3. Try manual dependency installation
    echo.
    pause
    exit /b 1
)
echo Python dependencies installed successfully

:: Check frontend dependencies
if not exist "frontend\node_modules" (
    echo Installing frontend dependencies...
    cd frontend
    npm install
    if errorlevel 1 (
        echo ERROR: Frontend dependencies installation failed
        pause
        exit /b 1
    )
    cd ..
    echo Frontend dependencies installed successfully
)

echo.
echo Starting services...
echo.

:: Start backend service
echo Starting backend service (port: 5000)...
start "NearUs - Backend Service" powershell -ExecutionPolicy Bypass -File "start_backend.ps1"

:: Wait for backend to start
timeout /t 5 /nobreak >nul

:: Start frontend service
echo Starting frontend service (port: 3000)...
start "NearUs - Frontend Service" powershell -ExecutionPolicy Bypass -File "start_frontend.ps1"

echo.
echo Services started successfully!
echo.
echo Frontend URL: http://localhost:3000
echo Backend URL: http://localhost:5000
echo.
echo Usage:
echo    - Stop services: use stop_app.bat
echo    - Force stop: use force_stop.bat
echo    - Create demo data: use create_demo.bat
echo    - Fix virtual environment: use fix_venv.bat
echo.
echo Test Accounts:
echo    Admin: admin / admin123
echo    Moderator: moderator / mod123
echo    Merchant: merchant / mer123
echo    VIP User: vipuser / vip123
echo    Regular User: zhangsan / user123
echo.
pause
