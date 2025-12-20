<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $user_id
 * @property string|null $title
 * @property string|null $body
 * @property \Illuminate\Support\Carbon|null $note_date
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property string|null $vibe
 * @property-read \App\Models\User|null $user
 *
 * @method static Builder<static>|JournalNote forWeek(\Carbon\CarbonInterface $date, ?\Carbon\CarbonInterface $endDate = null)
 * @method static Builder<static>|JournalNote newModelQuery()
 * @method static Builder<static>|JournalNote newQuery()
 * @method static Builder<static>|JournalNote query()
 * @method static Builder<static>|JournalNote whereBody($value)
 * @method static Builder<static>|JournalNote whereCreatedAt($value)
 * @method static Builder<static>|JournalNote whereId($value)
 * @method static Builder<static>|JournalNote whereNoteDate($value)
 * @method static Builder<static>|JournalNote whereTitle($value)
 * @method static Builder<static>|JournalNote whereUpdatedAt($value)
 * @method static Builder<static>|JournalNote whereUserId($value)
 * @method static Builder<static>|JournalNote whereVibe($value)
 *
 * @mixin \Eloquent
 */
class JournalNote extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'title',
        'body',
        'note_date',
        'gratitude_1',
        'gratitude_2',
        'gratitude_3',
        'gratitude_category_1',
        'gratitude_category_2',
        'gratitude_category_3',
        'image_path',
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

    public function getGratitudesAttribute()
    {
        return array_filter([
            $this->gratitude_1,
            $this->gratitude_2,
            $this->gratitude_3,
        ]);
    }

    public function getGratitudeCategoriesAttribute()
    {
        return array_filter([
            $this->gratitude_category_1,
            $this->gratitude_category_2,
            $this->gratitude_category_3,
        ]);
    }

    public function getGratitudeCountAttribute()
    {
        return count($this->gratitudes);
    }

    public static function detectGratitudeCategory($text)
    {
        $text = strtolower($text);
        
        $categoryKeywords = [
            'Friends' => ['friend', 'friends', 'buddy', 'pal', 'companion', 'hangout', 'chat', 'conversation'],
            'Family' => ['family', 'mom', 'dad', 'mother', 'father', 'sister', 'brother', 'parent', 'child', 'kids'],
            'Health' => ['health', 'healthy', 'exercise', 'workout', 'gym', 'run', 'walk', 'sleep', 'energy', 'strong'],
            'Work' => ['work', 'job', 'career', 'project', 'meeting', 'colleague', 'team', 'success', 'achievement'],
            'Nature' => ['nature', 'weather', 'sunshine', 'rain', 'sky', 'tree', 'flower', 'outdoor', 'walk', 'park'],
            'Food' => ['food', 'meal', 'breakfast', 'lunch', 'dinner', 'coffee', 'tea', 'eat', 'delicious', 'cook'],
            'Love' => ['love', 'partner', 'spouse', 'boyfriend', 'girlfriend', 'husband', 'wife', 'relationship', 'date'],
            'Learning' => ['learn', 'read', 'book', 'study', 'knowledge', 'skill', 'course', 'education', 'discover'],
            'Peace' => ['peace', 'calm', 'quiet', 'meditation', 'relax', 'rest', 'tranquil', 'serene', 'mindful'],
            'Success' => ['success', 'win', 'accomplish', 'achieve', 'goal', 'milestone', 'progress', 'complete'],
        ];

        foreach ($categoryKeywords as $category => $keywords) {
            foreach ($keywords as $keyword) {
                if (strpos($text, $keyword) !== false) {
                    return $category;
                }
            }
        }

        return 'General';
    }
}
