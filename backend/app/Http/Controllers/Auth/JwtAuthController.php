<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Tymon\JWTAuth\Exceptions\JWTException;
use Tymon\JWTAuth\Facades\JWTAuth;

class JwtAuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        try {
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

            $token = JWTAuth::fromUser($user);
            if (! $token) {
                throw new \Exception('Could not create access token');
            }

            return $this->respondWithToken($token, 201);
        } catch (ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validasi gagal',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Registration Error: '.$e->getMessage());

            return response()->json([
                'status' => 'error',
                'message' => 'Terjadi kesalahan saat registrasi. Silakan coba lagi.',
            ], 500);
        }
    }

    public function login(Request $request): JsonResponse
    {
        try {
            $credentials = $request->validate([
                'email' => ['required', 'string', 'email'],
                'password' => ['required', 'string'],
            ]);

            $token = JWTAuth::attempt($credentials);
            if (! $token) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Email atau password salah',
                ], 401);
            }

            return $this->respondWithToken($token);

        } catch (ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validasi gagal',
                'errors' => $e->errors(),
            ], 422);
        } catch (JWTException $e) {
            Log::error('JWT Error: '.$e->getMessage());

            return response()->json([
                'status' => 'error',
                'message' => 'Terjadi kesalahan pada sistem. Silakan coba lagi.',
            ], 500);
        }
    }

    public function me(): JsonResponse
    {
        try {
            $user = Auth::guard('api')->user();
            if (! $user) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'User tidak ditemukan',
                ], 401);
            }

            return response()->json([
                'status' => 'success',
                'data' => $user,
            ]);

        } catch (\Exception $e) {
            Log::error('Get User Error: '.$e->getMessage());

            return response()->json([
                'status' => 'error',
                'message' => 'Terjadi kesalahan saat mengambil data user.',
            ], 500);
        }
    }

    public function logout(): JsonResponse
    {
        try {
            Auth::guard('api')->logout();
            JWTAuth::invalidate(JWTAuth::getToken());

            return response()->json([
                'status' => 'success',
                'message' => 'Berhasil logout.',
            ]);

        } catch (JWTException $e) {
            Log::error('Logout Error: '.$e->getMessage());

            return response()->json([
                'status' => 'error',
                'message' => 'Terjadi kesalahan saat logout.',
            ], 500);
        }
    }

    public function refresh(): JsonResponse
    {
        try {
            $token = JWTAuth::refresh();

            return $this->respondWithToken($token);

        } catch (JWTException $e) {
            Log::error('Token Refresh Error: '.$e->getMessage());

            return response()->json([
                'status' => 'error',
                'message' => 'Terjadi kesalahan saat memperbaharui token.',
            ], 401);
        }
    }

    private function respondWithToken(string $token, int $status = 200): JsonResponse
    {
        $ttl = config('jwt.ttl');
        $refreshTtl = config('jwt.refresh_ttl');

        return response()->json([
            'status' => 'success',
            'data' => [
                'access_token' => $token,
                'token_type' => 'bearer',
                'expires_in' => $ttl * 60,
                'refresh_expires_in' => $refreshTtl ? $refreshTtl * 60 : null,
                'user' => Auth::guard('api')->user(),
            ],
        ], $status);
    }
}
