# Architecture: WebSocket Chat + gRPC AI Analysis

This document describes the dual-protocol architecture for real-time features.

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

## Why This Architecture?

### WebSocket for Chat
- **Browser-native**: No proxies needed (unlike gRPC-Web + Envoy)
- **Bi-directional**: Perfect for real-time messaging
- **Simple reconnection**: Built-in browser support for reconnects
- **Mobile-friendly**: Works well on mobile networks

### gRPC for AI Analysis
- **Backend-to-backend**: No browser limitations
- **Strongly typed**: Proto contracts ensure consistency
- **Language agnostic**: Python for AI, PHP for web
- **Efficient**: Binary protocol, streaming support

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

**Proto:** `shared/proto/ai.proto`
**Note:** The canonical proto file is stored under `ai-service/proto/ai.proto` (the `shared/` folder was removed during cleanup).

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

### Laravel Backend
| Variable | Description | Default |
|----------|-------------|---------|
| `AI_GRPC_ENABLED` | Enable gRPC for AI | `false` |
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

If `AI_GRPC_ENABLED=false` (default), Laravel will call the Gemini API directly using HTTP. This is useful for:
- Development without running the Python service
- Environments where gRPC is hard to set up

## Testing

### WebSocket
Open `http://localhost:8080` in a browser for a simple test page.

### AI gRPC
```bash
cd ai-service
# Use grpcurl or a gRPC client to test
grpcurl -plaintext localhost:50052 list
```
