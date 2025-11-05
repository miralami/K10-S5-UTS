<?php

namespace App\Services;

use App\Models\JournalNote;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;

class GeminiMoodAnalysisService
{
    private string $apiKey;
    private string $model;

    public function __construct()
    {
        $this->apiKey = (string) config('services.google_genai.api_key', '');
        $this->model = (string) config('services.google_genai.model', 'gemini-2.5-flash');

        if ($this->apiKey === '') {
            throw new RuntimeException('Google Gemini API key is missing. Please set GOOGLE_GENAI_API_KEY.');
        }
    }

    /**
     * @param Collection<int, array{id:int,title:string|null,body:string|null,created_at:CarbonInterface|string}|JournalNote> $notes
     * @param CarbonInterface $weekEnding
     * @return array<string, mixed>
     */
    public function analyzeWeeklyNotes(Collection $notes, CarbonInterface $weekEnding): array
    {
        $weekStart = CarbonImmutable::parse($weekEnding)->startOfWeek(CarbonInterface::MONDAY);
        $weekEnd = CarbonImmutable::parse($weekEnding)->endOfWeek(CarbonInterface::SUNDAY);

        $prompt = $this->buildPrompt($notes, $weekStart, $weekEnd);

        $response = Http::withHeaders([
            'Content-Type' => 'application/json',
            'x-goog-api-key' => $this->apiKey,
        ])->post('https://generativelanguage.googleapis.com/v1beta/models/' . $this->model . ':generateContent', [
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
        ]);

        if ($response->failed()) {
            throw new RuntimeException(
                'Failed to get Gemini analysis: ' . ($response->json('error.message') ?? $response->body())
            );
        }

        return $this->transformResponse($response->json());
    }

    private function buildPrompt(Collection $notes, CarbonInterface $weekStart, CarbonInterface $weekEnd): string
    {
        if ($notes->isEmpty()) {
            return sprintf(<<<PROMPT
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

        return sprintf(<<<PROMPT
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

    /**
     * @param array<string, mixed>|null $payload
     * @return array<string, mixed>
     */
    private function transformResponse(?array $payload): array
    {
        $text = $payload['candidates'][0]['content']['parts'][0]['text'] ?? null;

        if (!is_string($text) || trim($text) === '') {
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

        if (json_last_error() !== JSON_ERROR_NONE || !is_array($decoded)) {
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
