<?php

namespace Ai;

/**
 * Request for movie recommendations based on mood
 */
class MovieRecommendationRequest
{
    protected int $user_id = 0;
    protected string $dominant_mood = '';
    protected int $mood_score = 0;
    protected string $summary = '';
    protected array $highlights = [];
    protected string $affirmation = '';

    public function getUserId(): int
    {
        return $this->user_id;
    }

    public function setUserId(int $value): self
    {
        $this->user_id = $value;
        return $this;
    }

    public function getDominantMood(): string
    {
        return $this->dominant_mood;
    }

    public function setDominantMood(string $value): self
    {
        $this->dominant_mood = $value;
        return $this;
    }

    public function getMoodScore(): int
    {
        return $this->mood_score;
    }

    public function setMoodScore(int $value): self
    {
        $this->mood_score = $value;
        return $this;
    }

    public function getSummary(): string
    {
        return $this->summary;
    }

    public function setSummary(string $value): self
    {
        $this->summary = $value;
        return $this;
    }

    public function getHighlights(): array
    {
        return $this->highlights;
    }

    public function setHighlights(array $value): self
    {
        $this->highlights = $value;
        return $this;
    }

    public function getAffirmation(): string
    {
        return $this->affirmation;
    }

    public function setAffirmation(string $value): self
    {
        $this->affirmation = $value;
        return $this;
    }
}
