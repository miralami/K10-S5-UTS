# Mood Journal - AI Coding Agent Instructions

## Personal Notes
- Always try to give notes/comments in Indonesian at key parts of the code, especially in complex logic areas.

## Architecture Overview

This is a **full-stack mood journal application** with JWT authentication:
- **Backend**: Laravel 12 API (`laravel/`) using JWT (tymon/jwt-auth), Gemini AI for mood analysis
- **Frontend**: React 19 + Vite (`reactjs/`) with Chakra UI, React Router v6
- **Communication**: REST API with JWT Bearer tokens, CORS enabled

### Key Data Flow
1. User writes journal notes → stored in `journal_notes` table
2. Daily/weekly summaries triggered → `GeminiMoodAnalysisService` analyzes mood
3. Analysis cached in `daily_journal_analyses` and `weekly_journal_analyses` tables
4. Frontend displays notes + AI-generated insights (mood scores, highlights, advice)

## Critical Setup Commands

### First-Time Setup
```bash
# Backend (laravel/)
composer install
php artisan jwt:secret              # Generate JWT_SECRET in .env
php artisan migrate:fresh --seed    # Creates sample data for current week
php artisan serve                   # http://localhost:8000

# Frontend (reactjs/)
npm install
npm run dev                         # http://localhost:5173
```

### After .env Changes
```bash
php artisan config:clear && php artisan cache:clear
```

### Run Both Simultaneously
```bash
# From laravel/ directory
composer run dev-all    # Runs Laravel server + queue + Vite + React dev server
```

## Authentication Pattern (JWT)

### Backend Response Format
All auth endpoints return standardized format:
```json
{
  "status": "success|error",
  "data": {
    "access_token": "...",
    "user": {...}
  },
  "message": "..." // only on error
}
```

### Frontend Auth Flow
- **Login/Register**: `authService.js` saves `token` and `user` to localStorage
- **Protected Routes**: `ProtectedRoute` component checks `isAuthenticated()`
- **API Calls**: `journalService.js` auto-includes `Authorization: Bearer ${token}` header
- **401 Handling**: Auto-redirects to `/login` via `handleResponse()` in journalService

### Adding Protected Routes
```php
// Backend: laravel/routes/api.php
Route::middleware('auth:api')->group(function () {
    Route::get('your-endpoint', [YourController::class, 'method']);
});
```

```javascript
// Frontend: reactjs/src/services/yourService.js
const token = localStorage.getItem('token');
headers: {
  'Authorization': `Bearer ${token}`,
  // ... other headers
}
```

## Service Architecture

### Backend Services (`app/Services/`)
- **GeminiMoodAnalysisService**: AI mood analysis via Google Gemini API
  - `analyzeDailyNotes()`: Single day analysis
  - `analyzeWeeklyNotes()`: Week-long summary
  - Returns: `{summary, dominantMood, moodScore, highlights, advice, affirmation}`
- **DailyJournalAnalysisService**: Caching layer for daily analyses
  - Checks cache → calls Gemini if needed → stores result

### Frontend Services (`reactjs/src/services/`)
- **authService.js**: Login, register, logout, token management
- **journalService.js**: CRUD for notes, fetch daily/weekly summaries
  - Auto-handles JWT in headers
  - `handleResponse()` manages errors, redirects on 401
  - `processDates()` normalizes date formats from backend

## Project-Specific Patterns

### Date Handling Convention
**Backend**: Laravel Carbon returns `CarbonInterface`, serialized as ISO 8601
**Frontend**: All dates normalized via `processDates()` before storage
- Date fields identified by suffixes: `_at`, `_date`, `At`, `Date`
- Dashboard uses `date-fns` with `id` locale for Indonesian formatting

### Error Response Consistency
Backend always returns:
```json
{
  "status": "error",
  "message": "User-friendly Indonesian message",
  "errors": {...} // validation errors only
}
```

Frontend catches and displays via Chakra UI `toast`:
```javascript
toast({
  title: 'Error title',
  description: error.message,
  status: 'error',
  duration: 5000,
});
```

### UI Component Patterns
- **GlassCard**: Reusable glassmorphism container (`components/GlassCard.jsx`)
- **Fixed Sidebar**: `SidebarLayout.jsx` uses `position: fixed` with logout button at bottom
- **Protected Routes**: Wrap with `<ProtectedRoute>` and `<Layout>` (see `App.jsx`)

## Environment Variables Required

### Laravel (.env)
```env
DB_CONNECTION=mysql
DB_DATABASE=your_db_name
GOOGLE_GENAI_API_KEY=your_gemini_api_key
GOOGLE_GENAI_MODEL=gemini-2.5-flash
JWT_SECRET=auto_generated_by_artisan_jwt_secret
JWT_TTL=60
```

### React (.env)
API URL hardcoded in services as `http://localhost:8000/api` - change if needed

## Common Tasks

### Adding New Journal Features
1. **Backend**: Create migration → model → controller → service (if AI needed) → route
2. **Frontend**: Add service method → update component → handle loading states
3. **Example**: See `JournalNoteController` + `journalService.listNotes()`

### Debugging AI Analysis
- Check `storage/logs/laravel.log` for Gemini API errors
- Common issues: API key missing, quota exceeded, SSL cert errors (Windows)
- Test prompt directly in `GeminiMoodAnalysisService::buildDailyPrompt()`

### Testing Protected Endpoints
```php
// In Pest/PHPUnit tests
$this->actingAs($user, 'api')->getJson('/api/journal/notes');
```

```bash
# CLI with curl
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/journal/notes
```

## Key Files Reference

- **Auth**: `JwtAuthController.php`, `authService.js`, `ProtectedRoute.jsx`
- **Journal Core**: `JournalNoteController.php`, `journalService.js`, `Home.jsx`, `Dashboard.jsx`
- **AI Analysis**: `GeminiMoodAnalysisService.php`, `DailyJournalAnalysisService.php`
- **Routing**: `laravel/routes/api.php`, `reactjs/src/App.jsx`
- **Config**: `laravel/config/services.php` (API keys), `laravel/config/jwt.php`

## Gotchas

1. **Sidebar not sticky?** Must use `position: fixed` + `ml={{ md: 72 }}` on content
2. **Notes not showing?** Check date comparison uses UTC: `isSameDay(utcNoteDate, utcSelectedDate)`
3. **401 errors?** Run `php artisan jwt:secret` if JWT_SECRET missing
4. **Gemini errors?** Verify API key in `.env`, run config:clear
5. **CORS issues?** Laravel CORS middleware already configured in `Kernel.php`
