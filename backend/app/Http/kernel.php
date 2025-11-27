<?php

namespace App\Http;

use Illuminate\Foundation\Http\Kernel as HttpKernel;
use Tymon\JWTAuth\Middleware\Authenticate as AuthenticateJWT; // Import JWT middleware
use Barryvdh\Cors\HandleCors; // Import CORS middleware

class Kernel extends HttpKernel
{
    /**
     * The application's global HTTP middleware stack.
     *
     * This middleware will run during every HTTP request to your application.
     *
     * @var array
     */
    protected $middleware = [
        \App\Http\Middleware\TrustProxies::class,
        \Illuminate\Http\Middleware\PreventRequestsDuringMaintenance::class,
        \Illuminate\Foundation\Http\Middleware\ValidatePostSize::class,
        \App\Http\Middleware\LoadVariables::class,
        \Illuminate\Session\Middleware\StartSession::class,
        \Illuminate\View\Middleware\ShareErrorsFromSession::class,
        \App\Http\Middleware\Authenticate::class,  // Untuk autentikasi berbasis session, jika diperlukan
        HandleCors::class,  // Middleware CORS untuk menangani permintaan lintas domain
        \Illuminate\Routing\Middleware\SubstituteBindings::class,
    ];

    /**
     * The application's route middleware.
     *
     * This middleware can be assigned to groups or individual routes.
     *
     * @var array
     */
    protected $routeMiddleware = [
        'auth' => \App\Http\Middleware\Authenticate::class,  // Middleware untuk autentikasi berbasis session
        'guest' => \App\Http\Middleware\RedirectIfAuthenticated::class,
        'verified' => \App\Http\Middleware\EnsureEmailIsVerified::class,
        'jwt.auth' => AuthenticateJWT::class,  // Middleware JWT untuk autentikasi (API)
        'role' => \App\Http\Middleware\RoleMiddleware::class,  // Middleware untuk kontrol akses berbasis peran (optional)
    ];
}
