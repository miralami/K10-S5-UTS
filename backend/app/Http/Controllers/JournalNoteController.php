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

        if (!empty($validated['gratitude_1'])) {
            $validated['gratitude_category_1'] = JournalNote::detectGratitudeCategory($validated['gratitude_1']);
        }
        if (!empty($validated['gratitude_2'])) {
            $validated['gratitude_category_2'] = JournalNote::detectGratitudeCategory($validated['gratitude_2']);
        }
        if (!empty($validated['gratitude_3'])) {
            $validated['gratitude_category_3'] = JournalNote::detectGratitudeCategory($validated['gratitude_3']);
        }

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

        if (isset($validated['gratitude_1'])) {
            $validated['gratitude_category_1'] = !empty($validated['gratitude_1']) 
                ? JournalNote::detectGratitudeCategory($validated['gratitude_1']) 
                : null;
        }
        if (isset($validated['gratitude_2'])) {
            $validated['gratitude_category_2'] = !empty($validated['gratitude_2']) 
                ? JournalNote::detectGratitudeCategory($validated['gratitude_2']) 
                : null;
        }
        if (isset($validated['gratitude_3'])) {
            $validated['gratitude_category_3'] = !empty($validated['gratitude_3']) 
                ? JournalNote::detectGratitudeCategory($validated['gratitude_3']) 
                : null;
        }

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

    public function gratitudeStats(): JsonResponse
    {
        $user = auth()->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $today = now();
        $todayNote = JournalNote::where('user_id', $user->id)
            ->whereDate('note_date', $today)
            ->first();

        $weekCount = JournalNote::where('user_id', $user->id)
            ->whereBetween('note_date', [$today->copy()->subDays(6), $today])
            ->whereNotNull('gratitude_1')
            ->count();

        $totalGratitudes = JournalNote::where('user_id', $user->id)
            ->whereNotNull('gratitude_1')
            ->count();

        $currentStreak = $this->calculateGratitudeStreak($user->id);

        return response()->json([
            'today_gratitude' => $todayNote && $todayNote->gratitude_1 ? $todayNote : null,
            'week_count' => $weekCount,
            'total_gratitudes' => $totalGratitudes,
            'current_streak' => $currentStreak,
        ]);
    }

    public function gratitudeDistribution(): JsonResponse
    {
        $user = auth()->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $notes = JournalNote::where('user_id', $user->id)
            ->whereNotNull('gratitude_1')
            ->get();

        $allCategories = [];
        foreach ($notes as $note) {
            foreach ($note->gratitude_categories as $category) {
                $allCategories[] = $category;
            }
        }

        $categoryCounts = array_count_values($allCategories);
        arsort($categoryCounts);

        $categoryEmojis = [
            'Friends' => '👥',
            'Family' => '👨‍👩‍👧‍👦',
            'Health' => '💪',
            'Work' => '💼',
            'Nature' => '🌿',
            'Food' => '🍽️',
            'Love' => '❤️',
            'Learning' => '📚',
            'Peace' => '🧘',
            'Success' => '🏆',
            'General' => '✨',
        ];

        $distribution = [];
        $totalCategories = count($allCategories);
        foreach ($categoryCounts as $category => $count) {
            $distribution[] = [
                'category' => $category,
                'count' => $count,
                'emoji' => $categoryEmojis[$category] ?? '✨',
                'percentage' => $totalCategories > 0 ? round(($count / $totalCategories) * 100, 1) : 0,
            ];
        }

        return response()->json($distribution);
    }

    public function gratitudeInsights(): JsonResponse
    {
        $user = auth()->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $notes = JournalNote::where('user_id', $user->id)
            ->whereNotNull('gratitude_1')
            ->get();

        if ($notes->isEmpty()) {
            return response()->json([
                'message' => 'Start logging gratitudes to see insights!',
            ]);
        }

        $allCategories = [];
        foreach ($notes as $note) {
            foreach ($note->gratitude_categories as $category) {
                $allCategories[] = $category;
            }
        }

        $categoryCounts = array_count_values($allCategories);
        arsort($categoryCounts);
        
        $topCategory = array_key_first($categoryCounts);
        $topCategoryCount = $categoryCounts[$topCategory] ?? 0;

        $dayOfWeekCounts = [];
        foreach ($notes as $note) {
            if ($note->note_date) {
                $dayName = $note->note_date->format('l');
                $dayOfWeekCounts[$dayName] = ($dayOfWeekCounts[$dayName] ?? 0) + 1;
            }
        }
        arsort($dayOfWeekCounts);
        $mostActiveDay = array_key_first($dayOfWeekCounts) ?? 'N/A';

        $totalItems = $notes->sum('gratitude_count');

        return response()->json([
            'total_gratitudes' => $notes->count(),
            'total_items' => $totalItems,
            'current_streak' => $this->calculateGratitudeStreak($user->id),
            'top_category' => [
                'name' => $topCategory,
                'count' => $topCategoryCount,
                'percentage' => count($allCategories) > 0 ? round(($topCategoryCount / count($allCategories)) * 100, 1) : 0,
            ],
            'most_active_day' => $mostActiveDay,
            'insights' => [
                "You're most grateful for {$topCategory} ({$topCategoryCount} times)",
                "You log gratitudes most often on {$mostActiveDay}s",
                "You've recorded " . $notes->count() . " days of gratitude",
            ],
        ]);
    }

    public function randomGratitude(): JsonResponse
    {
        $user = auth()->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $note = JournalNote::where('user_id', $user->id)
            ->whereNotNull('gratitude_1')
            ->inRandomOrder()
            ->first();

        if (!$note) {
            return response()->json([
                'message' => 'No gratitudes yet. Start writing!',
            ], 404);
        }

        return response()->json([
            'gratitude' => $this->transformNote($note),
            'date' => $note->note_date ? $note->note_date->format('l, F j, Y') : 'N/A',
        ]);
    }

    public function gratitudePrompts(): JsonResponse
    {
        $prompts = [
            'Morning' => [
                'What made you smile this morning?',
                'Name someone who brightened your day',
                'What are you looking forward to today?',
            ],
            'Evening' => [
                'What was the best part of your day?',
                'Who or what made a positive difference today?',
                'What challenge did you overcome today?',
            ],
            'Reflection' => [
                'What lesson are you grateful to have learned?',
                'Which personal quality helped you today?',
                'What simple pleasure did you enjoy?',
            ],
            'Relationships' => [
                'Who supported you recently?',
                'What act of kindness did you witness?',
                'Which relationship are you thankful for?',
            ],
            'Self' => [
                'What about your body are you thankful for?',
                'What skill or talent are you grateful to have?',
                'What personal achievement makes you proud?',
            ],
        ];

        return response()->json($prompts);
    }

    private function calculateGratitudeStreak($userId): int
    {
        $notes = JournalNote::where('user_id', $userId)
            ->whereNotNull('gratitude_1')
            ->orderBy('note_date', 'desc')
            ->get();

        if ($notes->isEmpty()) {
            return 0;
        }

        $streak = 0;
        $currentDate = now()->startOfDay();

        foreach ($notes as $note) {
            if ($note->note_date && $note->note_date->isSameDay($currentDate)) {
                $streak++;
                $currentDate->subDay();
            } else {
                break;
            }
        }

        return $streak;
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
            'gratitude1' => $note->gratitude_1 ?? null,
            'gratitude2' => $note->gratitude_2 ?? null,
            'gratitude3' => $note->gratitude_3 ?? null,
            'gratitudeCategory1' => $note->gratitude_category_1 ?? null,
            'gratitudeCategory2' => $note->gratitude_category_2 ?? null,
            'gratitudeCategory3' => $note->gratitude_category_3 ?? null,
            'gratitudeCount' => $note->gratitude_count ?? 0,
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
