# Mood Journal Mobile Client — Development Plan

> **Status:** Pre-implementation plan — verified against repository as of 2026-07-04.  
> **Target:** React Native (Expo) mobile client consuming the existing Laravel 12 backend.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Existing System Architecture](#2-existing-system-architecture)
3. [Review of Original Plan](#3-review-of-original-plan)
4. [MVP Scope](#4-mvp-scope)
5. [Confirmed API Endpoints](#5-confirmed-api-endpoints)
6. [Authentication Flow](#6-authentication-flow)
7. [Data Models](#7-data-models)
8. [Critical Constraints](#8-critical-constraints)
9. [Project Structure](#9-project-structure)
10. [Navigation Architecture](#10-navigation-architecture)
11. [Implementation Phases](#11-implementation-phases)
12. [State Management](#12-state-management)
13. [Networking Layer](#13-networking-layer)
14. [Screens Reference](#14-screens-reference)
15. [Git Workflow](#15-git-workflow)
16. [README Requirements](#16-readme-requirements)
17. [Success Criteria](#17-success-criteria)
18. [Questions for Developer](#18-questions-for-developer)

---

## 1. Project Overview

Build a **React Native (Expo)** mobile client for an existing full-stack Mood Journal application.

**The backend already exists.** This project consumes it — no backend changes required for the MVP.

### Goals

**Primary (Portfolio demonstration):**
- React Native fundamentals
- REST API consumption (JWT, CRUD, interceptors)
- Mobile navigation (Expo Router / React Navigation)
- State management
- Clean Git workflow

**Secondary:**
- Learn React Native ecosystem
- Produce a portfolio-ready GitHub repository

### Out of Scope

- Rewriting or modifying the backend, AI service, or WebSocket server
- Achieving feature parity with the web application
- Offline support
- Push notifications
- App store deployment

---

## 2. Existing System Architecture

The repository is a monorepo with four services:

| Service | Stack | Port |
|---|---|---|
| **Backend** | Laravel 12, PHP 8.2, tymon/jwt-auth v2.2 | 8000 |
| **Frontend** | React 19, Vite, Chakra UI, React Router v6 | 5173 |
| **Chat Service** | Node.js, `ws` library, Express | 8080 |
| **AI Service** | Python, gRPC, Google Gemini (`gemini-2.0-flash`) | 50052 |

**Database:** MySQL, database `uts_sem5`.

**Mobile client** will be a fifth service added to this monorepo as `mobile/`.

### Communication diagram

```
Mobile App
    │
    ├── REST (JSON)  →  Laravel Backend (:8000)
    │                         │
    │                         ├── MySQL
    │                         ├── gRPC  →  Python AI Service (:50052)
    │                         └── HTTP  →  Google Gemini / OMDb / Last.fm
    │
    └── WebSocket (optional)  →  Node.js Chat Service (:8080)
```

**Mobile never touches gRPC or AI directly.** All AI results come through Laravel REST endpoints.

---

## 3. Review of Original Plan

This section documents what the original `plan.md.txt` got right, what is inaccurate, and what is missing.

### ✅ Correct

- Laravel backend, MySQL, JWT, Gemini, gRPC AI service, Node.js WebSocket — all confirmed present.
- JWT via `Authorization: Bearer <token>` header — confirmed.
- Token stored client-side (not cookie-based) — confirmed; mobile must use `SecureStore`.
- CRUD endpoints for journals exist — confirmed.
- Mood analysis endpoints exist — confirmed.
- Backend performs AI — mobile only displays results — confirmed.
- Search endpoint exists — confirmed.
- Image upload is supported — confirmed (multipart/form-data, 5 MB limit).
- Register endpoint exists — `POST /api/auth/register`.

### ❌ Inaccurate or Misleading

| Original claim | Reality |
|---|---|
| "JWT Authentication" (general) | Specifically **tymon/jwt-auth v2.2**, HS256, 60-min TTL, 14-day refresh TTL |
| Implied `GET /api/auth/me` | **It is `POST /api/auth/me`** — non-standard; affects implementation |
| "Token persistence" not specified | Web uses **`sessionStorage`** (not persistent). Mobile must use `expo-secure-store` |
| No refresh logic mentioned | `/api/auth/refresh` endpoint exists; **web client does not implement it**; mobile should |
| "Mood" field on journal | Journal has **no `mood` or `vibe` field** in the actual schema. Mood comes from AI analysis, not stored on the note itself |
| "Title" field assumed required | `title` is **nullable** |
| "Content" = `content` field | Field is named **`body`**, not `content` |
| Calendar "no complex logic" | Backend has date filtering (`start_date`, `end_date`) on `GET /api/journal/notes` — calendar is implementable purely via API |
| "Filtering implementation depends on backend" | Search endpoint is **fully confirmed**: `GET /api/journal/notes/search?q=&dateFrom=&dateTo=&limit=` |

### ⚠️ Missing from Original Plan

- **One note per day constraint**: backend silently upserts on duplicate `note_date`. UI must not show a "create" button if today already has a note — or must re-fetch to show the edit form.
- **3-day edit restriction**: `PATCH /api/journal/notes/{id}` returns **403** if the note is older than 3 days. UI must handle this gracefully.
- **`PATCH` with image upload**: requires `POST` with `_method=PATCH` FormData (Laravel method override). Standard `PATCH` with FormData won't work.
- **Image URLs are absolute**: `http://localhost:8000/storage/...` — must be replaced with an env variable for non-local environments.
- **Gratitude fields**: notes have `gratitude_1`, `gratitude_2`, `gratitude_3` (nullable, max 500 chars each) with auto-detected categories.
- **Weekly analysis trigger**: `POST /api/journal/generate-weekly` — can force-regenerate.
- **Movie recommendations**: `POST /api/recommendations` is **public** (no auth), accepts `{ mood: string }`.
- **Writing style analysis**: `GET /api/journal/writing-style` exists but requires gRPC AI service.
- **CORS note**: Native mobile apps bypass browser CORS — no CORS config change needed for native Expo. Only Expo Web mode would need it.

### 🗑️ Unnecessary in Original Plan

- References to Redux — Context API is sufficient and matches what the web frontend uses.
- "Filtering depends on backend capabilities" — backend capabilities are fully known and confirmed.
- Offline mode mention (correctly excluded but unnecessary to even note).

---

## 4. MVP Scope

**Time budget: ~2 days of active development.**

### Required (MVP)

| Feature | Notes |
|---|---|
| Login | `POST /api/auth/login` |
| Logout | `POST /api/auth/logout` + clear token |
| Token persistence | `expo-secure-store` |
| Auto-login on launch | Check stored token → validate via `POST /api/auth/me` |
| Token refresh | 401 interceptor → `POST /api/auth/refresh` → retry |
| Protected routes | Navigate to Login if no valid token |
| Journal list | `GET /api/journal/notes` |
| Journal detail | `GET /api/journal/notes/{id}` |
| Create journal | `POST /api/journal/notes` (one per day — handle gracefully) |
| Edit journal | `PATCH /api/journal/notes/{id}` (3-day restriction — show error) |
| Delete journal | `DELETE /api/journal/notes/{id}` |
| Daily mood display | `GET /api/journal/daily-summary?date=YYYY-MM-DD` |
| Weekly mood summary | `GET /api/journal/weekly-summary?start_date=&end_date=` |
| Profile screen | `POST /api/auth/me` for user info + logout |

### Optional (implement if time allows)

| Feature | Notes |
|---|---|
| Register screen | `POST /api/auth/register` |
| Search | `GET /api/journal/notes/search?q=` |
| Gratitude fields in journal form | `gratitude_1/2/3` fields |
| Image capture/upload | `multipart/form-data`, `image` field, max 5 MB; requires `expo-image-picker` |
| Calendar view | Date filter on `GET /api/journal/notes?start_date=&end_date=` |
| Movie recommendations | `POST /api/recommendations` (no auth needed) |

### Future (post-MVP)

| Feature | Notes |
|---|---|
| Real-time chat | WebSocket to `:8080`, same JWT auth |
| Gratitude stats/insights | 5 dedicated endpoints |
| Writing style analysis | Requires gRPC AI service running |
| Weekly generation on-demand | `POST /api/journal/generate-weekly` |
| Push notifications | No backend support exists — requires new work |
| Dark mode / theme switching | — |

---

## 5. Confirmed API Endpoints

Base URL: `http://localhost:8000` (configure via environment variable).

### Unauthenticated

| Method | Path | Body / Query | Notes |
|---|---|---|---|
| `POST` | `/api/auth/register` | `name`, `email`, `password`, `password_confirmation` | |
| `POST` | `/api/auth/login` | `email`, `password` | Returns token + user |
| `POST` | `/api/auth/logout` | — | Bearer token required |
| `POST` | `/api/auth/refresh` | — | Bearer token required; returns new token |
| `POST` | `/api/auth/me` | — | Bearer token required; returns user object |
| `GET` | `/api/health` | — | `{ status: "ok" }` |
| `POST` | `/api/recommendations` | `{ mood: string }` | No auth; movie recommendations |

### Authenticated (`Authorization: Bearer <token>`)

| Method | Path | Query Params | Notes |
|---|---|---|---|
| `GET` | `/api/journal/notes` | `start_date`, `end_date` | Ordered by `updated_at DESC`, scoped to user |
| `POST` | `/api/journal/notes` | — | One per day (upserts silently) |
| `GET` | `/api/journal/notes/{id}` | — | |
| `PATCH` | `/api/journal/notes/{id}` | — | 403 if note > 3 days old; use POST+`_method=PATCH` for image |
| `DELETE` | `/api/journal/notes/{id}` | — | Also deletes image file |
| `GET` | `/api/journal/notes/search` | `q`, `dateFrom`, `dateTo`, `limit` (≤500) | LIKE on title+body |
| `GET` | `/api/journal/daily-summary` | `date` (YYYY-MM-DD) | Returns AI analysis or null |
| `GET` | `/api/journal/weekly-summary` | `start_date`, `end_date` OR `week_ending` | Returns AI analysis or null |
| `POST` | `/api/journal/generate-weekly` | — | Body: `start_date`+`end_date` or `week_ending`; slow (up to 5 min) |
| `GET` | `/api/journal/writing-style` | `refresh` (bool) | Requires AI service |
| `GET` | `/api/journal/gratitude/stats` | — | |
| `GET` | `/api/journal/gratitude/distribution` | — | |
| `GET` | `/api/journal/gratitude/insights` | — | |
| `GET` | `/api/journal/gratitude/random` | — | |
| `GET` | `/api/journal/gratitude/prompts` | — | |

### Login Response Shape

```json
{
  "status": "success",
  "data": {
    "access_token": "<jwt>",
    "token_type": "bearer",
    "expires_in": 3600,
    "user": { "id": 1, "name": "...", "email": "..." }
  }
}
```

### Journal Note Response Shape

```json
{
  "id": 1,
  "userId": 1,
  "title": "...",
  "body": "...",
  "noteDate": "2026-07-04T00:00:00.000Z",
  "createdAt": "2026-07-04T10:00:00.000Z",
  "updatedAt": "2026-07-04T10:00:00.000Z",
  "gratitude1": "...",
  "gratitude2": null,
  "gratitude3": null,
  "gratitudeCategory1": "Friends",
  "gratitudeCategory2": null,
  "gratitudeCategory3": null,
  "gratitudeCount": 1,
  "imagePath": "journal-images/xxx.jpg",
  "imageUrl": "http://localhost:8000/storage/journal-images/xxx.jpg"
}
```

### Daily Analysis Response Shape (`analysis` JSON field)

```json
{
  "summary": "...",
  "dominantMood": "Happy",
  "moodScore": 78,
  "highlights": ["..."],
  "advice": ["..."],
  "affirmation": "..."
}
```

---

## 6. Authentication Flow

```
App Launch
    │
    ▼
Read token from SecureStore
    │
    ├── No token ──────────────────────────► Login Screen
    │
    ▼
POST /api/auth/me  (validate token)
    │
    ├── 200 OK ───────────────────────────► Home (Bottom Tabs)
    │
    └── 401 / error
            │
            ├── Has refresh token? ────────► POST /api/auth/refresh
            │       │
            │       ├── Success ──────────► Save new token → Home
            │       └── Fail ─────────────► Clear storage → Login Screen
            │
            └── No refresh token ──────────► Login Screen
```

**Token storage:** `expo-secure-store` (encrypted on device).

**401 interceptor:** Axios interceptor attempts refresh once per 401. If refresh fails, clears all stored tokens and navigates to Login.

**Logout:** Call `POST /api/auth/logout`, then clear `SecureStore`.

**Note:** `POST /api/auth/me` — this endpoint is `POST`, not `GET`. This is non-standard but confirmed from the repository.

---

## 7. Data Models

### JournalNote (mobile-side type)

```typescript
interface JournalNote {
  id: number;
  userId: number;
  title: string | null;
  body: string | null;
  noteDate: string;       // ISO 8601
  createdAt: string;
  updatedAt: string;
  gratitude1: string | null;
  gratitude2: string | null;
  gratitude3: string | null;
  gratitudeCategory1: string | null;
  gratitudeCategory2: string | null;
  gratitudeCategory3: string | null;
  gratitudeCount: number;
  imagePath: string | null;
  imageUrl: string | null;
}
```

**Important:** There is no `mood` or `vibe` field on the note itself. Mood data comes from `daily-summary` / `weekly-summary` analysis endpoints.

### CreateJournalPayload

```typescript
interface CreateJournalPayload {
  title?: string;          // nullable, max 255
  body?: string;           // nullable
  note_date?: string;      // nullable, YYYY-MM-DD
  gratitude_1?: string;    // nullable, max 500
  gratitude_2?: string;    // nullable, max 500
  gratitude_3?: string;    // nullable, max 500
  image?: File | Blob;     // nullable, max 5 MB, JPEG/PNG/GIF/WebP
}
```

### DailyAnalysis

```typescript
interface DailyAnalysis {
  summary: string;
  dominantMood: string;
  moodScore: number;      // 0–100
  highlights: string[];
  advice: string[];
  affirmation: string;
}
```

### User

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}
```

---

## 8. Critical Constraints

These constraints are derived directly from the repository and **must** be handled in the mobile client.

| Constraint | Detail | Required handling |
|---|---|---|
| **One note per day** | Backend silently upserts if `note_date` already exists for user | On Home/Today screen, check if today's note exists before showing "Create" vs "Edit" |
| **3-day edit restriction** | `PATCH` returns 403 if note is > 3 days old | Show user-friendly "This note can no longer be edited" message; hide Edit button for old notes |
| **`PATCH` + image** | Standard `PATCH` with `multipart/form-data` won't work | Use `POST` with `_method=PATCH` in FormData body for updates that include an image |
| **Image URL host** | `imageUrl` contains `http://localhost:8000/...` | Replace host with `API_BASE_URL` env variable in image URL construction |
| **`POST /api/auth/me`** | Non-standard POST for user info | Use POST, not GET, in profile fetch and token validation |
| **Token TTL** | Access token: 60 min; Refresh token: 14 days | Implement 401 interceptor with one refresh attempt |
| **`body` not `content`** | Journal text field is `body` | Use correct field name in all payloads |
| **No mood field on note** | Mood is derived from AI analysis, not stored on note | Do not add a mood picker to the journal form; display mood only from analysis endpoints |
| **sessionStorage (web)** | Web uses non-persistent storage | Mobile uses `expo-secure-store` — tokens survive app restarts |
| **CORS (native)** | Native apps bypass browser CORS | No CORS config change needed; Expo Web mode would need it |

---

## 9. Project Structure

Place the mobile app at the repository root as `mobile/`.

```
mobile/
├── app/                        # Expo Router file-based routes
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── register.tsx        # optional
│   ├── (tabs)/
│   │   ├── index.tsx           # Home
│   │   ├── journal.tsx         # Journal List
│   │   ├── calendar.tsx        # Calendar (optional)
│   │   └── profile.tsx         # Profile
│   ├── journal/
│   │   ├── [id].tsx            # Journal Detail
│   │   ├── [id]/edit.tsx       # Edit Journal
│   │   └── new.tsx             # Create Journal
│   └── _layout.tsx             # Root layout + auth gate
│
├── components/                 # Shared UI components
│   ├── JournalCard.tsx
│   ├── MoodBadge.tsx
│   ├── MoodSummaryCard.tsx
│   ├── LoadingSpinner.tsx
│   └── ErrorMessage.tsx
│
├── services/                   # API abstraction layer
│   ├── api.ts                  # Axios instance + interceptors
│   ├── auth.ts                 # auth endpoints
│   ├── journal.ts              # journal CRUD + search
│   └── analysis.ts             # mood analysis endpoints
│
├── store/                      # State management
│   ├── authStore.ts            # auth state (Zustand or Context)
│   └── journalStore.ts         # journal list cache (optional)
│
├── hooks/
│   ├── useAuth.ts
│   ├── useJournals.ts
│   └── useMoodAnalysis.ts
│
├── types/
│   └── index.ts                # TypeScript interfaces (from §7)
│
├── constants/
│   └── config.ts               # API_BASE_URL, WS_URL
│
├── utils/
│   ├── date.ts                 # date formatting helpers
│   └── storage.ts              # SecureStore wrappers
│
├── assets/
├── app.json
├── package.json
├── tsconfig.json
└── .env                        # EXPO_PUBLIC_API_BASE_URL=http://localhost:8000
```

---

## 10. Navigation Architecture

```
Root Layout (_layout.tsx)
    │
    ├── AuthGate: no token ──────────────► (auth) group
    │                                           ├── login.tsx
    │                                           └── register.tsx
    │
    └── AuthGate: has token ─────────────► (tabs) Bottom Tab Navigator
                                                ├── Home (index.tsx)
                                                ├── Journal List (journal.tsx)
                                                ├── Calendar (calendar.tsx)  [optional]
                                                └── Profile (profile.tsx)

Journal stack (modal/stack over tabs):
    journal.tsx → journal/new.tsx
    journal.tsx → journal/[id].tsx → journal/[id]/edit.tsx
```

**Library:** Expo Router (file-based) — recommended for new Expo projects and aligns with the Expo SDK.  
**Alternative:** React Navigation v6 with `@react-navigation/bottom-tabs` and `@react-navigation/stack` if Expo Router is unfamiliar.

---

## 11. Implementation Phases

### Phase 1 — Project Setup (1–2 hours)

- `npx create-expo-app mobile --template` (TypeScript template)
- Install dependencies: `axios`, `expo-secure-store`, `expo-router` (or `@react-navigation/*`)
- Configure `.env` with `EXPO_PUBLIC_API_BASE_URL`
- Create folder structure (§9)
- Configure Axios instance with base URL and timeout
- Set up TypeScript interfaces (§7)
- Git: `feat: initialize Expo project with navigation and folder structure`

### Phase 2 — Authentication (2–3 hours)

- Implement `services/auth.ts`: `login`, `logout`, `me`, `refresh`, `register`
- Implement `utils/storage.ts`: `SecureStore` get/set/delete helpers
- Implement `useAuth` hook
- Implement 401 interceptor in `services/api.ts` (refresh → retry → clear + redirect)
- Build Login screen (email, password, loading, error)
- Build auth gate in root `_layout.tsx`
- Test: login, persist across restart, auto-logout on token expiry
- Git: `feat: implement JWT authentication with SecureStore and refresh`

### Phase 3 — Journal CRUD (3–4 hours)

- Implement `services/journal.ts`: list, get, create, update, delete, search
- Build Journal List screen (FlatList, pull-to-refresh, FAB)
- Build Journal Detail screen (display all fields, Edit/Delete actions)
- Build Create Journal screen (title, body, note_date, gratitude fields)
- Build Edit Journal screen (pre-filled form; hide if > 3 days old)
- Handle one-note-per-day logic on Create (check existing before submitting)
- Handle 403 on edit (display friendly message)
- Git: `feat: journal list and detail screens`
- Git: `feat: create and edit journal forms`
- Git: `feat: delete journal with confirmation`

### Phase 4 — Home Screen & Mood Analysis (2 hours)

- Implement `services/analysis.ts`: daily summary, weekly summary
- Build Home screen:
  - Greeting with user name (from auth state)
  - Today's mood card (`GET /api/journal/daily-summary?date=today`)
  - Recent journals (first 3 from list)
  - Weekly mood summary card
- Display `dominantMood`, `moodScore`, `affirmation` from analysis response
- Handle null analysis (no journal for that date/week)
- Git: `feat: home screen with daily and weekly mood analysis`

### Phase 5 — Profile Screen (30 minutes)

- Build Profile screen
- Display name + email from auth state (cached from login or `POST /api/auth/me`)
- Logout button: call `POST /api/auth/logout`, clear SecureStore, navigate to Login
- Git: `feat: profile screen with logout`

### Phase 6 — Polish (1–2 hours)

- Loading states on all network requests
- Error boundary and user-friendly error messages
- Empty states (no journals, no analysis)
- Consistent spacing and typography
- Handle network unavailable
- Handle 401 (interceptor), 403 (edit restriction), 422 (validation), 500
- Git: `fix: handle all error states and loading indicators`
- Git: `docs: add README with setup instructions and screenshots`

### Optional Phase 7 — Extras (if time allows)

- Register screen
- Search screen or search bar in Journal List
- Calendar view (date-filtered journal list)
- Image upload in journal form (`expo-image-picker`)
- Movie recommendations screen (`POST /api/recommendations`)

---

## 12. State Management

**Use Zustand** — lightweight, no boilerplate, sufficient for this scope.  
**Alternative:** React Context if Zustand is unfamiliar.  
**Do not use Redux.**

### Auth Store

```typescript
// store/authStore.ts (Zustand)
interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>; // reads SecureStore on launch
}
```

### Journal Store (optional — can use local useState per screen)

```typescript
interface JournalState {
  notes: JournalNote[];
  fetchNotes: () => Promise<void>;
  addNote: (note: JournalNote) => void;
  updateNote: (note: JournalNote) => void;
  deleteNote: (id: number) => void;
}
```

---

## 13. Networking Layer

### Axios Instance (`services/api.ts`)

```typescript
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8000',
  timeout: 15000,
  headers: { 'Accept': 'application/json' },
});

// Request interceptor — inject token
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor — handle 401 with refresh
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      // attempt refresh — if fails, clear storage and redirect to login
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Image Upload (PATCH with image)

For `PATCH` requests that include an image, use `POST` with `_method=PATCH` in FormData:

```typescript
const form = new FormData();
form.append('_method', 'PATCH');
form.append('title', title);
form.append('image', { uri, name: 'photo.jpg', type: 'image/jpeg' } as any);

await api.post(`/api/journal/notes/${id}`, form, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
```

---

## 14. Screens Reference

| Screen | Route | Endpoint(s) | Key behavior |
|---|---|---|---|
| Login | `(auth)/login` | `POST /api/auth/login` | Store token; navigate to tabs |
| Register | `(auth)/register` | `POST /api/auth/register` | Optional MVP |
| Home | `(tabs)/index` | `POST /api/auth/me`, `GET /api/journal/daily-summary`, `GET /api/journal/weekly-summary`, `GET /api/journal/notes` | Greeting, mood card, recent notes |
| Journal List | `(tabs)/journal` | `GET /api/journal/notes` | FlatList, pull-to-refresh, FAB |
| Journal Detail | `journal/[id]` | `GET /api/journal/notes/{id}` | Display all fields; Edit/Delete |
| Create Journal | `journal/new` | `POST /api/journal/notes` | Handle one-per-day upsert |
| Edit Journal | `journal/[id]/edit` | `PATCH /api/journal/notes/{id}` | Show 403 message if > 3 days |
| Profile | `(tabs)/profile` | `POST /api/auth/me`, `POST /api/auth/logout` | User info + logout |
| Calendar | `(tabs)/calendar` | `GET /api/journal/notes?start_date=&end_date=` | Optional; date-grouped list |

---

## 15. Git Workflow

Commit after each meaningful working state. Suggested messages (follow repository convention):

```
feat: initialize Expo project with folder structure and navigation
feat: implement JWT login with SecureStore persistence
feat: add 401 refresh interceptor
feat: implement journal list screen with pull-to-refresh
feat: implement journal create form
feat: implement journal detail with edit and delete
feat: implement home screen with daily mood summary
feat: implement weekly mood summary card
feat: implement profile screen with logout
fix: handle 3-day edit restriction with user message
fix: handle one-note-per-day upsert behavior
fix: handle all error states and loading indicators
docs: add README with screenshots and setup instructions
```

Branch strategy (optional for solo project):

```
main          → stable, demo-ready
dev           → integration branch
feat/*        → feature branches
```

---

## 16. README Requirements

The mobile `README.md` must include:

1. **Project overview** — what it is, what backend it consumes
2. **Tech stack** — Expo, React Native, Axios, Zustand, Expo Router, expo-secure-store
3. **Features** — bulleted list of implemented screens/features
4. **Screenshots** — at minimum: Login, Home, Journal List, Journal Detail, Create Journal, Profile
5. **Setup instructions**:
   ```bash
   cd mobile
   npm install
   cp .env.example .env      # set EXPO_PUBLIC_API_BASE_URL
   npx expo start
   ```
6. **Backend dependency** — note that the Laravel backend must be running at the configured URL
7. **Architecture overview** — one diagram or paragraph describing the auth + data flow
8. **API integration overview** — list of endpoints consumed

---

## 17. Success Criteria

The project is complete when:

- [ ] User can log in with email and password
- [ ] Token persists across app restarts (`expo-secure-store`)
- [ ] Expired tokens are silently refreshed; failed refresh redirects to Login
- [ ] User can view their journal list
- [ ] User can create a journal note (title, body, date, gratitude fields)
- [ ] User can view journal detail
- [ ] User can edit a journal note (with correct 3-day restriction handling)
- [ ] User can delete a journal note
- [ ] Home screen displays today's mood summary and recent notes
- [ ] Profile screen shows user info and working logout
- [ ] All screens have loading states and error handling
- [ ] Repository has meaningful Git history with per-feature commits
- [ ] README with screenshots exists

**Portfolio bar:** Demonstrates React Native, JWT auth, REST CRUD, navigation, state management, error handling, and clean Git workflow using a real production-style Laravel backend.

---

## 18. Questions for Developer

These cannot be determined from the repository and must be confirmed before implementation.

1. **Backend URL for mobile testing**: Will you run the backend on `localhost` and test via Expo Go on the same device (Wi-Fi), an emulator, or a deployed server? `localhost:8000` is only reachable from an emulator or the same machine — physical devices need the LAN IP or a tunnel (ngrok).

2. **Expo Router vs React Navigation**: Do you have a preference? Expo Router is newer and file-based; React Navigation is more established and familiar. Both work.

3. **Register screen**: Is register a required MVP deliverable or truly optional?

4. **Image upload in MVP**: Is image upload required for the MVP journal form, or optional? It requires `expo-image-picker` and adds complexity to the update flow.

5. **Gratitude fields in MVP**: Should the journal create/edit form include `gratitude_1/2/3` fields, or defer them to post-MVP?

6. **Backend environment**: Will you be running all four services locally? The AI service (gRPC) is optional — analysis endpoints fall back gracefully if it's down.

7. **Production/deploy**: Is the final demo local-only, or do you need a deployed backend URL? If deployed, `imageUrl` host substitution must be implemented.

8. **Monorepo placement**: Confirmed that `mobile/` should be added as a fifth directory in the existing monorepo root?
