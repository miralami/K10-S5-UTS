# Technical Overview - Mood Journal & Chat Application

Dokumentasi teknis lengkap untuk sistem Mood Journal & Chat Application yang menggunakan arsitektur microservices dengan gRPC, WebSocket, dan AI integration.

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Technology Stack](#technology-stack)
3. [Service Components](#service-components)
4. [gRPC AI Service](#grpc-ai-service)
5. [WebSocket Real-time Chat](#websocket-real-time-chat)
6. [Backend API (Laravel)](#backend-api-laravel)
7. [Frontend (React)](#frontend-react)
8. [Database Schema](#database-schema)
9. [Communication Protocols](#communication-protocols)
10. [Deployment & Scaling](#deployment--scaling)

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           React Frontend (Port 5173)                      │  │
│  │  - Chakra UI Components                                   │  │
│  │  - State Management (Context API)                         │  │
│  │  - Real-time WebSocket Client                             │  │
│  │  - REST API Client (Axios)                                │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                    │                           │
                    │ REST API                  │ WebSocket
                    │ (HTTP/JSON)               │ (ws://)
                    ▼                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                        SERVICE LAYER                             │
│                                                                   │
│  ┌──────────────────────┐         ┌──────────────────────────┐ │
│  │  Laravel Backend     │         │  WebSocket Chat Server   │ │
│  │  (Port 8000)         │         │  (Node.js - Port 8080)   │ │
│  │                      │         │                          │ │
│  │  - REST API          │         │  - Real-time Messaging   │ │
│  │  - JWT Auth          │         │  - Presence Tracking     │ │
│  │  - Database ORM      │         │  - Typing Indicators     │ │
│  │  - File Storage      │         │  - JWT Verification      │ │
│  │  - gRPC Client       │         └──────────────────────────┘ │
│  └──────────────────────┘                                       │
│           │                                                      │
│           │ gRPC (Binary Protocol)                              │
│           ▼                                                      │
│  ┌──────────────────────┐                                       │
│  │  AI Analysis Service │                                       │
│  │  (Python - Port 50052)                                       │
│  │                      │                                       │
│  │  - Mood Analysis     │                                       │
│  │  - Writing Style     │                                       │
│  │  - Movie Recomm.     │                                       │
│  │  - Gemini API        │                                       │
│  └──────────────────────┘                                       │
└─────────────────────────────────────────────────────────────────┘
                    │
                    │ SQL Queries
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    MySQL Database                         │  │
│  │                                                            │  │
│  │  Tables:                                                   │  │
│  │  - users                                                   │  │
│  │  - journal_notes                                           │  │
│  │  - daily_journal_analyses                                  │  │
│  │  - weekly_journal_analyses                                 │  │
│  │  - messages                                                │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Design Principles

1. **Separation of Concerns**: Setiap service memiliki tanggung jawab spesifik
2. **Microservices Architecture**: Service independen yang dapat di-scale terpisah
3. **Protocol Optimization**: gRPC untuk backend-to-backend, WebSocket untuk real-time
4. **Fallback Mechanisms**: Sistem tetap berjalan meskipun service tertentu down
5. **Stateless Design**: Backend stateless untuk horizontal scaling

---

## Technology Stack

### Frontend
- **Framework**: React 19.2.0
- **UI Library**: Chakra UI 2.10.9
- **Animation**: Framer Motion 12.23.24
- **State Management**: React Context API
- **HTTP Client**: Axios
- **WebSocket**: Native WebSocket API
- **Date Handling**: date-fns 4.1.0
- **Charts**: Chart.js 4.5.1
- **Build Tool**: Vite 5.x

### Backend (Laravel)
- **Framework**: Laravel 12
- **Language**: PHP 8.2+
- **Database**: MySQL 8.0+
- **Authentication**: JWT (tymon/jwt-auth)
- **ORM**: Eloquent
- **API**: RESTful JSON API
- **gRPC Client**: grpc/grpc, google/protobuf
- **HTTP Client**: Guzzle (untuk Gemini API fallback)

### WebSocket Service
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **WebSocket**: ws library
- **Authentication**: JWT verification
- **Protocol**: WebSocket (ws://)

### AI Service
- **Language**: Python 3.10+
- **Framework**: gRPC (grpcio)
- **AI API**: Google Gemini API (google-generativeai)
- **NLP**: NLTK, markovify
- **Database**: MySQL connector (untuk writing style)
- **Protocol**: gRPC (Protocol Buffers)

### External APIs
- **Google Gemini API**: AI mood analysis & text generation
- **OMDB API**: Movie data & posters

---

## Service Components

### 1. Frontend Service (React)

**Port**: 5173  
**Purpose**: User interface dan client-side logic

#### Key Features
- Single Page Application (SPA)
- Responsive design dengan Chakra UI
- Real-time chat dengan WebSocket
- REST API integration
- JWT token management
- Image upload & preview
- Calendar view untuk journal
- Charts untuk mood visualization

#### Main Components
```
frontend/src/
├── components/
│   ├── JournalCalendar.jsx      # Calendar widget
│   ├── MoodEmoji.jsx             # Mood visualization
│   ├── MovieCard.jsx             # Movie recommendations
│   ├── ChatBubble.jsx            # Chat message UI
│   └── GratitudeStats.jsx        # Statistics display
├── pages/
│   ├── Dashboard.jsx             # Main dashboard
│   ├── JournalHistory.jsx        # Journal history
│   ├── Chat.jsx                  # Real-time chat
│   └── Search.jsx                # Search & filter
├── services/
│   ├── api.js                    # Axios instance
│   ├── journalService.js         # Journal API calls
│   ├── chatService.js            # Chat API calls
│   └── websocketService.js       # WebSocket client
└── contexts/
    └── AuthContext.jsx           # Auth state management
```

---

### 2. Backend Service (Laravel)

**Port**: 8000  
**Purpose**: REST API, database operations, business logic

#### Architecture Layers

```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── JwtAuthController.php          # Authentication
│   │   │   ├── JournalNoteController.php      # Journal CRUD
│   │   │   ├── JournalAnalysisController.php  # Mood analysis
│   │   │   ├── RecommendationController.php   # Movie recommendations
│   │   │   └── ChatController.php             # Chat history
│   │   ├── Requests/
│   │   │   ├── StoreJournalRequest.php        # Validation
│   │   │   └── UpdateJournalRequest.php
│   │   └── Middleware/
│   │       └── JwtMiddleware.php              # JWT verification
│   ├── Models/
│   │   ├── User.php
│   │   ├── JournalNote.php
│   │   ├── DailyJournalAnalysis.php
│   │   ├── WeeklyJournalAnalysis.php
│   │   └── Message.php
│   ├── Services/
│   │   ├── AIGrpcClient.php                   # gRPC client
│   │   ├── GeminiMoodAnalysisService.php      # Mood analysis
│   │   ├── WeeklyMovieRecommendationService.php
│   │   └── DailyJournalAnalysisService.php
│   └── Grpc/
│       ├── Ai/                                # Generated proto classes
│       │   ├── AIAnalysisServiceClient.php
│       │   ├── DailyAnalysisRequest.php
│       │   ├── WeeklyAnalysisRequest.php
│       │   ├── AnalysisResult.php
│       │   ├── WritingStyleRequest.php
│       │   ├── WritingStyleResult.php
│       │   ├── MovieRecommendationRequest.php
│       │   └── MovieRecommendationResult.php
│       └── GPBMetadata/
└── routes/
    └── api.php                                # API routes
```

#### Key Services

**AIGrpcClient**
- Central gRPC client untuk komunikasi dengan AI service
- Handles connection management
- Error handling & fallback logic
- Methods: `analyzeDaily()`, `analyzeWeekly()`, `analyzeWritingStyle()`, `getMovieRecommendations()`

**GeminiMoodAnalysisService**
- Wrapper untuk mood analysis
- Primary: gRPC ke Python AI service
- Fallback: Direct Gemini API call
- Last resort: Mock data

**WeeklyMovieRecommendationService**
- Movie recommendations berdasarkan mood
- Primary: gRPC ke Python AI service
- Fallback: Curated movie lists

#### API Endpoints

```
Authentication:
POST   /api/auth/register          # Register user
POST   /api/auth/login             # Login & get JWT
POST   /api/auth/logout            # Logout
GET    /api/auth/me                # Get current user

Journal Notes:
GET    /api/journal/notes          # List notes (with filters)
POST   /api/journal/notes          # Create note
GET    /api/journal/notes/{id}     # Get note
PATCH  /api/journal/notes/{id}     # Update note
DELETE /api/journal/notes/{id}     # Delete note

Gratitude:
GET    /api/journal/gratitude/stats         # Statistics
GET    /api/journal/gratitude/distribution  # Category distribution
GET    /api/journal/gratitude/insights      # Insights
GET    /api/journal/gratitude/random        # Random gratitude
GET    /api/journal/gratitude/prompts       # Writing prompts

Analysis:
GET    /api/journal/daily-summary/{date}    # Daily analysis
POST   /api/journal/generate-daily          # Generate daily
GET    /api/journal/weekly-summary          # Weekly analysis
POST   /api/journal/generate-weekly         # Generate weekly
GET    /api/journal/writing-style           # Writing style analysis

Recommendations:
GET    /api/recommendations/movies          # Movie recommendations

Chat:
GET    /api/chat/users                      # List users
GET    /api/chat/messages/{userId}          # Message history
POST   /api/chat/messages                   # Send message (stored)
PATCH  /api/chat/messages/{id}/read         # Mark as read
```

---

## gRPC AI Service

### Overview

Python-based microservice yang menangani semua AI/ML operations menggunakan Google Gemini API.

**Port**: 50052  
**Protocol**: gRPC (HTTP/2 + Protocol Buffers)  
**Language**: Python 3.10+

### Why gRPC?

1. **Performance**: Binary protocol lebih cepat dari JSON
2. **Type Safety**: Proto contracts mencegah type errors
3. **Streaming**: Support untuk streaming data (future use)
4. **Language Agnostic**: Python untuk AI, PHP untuk web
5. **Efficient**: Smaller payload size

### Proto Definition

File: `ai-service/proto/ai.proto`

```protobuf
syntax = "proto3";
package ai;

// Service definition
service AIAnalysisService {
  rpc AnalyzeDaily (DailyAnalysisRequest) returns (AnalysisResult);
  rpc AnalyzeWeekly (WeeklyAnalysisRequest) returns (AnalysisResult);
  rpc AnalyzeWritingStyle (WritingStyleRequest) returns (WritingStyleResult);
  rpc GetMovieRecommendations (MovieRecommendationRequest) returns (MovieRecommendationResult);
}

// Messages
message DailyAnalysisRequest {
  string user_id = 1;
  string date = 2;
  repeated JournalNote notes = 3;
}

message AnalysisResult {
  string summary = 1;
  string dominant_mood = 2;
  int32 mood_score = 3;
  repeated string highlights = 4;
  repeated string advice = 5;
  string affirmation = 6;
}

// ... more messages
```

### RPC Methods

#### 1. AnalyzeDaily

**Purpose**: Analisis mood dari journal notes harian

**Input**:
```python
{
  "user_id": "1",
  "date": "2025-12-20",
  "notes": [
    {
      "id": 1,
      "title": "Hari yang produktif",
      "body": "Hari ini saya menyelesaikan banyak pekerjaan...",
      "created_at": "2025-12-20T10:30:00Z"
    }
  ]
}
```

**Output**:
```python
{
  "summary": "Hari ini kamu sangat produktif dan penuh energi...",
  "dominant_mood": "energetic",
  "mood_score": 85,
  "highlights": [
    "Menyelesaikan banyak pekerjaan",
    "Merasa puas dengan pencapaian"
  ],
  "advice": [
    "Pertahankan momentum positif ini",
    "Jangan lupa istirahat yang cukup"
  ],
  "affirmation": "Kamu adalah pribadi yang produktif dan berdedikasi"
}
```

**Implementation**:
```python
def AnalyzeDaily(self, request, context):
    prompt = build_daily_prompt(list(request.notes), request.date)
    
    response = self.model.generate_content(
        prompt,
        generation_config=genai.GenerationConfig(
            response_mime_type="application/json"
        )
    )
    
    result_dict = parse_gemini_response(response.text)
    return dict_to_analysis_result(result_dict)
```

#### 2. AnalyzeWeekly

**Purpose**: Agregasi analisis harian menjadi ringkasan mingguan

**Input**:
```python
{
  "user_id": "1",
  "week_start": "2025-12-16",
  "week_end": "2025-12-22",
  "daily_summaries": [
    {
      "date": "2025-12-16",
      "summary": "Hari yang produktif",
      "dominant_mood": "energetic",
      "mood_score": 85,
      "highlights": ["Menyelesaikan project"],
      "advice": ["Pertahankan momentum"]
    }
    // ... more days
  ]
}
```

**Output**: Same structure as AnalysisResult

#### 3. AnalyzeWritingStyle

**Purpose**: Analisis gaya menulis dan cari author doppelgänger

**Features**:
- Vocabulary richness analysis
- Sentence structure analysis
- Punctuation pattern analysis
- Author matching algorithm
- Language detection

**Input**:
```python
{
  "user_id": "1",
  "texts": [
    "Journal entry 1...",
    "Journal entry 2...",
    // ... more entries
  ]
}
```

**Output**:
```python
{
  "total_words": 1500,
  "total_sentences": 85,
  "avg_sentence_length": 17.6,
  "vocabulary_richness": 0.68,
  "punctuation_density": 8.5,
  "avg_word_length": 5.2,
  "detected_language": "id",
  "top_words": ["hari (15x)", "saya (12x)", "merasa (10x)"],
  "top_match": {
    "name": "Virginia Woolf",
    "nationality": "British",
    "score": 85.5,
    "description": "Stream of consciousness writer...",
    "fun_fact": "Known for experimental narrative techniques"
  },
  "other_matches": [
    // ... 4 more author matches
  ]
}
```

#### 4. GetMovieRecommendations

**Purpose**: Rekomendasi film berdasarkan mood analysis

**Categories**:
- `joyful`: Happy, celebratory mood
- `comfort`: Need emotional support
- `grounding`: Need stability
- `reflective`: Introspective mood
- `motivational`: Need inspiration
- `balanced`: Neutral, balanced mood

**Input**:
```python
{
  "user_id": "1",
  "dominant_mood": "energetic",
  "mood_score": 85,
  "summary": "Minggu yang produktif...",
  "highlights": ["Menyelesaikan project", "Olahraga rutin"],
  "affirmation": "Kamu hebat!"
}
```

**Output**:
```python
{
  "category": "motivational",
  "mood_label": "Energized & Driven",
  "headline": "Keep That Momentum Going!",
  "description": "Films that celebrate achievement...",
  "items": [
    {
      "title": "The Pursuit of Happyness",
      "year": 2006,
      "tagline": "Never give up on your dreams",
      "imdb_id": "tt0454921",
      "genres": ["Biography", "Drama"],
      "reason": "Inspiring story of perseverance...",
      "poster_url": "https://..."
    }
    // ... 5 more movies
  ]
}
```

### Implementation Details

**File Structure**:
```
ai-service/
├── server.py                    # Main gRPC server
├── writing_style.py             # Writing analysis logic
├── movie_recommendations.py     # Movie recommendation logic
├── proto/
│   └── ai.proto                 # Proto definition
├── ai_pb2.py                    # Generated protobuf (Python)
├── ai_pb2_grpc.py               # Generated gRPC stubs (Python)
└── requirements.txt
```

**Key Dependencies**:
```txt
grpcio==1.71.2
grpcio-tools==1.71.2
google-generativeai==0.8.3
python-dotenv==1.0.1
mysql-connector-python==9.1.0
nltk==3.9.1
markovify==0.9.4
```

**Server Initialization**:
```python
def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    ai_pb2_grpc.add_AIAnalysisServiceServicer_to_server(
        AIAnalysisServicer(), server
    )
    server.add_insecure_port(f'[::]:{GRPC_PORT}')
    server.start()
    server.wait_for_termination()
```

### Error Handling

**gRPC Status Codes**:
- `OK`: Success
- `UNAVAILABLE`: Service not available (Gemini API down)
- `INVALID_ARGUMENT`: Invalid input data
- `INTERNAL`: Internal server error

**Fallback Strategy**:
1. Try gRPC call
2. If fails, try direct Gemini API
3. If fails, return mock/default data

---

## WebSocket Real-time Chat

### Overview

Node.js WebSocket server untuk real-time messaging, presence tracking, dan typing indicators.

**Port**: 8080  
**Protocol**: WebSocket (ws://)  
**Framework**: Express.js + ws library

### Why WebSocket?

1. **Real-time**: Bi-directional communication
2. **Browser Native**: No special setup needed
3. **Low Latency**: Persistent connection
4. **Mobile Friendly**: Works on mobile networks
5. **Simple Reconnection**: Built-in browser support

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  WebSocket Server                        │
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │           UserManager                            │   │
│  │  - Map<userId, {ws, user}>                       │   │
│  │  - Map<ws, userId>                               │   │
│  │  - addUser(), removeUser()                       │   │
│  │  - broadcast(), sendToUser()                     │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │           Message Handlers                       │   │
│  │  - auth: User authentication                     │   │
│  │  - message: Send message (global/private)        │   │
│  │  - typing: Typing indicator                      │   │
│  │  - get_users: Get online users                   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │           Health Check                           │   │
│  │  GET /health                                     │   │
│  │  - Returns connection count                      │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Connection Flow

```
Client                          Server
  │                               │
  │  1. WebSocket Connect         │
  ├──────────────────────────────>│
  │                               │
  │  2. Send Auth Message         │
  │  {type: 'auth', userId, ...}  │
  ├──────────────────────────────>│
  │                               │
  │  3. Verify JWT Token          │
  │                               │
  │  4. Register User             │
  │                               │
  │  5. Send Auth Success         │
  │  {type: 'auth_success', ...}  │
  │<──────────────────────────────┤
  │                               │
  │  6. Broadcast Presence        │
  │  {type: 'presence', ...}      │
  │<══════════════════════════════┤ (to all users)
  │                               │
  │  7. Send/Receive Messages     │
  │<─────────────────────────────>│
  │                               │
```

### Message Types

#### 1. Authentication

**Client → Server**:
```javascript
{
  type: 'auth',
  userId: '1',
  userName: 'John Doe',
  token: 'jwt-token-here'
}
```

**Server → Client**:
```javascript
{
  type: 'auth_success',
  users: [
    { id: '2', name: 'Jane', isOnline: true },
    { id: '3', name: 'Bob', isOnline: true }
  ]
}
```

#### 2. Global Message

**Client → Server**:
```javascript
{
  type: 'message',
  text: 'Hello everyone!',
  id: 'msg-123' // optional
}
```

**Server → All Clients**:
```javascript
{
  type: 'global_message',
  id: 'msg-123',
  sender: { id: '1', name: 'John', isOnline: true },
  text: 'Hello everyone!',
  timestamp: 1703073600000
}
```

#### 3. Private Message

**Client → Server**:
```javascript
{
  type: 'message',
  text: 'Hi Jane!',
  recipientId: '2'
}
```

**Server → Recipient & Sender**:
```javascript
{
  type: 'private_message',
  id: 'msg-456',
  sender: { id: '1', name: 'John', isOnline: true },
  recipient: { id: '2', name: 'Jane', isOnline: true },
  text: 'Hi Jane!',
  timestamp: 1703073600000
}
```

#### 4. Typing Indicator

**Client → Server**:
```javascript
{
  type: 'typing',
  contextId: 'global', // or userId for private
  isTyping: true
}
```

**Server → Other Users**:
```javascript
{
  type: 'typing',
  user: { id: '1', name: 'John', isOnline: true },
  contextId: 'global',
  isTyping: true,
  timestamp: 1703073600000
}
```

#### 5. Presence Update

**Server → All Users** (when user connects/disconnects):
```javascript
{
  type: 'presence',
  user: { id: '1', name: 'John', isOnline: true },
  isOnline: true,
  timestamp: 1703073600000
}
```

### UserManager Class

```javascript
class UserManager {
  constructor() {
    this.users = new Map();        // userId -> {ws, user}
    this.socketToUser = new Map(); // ws -> userId
  }

  addUser(ws, userId, userName) {
    // Register user and handle reconnection
  }

  removeUser(ws) {
    // Remove user on disconnect
  }

  broadcast(message, excludeUserId) {
    // Send to all users except excluded
  }

  sendToUser(userId, message) {
    // Send to specific user
  }

  getAllUsers() {
    // Get all online users
  }
}
```

### Security Features

1. **JWT Verification**: Token validated on connection
2. **User Isolation**: Users can only send messages as themselves
3. **Rate Limiting**: Can be added via middleware
4. **Connection Timeout**: Ping/pong heartbeat every 30s
5. **Graceful Reconnection**: Old connections closed on reconnect

### Health Check

```bash
GET http://localhost:8080/health

Response:
{
  "status": "ok",
  "timestamp": "2025-12-20T10:30:00.000Z",
  "service": "websocket-service",
  "connections": 5
}
```

---

## Backend API (Laravel)

### Request/Response Flow

```
Client Request
    │
    ▼
┌─────────────────┐
│  Middleware     │
│  - CORS         │
│  - JWT Auth     │
│  - Rate Limit   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Controller     │
│  - Validation   │
│  - Business     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Service Layer  │
│  - gRPC Client  │
│  - AI Analysis  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Model/ORM      │
│  - Eloquent     │
│  - Database     │
└────────┬────────┘
         │
         ▼
    Response JSON
```

### Authentication Flow

```
1. User Login
   POST /api/auth/login
   { email, password }
   
2. Backend Validates
   - Check credentials
   - Generate JWT token
   
3. Return Token
   {
     "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
     "token_type": "bearer",
     "expires_in": 3600,
     "user": { id, name, email }
   }
   
4. Client Stores Token
   localStorage.setItem('token', token)
   
5. Subsequent Requests
   Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
   
6. Backend Verifies
   - Decode JWT
   - Check expiration
   - Extract user_id
   - Authorize request
```

### Service Layer Pattern

**AIGrpcClient.php**:
```php
class AIGrpcClient
{
    private ?AIAnalysisServiceClient $client = null;
    
    public function analyzeDaily(string $userId, string $date, array $notes): array
    {
        $request = new DailyAnalysisRequest([
            'user_id' => $userId,
            'date' => $date,
            'notes' => $this->convertNotes($notes)
        ]);
        
        [$response, $status] = $this->getClient()
            ->AnalyzeDaily($request)
            ->wait();
            
        if ($status->code !== \Grpc\STATUS_OK) {
            throw new RuntimeException($status->details);
        }
        
        return $this->convertAnalysisResult($response);
    }
}
```

**GeminiMoodAnalysisService.php**:
```php
class GeminiMoodAnalysisService
{
    public function analyzeDailyNotes(Collection $notes, CarbonInterface $day): array
    {
        try {
            // Try gRPC first
            if (config('services.ai_grpc.enabled')) {
                return $this->grpcClient->analyzeDaily(...);
            }
        } catch (\Throwable $e) {
            Log::warning('gRPC failed, trying direct Gemini API');
        }
        
        // Fallback to direct Gemini API
        try {
            return $this->analyzeDailyWithGemini($notes, $day);
        } catch (\Throwable $e) {
            Log::warning('Gemini API failed, using mock data');
        }
        
        // Last resort: mock data
        return $this->getMockAnalysis($notes);
    }
}
```

---

## Frontend (React)

### State Management

```javascript
// AuthContext.jsx
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  
  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    setToken(response.data.access_token);
    setUser(response.data.user);
    localStorage.setItem('token', response.data.access_token);
  };
  
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };
  
  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
```

### WebSocket Integration

```javascript
// websocketService.js
class WebSocketService {
  constructor() {
    this.ws = null;
    this.listeners = new Map();
  }
  
  connect(userId, userName, token) {
    this.ws = new WebSocket('ws://localhost:8080');
    
    this.ws.onopen = () => {
      this.send({
        type: 'auth',
        userId,
        userName,
        token
      });
    };
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.notifyListeners(data.type, data);
    };
  }
  
  send(message) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }
  
  on(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType).push(callback);
  }
}
```

### API Service

```javascript
// journalService.js
export const journalService = {
  async getNotes(filters = {}) {
    const response = await api.get('/journal/notes', { params: filters });
    return response.data;
  },
  
  async createNote(data) {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });
    
    const response = await api.post('/journal/notes', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  
  async getDailySummary(date) {
    const response = await api.get(`/journal/daily-summary/${date}`);
    return response.data;
  }
};
```

---

## Database Schema

### Entity Relationship Diagram

```
┌─────────────────┐
│     users       │
├─────────────────┤
│ id (PK)         │
│ name            │
│ email (unique)  │
│ password        │
│ created_at      │
│ updated_at      │
└────────┬────────┘
         │ 1
         │
         │ N
┌────────┴────────────────────────────────────────┐
│                                                  │
│                                                  │
┌─────────────────────────────┐    ┌──────────────────────────────┐
│     journal_notes           │    │  daily_journal_analyses      │
├─────────────────────────────┤    ├──────────────────────────────┤
│ id (PK)                     │    │ id (PK)                      │
│ user_id (FK)                │    │ user_id (FK)                 │
│ title                       │    │ analysis_date (unique)       │
│ body                        │    │ analysis (JSON)              │
│ note_date                   │    │ created_at                   │
│ gratitude_1                 │    │ updated_at                   │
│ gratitude_2                 │    └──────────────────────────────┘
│ gratitude_3                 │
│ gratitude_category_1        │    ┌──────────────────────────────┐
│ gratitude_category_2        │    │  weekly_journal_analyses     │
│ gratitude_category_3        │    ├──────────────────────────────┤
│ image_path                  │    │ id (PK)                      │
│ created_at                  │    │ user_id (FK)                 │
│ updated_at                  │    │ week_start                   │
└─────────────────────────────┘    │ week_end                     │
                                    │ analysis (JSON)              │
┌─────────────────────────────┐    │ recommendations (JSON)       │
│        messages             │    │ created_at                   │
├─────────────────────────────┤    │ updated_at                   │
│ id (PK)                     │    └──────────────────────────────┘
│ sender_id (FK)              │
│ receiver_id (FK)            │
│ message                     │
│ is_read                     │
│ created_at                  │
│ updated_at                  │
└─────────────────────────────┘
```

### Table Details

#### users
```sql
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);
```

#### journal_notes
```sql
CREATE TABLE journal_notes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(255),
    body TEXT,
    note_date DATE NOT NULL,
    gratitude_1 TEXT,
    gratitude_2 TEXT,
    gratitude_3 TEXT,
    gratitude_category_1 VARCHAR(255),
    gratitude_category_2 VARCHAR(255),
    gratitude_category_3 VARCHAR(255),
    image_path VARCHAR(255),
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_date (user_id, note_date)
);
```

#### daily_journal_analyses
```sql
CREATE TABLE daily_journal_analyses (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    analysis_date DATE NOT NULL,
    analysis JSON NOT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_date (user_id, analysis_date)
);
```

**analysis JSON structure**:
```json
{
  "summary": "Ringkasan mood hari ini",
  "dominantMood": "happy",
  "moodScore": 85,
  "highlights": ["Poin penting 1", "Poin penting 2"],
  "advice": ["Saran 1", "Saran 2"],
  "affirmation": "Afirmasi positif",
  "noteCount": 3
}
```

#### weekly_journal_analyses
```sql
CREATE TABLE weekly_journal_analyses (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    analysis JSON NOT NULL,
    recommendations JSON,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_week (user_id, week_start)
);
```

**recommendations JSON structure**:
```json
{
  "category": "joyful",
  "mood_label": "Happy & Energized",
  "headline": "Celebrate Your Joy!",
  "description": "Films that amplify happiness...",
  "items": [
    {
      "title": "The Grand Budapest Hotel",
      "year": 2014,
      "tagline": "A delightful adventure",
      "imdb_id": "tt2278388",
      "genres": ["Comedy", "Drama"],
      "reason": "Whimsical and uplifting...",
      "poster_url": "https://..."
    }
  ]
}
```

#### messages
```sql
CREATE TABLE messages (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sender_id BIGINT UNSIGNED NOT NULL,
    receiver_id BIGINT UNSIGNED NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_conversation (sender_id, receiver_id, created_at)
);
```

---

## Communication Protocols

### 1. REST API (HTTP/JSON)

**Use Case**: Frontend ↔ Backend communication

**Characteristics**:
- Request/Response pattern
- Stateless
- JSON payload
- HTTP methods (GET, POST, PATCH, DELETE)

**Example**:
```http
POST /api/journal/notes HTTP/1.1
Host: localhost:8000
Authorization: Bearer eyJ0eXAiOiJKV1Qi...
Content-Type: application/json

{
  "title": "My Day",
  "body": "Today was great...",
  "note_date": "2025-12-20",
  "gratitude_1": "Family time"
}

HTTP/1.1 201 Created
Content-Type: application/json

{
  "data": {
    "id": 123,
    "title": "My Day",
    "body": "Today was great...",
    "note_date": "2025-12-20",
    "created_at": "2025-12-20T10:30:00Z"
  }
}
```

### 2. WebSocket (ws://)

**Use Case**: Real-time chat, presence, typing indicators

**Characteristics**:
- Bi-directional
- Persistent connection
- Low latency
- Event-driven

**Example**:
```javascript
// Client
ws.send(JSON.stringify({
  type: 'message',
  text: 'Hello!',
  recipientId: '2'
}));

// Server broadcasts
{
  type: 'private_message',
  id: 'msg-123',
  sender: { id: '1', name: 'John' },
  recipient: { id: '2', name: 'Jane' },
  text: 'Hello!',
  timestamp: 1703073600000
}
```

### 3. gRPC (HTTP/2 + Protobuf)

**Use Case**: Backend ↔ AI Service communication

**Characteristics**:
- Binary protocol (efficient)
- Strongly typed (Proto contracts)
- HTTP/2 (multiplexing, streaming)
- Language agnostic

**Example**:
```php
// PHP Client
$request = new DailyAnalysisRequest([
    'user_id' => '1',
    'date' => '2025-12-20',
    'notes' => [...]
]);

[$response, $status] = $client->AnalyzeDaily($request)->wait();

// Python Server
def AnalyzeDaily(self, request, context):
    # Process request
    return AnalysisResult(
        summary="...",
        dominant_mood="happy",
        mood_score=85
    )
```

### Protocol Comparison

| Feature | REST | WebSocket | gRPC |
|---------|------|-----------|------|
| **Pattern** | Request/Response | Bi-directional | Request/Response |
| **Connection** | Stateless | Persistent | Persistent |
| **Format** | JSON | JSON | Protobuf (binary) |
| **Overhead** | High | Low | Very Low |
| **Browser Support** | ✅ Native | ✅ Native | ❌ Needs proxy |
| **Type Safety** | ❌ No | ❌ No | ✅ Yes |
| **Streaming** | ❌ No | ✅ Yes | ✅ Yes |
| **Best For** | CRUD APIs | Real-time | Backend-to-backend |

---

## Deployment & Scaling

### Development Setup

```bash
# Single command to start all services
npm run dev

# Or individually
npm run dev:backend      # Laravel (port 8000)
npm run dev:frontend     # React (port 5173)
npm run dev:websocket    # WebSocket (port 8080)
npm run dev:ai           # AI Service (port 50052)
```

### Production Deployment

#### Architecture

```
                    ┌─────────────────┐
                    │   Load Balancer │
                    │   (Nginx/HAProxy)│
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  Backend #1   │   │  Backend #2   │   │  Backend #3   │
│  (Laravel)    │   │  (Laravel)    │   │  (Laravel)    │
└───────┬───────┘   └───────┬───────┘   └───────┬───────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
                    ┌────────┴────────┐
                    │   MySQL Master  │
                    │   (Read/Write)  │
                    └────────┬────────┘
                             │
                    ┌────────┴────────┐
                    │  MySQL Replica  │
                    │   (Read Only)   │
                    └─────────────────┘

┌─────────────────────────────────────────────────────┐
│              WebSocket Cluster                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │  WS #1   │  │  WS #2   │  │  WS #3   │         │
│  └──────────┘  └──────────┘  └──────────┘         │
│         │            │            │                 │
│         └────────────┼────────────┘                 │
│                      │                              │
│              ┌───────┴───────┐                      │
│              │  Redis PubSub │                      │
│              │  (Sync state) │                      │
│              └───────────────┘                      │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│              AI Service Cluster                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │  AI #1   │  │  AI #2   │  │  AI #3   │         │
│  └──────────┘  └──────────┘  └──────────┘         │
└─────────────────────────────────────────────────────┘
```

### Scaling Strategies

#### 1. Backend (Laravel)

**Horizontal Scaling**:
- Stateless design allows multiple instances
- Load balancer distributes requests
- Shared session storage (Redis)
- Shared file storage (S3/NFS)

**Optimization**:
```php
// Cache configuration
'cache' => [
    'default' => 'redis',
    'stores' => [
        'redis' => [
            'driver' => 'redis',
            'connection' => 'cache',
        ],
    ],
],

// Queue for async jobs
'queue' => [
    'default' => 'redis',
],
```

#### 2. WebSocket Service

**Horizontal Scaling with Redis**:
```javascript
// Use Redis PubSub for cross-server communication
const redis = require('redis');
const publisher = redis.createClient();
const subscriber = redis.createClient();

// When user sends message
publisher.publish('chat:messages', JSON.stringify(message));

// All servers receive and broadcast
subscriber.subscribe('chat:messages');
subscriber.on('message', (channel, message) => {
  const data = JSON.parse(message);
  userManager.broadcast(data);
});
```

**Sticky Sessions**:
- Use IP hash or cookie-based routing
- Ensures user stays on same server
- Simplifies state management

#### 3. AI Service

**Horizontal Scaling**:
- Multiple Python instances
- gRPC load balancing (round-robin)
- No shared state needed
- Independent Gemini API calls

**Load Balancing**:
```php
// Laravel config
'ai_grpc' => [
    'hosts' => [
        'ai-service-1:50052',
        'ai-service-2:50052',
        'ai-service-3:50052',
    ],
    'load_balancer' => 'round_robin',
],
```

#### 4. Database

**Read Replicas**:
```php
'mysql' => [
    'read' => [
        'host' => ['mysql-replica-1', 'mysql-replica-2'],
    ],
    'write' => [
        'host' => ['mysql-master'],
    ],
],
```

**Indexing**:
```sql
-- Optimize common queries
CREATE INDEX idx_user_date ON journal_notes(user_id, note_date);
CREATE INDEX idx_conversation ON messages(sender_id, receiver_id, created_at);
CREATE INDEX idx_analysis_date ON daily_journal_analyses(user_id, analysis_date);
```

### Monitoring & Observability

#### Health Checks

```bash
# Backend
curl http://localhost:8000/api/health

# WebSocket
curl http://localhost:8080/health

# AI Service (gRPC)
grpcurl -plaintext localhost:50052 grpc.health.v1.Health/Check
```

#### Metrics to Monitor

**Backend**:
- Request rate (req/s)
- Response time (p50, p95, p99)
- Error rate (%)
- Database query time
- gRPC call latency

**WebSocket**:
- Active connections
- Message throughput
- Connection duration
- Reconnection rate

**AI Service**:
- RPC call rate
- Gemini API latency
- Success/failure rate
- Queue depth

#### Logging

```php
// Laravel
Log::info('Daily analysis requested', [
    'user_id' => $userId,
    'date' => $date,
    'note_count' => $notes->count(),
]);

// Python
logger.info(f"AnalyzeDaily called for user {request.user_id}, date {request.date}")

// Node.js
console.log(`User ${userName} (${userId}) connected. Total users: ${this.users.size}`);
```

### Performance Optimization

#### Caching Strategy

```php
// Cache daily analysis for 1 hour
$analysis = Cache::remember("daily_analysis:{$userId}:{$date}", 3600, function() {
    return $this->geminiService->analyzeDailyNotes($notes, $date);
});

// Cache weekly analysis for 24 hours
$weekly = Cache::remember("weekly_analysis:{$userId}:{$weekStart}", 86400, function() {
    return $this->geminiService->analyzeWeeklyFromDaily($dailyAnalyses, $weekEnd);
});
```

#### Database Optimization

```php
// Eager loading to prevent N+1
$notes = JournalNote::with('user')
    ->where('user_id', $userId)
    ->whereBetween('note_date', [$start, $end])
    ->get();

// Pagination for large datasets
$notes = JournalNote::where('user_id', $userId)
    ->orderBy('note_date', 'desc')
    ->paginate(20);
```

#### API Rate Limiting

```php
// routes/api.php
Route::middleware(['throttle:60,1'])->group(function () {
    Route::post('/journal/notes', [JournalNoteController::class, 'store']);
});

// Custom rate limit for AI endpoints
Route::middleware(['throttle:10,1'])->group(function () {
    Route::post('/journal/generate-weekly', [JournalAnalysisController::class, 'generateWeekly']);
});
```

---

## Security Considerations

### Authentication & Authorization

1. **JWT Tokens**: Stateless authentication
2. **Token Expiration**: 1 hour default
3. **Refresh Tokens**: For long-lived sessions
4. **Password Hashing**: bcrypt with salt
5. **CORS**: Configured for frontend domain

### Data Protection

1. **SQL Injection**: Eloquent ORM prevents
2. **XSS**: React escapes by default
3. **CSRF**: Not needed for stateless API
4. **File Upload**: Validation & sanitization
5. **Rate Limiting**: Prevent abuse

### Network Security

1. **HTTPS**: TLS encryption in production
2. **WSS**: Secure WebSocket in production
3. **gRPC TLS**: Encrypted backend communication
4. **API Keys**: Environment variables only
5. **Firewall**: Restrict port access

---

## Conclusion

Sistem Mood Journal & Chat Application menggunakan arsitektur microservices modern dengan:

- **gRPC** untuk komunikasi backend-to-backend yang efisien
- **WebSocket** untuk real-time messaging yang responsive
- **REST API** untuk operasi CRUD yang standard
- **AI Integration** dengan Google Gemini untuk mood analysis
- **Scalable Design** yang dapat di-scale horizontal
- **Fallback Mechanisms** untuk reliability tinggi

Setiap komponen dirancang untuk independen, maintainable, dan dapat di-scale sesuai kebutuhan.

---

**Last Updated**: December 2025  
**Version**: 1.0.0  
**Project**: K10-S5-UTS Mood Journal Application
