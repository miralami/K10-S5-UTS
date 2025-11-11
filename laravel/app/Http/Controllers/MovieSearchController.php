<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class MovieSearchController extends Controller
{
    /**
     * Movie search was removed. Keep the route/controller in place but return
     * a clear 410 Gone response so accidental calls fail fast and are easy to
     * diagnose.
     */
    public function search(Request $request): JsonResponse
    {
        return response()->json([
            'message' => 'Movie search endpoint has been removed. Use movie recommendations when available.'
        ], 410);
    }
}
