# Debug Scripts

Folder ini berisi script-script untuk debugging dan testing aplikasi.

## File-file Debug

### 1. `check-daily-analyses.php`
**Fungsi**: Memeriksa daily journal analyses di database
- Mengecek apakah weekly analysis sudah dibuat
- Debugging untuk sistem analisis mingguan
- Menampilkan range tanggal dan statistik analisis

**Cara Pakai**:
```bash
cd ../../backend
php ../scripts/debug/check-daily-analyses.php
```

### 2. `check-db.php`
**Fungsi**: Test koneksi database dan model
- Verifikasi database connection
- Membuat test journal note
- Menampilkan jumlah users dan notes

**Cara Pakai**:
```bash
cd ../../backend
php ../scripts/debug/check-db.php
```

### 3. `check-notes.php`
**Fungsi**: Melihat range tanggal journal notes
- Quick check journal notes timeline
- Menampilkan earliest dan latest note

**Cara Pakai**:
```bash
cd ../../backend
php ../scripts/debug/check-notes.php
```

### 4. `test-grpc.php`
**Fungsi**: Test koneksi ke AI service (gRPC)
- Verifikasi gRPC classes loaded
- Test koneksi ke AI service di localhost:50052
- Debugging AI service connection issues

**Cara Pakai**:
```bash
cd ../../backend
php ../scripts/debug/test-grpc.php
```

### 5. `update-note-date.php`
**Fungsi**: Utility untuk mengubah tanggal note
- Mengubah tanggal note terbaru ke start of week
- Berguna untuk testing weekly analysis dengan data tertentu

**Cara Pakai**:
```bash
cd ../../backend
php ../scripts/debug/update-note-date.php
```

## Catatan

- Semua script harus dijalankan dari folder `backend` karena memerlukan Laravel bootstrap
- Script-script ini hanya untuk development/debugging, jangan digunakan di production
- Pastikan database sudah running sebelum menjalankan script
