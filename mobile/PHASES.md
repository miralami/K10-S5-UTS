# Mobile Client — Execution Guide

> Work through phases in order. Each phase ends with a working, committable state.  
> Run `npx expo start` after each phase to verify before moving on.

---

## Grand Plan

```
Phase 0 — Scaffold          (~30 min)   Expo project, deps, folder structure, env
Phase 1 — Navigation        (~30 min)   Expo Router layout, tab navigator, placeholder screens
Phase 2 — Auth              (~2 hr)     Login screen, JWT, SecureStore, 401 interceptor, auto-login
Phase 3 — Journal CRUD      (~3 hr)     List → Detail → Create → Edit → Delete
Phase 4 — Home + Mood       (~1.5 hr)   Home screen, daily summary, weekly summary
Phase 5 — Profile           (~30 min)   Profile screen, logout
Phase 6 — Polish            (~1.5 hr)   Error states, loading, empty states, README, screenshots
Phase 7 — Extras (optional) (open)      Register, Search, Calendar, Image upload, Movie recs
```

---

## Phase 0 — Scaffold

**Goal:** Runnable blank Expo project with all dependencies installed and folder structure in place.

### Steps

```powershell
# From repo root
cd C:\Users\Sena\Documents\GitHub\K10-S5-UTS
npx create-expo-app mobile --template blank-typescript
cd mobile
```

Install dependencies:
```bash
npx expo install expo-secure-store expo-router expo-status-bar expo-image-picker
npm install axios zustand
npm install --save-dev @types/react
```

Create `.env` at `mobile/.env`:
```
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000
```

> **Physical device:** Replace `localhost` with your LAN IP (e.g., `192.168.1.x:8000`).  
> **Android emulator:** Use `http://10.0.2.2:8000`.

Create folder structure:
```
mobile/
├── app/
│   ├── (auth)/
│   │   └── login.tsx
│   ├── (tabs)/
│   │   ├── index.tsx
│   │   ├── journal.tsx
│   │   └── profile.tsx
│   ├── journal/
│   │   ├── new.tsx
│   │   └── [id].tsx
│   └── _layout.tsx
├── components/
├── services/
│   ├── api.ts
│   ├── auth.ts
│   ├── journal.ts
│   └── analysis.ts
├── store/
│   └── authStore.ts
├── hooks/
│   ├── useAuth.ts
│   └── useJournals.ts
├── types/
│   └── index.ts
├── constants/
│   └── config.ts
└── utils/
    ├── date.ts
    └── storage.ts
```

Configure `app.json` — set `scheme` for Expo Router:
```json
{
  "expo": {
    "scheme": "moodjournal",
    "plugins": ["expo-router"]
  }
}
```

### Verify
```bash
npx expo start
```
App opens in Expo Go → blank screen → OK.

### Commit
```
feat: initialize Expo project with folder structure and dependencies
```

---

## Phase 1 — Navigation

**Goal:** All screens exist as placeholders, tabs work, navigation between screens works.

### Steps

1. **`types/index.ts`** — define all TypeScript interfaces:
   ```typescript
   export interface User { id: number; name: string; email: string; }

   export interface JournalNote {
     id: number; userId: number; title: string | null; body: string | null;
     noteDate: string; createdAt: string; updatedAt: string;
     gratitude1: string | null; gratitude2: string | null; gratitude3: string | null;
     gratitudeCategory1: string | null; gratitudeCategory2: string | null; gratitudeCategory3: string | null;
     gratitudeCount: number; imagePath: string | null; imageUrl: string | null;
   }

   export interface DailyAnalysis {
     summary: string; dominantMood: string; moodScore: number;
     highlights: string[]; advice: string[]; affirmation: string;
   }

   export interface LoginResponse {
     status: string;
     data: { access_token: string; token_type: string; expires_in: number; user: User; };
   }
   ```

2. **`app/_layout.tsx`** — root layout with auth gate:
   - Reads token from SecureStore on mount
   - If no token → redirect to `(auth)/login`
   - If token → redirect to `(tabs)`
   - Shows loading spinner while checking

3. **`app/(auth)/login.tsx`** — placeholder `<Text>Login</Text>`

4. **`app/(tabs)/_layout.tsx`** — `<Tabs>` with three tabs: Home, Journal, Profile

5. **`app/(tabs)/index.tsx`** — placeholder Home
6. **`app/(tabs)/journal.tsx`** — placeholder Journal List
7. **`app/(tabs)/profile.tsx`** — placeholder Profile
8. **`app/journal/new.tsx`** — placeholder Create
9. **`app/journal/[id].tsx`** — placeholder Detail

### Verify
- Expo Go shows bottom tab bar
- Tapping tabs switches screens
- No TypeScript errors

### Commit
```
feat: set up navigation with Expo Router and placeholder screens
```

---

## Phase 2 — Authentication

**Goal:** Login works, token persists across restarts, auto-login on launch, 401 triggers refresh.

### Steps

1. **`utils/storage.ts`** — SecureStore helpers:
   ```typescript
   import * as SecureStore from 'expo-secure-store';
   export const saveToken = (t: string) => SecureStore.setItemAsync('token', t);
   export const getToken = () => SecureStore.getItemAsync('token');
   export const deleteToken = () => SecureStore.deleteItemAsync('token');
   ```

2. **`services/api.ts`** — Axios instance:
   - `baseURL` from `process.env.EXPO_PUBLIC_API_BASE_URL`
   - `timeout: 15000`
   - Request interceptor: inject `Authorization: Bearer <token>`
   - Response interceptor:
     - 401 + not `_retry` → attempt `POST /api/auth/refresh`
     - Refresh success → save new token, retry original request
     - Refresh fail → `deleteToken()` + navigate to login
   - Export `api` as default

3. **`services/auth.ts`**:
   ```typescript
   export const login = (email, password) => api.post('/api/auth/login', { email, password })
   export const logout = () => api.post('/api/auth/logout')
   export const me = () => api.post('/api/auth/me')         // POST, not GET
   export const refresh = () => api.post('/api/auth/refresh')
   export const register = (name, email, password, password_confirmation) =>
     api.post('/api/auth/register', { name, email, password, password_confirmation })
   ```

4. **`store/authStore.ts`** — Zustand store:
   ```typescript
   interface AuthState {
     user: User | null;
     token: string | null;
     isLoading: boolean;
     initialize: () => Promise<void>;  // reads SecureStore → validates token
     login: (email, password) => Promise<void>;
     logout: () => Promise<void>;
   }
   ```
   - `initialize`: read token → call `me()` → set user; on fail → clear token
   - `login`: call `auth.login` → save token + user
   - `logout`: call `auth.logout` → `deleteToken()` → clear state

5. **`app/_layout.tsx`** — call `authStore.initialize()` on mount, route accordingly

6. **`app/(auth)/login.tsx`** — full Login screen:
   - Email + Password `TextInput`
   - Login button → calls `authStore.login()`
   - Loading state (disable button, show spinner)
   - Error message on failure
   - On success → router replaces to `/(tabs)`

7. **`hooks/useAuth.ts`** — thin wrapper: `return useAuthStore()`

### Verify
- Log in with a valid account → reaches tabs
- Close Expo Go → reopen → goes straight to tabs (token persisted)
- Log out → goes to Login
- Bad credentials → shows error message

### Commit
```
feat: implement JWT login, SecureStore persistence, and auto-login
feat: add 401 refresh interceptor with retry and logout fallback
```

---

## Phase 3 — Journal CRUD

**Goal:** Full create, read, update, delete flow working against the real backend.

### Steps

1. **`services/journal.ts`**:
   ```typescript
   export const list = (params?) => api.get('/api/journal/notes', { params })
   export const get = (id) => api.get(`/api/journal/notes/${id}`)
   export const create = (data) => api.post('/api/journal/notes', data)
   export const update = (id, data) => {
     // If data contains an image: use POST + _method=PATCH FormData
     // Otherwise: PATCH with JSON
     return api.patch(`/api/journal/notes/${id}`, data)
   }
   export const remove = (id) => api.delete(`/api/journal/notes/${id}`)
   export const search = (q, dateFrom?, dateTo?) =>
     api.get('/api/journal/notes/search', { params: { q, dateFrom, dateTo } })
   ```

2. **`hooks/useJournals.ts`**:
   - `notes`, `isLoading`, `error`
   - `fetch()`, `refresh()` → calls `journal.list()`
   - `deleteNote(id)` → optimistic remove from local state

3. **`app/(tabs)/journal.tsx`** — Journal List screen:
   - `FlatList` of `JournalCard` components
   - Pull-to-refresh (`refreshControl`)
   - FAB (`+` button) → navigate to `journal/new`
   - Empty state: "No journals yet"
   - Each card: tap → navigate to `journal/[id]`

4. **`components/JournalCard.tsx`**:
   - Shows: `title` (or "Untitled"), `noteDate`, first 80 chars of `body`
   - `gratitudeCount` badge if > 0

5. **`app/journal/[id].tsx`** — Detail screen:
   - Display: title, body, noteDate, gratitude fields, image (if `imageUrl` set)
   - Image URL: replace host with `API_BASE_URL` env var
   - **Edit button:** only show if note is ≤ 3 days old (compute from `noteDate`)
   - **Delete button:** confirmation alert → `journal.remove(id)` → navigate back

6. **`app/journal/new.tsx`** — Create screen:
   - Fields: `title`, `body`, `note_date` (default today), `gratitude_1/2/3`
   - Submit → `journal.create()`
   - **One-per-day:** on 200, backend silently updates — that's fine, just navigate back
   - Validation: show backend 422 errors inline

7. **`app/journal/[id]/edit.tsx`** — Edit screen:
   - Pre-fill form from Detail data (pass via params or re-fetch)
   - Submit → `journal.update(id, data)`
   - **403 handling:** show "This note can no longer be edited (older than 3 days)"
   - Guard: if note > 3 days old, show read-only message instead of form

### Verify
- Create a note → appears in list
- Edit note → changes saved
- Delete note → removed from list
- Try editing a 4-day-old note → shows restriction message
- Backend returns correct data shapes

### Commit
```
feat: journal list screen with pull-to-refresh and FAB
feat: journal detail with edit and delete actions
feat: journal create form with validation
feat: journal edit form with 3-day restriction handling
fix: handle one-note-per-day upsert behavior
```

---

## Phase 4 — Home Screen & Mood Analysis

**Goal:** Home screen shows today's mood and recent journals.

### Steps

1. **`services/analysis.ts`**:
   ```typescript
   export const dailySummary = (date: string) =>
     api.get('/api/journal/daily-summary', { params: { date } })
   export const weeklySummary = (start_date: string, end_date: string) =>
     api.get('/api/journal/weekly-summary', { params: { start_date, end_date } })
   ```

2. **`hooks/useMoodAnalysis.ts`**:
   - Fetch daily summary for today (`format(new Date(), 'yyyy-MM-dd')`)
   - Fetch weekly summary for current week (Mon–Sun)
   - Handle null response (no journal written yet)

3. **`components/MoodSummaryCard.tsx`**:
   - Shows: `dominantMood`, `moodScore` (progress bar 0–100), `affirmation`
   - If no analysis: "Write a journal entry to see your mood analysis"

4. **`components/MoodBadge.tsx`**:
   - Colored badge for mood string (e.g., Happy → green, Sad → blue)

5. **`app/(tabs)/index.tsx`** — Home screen:
   - Greeting: "Good morning, {user.name}" (based on time of day)
   - Today's MoodSummaryCard
   - Recent notes: first 3 from journal list, each tappable → Detail
   - Weekly summary card: `dominantMood` + `moodScore` for the week
   - "Write today's entry" button → `journal/new`

### Verify
- Home loads without crash
- Mood card shows data when backend has journal + analysis for today
- Null state shows placeholder message
- Recent notes are tappable

### Commit
```
feat: home screen with greeting and recent journals
feat: daily and weekly mood summary cards
```

---

## Phase 5 — Profile Screen

**Goal:** Shows user info, working logout.

### Steps

1. **`app/(tabs)/profile.tsx`**:
   - User name + email from `authStore.user`
   - "Logout" button:
     - `Alert.alert('Logout', 'Are you sure?', [{ onPress: authStore.logout }])`
     - On logout → auth state clears → `_layout.tsx` redirects to login
   - App version (from `app.json` via `expo-constants`)

### Verify
- Profile shows correct name/email
- Logout clears session and shows Login screen
- Re-login works

### Commit
```
feat: profile screen with user info and logout
```

---

## Phase 6 — Polish

**Goal:** Production-ready error handling, loading states, empty states, README.

### Steps

1. **Loading states** — every `api.*` call:
   - Button disabled + `ActivityIndicator` while in-flight
   - `FlatList` skeleton or spinner on first load

2. **Error handling** — in every screen:
   - Network error (no connection): "Check your internet connection"
   - 401: interceptor handles automatically
   - 403 on edit: "Note is read-only after 3 days"
   - 422 (validation): display field-level errors from response
   - 500: "Something went wrong. Please try again."

3. **Empty states**:
   - Journal list: "No journals yet. Tap + to write your first entry."
   - Home no analysis: "Write today's entry to see mood analysis."

4. **`components/LoadingSpinner.tsx`** — centered `ActivityIndicator`
5. **`components/ErrorMessage.tsx`** — dismissible error banner
6. **`components/EmptyState.tsx`** — icon + message + optional action button

7. **README.md** in `mobile/`:
   - Project overview, tech stack, features list
   - Setup instructions (clone → install → `.env` → `npx expo start`)
   - Backend dependency note
   - Screenshots (add after taking them in Expo Go)
   - API integration overview

8. **Take screenshots** — Login, Home, Journal List, Journal Detail, Create Journal, Profile

### Verify
- Kill backend → app shows friendly error, doesn't crash
- All screens have spinners during load
- README renders correctly on GitHub

### Commit
```
fix: add loading states and error handling to all screens
fix: add empty states for journal list and mood analysis
docs: add mobile README with setup instructions and screenshots
```

---

## Phase 7 — Extras (Optional)

Add only if Phase 1–6 are complete and stable.

| Extra | Effort | Endpoints |
|---|---|---|
| Register screen | 30 min | `POST /api/auth/register` |
| Search | 45 min | `GET /api/journal/notes/search` |
| Calendar view | 1–2 hr | `GET /api/journal/notes?start_date=&end_date=` |
| Image upload | 1 hr | `expo-image-picker` + FormData + `_method=PATCH` |
| Movie recs | 45 min | `POST /api/recommendations` (no auth needed) |
| Real-time chat | 2+ hr | WebSocket to `:8080`, same JWT |

---

## Quick Reference

### Environment variables (`mobile/.env`)
```
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000
```

### Backend endpoints used in MVP
| Endpoint | Phase |
|---|---|
| `POST /api/auth/login` | 2 |
| `POST /api/auth/logout` | 2 |
| `POST /api/auth/me` | 2 |
| `POST /api/auth/refresh` | 2 |
| `GET /api/journal/notes` | 3, 4 |
| `POST /api/journal/notes` | 3 |
| `GET /api/journal/notes/{id}` | 3 |
| `PATCH /api/journal/notes/{id}` | 3 |
| `DELETE /api/journal/notes/{id}` | 3 |
| `GET /api/journal/daily-summary` | 4 |
| `GET /api/journal/weekly-summary` | 4 |

### Critical rules (do not forget)
- Field name is `body`, not `content`
- `POST /api/auth/me` — POST, not GET
- 3-day edit restriction → 403 → show message, not generic error
- One note per day → backend upserts silently → no special client handling needed on create
- Image URL host = `localhost:8000` → replace with env var before rendering
- PATCH + image → use `POST` + `_method=PATCH` in FormData
