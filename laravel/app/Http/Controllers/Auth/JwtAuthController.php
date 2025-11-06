<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Tymon\JWTAuth\Exceptions\JWTException;
use Tymon\JWTAuth\Facades\JWTAuth;

class JwtAuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);

        $token = Auth::guard('api')->login($user);

        return $this->respondWithToken($token, 201);
    }

    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        try {
            if (! $token = Auth::guard('api')->attempt($credentials)) {
                throw ValidationException::withMessages([
                    'email' => __('auth.failed'),
                ]);
            }
        } catch (JWTException $exception) {
            return response()->json([
                'message' => 'Could not create token.',
                'error' => $exception->getMessage(),
            ], 500);
        }

        return $this->respondWithToken($token);
    }

    public function me(): JsonResponse
    {
        return response()->json(Auth::guard('api')->user());
    }

    public function logout(): JsonResponse
    {
        Auth::guard('api')->logout();

        return response()->json([
            'message' => 'Successfully logged out.',
        ]);
    }

    public function refresh(): JsonResponse
    {
        try {
            $token = Auth::guard('api')->refresh();
        } catch (JWTException $exception) {
            return response()->json([
                'message' => 'Could not refresh token.',
                'error' => $exception->getMessage(),
            ], 401);
        }

        return $this->respondWithToken($token);
    }

    private function respondWithToken(string $token, int $status = 200): JsonResponse
    {
        $guard = Auth::guard('api');
        $ttl = $guard->factory()->getTTL();
        $refreshTtl = config('jwt.refresh_ttl');

        return response()->json([
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => $ttl * 60,
            'refresh_expires_in' => $refreshTtl ? $refreshTtl * 60 : null,
            'user' => $guard->user(),
        ], $status);
    }
}
