<?php

// Get allowed origins from environment or use defaults
$allowedOrigins = array_filter(array_map('trim', 
    explode(',', env('FRONTEND_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173'))
));

// Ensure we have at least the default origins
$defaultOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
$allowedOrigins = array_values(array_unique(array_merge($allowedOrigins, $defaultOrigins)));

return [
    'paths' => [
        'api/*', 
        'sanctum/csrf-cookie', 
        'login', 
        'logout',
        'sanctum/*',
        'broadcasting/*',
    ],
    'allowed_methods' => ['*'],
    'allowed_origins' => $allowedOrigins,
    'allowed_origins_patterns' => [],
    'allowed_headers' => [
        'Content-Type',
        'X-Auth-Token',
        'Origin',
        'Authorization',
        'X-Requested-With',
        'X-CSRF-TOKEN',
        'X-XSRF-TOKEN',
        'Accept',
        'X-Socket-Id',
    ],
    'exposed_headers' => [
        'Authorization',
        'X-CSRF-TOKEN',
        'X-XSRF-TOKEN',
    ],
    'max_age' => 60 * 60 * 24, // 24 hours
    'supports_credentials' => true,
];
