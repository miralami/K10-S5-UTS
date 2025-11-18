<?php

namespace Database\Seeders;

use App\Models\JournalNote;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AfifWeeklySadSeeder extends Seeder
{
    public function run(): void
    {
        $now = CarbonImmutable::now();

        $user = User::firstOrCreate(
            ['email' => 'afif@gmail.com'],
            [
                'name' => 'Afif',
                'password' => Hash::make('password'),
                'email_verified_at' => $now,
                'remember_token' => Str::random(10),
            ],
        );

        // Build seven sad notes for the current week (Monday..Sunday)
        $weekStart = $now->startOfWeek(CarbonImmutable::MONDAY);

        $notes = [];
        for ($i = 0; $i < 7; $i++) {
            $day = $weekStart->addDays($i);
            $createdAt = $day->addHours(9 + ($i % 6));

            $notes[] = [
                'user_id' => $user->id,
                'title' => sprintf('Hari %d - Sedih', $i + 1),
                'body' => sprintf('Hari %s: Aku merasa sedih sepanjang hari. Menulis ini agar sedikit lega.', $day->toDateString()),
                'note_date' => $day->toDateString(),
                'vibe' => 'sedih',
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ];
        }

        JournalNote::unguarded(function () use ($notes) {
            foreach ($notes as $note) {
                JournalNote::create($note);
            }
        });
    }
}
