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
        'note_date',
    ];

    protected $casts = [
        'note_date' => 'date',
    ];

    protected static function booted()
    {
        static::creating(function ($note) {
            // Set note_date to today if not provided
            if (empty($note->note_date)) {
                $note->note_date = now()->toDateString();
            }

            // Check if a note already exists for this user and date
            $existingNote = static::where('user_id', $note->user_id)
                ->where('note_date', $note->note_date)
                ->first();

            if ($existingNote) {
                // Update the existing note instead of creating a new one
                $existingNote->update([
                    'title' => $note->title,
                    'body' => $note->body,
                ]);

                // Return false to prevent creating a new record
                return false;
            }

            return true;
        });
    }

    /**
     * @return BelongsTo<User, JournalNote>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope query to notes written within the specified date range.
     * If no end date is provided, assumes a week range from the start date.
     */
    public function scopeForWeek(Builder $query, CarbonInterface $date, ?CarbonInterface $endDate = null): Builder
    {
        $start = CarbonImmutable::parse($date);
        $end = $endDate ? CarbonImmutable::parse($endDate) : $start->copy()->endOfWeek(CarbonInterface::SUNDAY);

        return $query
            ->whereDate('note_date', '>=', $start->startOfDay())
            ->whereDate('note_date', '<=', $end->endOfDay())
            ->orderBy('note_date', 'desc')
            ->orderBy('created_at', 'desc');
    }
}
