<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\WeeklyJournalAnalysis;
use App\Services\DailyJournalAnalysisService;
use App\Services\GeminiMoodAnalysisService;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Console\Command;

class GenerateWeeklyAnalysis extends Command
{
    protected $signature = 'journal:generate-weekly-analysis';

    protected $description = 'Generate weekly journal analysis for all users';

    public function handle(
        DailyJournalAnalysisService $dailyService,
        GeminiMoodAnalysisService $analysisService
    ): int {
        $weekEnding = CarbonImmutable::now()
            ->subWeek()
            ->endOfWeek(CarbonInterface::SUNDAY);
        $weekStarting = $weekEnding->startOfWeek(CarbonInterface::MONDAY);

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
            $this->info('Tidak ada pengguna yang perlu diproses untuk minggu ini.');

            return self::SUCCESS;
        }

        $users = User::query()->whereIn('id', $userIds)->get();

        $bar = $this->output->createProgressBar(count($users));
        $bar->start();

        foreach ($users as $user) {
            $dailyAnalyses = $dailyService->ensureWeekForUser($user, $weekEnding);

            $analysis = $analysisService->analyzeWeeklyFromDaily($dailyAnalyses, $weekEnding);

            $analysis['noteCount'] = $dailyAnalyses->sum(function ($daily) {
                $payload = $daily->analysis ?? [];

                return (int) ($payload['noteCount'] ?? 0);
            });

            $analysis['dailyBreakdown'] = $dailyAnalyses
                ->map(function ($daily) {
                    $date = $daily->analysis_date instanceof \Carbon\Carbon
                        ? $daily->analysis_date->toDateString()
                        : ($daily->analysis_date ? date('Y-m-d', strtotime($daily->analysis_date)) : null);

                    return [
                        'date' => $daily->analysis_date ? CarbonImmutable::parse($daily->analysis_date)->toDateString() : null,
                        'analysis' => $daily->analysis,
                    ];
                })
                ->values()
                ->all();

            WeeklyJournalAnalysis::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'week_start' => $weekStarting->toDateString(),
                ],
                [
                    'week_end' => $weekEnding->toDateString(),
                    'analysis' => $analysis,
                ],
            );

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info('Weekly analysis generated successfully!');

        return self::SUCCESS;
    }
}
