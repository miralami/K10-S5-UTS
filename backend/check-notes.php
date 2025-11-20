<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';

$kernel = $app->make(IllwaremConsoleKernel::class);
$kernel->bootstrap();

use App\Models\JournalNote;

$notes = JournalNote::select('created_at')->orderBy('created_at')->get();

echo 'Total notes: '.$notes->count()."\n";

if ($notes->isNotEmpty()) {
    echo 'Earliest note: '.$notes->first()->created_at."\n";
    echo 'Latest note: '.$notes->last()->created_at."\n";
} else {
    echo 'No notes found.\n';
}
