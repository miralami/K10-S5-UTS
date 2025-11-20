<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * JWT Identifier
     */
    public function getJWTIdentifier(): mixed
    {
        return $this->getKey();
    }

    /**
     * JWT Custom Claims
     */
    public function getJWTCustomClaims(): array
    {
        return [];
    }

    /**
     * Relationship with journal notes.
     */
    public function journalNotes(): HasMany
    {
        return $this->hasMany(JournalNote::class);
    }

    /**
     * Relationship with weekly journal analyses.
     */
    public function weeklyJournalAnalyses(): HasMany
    {
        return $this->hasMany(WeeklyJournalAnalysis::class);
    }

    /**
     * @return HasMany<DailyJournalAnalysis>
     */
    public function dailyJournalAnalyses(): HasMany
    {
        return $this->hasMany(DailyJournalAnalysis::class);
    }
}
