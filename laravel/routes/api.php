<?php

use Illuminate\Support\Facades\Route;
<<<<<<< HEAD
use App\Http\Controllers\MentalHealthController;

// Rute API untuk halaman utama kesehatan mental (terlindungi oleh middleware)
Route::middleware('auth:api')->get('/mental-health', [MentalHealthController::class, 'index']);
=======
use App\Http\Controllers\Auth\JwtAuthController;
use App\Http\Controllers\JournalAnalysisController;
use App\Http\Controllers\JournalNoteController;
use App\Http\Controllers\RecommendationController;

Route::post('recommendations', [RecommendationController::class, 'create']);

Route::middleware('auth:api')->group(function () {
    Route::get('journal/daily-summary', [JournalAnalysisController::class, 'dailySummary']);
    Route::get('journal/weekly-summary', [JournalAnalysisController::class, 'weeklySummary']);
    // Manual trigger for generating weekly analysis for the authenticated user
    Route::post('journal/generate-weekly', [JournalAnalysisController::class, 'generateWeeklyForUser']);
    Route::apiResource('journal/notes', JournalNoteController::class)->parameters([
        'notes' => 'note',
    ]);
});
>>>>>>> origin/main-og

// Rute API untuk konsultasi dengan AI (terlindungi oleh middleware)
Route::middleware('auth:api')->post('/consultation', [MentalHealthController::class, 'consult']);
