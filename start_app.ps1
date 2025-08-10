# 邻里APP - PowerShell启动脚本
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "           邻里APP - 一键启动" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 检查Python是否安装
try {
    $pythonVersion = python --version 2>&1
    Write-Host "[检查] Python版本: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "[错误] 未找到Python，请先安装Python 3.7+" -ForegroundColor Red
    Read-Host "按回车键退出"
    exit 1
}

# 检查Node.js是否安装
try {
    $nodeVersion = node --version 2>&1
    Write-Host "[检查] Node.js版本: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[错误] 未找到Node.js，请先安装Node.js 16+" -ForegroundColor Red
    Read-Host "按回车键退出"
    exit 1
}

# 检查npm是否安装
try {
    $npmVersion = npm --version 2>&1
    Write-Host "[检查] npm版本: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "[错误] 未找到npm，请确保Node.js安装正确" -ForegroundColor Red
    Read-Host "按回车键退出"
    exit 1
}

Write-Host "[检查] 检查依赖安装状态..." -ForegroundColor Yellow

# 检查Python依赖
if (-not (Test-Path "venv")) {
    Write-Host "[安装] 创建Python虚拟环境..." -ForegroundColor Yellow
    python -m venv venv
}

Write-Host "[安装] 激活虚拟环境并安装Python依赖..." -ForegroundColor Yellow
& "venv\Scripts\Activate.ps1"
pip install -r requirements.txt --quiet

# 检查前端依赖
if (-not (Test-Path "frontend\node_modules")) {
    Write-Host "[安装] 安装前端依赖..." -ForegroundColor Yellow
    Set-Location frontend
    npm install --silent
    Set-Location ..
}

Write-Host ""
Write-Host "[启动] 启动应用服务..." -ForegroundColor Green
Write-Host ""
Write-Host "[服务] 后端服务：http://localhost:5000" -ForegroundColor Cyan
Write-Host "[服务] 前端服务：http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "[提示] 按 Ctrl+C 停止服务" -ForegroundColor Yellow
Write-Host ""

# 启动后端（新窗口）
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& 'venv\Scripts\Activate.ps1'; python app.py" -WindowStyle Normal

# 等待后端启动
Start-Sleep -Seconds 3

# 启动前端（新窗口）
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location frontend; npm start" -WindowStyle Normal

# 等待前端启动
Write-Host "[等待] 等待服务启动完成..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

# 自动打开浏览器
Write-Host "[浏览器] 自动打开浏览器..." -ForegroundColor Green
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "[完成] 应用启动完成！" -ForegroundColor Green
Write-Host ""
Write-Host "[说明] 使用说明：" -ForegroundColor Cyan
Write-Host "        • 前端地址：http://localhost:3000" -ForegroundColor White
Write-Host "        • 后端地址：http://localhost:5000" -ForegroundColor White
Write-Host "        • 测试账号：admin / admin123" -ForegroundColor White
Write-Host "        • 普通用户：zhangsan / user123" -ForegroundColor White
Write-Host ""
Write-Host "[提示] 关闭此窗口不会停止服务，需要在各服务窗口中按 Ctrl+C 停止" -ForegroundColor Yellow
Write-Host ""

Read-Host "按回车键退出"
