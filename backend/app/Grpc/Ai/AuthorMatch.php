<?php

namespace Ai;

/**
 * Author match info from writing style analysis
 */
class AuthorMatch
{
    protected string $name = '';
    protected string $nationality = '';
    protected float $score = 0.0;
    protected string $description = '';
    protected string $fun_fact = '';

    public function getName(): string
    {
        return $this->name;
    }

    public function setName(string $value): self
    {
        $this->name = $value;
        return $this;
    }

    public function getNationality(): string
    {
        return $this->nationality;
    }

    public function setNationality(string $value): self
    {
        $this->nationality = $value;
        return $this;
    }

    public function getScore(): float
    {
        return $this->score;
    }

    public function setScore(float $value): self
    {
        $this->score = $value;
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

    public function getFunFact(): string
    {
        return $this->fun_fact;
    }

    public function setFunFact(string $value): self
    {
        $this->fun_fact = $value;
        return $this;
    }

    public function toArray(): array
    {
        return [
            'name' => $this->name,
            'nationality' => $this->nationality,
            'score' => $this->score,
            'description' => $this->description,
            'funFact' => $this->fun_fact,
        ];
    }

    public static function fromProtobuf(mixed $data): self
    {
        $instance = new self();

        if (is_object($data)) {
            if (method_exists($data, 'getName')) {
                $instance->setName($data->getName());
            }
            if (method_exists($data, 'getNationality')) {
                $instance->setNationality($data->getNationality());
            }
            if (method_exists($data, 'getScore')) {
                $instance->setScore($data->getScore());
            }
            if (method_exists($data, 'getDescription')) {
                $instance->setDescription($data->getDescription());
            }
            if (method_exists($data, 'getFunFact')) {
                $instance->setFunFact($data->getFunFact());
            }
        }

        return $instance;
    }
}
