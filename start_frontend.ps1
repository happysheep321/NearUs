# NearUs Frontend Service PowerShell Script
$host.UI.RawUI.WindowTitle = "NearUs - Frontend Service"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "        NearUs Frontend Service" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Switch to frontend directory
Set-Location "$PSScriptRoot\frontend"

Write-Host "Starting frontend service on port 3000..." -ForegroundColor Green
Write-Host "Window Title: NearUs - Frontend Service" -ForegroundColor Yellow
Write-Host ""

# Display a continuous information bar
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║                    NearUs - Frontend Service                ║" -ForegroundColor Magenta
Write-Host "║                    Running...                               ║" -ForegroundColor Magenta
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host ""

# Start frontend service
npm start

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
