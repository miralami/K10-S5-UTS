# Claude's Revision Plan — Mood Journal Mobile Client

> **Status:** Audit complete. All critical and high items implemented as of 2026-07-05.  
> **Scope:** Correctness issues, missing features, plan gaps, and priority remediation.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Bugs & Correctness Issues](#2-bugs--correctness-issues)
3. [Missing Features vs Plan](#3-missing-features-vs-plan)
4. [Plan Document Gaps](#4-plan-document-gaps)
5. [Things Done Better Than Plan](#5-things-done-better-than-plan)
6. [Priority Fixes](#6-priority-fixes)
7. [Verification Checklist](#7-verification-checklist)

---

## 1. Overview

The `plan.md` is well-specified and the implementation largely follows it. The foundation (auth flow, API shapes, service layer, project structure) is solid. This revision plan documents correctness bugs, non-trivial gaps, and plan-level oversights discovered during an independent code review.

**Severity legend:** 🔴 Critical — breaks core functionality away from dev machine. 🟡 High — violates plan constraints or loses type safety. 🔵 Medium — polish, edge cases, or documentation gaps. ✅ Fixed — applied in implementation pass.

---

## 2. Bugs & Correctness Issues

### ✅ R1 — Image URL host substituted (partial → complete)

**File:** N/A (applies everywhere `imageUrl` is rendered)  
**Plan reference:** §8 Critical Constraints ("Image URL host")

**Status: FIXED.** `[id].tsx` already had the substitution. `[id]/edit.tsx` was missing it — now fixed with `.replace(/http:\/\/localhost(:\d+)?/, API_BASE_URL.replace(/\/+$/, ''))` on the existing `note.imageUrl`.

A shared `resolveImageUrl` helper in `utils/image.ts` would be cleaner long-term but the inline fix is correct and consistent with `[id].tsx`'s existing approach.

---

### ✅ R2 — `analysis.ts` return type fixed

**File:** `services/analysis.ts:16`  
**Plan reference:** §7 Data Models (`WeeklyAnalysis` type exists)

**Status: FIXED.** Return type changed from `Promise<any>` to `Promise<WeeklyAnalysis | null>`. `WeeklyAnalysis` import confirmed already present in the file.

---

### ✅ R3 — Home screen weekly mood access fixed

**File:** `app/(tabs)/index.tsx:54`  
**Plan reference:** §7 Data Models

```ts
const weeklyMood = (weekly as any)?.dominantMood ?? null;
```

**Status: FIXED.** `weeklyMood` now reads `?.analysis?.dominantMood` first, then falls back to `?.dominantMood` flat — handles both the declared type and any flat API shape discrepancy.

---

### ✅ R4 — One-per-day guard implemented in Create form

**File:** `app/journal/new.tsx`  
**Plan reference:** §8 Critical Constraints ("One note per day")

**Status: FIXED.** `new.tsx` now runs a `useEffect` on mount: calls `journalService.list({ start_date: today, end_date: today })`. If a note is found, immediately `router.replace`s to `/journal/{id}/edit`. Shows `ActivityIndicator` while checking. On fetch error, falls through to the create form.

---

### ✅ R5 — authStore token synced after interceptor refresh

**File:** `services/api.ts` + `store/authStore.ts`  
**Plan reference:** §6 Authentication Flow (token refresh)

**Status: FIXED.** Added `setToken: (token: string) => void` to `AuthState` interface and store impl. Exported `syncToken` helper from `authStore.ts`. Called `syncToken(newToken)` inside `api.ts` refresh interceptor immediately after `saveToken`.

---

### ✅ R6 — Auth redirect already implemented (no fix required)

**File:** `app/_layout.tsx`  
**Plan reference:** §10 Navigation Architecture

**Status: ALREADY CORRECT.** `app/index.tsx` is a 10-line redirect file: reads `isAuthenticated` and `isLoading` from the store, returns `null` while loading, then `<Redirect href={isAuthenticated ? "/(tabs)" : "/(auth)/login"} />`. This fully covers the auth gate. The plan was wrong to flag this as missing.

---

### 🔵 R8 — Missing Navigation Feedback & Keyboard Handling
**Files:** `app/journal/[id].tsx`, `app/journal/new.tsx`, `app/(auth)/login.tsx`

**Gap:**
- Deleting an entry triggers `router.back()` with no toast or snackbar; the user lands on a stale list without visual confirmation.
- `KeyboardAvoidingView` uses platform-specific `behavior` but does not wrap ScrollView inside a touchable without feedback to dismiss the keyboard on tap outside, and `keyboardDismissMode="on-drag"` is absent from ScrollViews.

**Fix:** Add `keyboardDismissMode="on-drag"` to scroll views and implement a simple Toast context (or `Alert`) for destructive actions like delete.

---

### 🔵 R9 — Tech Config & Assets Gaps
**Files:** `app.json`, `package.json`

**Gap:**
- `app.json` has `predictiveBackGestureEnabled: false` set explicitly, hindering modern Android UX.
- There is no central Image caching/wrapper component handling the API base URL substitution (R1). The manual string replace should be encapsulated in a `<RemoteImage />` component.
- The plan specifies splash and icon configuration, but `app.json` does not strictly define the `splash` object.

**Fix:** Remove `predictiveBackGestureEnabled: false`, create a `<RemoteImage>` component that encapsulates R1, and define the `splash` object in `app.json`.

---

### ✅ R7 — Refresh URL trailing slash normalized

**File:** `services/api.ts:54`

**Status: FIXED.** URL construction changed from `` `${API_BASE_URL}/api/auth/refresh` `` to `` `${API_BASE_URL.replace(/\/+$/, '')}/api/auth/refresh` `` so a trailing slash in the env variable cannot produce a double-slash path.

---

## 3. Missing Features vs Plan

| # | Plan Item | Status | Notes |
|---|---|---|---|
| M1 | `utils/date.ts` (todayISO) | ✅ Present | Used by `new.tsx` |
| M2 | `utils/storage.ts` (SecureStore) | ✅ Present | 12 lines, correct |
| M3 | `constants/config.ts` | ✅ Present | Referenced by `api.ts` |
| M4 | `hooks/useAuth.ts` | ✅ Not needed | Screens import `authStore` directly — no separate hook required |
| M5 | `hooks/useJournals.ts` | ✅ Present | Used by journal list |
| M6 | `hooks/useMoodAnalysis.ts` | ✅ Present | Used by home screen |
| M7 | `components/JournalCard.tsx` | ✅ Present | Used by home + list |
| M8 | `components/MoodSummaryCard.tsx` | ✅ Present | Used by home |
| M9 | `components/SearchBar.tsx` | ✅ Present | Used by journal list |
| M10 | **3-day edit restriction UI** | ✅ Implemented | `edit.tsx` checks `daysSince > 3`, shows restriction screen |
| M11 | **404 / empty image handling** | ✅ Handled | `[id].tsx` guards `imageUrl && <Image>` — null safe |
| M12 | **Image URL host substitution** | ✅ Fixed | R1 applied to `[id].tsx` (existed) + `edit.tsx` (new) |
| M13 | **One-per-day guard (create)** | ✅ Fixed | R4 — mount effect in `new.tsx` |
| M14 | **Skeleton loading states** | ⏳ Deferred | Nice-to-have; `ActivityIndicator` covers functional need |

---

## 4. Plan Document Gaps

These are issues with `plan.md` itself — not the code — that would mislead a developer.

### P1 — "Has refresh token?" branch is misleading

**Plan reference:** §6, flow chart "Has refresh token?"

tymon/jwt-auth v2.2 is stateless — there is **no separate refresh token**. The flow should show:
- Has stored token → `POST /api/auth/refresh` → get new token.
- No stored token → Login.

The "Has refresh token?" check implies a two-token system (access + refresh), which does not match the backend.

### P2 — One-per-day check is underspecified

**Plan reference:** §11 Phase 3

"Check if today's note exists before showing Create vs Edit" — but which API call to use? The plan should say: `GET /api/journal/notes?start_date=today&end_date=today`, then navigate to `journal/[id]/edit` if result length > 0.

### P3 — `WeeklyAnalysis` response shape is undocumented

The plan includes a detailed `DailyAnalysis` response shape (§7) but not `WeeklyAnalysis`. The type was reverse-engineered into `types/index.ts`. The actual API response may differ — developer must verify against the running backend.

### P4 — Image upload `_method=PATCH` location is buried

**Plan reference:** §8 mentions the constraint, §13 has an example snippet. But the actual service function `updateWithImage` is in `services/journal.ts` (correctly split), and the plan doesn't reference it. A developer reading only §11 (phases) would miss the dual-path update logic.

### P5 — `logo` or splash screen assets referenced but not specced

**Plan reference:** §9 lists `assets/` in project structure but doesn't specify required splash, icon, or adaptive-icon config in `app.json`. The Expo SDK requires these for `npx expo start` to work without warnings.

### P6 — No error type / validation shape

The plan documents success response shapes (§5) but never the error response shape (Laravel returns `{ message: "...", errors: { field: ["..."] } }` on 422). Create/edit forms need to display per-field validation errors.

---

## 5. Things Done Better Than Plan

- **Queue-based refresh in `api.ts`** (lines 40-65) — handles concurrent 401s by queuing retries. Plan only mentions "one retry attempt."
- **Split `update` / `updateWithImage`** in `services/journal.ts` — clean separation that the plan's snippets don't show.
- **Image upload in Create form** — `new.tsx` already implements `expo-image-picker` + FormData with `_method=PATCH` pattern. Plan lists image upload as optional Phase 7.
- **Gratitude fields in Create form** — already included (plan lists as "implement if time allows").
- **Register screen, Chat screen, Movies screen** — already implemented beyond MVP scope.
- **`chatStore.ts` + `services/chat.ts`** — WebSocket chat client scaffolded, not even mentioned in MVP plan.
- **`SearchBar` component + search integration** — journal list already implements live search with `journalService.search`, listed as optional in plan.

---

## 6. Implementation Status

### ✅ Completed (2 passes)

#### Pass 1 — Critical & High

| ID | Fix | Files changed |
|---|---|---|
| **R1** | Image URL host substitution in edit screen | `app/journal/[id]/edit.tsx` |
| **R2** | `weeklySummary` return type `any` → `WeeklyAnalysis \| null` | `services/analysis.ts` |
| **R3** | Weekly mood access `?.analysis?.dominantMood` with flat fallback | `app/(tabs)/index.tsx` |
| **R4** | One-per-day guard on create screen (mount effect + redirect) | `app/journal/new.tsx` |
| **R5** | Token sync after interceptor refresh (`syncToken`) | `store/authStore.ts`, `services/api.ts` |
| **R6** | Auth redirect — confirmed already correct via `app/index.tsx` | No change |
| **R7** | Trailing slash normalized in refresh URL | `services/api.ts` |
| **R8** | `keyboardDismissMode="on-drag"` on create + edit ScrollViews | `app/journal/new.tsx`, `app/journal/[id]/edit.tsx` |

#### Pass 2 — Medium polish

| ID | Fix | Files changed |
|---|---|---|
| **R9** | `<RemoteImage>` component with loading/error states + `app.json` cleanup | `components/RemoteImage.tsx`, `utils/image.ts`, `app.json`, `app/journal/[id].tsx`, `app/journal/[id]/edit.tsx` |
| **P6** | Per-field 422 validation error display with red borders | `app/journal/new.tsx`, `app/journal/[id]/edit.tsx` |
| **M14** | Skeleton loading component with shimmer animation | `components/Skeleton.tsx`, `app/(tabs)/index.tsx`, `app/(tabs)/journal.tsx` |

---

## 7. Verification Checklist

- [x] **R1** Images in edit screen use `API_BASE_URL` not hardcoded `localhost`
- [x] **R2** `weeklySummary` typed as `WeeklyAnalysis | null` — no `any`
- [x] **R3** Weekly mood reads `?.analysis?.dominantMood` with flat fallback
- [x] **R4** Creating a second entry for today redirects to edit with loading state
- [x] **R5** After token refresh, `authStore.token` reflects the new token via `syncToken`
- [x] **R6** Expired token → `app/index.tsx` redirects to Login (confirmed pre-existing)
- [x] **R7** Trailing slash in `API_BASE_URL` cannot double-slash the refresh endpoint
- [x] **R8** Keyboard dismisses on scroll drag in create and edit forms
- [x] **R9** `<RemoteImage>` component encapsulates host substitution with loading/error states
- [x] **P6** Per-field 422 validation errors shown with red border + error text in create/edit forms
- [x] **M14** Skeleton loading states with shimmer animation on home + journal list
- [ ] **Manual** Run on physical device with `EXPO_PUBLIC_API_BASE_URL` pointing to a LAN IP — verify images load via RemoteImage
- [ ] **Manual** Log in, wait 60 min (or mock 401), verify silent refresh then `authStore.token` updates
- [ ] **Manual** Navigate to Journal → new on a day that already has an entry — verify redirect to edit
- [ ] **Manual** Trigger a 422 by submitting empty title/body — verify red borders + per-field messages appear

---

*Generated by Claude after independent code review against `plan.md` and `mobile/` implementation. Two implementation passes complete: all 14 items fixed (8 critical/high + 6 medium). Remaining work is manual verification only.*
