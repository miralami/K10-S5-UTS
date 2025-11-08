<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class MentalHealthMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        // Cek jika pengguna tidak terautentikasi (guest)
        if (auth()->guest()) {
            return response()->json(['message' => 'Unauthorized'], 401);  // Mengembalikan response JSON
        }

        return $next($request);  // Lanjutkan jika pengguna terautentikasi
    }
}