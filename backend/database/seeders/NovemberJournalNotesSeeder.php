<?php

namespace Database\Seeders;

use App\Models\JournalNote;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class NovemberJournalNotesSeeder extends Seeder
{
    public function run(): void
    {
        // Ensure we have at least one user to attach notes to
        $user = User::first();
        if (! $user) {
            $user = User::factory()->create([
                'email' => 'seed-user@example.com',
                'name' => 'Seed User',
            ]);
        }

        $year = 2025;
        $month = 11; // November

        $templates = [
            'Sarapan cepat, tapi mood naik.',
            'Pekerjaan menumpuk, butuh istirahat.',
            'Ngobrol singkat dengan teman, hati lebih lega.',
            'Minggu tenang, fokus baca buku.',
            'Cuaca cerah, jalan-jalan sebentar.',
            'Merasa produktif hari ini.',
            'Sedikit galau tapi masih bisa tersenyum.',
            'Olahraga ringan, badan terasa lebih baik.',
            'Nonton film favorit, mood naik.',
            'Belajar hal baru, seru!',
            'Makan siang enak, semangat kembali.',
            'Pulang lebih awal, quality time.',
            'Sedikit lelah tapi puas dengan progress.',
            'Meeting panjang, tapi hasilnya bagus.',
            'Berterima kasih pada diri sendiri hari ini.',
            'Bertemu keluarga, hangat rasanya.',
            'Mencoba resep baru, lumayan enak.',
            'Refleksi singkat: syukuri hal kecil.',
            'Sesi meditasi singkat, lebih tenang.',
            'Bantu teman, bikin hati senang.',
            'Selesai proyek kecil, bahagia.',
            'Menikmati kopi sore, santai.',
            'Rencana akhir pekan mulai terbentuk.',
            'Mendengar musik lama, nostalgia.',
            'Mencatat pemikiran kecil untuk besok.',
            'Tidur lebih cepat malam ini, berharap bangun segar.',
            'Menjaga hidrasi hari ini, berhasil.',
            'Berjalan singkat di taman, menyegarkan.',
            'Mencoba menyusun rutinitas baru.',
            'Berterima kasih atas hari ini.',
        ];

        JournalNote::unguarded(function () use ($user, $year, $month, $templates) {
            for ($day = 1; $day <= 30; $day++) {
                $date = Carbon::create($year, $month, $day, rand(8, 20), rand(0, 59), 0, 'Asia/Jakarta');
                $noteDate = $date->format('Y-m-d');

                $body = $templates[array_rand($templates)];
                $title = mb_substr($body, 0, 24);

                JournalNote::create([
                    'user_id' => $user->id,
                    'title' => $title,
                    'body' => $body,
                    'note_date' => $noteDate,
                    'created_at' => $date,
                    'updated_at' => $date,
                ]);
            }
        });
    }
}
