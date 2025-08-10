# NearUs Backend Service PowerShell Script
$host.UI.RawUI.WindowTitle = "NearUs - Backend Service"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "        NearUs Backend Service" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 切换到项目根目录
Set-Location $PSScriptRoot

Write-Host "Activating virtual environment..." -ForegroundColor Green
& ".\venv\Scripts\Activate.ps1"

Write-Host "Starting backend service on port 5000..." -ForegroundColor Green
Write-Host "Window Title: NearUs - Backend Service" -ForegroundColor Yellow
Write-Host ""

# 创建一个定时器来保持窗口标题
$timer = New-Object System.Timers.Timer
$timer.Interval = 1000  # 每秒执行一次
$timer.AutoReset = $true
$timer.Add_Elapsed({
    $host.UI.RawUI.WindowTitle = "NearUs - Backend Service"
})

# 启动定时器
$timer.Start()

try {
    # 启动后端服务
    python app.py
}
finally {
    # 停止定时器
    $timer.Stop()
    $timer.Dispose()
}

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
