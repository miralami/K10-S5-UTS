<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\WeeklyJournalAnalysis;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Console\Command;
use App\Services\GeminiMoodAnalysisService;

class GenerateWeeklyAnalysis extends Command
{
    protected $signature = 'journal:generate-weekly-analysis';
    protected $description = 'Generate weekly journal analysis for all users';

    public function handle(GeminiMoodAnalysisService $analysisService)
    {
        $weekEnding = CarbonImmutable::now()
            ->subWeek()
            ->endOfWeek(CarbonInterface::SUNDAY);
        $weekStarting = $weekEnding->startOfWeek(CarbonInterface::MONDAY);

        // Get all users who have journal entries during the target week
        $users = User::whereHas('journalNotes', function ($query) use ($weekStarting, $weekEnding) {
            $query->whereBetween('created_at', [$weekStarting, $weekEnding]);
        })->get();

        $bar = $this->output->createProgressBar(count($users));
        $bar->start();

        foreach ($users as $user) {
            // Get user's journal entries for the week
            $entries = $user->journalNotes()
                ->whereBetween('created_at', [$weekStarting, $weekEnding])
                ->get();

            if ($entries->isNotEmpty()) {
                // Generate analysis
                $analysis = $analysisService->analyzeWeeklyNotes($entries, $weekEnding);

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
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info('Weekly analysis generated successfully!');
    }
}