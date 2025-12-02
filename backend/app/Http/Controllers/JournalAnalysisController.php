<?php

namespace App\Http\Controllers;

use App\Models\DailyJournalAnalysis;
use App\Models\JournalNote;
use App\Models\User;
use App\Models\WeeklyJournalAnalysis;
use App\Services\AIGrpcClient;
use App\Services\DailyJournalAnalysisService;
use App\Services\GeminiMoodAnalysisService;
use App\Services\WeeklyMovieRecommendationService;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Tymon\JWTAuth\Facades\JWTAuth;

class JournalAnalysisController extends Controller
{
    public function __construct(
        private readonly WeeklyMovieRecommendationService $movieRecommendations,
        private readonly AIGrpcClient $grpcClient,
    ) {}

    public function weeklySummary(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'week_ending' => ['nullable', 'date'],
                'start_date' => ['nullable', 'date'],
                'end_date' => ['nullable', 'date'],
                'user_id' => ['nullable', 'integer', 'exists:users,id'],
            ]);

            // If the client did not explicitly request a user_id, prefer the authenticated
            // user derived from the Authorization bearer token (if present). This prevents
            // returning another user's most-recent weekly analysis when multiple auth
            // methods (session cookie + bearer token) are present.
            if (! isset($validated['user_id'])) {
                try {
                    if ($request->header('Authorization')) {
                        $tokenUser = JWTAuth::parseToken()->authenticate();
                        if ($tokenUser instanceof User) {
                            $validated['user_id'] = $tokenUser->id;
                        }
                    }
                } catch (\Exception $e) {
                    // Failed to parse token: fall back to request->user() below
                    \Log::info('JWT parseToken failed in weeklySummary: '.$e->getMessage());
                }
            }

            // If still not set, fall back to the standard auth user if available
            if (! isset($validated['user_id']) && $request->user() instanceof User) {
                $validated['user_id'] = $request->user()->id;
            }

            if (isset($validated['start_date']) && isset($validated['end_date'])) {
                $weekStart = CarbonImmutable::parse($validated['start_date']);
                $weekEnd = CarbonImmutable::parse($validated['end_date']);
            } else {
                $weekEnding = isset($validated['week_ending']) && $validated['week_ending']
                    ? CarbonImmutable::parse($validated['week_ending'])
                    : CarbonImmutable::now();

                $weekStart = $weekEnding->startOfWeek(CarbonImmutable::MONDAY);
                $weekEnd = $weekEnding->endOfWeek(CarbonImmutable::SUNDAY);
            }

            // Ensure we have valid dates
            if (! $weekStart || ! $weekEnd) {
                throw new \InvalidArgumentException('Tanggal tidak valid');
            }

            $notes = JournalNote::query()
                ->when(isset($validated['user_id']), fn ($query) => $query->where('user_id', $validated['user_id']))
                ->forWeek($weekStart, $weekEnd)
                ->get(['id', 'user_id', 'title', 'body', 'note_date', 'created_at'])
                ->map(fn (JournalNote $note) => $this->formatNote($note)) ?? [];

            $analysisRecord = WeeklyJournalAnalysis::query()
                ->whereDate('week_start', $weekStart->toDateString())
                ->when(isset($validated['user_id']), fn ($query) => $query->where('user_id', $validated['user_id']))
                ->when(! isset($validated['user_id']), fn ($query) => $query->orderByDesc('created_at'))
                ->first();

            $analysisPayload = $analysisRecord?->analysis;
            $recommendations = null;

            if (is_array($analysisPayload) && ! empty($analysisPayload)) {
                // Check if recommendations are already cached in the analysis record
                $cachedRecommendations = $analysisRecord->recommendations ?? null;

                if (is_array($cachedRecommendations) && ! empty($cachedRecommendations['items'])) {
                    // Use cached recommendations - no API calls needed!
                    $recommendations = $cachedRecommendations;
                } else {
                    // Generate recommendations and cache them
                    $recommendations = $this->movieRecommendations->buildRecommendations($analysisPayload);
                    $recommendations = $this->enrichWeeklyRecommendationsWithOmdbPosters($recommendations);

                    // Cache the recommendations for future requests
                    $analysisRecord->update(['recommendations' => $recommendations]);
                }
            }

            $dailySummaries = DailyJournalAnalysis::query()
                ->when(isset($validated['user_id']), fn ($query) => $query->where('user_id', $validated['user_id']))
                ->when(! isset($validated['user_id']), fn ($query) => $query->orderByDesc('analysis_date'))
                ->whereBetween('analysis_date', [$weekStart->toDateString(), $weekEnd->toDateString()])
                ->get(['id', 'user_id', 'analysis_date', 'analysis'])
                ->map(fn (DailyJournalAnalysis $daily) => $this->formatDaily($daily)) ?? [];

            return response()->json([
                'week' => [
                    'start' => $weekStart->toDateString(),
                    'end' => $weekEnd->toDateString(),
                ],
                'filters' => [
                    'userId' => $validated['user_id'] ?? null,
                ],
                'notes' => $notes,
                'analysis' => $analysisPayload,
                'dailySummaries' => $dailySummaries,
                'recommendations' => $recommendations,
                'status' => $analysisRecord ? 'ready' : 'pending',
                'message' => $analysisRecord
                    ? null
                    : 'Ringkasan mingguan belum tersedia. Cron akan memperbarui setiap Senin 02:00.',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e;
        } catch (\InvalidArgumentException $e) {
            \Log::warning('Invalid date provided in weeklySummary', [
                'exception' => $e,
                'request' => $request->all(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 400);
        } catch (\Throwable $e) {
            \Log::error('Error in weeklySummary', [
                'exception' => $e,
                'request' => $request->all(),
                'user_id' => $request->user()?->id,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Terjadi kesalahan saat memuat ringkasan mingguan. Silakan coba lagi nanti.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function dailySummary(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'date' => ['nullable', 'date'],
                'user_id' => ['nullable', 'integer', 'exists:users,id'],
            ]);

            $targetDate = isset($validated['date']) && $validated['date']
                ? CarbonImmutable::parse($validated['date'])->toDateString()
                : CarbonImmutable::now()->toDateString();

            if (! $targetDate) {
                throw new \InvalidArgumentException('Tanggal tidak valid');
            }

            $record = DailyJournalAnalysis::query()
                ->whereDate('analysis_date', $targetDate)
                ->when(isset($validated['user_id']), fn ($builder) => $builder->where('user_id', $validated['user_id']))
                ->when(! isset($validated['user_id']), fn ($builder) => $builder->orderByDesc('analysis_date'))
                ->first();

            return response()->json([
                'date' => $targetDate,
                'filters' => [
                    'userId' => $validated['user_id'] ?? null,
                ],
                'analysis' => $record?->analysis,
                'status' => $record ? 'ready' : 'pending',
                'message' => $record
                    ? null
                    : 'Ringkasan harian belum tersedia untuk tanggal tersebut.',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e;
        } catch (\InvalidArgumentException $e) {
            \Log::warning('Invalid date provided in dailySummary', [
                'exception' => $e,
                'request' => $request->all(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 400);
        } catch (\Throwable $e) {
            \Log::error('Error in dailySummary', [
                'exception' => $e,
                'request' => $request->all(),
                'user_id' => $request->user()?->id,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Terjadi kesalahan saat memuat ringkasan harian. Silakan coba lagi nanti.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Generate weekly analysis for the currently authenticated user.
     * This uses the same logic as the artisan command but limited to a single user.
     */
    public function generateWeeklyForUser(Request $request, DailyJournalAnalysisService $dailyService, GeminiMoodAnalysisService $analysisService): JsonResponse
    {
        try {
            $validated = $request->validate([
                'week_ending' => ['nullable', 'date'],
                'start_date' => ['nullable', 'date'],
                'end_date' => ['nullable', 'date'],
            ]);

            // Prefer the user authenticated via Authorization bearer token when present.
            // This avoids cases where a session cookie for a different user is sent alongside a token.
            $user = null;
            try {
                if ($request->header('Authorization')) {
                    $userFromToken = JWTAuth::parseToken()->authenticate();
                    if ($userFromToken && $userFromToken instanceof User) {
                        $user = $userFromToken;
                    }
                }
            } catch (\Exception $e) {
                // Token parse/auth may fail; we'll fall back to request->user()
                \Log::info('JWT parseToken failed in generateWeeklyForUser: '.$e->getMessage());
            }

            if (! $user) {
                $user = $request->user();
            }

            if (! $user || ! ($user instanceof User)) {
                return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
            }

            if (isset($validated['start_date']) && isset($validated['end_date'])) {
                $weekStart = CarbonImmutable::parse($validated['start_date']);
                $weekEnding = CarbonImmutable::parse($validated['end_date']);
            } else {
                $weekEnding = isset($validated['week_ending']) && $validated['week_ending']
                    ? CarbonImmutable::parse($validated['week_ending'])
                    : CarbonImmutable::now();

                $weekStart = $weekEnding->startOfWeek(CarbonImmutable::MONDAY);
                $weekEnding = $weekEnding->endOfWeek(CarbonImmutable::SUNDAY);
            }

            // Log the requested week for debugging
            \Log::info('generateWeeklyForUser called', [
                'user_id' => $user->id,
                'start_date' => $weekStart->toDateString(),
                'end_date' => $weekEnding->toDateString(),
            ]);

            // Ensure daily analyses exist (or are created) for this user's week
            $dailyAnalyses = $dailyService->ensureWeekForUser($user, $weekEnding);

            $analysis = $analysisService->analyzeWeeklyFromDaily($dailyAnalyses, $weekEnding);

            $analysis['noteCount'] = $dailyAnalyses->sum(function ($daily) {
                $payload = $daily->analysis ?? [];

                return (int) ($payload['noteCount'] ?? 0);
            });

            $analysis['dailyBreakdown'] = $dailyAnalyses
                ->map(function ($daily) {
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
                    'week_start' => $weekStart->toDateString(),
                ],
                [
                    'week_end' => $weekEnding->toDateString(),
                    'analysis' => $analysis,
                ],
            );

            return response()->json([
                'status' => 'success',
                'message' => 'Weekly analysis generated for user.',
                'week' => ['start' => $weekStart->toDateString(), 'end' => $weekEnding->toDateString()],
                'analysis' => $analysis,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            \Log::error('Error generating weekly analysis for user', [
                'exception' => $e,
                'user_id' => $request->user()?->id,
                'week_start' => $weekStart ?? null,
                'week_ending' => $weekEnding ?? null,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menghasilkan ringkasan mingguan. Cek log untuk detail.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Analyze user's writing style and find their literary doppelgänger.
     * Uses gRPC to communicate with the Python AI service.
     */
    public function writingStyle(Request $request): JsonResponse
    {
        try {
            // Get authenticated user
            $user = null;
            try {
                if ($request->header('Authorization')) {
                    $userFromToken = JWTAuth::parseToken()->authenticate();
                    if ($userFromToken instanceof User) {
                        $user = $userFromToken;
                    }
                }
            } catch (\Exception $e) {
                \Log::info('JWT parseToken failed in writingStyle: '.$e->getMessage());
            }

            if (! $user) {
                $user = $request->user();
            }

            if (! $user || ! ($user instanceof User)) {
                return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
            }

            // Check if we have a cached result in the latest weekly analysis
            $latestWeekly = WeeklyJournalAnalysis::where('user_id', $user->id)
                ->orderByDesc('week_start')
                ->first();

            $cachedWritingStyle = $latestWeekly?->analysis['writingStyle'] ?? null;

            // Return cached result if available and not explicitly requesting fresh analysis
            if ($cachedWritingStyle && ! $request->boolean('refresh')) {
                return response()->json([
                    'status' => 'ready',
                    'cached' => true,
                    'writingStyle' => $cachedWritingStyle,
                ]);
            }

            // Fetch user's journal entries
            $notes = JournalNote::where('user_id', $user->id)
                ->whereNotNull('body')
                ->where('body', '!=', '')
                ->orderByDesc('created_at')
                ->limit(100)
                ->get(['title', 'body']);

            if ($notes->isEmpty()) {
                return response()->json([
                    'status' => 'pending',
                    'message' => 'Tidak ada catatan jurnal untuk dianalisis. Tulis beberapa catatan dulu!',
                ], 200);
            }

            // Prepare texts for analysis
            $texts = [];
            foreach ($notes as $note) {
                if ($note->title) {
                    $texts[] = $note->title;
                }
                if ($note->body) {
                    $texts[] = $note->body;
                }
            }

            // Check if gRPC is available
            if (! $this->grpcClient->isAvailable()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'AI service tidak tersedia. Pastikan gRPC server berjalan.',
                ], 503);
            }

            // Call the gRPC service
            $writingStyle = $this->grpcClient->analyzeWritingStyle((string) $user->id, $texts);

            // Cache the result in the latest weekly analysis
            if ($latestWeekly) {
                $analysis = $latestWeekly->analysis ?? [];
                $analysis['writingStyle'] = $writingStyle;
                $latestWeekly->update(['analysis' => $analysis]);
            }

            return response()->json([
                'status' => 'ready',
                'cached' => false,
                'writingStyle' => $writingStyle,
            ]);
        } catch (\Throwable $e) {
            \Log::error('Error in writingStyle analysis', [
                'exception' => $e,
                'user_id' => $request->user()?->id,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menganalisis gaya menulis. Cek log untuk detail.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    private function formatNote(JournalNote $note): array
    {
        return [
            'id' => $note->id,
            'user_id' => $note->user_id,
            'title' => $note->title ?? null,
            'body' => $note->body ?? null,
            'note_date' => ! empty($note->note_date) ? (
                $note->note_date instanceof \DateTimeInterface ? $note->note_date->format('Y-m-d') : CarbonImmutable::parse($note->note_date)->toDateString()
            ) : null,
            'created_at' => ! empty($note->created_at) ? (
                $note->created_at instanceof \DateTimeInterface ? $note->created_at->format(DATE_ATOM) : CarbonImmutable::parse($note->created_at)->toIso8601String()
            ) : null,
            'updated_at' => ! empty($note->updated_at) ? (
                $note->updated_at instanceof \DateTimeInterface ? $note->updated_at->format(DATE_ATOM) : CarbonImmutable::parse($note->updated_at)->toIso8601String()
            ) : null,
        ];
    }

    private function formatDaily(DailyJournalAnalysis $daily): array
    {
        return [
            'id' => $daily->id,
            'userId' => $daily->user_id,
            'date' => ! empty($daily->analysis_date) ? (
                $daily->analysis_date instanceof \DateTimeInterface ? $daily->analysis_date->format('Y-m-d') : CarbonImmutable::parse($daily->analysis_date)->toDateString()
            ) : null,
            'analysis' => $daily->analysis,
        ];
    }

    private function enrichWeeklyRecommendationsWithOmdbPosters(?array $payload): ?array
    {
        if (! is_array($payload) || empty($payload['items']) || ! is_array($payload['items'])) {
            return $payload;
        }

        $apiKey = (string) (config('services.omdb.key') ?: '19886b2');
        $rawBase = (string) config('services.omdb.base_uri');
        $baseUri = rtrim((string) preg_replace('/\?.*$/', '', $rawBase), '/');

        if ($apiKey === '' || $baseUri === '') {
            return $payload;
        }

        // Default placeholder poster
        $defaultPoster = 'https://via.placeholder.com/300x450/E9E7FF/6B21A8?text=No+Poster';

        // Build query params for each movie
        $movieQueries = [];
        foreach ($payload['items'] as $index => $item) {
            $imdbId = isset($item['imdbId']) ? (string) $item['imdbId'] : '';
            $title = isset($item['title']) ? (string) $item['title'] : '';
            $year = isset($item['year']) ? (string) $item['year'] : '';

            $query = [];
            if ($imdbId !== '') {
                $query['i'] = $imdbId;
            } elseif ($title !== '') {
                $query['t'] = $title;
                if ($year !== '') {
                    $query['y'] = $year;
                }
            }

            if (! empty($query)) {
                $query['apikey'] = $apiKey;
                $movieQueries[$index] = $query;
            }
        }

        // Make concurrent requests using Http::pool for much faster execution
        if (! empty($movieQueries)) {
            try {
                $responses = Http::pool(function ($pool) use ($baseUri, $movieQueries) {
                    $requests = [];
                    foreach ($movieQueries as $index => $query) {
                        $requests[$index] = $pool->as((string) $index)->timeout(5)->get($baseUri, $query);
                    }

                    return $requests;
                });

                // Process responses
                foreach ($movieQueries as $index => $query) {
                    $key = (string) $index;
                    if (isset($responses[$key]) && $responses[$key]->ok()) {
                        $poster = (string) ($responses[$key]->json('Poster') ?? '');
                        if ($poster !== '' && strtoupper($poster) !== 'N/A') {
                            $payload['items'][$index]['posterUrl'] = $poster;
                        } else {
                            $payload['items'][$index]['posterUrl'] = $defaultPoster;
                        }
                    } else {
                        $payload['items'][$index]['posterUrl'] = $defaultPoster;
                    }
                }
            } catch (\Throwable $e) {
                // If pool fails, set default posters
                \Log::warning('OMDb pool request failed: '.$e->getMessage());
                foreach ($payload['items'] as $index => $item) {
                    if (empty($item['posterUrl'])) {
                        $payload['items'][$index]['posterUrl'] = $defaultPoster;
                    }
                }
            }
        }

        // Ensure all items have a posterUrl
        foreach ($payload['items'] as $index => $item) {
            if (empty($item['posterUrl'])) {
                $payload['items'][$index]['posterUrl'] = $defaultPoster;
            }
        }

        return $payload;
    }
}
