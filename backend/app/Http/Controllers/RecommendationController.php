<?php

namespace App\Http\Controllers;

use App\Services\GeminiMovieRecommendationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RecommendationController extends Controller
{
    public function __construct(
        private readonly GeminiMovieRecommendationService $gemini
    ) {}

    public function create(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'mood' => ['required', 'string', 'min:3'],
        ]);

        $geminiKey = (string) (config('services.google_genai.api_key') ?? '');
        if ($geminiKey !== '') {
            try {
                $recommendations = $this->gemini->recommend($validated['mood']);
                if (! empty($recommendations)) {
                    $recommendations = $this->enrichWithOmdbPosters($recommendations);

                    return response()->json([
                        'recommendations' => $recommendations,
                        'source' => 'gemini',
                    ])->header('X-Recommendation-Source', 'gemini');
                }
                Log::warning('Gemini returned empty recommendations', ['mood' => $validated['mood']]);
            } catch (\Throwable $e) {
                Log::error('Gemini movie recommendations failed', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                    'mood' => $validated['mood'],
                ]);
                // Fallback to OMDb if Gemini fails
                $recommendations = $this->buildOmdbRecommendationsFromMood($validated['mood']);

                return response()->json([
                    'recommendations' => $recommendations,
                    'source' => 'omdb',
                    'error' => 'Gemini error: '.$e->getMessage(),
                ]);
            }
        }

        // If no Gemini key is provided, use OMDb directly
        $recommendations = $this->buildOmdbRecommendationsFromMood($validated['mood']);

        return response()->json([
            'recommendations' => $recommendations,
            'source' => 'omdb',
            'warning' => 'Gemini API key not configured',
        ]);
    }

    /**
     * @param  array<int, array<string, mixed>>  $items
     * @return array<int, array<string, mixed>>
     */
    private function enrichWithOmdbPosters(array $items): array
    {
        $apiKey = (string) (config('services.omdb.key') ?: 'd980ae3f');
        $baseUri = 'https://www.omdbapi.com/';

        if (empty($apiKey)) {
            return $items;
        }

        return array_map(function (array $item) use ($apiKey, $baseUri) {
            if (! empty($item['posterUrl'])) {
                return $item;
            }

            $imdbId = $item['imdbId'] ?? '';
            $title = $item['title'] ?? '';

            if (empty($title) && empty($imdbId)) {
                return $item;
            }

            try {
                $params = ['apikey' => $apiKey];
                if (! empty($imdbId)) {
                    $params['i'] = $imdbId;
                } else {
                    $params['t'] = $title;
                }

                $response = Http::timeout(10)->get($baseUri, $params);

                if ($response->successful()) {
                    $data = $response->json();
                    if (isset($data['Response']) && $data['Response'] === 'True') {
                        if (! empty($data['Poster']) && strtoupper($data['Poster']) !== 'N/A') {
                            $item['posterUrl'] = $data['Poster'];
                        }
                        $item['imdbId'] = $data['imdbID'] ?? $item['imdbId'] ?? null;
                        $item['year'] = $data['Year'] ?? $item['year'] ?? null;
                        $item['overview'] = $data['Plot'] ?? $item['overview'] ?? '';
                    }
                }
            } catch (\Throwable $e) {
                Log::error('Failed to fetch poster from OMDb', [
                    'error' => $e->getMessage(),
                    'title' => $title,
                    'imdbId' => $imdbId,
                ]);
            }

            return $item;
        }, $items);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function buildOmdbRecommendationsFromMood(string $mood): array
    {
        $apiKey = (string) (config('services.omdb.key') ?: 'd980ae3f');
        $baseUri = 'https://www.omdbapi.com/';

        if (empty($apiKey)) {
            return $this->getDefaultRecommendations();
        }

        $query = $this->mapMoodToOmdbQuery($mood);

        try {
            $response = Http::timeout(15)->get($baseUri, [
                's' => $query,
                'type' => 'movie',
                'apikey' => $apiKey,
            ]);

            if (! $response->successful()) {
                return $this->getDefaultRecommendations();
            }

            $data = $response->json();
            if (! isset($data['Search']) || ! is_array($data['Search'])) {
                return $this->getDefaultRecommendations();
            }

            $results = array_filter($data['Search'], function ($item) {
                return is_array($item) &&
                       ! empty($item['Title']) &&
                       ! empty($item['imdbID']);
            });

            $top = array_slice($results, 0, 5);
            $recommendations = [];

            foreach ($top as $item) {
                $recommendations[] = [
                    'title' => $item['Title'],
                    'year' => $item['Year'] ?? null,
                    'imdbId' => $item['imdbID'],
                    'posterUrl' => $item['Poster'] ?? null,
                    'overview' => '',
                ];
            }

            return $this->enrichWithOmdbPosters($recommendations);
        } catch (\Throwable $e) {
            Log::error('Failed to get movie recommendations from OMDb', [
                'error' => $e->getMessage(),
                'mood' => $mood,
            ]);

            return $this->getDefaultRecommendations();
        }
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function getDefaultRecommendations(): array
    {
        return [
            [
                'title' => 'La La Land',
                'year' => '2016',
                'overview' => 'A jazz pianist falls for an aspiring actress in Los Angeles.',
                'posterUrl' => 'https://m.media-amazon.com/images/M/MV5BMzUzNDM2NzM2MV5BMl5BanBnXkFtZTgwNTM3NTg4OTE@._V1_SX300.jpg',
                'imdbId' => 'tt3783958',
            ],
            [
                'title' => 'Paddington 2',
                'year' => '2017',
                'overview' => 'Paddington, now happily settled with the Brown family and a popular member of the local community, picks up a series of odd jobs to buy the perfect present for his Aunt Lucy\'s 100th birthday, only for the gift to be stolen.',
                'posterUrl' => 'https://m.media-amazon.com/images/M/MV5BMmYwNWZlNzEtNjE4Zi00NzQ4LWI2YmUtOWZhNzZhZDYyNmVmXkEyXkFqcGdeQXVyNzYzODM3Mzg@._V1_SX300.jpg',
                'imdbId' => 'tt4468740',
            ],
            [
                'title' => 'The Grand Budapest Hotel',
                'year' => '2014',
                'overview' => 'A writer encounters the owner of an aging high-class hotel, who tells him of his early years serving as a lobby boy in the hotel\'s glorious years under an exceptional concierge.',
                'posterUrl' => 'https://m.media-amazon.com/images/M/MV5BMzM5NjUxOTEyMl5BMl5BanBnXkFtZTgwNjEyMDM0MDE@._V1_SX300.jpg',
                'imdbId' => 'tt2278388',
            ],
        ];
    }

    private function mapMoodToOmdbQuery(string $mood): string
    {
        // Simple mood to genre mapping
        $mood = strtolower($mood);
        $genres = [
            'happy' => 'comedy',
            'sad' => 'drama',
            'excited' => 'action',
            'scared' => 'horror',
            'romantic' => 'romance',
            'adventurous' => 'adventure',
            'thoughtful' => 'drama',
            'nostalgic' => 'family',
            'inspired' => 'biography',
            'relaxed' => 'comedy',
        ];

        $defaultGenre = 'drama';
        $genre = $defaultGenre;

        foreach ($genres as $moodKeyword => $moodGenre) {
            if (str_contains($mood, $moodKeyword)) {
                $genre = $moodGenre;
                break;
            }
        }

        return $genre;
    }
}
