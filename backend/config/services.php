<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'omdb' => [
        'base_uri' => env('OMDB_API_BASE_URL', 'https://www.omdbapi.com/'),
        'key' => env('OMDB_API_KEY', '9f2e66a9'),
    ],

    'google_genai' => [
        'api_key' => env('GOOGLE_GENAI_API_KEY'),
        'model' => env('GOOGLE_GENAI_MODEL', 'gemini-2.5-flash'),
    ],

    'ai_grpc' => [
        'host' => env('AI_GRPC_HOST', 'localhost'),
        'port' => env('AI_GRPC_PORT', 50052),
        'enabled' => env('AI_GRPC_ENABLED', false),
    ],

];
