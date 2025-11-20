<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('journal:generate-daily-analysis')
    ->dailyAt('01:55')
    ->timezone(config('app.timezone', 'UTC'));

Schedule::command('journal:generate-weekly-analysis')
    ->weeklyOn(1, '02:10')
    ->timezone(config('app.timezone', 'UTC'));
