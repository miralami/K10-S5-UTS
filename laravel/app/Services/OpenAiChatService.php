<?php

namespace App\Services;

use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class OpenAiChatService
{
    /**
     * Send a chat completion request to the configured OpenAI-compatible endpoint.
     *
     * @param array<int, array<string, mixed>> $messages
     * @param array<string, mixed> $options
     *
     * @return array<string, mixed>
     */
    public function createChatCompletion(array $messages, array $options = []): array
    {
        $baseUri = rtrim((string) config('services.openai.base_uri'), '/');

        if ($baseUri === '') {
            throw new RuntimeException('OPENAI_API_BASE_URL is not configured.');
        }

        $endpoint = $baseUri . '/v1/chat/completions';

        $payload = [
            'model' => Arr::get($options, 'model', config('services.openai.chat_model', 'gpt-oss-20b')),
            'messages' => $messages,
            'stream' => (bool) Arr::get($options, 'stream', false),
        ];

        if ($metadata = Arr::get($options, 'metadata')) {
            $payload['metadata'] = $metadata;
        }

        if ($jsonOverrides = Arr::get($options, 'json')) {
            $payload = array_merge($payload, $jsonOverrides);
        }

        $headers = ['Content-Type' => 'application/json'];

        if ($apiKey = config('services.openai.key')) {
            $headers['Authorization'] = 'Bearer ' . $apiKey;
        }

        $response = Http::withHeaders($headers)
            ->timeout((int) Arr::get($options, 'timeout', 60))
            ->post($endpoint, $payload);

        if ($response->failed()) {
            $message = data_get($response->json(), 'error.message')
                ?? data_get($response->json(), 'message')
                ?? $response->body()
                ?? 'OpenAI API request failed.';

            throw new RuntimeException($message, $response->status() ?: 500);
        }

        return $response->json();
    }
}
