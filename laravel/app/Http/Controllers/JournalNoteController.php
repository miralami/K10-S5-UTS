<?php

namespace App\Http\Controllers;

use App\Models\JournalNote;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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

        $notes = $notesQuery
            ->orderByDesc('created_at')
            ->get(['id', 'user_id', 'title', 'body', 'created_at', 'updated_at']);

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
        return [
            'id' => $note->id,
            'userId' => $note->user_id,
            'title' => $note->title,
            'body' => $note->body,
            'createdAt' => $note->created_at?->toAtomString(),
            'updatedAt' => $note->updated_at?->toAtomString(),
        ];
    }
}
