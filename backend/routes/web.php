<?php

use App\Http\Controllers\Auth\AuthController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'message' => 'Hey Jude',
    ]);
});

// Rute untuk halaman login
Route::get('login', [AuthController::class, 'showLoginForm'])->name('login');
Route::post('login', [AuthController::class, 'login']);

// Rute untuk halaman register
Route::get('register', [AuthController::class, 'showRegisterForm'])->name('register');
Route::post('register', [AuthController::class, 'register']);

// Rute untuk logout
Route::post('logout', [AuthController::class, 'logout'])->name('logout');

// Halaman home setelah login
Route::get('/home', function () {
    return view('home');
})->middleware('auth');

