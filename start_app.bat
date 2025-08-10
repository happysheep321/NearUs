@echo off
chcp 65001 >nul
echo.
echo ==========================================
echo           邻里APP - 一键启动
echo ==========================================
echo.

REM 检查Python是否安装
python --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未找到Python，请先安装Python 3.7+
    pause
    exit /b 1
)

REM 检查Node.js是否安装
node --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未找到Node.js，请先安装Node.js 16+
    pause
    exit /b 1
)

REM 检查npm是否安装
npm --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未找到npm，请确保Node.js安装正确
    pause
    exit /b 1
)

echo [检查] 检查依赖安装状态...

REM 检查Python依赖
if not exist "venv" (
    echo [安装] 创建Python虚拟环境...
    python -m venv venv
)

echo [安装] 激活虚拟环境并安装Python依赖...
call venv\Scripts\activate
pip install -r requirements.txt --quiet

REM 检查前端依赖
if not exist "frontend\node_modules" (
    echo [安装] 安装前端依赖...
    cd frontend
    npm install --silent
    cd ..
)

echo.
echo [启动] 启动应用服务...
echo.
echo [服务] 后端服务：http://localhost:5000
echo [服务] 前端服务：http://localhost:3000
echo.
echo [提示] 按 Ctrl+C 停止服务
echo.

REM 在新窗口启动后端
start "邻里APP-后端" cmd /k "call venv\Scripts\activate && python app.py"

REM 等待后端启动
timeout /t 3 /nobreak >nul

REM 在新窗口启动前端
start "邻里APP-前端" cmd /k "cd frontend && npm start"

REM 等待前端启动
echo [等待] 等待服务启动完成...
timeout /t 8 /nobreak >nul

REM 自动打开浏览器
echo [浏览器] 自动打开浏览器...
start http://localhost:3000

echo.
echo [完成] 应用启动完成！
echo.
echo [说明] 使用说明：
echo        • 前端地址：http://localhost:3000
echo        • 后端地址：http://localhost:5000
echo        • 测试账号：admin / admin123
echo        • 普通用户：zhangsan / user123
echo.
echo [提示] 关闭此窗口不会停止服务，需要在各服务窗口中按 Ctrl+C 停止
echo.
pause
