<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $user_id
 * @property \Illuminate\Support\Carbon|null $week_start
 * @property \Illuminate\Support\Carbon|null $week_end
 * @property array|null $analysis
 * @property array|null $recommendations
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\DailyJournalAnalysis> $dailyAnalyses
 * @property-read int|null $daily_analyses_count
 * @property-read \App\Models\User $user
 *
 * @method static \Illuminate\Database\Eloquent\Builder<static>|WeeklyJournalAnalysis newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|WeeklyJournalAnalysis newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|WeeklyJournalAnalysis query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|WeeklyJournalAnalysis whereAnalysis($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|WeeklyJournalAnalysis whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|WeeklyJournalAnalysis whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|WeeklyJournalAnalysis whereRecommendations($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|WeeklyJournalAnalysis whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|WeeklyJournalAnalysis whereUserId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|WeeklyJournalAnalysis whereWeekEnd($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|WeeklyJournalAnalysis whereWeekStart($value)
 *
 * @mixin \Eloquent
 */
class WeeklyJournalAnalysis extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'week_start',
        'week_end',
        'analysis',
        'recommendations',
        'music_recommendations',
    ];

    protected $casts = [
        'week_start' => 'date',
        'week_end' => 'date',
        'analysis' => 'array',
        'recommendations' => 'array',
        'music_recommendations' => 'array',
    ];

    /**
     * @return BelongsTo<User, WeeklyJournalAnalysis>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return HasMany<DailyJournalAnalysis>
     */
    public function dailyAnalyses(): HasMany
    {
        return $this->hasMany(DailyJournalAnalysis::class, 'user_id', 'user_id')
            ->whereBetween('analysis_date', [
                $this->week_start,
                $this->week_end,
            ])
            ->orderBy('analysis_date');
    }
}
