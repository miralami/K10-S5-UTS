<?php

namespace App\Services;

use App\Models\DailyJournalAnalysis;
use App\Models\User;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;

class DailyJournalAnalysisService
{
    public function __construct(private readonly GeminiMoodAnalysisService $analysisService)
    {
    }

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
            ->get(['id', 'title', 'body', 'vibe', 'created_at']);

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
     * @return Collection<int, DailyJournalAnalysis>
     */
    public function ensureWeekForUser(User $user, CarbonInterface $weekEnding): Collection
    {
        $weekEnd = CarbonImmutable::instance($weekEnding)->endOfWeek(CarbonImmutable::SUNDAY);
        $current = $weekEnd->startOfWeek(CarbonImmutable::MONDAY);

        $analyses = collect();

        while ($current <= $weekEnd) {
            $analyses->push($this->generateForUser($user, $current));
            $current = $current->addDay();
        }

        return $analyses;
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
