<?php

namespace Ai;

use Google\Protobuf\Internal\RepeatedField;
use Google\Protobuf\Internal\GPBType;

/**
 * Writing style analysis result
 */
class WritingStyleResult
{
    protected int $total_words = 0;
    protected int $total_sentences = 0;
    protected float $avg_sentence_length = 0.0;
    protected float $vocabulary_richness = 0.0;
    protected float $punctuation_density = 0.0;
    protected float $avg_word_length = 0.0;
    protected string $detected_language = '';
    protected array $top_words = [];
    protected ?AuthorMatch $top_match = null;
    protected array $other_matches = [];

    public function getTotalWords(): int
    {
        return $this->total_words;
    }

    public function setTotalWords(int $value): self
    {
        $this->total_words = $value;
        return $this;
    }

    public function getTotalSentences(): int
    {
        return $this->total_sentences;
    }

    public function setTotalSentences(int $value): self
    {
        $this->total_sentences = $value;
        return $this;
    }

    public function getAvgSentenceLength(): float
    {
        return $this->avg_sentence_length;
    }

    public function setAvgSentenceLength(float $value): self
    {
        $this->avg_sentence_length = $value;
        return $this;
    }

    public function getVocabularyRichness(): float
    {
        return $this->vocabulary_richness;
    }

    public function setVocabularyRichness(float $value): self
    {
        $this->vocabulary_richness = $value;
        return $this;
    }

    public function getPunctuationDensity(): float
    {
        return $this->punctuation_density;
    }

    public function setPunctuationDensity(float $value): self
    {
        $this->punctuation_density = $value;
        return $this;
    }

    public function getAvgWordLength(): float
    {
        return $this->avg_word_length;
    }

    public function setAvgWordLength(float $value): self
    {
        $this->avg_word_length = $value;
        return $this;
    }

    public function getDetectedLanguage(): string
    {
        return $this->detected_language;
    }

    public function setDetectedLanguage(string $value): self
    {
        $this->detected_language = $value;
        return $this;
    }

    public function getTopWords(): array|RepeatedField
    {
        return $this->top_words;
    }

    public function setTopWords(array|RepeatedField $value): self
    {
        $this->top_words = $value instanceof RepeatedField ? iterator_to_array($value) : $value;
        return $this;
    }

    public function getTopMatch(): ?AuthorMatch
    {
        return $this->top_match;
    }

    public function setTopMatch(?AuthorMatch $value): self
    {
        $this->top_match = $value;
        return $this;
    }

    public function getOtherMatches(): array|RepeatedField
    {
        return $this->other_matches;
    }

    public function setOtherMatches(array|RepeatedField $value): self
    {
        $this->other_matches = $value instanceof RepeatedField ? iterator_to_array($value) : $value;
        return $this;
    }

    public function toArray(): array
    {
        $otherMatchesArray = [];
        foreach ($this->other_matches as $match) {
            $otherMatchesArray[] = $match instanceof AuthorMatch ? $match->toArray() : $match;
        }

        return [
            'totalWords' => $this->total_words,
            'totalSentences' => $this->total_sentences,
            'avgSentenceLength' => round($this->avg_sentence_length, 1),
            'vocabularyRichness' => round($this->vocabulary_richness * 100, 1),
            'punctuationDensity' => round($this->punctuation_density, 1),
            'avgWordLength' => round($this->avg_word_length, 1),
            'detectedLanguage' => $this->detected_language,
            'topWords' => $this->top_words instanceof RepeatedField
                ? iterator_to_array($this->top_words)
                : $this->top_words,
            'topMatch' => $this->top_match?->toArray(),
            'otherMatches' => $otherMatchesArray,
        ];
    }
}
