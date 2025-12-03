<?php

namespace Ai;

use Google\Protobuf\Internal\GPBType;
use Google\Protobuf\Internal\Message;
use Google\Protobuf\Internal\RepeatedField;

/**
 * Request to analyze writing style
 */
class WritingStyleRequest extends Message
{
    /**
     * @var string
     */
    protected $user_id = '';

    /**
     * @var RepeatedField|string[]
     */
    private $texts;

    public function __construct($data = null)
    {
        $this->texts = new RepeatedField(GPBType::STRING);

        if ($data !== null) {
            if (isset($data['user_id'])) {
                $this->setUserId($data['user_id']);
            }
            if (isset($data['texts'])) {
                $this->setTexts($data['texts']);
            }
        }
    }

    public function getUserId(): string
    {
        return $this->user_id;
    }

    public function setUserId(string $value): self
    {
        $this->user_id = $value;

        return $this;
    }

    public function getTexts(): RepeatedField
    {
        return $this->texts;
    }

    public function setTexts(array|RepeatedField $values): self
    {
        if ($values instanceof RepeatedField) {
            $this->texts = $values;
        } else {
            $this->texts = new RepeatedField(GPBType::STRING);
            foreach ($values as $value) {
                $this->texts[] = $value;
            }
        }

        return $this;
    }

    public function serializeToString(): string
    {
        // Simple protobuf encoding for the message
        $data = '';

        // Field 1: user_id (string)
        if ($this->user_id !== '') {
            $data .= chr((1 << 3) | 2); // field 1, wire type 2 (length-delimited)
            $data .= $this->encodeVarint(strlen($this->user_id));
            $data .= $this->user_id;
        }

        // Field 2: texts (repeated string)
        foreach ($this->texts as $text) {
            $data .= chr((2 << 3) | 2); // field 2, wire type 2
            $data .= $this->encodeVarint(strlen($text));
            $data .= $text;
        }

        return $data;
    }

    private function encodeVarint(int $value): string
    {
        $result = '';
        while ($value > 127) {
            $result .= chr(($value & 0x7F) | 0x80);
            $value >>= 7;
        }
        $result .= chr($value);

        return $result;
    }
}
