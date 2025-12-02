<#
.SYNOPSIS
    Run all services for the UTS Mood Journal project.

.DESCRIPTION
    Starts all services in separate terminal windows:
    - Backend (Laravel) on port 8000
    - Frontend (React) on port 5173
    - WebSocket Service on port 8080
    - AI Service (Python) on port 50052 (optional)

.EXAMPLE
    .\scripts\run-all.ps1
    .\scripts\run-all.ps1 -SkipAI
    .\scripts\run-all.ps1 -SingleTerminal
#>

param(
    [switch]$SkipAI,
    [switch]$SingleTerminal
)

$RootDir = Split-Path -Parent $PSScriptRoot

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  UTS Mood Journal - Run All Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($SingleTerminal) {
    # Run all in single terminal using concurrently (requires npm install -g concurrently)
    Write-Host "Starting all services in single terminal..." -ForegroundColor Yellow
    Write-Host "(Press Ctrl+C to stop all)" -ForegroundColor Gray
    Write-Host ""
    
    $commands = @(
        "`"cd backend && php artisan serve`"",
        "`"cd frontend && npm run dev`"",
        "`"cd websocket-service && npm run server:start`""
    )
    
    if (-not $SkipAI) {
        $commands += "`"cd ai-service && .\venv\Scripts\python.exe server.py`""
    }
    
    $names = "backend,frontend,websocket"
    if (-not $SkipAI) { $names += ",ai" }
    
    $colors = "blue,green,yellow"
    if (-not $SkipAI) { $colors += ",magenta" }
    
    Push-Location $RootDir
    npx concurrently -n $names -c $colors $commands
    Pop-Location
    
} else {
    # Run each in separate terminal window
    
    # Backend (Laravel)
    Write-Host "Starting Backend (Laravel) on port 8000..." -ForegroundColor Blue
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$RootDir\backend'; Write-Host 'Backend (Laravel)' -ForegroundColor Blue; php artisan serve"
    
    # Frontend (React)
    Write-Host "Starting Frontend (React) on port 5173..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$RootDir\frontend'; Write-Host 'Frontend (React)' -ForegroundColor Green; npm run dev"
    
    # WebSocket Service
    Write-Host "Starting WebSocket on port 8080..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$RootDir\websocket-service'; Write-Host 'WebSocket Service' -ForegroundColor Yellow; npm run server:start"
    
    # AI Service (Python) - optional
    if (-not $SkipAI) {
        if (Test-Path "$RootDir\ai-service\venv") {
            Write-Host "Starting AI Service on port 50052..." -ForegroundColor Magenta
            Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$RootDir\ai-service'; Write-Host 'AI Service (Python)' -ForegroundColor Magenta; .\venv\Scripts\python.exe server.py"
        } else {
            Write-Host "[SKIP] AI Service - venv not found. Run install-all.ps1 first." -ForegroundColor Yellow
        }
    }
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  All services started!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Access:" -ForegroundColor Yellow
    Write-Host "  Frontend:  http://localhost:5173" -ForegroundColor White
    Write-Host "  Backend:   http://localhost:8000" -ForegroundColor White
    Write-Host "  WebSocket: ws://localhost:8080" -ForegroundColor White
    if (-not $SkipAI) {
        Write-Host "  AI gRPC:   localhost:50052" -ForegroundColor White
    }
    Write-Host ""
    Write-Host "Close terminal windows to stop services." -ForegroundColor Gray
}
