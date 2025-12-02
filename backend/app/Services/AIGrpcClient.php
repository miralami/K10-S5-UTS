<?php

namespace App\Services;

use RuntimeException;

/**
 * AIGrpcClient - Client for communicating with the Python AI Analysis gRPC service.
 *
 * This client wraps the gRPC calls to the AI service, providing a simple PHP interface
 * for analyzing journal notes. It requires the PHP gRPC extension to be installed.
 *
 * @see https://grpc.io/docs/languages/php/quickstart/
 */
class AIGrpcClient
{
    private string $host;

    private int $port;

    private ?\Ai\AIAnalysisServiceClient $client = null;

    public function __construct()
    {
        $this->host = config('services.ai_grpc.host', 'localhost');
        $this->port = (int) config('services.ai_grpc.port', 50052);
    }

    /**
     * Get or create the gRPC client.
     */
    private function getClient(): \Ai\AIAnalysisServiceClient
    {
        if ($this->client === null) {
            if (! extension_loaded('grpc')) {
                throw new RuntimeException(
                    'The gRPC PHP extension is not installed. '.
                    'Please install it: https://grpc.io/docs/languages/php/quickstart/'
                );
            }

            $this->client = new \Ai\AIAnalysisServiceClient(
                "{$this->host}:{$this->port}",
                [
                    'credentials' => \Grpc\ChannelCredentials::createInsecure(),
                ]
            );
        }

        return $this->client;
    }

    /**
     * Analyze a single day's journal notes.
     *
     * @param  string  $userId  The user ID
     * @param  string  $date  The date (Y-m-d format)
     * @param  array<int, array{id: int, title: string|null, body: string|null, created_at: string}>  $notes
     * @return array{summary: string, dominantMood: string, moodScore: int|null, highlights: array, advice: array, affirmation: string|null}
     */
    public function analyzeDaily(string $userId, string $date, array $notes): array
    {
        $request = new \Ai\DailyAnalysisRequest;
        $request->setUserId($userId);
        $request->setDate($date);

        $protoNotes = [];
        foreach ($notes as $note) {
            $protoNote = new \Ai\JournalNote;
            $protoNote->setId($note['id'] ?? 0);
            $protoNote->setTitle($note['title'] ?? '');
            $protoNote->setBody($note['body'] ?? '');
            $protoNote->setCreatedAt($note['created_at'] ?? '');
            $protoNotes[] = $protoNote;
        }
        $request->setNotes($protoNotes);

        /** @var \Ai\AnalysisResult $response */
        [$response, $status] = $this->getClient()->AnalyzeDaily($request)->wait();

        if ($status->code !== \Grpc\STATUS_OK) {
            throw new RuntimeException(
                "gRPC AnalyzeDaily failed: {$status->details} (code: {$status->code})"
            );
        }

        return $this->transformResponse($response);
    }

    /**
     * Analyze a week based on daily summaries.
     *
     * @param  string  $userId  The user ID
     * @param  string  $weekStart  The start date (Y-m-d format)
     * @param  string  $weekEnd  The end date (Y-m-d format)
     * @param  array<int, array{date: string, summary: string, dominantMood: string, moodScore: int, highlights: array, advice: array, noteCount: int}>  $dailySummaries
     * @return array{summary: string, dominantMood: string, moodScore: int|null, highlights: array, advice: array, affirmation: string|null}
     */
    public function analyzeWeekly(string $userId, string $weekStart, string $weekEnd, array $dailySummaries): array
    {
        $request = new \Ai\WeeklyAnalysisRequest;
        $request->setUserId($userId);
        $request->setWeekStart($weekStart);
        $request->setWeekEnd($weekEnd);

        $protoSummaries = [];
        foreach ($dailySummaries as $summary) {
            $protoSummary = new \Ai\DailySummary;
            $protoSummary->setDate($summary['date'] ?? '');
            $protoSummary->setSummary($summary['summary'] ?? '');
            $protoSummary->setDominantMood($summary['dominantMood'] ?? 'unknown');
            $protoSummary->setMoodScore($summary['moodScore'] ?? 0);
            $protoSummary->setHighlights($summary['highlights'] ?? []);
            $protoSummary->setAdvice($summary['advice'] ?? []);
            $protoSummary->setNoteCount($summary['noteCount'] ?? 0);
            $protoSummaries[] = $protoSummary;
        }
        $request->setDailySummaries($protoSummaries);

        /** @var \Ai\AnalysisResult $response */
        [$response, $status] = $this->getClient()->AnalyzeWeekly($request)->wait();

        if ($status->code !== \Grpc\STATUS_OK) {
            throw new RuntimeException(
                "gRPC AnalyzeWeekly failed: {$status->details} (code: {$status->code})"
            );
        }

        return $this->transformResponse($response);
    }

    /**
     * Check if the AI service is available.
     */
    public function isAvailable(): bool
    {
        if (! extension_loaded('grpc')) {
            return false;
        }

        try {
            $channel = $this->getClient()->getChannel();
            $state = $channel->getConnectivityState(true);

            return $state === \Grpc\CHANNEL_READY || $state === \Grpc\CHANNEL_IDLE;
        } catch (\Throwable $e) {
            return false;
        }
    }

    /**
     * Transform gRPC response to array.
     */
    private function transformResponse(\Ai\AnalysisResult $response): array
    {
        return [
            'summary' => $response->getSummary() ?: 'Tidak ada ringkasan.',
            'dominantMood' => $response->getDominantMood() ?: 'unknown',
            'moodScore' => $response->getMoodScore() ?: null,
            'highlights' => iterator_to_array($response->getHighlights()) ?: [],
            'advice' => iterator_to_array($response->getAdvice()) ?: [],
            'affirmation' => $response->getAffirmation() ?: null,
        ];
    }
}
