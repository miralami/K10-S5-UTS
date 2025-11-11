<?php

<<<<<<< HEAD

$rawOrigins = env('FRONTEND_ORIGINS', env('FRONTEND_URL', 'http://localhost:5173'));

// Pisahkan daftar origins jika ada dan hilangkan spasi yang tidak perlu
$allowedOrigins = array_map('trim', array_filter(explode(',', (string) $rawOrigins)));

// Jika tidak ada origins yang valid, gunakan default localhost
if ($allowedOrigins === []) {
    $allowedOrigins = ['http://localhost:3000'];
}
=======
// Get allowed origins from environment or use defaults
$allowedOrigins = array_filter(array_map('trim',
    explode(',', env('FRONTEND_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173'))
));

// Ensure we have at least the default origins
$defaultOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
$allowedOrigins = array_values(array_unique(array_merge($allowedOrigins, $defaultOrigins)));
>>>>>>> origin/main-og

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_origins' => ['http://localhost:5173'],
    'allowed_methods' => ['*'],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
