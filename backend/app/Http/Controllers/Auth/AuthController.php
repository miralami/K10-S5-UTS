<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    // Menampilkan form login
    public function showLoginForm()
    {
        return view('auth.login');
    }

    // Menampilkan form register
    public function showRegisterForm()
    {
        return view('auth.register');
    }

    // Proses login
    public function login(Request $request)
    {
        // Validasi input
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|min:6',
        ]);

        // Cek kredensial login
        if (Auth::attempt($request->only('email', 'password'))) {
            // Generate JWT token jika login berhasil
            $user = Auth::user();
            $token = JWTAuth::fromUser($user);
            return response()->json(compact('token'));
        }

        // Jika login gagal
        return back()->withErrors([
            'email' => 'Email atau password tidak valid.',
        ]);
    }

    // Proses register
    public function register(Request $request)
    {
        // Validasi input
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6|confirmed',
        ]);

        // Membuat user baru
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        // Login pengguna setelah register
        Auth::login($user);

        // Generate JWT token setelah register
        $token = JWTAuth::fromUser($user);

        return response()->json(compact('token'));
    }

    // Fungsi untuk logout
    public function logout()
    {
        // Menghapus token JWT
        JWTAuth::invalidate(JWTAuth::getToken());
        return response()->json(['message' => 'Logged out successfully']);
    }
}
