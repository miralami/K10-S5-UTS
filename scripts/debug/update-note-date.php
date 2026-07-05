<?php

use App\Models\JournalNote;
use Carbon\Carbon;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Get the most recent note
$note = JournalNote::latest()->first();

if ($note) {
    // Set the note's date to the start of the current week
    $startOfWeek = Carbon::now()->startOfWeek();
    $note->created_at = $startOfWeek;
    $note->save();

    echo "Updated note ID {$note->id} date to: ".$startOfWeek->format('Y-m-d H:i:s')."\n";
} else {
    echo "No journal notes found.\n";
}
