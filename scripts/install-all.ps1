<#
.SYNOPSIS
    Install all dependencies for the UTS Mood Journal project.

.DESCRIPTION
    This script installs dependencies for all services:
    - Backend (Laravel/PHP)
    - Frontend (React/Node.js)
    - WebSocket Service (Node.js)
    - AI Service (Python) - optional

.EXAMPLE
    .\scripts\install-all.ps1
    .\scripts\install-all.ps1 -SkipPython
#>

param(
    [switch]$SkipPython,
    [switch]$SkipBackend,
    [switch]$SkipFrontend,
    [switch]$SkipWebSocket
)

$ErrorActionPreference = "Stop"
$RootDir = Split-Path -Parent $PSScriptRoot

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  UTS Mood Journal - Install All" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "  [OK] Node.js $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  [ERROR] Node.js not found. Install from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Check PHP
try {
    $phpVersion = php --version | Select-Object -First 1
    Write-Host "  [OK] $phpVersion" -ForegroundColor Green
} catch {
    Write-Host "  [ERROR] PHP not found. Install PHP 8.2+" -ForegroundColor Red
    exit 1
}

# Check Composer
try {
    $composerVersion = composer --version
    Write-Host "  [OK] $composerVersion" -ForegroundColor Green
} catch {
    Write-Host "  [ERROR] Composer not found. Install from https://getcomposer.org" -ForegroundColor Red
    exit 1
}

# Check Python (optional)
if (-not $SkipPython) {
    try {
        $pythonVersion = python --version
        Write-Host "  [OK] $pythonVersion" -ForegroundColor Green
    } catch {
        Write-Host "  [WARN] Python not found. AI service will be skipped." -ForegroundColor Yellow
        $SkipPython = $true
    }
}

Write-Host ""

# Install Backend (Laravel)
if (-not $SkipBackend) {
    Write-Host "Installing Backend (Laravel)..." -ForegroundColor Yellow
    Push-Location "$RootDir\backend"
    
    # Copy .env if not exists
    if (-not (Test-Path ".env")) {
        if (Test-Path ".env.example") {
            Copy-Item ".env.example" ".env"
            Write-Host "  Created .env from .env.example" -ForegroundColor Gray
        }
    }
    
    # Install composer dependencies
    composer install --no-interaction --prefer-dist
    
    # Generate app key if not set
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match "APP_KEY=$" -or $envContent -match "APP_KEY=XXXX") {
        php artisan key:generate
        Write-Host "  Generated APP_KEY" -ForegroundColor Gray
    }
    
    Pop-Location
    Write-Host "  [DONE] Backend installed" -ForegroundColor Green
    Write-Host ""
}

# Install Frontend (React)
if (-not $SkipFrontend) {
    Write-Host "Installing Frontend (React)..." -ForegroundColor Yellow
    Push-Location "$RootDir\frontend"
    npm install
    Pop-Location
    Write-Host "  [DONE] Frontend installed" -ForegroundColor Green
    Write-Host ""
}

# Install WebSocket Service
if (-not $SkipWebSocket) {
    Write-Host "Installing WebSocket Service..." -ForegroundColor Yellow
    Push-Location "$RootDir\websocket-service"
    npm install
    Pop-Location
    Write-Host "  [DONE] WebSocket service installed" -ForegroundColor Green
    Write-Host ""
}

# Install AI Service (Python)
if (-not $SkipPython) {
    Write-Host "Installing AI Service (Python)..." -ForegroundColor Yellow
    Push-Location "$RootDir\ai-service"
    
    # Create virtual environment if not exists
    if (-not (Test-Path "venv")) {
        python -m venv venv
        Write-Host "  Created virtual environment" -ForegroundColor Gray
    }
    
    # Activate and install
    & ".\venv\Scripts\Activate.ps1"
    pip install -r requirements.txt --quiet
    deactivate
    
    Pop-Location
    Write-Host "  [DONE] AI service installed" -ForegroundColor Green
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Installation Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Configure backend\.env with your database and API keys"
Write-Host "  2. Run: cd backend; php artisan migrate"
Write-Host "  3. Run: .\scripts\run-all.ps1"
Write-Host ""
