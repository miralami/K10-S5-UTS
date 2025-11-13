<?php

namespace App\Http\Controllers;

use App\Services\OpenAiChatService;
use App\Services\GeminiMovieRecommendationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;

class RecommendationController extends Controller
{
    public function __construct(
        private readonly OpenAiChatService $chatService,
        private readonly GeminiMovieRecommendationService $gemini
    )
    {
    }

    public function create(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'mood' => ['required', 'string', 'min:3'],
        ]);

        $systemPrompt = config('services.openai.system_prompt') ?? <<<PROMPT
You are a movie recommendation assistant. Given a user's mood description, reply with a JSON object that matches this TypeScript type exactly:
{
  "recommendations": Array<{
    "title": string;
    "overview": string;
    "posterUrl"?: string | null;
    "letterboxdUrl"?: string | null;
    "watchProviders"?: Array<{ provider: string; url: string }>;
  }>
}
Ensure there are between 3 and 5 items. Fields must exist even if null. Do not include any extra keys or prose.
PROMPT;

        $messages = [
            ['role' => 'system', 'content' => $systemPrompt],
            ['role' => 'user', 'content' => 'Mood description: ' . $validated['mood']],
        ];

        $geminiKey = (string) (config('services.google_genai.api_key') ?? '');
        if ($geminiKey !== '') {
            try {
                $recommendations = $this->gemini->recommend($validated['mood']);
                if (!empty($recommendations)) {
                    $recommendations = $this->enrichWithOmdbPosters($recommendations);
                }
                return response()->json([
                    'recommendations' => $recommendations,
                    'source' => 'gemini',
                ])->header('X-Recommendation-Source', 'gemini');
            } catch (\Throwable $e) {
                \Log::error('Gemini movie recommendations failed', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
                // fall through to OpenAI or OMDb fallback
            }
        }

        $openAiKey = (string) (config('services.openai.key') ?? '');
        if ($openAiKey === '') {
            $recommendations = $this->buildOmdbRecommendationsFromMood($validated['mood']);
            return response()->json([
                'recommendations' => $recommendations,
                'source' => 'omdb',
            ])->header('X-Recommendation-Source', 'omdb');
        }

        try {
            $response = $this->chatService->createChatCompletion($messages, [
                'model' => config('services.openai.chat_model'),
                'metadata' => ['reasoning_effort' => 'medium'],
                'timeout' => 120,
            ]);
        } catch (RuntimeException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 502);
        }

        $rawContent = Arr::get($response, 'choices.0.message.content');

        if (!is_string($rawContent) || $rawContent === '') {
            return response()->json([
                'message' => 'OpenAI response was empty.',
                'raw' => $response,
            ], 502);
        }

        $jsonPayload = $this->extractJson($rawContent);

        if ($jsonPayload === null) {
            return response()->json([
                'message' => 'OpenAI response was not valid JSON.',
                'raw' => $rawContent,
            ], 502);
        }

        $recommendations = $this->normalizeRecommendations($jsonPayload);

        if ($recommendations === null) {
            return response()->json([
                'message' => 'OpenAI response did not contain valid recommendations.',
                'raw' => $jsonPayload,
            ], 502);
        }

        $recommendations = $this->enrichWithOmdbPosters($recommendations);

        return response()->json([
            'recommendations' => $recommendations,
            'source' => 'openai',
        ])->header('X-Recommendation-Source', 'openai');
    }

    /**
     * @return array<string, mixed>|null
     */
    private function extractJson(string $rawContent): ?array
    {
        $payload = trim($rawContent);

        if (str_starts_with($payload, '```')) {
            $payload = preg_replace('/^```(?:json)?\s*/', '', $payload);
            $payload = preg_replace('/```$/', '', $payload ?? '');
        }

        if ($payload === null || $payload === '') {
            return null;
        }

        $decoded = json_decode($payload, true);

        return json_last_error() === JSON_ERROR_NONE ? $decoded : null;
    }

    /**
     * @param array<string, mixed> $payload
     * @return array<int, array<string, mixed>>|null
     */
    private function normalizeRecommendations(array $payload): ?array
    {
        $items = Arr::get($payload, 'recommendations');

        if (!is_array($items) || empty($items)) {
            return null;
        }

        $normalized = [];

        foreach ($items as $item) {
            if (!is_array($item) || empty($item['title'])) {
                continue;
            }

            $watchProviders = array_values(array_filter(
                array_map(function ($provider) {
                    if (!is_array($provider) || empty($provider['provider']) || empty($provider['url'])) {
                        return null;
                    }

                    return [
                        'provider' => (string) $provider['provider'],
                        'url' => (string) $provider['url'],
                    ];
                }, Arr::get($item, 'watchProviders', []))
            ));

            $normalized[] = [
                'id' => Str::uuid()->toString(),
                'title' => (string) $item['title'],
                'overview' => isset($item['overview']) ? (string) $item['overview'] : '',
                'posterUrl' => $this->nullableString($item['posterUrl'] ?? null),
                'letterboxdUrl' => $this->nullableString($item['letterboxdUrl'] ?? null),
                'watchProviders' => $watchProviders,
            ];
        }

        return empty($normalized) ? null : $normalized;
    }

    private function nullableString(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $stringValue = trim((string) $value);

        return $stringValue !== '' && $stringValue !== 'null' ? $stringValue : null;
    }

    private function enrichWithOmdbPosters(array $items): array
    {
        $apiKey = (string) (config('services.omdb.key') ?: 'd980ae3f');
        $rawBase = (string) config('services.omdb.base_uri');
        $baseUri = rtrim((string) preg_replace('/\?.*$/', '', $rawBase), '/');

        if ($apiKey === '' || $baseUri === '') {
            return $items;
        }

        return array_map(function (array $item) use ($apiKey, $baseUri) {
            if (!empty($item['posterUrl'])) {
                return $item;
            }

            $imdbId = isset($item['imdbId']) ? (string) $item['imdbId'] : '';
            $title = isset($item['title']) ? (string) $item['title'] : '';
            if ($title === '') {
                // still allow using imdbId-only path
                if ($imdbId === '') {
                    return $item;
                }
            }

            if ($imdbId !== '') {
                try {
                    $byId = Http::timeout(10)->get($baseUri, [ 'i' => $imdbId, 'apikey' => $apiKey ]);
                    if ($byId->ok()) {
                        $p = (string) ($byId->json('Poster') ?? '');
                        if ($p !== '' && strtoupper($p) !== 'N/A') {
                            $item['posterUrl'] = $p;
                            return $item;
                        }
                    }
                } catch (\Throwable $e) {
                }
            }

            $cleanTitle = trim((string) preg_replace('/\s*\(\d{4}\)\s*$/', '', $title));

            try {
                $response = Http::timeout(10)->get($baseUri, [
                    't' => $cleanTitle,
                    'apikey' => $apiKey,
                ]);

                if ($response->ok()) {
                    $poster = (string) ($response->json('Poster') ?? '');
                    if ($poster !== '' && strtoupper($poster) !== 'N/A') {
                        $item['posterUrl'] = $poster;
                        return $item;
                    }
                }

                $asciiTitle = Str::ascii($cleanTitle);
                if ($asciiTitle !== '' && $asciiTitle !== $cleanTitle) {
                    $response2 = Http::timeout(10)->get($baseUri, [
                        't' => $asciiTitle,
                        'apikey' => $apiKey,
                    ]);
                    if ($response2->ok()) {
                        $poster2 = (string) ($response2->json('Poster') ?? '');
                        if ($poster2 !== '' && strtoupper($poster2) !== 'N/A') {
                            $item['posterUrl'] = $poster2;
                        }
                    }
                }
            } catch (\Throwable $e) {
            }

            return $item;
        }, $items);
    }

    private function buildOmdbRecommendationsFromMood(string $mood): array
    {
        $apiKey = (string) (config('services.omdb.key') ?: 'd980ae3f');
        $rawBase = (string) config('services.omdb.base_uri');
        $baseUri = rtrim((string) preg_replace('/\?.*$/', '', $rawBase), '/');

        $query = $this->mapMoodToOmdbQuery($mood);

        if ($apiKey === '' || $baseUri === '') {
            return [];
        }

        try {
            $search = Http::timeout(15)->get($baseUri, [
                's' => $query,
                'type' => 'movie',
                'apikey' => $apiKey,
            ])->json();

            $results = is_array($search) ? ($search['Search'] ?? []) : [];

            $top = array_slice(array_filter($results, function ($r) {
                return is_array($r) && !empty($r['Title']) && !empty($r['imdbID']);
            }), 0, 5);

            $items = [];
            foreach ($top as $row) {
                $imdbId = (string) $row['imdbID'];
                $detail = Http::timeout(15)->get($baseUri, [
                    'i' => $imdbId,
                    'plot' => 'short',
                    'apikey' => $apiKey,
                ])->json();

                $title = (string) ($detail['Title'] ?? $row['Title'] ?? '');
                if ($title === '') {
                    continue;
                }

                $poster = (string) ($detail['Poster'] ?? $row['Poster'] ?? '');
                $plot = (string) ($detail['Plot'] ?? '');

                $items[] = [
                    'id' => Str::uuid()->toString(),
                    'title' => $title,
                    'overview' => $plot,
                    'posterUrl' => ($poster !== '' && strtoupper($poster) !== 'N/A') ? $poster : null,
                    'imdbId' => $imdbId,
                    'letterboxdUrl' => null,
                    'watchProviders' => [],
                ];
            }

            return array_slice($items, 0, 5);
        } catch (\Throwable $e) {
            return [];
        }
    }

    private function mapMoodToOmdbQuery(string $mood): string
    {
        $m = Str::of($mood)->lower();
        if (Str::contains($m, ['capek', 'lelah', 'sedih', 'down', 'galau', 'patah'])) {
            return 'feel good';
        }
        if (Str::contains($m, ['cemas', 'gelisah', 'khawatir', 'stres', 'stress'])) {
            return 'calming';
        }
        if (Str::contains($m, ['bahagia', 'senang', 'ceria', 'optimis'])) {
            return 'happy';
        }
        if (Str::contains($m, ['termotivasi', 'semangat', 'inspirasi', 'inspirational', 'inspire'])) {
            return 'inspirational';
        }
        return trim((string) $m) !== '' ? (string) $m : 'feel good';
    }
}
