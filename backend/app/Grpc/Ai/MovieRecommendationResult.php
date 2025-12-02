<?php

namespace Ai;

use Google\Protobuf\Internal\RepeatedField;

/**
 * Movie recommendation result
 */
class MovieRecommendationResult
{
    protected string $category = '';
    protected string $mood_label = '';
    protected string $headline = '';
    protected string $description = '';
    protected array $items = [];

    public function getCategory(): string
    {
        return $this->category;
    }

    public function setCategory(string $value): self
    {
        $this->category = $value;
        return $this;
    }

    public function getMoodLabel(): string
    {
        return $this->mood_label;
    }

    public function setMoodLabel(string $value): self
    {
        $this->mood_label = $value;
        return $this;
    }

    public function getHeadline(): string
    {
        return $this->headline;
    }

    public function setHeadline(string $value): self
    {
        $this->headline = $value;
        return $this;
    }

    public function getDescription(): string
    {
        return $this->description;
    }

    public function setDescription(string $value): self
    {
        $this->description = $value;
        return $this;
    }

    public function getItems(): array|RepeatedField
    {
        return $this->items;
    }

    public function setItems(array|RepeatedField $value): self
    {
        $this->items = $value instanceof RepeatedField ? iterator_to_array($value) : $value;
        return $this;
    }

    public function toArray(): array
    {
        $itemsArray = [];
        foreach ($this->items as $item) {
            $itemsArray[] = $item instanceof MovieItem ? $item->toArray() : $item;
        }

        return [
            'category' => $this->category,
            'moodLabel' => $this->mood_label,
            'headline' => $this->headline,
            'description' => $this->description,
            'items' => $itemsArray,
        ];
    }
}
