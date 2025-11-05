# Journal Weekly Summary API (Laravel)

## Requirements
- PHP 8.2+
- Composer
- MySQL
- Node (optional, only for frontend)

## Setup
1. Clone repo and install dependencies:
   - composer install

2. Environment:
   - Copy .env.example to .env
   - Set DB_*
   - Set GOOGLE_GENAI_API_KEY
   - Optional: GOOGLE_GENAI_MODEL=gemini-2.5-flash

3. Clear caches after editing .env:
   - php artisan config:clear && php artisan cache:clear

4. Database:
   - php artisan migrate:fresh --seed
   - Seeder creates sample users and notes for the current week.

5. Run server:
   - php artisan serve
   - Base URL: http://127.0.0.1:8000

## Endpoint
- GET /api/journal/weekly-summary

### Query Params
- week_ending (optional, ISO date). If omitted, uses current week.
- user_id (optional, must exist in users.id). If omitted, returns all users’ notes for that week.

### Example
- curl "http://127.0.0.1:8000/api/journal/weekly-summary"
- curl -G "http://127.0.0.1:8000/api/journal/weekly-summary" \
  --data-urlencode "week_ending=2025-11-09" \
  --data-urlencode "user_id=1"

### Response (200)
{
  "week": {"start":"YYYY-MM-DD","end":"YYYY-MM-DD"},
  "filters": {"userId": 1 | null},
  "notes": [{ "id": n, "userId": n, "title": "...", "body": "...", "createdAt": "..." }],
  "analysis": {
    "summary": "...",
    "dominantMood": "...",
    "moodScore": 0-100 | null,
    "highlights": [],
    "advice": [],
    "affirmation": string | null
  }
}

### Errors
- 502 with message "Failed to get Gemini analysis: ..." if Gemini request fails (API key, model, quota, SSL).
- 500 if GOOGLE_GENAI_API_KEY missing.

## Troubleshooting
- After editing .env: php artisan config:clear && php artisan cache:clear
- SSL (Windows): configure curl.cainfo in php.ini if you see cURL SSL errors.
- Logs: storage/logs/laravel.log