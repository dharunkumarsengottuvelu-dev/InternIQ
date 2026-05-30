# InternIQ — Start Redis for Windows
# Run this script before `npm run dev` in server/

$redisExe = "$PSScriptRoot\.redis-local\redis-server.exe"

# Check if Redis is already running
$running = Get-Process -Name "redis-server" -ErrorAction SilentlyContinue
if ($running) {
    Write-Host "✅ Redis is already running (PID: $($running.Id))" -ForegroundColor Green
    exit 0
}

# Start Redis in a background window
Write-Host "🚀 Starting Redis on port 6379..." -ForegroundColor Cyan
Start-Process -FilePath $redisExe -ArgumentList "--port 6379 --bind 127.0.0.1" -WindowStyle Minimized

# Wait for it to be ready
Start-Sleep -Seconds 2

# Verify
$ping = & "$PSScriptRoot\.redis-local\redis-cli.exe" ping 2>&1
if ($ping -eq "PONG") {
    Write-Host "✅ Redis is ready!" -ForegroundColor Green
} else {
    Write-Host "❌ Redis failed to start. Check .redis-local\redis-server.exe" -ForegroundColor Red
}
