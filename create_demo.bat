@echo off
chcp 936 >nul
title NearUs - Create Demo Data

echo.
echo ========================================
echo      NeighborAPP Create Demo Data
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
pip install -r requirements.txt --no-warn-script-location
if errorlevel 1 (
    echo ERROR: Python dependencies installation failed
    pause
    exit /b 1
)
echo Python dependencies installed successfully

echo.
echo Creating demo data...
echo.

:: Run Python script to create demo data
echo Running demo data creation script...
call venv\Scripts\activate.bat
python create_demo_data.py
if errorlevel 1 (
    echo ERROR: Demo data creation failed
    pause
    exit /b 1
)

echo.
echo Demo data created successfully!
echo.
echo Test Accounts:
echo    Admin: admin / admin123
echo    Moderator: moderator / mod123
echo    Merchant: merchant / mer123
echo    VIP User: vipuser / vip123
echo    Regular User: zhangsan / user123
echo.
echo Usage:
echo    - Demo data has been created
echo    - Start services, use start_app.bat
echo    - Stop services, use stop_app.bat
echo.
pause
