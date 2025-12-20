# 📔 Mood Journal & Chat Application

Aplikasi journal dengan analisis mood menggunakan AI, rekomendasi film, dan real-time chat.

---

## 🚀 Quick Start

```bash
# Install dependencies
npm run install-all

# Start all services (Backend, Frontend, WebSocket, AI)
npm run dev

# Or start without AI service
npm run dev:no-ai
```

**Default Ports:**
- Backend (Laravel): `http://localhost:8000`
- Frontend (React): `http://localhost:5173`
- WebSocket (Chat): `ws://localhost:8080`
- AI Service (Python gRPC): `localhost:50052`

---

## 📚 Documentation

### **Core Documentation**
- **[FEATURES.md](FEATURES.md)** - 📖 Dokumentasi lengkap semua fitur dan sumber data
- **[START_ALL_SERVICES.md](START_ALL_SERVICES.md)** - 🚀 Panduan menjalankan aplikasi
- **[TEST_ACCOUNTS.md](TEST_ACCOUNTS.md)** - 👥 Akun testing untuk development

### **Technical Documentation**
- **[docs/README.md](docs/README.md)** - Project overview & setup
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System architecture
- **[docs/COMMANDS.md](docs/COMMANDS.md)** - Command reference
- **[docs/ci-explanation/CI-IMPLEMENTATION.md](docs/ci-explanation/CI-IMPLEMENTATION.md)** - CI/CD setup

---

## ✨ Key Features

- ✍️ **Journal Notes** - Catatan harian dengan upload gambar
- 🙏 **Gratitude Journal** - 3 hal yang disyukuri per hari (auto-categorized)
- 😊 **Mood Analysis** - AI-powered daily & weekly mood analysis
- 🎬 **Movie Recommendations** - Rekomendasi film berdasarkan mood
- ✏️ **Writing Style Analysis** - Analisis gaya menulis & author doppelgänger
- 💬 **Real-time Chat** - WebSocket chat antar user
- 📅 **Calendar View** - Visual calendar untuk navigasi journal
- 🔍 **Search & Filter** - Pencarian journal dengan filter

---

## 🛠️ Tech Stack

### **Frontend**
- React 19.2.0
- Chakra UI 2.10.9
- Framer Motion 12.23.24
- date-fns 4.1.0
- Chart.js 4.5.1

### **Backend**
- Laravel 12
- MySQL
- JWT Authentication (tymon/jwt-auth)
- Google Gemini API (AI)

### **Services**
- Node.js WebSocket Server (Real-time chat)
- Python gRPC Service (AI analysis - optional)

---

## 📦 Project Structure

```
K10-S5-UTS/
├── backend/           # Laravel API
├── frontend/          # React SPA
├── chat-service/      # WebSocket server
├── ai-service/        # Python gRPC (optional)
├── docs/              # Technical documentation
├── FEATURES.md        # Feature documentation
└── package.json       # Root workspace config
```

---

## 🔧 Configuration

### **Backend (.env)**
```env
DB_DATABASE=journal_app
GOOGLE_GENAI_API_KEY=your_gemini_api_key
OMDB_API_KEY=your_omdb_key
AI_GRPC_ENABLED=false
JWT_SECRET=your_jwt_secret
```

### **Frontend (.env)**
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8080
```

---

## 👥 Test Accounts

See [TEST_ACCOUNTS.md](TEST_ACCOUNTS.md) for login credentials.

---

## 📖 Learn More

- **Fitur apa saja yang ada?** → Baca [FEATURES.md](FEATURES.md)
- **Bagaimana cara menjalankan?** → Baca [START_ALL_SERVICES.md](START_ALL_SERVICES.md)
- **Arsitektur sistem?** → Baca [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

---

## 📝 License

Educational project for UTS Semester 5.
