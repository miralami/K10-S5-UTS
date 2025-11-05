<?php

namespace App\Http\Controllers;

use App\Models\JournalNote;
use App\Services\GeminiMoodAnalysisService;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

class JournalAnalysisController extends Controller
{
    public function __construct(private readonly GeminiMoodAnalysisService $analysisService)
    {
    }

    public function weeklySummary(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'week_ending' => ['nullable', 'date'],
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
        ]);

        $weekEnding = isset($validated['week_ending'])
            ? CarbonImmutable::parse($validated['week_ending'])
            : CarbonImmutable::now();

        $notesQuery = JournalNote::query();

        if (isset($validated['user_id'])) {
            $notesQuery->where('user_id', $validated['user_id']);
        }

        $notes = $notesQuery
            ->forWeek($weekEnding)
            ->get(['id', 'user_id', 'title', 'body', 'created_at']);

        try {
            $analysis = $this->analysisService->analyzeWeeklyNotes($notes, $weekEnding);
        } catch (RuntimeException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 502);
        }

        $week = [
            'start' => $weekEnding->startOfWeek(CarbonImmutable::MONDAY)->toDateString(),
            'end' => $weekEnding->endOfWeek(CarbonImmutable::SUNDAY)->toDateString(),
        ];

        return response()->json([
            'week' => $week,
            'filters' => [
                'userId' => $validated['user_id'] ?? null,
            ],
            'notes' => $notes->map(fn ($note) => [
                'id' => $note->id,
                'userId' => $note->user_id,
                'title' => $note->title,
                'body' => $note->body,
                'createdAt' => $note->created_at?->toAtomString(),
            ]),
            'analysis' => $analysis,
        ]);
    }
}
