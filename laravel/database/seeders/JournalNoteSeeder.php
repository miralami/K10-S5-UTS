<?php

namespace Database\Seeders;

use App\Models\JournalNote;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class JournalNoteSeeder extends Seeder
{
    public function run(): void
    {
        $now = CarbonImmutable::now();

        $userAlya = User::firstOrCreate(
            ['email' => 'alya@example.com'],
            [
                'name' => 'Alya Fitri',
                'password' => Hash::make('password'),
                'email_verified_at' => $now,
                'remember_token' => Str::random(10),
            ],
        );

        $userBima = User::firstOrCreate(
            ['email' => 'bima@example.com'],
            [
                'name' => 'Bima Setiawan',
                'password' => Hash::make('password'),
                'email_verified_at' => $now,
                'remember_token' => Str::random(10),
            ],
        );

        $notes = [
            [
                'user_id' => $userAlya->id,
                'title' => 'Senin pagi yang berat',
                'body' => 'Bangun agak kesiangan, mood turun tapi setelah sarapan jadi lebih baik.',
                'created_at' => $now->startOfWeek()->addHours(8),
            ],
            [
                'user_id' => $userAlya->id,
                'title' => 'Sesi gym tengah minggu',
                'body' => 'Akhirnya kembali ngegym setelah libur. Bangga tapi capek banget.',
                'created_at' => $now->startOfWeek()->addDays(2)->addHours(19),
            ],
            [
                'user_id' => $userAlya->id,
                'title' => 'Hangout bareng sahabat',
                'body' => 'Jumat malam hangout, ketawa banyak dan ngerasa lebih ringan.',
                'created_at' => $now->startOfWeek()->addDays(4)->addHours(21),
            ],
            [
                'user_id' => $userBima->id,
                'title' => 'Menikmati kopi',
                'body' => 'Nyobain kopi baru, rasanya unik dan bikin semangat kerja.',
                'created_at' => $now->startOfWeek()->addDays(1)->addHours(10),
            ],
        ];

        JournalNote::unguarded(function () use ($notes) {
            foreach ($notes as $note) {
                JournalNote::create(array_merge($note, [
                    'updated_at' => $note['created_at'],
                ]));
            }
        });
    }
}
