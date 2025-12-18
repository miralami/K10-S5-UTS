<?php

namespace Database\Seeders;

use App\Models\JournalNote;
use App\Models\User;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class JournalNotesWithGratitudeSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::firstOrCreate(
            ['email' => 'user@example.com'],
            [
                'name' => 'Test User',
                'password' => bcrypt('password'),
            ]
        );

        $userId = $user->id;

        $gratitudeExamples = [
            [
                'title' => 'A Beautiful Morning',
                'body' => 'Started the day with a peaceful walk in the park. The weather was perfect.',
                'gratitude_1' => 'Had an amazing coffee chat with my best friend',
                'gratitude_2' => 'Beautiful sunrise this morning',
                'gratitude_3' => 'Completed a challenging work project',
            ],
            [
                'title' => 'Productive Day',
                'body' => 'Got a lot done today. Feeling accomplished and grateful.',
                'gratitude_1' => 'My health and energy to exercise today',
                'gratitude_2' => 'Delicious homemade dinner',
                'gratitude_3' => 'Quality time with family',
            ],
            [
                'title' => 'Learning and Growing',
                'body' => 'Discovered something new today that changed my perspective.',
                'gratitude_1' => 'Learning something new from a book',
                'gratitude_2' => 'Peaceful meditation session',
                'gratitude_3' => 'Supportive colleagues at work',
            ],
            [
                'title' => 'Simple Pleasures',
                'body' => 'Sometimes the smallest things bring the most joy.',
                'gratitude_1' => 'A stranger\'s kindness today',
                'gratitude_2' => 'Perfect weather for a walk',
                'gratitude_3' => 'Feeling healthy and strong',
            ],
            [
                'title' => 'Connection',
                'body' => 'Spent quality time with loved ones. These moments matter most.',
                'gratitude_1' => 'Laughed so hard with friends',
                'gratitude_2' => 'Achieved a personal goal',
                'gratitude_3' => 'My partner\'s love and support',
            ],
            [
                'title' => 'Rest and Recovery',
                'body' => 'Taking time to recharge is just as important as being productive.',
                'gratitude_1' => 'A good night\'s sleep',
                'gratitude_2' => 'Morning coffee ritual',
                'gratitude_3' => 'Productive work session',
            ],
            [
                'title' => 'Nature\'s Beauty',
                'body' => 'Spent time outdoors and felt reconnected with nature.',
                'gratitude_1' => 'Nature walk in the park',
                'gratitude_2' => 'Video call with family',
                'gratitude_3' => 'Finished reading a great book',
            ],
            [
                'title' => 'Health and Wellness',
                'body' => 'Grateful for my body and what it allows me to do.',
                'gratitude_1' => 'Feeling grateful for my health',
                'gratitude_2' => 'Breakthrough at work',
                'gratitude_3' => 'Sunset view from my window',
            ],
            [
                'title' => 'Unexpected Joy',
                'body' => 'Life surprised me today in the best way.',
                'gratitude_1' => 'Friend surprised me with lunch',
                'gratitude_2' => 'Learned a new skill online',
                'gratitude_3' => 'Calm and peaceful evening',
            ],
            [
                'title' => 'Recognition',
                'body' => 'Felt appreciated today for my efforts.',
                'gratitude_1' => 'My body\'s ability to heal',
                'gratitude_2' => 'Delicious restaurant meal',
                'gratitude_3' => 'Recognition from my team',
            ],
        ];

        for ($i = 29; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);
            
            if (rand(1, 10) > 2) {
                $example = $gratitudeExamples[array_rand($gratitudeExamples)];
                
                $hasGratitude = rand(1, 10) > 3;
                $itemCount = $hasGratitude ? rand(1, 3) : 0;
                
                $data = [
                    'user_id' => $userId,
                    'note_date' => $date,
                    'title' => $example['title'],
                    'body' => $example['body'],
                ];
                
                if ($hasGratitude && $itemCount >= 1) {
                    $data['gratitude_1'] = $example['gratitude_1'];
                    $data['gratitude_category_1'] = JournalNote::detectGratitudeCategory($example['gratitude_1']);
                }
                
                if ($hasGratitude && $itemCount >= 2) {
                    $data['gratitude_2'] = $example['gratitude_2'];
                    $data['gratitude_category_2'] = JournalNote::detectGratitudeCategory($example['gratitude_2']);
                }
                
                if ($hasGratitude && $itemCount >= 3) {
                    $data['gratitude_3'] = $example['gratitude_3'];
                    $data['gratitude_category_3'] = JournalNote::detectGratitudeCategory($example['gratitude_3']);
                }
                
                JournalNote::updateOrCreate(
                    [
                        'user_id' => $userId,
                        'note_date' => $date,
                    ],
                    $data
                );
            }
        }

        $this->command->info('✅ 30 days of journal notes with gratitude data created!');
    }
}
