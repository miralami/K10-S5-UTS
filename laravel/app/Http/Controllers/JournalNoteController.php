<?php

namespace App\Http\Controllers;

use App\Models\JournalNote;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Carbon\CarbonImmutable;
use App\Services\DailyJournalAnalysisService;

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

    public function update(Request $request, JournalNote $note, DailyJournalAnalysisService $dailyService): JsonResponse
    {
        $user = auth()->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }
        if ((int) $note->user_id !== (int) $user->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

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

        unset($validated['user_id']);

        $tz = new \DateTimeZone('Asia/Jakarta');
        $todayStart = Carbon::now($tz)->startOfDay();

        $ref = null;
        if (!empty($note->note_date)) {
            try { $ref = Carbon::parse($note->note_date, $tz)->startOfDay(); } catch (\Throwable $e) {}
        }
        if (!$ref && !empty($note->created_at)) {
            try { $ref = ($note->created_at instanceof \DateTimeInterface)
                ? Carbon::instance($note->created_at)->setTimezone($tz)->startOfDay()
                : Carbon::parse($note->created_at, $tz)->startOfDay(); } catch (\Throwable $e) {}
        }
        if (!$ref && !empty($note->updated_at)) {
            try { $ref = ($note->updated_at instanceof \DateTimeInterface)
                ? Carbon::instance($note->updated_at)->setTimezone($tz)->startOfDay()
                : Carbon::parse($note->updated_at, $tz)->startOfDay(); } catch (\Throwable $e) {}
        }
        if (!$ref) {
            $ref = $todayStart;
        }

        $diff = $ref->diffInDays($todayStart, false);
        if ($diff < 0) {
            return response()->json(['message' => 'Tidak dapat mengedit catatan pada tanggal masa depan.'], 403);
        }
        if ($diff > 3) {
            return response()->json(['message' => 'Hanya dapat mengedit catatan hingga 3 hari ke belakang.'], 403);
        }

        $note->update($validated);

        try {
            $tz = new \DateTimeZone('Asia/Jakarta');
            $day = null;
            if (!empty($note->note_date)) {
                try { $day = CarbonImmutable::parse($note->note_date, $tz)->startOfDay(); } catch (\Throwable $e) {}
            }
            if (!$day && !empty($note->created_at)) {
                try { $day = ($note->created_at instanceof \DateTimeInterface)
                    ? CarbonImmutable::instance($note->created_at)->setTimezone($tz)->startOfDay()
                    : CarbonImmutable::parse($note->created_at, $tz)->startOfDay(); } catch (\Throwable $e) {}
            }
            if (!$day) {
                $day = CarbonImmutable::now($tz)->startOfDay();
            }

            $user = auth()->user();
            if ($user) {
                $dailyService->generateForUser($user, $day, true);
            }
        } catch (\Throwable $e) {
            \Log::error('Failed to recompute daily analysis after note update', [ 'error' => $e->getMessage() ]);
        }

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
