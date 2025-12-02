# Architecture: WebSocket Chat + gRPC AI Analysis

This document describes the dual-protocol architecture for real-time features and AI services.

## Reference & Access

Setup, installation, and run commands live in the centralized guide: [docs/README.md](../README.md).

Access:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- WebSocket Service: ws://localhost:8080
- AI Service (gRPC): localhost:50052 (backend ↔ Python only)

## Overview

```
┌─────────────────┐     WebSocket      ┌─────────────────┐
│    Frontend     │◄──────────────────►│  WebSocket Chat │
│   (React.js)    │                    │   (Node.js)     │
└────────┬────────┘                    └─────────────────┘
         │                                      
         │ REST API                             
         ▼                                      
┌─────────────────┐      gRPC         ┌─────────────────┐
│     Backend     │◄─────────────────►│   AI Service    │
│    (Laravel)    │                   │    (Python)     │
└─────────────────┘                   └─────────────────┘
```

## Service Responsibility Separation

### Python AI Service (`ai-service/`)
**ALL AI/ML logic is centralized here:**
- Google Gemini API calls
- Mood analysis (daily & weekly)
- Writing style analysis (author matching)
- Movie recommendations (mood-based)
- Natural language processing
- Machine learning models

**Why Python?**
- Rich ML/NLP ecosystem (NLTK, markovify, etc.)
- Google Gemini SDK support
- Better async handling for AI workloads
- Easy integration with ML frameworks

### Laravel Backend (`backend/`)
**Pure API & data layer:**
- REST API endpoints
- Database operations (CRUD)
- Authentication (JWT)
- File storage
- Request validation
- Response formatting
- **No direct AI API calls** - all AI requests go through gRPC to Python

### Node.js WebSocket (`websocket-service/`)
**Real-time communication:**
- Chat messaging (global/private)
- Typing indicators
- Presence tracking
- Real-time notifications

## Why This Architecture?

### gRPC for AI Analysis
- **Backend-to-backend**: No browser limitations
- **Strongly typed**: Proto contracts ensure consistency
- **Language agnostic**: Python for AI, PHP for web
- **Efficient**: Binary protocol, streaming support
- **Centralized AI**: All ML logic in one place

### WebSocket for Chat
- **Browser-native**: No proxies needed (unlike gRPC-Web + Envoy)
- **Bi-directional**: Perfect for real-time messaging
- **Simple reconnection**: Built-in browser support for reconnects
- **Mobile-friendly**: Works well on mobile networks

## AI Service RPCs

### `AnalyzeDaily`
Analyze a single day's journal notes for mood.
- Input: `DailyAnalysisRequest` (user_id, date, notes[])
- Output: `AnalysisResult` (summary, dominantMood, moodScore, highlights[], advice[], affirmation)

### `AnalyzeWeekly`
Aggregate daily summaries into weekly report.
- Input: `WeeklyAnalysisRequest` (user_id, week_start, week_end, daily_summaries[])
- Output: `AnalysisResult`

### `AnalyzeWritingStyle`
Analyze writing style and match to famous authors.
- Input: `WritingStyleRequest` (user_id, texts[])
- Output: `WritingStyleResult` (metrics, top_match, other_matches[])

### `GetMovieRecommendations`
Get personalized movie recommendations based on mood.
- Input: `MovieRecommendationRequest` (user_id, mood, mood_score, summary, highlights[], affirmation)
- Output: `MovieRecommendationResult` (category, headline, description, items[])

**Proto:** `ai-service/proto/ai.proto`

## Laravel Service Classes

### `AIGrpcClient`
Central gRPC client for all AI service communication.

```php
$client = new AIGrpcClient();

// Daily analysis
$result = $client->analyzeDaily($userId, $date, $notes);

// Weekly analysis
$result = $client->analyzeWeekly($userId, $weekStart, $weekEnd, $dailySummaries);

// Writing style
$result = $client->analyzeWritingStyle($userId, $texts);

// Movie recommendations
$result = $client->getMovieRecommendations($userId, $mood, $moodScore, $summary, $highlights, $affirmation);
```

### `GeminiMoodAnalysisService`
Wrapper for mood analysis via gRPC.

### `WeeklyMovieRecommendationService`
Movie recommendations via gRPC with fallback to curated lists.

### `RecommendationController`
Public endpoint for movie recommendations. It now injects and uses `AIGrpcClient` directly
to request movie recommendations from the Python AI service. The previous legacy
`GeminiMovieRecommendationService` (HTTP/old Gemini logic) has been removed — the
controller keeps a local OMDb poster-enrichment fallback and the Services layer
provides curated fallbacks when the gRPC AI service is unavailable.

## Services

### 1. WebSocket Chat Server (`websocket-service/server/websocket-server.js`)

**Port:** 8080 (configurable via `PORT` env)

**Features:**
- Global and private messaging
- Typing indicators
- Presence (online/offline) tracking
- JWT token verification
- Health endpoint: `GET /health` returns service status and active connection count
- Authorization: backend uses Laravel Policies for resource authorization; WebSocket validates JWT on connect

**Connection:**
```javascript
const ws = new WebSocket('ws://localhost:8080');
ws.send(JSON.stringify({
  type: 'auth',
  userId: '1',
  userName: 'John',
  token: 'jwt-token-here'
}));
```

### 2. AI Analysis Service (`ai-service/server.py`)

**Port:** 50052 (configurable via `GRPC_PORT` env)

**RPCs:**
- `AnalyzeDaily`: Analyze a day's journal notes
- `AnalyzeWeekly`: Aggregate daily summaries into weekly report
- `AnalyzeWritingStyle`: Analyze writing patterns and match to authors
- `GetMovieRecommendations`: Get mood-based movie recommendations

**Proto:** `ai-service/proto/ai.proto`

## Setup

### Prerequisites
- Node.js 18+
- Python 3.10+
- PHP 8.2+ with gRPC extension
- `protoc` (Protocol Buffer Compiler)

### 1. WebSocket Server
```bash
cd websocket-service
npm install
npm run server:start
```

### 2. AI Service
```bash
cd ai-service
python -m venv venv
.\venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

pip install -r requirements.txt
python generate_proto.py
python server.py
```

### 3. Laravel Backend
```bash
cd backend

# Install gRPC dependencies
composer require grpc/grpc google/protobuf

# Generate PHP proto classes
php generate-proto.php

# Add to .env
AI_GRPC_ENABLED=true
AI_GRPC_HOST=localhost
AI_GRPC_PORT=50052
```

## Environment Variables

### WebSocket Server
| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | WebSocket server port | `8080` |
| `JWT_SECRET` | JWT secret for token verification | (from backend/.env) |

### AI Service
| Variable | Description | Default |
|----------|-------------|---------|
| `GRPC_PORT` | gRPC server port | `50052` |
| `GOOGLE_GENAI_API_KEY` | Gemini API key | (required) |
| `GEMINI_MODEL` | Gemini model | `gemini-2.0-flash` |
| `DB_HOST` | MySQL host (for writing style) | `localhost` |
| `DB_DATABASE` | Database name | `uts_sem5` |
| `DB_USERNAME` | Database username | `root` |
| `DB_PASSWORD` | Database password | (empty) |

### Laravel Backend
| Variable | Description | Default |
|----------|-------------|---------|
| `AI_GRPC_ENABLED` | Enable gRPC for AI | `true` |
| `AI_GRPC_HOST` | AI service host | `localhost` |
| `AI_GRPC_PORT` | AI service port | `50052` |

## Development

### Running All Services (Single Terminal)
```bash
# Start all 4 services with colored output
npm run dev

# Start without AI service (if Python not needed)
npm run dev:no-ai
```

### Running Services Individually
```bash
# Terminal 1: WebSocket
cd websocket-service && npm run server:dev

# Terminal 2: AI Service
cd ai-service && python server.py

# Terminal 3: Laravel
cd backend && php artisan serve

# Terminal 4: Frontend
cd frontend && npm run dev
```

## Fallback Mode

The Laravel services include fallback logic for when the Python AI service is unavailable:
- `WeeklyMovieRecommendationService`: Falls back to curated movie lists based on mood category
- gRPC client checks `isAvailable()` before making calls

## File Structure

```
ai-service/
├── proto/
│   └── ai.proto              # gRPC service definition
├── server.py                 # gRPC server (all RPCs)
├── writing_style.py          # Writing style analyzer
├── movie_recommendations.py  # Movie recommendation logic
├── ai_pb2.py                 # Generated protobuf
├── ai_pb2_grpc.py            # Generated gRPC stubs
└── requirements.txt

backend/app/
├── Grpc/Ai/                  # PHP proto classes
│   ├── MovieItem.php
│   ├── MovieRecommendationRequest.php
│   ├── MovieRecommendationResult.php
│   ├── AuthorMatch.php
│   ├── WritingStyleRequest.php
│   └── WritingStyleResult.php
├── Services/
│   ├── AIGrpcClient.php              # Central gRPC client
│   ├── GeminiMoodAnalysisService.php # Mood analysis (gRPC)
│   └── WeeklyMovieRecommendationService.php # Movies (gRPC)
└── Http/Controllers/
    └── JournalAnalysisController.php # API endpoints
```

## Testing

### WebSocket
Open `http://localhost:8080` in a browser for a simple test page.

### AI gRPC
```bash
cd ai-service
# Use grpcurl or a gRPC client to test
grpcurl -plaintext localhost:50052 list
```

### Writing Style CLI
```bash
cd ai-service
python writing_style.py --text "Your text here..."
python writing_style.py --user-id 1  # Fetch from database
```
