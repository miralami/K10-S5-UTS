<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WeeklyJournalAnalysis extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'week_start',
        'week_end',
        'analysis',
    ];

    protected $casts = [
        'week_start' => 'date',
        'week_end' => 'date',
        'analysis' => 'array',
    ];

    /**
     * @return BelongsTo<User, WeeklyJournalAnalysis>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
