<?php

namespace Ai;

/**
 * Single movie item in recommendations
 */
class MovieItem
{
    protected string $title = '';

    protected int $year = 0;

    protected string $tagline = '';

    protected string $imdb_id = '';

    protected array $genres = [];

    protected string $reason = '';

    protected string $poster_url = '';

    public function getTitle(): string
    {
        return $this->title;
    }

    public function setTitle(string $value): self
    {
        $this->title = $value;

        return $this;
    }

    public function getYear(): int
    {
        return $this->year;
    }

    public function setYear(int $value): self
    {
        $this->year = $value;

        return $this;
    }

    public function getTagline(): string
    {
        return $this->tagline;
    }

    public function setTagline(string $value): self
    {
        $this->tagline = $value;

        return $this;
    }

    public function getImdbId(): string
    {
        return $this->imdb_id;
    }

    public function setImdbId(string $value): self
    {
        $this->imdb_id = $value;

        return $this;
    }

    public function getGenres(): array
    {
        return $this->genres;
    }

    public function setGenres(array $value): self
    {
        $this->genres = $value;

        return $this;
    }

    public function getReason(): string
    {
        return $this->reason;
    }

    public function setReason(string $value): self
    {
        $this->reason = $value;

        return $this;
    }

    public function getPosterUrl(): string
    {
        return $this->poster_url;
    }

    public function setPosterUrl(string $value): self
    {
        $this->poster_url = $value;

        return $this;
    }

    public function toArray(): array
    {
        return [
            'title' => $this->title,
            'year' => $this->year,
            'tagline' => $this->tagline,
            'imdbId' => $this->imdb_id,
            'genres' => $this->genres,
            'reason' => $this->reason,
            'posterUrl' => $this->poster_url,
        ];
    }
}
