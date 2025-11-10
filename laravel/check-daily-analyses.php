<?php

use App\Models\DailyJournalAnalysis;
use App\Models\WeeklyJournalAnalysis;
use Carbon\Carbon;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Check daily analyses
$dailyAnalyses = DailyJournalAnalysis::all();
echo "Total daily analyses: " . $dailyAnalyses->count() . "\n";

if ($dailyAnalyses->isNotEmpty()) {
    $first = $dailyAnalyses->first();
    echo "First analysis date: " . $first->analysis_date . "\n";
    
    // Check if there's a weekly analysis for this week
    $startOfWeek = Carbon::parse($first->analysis_date)->startOfWeek();
    $endOfWeek = $startOfWeek->copy()->endOfWeek();
    
    echo "Week range: {$startOfWeek->format('Y-m-d')} to {$endOfWeek->format('Y-m-d')}\n";
    
    $weeklyAnalysis = WeeklyJournalAnalysis::where('user_id', $first->user_id)
        ->where('start_date', $startOfWeek->format('Y-m-d'))
        ->where('end_date', $endOfWeek->format('Y-m-d'))
        ->first();
        
    echo "Weekly analysis exists: " . ($weeklyAnalysis ? 'Yes' : 'No') . "\n";
    
    // Try to create a weekly analysis directly
    echo "\nTrying to create weekly analysis...\n";
    
    try {
        // Get all daily analyses for this user in this week
        $dailies = DailyJournalAnalysis::where('user_id', $first->user_id)
            ->whereBetween('analysis_date', [
                $startOfWeek->format('Y-m-d'),
                $endOfWeek->format('Y-m-d')
            ])
            ->get();
            
        echo "Found {$dailies->count()} daily analyses for this week.\n";
        
        if ($dailies->isNotEmpty()) {
            $noteCount = 0;
            $dailyData = [];
            
            foreach ($dailies as $daily) {
                $payload = json_decode($daily->payload, true);
                $noteCount += $payload['note_count'] ?? 0;
                $dailyData[] = [
                    'date' => $daily->analysis_date,
                    'mood' => $payload['analysis']['mood'] ?? 'unknown',
                    'note_count' => $payload['note_count'] ?? 0
                ];
            }
            
            echo "Total notes in week: {$noteCount}\n";
            echo "Daily data: " . json_encode($dailyData, JSON_PRETTY_PRINT) . "\n";
            
            if ($noteCount > 0) {
                echo "\nThis user has notes in the current week and should be processed.\n";
                echo "Try running: php artisan journal:generate-weekly-analysis --user={$first->user_id}\n";
            } else {
                echo "\nNo notes found in the daily analyses for this week.\n";
            }
        }
    } catch (\Exception $e) {
        echo "Error: " . $e->getMessage() . "\n";
    }
}

echo "\nChecking weekly analysis command...\n";

try {
    $startOfWeek = Carbon::now()->startOfWeek();
    $endOfWeek = $startOfWeek->copy()->endOfWeek();
    
    // Get all users with daily analyses in the current week
    $userIds = \DB::table('daily_journal_analyses')
        ->whereBetween('analysis_date', [
            $startOfWeek->format('Y-m-d'),
            $endOfWeek->format('Y-m-d')
        ])
        ->distinct()
        ->pluck('user_id');
        
    echo "Users with daily analyses this week: " . $userIds->count() . "\n";
    
    if ($userIds->isNotEmpty()) {
        echo "User IDs: " . $userIds->implode(', ') . "\n";
    } else {
        echo "No users with daily analyses found for the current week.\n";
        
        // Check if we have any daily analyses at all
        $anyDailies = DailyJournalAnalysis::count();
        echo "Total daily analyses in database: {$anyDailies}\n";
        
        if ($anyDailies > 0) {
            $firstDaily = DailyJournalAnalysis::orderBy('analysis_date', 'asc')->first();
            $lastDaily = DailyJournalAnalysis::orderBy('analysis_date', 'desc')->first();
            
            echo "Date range of daily analyses: " . $firstDaily->analysis_date . " to " . $lastDaily->analysis_date . "\n";
            
            $currentWeekStart = $startOfWeek->format('Y-m-d');
            $currentWeekEnd = $endOfWeek->format('Y-m-d');
            
            echo "Current week: {$currentWeekStart} to {$currentWeekEnd}\n";
            
            // Check if any daily analyses fall within the current week
            $inCurrentWeek = DailyJournalAnalysis::whereBetween('analysis_date', [$currentWeekStart, $currentWeekEnd])->count();
            echo "Daily analyses in current week: {$inCurrentWeek}\n";
        }
    }
    
} catch (\Exception $e) {
    echo "Error checking weekly command: " . $e->getMessage() . "\n";
}
