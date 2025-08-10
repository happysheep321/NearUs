@echo off
chcp 65001 >nul
echo.
echo ╔══════════════════════════════════════╗
echo ║        🛑 邻里APP - 停止服务         ║
echo ╚══════════════════════════════════════╝
echo.

echo 🔍 正在查找并关闭相关进程...

REM 关闭Node.js进程
for /f "tokens=2" %%i in ('tasklist /fi "imagename eq node.exe" ^| find "node.exe"') do (
    echo 🔴 关闭Node.js进程 %%i
    taskkill /pid %%i /f >nul 2>&1
)

REM 关闭Python进程
for /f "tokens=2" %%i in ('tasklist /fi "imagename eq python.exe" ^| find "python.exe"') do (
    echo 🔴 关闭Python进程 %%i
    taskkill /pid %%i /f >nul 2>&1
)

REM 关闭npm进程
for /f "tokens=2" %%i in ('tasklist /fi "imagename eq npm.cmd" ^| find "npm.cmd"') do (
    echo 🔴 关闭npm进程 %%i
    taskkill /pid %%i /f >nul 2>&1
)

echo.
echo ✅ 所有服务已停止！
echo.
pause
