<?php

/**
 * Generate PHP gRPC client code from proto files.
 *
 * Prerequisites:
 * - protoc (Protocol Buffer Compiler) installed
 * - grpc_php_plugin installed
 *
 * Run: php generate-proto.php
 */
$protoDir = realpath(__DIR__.'/../ai-service/proto');
$outputDir = __DIR__.'/app/Grpc';
$protoFile = $protoDir.'/ai.proto';

if (! file_exists($protoFile)) {
    echo "Error: Proto file not found at {$protoFile}\n";
    exit(1);
}

// Create output directory
if (! is_dir($outputDir)) {
    mkdir($outputDir, 0755, true);
    echo "Created output directory: {$outputDir}\n";
}

// Check if protoc is available
$protocCheck = shell_exec('protoc --version 2>&1');
if (strpos($protocCheck, 'libprotoc') === false) {
    echo "Error: protoc not found. Install Protocol Buffers Compiler:\n";
    echo "  Windows: choco install protoc\n";
    echo "  Mac: brew install protobuf\n";
    echo "  Linux: apt install protobuf-compiler\n";
    exit(1);
}

echo "Found: {$protocCheck}";

// Check for grpc_php_plugin
$pluginPath = '';
$possiblePlugins = [
    'grpc_php_plugin',
    '/usr/local/bin/grpc_php_plugin',
    'C:\\grpc\\grpc_php_plugin.exe',
];

foreach ($possiblePlugins as $path) {
    $check = shell_exec("{$path} --version 2>&1");
    if ($check !== null && strpos($check, 'not found') === false && strpos($check, 'not recognized') === false) {
        $pluginPath = $path;
        break;
    }
}

if (! $pluginPath) {
    echo "Warning: grpc_php_plugin not found. Only generating message classes.\n";
    echo "To generate service client, install grpc_php_plugin:\n";
    echo "  See: https://grpc.io/docs/languages/php/quickstart/\n\n";
}

// Generate PHP message classes
$cmd = sprintf(
    'protoc --proto_path=%s --php_out=%s %s 2>&1',
    escapeshellarg($protoDir),
    escapeshellarg($outputDir),
    escapeshellarg($protoFile)
);

echo "Running: {$cmd}\n";
$output = shell_exec($cmd);

if ($output) {
    echo "Output: {$output}\n";
}

// Generate gRPC client if plugin available
if ($pluginPath) {
    $grpcCmd = sprintf(
        'protoc --proto_path=%s --grpc_out=%s --plugin=protoc-gen-grpc=%s %s 2>&1',
        escapeshellarg($protoDir),
        escapeshellarg($outputDir),
        escapeshellarg($pluginPath),
        escapeshellarg($protoFile)
    );

    echo "Running: {$grpcCmd}\n";
    $grpcOutput = shell_exec($grpcCmd);

    if ($grpcOutput) {
        echo "Output: {$grpcOutput}\n";
    }
}

// List generated files
echo "\nGenerated files:\n";
$files = glob($outputDir.'/**/*.php') ?: glob($outputDir.'/*.php') ?: [];
if (empty($files)) {
    $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($outputDir));
    foreach ($iterator as $file) {
        if ($file->isFile() && $file->getExtension() === 'php') {
            echo "  - {$file->getPathname()}\n";
        }
    }
} else {
    foreach ($files as $file) {
        echo "  - {$file}\n";
    }
}

echo "\nDone! Add the following to composer.json autoload:\n";
echo <<<'JSON'
"autoload": {
    "psr-4": {
        "App\\": "app/",
        "Ai\\": "app/Grpc/Ai/",
        "GPBMetadata\\": "app/Grpc/GPBMetadata/"
    }
}
JSON;
echo "\n\nThen run: composer dump-autoload\n";
