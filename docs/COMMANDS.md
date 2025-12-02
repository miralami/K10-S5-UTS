# Project Commands Reference (Windows PowerShell)

This file lists common commands to install, run, test, lint, and generate protos across all services. Use Windows PowerShell 5.1 (`powershell.exe`).

## Root Workspace
- Install all services:
```powershell
scripts\install-all.ps1
```
- Run all services (if configured):
```powershell
scripts\run-all.ps1
```

## Frontend (Vite + React)
- Change directory:
```powershell
Set-Location frontend
```
- Install dependencies:
```powershell
npm install
```
- Start dev server:
```powershell
npm run dev
```
- Build:
```powershell
npm run build
```
- Preview build:
```powershell
npm run preview
```
- Lint:
```powershell
npm run lint
```
- Auto-fix lint:
```powershell
npm run lint:fix
```
- Tests:
```powershell
npm test
```

## Backend (Laravel PHP)
- Change directory:
```powershell
Set-Location backend
```
- Install dependencies:
```powershell
composer install
```
- Copy env and generate key:
```powershell
Copy-Item .env.example .env; php artisan key:generate
```
- Run migrations:
```powershell
php artisan migrate
```
- Seed database:
```powershell
php artisan db:seed
```
- Run server:
```powershell
php artisan serve
```
- Clear caches:
```powershell
php artisan cache:clear; php artisan config:clear; php artisan route:clear; php artisan view:clear
```
- Run tests (Pest/PHPUnit):
```powershell
php artisan test
```

## AI Service (Python)
- Change directory:
```powershell
Set-Location ai-service
```
- Create venv and install:
```powershell
python -m venv .venv; .\.venv\Scripts\Activate.ps1; pip install -r requirements.txt
```
- Start server:
```powershell
.\.venv\Scripts\Activate.ps1; python server.py
```
- Generate Python gRPC stubs (if applicable):
```powershell
python generate_proto.py
```

## WebSocket Service (Node.js)
- Change directory:
```powershell
Set-Location websocket-service
```
- Install dependencies:
```powershell
npm install
```
- Start server:
```powershell
npm run server:start
```
- Dev mode:
```powershell
npm run server:dev
```

## Proto Generation (AI Service Only)
- Generate Python gRPC stubs from ai.proto:
```powershell
Set-Location ai-service; python generate_proto.py
```

## Environment & Utilities
- Open docs index:
```powershell
Start-Process .\docs\README.md
```
- Check Node version:
```powershell
node -v; npm -v
```
- Check PHP and Composer:
```powershell
php -v; composer -V
```
- Check Python:
```powershell
python --version; pip --version
```

## Troubleshooting
- If a port is busy, change it in the relevant service config or run with a custom port (examples):
```powershell
# Frontend custom port
npm run dev -- --port 5174

# Laravel serve on custom port
php artisan serve --port=8001
```
- If lint fails in `frontend`, try auto-fix then re-run:
```powershell
npm run lint:fix; npm run lint
```
- If migrations fail, ensure DB credentials in `backend/.env` and retry:
```powershell
php artisan migrate:fresh --seed
```
