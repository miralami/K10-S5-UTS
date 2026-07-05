<?php

namespace App\Http\Controllers;

use App\Services\LastFmService;
use App\Services\WeeklyMusicRecommendationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MusicRecommendationController extends Controller
{
    public function __construct(
        private readonly WeeklyMusicRecommendationService $musicRecommendations,
        private readonly LastFmService $lastFmService,
    ) {}

    public function create(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'mood' => ['required', 'string', 'min:3'],
        ]);

        $result = $this->musicRecommendations->buildRecommendations([
            'dominantMood' => $validated['mood'],
        ]);

        $items = $result['items'] ?? [];

        $source = (string) ($result['source'] ?? 'unknown');

        return response()->json([
            'recommendations' => $items,
            'source' => $source,
            'context' => [
                'category' => $result['category'] ?? null,
                'headline' => $result['headline'] ?? null,
                'description' => $result['description'] ?? null,
            ],
        ])->header('X-Recommendation-Source', $source);
    }
}
