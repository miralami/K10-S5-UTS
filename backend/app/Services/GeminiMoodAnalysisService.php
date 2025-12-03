<?php

namespace App\Services;

use App\Models\DailyJournalAnalysis;
use App\Models\JournalNote;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * GeminiMoodAnalysisService
 *
 * This service handles journal mood analysis via the Python AI service over gRPC.
 * All AI logic (Gemini API calls) is now delegated to the Python service.
 */
class GeminiMoodAnalysisService
{
    private AIGrpcClient $grpcClient;

    public function __construct(AIGrpcClient $grpcClient)
    {
        $this->grpcClient = $grpcClient;
    }

    /**
     * Analyze daily notes via gRPC to Python AI service.
     *
     * @param  Collection<int, array{id:int,title:string|null,body:string|null,created_at:CarbonInterface|string}|JournalNote>  $notes
     */
    public function analyzeDailyNotes(Collection $notes, CarbonInterface $day): array
    {
        $dayStart = CarbonImmutable::parse($day)->startOfDay();

        if ($notes->isEmpty()) {
            return [
                'summary' => 'Tidak ada catatan yang ditulis pada hari ini.',
                'dominantMood' => 'unknown',
                'moodScore' => null,
                'highlights' => [],
                'advice' => ['Luangkan waktu sejenak untuk mencatat perasaanmu besok.'],
                'affirmation' => null,
            ];
        }

        try {
            $notesArray = $notes->map(function ($note) {
                $data = $note instanceof JournalNote
                    ? [
                        'id' => $note->id,
                        'title' => $note->title ?? '',
                        'body' => $note->body ?? '',
                        'created_at' => $note->created_at?->toIso8601String() ?? '',
                    ]
                    : [
                        'id' => $note['id'] ?? 0,
                        'title' => $note['title'] ?? '',
                        'body' => $note['body'] ?? '',
                        'created_at' => isset($note['created_at'])
                            ? CarbonImmutable::parse($note['created_at'])->toIso8601String()
                            : '',
                    ];

                return $data;
            })->values()->all();

            // Get user_id from first note
            $userId = $notes->first() instanceof JournalNote
                ? (string) $notes->first()->user_id
                : (string) ($notes->first()['user_id'] ?? '0');

            return $this->grpcClient->analyzeDaily(
                $userId,
                $dayStart->toDateString(),
                $notesArray
            );
        } catch (\Exception $e) {
            Log::error('gRPC AnalyzeDaily failed', [
                'error' => $e->getMessage(),
                'date' => $dayStart->toDateString(),
            ]);

            throw new RuntimeException('Failed to analyze daily notes: '.$e->getMessage());
        }
    }

    /**
     * Analyze weekly notes from raw notes via gRPC.
     * Note: This method is kept for backwards compatibility but prefers using analyzeWeeklyFromDaily.
     */
    public function analyzeWeeklyNotes(Collection $notes, CarbonInterface $weekEnding): array
    {
        // For weekly analysis from raw notes, we'll aggregate into daily format first
        $weekStart = CarbonImmutable::parse($weekEnding)->startOfWeek(CarbonInterface::MONDAY);
        $weekEnd = CarbonImmutable::parse($weekEnding)->endOfWeek(CarbonInterface::SUNDAY);

        if ($notes->isEmpty()) {
            return [
                'summary' => 'Tidak ada aktivitas jurnal pada minggu ini.',
                'dominantMood' => 'unknown',
                'moodScore' => null,
                'highlights' => [],
                'advice' => ['Cobalah menulis jurnal harian untuk mendapatkan wawasan mingguan yang lebih kaya.'],
                'affirmation' => null,
            ];
        }

        // Group notes by day and create fake daily summaries
        $dailySummaries = $notes
            ->groupBy(function ($note) {
                $createdAt = $note instanceof JournalNote
                    ? $note->created_at
                    : ($note['created_at'] ?? null);

                return $createdAt
                    ? CarbonImmutable::parse($createdAt)->toDateString()
                    : 'unknown';
            })
            ->filter(fn ($group, $key) => $key !== 'unknown')
            ->map(function ($dayNotes, $date) {
                return [
                    'date' => $date,
                    'summary' => 'Catatan hari ini: '.$dayNotes->count().' entri.',
                    'dominantMood' => 'unknown',
                    'moodScore' => 50,
                    'highlights' => [],
                    'advice' => [],
                    'noteCount' => $dayNotes->count(),
                ];
            })
            ->values()
            ->all();

        // Get user_id from first note
        $userId = $notes->first() instanceof JournalNote
            ? (string) $notes->first()->user_id
            : (string) ($notes->first()['user_id'] ?? '0');

        try {
            return $this->grpcClient->analyzeWeekly(
                $userId,
                $weekStart->toDateString(),
                $weekEnd->toDateString(),
                $dailySummaries
            );
        } catch (\Exception $e) {
            Log::error('gRPC AnalyzeWeekly failed', [
                'error' => $e->getMessage(),
                'week' => $weekStart->toDateString().' - '.$weekEnd->toDateString(),
            ]);

            throw new RuntimeException('Failed to analyze weekly notes: '.$e->getMessage());
        }
    }

    /**
     * Analyze weekly mood from daily analyses via gRPC.
     *
     * @param  Collection<int, DailyJournalAnalysis|array<string, mixed>>  $dailyAnalyses
     */
    public function analyzeWeeklyFromDaily(Collection $dailyAnalyses, CarbonInterface $weekEnding): array
    {
        $weekStart = CarbonImmutable::parse($weekEnding)->startOfWeek(CarbonInterface::MONDAY);
        $weekEnd = CarbonImmutable::parse($weekEnding)->endOfWeek(CarbonInterface::SUNDAY);

        $hasEntries = $dailyAnalyses->contains(function ($daily) {
            $analysis = $daily instanceof DailyJournalAnalysis
                ? $daily->analysis
                : ($daily['analysis'] ?? []);

            return ($analysis['noteCount'] ?? 0) > 0
                || ! empty($analysis['summary'] ?? null);
        });

        if (! $hasEntries) {
            return [
                'summary' => 'Tidak ada aktivitas jurnal pada minggu ini.',
                'dominantMood' => 'unknown',
                'moodScore' => null,
                'highlights' => [],
                'advice' => ['Cobalah menulis jurnal harian untuk mendapatkan wawasan mingguan yang lebih kaya.'],
                'affirmation' => null,
            ];
        }

        try {
            $summariesArray = $dailyAnalyses->map(function ($daily) {
                if ($daily instanceof DailyJournalAnalysis) {
                    $analysis = $daily->analysis ?? [];
                    $dateStr = $daily->analysis_date instanceof \DateTimeInterface
                        ? $daily->analysis_date->format('Y-m-d')
                        : (string) ($daily->analysis_date ?? '');

                    return [
                        'date' => $dateStr,
                        'summary' => $analysis['summary'] ?? '',
                        'dominantMood' => $analysis['dominantMood'] ?? 'unknown',
                        'moodScore' => (int) ($analysis['moodScore'] ?? 0),
                        'highlights' => $analysis['highlights'] ?? [],
                        'advice' => $analysis['advice'] ?? [],
                        'noteCount' => (int) ($analysis['noteCount'] ?? 0),
                    ];
                }

                $analysis = $daily['analysis'] ?? [];

                return [
                    'date' => $daily['analysis_date'] ?? '',
                    'summary' => $analysis['summary'] ?? '',
                    'dominantMood' => $analysis['dominantMood'] ?? 'unknown',
                    'moodScore' => (int) ($analysis['moodScore'] ?? 0),
                    'highlights' => $analysis['highlights'] ?? [],
                    'advice' => $analysis['advice'] ?? [],
                    'noteCount' => (int) ($analysis['noteCount'] ?? 0),
                ];
            })->values()->all();

            // Get user_id from first daily analysis
            $userId = $dailyAnalyses->first() instanceof DailyJournalAnalysis
                ? (string) $dailyAnalyses->first()->user_id
                : (string) ($dailyAnalyses->first()['user_id'] ?? '0');

            return $this->grpcClient->analyzeWeekly(
                $userId,
                $weekStart->toDateString(),
                $weekEnd->toDateString(),
                $summariesArray
            );
        } catch (\Exception $e) {
            Log::error('gRPC AnalyzeWeeklyFromDaily failed', [
                'error' => $e->getMessage(),
                'week' => $weekStart->toDateString().' - '.$weekEnd->toDateString(),
            ]);

            throw new RuntimeException('Failed to analyze weekly from daily: '.$e->getMessage());
        }
    }
}
