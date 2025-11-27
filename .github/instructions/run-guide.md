# Project Run Guide

## Requirements
- PHP 8.1+ (8.2+ recommended)
- Composer
- MySQL / MariaDB
- Node.js (16+) and npm
- Git

## Critical Setup Commands

### First-Time Setup
```bash
# Backend (backend/)
cd backend
composer install
php artisan jwt:secret              # Generate JWT_SECRET in .env
php artisan migrate:fresh --seed    # Creates sample data for current week
php artisan serve                   # http://localhost:8000

# Frontend (frontend/)
cd frontend
npm install
npm run dev                         # http://localhost:5173

# WebSocket Service (grpc-service/)
cd grpc-service
npm install
npm run grpc:start                  # gRPC server on port 50051
```

### After .env Changes
```bash
cd backend
php artisan config:clear && php artisan cache:clear
```

### Run Both Simultaneously
```bash
# From backend/ directory
composer run dev-all    # Runs Laravel server + queue + Vite + React dev server
```

## Environment Variables Required

### Laravel (backend/.env)
```env
DB_CONNECTION=mysql
DB_DATABASE=your_db_name
GOOGLE_GENAI_API_KEY=your_gemini_api_key
GOOGLE_GENAI_MODEL=gemini-2.5-flash
JWT_SECRET=auto_generated_by_artisan_jwt_secret
JWT_TTL=60
```

### React (frontend/.env)
API URL hardcoded in services as `http://localhost:8000/api` - change if needed.

## Common Tasks

### Debugging AI Analysis
- Check `backend/storage/logs/laravel.log` for Gemini API errors
- Common issues: API key missing, quota exceeded, SSL cert errors (Windows)

### Testing Protected Endpoints
```bash
# CLI with curl
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/journal/notes
```

## Gotchas

1. **Sidebar not sticky?** Must use `position: fixed` + `ml={{ md: 72 }}` on content
2. **Notes not showing?** Check date comparison uses UTC: `isSameDay(utcNoteDate, utcSelectedDate)`
3. **401 errors?** Run `php artisan jwt:secret` if JWT_SECRET missing
4. **Gemini errors?** Verify API key in `.env`, run config:clear
5. **CORS issues?** Laravel CORS middleware already configured in `Kernel.php`
