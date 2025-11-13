<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class OpenAiChatService
{
    public function createChatCompletion(array $messages, array $options = []): array
    {
        $apiKey = (string) config('services.openai.key', '');
        $baseUri = (string) config('services.openai.base_uri', 'https://api.openai.com/v1');
        $model = (string) ($options['model'] ?? config('services.openai.chat_model', 'gpt-3.5-turbo'));
        $timeout = (int) ($options['timeout'] ?? 30);

        if ($apiKey === '') {
            return $this->fallbackResponse();
        }

        try {
            $response = Http::withToken($apiKey)
                ->timeout($timeout)
                ->post(rtrim($baseUri, '/') . '/chat/completions', [
                    'model' => $model,
                    'messages' => $messages,
                ]);

            if (!$response->ok()) {
                return $this->fallbackResponse();
            }

            $data = $response->json();
            if (!is_array($data) || empty($data['choices'][0]['message']['content'])) {
                return $this->fallbackResponse();
            }

            return $data;
        } catch (\Throwable $e) {
            return $this->fallbackResponse();
        }
    }

    private function fallbackResponse(): array
    {
        $recommendations = [
            [
                'title' => 'Amélie',
                'overview' => 'A whimsical Paris story.',
                'posterUrl' => null,
                'letterboxdUrl' => 'https://letterboxd.com/film/amelie/',
                'watchProviders' => [],
            ],
            [
                'title' => 'Finding Nemo',
                'overview' => 'An ocean adventure that comforts and uplifts.',
                'posterUrl' => null,
                'letterboxdUrl' => 'https://letterboxd.com/film/finding-nemo/',
                'watchProviders' => [],
            ],
            [
                'title' => 'La La Land',
                'overview' => 'A modern musical about dreams and choices.',
                'posterUrl' => null,
                'letterboxdUrl' => 'https://letterboxd.com/film/la-la-land/',
                'watchProviders' => [],
            ],
        ];

        return [
            'choices' => [
                [
                    'message' => [
                        'content' => json_encode(['recommendations' => $recommendations]),
                    ],
                ],
            ],
        ];
    }
}
