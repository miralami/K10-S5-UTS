Guide for middleware teammate:

1. Run php artisan jwt:secret once to set JWT_SECRET, or copy into .env. Optionally adjust JWT_TTL, JWT_REFRESH_TTL, JWT_BLACKLIST_ENABLED.
2. Protected routes just use Route::middleware('auth:api') (already shown for /logout|refresh|me). Middleware can fetch the authenticated user with Auth::guard('api')->user() or helper auth('api')->user().
3. For frontend, send Authorization: Bearer <access_token> header. (FILE REFRESH) .refresh endpoint responds with new token; reuse same header pattern.
5. On logout, token invalidated via blacklist if enabled.
6. If they build custom middleware, inject guard:

```php
public function handle($request, Closure $next)
{
    if (! auth('api')->check()) {
        return response()->json(['message' => 'Unauthenticated'], 401);
    }

    return $next($request);
}
```

7. Ensure any tests calling protected routes set Authorization header or fake guard with actingAs($user, 'api').