<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\DailyJournalAnalysisService;
use Carbon\CarbonImmutable;
use Illuminate\Console\Command;

class GenerateDailyAnalysis extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'journal:generate-daily-analysis {date? : Tanggal analisis (YYYY-MM-DD)} {--user= : ID pengguna spesifik} {--force : Regenerasi analisis meski sudah ada}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate daily journal analyses for users';

    /**
     * Execute the console command.
     */
    public function handle(DailyJournalAnalysisService $analysisService): int
    {
        $dateInput = $this->argument('date');
        $userId = $this->option('user');
        $force = (bool) $this->option('force');

        try {
            $targetDate = $dateInput
                ? CarbonImmutable::parse($dateInput)
                : CarbonImmutable::now();
        } catch (\Throwable $exception) {
            $this->error('Format tanggal tidak valid. Gunakan YYYY-MM-DD.');
            return self::INVALID;
        }

        $query = User::query()
            ->when($userId, fn ($builder) => $builder->whereKey($userId))
            ->when(! $userId, function ($builder) use ($targetDate) {
                $builder->whereHas('journalNotes', function ($notes) use ($targetDate) {
                    $notes->whereBetween('created_at', [
                        $targetDate->startOfDay(),
                        $targetDate->endOfDay(),
                    ]);
                });
            });

        $users = $query->get();

        if ($users->isEmpty()) {
            $this->info('Tidak ada pengguna yang perlu diproses.');
            return self::SUCCESS;
        }

        $this->info(sprintf('Memproses analisis harian untuk %d pengguna pada %s', $users->count(), $targetDate->toDateString()));
        $bar = $this->output->createProgressBar($users->count());
        $bar->start();

        foreach ($users as $user) {
            $analysisService->generateForUser($user, $targetDate, $force);
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info('Analisis harian selesai.');

        return self::SUCCESS;
    }
}
