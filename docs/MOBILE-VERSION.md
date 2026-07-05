# Mood Journal — Mobile Version Technical Overview

> **Platform:** React Native (Expo SDK 57) · **Language:** TypeScript · **Navigation:** Expo Router  
> **Target:** iOS & Android via Expo Go · **Backend:** Laravel 12 REST API (shared with web)

---

## Table of Contents

1. [What's Offered: Complete Feature Inventory](#1-whats-offered-complete-feature-inventory)
2. [What's New: Mobile-Exclusive Capabilities](#2-whats-new-mobile-exclusive-capabilities)
3. [Technical Differences from Web Frontend](#3-technical-differences-from-web-frontend)
4. [Architecture & Data Flow](#4-architecture--data-flow)
5. [Authentication & Security](#5-authentication--security)
6. [UI/UX Design System](#6-uiux-design-system)
7. [API Integration Map](#7-api-integration-map)
8. [State Management Strategy](#8-state-management-strategy)
9. [Error Handling Matrix](#9-error-handling-matrix)
10. [Future Roadmap](#10-future-roadmap)

---

## 1. What's Offered: Complete Feature Inventory

### 1.1 Authentication & Session Management

| Feature | Implementation |
|---------|---------------|
| **Login** | Email/password → `POST /api/auth/login` → JWT stored in `expo-secure-store` |
| **Registration** | Name + email + password → `POST /api/auth/register` |
| **Auto-login** | On launch: read token from SecureStore → `POST /api/auth/me` to validate → route to tabs |
| **Silent Token Refresh** | 401 interceptor → `POST /api/auth/refresh` → retry original request (queue-based, handles concurrent 401s) |
| **Logout** | `POST /api/auth/logout` → clear SecureStore → redirect to login |
| **Session Persistence** | Token survives app restarts (encrypted device storage via `expo-secure-store`) |

### 1.2 Journaling

| Feature | Implementation |
|---------|---------------|
| **Create Entry** | Title, body, date, image, up to 3 gratitude fields |
| **One-Per-Day Guard** | On mount: `GET /api/journal/notes?start_date=today&end_date=today` → if exists, auto-redirect to edit |
| **Journal List** | `FlatList` with pull-to-refresh, skeleton loading on first load, FAB for new entry |
| **Journal Detail** | Full display: title, body, date, image (via `RemoteImage`), gratitudes section |
| **Edit Entry** | Pre-filled form; 3-day edit window enforced by backend (403) + frontend guard (hide Edit button) |
| **Delete Entry** | Confirmation alert → delete → haptic feedback + toast → navigate back |
| **Image Upload** | `expo-image-picker` → `FormData` + `_method=PATCH` for updates with images |
| **Image URL Resolution** | `utils/image.ts`: replaces `http://localhost:8000` with runtime `API_BASE_URL` |
| **Per-Field Validation** | 422 response → red border + error text on each field |
| **Search** | Live `SearchBar` component → `GET /api/journal/notes/search?q=` with debounced input |

### 1.3 Gratitude Tracking

| Feature | Implementation |
|---------|---------------|
| **Gratitude Inputs** | 3 optional text fields per journal entry (max 500 chars each) |
| **Display in Detail** | Gratitudes listed with bullet points, count badge |
| **Auto-Categorization** | Backend auto-detects categories (`gratitudeCategory1-3`) — displayed when available |

### 1.4 Mood Analysis (AI-Powered)

| Feature | Implementation |
|---------|---------------|
| **Today's Mood Card** | `GET /api/journal/daily-summary?date=today` → displays dominant mood, mood score (0-100), affirmation |
| **Weekly Summary** | `GET /api/journal/weekly-summary?start_date=&end_date=` → dominant mood for the week |
| **Empty State** | "Write today's entry to see mood analysis" when no analysis available |
| **Pull-to-Refresh** | RefreshControl on home screen re-fetches both daily + weekly analysis |

### 1.5 Calendar View

| Feature | Implementation |
|---------|---------------|
| **Monthly Grid** | `CalendarGrid` component — renders month days, marks dates with journal entries |
| **Day Selection** | Tap a day → filtered note list below calendar |
| **Month Navigation** | Prev/next month buttons with boundary handling (year rollover) |
| **Today Highlight** | Current date visually distinct (via `selectedDate` + `todayISO` comparison) |

### 1.6 Movie Recommendations

| Feature | Implementation |
|---------|---------------|
| **Recommendations Screen** | `POST /api/recommendations` → movie list with posters, year, reason, genres |
| **Access** | Button on Home screen + modal route `movies/index` |
| **Refresh** | Manual refresh button re-fetches recommendations |
| **Poster Fallback** | Placeholder emoji view when no poster URL available |

### 1.7 Real-Time Chat

| Feature | Implementation |
|---------|---------------|
| **WebSocket Connection** | Custom `ChatService` class — connects to Node.js WebSocket server (`:8080`) |
| **Global Chat** | Public messaging channel visible to all authenticated users |
| **User Presence** | Online/offline indicators, `user_list` and `presence` events |
| **Typing Indicators** | Real-time typing status via `typing` events with 2-second timeout |
| **Auto-Reconnection** | Exponential backoff (1s, 2s, 4s, 8s, 16s, max 5 attempts, cap 30s) |
| **Message Bubbles** | Own vs. other messages distinguished by style |

### 1.8 Profile

| Feature | Implementation |
|---------|---------------|
| **User Info** | Avatar initial, name, email (from auth store) |
| **App Version** | `expo-constants` reads `app.json` version |
| **Logout** | Confirmation dialog → `auth/logout` → clear store → redirect |

### 1.9 UI Infrastructure

| Component | Purpose |
|-----------|---------|
| `Skeleton` | Animated shimmer placeholder (used in home + journal list) |
| `LoadingSpinner` | Centered `ActivityIndicator` |
| `ErrorMessage` | Dismissible error banner |
| `EmptyState` | Icon + message + optional action button |
| `RemoteImage` | Image with loading spinner, error fallback, host URL substitution |
| `JournalCard` | Summary card: title, date, body preview, gratitude count badge |
| `MoodSummaryCard` | Mood score bar, dominant mood label, affirmation text |
| `MoodBadge` | Colored badge for mood display |
| `SearchBar` | Text input with clear button, calls `journalService.search` |
| `CalendarGrid` | Monthly calendar: day cells, marked dates, month/year headers |

---

## 2. What's New: Mobile-Exclusive Capabilities

These features and capabilities exist **only** in the mobile version — they are not present in the web frontend.

### 2.1 Platform-Native Experience

| Capability | How |
|------------|-----|
| **Haptic Feedback** | `expo-haptics` — light impact on image pick, success notification on create/delete |
| **Toast Notifications** | `react-native-root-toast` — non-blocking confirmation on create/delete (no equivalent in web) |
| **Secure Token Storage** | `expo-secure-store` — encrypted keychain/keystore storage (web uses `sessionStorage`, which is plaintext + non-persistent) |
| **Splash Screen** | Expo splash with parchment background + icon (web has browser loading) |
| **Custom Font Loading** | `@expo-google-fonts/playfair-display` + `crimson-text` — loaded at splash, with loading guard |
| **Pull-to-Refresh** | Native `RefreshControl` on FlatList/ScrollView for all data screens |
| **Keyboard Avoidance** | `KeyboardAvoidingView` with platform-specific behavior + `keyboardDismissMode="on-drag"` |
| **Adaptive Icons** | Android adaptive icon with monochrome, foreground, background layers |

### 2.2 Advanced State & Networking Patterns

| Pattern | Details | Web Equivalent |
|---------|---------|----------------|
| **Queue-based 401 Refresh** | Concurrent 401s queued and retried with a single refresh call (lines 22-74 of `api.ts`) | No refresh interceptor at all |
| **Token Sync After Refresh** | `syncToken()` exported from Zustand store — keeps `authStore.token` in sync with interceptor | N/A (no refresh) |
| **Token Persistence Across Restarts** | SecureStore survives app close, kill, restart | `sessionStorage` cleared on tab close |
| **Image URL Host Substitution Utility** | `utils/image.ts` — single `resolveImageUrl()` function used across all screens | Inline string replacement (inconsistent) |
| **One-Per-Day Auto-Redirect** | Mount effect checks today's notes → auto-navigates to edit form | Manual check (no auto-redirect) |
| **Per-Field 422 Error Display** | Parses `{ errors: { field: ["msg"] } }` → red border + error text per-input | Toast-level error only |
| **Skeleton Shimmer Animation** | `Skeleton` component with animated gradient shimmer | None (only spinners) |

### 2.3 Implemented Beyond MVP Scope

These features were **optional** in the original plan but are fully implemented in the mobile app:

| Feature | Plan Status | Mobile Status |
|---------|-------------|---------------|
| User Registration | Optional | ✅ `register.tsx` screen |
| Journal Search | Optional | ✅ `SearchBar` + `journalService.search` |
| Calendar View | Optional | ✅ `calendar.tsx` + `CalendarGrid` component |
| Image Upload | Optional (Phase 7) | ✅ `expo-image-picker` + FormData in create/edit |
| Movie Recommendations | Optional | ✅ `movies/index.tsx` screen |
| Real-Time Chat | Future (post-MVP) | ✅ `chat/index.tsx` + `chatStore` + `ChatService` |
| Gratitude Fields in Journal | Optional | ✅ All 3 fields in create + detail display |
| Haptic Feedback | Not in plan | ✅ `expo-haptics` on image pick, save, delete |
| Toast Notifications | Not in plan | ✅ `react-native-root-toast` on save/delete |

### 2.4 Design & Theming Depth

The mobile app implements a **deep typographic design system** that the web frontend lacks:

- **Playfair Display** (700 Bold) — all headings, titles, nav labels
- **Playfair Display** (400 Regular) — section subtitles
- **Crimson Text** (400 Regular) — body text, input values
- **Crimson Text** (400 Italic) — dates, muted info, empty states, subtitles
- **Crimson Text** (700 Bold) — button labels, emphasis
- **Color palette:** Parchment base `#FFFDF5`, deep leather brown primary `#78350F`, charcoal `#27272A`, deep crimson danger `#7F1D1D`, forest green success `#064E3B`

This creates a **warm, analog, journal-like feel** — distinct from the web's Chakra UI default aesthetic.

---

## 3. Technical Differences from Web Frontend

### 3.1 Stack Comparison

| Layer | Web Frontend | Mobile App |
|-------|-------------|------------|
| **Framework** | React 19 (SPA) | React Native (Expo SDK 57) |
| **Language** | JavaScript (JSX) | TypeScript |
| **Routing** | React Router DOM v6 | Expo Router (file-based) |
| **HTTP Client** | Axios (no interceptors for auth) | Axios with full request/response interceptors |
| **Auth Storage** | `sessionStorage` (plaintext, cleared on tab close) | `expo-secure-store` (encrypted, persists across restarts) |
| **State Management** | React Context + useState | Zustand (authStore, chatStore) |
| **UI Library** | Chakra UI 2.10 | Custom StyleSheet components |
| **Animations** | Framer Motion 12 | react-native-reanimated (gesture handler) |
| **Icons** | @chakra-ui/icons | Unicode text + emoji |
| **Charts** | Chart.js 4 + react-chartjs-2 | None (no charts) |
| **Form Validation** | Manual (no per-field) | Per-field 422 parsing with red borders |
| **Font Loading** | Google Fonts via CSS/import | `@expo-google-fonts/*` with splash guard |
| **gRPC** | `grpc-web` + `google-protobuf` | None (native apps consume REST for everything) |
| **Testing** | Jest + Testing Library | None configured |
| **Build Tool** | Vite | Expo Metro bundler |

### 3.2 Architectural Differences

#### Web: Monolithic Dashboard
```
Single Dashboard.jsx (~1500 lines)
├── Calendar
├── Notes list (selected date)
├── Weekly summary + charts
├── Movie recommendations grid
├── Music recommendations grid
├── Search (client-side filter)
├── Edit modal
└── All state in one component (useState)
```

#### Mobile: Screen-Per-Feature
```
Expo Router tree
├── (auth)/login.tsx          → Login
├── (auth)/register.tsx       → Registration
├── (tabs)/index.tsx          → Home dashboard
├── (tabs)/journal.tsx        → Journal list + search
├── (tabs)/calendar.tsx       → Calendar with day notes
├── (tabs)/profile.tsx        → Profile + logout
├── journal/new.tsx           → Create entry (modal)
├── journal/[id].tsx          → Detail (modal)
├── journal/[id]/edit.tsx     → Edit (modal)
├── chat/index.tsx            → Chat (modal)
└── movies/index.tsx          → Movie recs (modal)
```

#### Web: Client-Side Data Filtering
```
fetchAllNotes() → loads ALL notes for week range
  → filtered in-memory by selectedDate, searchQuery, historyDateRange
  → search is client-side filter over loaded notes
```

#### Mobile: Server-Side Data Filtering
```
journalService.search(q) → GET /api/journal/notes/search?q=&dateFrom=&dateTo=&limit=
  → server performs LIKE on title+body
  → calendar.tsx fetches notes per month via start_date/end_date params
  → one-per-day guard: GET list with today's date range
```

### 3.3 Feature Parity Matrix

| Feature | Web | Mobile | Notes |
|---------|-----|--------|-------|
| Login | ✅ | ✅ | Mobile: persistent + auto-login |
| Register | ✅ | ✅ | |
| Journal CRUD | ✅ | ✅ | Mobile: image upload, per-field validation |
| Gratitude Tracking | ✅ | ✅ | |
| Image Upload | ✅ | ✅ | Mobile: `expo-image-picker` |
| Daily Mood Analysis | ✅ | ✅ | |
| Weekly Mood Analysis | ✅ | ✅ | |
| Mood Charts (visual) | ✅ (Chart.js) | ❌ | Bar/spider/radar charts not in mobile |
| Calendar View | ✅ | ✅ | |
| Search | ✅ (client-side) | ✅ (server-side) | Different implementation |
| Movie Recommendations | ✅ | ✅ | Mobile: dedicated screen |
| **Music Recommendations** | **✅ (Last.fm)** | **❌** | **Web-only: Last.fm integration** |
| Real-Time Chat | ✅ | ✅ | |
| **Typing Indicators (Chat)** | ✅ | ✅ | Both have them |
| **Private Messaging (Chat)** | ✅ | **❌** | **Web has private chat; mobile has global-only** |
| **Gratitude Stats/Insights** | **✅ (4 endpoints)** | **❌** | **Web-only: stats, distribution, insights, random** |
| **Writing Style Analysis** | **✅** | **❌** | **Web-only: gRPC-dependent** |
| **Streak Counter** | **✅** | **❌** | **Web Home.jsx calculates writing streak** |
| **Journal Calendar (sidebar)** | **✅** | **❌** | **Web has inline per-week calendar** |
| **Quick Journal Prompts** | **✅** | **❌** | **Web: "Gratitude", "Moment", "Learned" quick-add** |
| **Desktop-Optimized Layout** | **✅** | **N/A** | Web: sidebar + two-column grid |
| Haptic Feedback | ❌ | ✅ | Mobile-only |
| Toast Notifications | ❌ | ✅ | Mobile-only |
| Skeleton Loading | ❌ | ✅ | Web uses Spinner only |
| Secure Token Persistence | ❌ | ✅ | Web: `sessionStorage` |
| Auto-login on restart | ❌ | ✅ | |
| Token Refresh Interceptor | ❌ | ✅ | |
| Pull-to-Refresh | ❌ | ✅ | |
| One-Per-Day Auto-Redirect | ❌ | ✅ | |
| 3-Day Edit UI Guard | ❌ (soft) | ✅ (hard) | Mobile: hides Edit button |
| Per-Field Validation Display | ❌ | ✅ | |
| Custom Typography System | ❌ | ✅ | 2 font families, 6 weights/styles |

---

## 4. Architecture & Data Flow

```
Mobile App (Expo / React Native)
    │
    ├── Axios Instance (services/api.ts)
    │       ├── baseURL → EXPO_PUBLIC_API_BASE_URL
    │       ├── timeout → 15000ms
    │       ├── Request interceptor
    │       │       └── Read token from SecureStore → inject Authorization: Bearer
    │       └── Response interceptor
    │               ├── 200 → pass through
    │               ├── 401 (first attempt) → queue + POST /api/auth/refresh
    │               │       ├── success → save new token, syncToken(authStore), retry all queued
    │               │       └── fail → processQueue(error), deleteToken(), redirect to login
    │               └── Other errors → reject (handled per-screen)
    │
    ├── Zustand Stores
    │       ├── authStore
    │       │       ├── user, token, isLoading, isAuthenticated
    │       │       ├── initialize() → read SecureStore → POST /api/auth/me → restore session
    │       │       ├── login() → POST /api/auth/login → save token + user
    │       │       ├── logout() → POST /api/auth/logout → clear SecureStore → clear state
    │       │       └── setToken() → sync after interceptor refresh (via syncToken export)
    │       └── chatStore
    │               ├── messages, users, typingUsers, isConnected
    │               ├── connect(token, userId, userName) → chatService.on('auth_success'|'global_message'|...)
    │               ├── disconnect() → cleanup
    │               ├── send(text, recipientId?) → chatService.sendMessage
    │               └── sendTyping(isTyping) → chatService.sendTyping
    │
    ├── Custom Hooks
    │       ├── useJournals → notes[], isLoading, error, fetch(), refresh()
    │       ├── useMoodAnalysis → { daily, weekly, loading, refresh() }
    │       └── useAuth → thin wrapper around useAuthStore
    │
    ├── Expo Router (file-based navigation)
    │       └── _layout.tsx → initialize auth + fonts → Stack navigator
    │               ├── index.tsx → auth gate (Redirect based on isAuthenticated)
    │               ├── (auth) group → login, register (no tabs)
    │               ├── (tabs) group → home, journal, calendar, profile (bottom tabs)
    │               └── Modal routes → journal/new, journal/[id], journal/[id]/edit, chat, movies
    │
    └── Screens → call services through hooks/stores → render with StyleSheet
```

### Data Flow: Create Journal Entry

```
User taps "Write Today's Entry"
    │
    ▼
journal/new.tsx mounts
    │
    ├── useEffect: list({ start_date: today, end_date: today })
    │       ├── notes.length > 0 → router.replace(/journal/{id}/edit)
    │       └── notes.length === 0 → show form
    │
    ├── User fills form (title, body, optional image, optional gratitudes)
    │
    ├── handleSubmit()
    │       ├── With image:
    │       │       └── FormData → POST /api/journal/notes → image + fields
    │       ├── Without image:
    │       │       └── JSON payload → POST /api/journal/notes
    │       │
    │       ├── 200 → Haptics.success() → Toast("Entry saved") → router.back()
    │       └── 422 → parse errors → setFieldErrors({ field: "message" }) → red borders
    │       └── other error → setError("message") → error banner at top
    │
    ▼
Journal list re-mounts → fetches updated notes
```

### Data Flow: Token Refresh (Concurrent 401s)

```
Two simultaneous requests, both get 401
    │
    ├── Request A: 401
    │       ├── isRefreshing === false → set isRefreshing = true
    │       ├── POST /api/auth/refresh
    │       └── Requests B..N queued in failedQueue (promises)
    │
    ├── Request B: 401
    │       ├── isRefreshing === true
    │       └── Push resolve/reject to failedQueue → wait
    │
    ├── Refresh succeeds
    │       ├── saveToken(newToken)
    │       ├── syncToken(newToken) → authStore.token updated
    │       ├── processQueue(null, newToken) → resolve all queued with new token
    │       ├── Retry A with new token
    │       └── B..N each .then(token => retry with new token)
    │
    └── Refresh fails
            ├── processQueue(error, null) → reject all queued
            ├── deleteToken()
            └── auth store detects token gone → redirect to login
```

---

## 5. Authentication & Security

### Session Flow

```
App Launch
    │
    ├── Splash screen (font loading + auth initialization)
    │
    ├── initialize()
    │       ├── getToken() from SecureStore
    │       ├── No token → isLoading=false, isAuthenticated=false → Login screen
    │       └── Has token → POST /api/auth/me
    │               ├── 200 OK → set user + token, isAuthenticated=true → Home tabs
    │               └── 401/error → deleteToken(), isAuthenticated=false → Login screen
    │
    └── App in use
            ├── Axios request interceptor: injects Bearer token from SecureStore
            └── Axios response interceptor: 401 → refresh → retry
                    ├── Refresh success → syncToken() keeps Zustand in sync
                    └── Refresh fail → deleteToken() → authStore.isAuthenticated=false → Login
```

### Security Properties

| Property | Mobile | Web |
|----------|--------|-----|
| Token Storage | `expo-secure-store` (hardware-backed encryption: Keychain on iOS, Android Keystore) | `sessionStorage` (plaintext JavaScript object, accessible to any JS on same origin) |
| Token Lifetime | 60 min access token, 14-day refresh window | Same backend config, no client refresh |
| Session Persistence | Survives app close, kill, device restart | Cleared on browser tab close |
| XSS Attack Surface | Native — no DOM-based XSS vectors | Browser — vulnerable to injected scripts reading `sessionStorage` |
| Auto-Logout on Token Expiry | When refresh fails → immediate redirect | Web: user remains on page until next 401 |

---

## 6. UI/UX Design System

### Visual Identity

```
┌─────────────────────────────────────────────────────┐
│                  MOOD JOURNAL                         │
│                                                       │
│  Palette:                                             │
│    ┌──────┐ #FFFDF5  Background (parchment)          │
│    ┌──────┐ #FDF7ED  Surface (cream)                 │
│    ┌──────┐ #78350F  Primary (deep leather brown)    │
│    ┌──────┐ #27272A  Text (charcoal)                 │
│    ┌──────┐ #71717A  Text Muted                      │
│    ┌──────┐ #7F1D1D  Danger (deep crimson)           │
│    ┌──────┐ #064E3B  Success (forest green)          │
│    ┌──────┐ #E4E4E7  Border (fine lines)             │
│                                                       │
│  Typography:                                          │
│    Headings:  Playfair Display 700 Bold               │
│    Subtitle:  Playfair Display 400 Regular            │
│    Body:      Crimson Text 400 Regular                 │
│    Italic:    Crimson Text 400 Italic                  │
│    Bold:      Crimson Text 700 Bold                    │
│                                                       │
│  Corners:  4px (sharp, deliberate)                    │
│  Shading:  None (flat design, border-only cards)      │
│  Icons:    Unicode/emoji (no icon library)            │
│                                                       │
│  Vibe:  Analog journal, warm, tactile, unhurried      │
└─────────────────────────────────────────────────────┘
```

### Screen Flow

```
Login ─→ Register ─→ Home (4 tabs) ─→ Journal Detail (modal)
                        │  │  │               ├── Edit (modal)
                        │  │  │               └── Delete (alert → toast)
                        │  │  │
                        │  │  └── Profile ─→ Chat (modal)
                        │  │                        └── WebSocket messages
                        │  │
                        │  └── Journal List ─→ Create (modal)
                        │         │                ├── Image picker
                        │         │                └── Gratitudes (3)
                        │         ├── Search (inline)
                        │         └── Calendar ─→ Day notes
                        │
                        └── Movie Recommendations (modal)
```

### Interaction Design

| Interaction | Implementation |
|-------------|---------------|
| Pull to refresh | `RefreshControl` on Home (mood + recent) and Journal List |
| FAB (journal list) | Absolute-positioned `+` button, bottom-right |
| Modal presentations | `journal/new`, `[id]`, `[id]/edit`, `chat`, `movies` |
| Delete confirmation | `Alert.alert` with Cancel/Delete (destructive style) |
| Haptic feedback | `impactAsync(.Light)` on image pick, `notificationAsync(.Success)` on save/delete |
| Toast feedback | `react-native-root-toast` — "Entry saved", "Entry deleted" (auto-dismiss) |
| Keyboard dismiss | `keyboardDismissMode="on-drag"` on Create + Edit scroll views |
| Loading indicators | `Skeleton` shimmer on list first load; `ActivityIndicator` on all mutation buttons |
| Error display | Inline error banners (create/edit top), toast (delete), retry buttons (list) |

---

## 7. API Integration Map

### Endpoints Consumed

| Endpoint | Method | Screen(s) | Request | Response |
|----------|--------|-----------|---------|----------|
| `/api/auth/login` | POST | Login | `{ email, password }` | `{ access_token, token_type, expires_in, user }` |
| `/api/auth/register` | POST | Register | `{ name, email, password, password_confirmation }` | Same as login |
| `/api/auth/logout` | POST | Profile | `Authorization: Bearer` | `{ status: "success" }` |
| `/api/auth/me` | POST | Auth gate, Profile | `Authorization: Bearer` | `{ id, name, email }` |
| `/api/auth/refresh` | POST | Interceptor (internal) | `Authorization: Bearer` | `{ access_token }` |
| `/api/journal/notes` | GET | Journal List, Home, Calendar | `start_date`, `end_date` | `JournalNote[]` |
| `/api/journal/notes` | POST | Create Journal | `FormData` or JSON | `JournalNote` |
| `/api/journal/notes/{id}` | GET | Journal Detail | — | `JournalNote` |
| `/api/journal/notes/{id}` | PATCH | Edit Journal | JSON fields | `JournalNote` |
| `/api/journal/notes/{id}` | POST | Edit (with image) | `FormData` + `_method=PATCH` | `JournalNote` |
| `/api/journal/notes/{id}` | DELETE | Journal Detail | — | `204 No Content` |
| `/api/journal/notes/search` | GET | Journal Search | `q`, `dateFrom`, `dateTo`, `limit` | `JournalNote[]` |
| `/api/journal/daily-summary` | GET | Home | `date` | `{ analysis: DailyAnalysis } \| null` |
| `/api/journal/weekly-summary` | GET | Home | `start_date`, `end_date` | `{ analysis: WeeklyAnalysis } \| null` |
| `/api/recommendations` | POST | Movies | `{ mood }` | `{ items: Movie[] }` |

### Response Shapes (Mobile TypeScript Types)

```typescript
interface User {
  id: number; name: string; email: string;
}

interface JournalNote {
  id: number; userId: number;
  title: string | null; body: string | null;
  noteDate: string; createdAt: string; updatedAt: string;
  gratitude1: string | null; gratitude2: string | null; gratitude3: string | null;
  gratitudeCategory1: string | null; gratitudeCategory2: string | null;
  gratitudeCategory3: string | null; gratitudeCount: number;
  imagePath: string | null; imageUrl: string | null;
}

interface DailyAnalysis {
  summary: string; dominantMood: string; moodScore: number;
  highlights: string[]; advice: string[]; affirmation: string;
}

interface WeeklyAnalysis {
  id: number; userId: number;
  weekStart: string; weekEnd: string;
  analysis: DailyAnalysis;
  recommendations: any; musicRecommendations: any;
}
```

---

## 8. State Management Strategy

### Zustand Store Architecture

```
authStore (global)
├── user: User | null
├── token: string | null
├── isLoading: boolean
├── isAuthenticated: boolean
├── initialize() → SecureStore → /api/auth/me
├── login(email, password) → /api/auth/login → saveToken
├── logout() → /api/auth/logout → deleteToken → clear
├── setToken(token) → sync after interceptor refresh
└── Exported: syncToken() → useAuthStore.getState().setToken()

chatStore (global)
├── messages: ChatMessage[]
├── users: ChatUser[]
├── typingUsers: string[]
├── isConnected: boolean
├── connect(token, userId, userName)
├── disconnect()
├── send(text, recipientId?)
└── sendTyping(isTyping)

useJournals hook (per-screen local)
├── notes: JournalNote[]
├── isLoading: boolean
├── error: string | null
├── fetch() → /api/journal/notes
└── refresh() → re-fetch with loading state

useMoodAnalysis hook (home screen only)
├── daily: DailyAnalysis | null
├── weekly: WeeklyAnalysis | null
├── loading: boolean
└── refresh() → fetches daily + weekly concurrently
```

### Why Zustand Over Context

| Factor | Zustand | React Context |
|--------|---------|---------------|
| Bundle size | ~1KB | 0KB (built-in) |
| Boilerplate | Minimal (create + define) | Provider setup, nesting |
| Performance | Selector-based re-renders | Subtree re-renders |
| External access | `getState()` (used by `syncToken`) | Not possible |
| Persistence | Middleware available | Manual |

---

## 9. Error Handling Matrix

| Scenario | Detection | UX Response |
|----------|-----------|-------------|
| **401 Unauthorized** | Axios response interceptor | Silent refresh → retry; if refresh fails → clear token → redirect to Login |
| **403 Forbidden (edit)** | `PATCH /api/journal/notes/{id}` | Show "This entry can no longer be edited (older than 3 days)" + hide Edit button |
| **422 Validation** | Response `status === 422` | Parse `response.data.errors` → per-field red border + error text; top-level message banner |
| **Network Offline** | `error.code === 'ERR_NETWORK'` (or no response) | Error banner "Check your internet connection" + retry button on list screens |
| **Server Error (5xx)** | `error.response.status >= 500` | "Something went wrong. Please try again." |
| **Empty Journal List** | `notes.length === 0` after fetch | Empty state: "No entries yet. Tap + to write your first entry." |
| **No Mood Analysis** | `daily-summary` returns null | "Write today's entry to see mood analysis" card |
| **Image Load Error** | `<Image>` onError | `RemoteImage` component shows placeholder view |
| **Token Expired on Launch** | `POST /api/auth/me` 401 | Clear token → Login screen (no error shown — silent) |
| **Concurrent 401s** | Multiple requests fail simultaneously | Queue-based: one refresh, all retried atomically |

---

## 10. Future Roadmap

### Web Parity (Closing the Gap)

| Feature | Current Status | Effort | Endpoint(s) |
|---------|---------------|--------|-------------|
| **Music Recommendations** | ❌ Missing | Medium | Same `POST /api/recommendations` (already consumed for movies) — add music section |
| **Private Chat** | ❌ Global only | 1-2h | `chatService.sendMessage(text, recipientId)` exists — add UI for user selection + private thread display |
| **Gratitude Stats/Insights** | ❌ Missing | 2-3h | 5 dedicated endpoints exist (`/api/journal/gratitude/stats`, `/distribution`, `/insights`, `/random`, `/prompts`) |
| **Writing Style Analysis** | ❌ Missing | 1h | `GET /api/journal/writing-style` (requires gRPC AI service running) |
| **Mood Charts** | ❌ Missing | 3-4h | Aggregate daily mood scores → render with `react-native-svg` or `react-native-chart-kit` |
| **Mood Journal Calendar (inline)** | ✅ Has separate screen | — | N/A |
| **Weekly Summary Generation** | ❌ Missing | 1h | `POST /api/journal/generate-weekly` (force-regenerate on demand) |
| **Streak Counter** | ❌ Missing | 1h | Client-side: count consecutive unique dates from journal list |

### Mobile-Exclusive Enhancements (New Value)

| Enhancement | Rationale | Technical Approach |
|-------------|-----------|-------------------|
| **Push Notifications** | Remind users to journal daily | Expo push notifications + backend notification endpoint (requires new backend work) |
| **Offline Mode** | Journal without connectivity | `AsyncStorage` cache → queue mutations → sync on reconnect |
| **Dark Mode** | User preference | Theme context + system appearance listener (`useColorScheme`) |
| **Biometric Auth** | Quick unlock with fingerprint/FaceID | `expo-local-authentication` — gate app launch after token check |
| **Share Journal Entry** | Export as image/text | `react-native-share` + `expo-print` (PDF) |
| **Voice-to-Text Journaling** | Speak instead of type | `expo-speech` recognition + `expo-av` recording |
| **Journal Reminders** | Daily notification at user-set time | `expo-notifications` scheduled trigger |
| **Widget (iOS/Android)** | Today's mood glanceable from home screen | `expo-widgets` (SDK 52+) — display mood score + affirmation |
| **Smart Compose** | AI-suggested journal prompts on empty body | Call Gemini via backend when body is empty — "What would you like to write about?" |
| **End-to-End Chat Encryption** | Private message security | Signal protocol or E2E via libsodium (beyond MVP) |

### Proposed Mobile-Only Features (Differentiation)

These features leverage **mobile capabilities the web cannot match** and would make the mobile version the superior journaling experience:

1. **Biometric Journal Lock** — Lock the app behind Face ID / fingerprint. Journaling is deeply personal. Web cannot enforce this.
2. **Voice Journaling** — Record audio journals; backend transcribes via Gemini and stores both audio + text. Mobile has the microphone.
3. **Widget: Daily Mood Glance** — iOS widgets / Android home screen widget showing today's mood score and affirmation. No reloading the app.
4. **Journal Streak Widget** — Home screen widget showing your current writing streak. Keeps you accountable.
5. **Photo Journal** — Camera capture directly in app (not just gallery pick). Web has limited camera access.
6. **Offline-First Architecture** — Full CRUD offline via local SQLite (`expo-sqlite`) with background sync. Work on a plane, sync when online.
7. **Haptic Mood Logging** — Quick mood log without typing: long-press haptic slider to log mood (1-100). So fast it takes 2 seconds.
8. **Share as Story** — Export journal entry as a beautifully formatted image (like Instagram story) with mood badge, date, and quote.
9. **Siri / Google Assistant Shortcuts** — "Hey Siri, log my mood" → opens app to quick-log screen.
10. **Journaling Streak Badges** — Gamification: 3-day, 7-day, 30-day streak awards with confetti animation (`react-native-reanimated`).

---

## Appendix A: Bundle & Performance

| Metric | Value |
|--------|-------|
| Framework | React Native 0.86 (Hermes engine) |
| Expo SDK | 57 |
| JS Engine | Hermes (default in Expo SDK 57) |
| Dependencies | 18 direct, minimal tree |
| Largest packages | `react-native-reanimated`, `zustand`, `axios` |
| No unused dependencies | Confirmed (no gRPC-web, no Chart.js, no Chakra UI) |
| Font loading | Async via `useFonts` hook with splash guard |
| Splash screen config | Color `#E6F4FE`, contain resize, icon + adaptive icon |
| Cache policy | None (always fresh from API) — tradeoff for simplicity |

## Appendix B: File Map (mobile/)

```
mobile/
├── app/                              # Expo Router routes
│   ├── _layout.tsx                   # Root: auth init + font load + Stack nav
│   ├── index.tsx                     # Auth gate redirect
│   ├── (auth)/
│   │   ├── _layout.tsx               # Auth group layout
│   │   ├── login.tsx                 # Login screen (keyboard avoid, error handling)
│   │   └── register.tsx              # Registration screen
│   ├── (tabs)/
│   │   ├── _layout.tsx               # Bottom tab navigator (4 tabs)
│   │   ├── index.tsx                 # Home: greeting, mood cards, recent, write btn
│   │   ├── journal.tsx               # Journal list: FlatList, FAB, search, skeleton
│   │   ├── calendar.tsx              # Calendar: month grid, day notes
│   │   └── profile.tsx               # Profile: avatar, info, chat btn, logout
│   ├── journal/
│   │   ├── new.tsx                   # Create: all fields, image picker, grats, guard
│   │   ├── [id].tsx                  # Detail: display + edit/delete actions
│   │   └── [id]/edit.tsx             # Edit: pre-filled form, 3-day restriction
│   ├── chat/
│   │   └── index.tsx                 # Chat: WebSocket messages, online users, typing
│   └── movies/
│       └── index.tsx                 # Movie recs: poster list, refresh
├── components/
│   ├── CalendarGrid.tsx              # Month calendar with marked days
│   ├── EmptyState.tsx                # Icon + message + action button
│   ├── ErrorMessage.tsx              # Dismissible error banner
│   ├── JournalCard.tsx               # Summary card for journal lists
│   ├── LoadingSpinner.tsx            # Centered ActivityIndicator
│   ├── MoodBadge.tsx                 # Colored mood tag
│   ├── MoodSummaryCard.tsx           # Mood score + dominant mood + affirmation
│   ├── RemoteImage.tsx               # Image with loading/error states + URL sub
│   ├── SearchBar.tsx                 # Search input with clear
│   └── Skeleton.tsx                  # Shimmer loading placeholder
├── services/
│   ├── api.ts                        # Axios instance + interceptors
│   ├── auth.ts                       # login, logout, me, refresh, register
│   ├── journal.ts                    # CRUD + search + updateWithImage
│   ├── analysis.ts                   # dailySummary, weeklySummary
│   ├── chat.ts                       # WebSocket ChatService class
│   └── recommendations.ts            # getRecommendations
├── store/
│   ├── authStore.ts                  # Zustand auth state + syncToken export
│   └── chatStore.ts                  # Zustand chat state + WebSocket events
├── hooks/
│   ├── useAuth.ts                    # Thin wrapper
│   ├── useJournals.ts                # Fetch + cache journal list
│   └── useMoodAnalysis.ts            # Fetch daily + weekly analysis
├── types/
│   └── index.ts                      # User, JournalNote, DailyAnalysis, etc.
├── constants/
│   ├── config.ts                     # API_BASE_URL, API_TIMEOUT
│   └── theme.ts                      # Colors and font family tokens
├── utils/
│   ├── date.ts                       # formatDate, todayISO, daysSince
│   ├── image.ts                      # resolveImageUrl
│   └── storage.ts                    # SecureStore get/set/delete
├── assets/                           # splash.png, icon.png, android icons
├── app.json                          # Expo config (scheme, splash, icons)
├── .env                              # EXPO_PUBLIC_API_BASE_URL
├── package.json                      # Dependencies (18 direct)
└── tsconfig.json                     # TypeScript config
```
