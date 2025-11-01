<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class MovieSearchController extends Controller
{
    /**
     * Proxy search requests to the OMDB API using environment configuration.
     */
    public function search(Request $request): JsonResponse
    {
        $validated = $request->validate([
            's' => ['required', 'string'],
            'type' => ['nullable', 'in:movie,series,episode'],
            'y' => ['nullable', 'regex:/^\d{4}$/'],
            'page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $apiKey = config('services.omdb.key');
        $rawBaseUri = config('services.omdb.base_uri', '');

        if (empty($rawBaseUri)) {
            return response()->json([
                'message' => 'OMDB base URI is not configured. Please set OMDB_API_BASE_URL in the environment file.',
            ], 500);
        }

        $parsedBase = parse_url($rawBaseUri);

        if (!isset($parsedBase['scheme'], $parsedBase['host'])) {
            return response()->json([
                'message' => 'OMDB base URI is invalid. Please provide a full URL, e.g. https://www.omdbapi.com/.',
            ], 500);
        }

        $baseUri = $parsedBase['scheme'] . '://' . $parsedBase['host'] . ($parsedBase['path'] ?? '');

        $defaultQuery = [];
        if (!empty($parsedBase['query'])) {
            parse_str($parsedBase['query'], $defaultQuery);
        }

        // Remove parameters that will be supplied dynamically.
        foreach (['i', 't', 's', 'type', 'y', 'page', 'r'] as $key) {
            unset($defaultQuery[$key]);
        }

        if (!empty($apiKey)) {
            $defaultQuery['apikey'] = $apiKey;
        }

        $query = array_filter(array_merge($defaultQuery, [
            's' => trim($validated['s']),
            'type' => $validated['type'] ?? null,
            'y' => $validated['y'] ?? null,
            'r' => 'json',
            'page' => $validated['page'] ?? 1,
        ]), fn ($value) => $value !== null && $value !== '');

        $response = Http::acceptJson()->get($baseUri, $query);

        if ($response->failed()) {
            return response()->json([
                'message' => 'Failed to fetch data from OMDB API.',
                'details' => $response->json(),
            ], $response->status() ?: 502);
        }

        return response()->json($response->json(), $response->status());
    }
}
