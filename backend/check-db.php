<?php

use App\Models\JournalNote;
use App\Models\User;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Check users
$users = User::all();
echo 'Users in database: '.$users->count()."\n";

if ($users->isNotEmpty()) {
    $user = $users->first();
    echo 'First user ID: '.$user->id."\n";

    // Create a test journal note
    $note = new JournalNote([
        'user_id' => $user->id,
        'title' => 'Test Journal Note',
        'body' => 'This is a test journal note created for analysis.',
        'created_at' => now(),
    ]);

    $note->save();

    echo 'Created test journal note with ID: '.$note->id."\n";
    echo 'Total journal notes now: '.JournalNote::count()."\n";
} else {
    echo "No users found. Please create a user first.\n";
}
