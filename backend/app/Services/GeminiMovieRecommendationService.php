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

        $url = 'https://generativelanguage.googleapis.com/v1beta/models/'.$this->model.':generateContent?key='.$this->apiKey;

        $payload = [
            'contents' => [
                [
                    'role' => 'user',
                    'parts' => [
                        ['text' => $prompt],
                    ],
                ],
            ],
            'generationConfig' => [
                'response_mime_type' => 'application/json',
                'temperature' => 0.5,
                'top_p' => 0.95,
                'top_k' => 40,
                'max_output_tokens' => 2048,
            ],
            'safetySettings' => [
                [
                    'category' => 'HARM_CATEGORY_HARASSMENT',
                    'threshold' => 'BLOCK_NONE',
                ],
                [
                    'category' => 'HARM_CATEGORY_HATE_SPEECH',
                    'threshold' => 'BLOCK_NONE',
                ],
                [
                    'category' => 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                    'threshold' => 'BLOCK_NONE',
                ],
                [
                    'category' => 'HARM_CATEGORY_DANGEROUS_CONTENT',
                    'threshold' => 'BLOCK_NONE',
                ],
            ],
        ];

        $response = Http::withHeaders([
            'Content-Type' => 'application/json',
        ])->post($url, $payload);

        if ($response->failed()) {
            throw new RuntimeException('Failed to get Gemini movie recommendations: '.($response->json('error.message') ?? $response->body()));
        }

        $payload = $response->json();
        $text = $payload['candidates'][0]['content']['parts'][0]['text'] ?? null;
        if (! is_string($text) || trim($text) === '') {
            return [];
        }

        $decoded = json_decode($text, true);
        if (! is_array($decoded)) {
            return [];
        }

        $items = $decoded['recommendations'] ?? null;
        if (! is_array($items)) {
            return [];
        }

        $normalized = [];
        foreach ($items as $item) {
            if (! is_array($item)) {
                continue;
            }
            $title = isset($item['title']) ? (string) $item['title'] : '';
            if ($title === '') {
                continue;
            }

            $normalized[] = [
                'id' => (string) Str::uuid(),
                'title' => $title,
                'overview' => isset($item['overview']) ? (string) $item['overview'] : '',
                'year' => isset($item['year']) ? (string) $item['year'] : null,
                'imdbId' => isset($item['imdbId']) ? (string) $item['imdbId'] : null,
                'posterUrl' => isset($item['posterUrl']) ? (string) $item['posterUrl'] : null,
                'letterboxdUrl' => isset($item['letterboxdUrl']) ? (string) $item['letterboxdUrl'] : null,
                'watchProviders' => array_values(array_filter(array_map(function ($p) {
                    if (! is_array($p) || empty($p['provider']) || empty($p['url'])) {
                        return null;
                    }

                    return ['provider' => (string) $p['provider'], 'url' => (string) $p['url']];
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

Beri 5 rekomendasi film yang sesuai dengan mood tersebut. Pastikan judul film dalam bahasa Inggris.

Kembalikan DALAM FORMAT JSON dengan struktur berikut:
{
  "recommendations": [
    {
      "title": "Judul Film (Tahun)",
      "overview": "Deskripsi singkat film",
      "year": "Tahun rilis",
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
