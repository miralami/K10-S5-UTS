<?php

namespace App\Http\Controllers;

use App\Models\JournalNote;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Carbon\Carbon;

class JournalNoteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = auth()->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $notesQuery = JournalNote::query()
            ->where('user_id', $user->id);

        // order by updated_at so frontend that relies on `updatedAt` sees the latest items first
        $notes = $notesQuery
            ->orderByDesc('updated_at')
            ->get(['id', 'user_id', 'title', 'body', 'note_date', 'created_at', 'updated_at']);

        return response()->json([
            'data' => $notes->map(fn (JournalNote $note) => $this->transformNote($note)),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = auth()->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $validated = $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
            'body' => ['required', 'string'],
        ]);

        $validated['user_id'] = $user->id;

        $note = JournalNote::create($validated);

        return response()->json([
            'data' => $this->transformNote($note),
        ], 201);
    }

    public function show(JournalNote $note): JsonResponse
    {
        return response()->json([
            'data' => $this->transformNote($note),
        ]);
    }

    public function update(Request $request, JournalNote $note): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => ['sometimes', 'nullable', 'integer', 'exists:users,id'],
            'title' => ['sometimes', 'nullable', 'string', 'max:255'],
            'body' => ['sometimes', 'string'],
        ]);

        if (empty($validated)) {
            return response()->json([
                'message' => 'Tidak ada perubahan yang diberikan.',
            ], 422);
        }

        $note->update($validated);

        return response()->json([
            'data' => $this->transformNote($note->refresh()),
        ]);
    }

    public function destroy(JournalNote $note): JsonResponse
    {
        $note->delete();

        return response()->json(null, 204);
    }

    private function transformNote(JournalNote $note): array
    {
        // Build the response defensively to avoid undefined property warnings
        $data = [
            'id' => $note->id,
            'userId' => $note->user_id ?? null,
            'title' => $note->title ?? null,
            'body' => $note->body ?? null,
        ];

        // note_date may be a date-only string in DB; normalize to ISO if present
        if (!empty($note->note_date)) {
            try {
                $data['noteDate'] = Carbon::parse($note->note_date)->setTimezone('Asia/Jakarta')->toAtomString();
            } catch (\Throwable $e) {
                // ignore parse errors and omit the field
            }
        }

        if (!empty($note->created_at)) {
            // Eloquent commonly provides Carbon instances for created_at/updated_at,
            // but guard to avoid warnings if they are strings.
            if ($note->created_at instanceof \DateTimeInterface) {
                $data['createdAt'] = $note->created_at->setTimezone(new \DateTimeZone('Asia/Jakarta'))->format(DATE_ATOM);
            } else {
                try {
                    $data['createdAt'] = Carbon::parse($note->created_at)->setTimezone('Asia/Jakarta')->toAtomString();
                } catch (\Throwable $e) {
                    // omit on parse error
                }
            }
        }

        if (!empty($note->updated_at)) {
            if ($note->updated_at instanceof \DateTimeInterface) {
                $data['updatedAt'] = $note->updated_at->setTimezone(new \DateTimeZone('Asia/Jakarta'))->format(DATE_ATOM);
            } else {
                try {
                    $data['updatedAt'] = Carbon::parse($note->updated_at)->setTimezone('Asia/Jakarta')->toAtomString();
                } catch (\Throwable $e) {
                    // omit on parse error
                }
            }
        }

        return $data;
    }
}
