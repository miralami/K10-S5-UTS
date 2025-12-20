# 📚 Dokumentasi Fitur Aplikasi Journal & Mood Tracker

Dokumen ini menjelaskan semua fitur utama aplikasi, dari mana data berasal, dan bagaimana fitur tersebut bekerja.

---

## 🎯 **FITUR UTAMA**

### **1. AUTHENTICATION & USER MANAGEMENT**

#### **Fitur:**
- Register (Pendaftaran akun baru)
- Login (Masuk dengan email/password)
- Logout (Keluar dari akun)
- JWT Token Authentication

#### **Data Source:**
- **Database Table**: `users`
- **Input**: User manual input (email, name, password)
- **Backend**: `JwtAuthController` (Laravel)
- **Authentication**: JWT (JSON Web Token) via `tymon/jwt-auth`

#### **Flow:**
```
User Input → Backend Validation → Hash Password → Save to DB → Generate JWT Token → Return to Frontend
```

---

### **2. JOURNAL NOTES (Catatan Jurnal)**

#### **Fitur:**
- Create journal note (Buat catatan baru)
- Edit journal note (Edit catatan)
- Delete journal note (Hapus catatan)
- View journal history (Lihat riwayat catatan)
- Upload image untuk journal (Gambar opsional)
- Filter by date range

#### **Data Source:**
- **Database Table**: `journal_notes`
- **Input**: User manual input
  - `title` - Judul catatan (opsional)
  - `body` - Isi catatan (opsional)
  - `note_date` - Tanggal catatan (default: hari ini)
  - `image` - Upload gambar (opsional)
- **Backend**: `JournalNoteController`
- **Frontend**: `Dashboard.jsx`, `JournalHistory.jsx`

#### **Fields:**
```javascript
{
  id: auto-increment,
  user_id: dari JWT token,
  title: user input,
  body: user input,
  note_date: user input atau default today,
  image_path: dari upload file,
  created_at: auto timestamp,
  updated_at: auto timestamp
}
```

#### **Storage:**
- Images disimpan di: `storage/app/public/journal-images/`
- Accessible via: `http://localhost:8000/storage/journal-images/{filename}`

---

### **3. GRATITUDE JOURNAL (Jurnal Syukur)**

#### **Fitur:**
- Input 3 hal yang disyukuri per hari
- Auto-categorization (Otomatis mendeteksi kategori)
- Gratitude statistics (Statistik syukur)
- Gratitude distribution (Distribusi kategori)
- Random gratitude reminder
- Gratitude prompts (Saran topik syukur)

#### **Data Source:**
- **Database Table**: `journal_notes` (same table)
- **Input**: User manual input
  - `gratitude_1` - Hal pertama yang disyukuri
  - `gratitude_2` - Hal kedua yang disyukuri
  - `gratitude_3` - Hal ketiga yang disyukuri
- **Categories**: **Auto-detected** by AI/keyword matching
  - `gratitude_category_1` - Auto dari `detectGratitudeCategory()`
  - `gratitude_category_2` - Auto dari `detectGratitudeCategory()`
  - `gratitude_category_3` - Auto dari `detectGratitudeCategory()`

#### **Categories Available:**
```php
'health', 'family', 'friends', 'work', 'nature', 
'personal_growth', 'material', 'spiritual', 'other'
```

#### **Auto-Categorization Logic:**
- Backend method: `JournalNote::detectGratitudeCategory()`
- Menggunakan **keyword matching** untuk mendeteksi kategori
- Contoh: "keluarga", "ibu", "ayah" → category: `family`
- Contoh: "sehat", "kesehatan" → category: `health`

#### **Gratitude Stats:**
- Total gratitude entries
- Most common category
- Streak (berapa hari berturut-turut menulis gratitude)
- **Data Source**: Aggregate dari `journal_notes` table

---

### **4. DAILY MOOD ANALYSIS (Analisis Mood Harian)**

#### **Fitur:**
- Analisis mood otomatis dari journal notes
- Mood score (0-100)
- Dominant mood detection
- Highlights (poin-poin penting)
- Advice (saran berdasarkan mood)
- Affirmation (afirmasi positif)

#### **Data Source:**
- **Database Table**: `daily_journal_analyses`
- **Input**: **Auto-generated** dari journal notes
- **AI Service**: Google Gemini API (direct REST API)
- **Backend**: `GeminiMoodAnalysisService`

#### **Trigger:**
- Otomatis di-generate saat user membuka daily summary
- Atau manual trigger via "Generate Analysis" button

#### **Analysis Fields:**
```javascript
{
  user_id: dari JWT token,
  analysis_date: tanggal yang dianalisis,
  analysis: {
    summary: "Ringkasan mood hari ini",
    dominantMood: "happy/sad/anxious/calm/energetic/tired/neutral",
    moodScore: 75, // 0-100
    highlights: ["poin 1", "poin 2"],
    advice: ["saran 1", "saran 2"],
    affirmation: "Afirmasi positif",
    noteCount: 3
  }
}
```

#### **AI Processing:**
```
Journal Notes → Google Gemini API → Parse JSON Response → Save to DB → Return to Frontend
```

---

### **5. WEEKLY MOOD ANALYSIS (Analisis Mood Mingguan)**

#### **Fitur:**
- Ringkasan mood selama 1 minggu
- Trend mood (naik/turun)
- Weekly highlights
- Weekly advice
- Movie recommendations berdasarkan mood

#### **Data Source:**
- **Database Table**: `weekly_journal_analyses`
- **Input**: **Auto-generated** dari daily analyses
- **AI Service**: Google Gemini API
- **Backend**: `GeminiMoodAnalysisService`, `WeeklyMovieRecommendationService`

#### **Trigger:**
- Otomatis di-generate saat user membuka weekly summary
- Atau manual trigger via "Generate Weekly" button

#### **Analysis Fields:**
```javascript
{
  user_id: dari JWT token,
  week_start: tanggal awal minggu (Monday),
  week_end: tanggal akhir minggu (Sunday),
  analysis: {
    summary: "Ringkasan mingguan",
    dominantMood: "mood dominan minggu ini",
    moodScore: 70,
    highlights: ["highlight 1", "highlight 2"],
    advice: ["saran 1", "saran 2"],
    affirmation: "Afirmasi untuk minggu depan",
    weeklyPattern: "Pola mood mingguan"
  },
  recommendations: {
    category: "joyful/comfort/grounding/reflective/motivational/balanced",
    items: [
      {
        title: "Movie Title",
        year: 2020,
        genres: ["Drama", "Comedy"],
        reason: "Alasan rekomendasi",
        posterUrl: "https://..."
      }
    ]
  }
}
```

---

### **6. MOVIE RECOMMENDATIONS (Rekomendasi Film)**

#### **Fitur:**
- Rekomendasi film berdasarkan mood mingguan
- 6 kategori mood: joyful, comfort, grounding, reflective, motivational, balanced
- Data film dari OMDB API
- Caching untuk performa

#### **Data Source:**
- **External API**: OMDB API (`http://www.omdbapi.com/`)
- **Input**: **Auto dari weekly mood analysis**
- **Backend**: `WeeklyMovieRecommendationService`
- **Caching**: Disimpan di `weekly_journal_analyses.recommendations`

#### **Movie Categories:**
```javascript
{
  joyful: ["The Grand Budapest Hotel", "Amélie", ...],
  comfort: ["The Secret Life of Walter Mitty", "Chef", ...],
  grounding: ["Into the Wild", "Wild", ...],
  reflective: ["Eternal Sunshine", "Her", ...],
  motivational: ["The Pursuit of Happyness", "Rocky", ...],
  balanced: ["Little Miss Sunshine", "The Intouchables", ...]
}
```

#### **Selection Logic:**
- Berdasarkan `dominantMood` dari weekly analysis
- Mapping mood → category → random selection dari list
- Fetch details dari OMDB API
- Cache hasil untuk menghindari API calls berulang

---

### **7. WRITING STYLE ANALYSIS (Analisis Gaya Menulis)**

#### **Fitur:**
- Analisis gaya menulis user
- Author doppelgänger (penulis terkenal yang mirip)
- Writing metrics:
  - Vocabulary richness
  - Average sentence length
  - Punctuation density
  - Emotional tone

#### **Data Source:**
- **Input**: **Auto dari journal notes** (last 30 days)
- **AI Service**: Google Gemini API
- **Backend**: `JournalAnalysisController@writingStyle`

#### **Analysis Fields:**
```javascript
{
  authorDoppelganger: {
    name: "Virginia Woolf",
    similarity: 85, // 0-100
    reason: "Alasan kemiripan"
  },
  metrics: {
    vocabularyRichness: 75,
    avgSentenceLength: 18.5,
    punctuationDensity: 0.12,
    emotionalTone: "introspective"
  }
}
```

---

### **8. REAL-TIME CHAT (Chat WebSocket)**

#### **Fitur:**
- Real-time messaging antar user
- Online/offline status
- Typing indicator
- Message history
- Unread message count

#### **Data Source:**
- **Database Table**: `messages`
- **Input**: User manual input (text message)
- **Backend**: Node.js WebSocket Server (`chat-service`)
- **Frontend**: `Chat.jsx`
- **Protocol**: WebSocket (ws://)

#### **Message Fields:**
```javascript
{
  id: auto-increment,
  sender_id: dari JWT token,
  receiver_id: target user,
  message: user input,
  is_read: false (default),
  created_at: auto timestamp
}
```

#### **WebSocket Events:**
```javascript
// Client → Server
'authenticate' - Login dengan JWT token
'sendMessage' - Kirim pesan
'typing' - User sedang mengetik
'stopTyping' - User berhenti mengetik

// Server → Client
'authenticated' - Autentikasi berhasil
'newMessage' - Pesan baru masuk
'userTyping' - User lain sedang mengetik
'userStoppedTyping' - User lain berhenti mengetik
'userOnline' - User online
'userOffline' - User offline
```

#### **Architecture:**
```
Frontend (React) ↔ WebSocket Server (Node.js) ↔ MySQL Database
```

---

### **9. CALENDAR VIEW (Tampilan Kalender)**

#### **Fitur:**
- Visual calendar untuk navigasi journal
- Highlight tanggal yang ada journal
- Mood indicator per hari
- Quick navigation (prev/next week/month)

#### **Data Source:**
- **Input**: **Dari journal_notes table**
- **Frontend Component**: `JournalCalendar.jsx`
- **Display**: Chakra UI + date-fns

#### **Visual Indicators:**
- **Dot/Badge**: Ada journal entry di tanggal tersebut
- **Color**: Berdasarkan dominant mood (jika sudah ada analysis)
- **Count**: Jumlah entries per hari

---

### **10. SEARCH & FILTER (Pencarian & Filter)**

#### **Fitur:**
- Search journal by keyword
- Filter by date range
- Filter by gratitude category
- Sort by date/relevance

#### **Data Source:**
- **Database Table**: `journal_notes`
- **Input**: User search query
- **Backend**: `JournalNoteController@search`
- **Search Fields**: `title`, `body`, `gratitude_1`, `gratitude_2`, `gratitude_3`

#### **Search Logic:**
```sql
WHERE (title LIKE '%keyword%' 
   OR body LIKE '%keyword%'
   OR gratitude_1 LIKE '%keyword%'
   OR gratitude_2 LIKE '%keyword%'
   OR gratitude_3 LIKE '%keyword%')
AND note_date BETWEEN start_date AND end_date
```

---

## 🔄 **DATA FLOW SUMMARY**

### **User Input → Database**
- Journal Notes: User menulis → Save to `journal_notes`
- Gratitude: User input → Auto-categorize → Save to `journal_notes`
- Chat: User ketik → WebSocket → Save to `messages`

### **Database → AI Processing → Database**
- Daily Analysis: `journal_notes` → Gemini API → `daily_journal_analyses`
- Weekly Analysis: `daily_journal_analyses` → Gemini API → `weekly_journal_analyses`
- Writing Style: `journal_notes` → Gemini API → Return (no save)

### **Database → External API → Cache**
- Movie Recommendations: Weekly mood → OMDB API → Cache in `weekly_journal_analyses.recommendations`

### **Database → Frontend Display**
- Dashboard: Query `journal_notes`, `weekly_journal_analyses` → Display
- History: Query `journal_notes` → Display
- Chat: Query `messages` → Display

---

## 🗄️ **DATABASE TABLES**

### **1. users**
```sql
- id, name, email, password, created_at, updated_at
```

### **2. journal_notes**
```sql
- id, user_id, title, body, note_date, 
- gratitude_1, gratitude_2, gratitude_3,
- gratitude_category_1, gratitude_category_2, gratitude_category_3,
- image_path, created_at, updated_at
```

### **3. daily_journal_analyses**
```sql
- id, user_id, analysis_date, analysis (JSON), created_at, updated_at
```

### **4. weekly_journal_analyses**
```sql
- id, user_id, week_start, week_end, 
- analysis (JSON), recommendations (JSON), created_at, updated_at
```

### **5. messages**
```sql
- id, sender_id, receiver_id, message, is_read, created_at, updated_at
```

---

## 🤖 **AI & EXTERNAL SERVICES**

### **Google Gemini API**
- **Purpose**: Mood analysis, writing style analysis
- **Model**: gemini-2.5-flash
- **Input**: Journal text
- **Output**: JSON structured analysis
- **Cost**: Free tier (rate limited)

### **OMDB API**
- **Purpose**: Movie data (poster, year, genres)
- **Input**: Movie title
- **Output**: Movie details
- **Cost**: Free tier (1000 requests/day)

### **WebSocket Server**
- **Purpose**: Real-time chat
- **Technology**: Node.js + Socket.io
- **Port**: 8080
- **Protocol**: WebSocket (ws://)

---

## 📊 **AUTO vs MANUAL DATA**

### **Manual Input (User Input):**
- ✍️ Journal title & body
- ✍️ Gratitude entries (3 items)
- ✍️ Journal date
- ✍️ Image upload
- ✍️ Chat messages
- ✍️ Search queries

### **Auto-Generated (System):**
- 🤖 Gratitude categories (keyword matching)
- 🤖 Daily mood analysis (AI)
- 🤖 Weekly mood analysis (AI)
- 🤖 Movie recommendations (based on mood)
- 🤖 Writing style analysis (AI)
- 🤖 Timestamps (created_at, updated_at)
- 🤖 User ID (from JWT token)

### **Hybrid (User Trigger + Auto Process):**
- 🔄 Generate weekly analysis (user click button → AI process)
- 🔄 Refresh recommendations (user click → API call)

---

## 🎨 **FRONTEND COMPONENTS**

### **Pages:**
- `Home.jsx` - Landing page
- `Login.jsx` - Login form
- `Register.jsx` - Registration form
- `Dashboard.jsx` - Main dashboard (weekly summary, notes, calendar)
- `JournalHistory.jsx` - Calendar view & history
- `Chat.jsx` - Real-time chat
- `Search.jsx` - Search & filter journal

### **Components:**
- `JournalCalendar.jsx` - Calendar widget
- `MoodEmoji.jsx` - Mood visualization
- `CircularProgress.jsx` - Mood score circle
- `MovieCard.jsx` - Movie recommendation card
- `GratitudeStats.jsx` - Gratitude statistics
- `ChatBubble.jsx` - Chat message bubble
- `TypingIndicator.jsx` - Typing animation

---

## 🔐 **AUTHENTICATION FLOW**

```
1. User Login → Backend validates → Generate JWT token
2. Frontend stores token in localStorage
3. Every API request includes: Authorization: Bearer {token}
4. Backend verifies token → Extract user_id → Filter data by user_id
5. Return user-specific data only
```

---

## ✅ **KESIMPULAN**

### **Data Manual (User Input):**
- Journal notes (title, body, date, image)
- Gratitude entries (3 items per day)
- Chat messages

### **Data Auto (System Generated):**
- Gratitude categories (keyword matching)
- Mood analysis (AI)
- Movie recommendations (based on mood + OMDB API)
- Writing style analysis (AI)

### **Data Hybrid:**
- Weekly analysis (user trigger → AI process)

**Semua data disimpan di MySQL database dan di-filter by user_id untuk privacy.**
