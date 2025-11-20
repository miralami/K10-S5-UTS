<?php

use App\Http\Controllers\Auth\JwtAuthController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\JournalAnalysisController;
use App\Http\Controllers\JournalNoteController;
use App\Http\Controllers\MentalHealthController;
use App\Http\Controllers\RecommendationController;
use Illuminate\Support\Facades\Route;

Route::group([
    'middleware' => 'api',
    'prefix' => 'auth'
], function ($router) {
    Route::post('register', [JwtAuthController::class, 'register']);
    Route::post('login', [JwtAuthController::class, 'login']);
    Route::post('logout', [JwtAuthController::class, 'logout']);
    Route::post('refresh', [JwtAuthController::class, 'refresh']);
    Route::post('me', [JwtAuthController::class, 'me']);
});

Route::post('recommendations', [RecommendationController::class, 'create']);

Route::middleware('auth:api')->group(function () {
    Route::get('journal/daily-summary', [JournalAnalysisController::class, 'dailySummary']);
    Route::get('journal/weekly-summary', [JournalAnalysisController::class, 'weeklySummary']);
    // Manual trigger for generating weekly analysis for the authenticated user
    Route::post('journal/generate-weekly', [JournalAnalysisController::class, 'generateWeeklyForUser']);
    Route::apiResource('journal/notes', JournalNoteController::class)->parameters([
        'notes' => 'note',
    ]);

    // Rute API untuk halaman utama kesehatan mental (terlindungi oleh middleware)
    Route::get('/mental-health', [MentalHealthController::class, 'index']);
    // Rute API untuk konsultasi dengan AI (terlindungi oleh middleware)
    Route::post('/consultation', [MentalHealthController::class, 'consult']);
});


