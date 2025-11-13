<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;

class GeminiMovieRecommendationService
{
    private string $apiKey;
    private string $model;

    public function __construct()
    {
        $this->apiKey = (string) config('services.google_genai.api_key', '');
        $this->model = (string) config('services.google_genai.model', 'gemini-2.5-flash');
    }

    public function recommend(string $mood): array
    {
        if ($this->apiKey === '') {
            throw new RuntimeException('Google Gemini API key is missing. Please set GOOGLE_GENAI_API_KEY.');
        }
        $prompt = $this->buildPrompt($mood);

        $response = Http::withHeaders([
            'Content-Type' => 'application/json',
            'x-goog-api-key' => $this->apiKey,
        ])->post('https://generativelanguage.googleapis.com/v1beta/models/' . $this->model . ':generateContent', [
            'contents' => [
                [
                    'role' => 'user',
                    'parts' => [
                        ['text' => $prompt],
                    ],
                ],
            ],
            'generationConfig' => [
                'responseMimeType' => 'application/json',
            ],
        ]);

        if ($response->failed()) {
            throw new RuntimeException('Failed to get Gemini movie recommendations: ' . ($response->json('error.message') ?? $response->body()));
        }

        $payload = $response->json();
        $text = $payload['candidates'][0]['content']['parts'][0]['text'] ?? null;
        if (!is_string($text) || trim($text) === '') {
            return [];
        }

        $decoded = json_decode($text, true);
        if (!is_array($decoded)) {
            return [];
        }

        $items = $decoded['recommendations'] ?? null;
        if (!is_array($items)) {
            return [];
        }

        $normalized = [];
        foreach ($items as $item) {
            if (!is_array($item)) continue;
            $title = isset($item['title']) ? (string) $item['title'] : '';
            if ($title === '') continue;

            $normalized[] = [
                'id' => (string) Str::uuid(),
                'title' => $title,
                'overview' => isset($item['overview']) ? (string) $item['overview'] : '',
                'year' => isset($item['year']) ? (string) $item['year'] : null,
                'imdbId' => isset($item['imdbId']) ? (string) $item['imdbId'] : null,
                'posterUrl' => isset($item['posterUrl']) ? (string) $item['posterUrl'] : null,
                'letterboxdUrl' => isset($item['letterboxdUrl']) ? (string) $item['letterboxdUrl'] : null,
                'watchProviders' => array_values(array_filter(array_map(function ($p) {
                    if (!is_array($p) || empty($p['provider']) || empty($p['url'])) return null;
                    return [ 'provider' => (string) $p['provider'], 'url' => (string) $p['url'] ];
                }, $item['watchProviders'] ?? []))),
            ];
        }

        return $normalized;
    }

    private function buildPrompt(string $mood): string
    {
        return sprintf(<<<'PROMPT'
Anda adalah asisten rekomendasi film. Berdasarkan deskripsi mood berikut (bahasa Indonesia):
"%s"

Kembalikan keluaran DALAM FORMAT JSON valid dengan struktur persis berikut:
{
  "recommendations": [
    {
      "title": string,
      "overview": string,
      "year": string | null,
      "imdbId": string | null,
      "posterUrl": string | null,
      "letterboxdUrl": string | null,
      "watchProviders": Array<{ "provider": string, "url": string }>
    }
  ]
}

Ketentuan:
- Berikan 3 sampai 5 film.
- Semua field WAJIB ADA walaupun nilainya null.
- Jangan menambahkan kunci lain di luar struktur di atas.
- Gunakan bahasa Indonesia yang ringkas untuk "overview".
PROMPT, trim($mood));
    }
}
