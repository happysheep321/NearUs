# NearUs Frontend Service PowerShell Script
$host.UI.RawUI.WindowTitle = "NearUs - Frontend Service"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "        NearUs Frontend Service" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 切换到前端目录
Set-Location "$PSScriptRoot\frontend"

Write-Host "Starting frontend service on port 3000..." -ForegroundColor Green
Write-Host "Window Title: NearUs - Frontend Service" -ForegroundColor Yellow
Write-Host ""

# 显示一个持续的信息栏
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║                    NearUs - Frontend Service                ║" -ForegroundColor Magenta
Write-Host "║                    正在运行中...                            ║" -ForegroundColor Magenta
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host ""

# 启动前端服务
npm start

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
