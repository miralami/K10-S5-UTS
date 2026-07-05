# Documentation Index

Welcome to the centralized documentation for K10-S5-UTS.

## Contents

- **Mobile App Technical Overview**: [`MOBILE-VERSION.md`](MOBILE-VERSION.md) — full feature inventory, architecture, differences from web
- Architecture Overview: `ARCHITECTURE.md`
- CI/CD Pipeline: `ci-explanation/CI-IMPLEMENTATION.md`
- Commands Reference: `COMMANDS.md`
- Getting Started (Setup & Run)
- Services & Ports
- Environment Variables
- Troubleshooting

## Getting Started

### Web (all services) — Windows
```powershell
# 1. Install dependencies
.\scripts\install-all.ps1

# 2. Configure backend .env (Database & API Keys)
# 3. Run migrations
cd backend; php artisan migrate --seed; cd ..

# 4. Start all services
npm run dev
```

### Mobile (React Native / Expo)
```bash
cd mobile
npm install
cp .env.example .env   # then edit EXPO_PUBLIC_API_BASE_URL
npx expo start
```
See [`MOBILE-VERSION.md`](MOBILE-VERSION.md) for full mobile documentation.

Access:
- Web Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- WebSocket: ws://localhost:8080
- **Mobile**: Expo Go QR code at `http://localhost:8081`

## Services & Ports

| Service | Port | Notes |
|---------|------|-------|
| Backend (Laravel) | 8000 | REST API |
| Web Frontend (Vite) | 5173 | React SPA |
| **Mobile (Expo Metro)** | **8081** | **React Native dev server** |
| WebSocket (Node) | 8080 | Real-time chat |
| AI Service (Python gRPC) | 50052 | Optional |

## Health Checks

- Backend API: `GET /api/health` (`http://localhost:8000/api/health`)
- WebSocket Service: `GET /health` (`http://localhost:8080/health`)

## Environment Variables

### Backend `.env`
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

### Mobile `.env`
```
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000
```

## Troubleshooting

- Enable PowerShell scripts: `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser`
- Ensure ports 8000, 5173, 8080, 50052 are free
- **For mobile on a physical device**: use your LAN IP (not `localhost`) in `EXPO_PUBLIC_API_BASE_URL`
- **For Android emulator**: use `http://10.0.2.2:8000`
- Python in PATH if using AI service
