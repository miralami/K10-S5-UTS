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

        // Build fourteen placeholder notes for two consecutive weeks (Monday..Sunday, Monday..Sunday)
        $weekStart = $now->startOfWeek(CarbonImmutable::MONDAY);

        $notes = [
            [
                'user_id' => $user->id,
                'title' => 'Hari 1 - MANTAP',
                'body' => sprintf('mantap bet bro hari ini dapet konsumsi 2 wkwk', $weekStart->toDateString()),
                'note_date' => $weekStart->toDateString(),
                'vibe' => 'sedih',
                'created_at' => $weekStart->addHours(9),
                'updated_at' => $weekStart->addHours(9),
            ],
            [
                'user_id' => $user->id,
                'title' => 'Hari 2 - Placeholder',
                'body' => sprintf('hari ini cuma dapet 1 konsumsi :(, ya tetep bersyukur sih', $weekStart->addDays(1)->toDateString()),
                'note_date' => $weekStart->addDays(1)->toDateString(),
                'vibe' => 'sedih',
                'created_at' => $weekStart->addDays(1)->addHours(10),
                'updated_at' => $weekStart->addDays(1)->addHours(10),
            ],
            [
                'user_id' => $user->id,
                'title' => 'Hari 3 - Tidakk',
                'body' => sprintf('ak suka, dapet konsumnya kurang enak', $weekStart->addDays(2)->toDateString()),
                'note_date' => $weekStart->addDays(2)->toDateString(),
                'vibe' => 'sedih',
                'created_at' => $weekStart->addDays(2)->addHours(11),
                'updated_at' => $weekStart->addDays(2)->addHours(11),
            ],
            [
                'user_id' => $user->id,
                'title' => 'Hari 4 - Haduh',
                'body' => sprintf('GAK DAPAT KONSUM', $weekStart->addDays(3)->toDateString()),
                'note_date' => $weekStart->addDays(3)->toDateString(),
                'vibe' => 'sedih',
                'created_at' => $weekStart->addDays(3)->addHours(12),
                'updated_at' => $weekStart->addDays(3)->addHours(12),
            ],
            [
                'user_id' => $user->id,
                'title' => 'Hari 5 - Sedih',
                'body' => sprintf('aku sedih', $weekStart->addDays(4)->toDateString()),
                'note_date' => $weekStart->addDays(4)->toDateString(),
                'vibe' => 'sedih',
                'created_at' => $weekStart->addDays(4)->addHours(13),
                'updated_at' => $weekStart->addDays(4)->addHours(13),
            ],
            [
                'user_id' => $user->id,
                'title' => 'Hari 6 - Sedih juga',
                'body' => sprintf('Masih sedih', $weekStart->addDays(5)->toDateString()),
                'note_date' => $weekStart->addDays(5)->toDateString(),
                'vibe' => 'sedih',
                'created_at' => $weekStart->addDays(5)->addHours(14),
                'updated_at' => $weekStart->addDays(5)->addHours(14),
            ],
            [
                'user_id' => $user->id,
                'title' => 'Hari 7 - Placeholder',
                'body' => sprintf('Hari %s: hari ini disurhu nyetir keluar kota, capek bgt hehe', $weekStart->addDays(6)->toDateString()),
                'note_date' => $weekStart->addDays(6)->toDateString(),
                'vibe' => 'sedih',
                'created_at' => $weekStart->addDays(6)->addHours(15),
                'updated_at' => $weekStart->addDays(6)->addHours(15),
            ],
            // Second week
            [
                'user_id' => $user->id,
                'title' => 'Hari 8 - Placeholder',
                'body' => sprintf('Hari %s: Pagi yang cerah, matahari bersinar, akupun bersinar', $weekStart->addDays(7)->toDateString()),
                'note_date' => $weekStart->addDays(7)->toDateString(),
                'vibe' => 'sedih',
                'created_at' => $weekStart->addDays(7)->addHours(9),
                'updated_at' => $weekStart->addDays(7)->addHours(9),
            ],
            [
                'user_id' => $user->id,
                'title' => 'Hari 9 - Placeholder',
                'body' => sprintf('Hari %s: gila brow banyak bat tugasnya', $weekStart->addDays(8)->toDateString()),
                'note_date' => $weekStart->addDays(8)->toDateString(),
                'vibe' => 'sedih',
                'created_at' => $weekStart->addDays(8)->addHours(10),
                'updated_at' => $weekStart->addDays(8)->addHours(10),
            ],
            [
                'user_id' => $user->id,
                'title' => 'Hari 10 - Placeholder',
                'body' => sprintf('Hari %s: hari ini cukup kepressure, ada bos diruangan mulu jir', $weekStart->addDays(9)->toDateString()),
                'note_date' => $weekStart->addDays(9)->toDateString(),
                'vibe' => 'sedih',
                'created_at' => $weekStart->addDays(9)->addHours(11),
                'updated_at' => $weekStart->addDays(9)->addHours(11),
            ],
            [
                'user_id' => $user->id,
                'title' => 'Hari 11 - Placeholder',
                'body' => sprintf('Hari %s: ngantuk pol hari ini, btuh kopi', $weekStart->addDays(10)->toDateString()),
                'note_date' => $weekStart->addDays(10)->toDateString(),
                'vibe' => 'sedih',
                'created_at' => $weekStart->addDays(10)->addHours(12),
                'updated_at' => $weekStart->addDays(10)->addHours(12),
            ],
            [
                'user_id' => $user->id,
                'title' => 'Hari 12 - Placeholder',
                'body' => sprintf('Hari %s: last day at work, udah ngopi, sepertinya tetep butuh istirahat deh', $weekStart->addDays(11)->toDateString()),
                'note_date' => $weekStart->addDays(11)->toDateString(),
                'vibe' => 'sedih',
                'created_at' => $weekStart->addDays(11)->addHours(13),
                'updated_at' => $weekStart->addDays(11)->addHours(13),
            ],
            [
                'user_id' => $user->id,
                'title' => 'Hari 13 - Placeholder',
                'body' => sprintf('Hari %s: full turu cik', $weekStart->addDays(12)->toDateString()),
                'note_date' => $weekStart->addDays(12)->toDateString(),
                'vibe' => 'sedih',
                'created_at' => $weekStart->addDays(12)->addHours(14),
                'updated_at' => $weekStart->addDays(12)->addHours(14),
            ],
            [
                'user_id' => $user->id,
                'title' => 'Hari 14 - Placeholder',
                'body' => sprintf('Hari %s: hari ini mendingan, jadi aku jogging di sore hari dan gym gym tipis', $weekStart->addDays(13)->toDateString()),
                'note_date' => $weekStart->addDays(13)->toDateString(),
                'vibe' => 'sedih',
                'created_at' => $weekStart->addDays(13)->addHours(15),
                'updated_at' => $weekStart->addDays(13)->addHours(15),
            ],
        ];

        JournalNote::unguarded(function () use ($notes) {
            foreach ($notes as $note) {
                JournalNote::create($note);
            }
        });
    }
}
