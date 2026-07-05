# Mood Journal & Chat Application

A journaling app with AI-powered mood analysis, movie recommendations, real-time chat, and a **cross-platform mobile client**.

---

## Quick Start

### Web (all services)
```bash
# Install dependencies
npm run install-all

# Start all services (Backend, Frontend, WebSocket, AI)
npm run dev

# Or start without AI service
npm run dev:no-ai
```

### Mobile (React Native)
```bash
cd mobile
npm install
cp .env.example .env   # set EXPO_PUBLIC_API_BASE_URL
npx expo start
# Scan QR code with Expo Go (or press 'a' for Android emulator)
```

**Default Ports:**

| Service | URL |
|---------|-----|
| Backend (Laravel) | `http://localhost:8000` |
| Frontend (React SPA) | `http://localhost:5173` |
| **Mobile (Expo)** | Expo Go QR / `http://localhost:8081` (Metro) |
| WebSocket (Chat) | `ws://localhost:8080` |
| AI Service (gRPC) | `localhost:50052` |

---

## Documentation

### Core Docs
- **[docs/MOBILE-VERSION.md](docs/MOBILE-VERSION.md)** — 📱 **Mobile client** full technical overview, features, differences from web, architecture
- **[FEATURES.md](FEATURES.md)** — Full feature documentation & data sources
- **[START_ALL_SERVICES.md](START_ALL_SERVICES.md)** — Run guide
- **[TEST_ACCOUNTS.md](TEST_ACCOUNTS.md)** — Dev test accounts

### Technical Docs
- **[docs/README.md](docs/README.md)** — Project overview & setup
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** — System architecture
- **[docs/COMMANDS.md](docs/COMMANDS.md)** — Command reference
- **[docs/ci-explanation/CI-IMPLEMENTATION.md](docs/ci-explanation/CI-IMPLEMENTATION.md)** — CI/CD setup

---

## Features

### Web Frontend (React SPA)
- Journal notes with image upload
- Gratitude journal (3 per day, auto-categorized)
- AI-powered daily & weekly mood analysis
- Movie recommendations (OMDb)
- **Music recommendations (Last.fm)**
- Writing style analysis & author doppelgänger
- Real-time WebSocket chat (global + **private messaging**)
- Calendar view with day navigation
- Search & filter
- Mood charts & visualizations (Chart.js)
- **Gratitude stats & insights**
- **Journal streak tracking**
- Desktop-optimized sidebar layout

### Mobile App (React Native / Expo)
*→ [Full detailed comparison in docs/MOBILE-VERSION.md](docs/MOBILE-VERSION.md)*

- **All core journaling features** — CRUD, image upload, gratitude fields, AI mood analysis
- **Search & calendar** — server-side search, monthly calendar grid
- **Movie recommendations** — dedicated screen with poster cards
- **Real-time chat** — WebSocket global chat with presence & typing indicators
- **Mobile-native UX** — pull-to-refresh, haptic feedback, toast notifications, keyboard avoidance
- **Secure by default** — encrypted `expo-secure-store` token persistence, silent 401 refresh
- **Deep typography system** — Playfair Display + Crimson Text, warm parchment theme
- **Auto-login** on app restart, offline resilience

---

## Tech Stack

### Web Frontend
| Tech | Version |
|------|---------|
| React | 19.2.0 |
| Chakra UI | 2.10.9 |
| Framer Motion | 12.23.24 |
| date-fns | 4.1.0 |
| Chart.js | 4.5.1 |

### Mobile App
| Tech | Version |
|------|---------|
| React Native (Expo) | SDK 57 |
| Expo Router | File-based navigation |
| Zustand | State management |
| Axios | HTTP with JWT interceptor |
| expo-secure-store | Encrypted token storage |

### Backend & Services
| Service | Stack |
|---------|-------|
| Backend API | Laravel 12, PHP 8.2 |
| Database | MySQL |
| Auth | JWT (tymon/jwt-auth, HS256) |
| AI | Google Gemini (`gemini-2.0-flash`) |
| Chat | Node.js WebSocket |
| AI Microservice | Python gRPC (optional) |

---

## Project Structure

```
K10-S5-UTS/
├── backend/           # Laravel API (:8000)
├── frontend/          # React SPA (:5173)
├── mobile/            # React Native / Expo app (Expo Go)
├── chat-service/      # WebSocket server (:8080)
├── ai-service/        # Python gRPC (:50052, optional)
├── docs/              # Technical documentation
│   └── MOBILE-VERSION.md
├── scripts/           # Install & utility scripts
├── FEATURES.md
├── START_ALL_SERVICES.md
├── TEST_ACCOUNTS.md
└── package.json       # Root workspace config
```

---

## Configuration

### Backend (.env)
```env
DB_DATABASE=journal_app
GOOGLE_GENAI_API_KEY=your_gemini_api_key
OMDB_API_KEY=your_omdb_key
AI_GRPC_ENABLED=false
JWT_SECRET=your_jwt_secret
```

### Web Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8080
```

### Mobile (.env)
```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000
# Physical device: use LAN IP (192.168.x.x:8000)
# Android emulator: use http://10.0.2.2:8000
```

---

## Test Accounts

See [TEST_ACCOUNTS.md](TEST_ACCOUNTS.md) for login credentials.

---

## Learn More

| Question | Go To |
|----------|-------|
| **How does the mobile app work?** | [docs/MOBILE-VERSION.md](docs/MOBILE-VERSION.md) |
| What features exist? | [FEATURES.md](FEATURES.md) |
| How to run everything? | [START_ALL_SERVICES.md](START_ALL_SERVICES.md) |
| System architecture? | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |

---

## License

Educational project for UTS Semester 5.
