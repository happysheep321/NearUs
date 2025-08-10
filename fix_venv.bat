@echo off
title NearUs - Fix Virtual Environment

echo.
echo ========================================
echo        Fix Virtual Environment
echo ========================================
echo.

echo Fixing virtual environment issues...
echo.

:: Check if virtual environment exists
if exist "venv" (
    echo Found existing virtual environment, deleting...
    rmdir /s /q venv
    echo Virtual environment deleted
) else (
    echo No existing virtual environment found
)

echo.
echo Creating new virtual environment...

:: Update Python PATH to include user scripts
set "USER_PYTHON_SCRIPTS=C:\Users\LEGION\AppData\Roaming\Python\Python312\Scripts"
set "PATH=%USER_PYTHON_SCRIPTS%;%PATH%"

python -m venv venv
if errorlevel 1 (
    echo ERROR: Virtual environment creation failed
    pause
    exit /b 1
)
echo Virtual environment created successfully

echo.
echo Activating virtual environment...
call venv\Scripts\activate.bat

echo.
echo Upgrading pip...
python -m pip install --upgrade pip

echo.
echo Installing Python dependencies...
pip install -r requirements.txt --no-warn-script-location
if errorlevel 1 (
    echo ERROR: Python dependencies installation failed
    pause
    exit /b 1
)

echo.
echo Virtual environment fixed successfully!
echo.
echo Now you can:
echo    - Use start_app.bat to start services
echo    - Use create_demo.bat to create demo data
echo.
pause
