<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateJournalRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $note = $this->route('note');

        return auth()->check() && $note && (int) $note->user_id === (int) auth()->id();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'user_id' => ['sometimes', 'nullable', 'integer', 'exists:users,id'],
            'title' => ['sometimes', 'nullable', 'string', 'max:255'],
            'body' => ['sometimes', 'nullable', 'string'],
            'note_date' => ['sometimes', 'nullable', 'date'],
            'gratitude_1' => ['sometimes', 'nullable', 'string', 'max:500'],
            'gratitude_2' => ['sometimes', 'nullable', 'string', 'max:500'],
            'gratitude_3' => ['sometimes', 'nullable', 'string', 'max:500'],
        ];
    }
}
