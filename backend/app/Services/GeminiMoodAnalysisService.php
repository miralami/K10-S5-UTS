<?php

namespace App\Services;

use App\Models\DailyJournalAnalysis;
use App\Models\JournalNote;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;

class GeminiMoodAnalysisService
{
    private const MAX_RETRIES = 3;

    private const RETRY_DELAY = 2; // in seconds

    private const MAX_JITTER = 1000; // 1 second in milliseconds

    private string $apiKey;

    private string $model;

    private bool $useGrpc;

    private ?AIGrpcClient $grpcClient = null;

    /**
     * Execute HTTP request with retry mechanism and exponential backoff
     */
    private function httpRequestWithRetry(string $url, array $data, array $headers = [])
    {
        $lastException = null;

        for ($attempt = 1; $attempt <= self::MAX_RETRIES; $attempt++) {
            try {
                // Add jitter to prevent thundering herd
                $jitter = rand(0, self::MAX_JITTER) / 1000; // Random delay up to 1 second
                $delay = (self::RETRY_DELAY * $attempt) + $jitter;

                if ($attempt > 1) {
                    usleep($delay * 1000000); // Convert to microseconds
                }

                $response = Http::timeout(30 + ($attempt * 5)) // Increase timeout for retries
                    ->withHeaders($headers)
                    ->post($url, $data);

                if ($response->successful()) {
                    return $response;
                }

                $errorMessage = strtolower($response->json('error.message') ?? $response->body());

                // Check if error is retryable
                $isRetryable = str_contains($errorMessage, 'overloaded') ||
                              str_contains($errorMessage, 'try again') ||
                              str_contains($errorMessage, 'quota') ||
                              $response->status() === 429 ||
                              $response->status() >= 500;

                if (! $isRetryable || $attempt >= self::MAX_RETRIES) {
                    throw new RuntimeException('API request failed: '.$errorMessage);
                }

                \Log::warning("API request attempt $attempt failed, retrying in {$delay}s", [
                    'error' => $errorMessage,
                    'status' => $response->status(),
                ]);

            } catch (\Exception $e) {
                $lastException = $e;
                \Log::error("API request attempt $attempt failed", [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);

                if ($attempt >= self::MAX_RETRIES) {
                    throw $e;
                }
            }
        }

        throw $lastException ?? new RuntimeException('Failed to complete API request after '.self::MAX_RETRIES.' attempts');
    }

    public function __construct(?AIGrpcClient $grpcClient = null)
    {
        $this->apiKey = (string) config('services.google_genai.api_key', '');
        $this->model = (string) config('services.google_genai.model', 'gemini-2.5-flash');
        $this->useGrpc = (bool) config('services.ai_grpc.enabled', false);

        if ($this->useGrpc) {
            $this->grpcClient = $grpcClient ?? new AIGrpcClient;
        }

        if (! $this->useGrpc && $this->apiKey === '') {
            throw new RuntimeException('Google Gemini API key is missing. Please set GOOGLE_GENAI_API_KEY.');
        }
    }

    /**
     * @param  Collection<int, array{id:int,title:string|null,body:string|null,created_at:CarbonInterface|string}|JournalNote>  $notes
     * @param  CarbonInterface  $weekEnding
     * @return array<string, mixed>
     */
    public function analyzeDailyNotes(Collection $notes, CarbonInterface $day): array
    {
        $dayStart = CarbonImmutable::parse($day)->startOfDay();
        $dayEnd = $dayStart->endOfDay();

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

        // Use gRPC if enabled
        if ($this->useGrpc && $this->grpcClient) {
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
        }

        // Fallback to direct HTTP call with retry mechanism
        $prompt = $this->buildDailyPrompt($notes, $dayStart, $dayEnd);

        $url = 'https://generativelanguage.googleapis.com/v1beta/models/'.$this->model.':generateContent';
        $data = [
            'contents' => [
                [
                    'role' => 'user',
                    'parts' => [
                        [
                            'text' => $prompt,
                        ],
                    ],
                ],
            ],
            'generationConfig' => [
                'responseMimeType' => 'application/json',
            ],
        ];

        $response = $this->httpRequestWithRetry($url, $data, [
            'Content-Type' => 'application/json',
            'x-goog-api-key' => $this->apiKey,
        ]);

        return $this->transformResponse($response->json());
    }

    public function analyzeWeeklyNotes(Collection $notes, CarbonInterface $weekEnding): array
    {
        $weekStart = CarbonImmutable::parse($weekEnding)->startOfWeek(CarbonInterface::MONDAY);
        $weekEnd = CarbonImmutable::parse($weekEnding)->endOfWeek(CarbonInterface::SUNDAY);

        $prompt = $this->buildWeeklyPrompt($notes, $weekStart, $weekEnd);

        $url = 'https://generativelanguage.googleapis.com/v1beta/models/'.$this->model.':generateContent';
        $data = [
            'contents' => [
                [
                    'role' => 'user',
                    'parts' => [
                        [
                            'text' => $prompt,
                        ],
                    ],
                ],
            ],
            'generationConfig' => [
                'responseMimeType' => 'application/json',
            ],
        ];

        $response = $this->httpRequestWithRetry($url, $data, [
            'Content-Type' => 'application/json',
            'x-goog-api-key' => $this->apiKey,
        ]);

        return $this->transformResponse($response->json());
    }

    /**
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

        // Use gRPC if enabled
        if ($this->useGrpc && $this->grpcClient) {
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
        }

        // Fallback to direct HTTP call with retry mechanism
        $prompt = $this->buildWeeklyFromDailyPrompt($dailyAnalyses, $weekStart, $weekEnd);

        $url = 'https://generativelanguage.googleapis.com/v1beta/models/'.$this->model.':generateContent';
        $data = [
            'contents' => [
                [
                    'role' => 'user',
                    'parts' => [
                        [
                            'text' => $prompt,
                        ],
                    ],
                ],
            ],
            'generationConfig' => [
                'responseMimeType' => 'application/json',
            ],
        ];

        $response = $this->httpRequestWithRetry($url, $data, [
            'Content-Type' => 'application/json',
            'x-goog-api-key' => $this->apiKey,
        ]);

        return $this->transformResponse($response->json());
    }

    private function buildWeeklyPrompt(Collection $notes, CarbonInterface $weekStart, CarbonInterface $weekEnd): string
    {
        if ($notes->isEmpty()) {
            return sprintf(<<<'PROMPT'
You are a reflective journaling assistant. No notes were written between %s and %s. Provide a gentle summary noting the absence of entries and encouraging the user to record their feelings next week. Return the response as a JSON object with keys: summary, dominantMood, moodScore (0-100), highlights (array), advice (array).
PROMPT,
                $weekStart->toDateString(),
                $weekEnd->toDateString()
            );
        }

        $serializedNotes = $notes
            ->map(function (array|JournalNote $note) {
                $data = $note instanceof JournalNote
                    ? [
                        'created_at' => $note->created_at,
                        'title' => $note->title,
                        'body' => $note->body,
                    ]
                    : $note;

                $date = isset($data['created_at'])
                    ? CarbonImmutable::parse($data['created_at'])->toDateString()
                    : 'Unknown date';
                $title = isset($data['title']) && $data['title']
                    ? Str::of($data['title'])->trim()
                    : 'Untitled';
                $body = isset($data['body']) && $data['body']
                    ? Str::of($data['body'])->trim()
                    : '(no content)';

                return sprintf("Date: %s\nTitle: %s\nContent: %s", $date, $title, $body);
            })
            ->implode("\n\n---\n\n");

        return sprintf(<<<'PROMPT'
You are a compassionate journaling coach. Review the following journal notes written between %s and %s. Analyze the emotional tone and provide insights.

Notes:
%s

Return a JSON object with the following structure:
{
  "summary": string,
  "dominantMood": string,
  "moodScore": number (0-100),
  "highlights": string[],
  "advice": string[],
  "affirmation": string
}
Use Indonesian language, keep it empathetic, and reference specific notes when relevant.
PROMPT,
            $weekStart->toDateString(),
            $weekEnd->toDateString(),
            $serializedNotes
        );
    }

    private function buildDailyPrompt(Collection $notes, CarbonInterface $dayStart, CarbonInterface $dayEnd): string
    {
        $serializedNotes = $notes
            ->map(function (array|JournalNote $note) {
                $data = $note instanceof JournalNote
                    ? [
                        'created_at' => $note->created_at,
                        'title' => $note->title,
                        'body' => $note->body,
                    ]
                    : $note;

                $time = isset($data['created_at'])
                    ? CarbonImmutable::parse($data['created_at'])->format('H:i')
                    : 'Waktu tidak diketahui';
                $title = isset($data['title']) && $data['title']
                    ? Str::of($data['title'])->trim()
                    : 'Tanpa judul';
                $body = isset($data['body']) && $data['body']
                    ? Str::of($data['body'])->trim()
                    : '(tidak ada isi)';

                return sprintf("Waktu: %s\nJudul: %s\nIsi: %s", $time, $title, $body);
            })
            ->implode("\n\n---\n\n");

        return sprintf(<<<'PROMPT'
Anda adalah mentor journaling yang empatik. Tinjau catatan harian yang ditulis pada %s.

Catatan:
%s

Berikan tanggapan dalam format JSON dengan struktur:
{
  "summary": string,
  "dominantMood": string,
  "moodScore": number (0-100),
  "highlights": string[],
  "advice": string[],
  "affirmation": string
}
Gunakan bahasa Indonesia dan sertakan rujukan spesifik ke catatan saat relevan.
PROMPT,
            $dayStart->toDateString(),
            $serializedNotes
        );
    }

    /**
     * @param  Collection<int, DailyJournalAnalysis|array<string, mixed>>  $dailyAnalyses
     */
    private function buildWeeklyFromDailyPrompt(Collection $dailyAnalyses, CarbonInterface $weekStart, CarbonInterface $weekEnd): string
    {
        $serialized = $dailyAnalyses
            ->map(function ($daily) {
                if ($daily instanceof DailyJournalAnalysis) {
                    $dateStr = $daily->analysis_date instanceof \DateTimeInterface
                        ? $daily->analysis_date->format('Y-m-d')
                        : (string) ($daily->analysis_date ?? null);
                    $data = [
                        'analysis_date' => $dateStr,
                        'analysis' => $daily->analysis,
                    ];
                } else {
                    $data = $daily;
                }

                $date = $data['analysis_date'] ?? 'Tanggal tidak diketahui';
                $analysis = $data['analysis'] ?? [];

                $summary = (string) ($analysis['summary'] ?? 'Tidak ada ringkasan.');
                $mood = (string) ($analysis['dominantMood'] ?? 'unknown');
                $score = $analysis['moodScore'] ?? 'n/a';
                $highlights = isset($analysis['highlights']) && is_array($analysis['highlights'])
                    ? implode('; ', array_map('strval', $analysis['highlights']))
                    : 'Tidak ada highlight';
                $advice = isset($analysis['advice']) && is_array($analysis['advice'])
                    ? implode('; ', array_map('strval', $analysis['advice']))
                    : 'Tidak ada saran';

                return sprintf(
                    "Tanggal: %s\nRingkasan: %s\nMood dominan: %s (skor: %s)\nHighlight: %s\nSaran: %s",
                    $date,
                    $summary,
                    $mood,
                    $score,
                    $highlights,
                    $advice
                );
            })
            ->implode("\n\n---\n\n");

        return sprintf(<<<'PROMPT'
Anda adalah analis jurnal mingguan. Berikut adalah rangkuman harian antara %s dan %s.

Rangkuman harian:
%s

Ringkaslah perkembangan emosi mingguan, sebutkan mood dominan, sorotan penting, saran tindak lanjut, dan afirmasi motivasi. Balas dalam format JSON:
{
  "summary": string,
  "dominantMood": string,
  "moodScore": number (0-100),
  "highlights": string[],
  "advice": string[],
  "affirmation": string
}
Gunakan bahasa Indonesia yang hangat.
PROMPT,
            $weekStart->toDateString(),
            $weekEnd->toDateString(),
            $serialized
        );
    }

    /**
     * @param  array<string, mixed>|null  $payload
     * @return array<string, mixed>
     */
    private function transformResponse(?array $payload): array
    {
        $text = $payload['candidates'][0]['content']['parts'][0]['text'] ?? null;

        if (! is_string($text) || trim($text) === '') {
            return [
                'summary' => 'Tidak ada tanggapan dari model AI.',
                'dominantMood' => 'unknown',
                'moodScore' => null,
                'highlights' => [],
                'advice' => [],
                'affirmation' => null,
            ];
        }

        $decoded = json_decode($text, true);

        if (json_last_error() !== JSON_ERROR_NONE || ! is_array($decoded)) {
            return [
                'summary' => trim($text),
                'dominantMood' => 'unknown',
                'moodScore' => null,
                'highlights' => [],
                'advice' => [],
                'affirmation' => null,
            ];
        }

        return [
            'summary' => (string) ($decoded['summary'] ?? 'Tidak ada ringkasan.'),
            'dominantMood' => (string) ($decoded['dominantMood'] ?? 'unknown'),
            'moodScore' => isset($decoded['moodScore']) ? (int) $decoded['moodScore'] : null,
            'highlights' => isset($decoded['highlights']) && is_array($decoded['highlights'])
                ? array_values(array_map('strval', $decoded['highlights']))
                : [],
            'advice' => isset($decoded['advice']) && is_array($decoded['advice'])
                ? array_values(array_map('strval', $decoded['advice']))
                : [],
            'affirmation' => isset($decoded['affirmation']) ? (string) $decoded['affirmation'] : null,
        ];
    }
}
