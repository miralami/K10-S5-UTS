<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\JournalAnalysisController;
use App\Http\Controllers\MovieSearchController;
use App\Http\Controllers\RecommendationController;

Route::get('movies/search', [MovieSearchController::class, 'search']);
Route::post('recommendations', [RecommendationController::class, 'create']);
Route::get('journal/weekly-summary', [JournalAnalysisController::class, 'weeklySummary']);
