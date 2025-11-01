<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\InstansiController;
use App\Http\Controllers\MovieSearchController;
use App\Http\Controllers\RecommendationController;

Route::prefix('instansi')->group(function () {
    Route::get('/datatable', [InstansiController::class, 'apiData']);
    Route::get('/kategori/{kategoriId}', [InstansiController::class, 'getInstansiByKategoriId']);
    Route::get('/export/{kategoriId}', [InstansiController::class, 'exportExcel']);

    Route::get('/meta', [InstansiController::class, 'create']);
    Route::get('/{instansi}/meta', [InstansiController::class, 'edit']);

    Route::get('/', [InstansiController::class, 'index']);
    Route::post('/', [InstansiController::class, 'store']);
    Route::get('/{instansi}', [InstansiController::class, 'show']);
    Route::put('/{instansi}', [InstansiController::class, 'update']);
    Route::patch('/{instansi}', [InstansiController::class, 'update']);
    Route::delete('/{instansi}', [InstansiController::class, 'destroy']);
});

Route::get('movies/search', [MovieSearchController::class, 'search']);
Route::post('recommendations', [RecommendationController::class, 'create']);
