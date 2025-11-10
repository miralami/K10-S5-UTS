<?php

namespace App\Http\Controllers;

use App\Models\DailyJournalAnalysis;
use App\Models\JournalNote;
use App\Models\WeeklyJournalAnalysis;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JournalAnalysisController extends Controller
{
    public function weeklySummary(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'week_ending' => ['nullable', 'date'],
                'start_date' => ['nullable', 'date'],
                'end_date' => ['nullable', 'date'],
                'user_id' => ['nullable', 'integer', 'exists:users,id'],
            ]);

            if (isset($validated['start_date']) && isset($validated['end_date'])) {
                $weekStart = CarbonImmutable::parse($validated['start_date']);
                $weekEnd = CarbonImmutable::parse($validated['end_date']);
            } else {
                $weekEnding = isset($validated['week_ending']) && $validated['week_ending']
                    ? CarbonImmutable::parse($validated['week_ending'])
                    : CarbonImmutable::now();
                
                $weekStart = $weekEnding->startOfWeek(CarbonImmutable::MONDAY);
                $weekEnd = $weekEnding->endOfWeek(CarbonImmutable::SUNDAY);
            }

            // Ensure we have valid dates
            if (!$weekStart || !$weekEnd) {
                throw new \InvalidArgumentException('Tanggal tidak valid');
            }

            $notes = JournalNote::query()
                ->when(isset($validated['user_id']), fn ($query) => $query->where('user_id', $validated['user_id']))
                ->forWeek($weekStart, $weekEnd)
                ->get(['id', 'user_id', 'title', 'body', 'note_date', 'created_at'])
                ->map(fn (JournalNote $note) => $this->formatNote($note)) ?? [];

            $analysisRecord = WeeklyJournalAnalysis::query()
                ->whereDate('week_start', $weekStart->toDateString())
                ->when(isset($validated['user_id']), fn ($query) => $query->where('user_id', $validated['user_id']))
                ->when(!isset($validated['user_id']), fn ($query) => $query->orderByDesc('created_at'))
                ->first();

            $dailySummaries = DailyJournalAnalysis::query()
                ->when(isset($validated['user_id']), fn ($query) => $query->where('user_id', $validated['user_id']))
                ->when(!isset($validated['user_id']), fn ($query) => $query->orderByDesc('analysis_date'))
                ->whereBetween('analysis_date', [$weekStart->toDateString(), $weekEnd->toDateString()])
                ->get(['id', 'user_id', 'analysis_date', 'analysis'])
                ->map(fn (DailyJournalAnalysis $daily) => $this->formatDaily($daily)) ?? [];

            return response()->json([
                'week' => [
                    'start' => $weekStart->toDateString(),
                    'end' => $weekEnd->toDateString(),
                ],
                'filters' => [
                    'userId' => $validated['user_id'] ?? null,
                ],
                'notes' => $notes,
                'analysis' => $analysisRecord?->analysis,
                'dailySummaries' => $dailySummaries,
                'status' => $analysisRecord ? 'ready' : 'pending',
                'message' => $analysisRecord
                    ? null
                    : 'Ringkasan mingguan belum tersedia. Cron akan memperbarui setiap Senin 02:00.',
            ]);
        } catch (\Exception $e) {
            \Log::error('Error in weeklySummary: ' . $e->getMessage(), [
                'exception' => $e,
                'request' => $request->all()
            ]);
            
            return response()->json([
                'status' => 'error',
                'message' => 'Terjadi kesalahan saat memuat ringkasan mingguan. Silakan coba lagi nanti.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function dailySummary(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'date' => ['nullable', 'date'],
                'user_id' => ['nullable', 'integer', 'exists:users,id'],
            ]);

            $targetDate = isset($validated['date']) && $validated['date']
                ? CarbonImmutable::parse($validated['date'])->toDateString()
                : CarbonImmutable::now()->toDateString();

            if (!$targetDate) {
                throw new \InvalidArgumentException('Tanggal tidak valid');
            }

            $record = DailyJournalAnalysis::query()
                ->whereDate('analysis_date', $targetDate)
                ->when(isset($validated['user_id']), fn ($builder) => $builder->where('user_id', $validated['user_id']))
                ->when(!isset($validated['user_id']), fn ($builder) => $builder->orderByDesc('analysis_date'))
                ->first();

            return response()->json([
                'date' => $targetDate,
                'filters' => [
                    'userId' => $validated['user_id'] ?? null,
                ],
                'analysis' => $record?->analysis,
                'status' => $record ? 'ready' : 'pending',
                'message' => $record
                    ? null
                    : 'Ringkasan harian belum tersedia untuk tanggal tersebut.',
            ]);
        } catch (\Exception $e) {
            \Log::error('Error in dailySummary: ' . $e->getMessage(), [
                'exception' => $e,
                'request' => $request->all()
            ]);
            
            return response()->json([
                'status' => 'error',
                'message' => 'Terjadi kesalahan saat memuat ringkasan harian. Silakan coba lagi nanti.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    private function formatNote(JournalNote $note): array
    {
        return [
            'id' => $note->id,
            'user_id' => $note->user_id,
            'title' => $note->title ?? null,
            'body' => $note->body ?? null,
            'note_date' => $note->note_date ? $note->note_date->toDateString() : null,
            'created_at' => $note->created_at ? $note->created_at->toIso8601String() : null,
            'updated_at' => $note->updated_at ? $note->updated_at->toIso8601String() : null,
        ];
    }

    private function formatDaily(DailyJournalAnalysis $daily): array
    {
        return [
            'id' => $daily->id,
            'userId' => $daily->user_id,
            'date' => $daily->analysis_date?->toDateString(),
            'analysis' => $daily->analysis,
        ];
    }
}
