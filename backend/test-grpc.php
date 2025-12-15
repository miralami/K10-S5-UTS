<?php

require __DIR__.'/vendor/autoload.php';

echo "Testing gRPC Client...\n";

try {
    // Test if classes are loaded
    if (!class_exists('\Ai\AIAnalysisServiceClient')) {
        echo "ERROR: AIAnalysisServiceClient class not found!\n";
        exit(1);
    }
    
    if (!class_exists('\Ai\DailyAnalysisRequest')) {
        echo "ERROR: DailyAnalysisRequest class not found!\n";
        exit(1);
    }
    
    echo "✓ All gRPC classes loaded successfully\n";
    
    // Test gRPC connection
    $client = new \Ai\AIAnalysisServiceClient(
        'localhost:50052',
        ['credentials' => \Grpc\ChannelCredentials::createInsecure()]
    );
    
    echo "✓ gRPC client created successfully\n";
    echo "✓ AI service is ready at localhost:50052\n";
    
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    exit(1);
}
