<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreJournalRequest;
use App\Http\Requests\UpdateJournalRequest;
use App\Models\JournalNote;
use App\Services\DailyJournalAnalysisService;
use Carbon\Carbon;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JournalNoteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = auth()->user();
        if (! $user) {
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

    public function store(StoreJournalRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $validated['user_id'] = auth()->id();

        $note = JournalNote::create($validated);

        return response()->json([
            'data' => $this->transformNote($note),
        ], 201);
    }

    public function show(JournalNote $note): JsonResponse
    {
        $this->authorize('view', $note);

        return response()->json([
            'data' => $this->transformNote($note),
        ]);
    }

    public function update(UpdateJournalRequest $request, JournalNote $note, DailyJournalAnalysisService $dailyService): JsonResponse
    {
        $this->authorize('update', $note);

        $validated = $request->validated();

        if (empty($validated)) {
            return response()->json([
                'message' => 'Tidak ada perubahan yang diberikan.',
            ], 422);
        }

        unset($validated['user_id']);

        $tz = new \DateTimeZone('Asia/Jakarta');
        $todayStart = Carbon::now($tz)->startOfDay();

        // Determine reference date for editing restriction (3 days rule)
        $ref = $this->getDateAsCarbon($note->note_date, $tz)
            ?? $this->getDateAsCarbon($note->created_at, $tz)
            ?? $this->getDateAsCarbon($note->updated_at, $tz)
            ?? $todayStart;

        $diff = $ref->diffInDays($todayStart, false);
        if ($diff < 0) {
            return response()->json(['message' => 'Tidak dapat mengedit catatan pada tanggal masa depan.'], 403);
        }
        if ($diff > 3) {
            return response()->json(['message' => 'Hanya dapat mengedit catatan hingga 3 hari ke belakang.'], 403);
        }

        $note->update($validated);

        try {
            // Recompute analysis for the target day
            $day = $this->getDateAsCarbon($note->note_date, $tz)
                ?? $this->getDateAsCarbon($note->created_at, $tz)
                ?? Carbon::now($tz)->startOfDay();

            // Convert to Immutable for the service if needed, or just pass Carbon
            // The service likely expects Carbon or CarbonImmutable.
            // Let's assume CarbonImmutable to be safe as per original code.
            $dayImmutable = CarbonImmutable::instance($day);

            $user = auth()->user();
            if ($user) {
                $dailyService->generateForUser($user, $dayImmutable, true);
            }
        } catch (\Throwable $e) {
            \Log::error('Failed to recompute daily analysis after note update', ['error' => $e->getMessage()]);
        }

        return response()->json([
            'data' => $this->transformNote($note->refresh()),
        ]);
    }

    public function destroy(JournalNote $note): JsonResponse
    {
        $this->authorize('delete', $note);

        $note->delete();

        return response()->json(null, 204);
    }

    public function search(Request $request): JsonResponse
    {
        $user = auth()->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $query = $request->input('q', '');
        $dateFrom = $request->input('dateFrom');
        $dateTo = $request->input('dateTo');
        $limit = (int) $request->input('limit', 50);

        // Validate limit to prevent abuse
        if ($limit < 1 || $limit > 500) {
            $limit = 50;
        }

        $notesQuery = JournalNote::query()
            ->where('user_id', $user->id);

        // Search in title and body if query is provided
        if (!empty($query)) {
            $notesQuery->where(function ($q) use ($query) {
                $q->where('title', 'like', '%' . $query . '%')
                    ->orWhere('body', 'like', '%' . $query . '%');
            });
        }

        // Filter by date range if provided
        if (!empty($dateFrom)) {
            try {
                $from = Carbon::parse($dateFrom)->startOfDay();
                $notesQuery->where('note_date', '>=', $from);
            } catch (\Throwable $e) {
                // Invalid date format, ignore
            }
        }

        if (!empty($dateTo)) {
            try {
                $to = Carbon::parse($dateTo)->endOfDay();
                $notesQuery->where('note_date', '<=', $to);
            } catch (\Throwable $e) {
                // Invalid date format, ignore
            }
        }

        $notes = $notesQuery
            ->orderByDesc('note_date')
            ->orderByDesc('updated_at')
            ->limit($limit)
            ->get(['id', 'user_id', 'title', 'body', 'note_date', 'created_at', 'updated_at']);

        return response()->json([
            'data' => $notes->map(fn (JournalNote $note) => $this->transformNote($note)),
            'count' => $notes->count(),
            'query' => $query,
        ]);
    }

    private function transformNote(JournalNote $note): array
    {
        return [
            'id' => $note->id,
            'userId' => $note->user_id ?? null,
            'title' => $note->title ?? null,
            'body' => $note->body ?? null,
            'noteDate' => $this->formatIsoDate($note->note_date),
            'createdAt' => $this->formatIsoDate($note->created_at),
            'updatedAt' => $this->formatIsoDate($note->updated_at),
        ];
    }

    /**
     * Helper to parse a date value to a Carbon instance at start of day.
     */
    private function getDateAsCarbon($value, \DateTimeZone $tz): ?Carbon
    {
        if (empty($value)) {
            return null;
        }
        try {
            if ($value instanceof \DateTimeInterface) {
                return Carbon::instance($value)->setTimezone($tz)->startOfDay();
            }

            return Carbon::parse($value, $tz)->startOfDay();
        } catch (\Throwable $e) {
            return null;
        }
    }

    /**
     * Helper to format a date value to ISO 8601 string.
     */
    private function formatIsoDate($value): ?string
    {
        if (empty($value)) {
            return null;
        }
        try {
            $tz = new \DateTimeZone('Asia/Jakarta');
            if ($value instanceof \DateTimeInterface) {
                return Carbon::instance($value)->setTimezone($tz)->toAtomString();
            }

            return Carbon::parse($value)->setTimezone($tz)->toAtomString();
        } catch (\Throwable $e) {
            return null;
        }
    }
}
