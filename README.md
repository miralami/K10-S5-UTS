# K10-S5-UTS: Mood Journal Application

A full-stack mood journaling application with AI-powered analysis, real-time chat, and movie recommendations.

## 🚀 Getting Started

This guide provides easy-to-follow instructions for setting up the project on a new device (Windows).

### 1. Prerequisites

Ensure you have the following installed:
- **Git**: [Download](https://git-scm.com/downloads)
- **Node.js** (v18+): [Download](https://nodejs.org/)
- **PHP** (v8.2+): [Download](https://windows.php.net/download/)
- **Composer**: [Download](https://getcomposer.org/download/)
- **Python** (v3.10+): [Download](https://www.python.org/downloads/) (Optional, for AI service)

### 2. Installation

1. **Clone the repository**
   ```powershell
   git clone https://github.com/miralami/K10-S5-UTS.git
   cd K10-S5-UTS
   ```

2. **Run the automated installer**
   This script installs dependencies for Laravel, React, WebSocket, and Python AI service.
   ```powershell
   .\scripts\install-all.ps1
   ```

### 3. Configuration

1. **Backend Configuration**
   Open `backend\.env` and configure your database and API keys.
   
   ```ini
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=uts_sem5
   DB_USERNAME=root
   DB_PASSWORD=

   # Required for AI features
   GOOGLE_GENAI_API_KEY=your_gemini_api_key_here
   
   # Enable gRPC for AI (Optional, defaults to false/HTTP)
   AI_GRPC_ENABLED=true
   ```

2. **Database Setup**
   Make sure your MySQL server is running and the database `uts_sem5` exists.
   ```powershell
   cd backend
   php artisan migrate --seed
   cd ..
   ```

### 4. Running the Project

We use a single command to run all services (Backend, Frontend, WebSocket, AI) in one terminal.

**Start Everything:**
```powershell
npm run dev
```

**Start Without AI (Python):**
If you don't need the Python gRPC service running:
```powershell
npm run dev:no-ai
```

**Access:**
| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000/api |
| WebSocket | ws://localhost:8080 |

### Troubleshooting

- **"Script is disabled on this system"**: Run `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser` in PowerShell.
- **Python errors**: Ensure Python is added to your system PATH.
- **Port conflicts**: Ensure ports 8000 (Laravel), 5173 (Vite), 8080 (WebSocket), and 50052 (gRPC) are free.

## 📁 Project Structure

```
├── frontend/          # React.js SPA (Vite + Chakra UI)
├── backend/           # Laravel PHP API
├── grpc-service/      # Node.js WebSocket Chat Server
├── ai-service/        # Python gRPC AI Analysis Service
├── shared/proto/      # Protocol Buffer definitions
├── docs/              # Documentation
└── scripts/           # Automation scripts
```

## 🏗️ Architecture

```
┌─────────────┐    WebSocket    ┌─────────────┐
│   Frontend  │◄───────────────►│  WebSocket  │
│  (React.js) │                 │  (Node.js)  │
└──────┬──────┘                 └─────────────┘
       │ REST API                      
       ▼                               
┌─────────────┐      gRPC      ┌─────────────┐
│   Backend   │◄──────────────►│ AI Service  │
│  (Laravel)  │                │  (Python)   │
└──────┬──────┘                └─────────────┘
       │
       ▼
┌─────────────┐
│   MySQL     │
└─────────────┘
```

## ✅ Features

- **Journal Notes**: Create, edit, delete daily journal entries
- **AI Analysis**: Daily and weekly mood analysis using Google Gemini
- **Real-time Chat**: Global and private messaging via WebSocket
- **Movie Recommendations**: Personalized suggestions based on mood
- **JWT Authentication**: Secure API access

## 🧪 Running Tests

```powershell
# Laravel tests
cd backend
php artisan test

# Frontend lint
cd frontend
npm run lint

# WebSocket lint
cd grpc-service
npm run lint
```

## 📖 Documentation

- [Architecture Guide](docs/ARCHITECTURE.md) - System design and protocols
- [CI/CD Pipeline](docs/ci-explanation/CI-IMPLEMENTATION.md) - GitHub Actions workflow

## 📝 License

MIT
