<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\JwtAuthController;
use App\Http\Controllers\JournalAnalysisController;
use App\Http\Controllers\MovieSearchController;
use App\Http\Controllers\RecommendationController;

Route::get('movies/search', [MovieSearchController::class, 'search']);
Route::post('recommendations', [RecommendationController::class, 'create']);
Route::get('journal/weekly-summary', [JournalAnalysisController::class, 'weeklySummary']);

Route::prefix('auth')->group(function () {
    Route::post('register', [JwtAuthController::class, 'register']);
    Route::post('login', [JwtAuthController::class, 'login']);

    Route::middleware('auth:api')->group(function () {
        Route::post('logout', [JwtAuthController::class, 'logout']);
        Route::post('refresh', [JwtAuthController::class, 'refresh']);
        Route::get('me', [JwtAuthController::class, 'me']);
    });
});
