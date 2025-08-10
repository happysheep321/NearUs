# NearUs Backend Service PowerShell Script
$host.UI.RawUI.WindowTitle = "NearUs - Backend Service"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "        NearUs Backend Service" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Switch to project root directory
Set-Location $PSScriptRoot

Write-Host "Activating virtual environment..." -ForegroundColor Green
& ".\venv\Scripts\Activate.ps1"

Write-Host "Starting backend service on port 5000..." -ForegroundColor Green
Write-Host "Window Title: NearUs - Backend Service" -ForegroundColor Yellow
Write-Host ""

# Create a timer to maintain window title
$timer = New-Object System.Timers.Timer
$timer.Interval = 1000  # Execute every second
$timer.AutoReset = $true
$timer.Add_Elapsed({
    $host.UI.RawUI.WindowTitle = "NearUs - Backend Service"
})

# Start timer
$timer.Start()

try {
    # Start backend service
    python app.py
}
finally {
    # Stop timer
    $timer.Stop()
    $timer.Dispose()
}

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
