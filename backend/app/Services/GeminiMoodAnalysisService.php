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

            // Try gRPC first if enabled and available
            if (config('services.ai_grpc.enabled', false)) {
                try {
                    $result = $this->grpcClient->analyzeDaily(
                        $userId,
                        $dayStart->toDateString(),
                        $notesArray
                    );
                    Log::info('gRPC daily analysis successful', ['date' => $dayStart->toDateString()]);
                    return $result;
                } catch (\Throwable $grpcError) {
                    Log::warning('gRPC failed, trying direct Gemini API', [
                        'date' => $dayStart->toDateString(),
                        'error' => $grpcError->getMessage(),
                        'trace' => $grpcError->getTraceAsString(),
                    ]);
                }
            }

            // Fallback to direct Gemini API
            Log::info('Attempting direct Gemini API', ['date' => $dayStart->toDateString()]);
            $result = $this->analyzeDailyWithGemini($notes, $dayStart);
            Log::info('Direct Gemini API successful', ['date' => $dayStart->toDateString()]);
            return $result;
        } catch (\Exception $e) {
            Log::error('Daily analysis failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'date' => $dayStart->toDateString(),
            ]);
            throw new RuntimeException('Failed to analyze daily notes: ' . $e->getMessage(), 0, $e);
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
            // Prepare daily summaries for gRPC/API
            $dailySummariesArray = $dailyAnalyses->map(function ($daily) {
                $analysis = $daily instanceof DailyJournalAnalysis
                    ? $daily->analysis
                    : ($daily['analysis'] ?? []);
                $date = $daily instanceof DailyJournalAnalysis
                    ? $daily->analysis_date->toDateString()
                    : ($daily['analysis_date'] ?? '');

                return [
                    'date' => $date,
                    'summary' => $analysis['summary'] ?? '',
                    'dominantMood' => $analysis['dominantMood'] ?? 'unknown',
                    'moodScore' => $analysis['moodScore'] ?? 0,
                    'highlights' => $analysis['highlights'] ?? [],
                    'advice' => $analysis['advice'] ?? [],
                    'noteCount' => $analysis['noteCount'] ?? 0,
                ];
            })->values()->all();

            // Get user_id from first analysis
            $userId = $dailyAnalyses->first() instanceof DailyJournalAnalysis
                ? (string) $dailyAnalyses->first()->user_id
                : (string) ($dailyAnalyses->first()['user_id'] ?? '0');

            // Try gRPC first if enabled
            if (config('services.ai_grpc.enabled', false)) {
                try {
                    $result = $this->grpcClient->analyzeWeekly(
                        $userId,
                        $weekStart->toDateString(),
                        $weekEnd->toDateString(),
                        $dailySummariesArray
                    );
                    Log::info('gRPC weekly analysis successful', ['week' => $weekStart->toDateString() . ' - ' . $weekEnd->toDateString()]);
                    return $result;
                } catch (\Throwable $grpcError) {
                    Log::warning('gRPC weekly analysis failed, trying direct Gemini API', [
                        'week' => $weekStart->toDateString() . ' - ' . $weekEnd->toDateString(),
                        'error' => $grpcError->getMessage(),
                        'trace' => $grpcError->getTraceAsString(),
                    ]);
                }
            }

            // Fallback to direct Gemini API
            Log::info('Attempting direct Gemini API for weekly', ['week' => $weekStart->toDateString() . ' - ' . $weekEnd->toDateString()]);
            $result = $this->analyzeWeeklyWithGemini(
                $dailySummariesArray,
                $weekStart->toDateString(),
                $weekEnd->toDateString()
            );
            Log::info('Direct Gemini API weekly successful');
            return $result;
        } catch (\Exception $e) {
            // Check if it's a connection timeout
            $isTimeout = $e->getCode() === 504 ||
                        str_contains($e->getMessage(), 'timeout') ||
                        str_contains($e->getMessage(), 'Network timeout');

            // Check if it's a rate limit error
            $isRateLimit = $e->getCode() === 429 ||
                          str_contains($e->getMessage(), 'Rate limit') ||
                          str_contains($e->getMessage(), 'quota');

            if ($isTimeout) {
                Log::warning('Weekly analysis timed out', [
                    'error' => $e->getMessage(),
                    'week' => $weekStart->toDateString().' - '.$weekEnd->toDateString(),
                ]);

                // Return a fallback analysis for timeout
                return [
                    'summary' => 'Ringkasan mingguan tidak dapat dihasilkan karena masalah koneksi jaringan. Silakan periksa koneksi internet Anda dan coba lagi.',
                    'dominantMood' => 'unknown',
                    'moodScore' => null,
                    'highlights' => ['Koneksi ke server analisis terputus.'],
                    'advice' => ['Pastikan koneksi internet Anda stabil dan coba lagi.'],
                    'affirmation' => 'Kesabaranmu adalah kekuatan.',
                    'networkError' => true,
                ];
            }

            if ($isRateLimit) {
                Log::warning('Weekly analysis rate limited', [
                    'error' => $e->getMessage(),
                    'week' => $weekStart->toDateString().' - '.$weekEnd->toDateString(),
                ]);

                // Return a fallback analysis instead of failing
                return [
                    'summary' => 'Ringkasan mingguan tidak dapat dihasilkan saat ini karena batas kuota API tercapai. Silakan coba lagi dalam beberapa menit.',
                    'dominantMood' => 'unknown',
                    'moodScore' => null,
                    'highlights' => ['Data ringkasan mingguan sementara tidak tersedia.'],
                    'advice' => ['Coba lagi dalam beberapa menit untuk mendapatkan ringkasan lengkap.'],
                    'affirmation' => 'Kesejahteraanmu tetap penting, meski analisis sementara tertunda.',
                    'rateLimited' => true,
                ];
            }

            Log::error('Weekly analysis failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'week' => $weekStart->toDateString().' - '.$weekEnd->toDateString(),
            ]);
            throw new RuntimeException('Failed to analyze weekly notes: ' . $e->getMessage(), 0, $e);
        }
    }

    /**
     * Fallback: Analyze daily notes using direct Gemini API (without gRPC)
     */
    private function analyzeDailyWithGemini(Collection $notes, CarbonInterface $day): array
    {
        try {
            $apiKey = config('services.google_genai.api_key');
            $model = config('services.google_genai.model', 'gemini-2.0-flash-exp');

            if (!$apiKey) {
                throw new RuntimeException('GOOGLE_GENAI_API_KEY not configured');
            }

            $content = $notes->map(function ($note) {
                $title = $note instanceof JournalNote ? $note->title : ($note['title'] ?? '');
                $body = $note instanceof JournalNote ? $note->body : ($note['body'] ?? '');
                return "Judul: {$title}\n{$body}";
            })->join("\n\n---\n\n");

            $prompt = "Analisis mood dan emosi dari catatan jurnal berikut ini untuk tanggal {$day->format('d F Y')}:\n\n{$content}\n\n";
            $prompt .= "Berikan analisis dalam format JSON dengan struktur:\n";
            $prompt .= "{\n";
            $prompt .= '  "summary": "ringkasan singkat",'."\n";
            $prompt .= '  "dominantMood": "mood dominan (happy/sad/anxious/calm/energetic/tired/neutral)",'."\n";
            $prompt .= '  "moodScore": 75,'."\n";
            $prompt .= '  "highlights": ["poin penting 1", "poin penting 2"],'."\n";
            $prompt .= '  "advice": ["saran 1", "saran 2"],'."\n";
            $prompt .= '  "affirmation": "afirmasi positif"'."\n";
            $prompt .= "}\n";
            Log::info('Calling Gemini API for daily analysis', [
                'model' => $model,
                'date' => $day->toDateString(),
                'notes_count' => $notes->count(),
            ]);
            $response = \Illuminate\Support\Facades\Http::timeout(60)
                ->connectTimeout(30)
                ->withHeaders([
                    'Content-Type' => 'application/json',
                ])->post("https://generativelanguage.googleapis.com/v1/models/{$model}:generateContent?key={$apiKey}", [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt]
                        ]
                    ]
                ]
            ]);

            if (!$response->successful()) {
                // Check if it's a rate limit error
                $statusCode = $response->status();
                $body = $response->body();

                if ($statusCode === 429 || str_contains($body, 'RESOURCE_EXHAUSTED') || str_contains($body, 'quota')) {
                    Log::warning('Gemini API rate limit exceeded in daily analysis', [
                        'status' => $statusCode,
                        'date' => $day->toDateString(),
                        'body_snippet' => substr($body, 0, 500),
                    ]);
                    throw new RuntimeException('Rate limit exceeded. Please try again in a few moments.', 429);
                }

                throw new RuntimeException('Gemini API request failed: ' . $response->body());
            }

            $result = $response->json();
            $text = $result['candidates'][0]['content']['parts'][0]['text'] ?? '{}';
            $analysis = json_decode($text, true);

            return [
                'summary' => $analysis['summary'] ?? 'Tidak ada ringkasan.',
                'dominantMood' => $analysis['dominantMood'] ?? 'unknown',
                'moodScore' => $analysis['moodScore'] ?? null,
                'highlights' => $analysis['highlights'] ?? [],
                'advice' => $analysis['advice'] ?? [],
                'affirmation' => $analysis['affirmation'] ?? null,
            ];
        } catch (\Exception $e) {
            // Check if it's a connection timeout
            $isTimeout = str_contains($e->getMessage(), 'timed out') ||
                        str_contains($e->getMessage(), 'Connection') ||
                        str_contains($e->getMessage(), 'cURL error 28');

            Log::error('Direct Gemini API failed', [
                'error' => $e->getMessage(),
                'date' => $day->toDateString(),
                'is_timeout' => $isTimeout,
            ]);

            if ($isTimeout) {
                throw new RuntimeException('Network timeout - please check your internet connection', 504, $e);
            }

            throw new RuntimeException('Failed to analyze with Gemini: '.$e->getMessage(), 0, $e);
        }
    }

    /**
     * Fallback: Analyze weekly from daily summaries using direct Gemini API
     */
    private function analyzeWeeklyWithGemini(array $dailySummaries, string $weekStart, string $weekEnd): array
    {
        try {
            $apiKey = config('services.google_genai.api_key');
            $model = config('services.google_genai.model', 'gemini-2.0-flash-exp');

            if (!$apiKey) {
                throw new RuntimeException('GOOGLE_GENAI_API_KEY not configured');
            }

            $summariesText = collect($dailySummaries)->map(function ($day) {
                $date = $day['date'] ?? '';
                $summary = $day['summary'] ?? '';
                $mood = $day['dominantMood'] ?? 'unknown';
                return "Tanggal {$date} ({$mood}): {$summary}";
            })->join("\n");

            $prompt = "Analisis mingguan dari ringkasan harian berikut (periode {$weekStart} - {$weekEnd}):\n\n{$summariesText}\n\n";
            $prompt .= "Berikan analisis mingguan dalam format JSON:\n";
            $prompt .= "{\n";
            $prompt .= '  "summary": "ringkasan mingguan",'."\n";
            $prompt .= '  "dominantMood": "mood dominan minggu ini",'."\n";
            $prompt .= '  "moodScore": 75,'."\n";
            $prompt .= '  "highlights": ["highlight 1", "highlight 2"],'."\n";
            $prompt .= '  "advice": ["saran 1", "saran 2"],'."\n";
            $prompt .= '  "affirmation": "afirmasi untuk minggu depan"'."\n";
            $prompt .= "}\n";

            $response = \Illuminate\Support\Facades\Http::timeout(60)
                ->connectTimeout(30)
                ->withHeaders([
                    'Content-Type' => 'application/json',
                ])->post("https://generativelanguage.googleapis.com/v1/models/{$model}:generateContent?key={$apiKey}", [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt]
                        ]
                    ]
                ]
            ]);

            if (!$response->successful()) {
                // Check if it's a rate limit error
                $statusCode = $response->status();
                $body = $response->body();

                if ($statusCode === 429 || str_contains($body, 'RESOURCE_EXHAUSTED') || str_contains($body, 'quota')) {
                    Log::warning('Gemini API rate limit exceeded in weekly analysis', [
                        'status' => $statusCode,
                        'body_snippet' => substr($body, 0, 500),
                    ]);
                    throw new RuntimeException('Rate limit exceeded. Please try again in a few moments.', 429);
                }

                throw new RuntimeException('Gemini API request failed: ' . $response->body());
            }

            $result = $response->json();
            $text = $result['candidates'][0]['content']['parts'][0]['text'] ?? '{}';
            $analysis = json_decode($text, true);

            return [
                'summary' => $analysis['summary'] ?? 'Tidak ada ringkasan mingguan.',
                'dominantMood' => $analysis['dominantMood'] ?? 'unknown',
                'moodScore' => $analysis['moodScore'] ?? null,
                'highlights' => $analysis['highlights'] ?? [],
                'advice' => $analysis['advice'] ?? [],
                'affirmation' => $analysis['affirmation'] ?? null,
            ];
        } catch (\Exception $e) {
            // Check if it's a connection timeout
            $isTimeout = str_contains($e->getMessage(), 'timed out') ||
                        str_contains($e->getMessage(), 'Connection') ||
                        str_contains($e->getMessage(), 'cURL error 28');

            Log::error('Direct Gemini weekly API failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'week' => "{$weekStart} - {$weekEnd}",
                'is_timeout' => $isTimeout,
                'response' => $response ?? null,
            ]);

            if ($isTimeout) {
                throw new RuntimeException('Network timeout - please check your internet connection', 504, $e);
            }

            throw new RuntimeException('Failed to analyze weekly with Gemini: ' . $e->getMessage(), 0, $e);
        }
    }

    /**
     * Analyze weekly notes directly without creating daily analyses first.
     * This makes only ONE API call per week instead of 7 daily + 1 weekly.
     *
     * @param \Illuminate\Support\Collection $notes Collection of JournalNote models for the week
     * @param CarbonInterface $weekStart
     * @param CarbonInterface $weekEnd
     * @return array
     */
    public function analyzeWeeklyDirectFromNotes($notes, CarbonInterface $weekStart, CarbonInterface $weekEnd): array
    {
        if ($notes->isEmpty()) {
            return [
                'summary' => 'Tidak ada catatan jurnal untuk minggu ini.',
                'dominantMood' => 'unknown',
                'moodScore' => null,
                'highlights' => [],
                'advice' => ['Cobalah menulis jurnal harian untuk mendapatkan wawasan mingguan yang lebih kaya.'],
                'affirmation' => null,
                'noteCount' => 0,
            ];
        }

        try {
            $apiKey = config('services.google_genai.api_key');
            $model = config('services.google_genai.model', 'gemini-2.5-flash-lite');

            if (!$apiKey) {
                throw new RuntimeException('GOOGLE_GENAI_API_KEY not configured');
            }

            // Group notes by date for better structure
            $notesByDate = $notes->groupBy(function ($note) {
                return CarbonImmutable::parse($note->note_date)->toDateString();
            });

            $notesText = $notesByDate->map(function ($dayNotes, $date) {
                $dayContent = $dayNotes->map(function ($note) {
                    $title = $note->title ?? '';
                    $body = $note->body ?? '';
                    return "Judul: {$title}\n{$body}";
                })->join("\n\n");
                return "=== {$date} ===\n{$dayContent}";
            })->join("\n\n---\n\n");

            $prompt = "Analisis mood dan emosi dari catatan jurnal mingguan berikut (periode {$weekStart->format('d F Y')} - {$weekEnd->format('d F Y')}):\n\n{$notesText}\n\n";
            $prompt .= "Berikan analisis mingguan dalam format JSON dengan struktur:\n";
            $prompt .= "{\n";
            $prompt .= '  "summary": "ringkasan keseluruhan minggu ini",'."\n";
            $prompt .= '  "dominantMood": "mood dominan minggu ini (happy/sad/anxious/calm/energetic/tired/neutral)",'."\n";
            $prompt .= '  "moodScore": 75,'."\n";
            $prompt .= '  "highlights": ["pencapaian atau momen penting 1", "pencapaian atau momen penting 2"],'."\n";
            $prompt .= '  "advice": ["saran untuk minggu depan 1", "saran untuk minggu depan 2"],'."\n";
            $prompt .= '  "affirmation": "afirmasi positif untuk minggu depan"'."\n";
            $prompt .= "}\n";

            Log::info('Calling Gemini API for direct weekly analysis', [
                'model' => $model,
                'week' => $weekStart->toDateString() . ' - ' . $weekEnd->toDateString(),
                'notes_count' => $notes->count(),
            ]);

            $response = \Illuminate\Support\Facades\Http::timeout(60)
                ->connectTimeout(30)
                ->withHeaders([
                    'Content-Type' => 'application/json',
                ])->post("https://generativelanguage.googleapis.com/v1/models/{$model}:generateContent?key={$apiKey}", [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt]
                        ]
                    ]
                ]
            ]);

            if (!$response->successful()) {
                $statusCode = $response->status();
                $body = $response->body();

                if ($statusCode === 429 || str_contains($body, 'RESOURCE_EXHAUSTED') || str_contains($body, 'quota')) {
                    Log::warning('Gemini API rate limit exceeded in direct weekly analysis', [
                        'status' => $statusCode,
                        'week' => $weekStart->toDateString() . ' - ' . $weekEnd->toDateString(),
                        'body_snippet' => substr($body, 0, 500),
                    ]);
                    throw new RuntimeException('Rate limit exceeded. Please try again in a few moments.', 429);
                }

                throw new RuntimeException('Gemini API request failed: ' . $response->body());
            }

            $result = $response->json();
            $text = $result['candidates'][0]['content']['parts'][0]['text'] ?? '{}';

            // Try to extract JSON from markdown code blocks if present
            if (preg_match('/```json\s*(.*?)\s*```/s', $text, $matches)) {
                $text = $matches[1];
            } elseif (preg_match('/```\s*(.*?)\s*```/s', $text, $matches)) {
                $text = $matches[1];
            }

            $analysis = json_decode($text, true);

            if (!$analysis) {
                Log::warning('Failed to parse JSON from Gemini response', ['text' => $text]);
                throw new RuntimeException('Failed to parse analysis response');
            }

            Log::info('Direct weekly analysis successful', [
                'week' => $weekStart->toDateString() . ' - ' . $weekEnd->toDateString(),
            ]);

            return [
                'summary' => $analysis['summary'] ?? 'Tidak ada ringkasan mingguan.',
                'dominantMood' => $analysis['dominantMood'] ?? 'unknown',
                'moodScore' => $analysis['moodScore'] ?? null,
                'highlights' => $analysis['highlights'] ?? [],
                'advice' => $analysis['advice'] ?? [],
                'affirmation' => $analysis['affirmation'] ?? null,
                'noteCount' => $notes->count(),
            ];
        } catch (\Exception $e) {
            $isTimeout = str_contains($e->getMessage(), 'timed out') ||
                        str_contains($e->getMessage(), 'Connection') ||
                        str_contains($e->getMessage(), 'cURL error 28');

            Log::error('Direct weekly analysis from notes failed', [
                'error' => $e->getMessage(),
                'week' => "{$weekStart->toDateString()} - {$weekEnd->toDateString()}",
                'is_timeout' => $isTimeout,
            ]);

            if ($isTimeout) {
                throw new RuntimeException('Network timeout - please check your internet connection', 504, $e);
            }

            throw new RuntimeException('Failed to analyze weekly notes with Gemini: ' . $e->getMessage(), 0, $e);
        }
    }
}
