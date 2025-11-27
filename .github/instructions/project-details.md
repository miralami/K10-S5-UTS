# Project Detailed Description

## Architecture Overview

This is a **full-stack mood journal application** with JWT authentication:
- **Backend**: Laravel 12 API (`backend/`) using JWT (tymon/jwt-auth), Gemini AI for mood analysis
- **Frontend**: React 19 + Vite (`frontend/`) with Chakra UI, React Router v6
- **Real-time Service**: Node.js gRPC (`grpc-service/`) for typing indicators
- **Communication**: REST API with JWT Bearer tokens, CORS enabled; gRPC streams for real-time features

### Key Data Flow
1. User writes journal notes → stored in `journal_notes` table
2. Daily/weekly summaries triggered → `GeminiMoodAnalysisService` analyzes mood
3. Analysis cached in `daily_journal_analyses` and `weekly_journal_analyses` tables
4. Frontend displays notes + AI-generated insights (mood scores, highlights, advice)
5. Typing indicators broadcasted via gRPC streams in `grpc-service`

## Project Modules (4 Core Features)

The application is structured around 4 main functional modules:

1.  **Authentication Module** (`JwtAuthController`)
    - Handles User Registration, Login, Logout, and Token Refresh.
    - Uses JWT (JSON Web Tokens) for stateless, secure authentication.

2.  **Journaling Module** (`JournalNoteController`)
    - Core CRUD (Create, Read, Update, Delete) operations for daily journal entries.
    - Manages date-based retrieval and storage of user notes.

3.  **Mood Analysis Module** (`JournalAnalysisController`)
    - Integrates with Google Gemini AI to analyze journal content.
    - Generates Daily and Weekly summaries, mood scores, and personalized advice.

4.  **Recommendation Module** (`RecommendationController`)
    - Generates personalized recommendations (e.g., movies, activities) based on the user's mood and journal entries.

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

## Service Architecture

### Backend Services (`app/Services/`)
- **GeminiMoodAnalysisService**: AI mood analysis via Google Gemini API
  - `analyzeDailyNotes()`: Single day analysis
  - `analyzeWeeklyNotes()`: Week-long summary
  - Returns: `{summary, dominantMood, moodScore, highlights, advice, affirmation}`
- **DailyJournalAnalysisService**: Caching layer for daily analyses
  - Checks cache → calls Gemini if needed → stores result

### Real-time Service (gRPC)
Located in `grpc-service/`, this Node.js service handles real-time features using gRPC (Google Remote Procedure Call) instead of traditional WebSockets, though it serves the same purpose.
- **grpc-server.js**: The main server entry point.
- **ChatService**: Defines the gRPC methods:
    - `ChatStream`: A bidirectional stream for receiving real-time updates (user presence, incoming messages).
    - `SendMessage`: Handles sending global or private messages.
    - `SendTyping`: Broadcasts typing indicators to other users.
- **UserManager**: In-memory management of connected users and their active gRPC streams.
- **Auth**: Verifies JWT tokens from backend using `jsonwebtoken`.

### Frontend Services (`frontend/src/services/`)
- **authService.js**: Login, register, logout, token management
- **journalService.js**: CRUD for notes, fetch daily/weekly summaries
  - Auto-handles JWT in headers
  - `handleResponse()` manages errors, redirects on 401
  - `processDates()` normalizes date formats from backend

## Project-Specific Patterns

### Backend Validation
- Use **Form Requests** for all write operations (`StoreJournalRequest`, `UpdateJournalRequest`)
- Keep Controllers thin; move validation and authorization to Request classes
- Use `validated()` method to retrieve sanitized input

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

## Key Files Reference

- **Auth**: `JwtAuthController.php`, `authService.js`, `ProtectedRoute.jsx`
- **Journal Core**: `JournalNoteController.php`, `StoreJournalRequest.php`, `UpdateJournalRequest.php`, `journalService.js`
- **AI Analysis**: `GeminiMoodAnalysisService.php`, `DailyJournalAnalysisService.php`
- **Real-time**: `grpc-service/grpc-server.js`
- **Routing**: `backend/routes/api.php`, `frontend/src/App.jsx`
- **Config**: `backend/config/services.php` (API keys), `backend/config/jwt.php`
