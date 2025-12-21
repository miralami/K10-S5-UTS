# Last.fm API Setup - Music Cover Images

## Problem
Music recommendations muncul tapi **tidak ada gambar cover** karena Last.fm API belum dikonfigurasi.

## Quick Solution (5 menit)

### 1. Dapatkan Last.fm API Key (GRATIS)

**Step 1**: Buka https://www.last.fm/api/account/create

**Step 2**: Login atau Register (gratis)

**Step 3**: Isi form:
- **Application name**: `Mood Journal App`
- **Application description**: `Personal mood journal with music recommendations`
- **Callback URL**: `http://localhost:8000` (atau kosongkan)

**Step 4**: Klik **Submit**

**Step 5**: Copy **API Key** dan **Shared Secret**

### 2. Update `.env` File

Buka `backend/.env` dan tambahkan:

```env
# Last.fm API (untuk music cover images & enrichment)
LASTFM_API_KEY=your_api_key_here
LASTFM_API_SECRET=your_shared_secret_here
LASTFM_BASE_URI=https://ws.audioscrobbler.com/2.0/
```

**Contoh**:
```env
LASTFM_API_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
LASTFM_API_SECRET=x1y2z3a4b5c6d7e8f9g0h1i2j3k4l5m6
LASTFM_BASE_URI=https://ws.audioscrobbler.com/2.0/
```

### 3. Restart Laravel Server

```bash
# Stop server (Ctrl+C)
# Start again
cd backend
php artisan serve
```

### 4. Clear Cache (Opsional)

```bash
php artisan config:clear
php artisan cache:clear
```

### 5. Test di Dashboard

1. Refresh Dashboard
2. Generate weekly analysis baru (atau tunggu cron)
3. Music cover images akan muncul! 🎵

## What You Get With Last.fm API

### Without API Key:
```json
{
  "title": "Happy",
  "artist": "Pharrell Williams",
  "reason": "Energinya ringan dan uplifting...",
  "coverUrl": null,          // ❌ No image
  "lastfmUrl": null,         // ❌ No link
  "tags": []                 // ❌ No tags
}
```

### With API Key:
```json
{
  "title": "Happy",
  "artist": "Pharrell Williams",
  "reason": "Energinya ringan dan uplifting...",
  "coverUrl": "https://lastfm.freetls.fastly.net/i/u/300x300/abc123.jpg",  // ✅ Cover image
  "lastfmUrl": "https://www.last.fm/music/Pharrell+Williams/_/Happy",      // ✅ Last.fm link
  "tags": ["pop", "happy", "upbeat", "2013"],                              // ✅ Genre tags
  "listeners": "1234567",    // ✅ Popularity data
  "playcount": "9876543"     // ✅ Play count
}
```

## Frontend Display

Dengan API key, `MoodMusicCard` akan menampilkan:
- ✅ Album cover art
- ✅ Clickable Last.fm link
- ✅ Genre tags
- ✅ Popularity indicators

## Troubleshooting

### Error: "Invalid API key"
- Pastikan copy API key dengan benar (tanpa spasi)
- Cek di https://www.last.fm/api/accounts untuk verify key

### Error: "Rate limit exceeded"
Last.fm free tier: **5 requests/second**
- Sistem sudah handle rate limiting
- Jika masih error, tunggu 1 menit lalu refresh

### Cover images masih tidak muncul
```bash
# 1. Clear cache
php artisan config:clear
php artisan cache:clear

# 2. Check logs
Get-Content backend/storage/logs/laravel.log -Tail 50 | Select-String -Pattern "lastfm"

# 3. Test API manually
curl "https://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=YOUR_KEY&artist=Coldplay&track=Yellow&format=json"
```

### Ingin test tanpa generate weekly baru
```bash
# Clear music_recommendations cache untuk user tertentu
php artisan tinker --execute="\App\Models\WeeklyJournalAnalysis::latest()->update(['music_recommendations' => null]);"

# Refresh Dashboard - akan re-generate dengan Last.fm enrichment
```

## Alternative: Use Placeholder Images

Jika tidak ingin setup Last.fm API, bisa gunakan placeholder:

**Edit**: `backend/app/Services/LastFmService.php`

```php
public function enrichTracks(array $tracks): array
{
    $apiKey = (string) config('services.lastfm.api_key');
    
    // If no API key, add placeholder images
    if ($apiKey === '') {
        return array_map(function (array $track) {
            $track['coverUrl'] = 'https://via.placeholder.com/300x300/9F7AEA/FFFFFF?text=' 
                                . urlencode($track['artist'] ?? 'Music');
            $track['lastfmUrl'] = 'https://www.last.fm/search?q=' 
                                . urlencode($track['title'] . ' ' . $track['artist']);
            return $track;
        }, $tracks);
    }
    
    // ... rest of code
}
```

## API Limits & Pricing

### Free Tier (Recommended)
- ✅ **5 requests/second**
- ✅ Unlimited total requests
- ✅ No credit card required
- ✅ Perfect untuk personal projects

### Commercial Tier
- Hanya jika butuh >5 req/s
- Contact Last.fm untuk pricing

## Security Notes

### ✅ DO:
- Store API key in `.env` file
- Add `.env` to `.gitignore` (already done)
- Never commit API keys to Git

### ❌ DON'T:
- Hardcode API key in code
- Share API key publicly
- Commit `.env` to repository

## Summary

**Untuk menampilkan gambar musik**:

1. **Get API Key**: https://www.last.fm/api/account/create (5 menit)
2. **Update `.env`**: Tambahkan `LASTFM_API_KEY` dan `LASTFM_API_SECRET`
3. **Restart server**: `php artisan serve`
4. **Refresh Dashboard**: Cover images akan muncul!

**Tanpa API Key**:
- Music recommendations tetap muncul ✅
- Tapi tanpa cover images ❌
- Gunakan placeholder images sebagai alternative

---

**Status**: Waiting for Last.fm API key configuration  
**Time Required**: 5 minutes  
**Cost**: FREE forever
