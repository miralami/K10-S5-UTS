# Mood Journal — Mobile App

A React Native (Expo) mobile client for the Mood Journal application. Consumes the existing Laravel REST API to provide a native journaling experience with AI-powered mood analysis.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native (Expo SDK 57) |
| Language | TypeScript |
| Navigation | Expo Router (file-based) |
| State | Zustand |
| HTTP | Axios with JWT interceptor |
| Storage | expo-secure-store |
| Backend | Laravel 12 + MySQL + JWT |
| AI | Google Gemini (via backend) |

---

## Features

### Implemented

- **Authentication:** Login, logout, SecureStore token persistence, auto-login on launch, silent token refresh on 401
- **Journal CRUD:** List with pull-to-refresh, detail view, create, edit (with 3-day restriction), delete with confirmation
- **Gratitudes:** Up to 3 gratitude entries per journal note with auto-detected categories
- **Home Dashboard:** Time-aware greeting, today's mood card (dominant mood + score 0–100 + affirmation), weekly dominant mood, recent entries shortcut
- **Profile:** User info, avatar initial, app version, logout
- **Error handling:** 401 auto-refresh, 403 edit restriction messaging, 422 validation errors, network errors, retry support
- **Loading states:** Spinners on all network requests, disabled buttons during submission
- **Empty states:** Placeholder text for no journals, no mood analysis

### Optional (not yet built)

- User registration
- Journal search
- Calendar view
- Image upload
- Movie recommendations
- Real-time chat

---

## Backend Dependency

This app requires the Mood Journal Laravel backend running at the configured URL.

**Required services:**
- Laravel API server (port 8000)
- MySQL database

**Optional services (mood analysis fallbacks gracefully):**
- Python gRPC AI service (port 50052)
- Google Gemini API key

---

## Setup

### Prerequisites

- Node.js 18+
- Expo Go app on your phone (or an emulator)
- Backend running at `http://localhost:8000`

### Install

```bash
cd mobile
npm install
cp .env.example .env
```

Edit `.env` and set `EXPO_PUBLIC_API_BASE_URL`:

| Environment | Value |
|---|---|
| Local (emulator) | `http://10.0.2.2:8000` |
| Local (physical device) | `http://192.168.x.x:8000` |
| Deployed | `https://your-api.example.com` |

### Run

```bash
npx expo start
```

Scan the QR code with Expo Go or press `a` for Android emulator.

---

## Architecture

```
Mobile App (Expo/React Native)
    │
    ├── Axios (services/api.ts)
    │       │
    │       ├── Request interceptor → injects Bearer JWT
    │       └── Response interceptor → 401 → refresh → retry
    │
    ├── Zustand Stores
    │       └── authStore → user, token, login/logout/initialize
    │
    ├── Expo Router Navigation
    │       ├── index → auth gate redirect
    │       ├── (auth)/login
    │       └── (tabs) → Home | Journal | Profile
    │
    └── Screens → call services → render
```

### API Endpoints Consumed

| Endpoint | Purpose |
|---|---|
| `POST /api/auth/login` | Login |
| `POST /api/auth/logout` | Logout |
| `POST /api/auth/me` | Validate token, get user |
| `POST /api/auth/refresh` | Refresh expired JWT |
| `GET /api/journal/notes` | List journals |
| `POST /api/journal/notes` | Create journal |
| `GET /api/journal/notes/{id}` | Get journal detail |
| `PATCH /api/journal/notes/{id}` | Update journal |
| `DELETE /api/journal/notes/{id}` | Delete journal |
| `GET /api/journal/daily-summary` | Daily mood analysis |
| `GET /api/journal/weekly-summary` | Weekly mood summary |

---

## Project Structure

```
mobile/
├── app/                    # Expo Router file-based routes
│   ├── (auth)/login.tsx
│   ├── (tabs)/
│   │   ├── index.tsx       # Home
│   │   ├── journal.tsx     # Journal List
│   │   └── profile.tsx     # Profile
│   └── journal/
│       ├── [id].tsx        # Detail
│       ├── [id]/edit.tsx   # Edit
│       └── new.tsx         # Create
├── components/             # Reusable UI
├── services/               # Axios API layer
├── store/                  # Zustand state
├── hooks/                  # Custom hooks
├── types/                  # TypeScript interfaces
├── utils/                  # Helpers (storage, date)
├── constants/              # Config
└── assets/                 # Icons, splash
```

---

## Screenshots

<!-- TODO: Add screenshots after running on device/emulator -->

| Screen | Preview |
|---|---|
| Login | — |
| Home | — |
| Journal List | — |
| Journal Detail | — |
| Create Journal | — |
| Profile | — |

---

## Git History

```
feat: initialize Expo project with folder structure and dependencies
feat: set up navigation with Expo Router and placeholder screens
feat: implement JWT login, SecureStore persistence, and auto-login
feat: add 401 refresh interceptor with retry and logout fallback
feat: journal list screen with pull-to-refresh and FAB
feat: journal detail with edit and delete actions
feat: journal create form with validation
feat: edit form with 3-day restriction handling
feat: home screen with daily and weekly mood analysis
feat: profile screen with user info and logout
fix: add reusable error, loading, and empty state components
docs: add mobile README with setup instructions and screenshots
```

---

## License

MIT
