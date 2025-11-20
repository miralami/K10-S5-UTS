<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\WeeklyJournalAnalysis;
use App\Services\DailyJournalAnalysisService;
use App\Services\GeminiMoodAnalysisService;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Console\Command;

class TestWeeklyAnalysis extends Command
{
    protected $signature = 'journal:test-weekly-analysis';

    protected $description = 'Test weekly journal analysis for the current week';

    public function handle(
        DailyJournalAnalysisService $dailyService,
        GeminiMoodAnalysisService $analysisService
    ): int {
        $weekEnding = CarbonImmutable::now()->endOfWeek(CarbonInterface::SUNDAY);
        $weekStarting = $weekEnding->startOfWeek(CarbonInterface::MONDAY);

        $this->info("Processing week: {$weekStarting->toDateString()} to {$weekEnding->toDateString()}");

        $userIds = User::query()
            ->where(function ($query) use ($weekStarting, $weekEnding) {
                $query->whereHas('journalNotes', function ($notes) use ($weekStarting, $weekEnding) {
                    $notes->whereBetween('created_at', [
                        $weekStarting->startOfDay(),
                        $weekEnding->endOfDay(),
                    ]);
                })->orWhereHas('dailyJournalAnalyses', function ($daily) use ($weekStarting, $weekEnding) {
                    $daily->whereBetween('analysis_date', [
                        $weekStarting->toDateString(),
                        $weekEnding->toDateString(),
                    ]);
                });
            })
            ->pluck('id');

        if ($userIds->isEmpty()) {
            $this->info('No users found with notes or daily analyses for the current week.');

            // Let's check if there are any daily analyses at all
            $dailyCount = \App\Models\DailyJournalAnalysis::count();
            $this->info("Total daily analyses in database: {$dailyCount}");

            if ($dailyCount > 0) {
                $firstDaily = \App\Models\DailyJournalAnalysis::orderBy('analysis_date', 'asc')->first();
                $lastDaily = \App\Models\DailyJournalAnalysis::orderBy('analysis_date', 'desc')->first();

                $this->info("Date range of daily analyses: {$firstDaily->analysis_date} to {$lastDaily->analysis_date}");

                // Check if any daily analyses fall within the current week
                $inCurrentWeek = \App\Models\DailyJournalAnalysis::whereBetween('analysis_date', [
                    $weekStarting->toDateString(),
                    $weekEnding->toDateString(),
                ])->count();

                $this->info("Daily analyses in current week: {$inCurrentWeek}");

                if ($inCurrentWeek > 0) {
                    $this->info('Trying to force process users with daily analyses...');

                    // Get users with daily analyses in the current week
                    $userIds = \App\Models\DailyJournalAnalysis::whereBetween('analysis_date', [
                        $weekStarting->toDateString(),
                        $weekEnding->toDateString(),
                    ])
                        ->distinct()
                        ->pluck('user_id');

                    $this->info("Found {$userIds->count()} users with daily analyses in the current week.");
                }
            }

            if ($userIds->isEmpty()) {
                return self::SUCCESS;
            }
        }

        $users = User::query()->whereIn('id', $userIds)->get();
        $this->info("Processing weekly analysis for {$users->count()} users");

        $bar = $this->output->createProgressBar(count($users));
        $bar->start();

        foreach ($users as $user) {
            $this->info("\nProcessing user: {$user->id}");

            // Ensure we have daily analyses for this user and week
            $dailyAnalyses = $dailyService->ensureWeekForUser($user, $weekEnding);
            $this->info("Found {$dailyAnalyses->count()} daily analyses for this week");

            if ($dailyAnalyses->isEmpty()) {
                $this->warn("No daily analyses found for user {$user->id} in the current week");
                $bar->advance();

                continue;
            }

            // Log the dates of the daily analyses for debugging
            $dates = $dailyAnalyses->pluck('analysis_date')->map(function ($date) {
                return $date->toDateString();
            })->implode(', ');
            $this->info("Daily analysis dates: {$dates}");

            try {
                $this->info('Generating weekly analysis...');
                $analysis = $analysisService->analyzeWeeklyFromDaily($dailyAnalyses, $weekEnding);
                $this->info('Analysis generated successfully');

                $analysis['noteCount'] = $dailyAnalyses->sum(function ($daily) {
                    $payload = $daily->analysis ?? [];

                    return (int) ($payload['noteCount'] ?? 0);
                });

                $analysis['dailyBreakdown'] = $dailyAnalyses
                    ->map(function ($daily) {
                        return [
                            'date' => $daily->analysis_date?->toDateString(),
                            'analysis' => $daily->analysis,
                        ];
                    })
                    ->values()
                    ->all();

                $this->info('Saving weekly analysis...');
                $weekly = WeeklyJournalAnalysis::updateOrCreate(
                    [
                        'user_id' => $user->id,
                        'week_start' => $weekStarting->toDateString(),
                    ],
                    [
                        'week_end' => $weekEnding->toDateString(),
                        'analysis' => $analysis,
                    ],
                );

                $this->info("Weekly analysis saved with ID: {$weekly->id}");

            } catch (\Exception $e) {
                $this->error("Error processing user {$user->id}: ".$e->getMessage());
                \Log::error("Error in TestWeeklyAnalysis for user {$user->id}", [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info('Weekly analysis test completed!');

        return self::SUCCESS;
    }
}
