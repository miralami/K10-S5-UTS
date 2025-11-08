<?php


$rawOrigins = env('FRONTEND_ORIGINS', env('FRONTEND_URL', 'http://localhost:5173'));

// Pisahkan daftar origins jika ada dan hilangkan spasi yang tidak perlu
$allowedOrigins = array_map('trim', array_filter(explode(',', (string) $rawOrigins)));

// Jika tidak ada origins yang valid, gunakan default localhost
if ($allowedOrigins === []) {
    $allowedOrigins = ['http://localhost:3000'];
}

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => $allowedOrigins,
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
