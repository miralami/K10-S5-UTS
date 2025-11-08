<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\MentalHealthController;

// Rute API untuk halaman utama kesehatan mental (terlindungi oleh middleware)
Route::middleware('auth:api')->get('/mental-health', [MentalHealthController::class, 'index']);

// Rute API untuk konsultasi dengan AI (terlindungi oleh middleware)
Route::middleware('auth:api')->post('/consultation', [MentalHealthController::class, 'consult']);
