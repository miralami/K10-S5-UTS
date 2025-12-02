# Documentation Index

Welcome to the centralized documentation for K10-S5-UTS.

## Contents

- Architecture Overview: `ARCHITECTURE.md`
- CI/CD Pipeline: `ci-explanation/CI-IMPLEMENTATION.md`
- Commands Reference: `COMMANDS.md`
- Getting Started (Setup & Run)
- Services & Ports
- Environment Variables
- Troubleshooting

## Getting Started (Windows)

```powershell
# 1. Install dependencies
.\scripts\install-all.ps1

# 2. Configure backend .env (Database & API Keys)
# 3. Run migrations
cd backend; php artisan migrate --seed; cd ..

# 4. Start all services
npm run dev
```

Access:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- WebSocket: ws://localhost:8080

## Services & Ports

- Frontend (Vite): 5173
- Backend (Laravel): 8000
- WebSocket Service (Node): 8080
- AI Service (Python gRPC): 50052

## Environment Variables

Backend `.env` essentials:

```ini
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=uts_sem5
DB_USERNAME=root
DB_PASSWORD=

GOOGLE_GENAI_API_KEY=your_gemini_api_key_here
AI_GRPC_ENABLED=true
AI_GRPC_HOST=localhost
AI_GRPC_PORT=50052
```

## Troubleshooting

- Enable PowerShell scripts: `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser`
- Ensure ports 8000, 5173, 8080, 50052 are free
- Python in PATH if using AI service
