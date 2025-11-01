<?php

namespace App\Http\Controllers;

use App\Services\OpenAiChatService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use RuntimeException;

class RecommendationController extends Controller
{
    public function __construct(private readonly OpenAiChatService $chatService)
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

        return response()->json([
            'recommendations' => $recommendations,
        ]);
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
}
