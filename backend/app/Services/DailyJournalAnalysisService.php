<?php

namespace App\Services;

use App\Models\DailyJournalAnalysis;
use App\Models\User;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class DailyJournalAnalysisService
{
    public function __construct(private readonly GeminiMoodAnalysisService $analysisService) {}

    public function generateForUser(User $user, CarbonInterface $date, bool $force = false): DailyJournalAnalysis
    {
        $day = CarbonImmutable::instance($date)->startOfDay();

        if (! $force) {
            $existing = DailyJournalAnalysis::query()
                ->where('user_id', $user->id)
                ->whereDate('analysis_date', $day->toDateString())
                ->first();

            if ($existing) {
                return $existing;
            }
        }

        $dayEnd = $day->endOfDay();

        $notes = $user->journalNotes()
            ->whereBetween('created_at', [$day, $dayEnd])
            ->orderBy('created_at')
            ->get(['id', 'title', 'body', 'created_at']);

        if ($notes->isEmpty()) {
            $analysis = $this->emptyAnalysisPayload();
        } else {
            $analysis = $this->analysisService->analyzeDailyNotes($notes, $day);
            $analysis['noteCount'] = $notes->count();
        }

        return DailyJournalAnalysis::updateOrCreate(
            [
                'user_id' => $user->id,
                'analysis_date' => $day->toDateString(),
            ],
            [
                'analysis' => $analysis,
            ],
        );
    }

    /**
     * Ensure daily analyses exist for a given week, optimized with batch operations.
     *
     * @return Collection<int, DailyJournalAnalysis>
     */
    public function ensureWeekForUser(User $user, CarbonInterface $weekEnding): Collection
    {
        $weekEnd = CarbonImmutable::instance($weekEnding)->endOfWeek(CarbonImmutable::SUNDAY);
        $weekStart = $weekEnd->startOfWeek(CarbonImmutable::MONDAY);

        // Build list of all dates in the week
        $dates = [];
        $current = $weekStart;
        while ($current <= $weekEnd) {
            $dates[] = $current->toDateString();
            $current = $current->addDay();
        }

        // Batch fetch all existing daily analyses for the week in ONE query
        $existingAnalyses = DailyJournalAnalysis::query()
            ->where('user_id', $user->id)
            ->whereIn('analysis_date', $dates)
            ->get()
            ->keyBy(fn ($a) => CarbonImmutable::parse($a->analysis_date)->toDateString());

        // Batch fetch all notes for the week in ONE query
        $allNotes = $user->journalNotes()
            ->whereBetween('created_at', [$weekStart->startOfDay(), $weekEnd->endOfDay()])
            ->orderBy('created_at')
            ->get(['id', 'title', 'body', 'created_at']);

        // Group notes by date
        $notesByDate = $allNotes->groupBy(fn ($note) => CarbonImmutable::parse($note->created_at)->toDateString());

        // Identify which dates need new analysis
        $datesToAnalyze = [];
        foreach ($dates as $dateString) {
            if (! $existingAnalyses->has($dateString)) {
                $datesToAnalyze[] = $dateString;
            }
        }

        Log::info('ensureWeekForUser optimization', [
            'user_id' => $user->id,
            'week_start' => $weekStart->toDateString(),
            'existing_count' => $existingAnalyses->count(),
            'to_analyze_count' => count($datesToAnalyze),
        ]);

        // Only call API for dates that need analysis
        $newAnalyses = collect();
        foreach ($datesToAnalyze as $dateString) {
            $day = CarbonImmutable::parse($dateString);
            $dayNotes = $notesByDate->get($dateString, collect());

            if ($dayNotes->isEmpty()) {
                $analysis = $this->emptyAnalysisPayload();
            } else {
                // This is where the Gemini API call happens
                $analysis = $this->analysisService->analyzeDailyNotes($dayNotes, $day);
                $analysis['noteCount'] = $dayNotes->count();
            }

            $record = DailyJournalAnalysis::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'analysis_date' => $dateString,
                ],
                [
                    'analysis' => $analysis,
                ],
            );

            $newAnalyses->put($dateString, $record);
        }

        // Combine existing and new analyses, maintaining date order
        $allAnalyses = collect();
        foreach ($dates as $dateString) {
            if ($existingAnalyses->has($dateString)) {
                $allAnalyses->push($existingAnalyses->get($dateString));
            } elseif ($newAnalyses->has($dateString)) {
                $allAnalyses->push($newAnalyses->get($dateString));
            }
        }

        return $allAnalyses;
    }

    /**
     * @return array<string, mixed>
     */
    private function emptyAnalysisPayload(): array
    {
        return [
            'summary' => 'Tidak ada catatan yang ditulis pada hari ini.',
            'dominantMood' => 'unknown',
            'moodScore' => null,
            'highlights' => [],
            'advice' => ['Luangkan waktu sejenak untuk mencatat perasaanmu besok.'],
            'affirmation' => null,
            'noteCount' => 0,
        ];
    }
}
