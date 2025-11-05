<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JournalNote extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'title',
        'body',
    ];

    /**
     * @return BelongsTo<User, JournalNote>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope query to notes written within the same ISO week as the given date.
     */
    public function scopeForWeek(Builder $query, CarbonInterface $weekEnding): Builder
    {
        $weekStart = CarbonImmutable::parse($weekEnding)->startOfWeek(CarbonInterface::MONDAY);
        $weekEnd = CarbonImmutable::parse($weekEnding)->endOfWeek(CarbonInterface::SUNDAY);

        return $query
            ->whereBetween('created_at', [$weekStart->startOfDay(), $weekEnd->endOfDay()])
            ->orderBy('created_at');
    }
}
