<?php

use App\Http\Controllers\Auth\JwtAuthController;
use App\Http\Controllers\JournalAnalysisController;
use App\Http\Controllers\JournalNoteController;
use App\Http\Controllers\RecommendationController;
use Illuminate\Support\Facades\Route;

Route::group([
    'middleware' => 'api',
    'prefix' => 'auth',
], function ($router) {
    Route::post('register', [JwtAuthController::class, 'register']);
    Route::post('login', [JwtAuthController::class, 'login']);
    Route::post('logout', [JwtAuthController::class, 'logout']);
    Route::post('refresh', [JwtAuthController::class, 'refresh']);
    Route::post('me', [JwtAuthController::class, 'me']);
});

Route::get('health', fn () => response()->json([
    'status' => 'ok',
    'timestamp' => now(),
    'service' => 'backend-api',
]));

Route::post('recommendations', [RecommendationController::class, 'create']);

Route::middleware('auth:api')->group(function () {
    // Journal Analysis
    Route::get('journal/daily-summary', [JournalAnalysisController::class, 'dailySummary']);
    Route::get('journal/weekly-summary', [JournalAnalysisController::class, 'weeklySummary']);
    Route::post('journal/generate-weekly', [JournalAnalysisController::class, 'generateWeeklyForUser']);
    Route::get('journal/writing-style', [JournalAnalysisController::class, 'writingStyle']);
    
    // Journal Notes with Gratitude Features
    Route::get('journal/notes/search', [JournalNoteController::class, 'search']);
    Route::get('journal/gratitude/stats', [JournalNoteController::class, 'gratitudeStats']);
    Route::get('journal/gratitude/distribution', [JournalNoteController::class, 'gratitudeDistribution']);
    Route::get('journal/gratitude/insights', [JournalNoteController::class, 'gratitudeInsights']);
    Route::get('journal/gratitude/random', [JournalNoteController::class, 'randomGratitude']);
    Route::get('journal/gratitude/prompts', [JournalNoteController::class, 'gratitudePrompts']);
    
    Route::apiResource('journal/notes', JournalNoteController::class)->parameters([
        'notes' => 'note',
    ]);
});