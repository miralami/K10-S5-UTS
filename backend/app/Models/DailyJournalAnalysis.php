<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $user_id
 * @property \Illuminate\Support\Carbon|null $analysis_date
 * @property array|null $analysis
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\User $user
 *
 * @method static \Illuminate\Database\Eloquent\Builder<static>|DailyJournalAnalysis newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|DailyJournalAnalysis newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|DailyJournalAnalysis query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|DailyJournalAnalysis whereAnalysis($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|DailyJournalAnalysis whereAnalysisDate($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|DailyJournalAnalysis whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|DailyJournalAnalysis whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|DailyJournalAnalysis whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|DailyJournalAnalysis whereUserId($value)
 *
 * @mixin \Eloquent
 */
class DailyJournalAnalysis extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'analysis_date',
        'analysis',
    ];

    protected $casts = [
        'analysis_date' => 'date',
        'analysis' => 'array',
    ];

    /**
     * @return BelongsTo<User, DailyJournalAnalysis>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
