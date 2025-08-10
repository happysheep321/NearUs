# 邻里APP - PowerShell停止脚本
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "           邻里APP - 停止服务" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[查找] 正在查找并关闭相关进程..." -ForegroundColor Yellow

# 关闭Node.js进程
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    foreach ($process in $nodeProcesses) {
        Write-Host "[关闭] 关闭Node.js进程 $($process.Id)" -ForegroundColor Red
        Stop-Process -Id $process.Id -Force
    }
} else {
    Write-Host "[信息] 未找到Node.js进程" -ForegroundColor Gray
}

# 关闭Python进程
$pythonProcesses = Get-Process -Name "python" -ErrorAction SilentlyContinue
if ($pythonProcesses) {
    foreach ($process in $pythonProcesses) {
        Write-Host "[关闭] 关闭Python进程 $($process.Id)" -ForegroundColor Red
        Stop-Process -Id $process.Id -Force
    }
} else {
    Write-Host "[信息] 未找到Python进程" -ForegroundColor Gray
}

# 关闭npm进程
$npmProcesses = Get-Process -Name "npm" -ErrorAction SilentlyContinue
if ($npmProcesses) {
    foreach ($process in $npmProcesses) {
        Write-Host "[关闭] 关闭npm进程 $($process.Id)" -ForegroundColor Red
        Stop-Process -Id $process.Id -Force
    }
} else {
    Write-Host "[信息] 未找到npm进程" -ForegroundColor Gray
}

# 关闭PowerShell进程（排除当前进程）
$psProcesses = Get-Process -Name "powershell" -ErrorAction SilentlyContinue | Where-Object { $_.Id -ne $PID }
if ($psProcesses) {
    foreach ($process in $psProcesses) {
        Write-Host "[关闭] 关闭PowerShell进程 $($process.Id)" -ForegroundColor Red
        Stop-Process -Id $process.Id -Force
    }
} else {
    Write-Host "[信息] 未找到其他PowerShell进程" -ForegroundColor Gray
}

Write-Host ""
Write-Host "[完成] 所有服务已停止！" -ForegroundColor Green
Write-Host ""

Read-Host "按回车键退出"
