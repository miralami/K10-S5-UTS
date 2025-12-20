# Cara Menjalankan Semua Service dengan 1 Command

## ✅ Ya, Bisa dengan `npm run dev`!

Anda bisa menjalankan semua service (Backend, Frontend, WebSocket, AI) sekaligus dengan 1 command:

```bash
npm run dev
```

## 🚀 Cara Menggunakan

### Step 1: Pastikan di Root Project
```bash
# Pastikan Anda di folder root (D:\SMT5\K10-S5-UTS)
cd D:\SMT5\K10-S5-UTS
```

### Step 2: Jalankan Command
```bash
npm run dev
```

### Step 3: Tunggu Semua Service Start
Akan muncul output dari 4 service:
```
[BACKEND]    Laravel development server started: http://127.0.0.1:8000
[FRONTEND]   VITE ready in xxx ms
[FRONTEND]   ➜  Local:   http://localhost:5173/
[WEBSOCKET]  WebSocket Chat Server running on http://localhost:8080
[AI]         gRPC server started on port 50051
```

### Step 4: Verifikasi Semua Running
- ✅ Backend: http://localhost:8000
- ✅ Frontend: http://localhost:5173
- ✅ WebSocket: http://localhost:8080
- ✅ AI: Port 50051

## ⚠️ Jika Ada Masalah

### Problem 1: Command Terhenti/Terminate

**Penyebab:** Anda menekan Ctrl+C atau ada error di salah satu service

**Solusi:**
```bash
# Jangan tekan Ctrl+C atau Y saat ditanya "Terminate batch job?"
# Biarkan semua service running

# Jika sudah terlanjur stop, jalankan ulang:
npm run dev
```

### Problem 2: AI Service Error (Python)

**Jika AI service tidak diperlukan untuk testing chat:**
```bash
# Gunakan command tanpa AI:
npm run dev:no-ai
```

Ini akan jalankan:
- ✅ Backend
- ✅ Frontend  
- ✅ WebSocket
- ❌ AI (skip)

### Problem 3: Port Already in Use

**Jika ada port yang sudah dipakai:**

```bash
# Cek port yang dipakai
netstat -ano | findstr :8000
netstat -ano | findstr :5173
netstat -ano | findstr :8080

# Kill process jika perlu
taskkill /PID [PID_NUMBER] /F

# Jalankan ulang
npm run dev
```

## 📝 Available Commands

```bash
# Jalankan semua service (Backend + Frontend + WebSocket + AI)
npm run dev

# Jalankan tanpa AI (lebih cepat untuk testing chat)
npm run dev:no-ai

# Jalankan service individual (jika perlu)
npm run dev:backend      # Backend saja
npm run dev:frontend     # Frontend saja
npm run dev:websocket    # WebSocket saja
npm run dev:ai          # AI saja
```

## 🧪 Testing Chat Setelah `npm run dev`

### 1. Tunggu Semua Service Ready
Pastikan semua output muncul di terminal:
- [BACKEND] server started
- [FRONTEND] ready
- [WEBSOCKET] running
- [AI] started (optional)

### 2. Buka 2 Browser

**Browser 1 (Chrome):**
```
URL: http://localhost:5173
Login: user1@test.com / password123
```

**Browser 2 (Chrome Incognito - Ctrl+Shift+N):**
```
URL: http://localhost:5173
Login: user2@test.com / password123
```

### 3. Buka Global Chat di Kedua Browser
1. Klik icon Chat (💬) di sidebar
2. Pilih "Global Chat"
3. Lihat user lain muncul di list

### 4. Kirim Pesan
- Alice kirim: "Hello!"
- ✅ Bob langsung terima (real-time)
- Bob balas: "Hi!"
- ✅ Alice langsung terima

## ✅ Keuntungan `npm run dev`

1. **1 Command untuk Semua** - Tidak perlu buka 4 terminal
2. **Auto Restart** - Jika ada perubahan code, auto reload
3. **Colored Output** - Mudah bedakan log dari service mana
4. **Centralized** - Semua log di 1 terminal

## 🎯 Tips

### Tip 1: Jangan Close Terminal
Biarkan terminal tetap terbuka selama development. Semua service akan running di background.

### Tip 2: Lihat Log dengan Jelas
Output akan diberi warna:
- **Blue** = Backend (Laravel)
- **Green** = Frontend (React)
- **Yellow** = WebSocket (Node.js)
- **Magenta** = AI (Python)

### Tip 3: Stop Semua Service
Jika ingin stop semua service:
```bash
# Tekan Ctrl+C di terminal
# Ketik: Y
# Semua service akan stop
```

### Tip 4: Restart Cepat
Jika perlu restart:
```bash
# Stop dengan Ctrl+C
# Jalankan ulang
npm run dev
```

## 🔍 Troubleshooting Lengkap

### Error: "concurrently not found"
```bash
npm install
```

### Error: "php not found"
```bash
# Pastikan PHP sudah terinstall dan di PATH
php --version
```

### Error: "python not found"
```bash
# Gunakan tanpa AI
npm run dev:no-ai
```

### Error: Port sudah dipakai
```bash
# Kill semua port
taskkill /F /IM php.exe
taskkill /F /IM node.exe
taskkill /F /IM python.exe

# Jalankan ulang
npm run dev
```

## 📊 Expected Output

Saat `npm run dev` berhasil:

```
[BACKEND] Starting Laravel development server: http://127.0.0.1:8000
[BACKEND] [Thu Dec 19 14:20:00 2025] PHP 8.x.x Development Server started

[FRONTEND] 
[FRONTEND]   VITE v5.x.x  ready in 1234 ms
[FRONTEND] 
[FRONTEND]   ➜  Local:   http://localhost:5173/
[FRONTEND]   ➜  Network: use --host to expose

[WEBSOCKET] WebSocket Chat Server running on http://localhost:8080

[AI] gRPC server started on port 50051
[AI] Waiting for requests...
```

## ✅ Summary

**Jawaban:** Ya, `npm run dev` sudah bisa menjalankan semua service sekaligus!

**Yang perlu dilakukan:**
1. Buka terminal di root project
2. Jalankan: `npm run dev`
3. Tunggu semua service ready
4. Buka browser dan mulai testing

**Jika AI tidak diperlukan:**
```bash
npm run dev:no-ai
```

Lebih cepat dan cukup untuk testing chat! 🚀
