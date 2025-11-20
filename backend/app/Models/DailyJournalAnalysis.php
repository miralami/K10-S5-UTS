<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
