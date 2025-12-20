<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\JournalNote;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class TestUsersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // User 1: Active journaler with images and gratitudes
        $user1 = User::firstOrCreate(
            ['email' => 'user1@test.com'],
            [
                'name' => 'CUKI',
                'password' => Hash::make('password123'),
            ]
        );

        // Create journal entries for user1 (last 7 days with streak)
        for ($i = 0; $i < 7; $i++) {
            $date = Carbon::now()->subDays($i);
            JournalNote::create([
                'user_id' => $user1->id,
                'title' => "Day " . (7 - $i) . " - Productive Day",
                'body' => "Today was amazing! I accomplished so much and felt really grateful for the opportunities I have. The weather was beautiful and I spent quality time with my family.",
                'note_date' => $date,
                'gratitude_1' => 'My supportive family who always believes in me',
                'gratitude_2' => 'The beautiful sunny weather today',
                'gratitude_3' => 'My health and ability to exercise',
                'gratitude_category_1' => 'Family',
                'gratitude_category_2' => 'Nature',
                'gratitude_category_3' => 'Health',
                'created_at' => $date,
                'updated_at' => $date,
            ]);
        }

        // User 2: Moderate journaler with mixed content
        $user2 = User::firstOrCreate(
            ['email' => 'user2@test.com'],
            [
                'name' => 'APIP',
                'password' => Hash::make('password123'),
            ]
        );

        // Create journal entries for user2 (last 5 days, some gaps)
        $days = [0, 1, 3, 5, 6]; // Days with entries (has gaps)
        foreach ($days as $dayOffset) {
            $date = Carbon::now()->subDays($dayOffset);
            JournalNote::create([
                'user_id' => $user2->id,
                'title' => "Reflection - Day " . $dayOffset,
                'body' => "Reflecting on my day. Had some challenges but also moments of joy. Learning to appreciate the small things in life.",
                'note_date' => $date,
                'gratitude_1' => 'Good coffee this morning',
                'gratitude_2' => 'A kind word from a colleague',
                'gratitude_category_1' => 'Food',
                'gratitude_category_2' => 'Friends',
                'created_at' => $date,
                'updated_at' => $date,
            ]);
        }

        // User 3: New user with minimal entries
        $user3 = User::firstOrCreate(
            ['email' => 'user3@test.com'],
            [
                'name' => 'Charlie Davis',
                'password' => Hash::make('password123'),
            ]
        );

        // Create just 2 entries for user3 (today and yesterday)
        for ($i = 0; $i < 2; $i++) {
            $date = Carbon::now()->subDays($i);
            JournalNote::create([
                'user_id' => $user3->id,
                'title' => $i === 0 ? "My First Journal Entry" : "Day 2 - Getting Started",
                'body' => $i === 0 
                    ? "Starting my gratitude journal journey today. Excited to see where this takes me!"
                    : "Second day of journaling. Already feeling more mindful of the good things in my life.",
                'note_date' => $date,
                'gratitude_1' => $i === 0 ? 'This new opportunity to practice gratitude' : 'Learning something new every day',
                'gratitude_category_1' => $i === 0 ? 'Learning' : 'Learning',
                'created_at' => $date,
                'updated_at' => $date,
            ]);
        }

        $this->command->info('✅ Created 3 test users:');
        $this->command->info('   1. user1@test.com (Alice) - Active user, 7-day streak');
        $this->command->info('   2. user2@test.com (Bob) - Moderate user, 5 entries with gaps');
        $this->command->info('   3. user3@test.com (Charlie) - New user, 2 entries');
        $this->command->info('   Password for all: password123');
    }
}
