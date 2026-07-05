<?php

namespace App\Services;

use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use RuntimeException;

class WeeklyMusicRecommendationService
{
    private const ITEM_LIMIT = 3;

    public function __construct(
        private readonly LastFmService $lastFmService,
    ) {}

    /**
     * @param  array<string, mixed>|null  $analysis
     * @return array<string, mixed>
     */
    public function buildRecommendations(?array $analysis): array
    {
        $rawMood = (string) Arr::get($analysis, 'dominantMood', '');
        $rawScore = Arr::get($analysis, 'moodScore');
        $moodScore = is_numeric($rawScore) ? (int) $rawScore : null;
        $summary = (string) Arr::get($analysis, 'summary', '');
        $highlights = Arr::get($analysis, 'highlights', []);
        $affirmation = (string) Arr::get($analysis, 'affirmation', '');

        $normalizedMood = $this->normalizeMood($rawMood);

        // Always try fallback first to ensure we have data
        $fallback = $this->getFallbackRecommendations($normalizedMood, $moodScore);
        
        try {
            $result = $this->getRecommendationsFromGemini(
                mood: $normalizedMood,
                moodScore: $moodScore,
                summary: $summary,
                highlights: is_array($highlights) ? $highlights : [],
                affirmation: $affirmation,
            );

            if (! empty($result['items'])) {
                $result['items'] = array_slice($result['items'], 0, self::ITEM_LIMIT);
                $result['items'] = $this->lastFmService->enrichTracks($result['items']);
                $result['source'] = 'gemini';

                Log::info('Music recommendations from Gemini', ['count' => count($result['items'])]);
                return $result;
            }
        } catch (\Throwable $e) {
            Log::warning('Gemini music recommendations failed, using fallback', [
                'error' => $e->getMessage(),
                'mood' => $normalizedMood,
            ]);
        }

        // Use fallback
        $fallback['items'] = array_slice($fallback['items'], 0, self::ITEM_LIMIT);
        $fallback['items'] = $this->lastFmService->enrichTracks($fallback['items']);
        $fallback['source'] = 'fallback';

        Log::info('Music recommendations from fallback', ['count' => count($fallback['items'])]);
        return $fallback;
    }

    /**
     * @return array<string, mixed>
     */
    private function getRecommendationsFromGemini(
        string $mood,
        ?int $moodScore,
        string $summary,
        array $highlights,
        string $affirmation,
    ): array {
        $apiKey = (string) config('services.google_genai.api_key');
        $model = (string) config('services.google_genai.model', 'gemini-2.5-flash');

        if ($apiKey === '') {
            throw new RuntimeException('GOOGLE_GENAI_API_KEY not configured');
        }

        $prompt = $this->buildPrompt($mood, $moodScore, $summary, $highlights, $affirmation);

        $response = Http::timeout(30)
            ->withHeaders(['Content-Type' => 'application/json'])
            ->post("https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}", [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt],
                        ],
                    ],
                ],
                'generationConfig' => [
                    'response_mime_type' => 'application/json',
                    'temperature' => 0.7,
                    'top_p' => 0.95,
                    'max_output_tokens' => 2048,
                ],
            ]);

        if (! $response->successful()) {
            throw new RuntimeException('Gemini API request failed: '.$response->body());
        }

        $payload = $response->json();
        $text = Arr::get($payload, 'candidates.0.content.parts.0.text', '{}');

        $decoded = json_decode((string) $text, true);
        if (! is_array($decoded)) {
            throw new RuntimeException('Gemini returned invalid JSON');
        }

        $items = [];
        $tracks = $decoded['tracks'] ?? [];
        if (is_array($tracks)) {
            foreach ($tracks as $t) {
                if (! is_array($t)) {
                    continue;
                }

                $title = trim((string) ($t['title'] ?? ''));
                $artist = trim((string) ($t['artist'] ?? ''));
                if ($title === '' || $artist === '') {
                    continue;
                }

                $items[] = [
                    'title' => $title,
                    'artist' => $artist,
                    'reason' => (string) ($t['reason'] ?? ''),
                    'tags' => is_array($t['tags'] ?? null) ? array_values($t['tags']) : [],
                    'mood' => (string) ($t['mood'] ?? ''),
                    'lastfmUrl' => null,
                    'coverUrl' => null,
                ];
            }
        }

        $items = array_slice($items, 0, self::ITEM_LIMIT);

        return [
            'category' => (string) ($decoded['category'] ?? 'balanced'),
            'moodLabel' => (string) ($decoded['moodLabel'] ?? ($mood !== '' ? $mood : null)),
            'headline' => (string) ($decoded['headline'] ?? 'Music Recommendations'),
            'description' => (string) ($decoded['description'] ?? 'Lagu-lagu yang dipilih berdasarkan mood mingguan kamu.'),
            'items' => $items,
        ];
    }

    private function buildPrompt(
        string $mood,
        ?int $moodScore,
        string $summary,
        array $highlights,
        string $affirmation,
    ): string {
        $moodInfo = $mood !== '' ? "Mood dominan: {$mood}" : 'Mood tidak teridentifikasi';
        $scoreInfo = $moodScore !== null ? "Skor mood: {$moodScore}/100" : '';
        $summaryInfo = $summary !== '' ? "Ringkasan minggu: {$summary}" : '';
        $highlightsInfo = ! empty($highlights) ? 'Highlights: '.implode(', ', array_slice($highlights, 0, 3)) : '';
        $affirmationInfo = $affirmation !== '' ? "Afirmasi: {$affirmation}" : '';

        $contextParts = array_values(array_filter([$moodInfo, $scoreInfo, $summaryInfo, $highlightsInfo, $affirmationInfo]));
        $context = implode("\n", $contextParts);

        return "Kamu adalah asisten rekomendasi musik yang empatik dan paham musik populer. Berdasarkan analisis mood mingguan pengguna berikut:\n\n{$context}\n\nBerikan 3 rekomendasi lagu yang SANGAT SESUAI dengan kondisi emosional pengguna. Lagu harus NYATA dan umum ditemukan di Last.fm.\n\nKembalikan dalam format JSON EXACT berikut:\n{\n  \"category\": \"string (joyful/comfort/grounding/reflective/motivational/balanced)\",\n  \"moodLabel\": \"string\",\n  \"headline\": \"string (judul bagian dalam bahasa Indonesia, personal dan hangat)\",\n  \"description\": \"string (deskripsi singkat mengapa lagu-lagu ini cocok, dalam bahasa Indonesia)\",\n  \"tracks\": [\n    {\n      \"title\": \"string\",\n      \"artist\": \"string\",\n      \"reason\": \"string (alasan personal dalam bahasa Indonesia)\",\n      \"tags\": [\"string\"] (maks 5),\n      \"mood\": \"string (opsional)\"\n    }\n  ]\n}\n\nPENTING:\n- Pilih lagu yang BERAGAM (genre/tempo/era)\n- Jangan isi title/artist kosong\n- Jangan output markdown, hanya JSON.";
    }

    /**
     * @return array<string, mixed>
     */
    private function getFallbackRecommendations(string $mood, ?int $moodScore): array
    {
        $category = $this->resolveCategory($mood, $moodScore);

        $fallback = [
            'joyful' => [
                ['title' => 'Happy', 'artist' => 'Pharrell Williams', 'reason' => 'Energinya ringan dan uplifting untuk menjaga mood positifmu.'],
                ['title' => 'Walking on Sunshine', 'artist' => 'Katrina & The Waves', 'reason' => 'Vibe cerah yang bikin hari terasa lebih lega.'],
                ['title' => 'Can\'t Stop the Feeling!', 'artist' => 'Justin Timberlake', 'reason' => 'Beat fun untuk menambah semangat.'],
                ['title' => 'Good as Hell', 'artist' => 'Lizzo', 'reason' => 'Buat boost percaya diri dan self-love.'],
                ['title' => 'Sunday Best', 'artist' => 'Surfaces', 'reason' => 'Santai tapi tetap optimis.'],
            ],
            'comfort' => [
                ['title' => 'Fix You', 'artist' => 'Coldplay', 'reason' => 'Pelan dan menenangkan untuk memeluk perasaan yang berat.'],
                ['title' => 'All I Want', 'artist' => 'Kodaline', 'reason' => 'Memberi ruang untuk sedih tanpa terburu-buru.'],
                ['title' => 'Someone Like You', 'artist' => 'Adele', 'reason' => 'Validasi emosi saat hati sedang rapuh.'],
                ['title' => 'The Night We Met', 'artist' => 'Lord Huron', 'reason' => 'Cocok untuk momen reflektif dan nostalgia.'],
                ['title' => 'Breathe Me', 'artist' => 'Sia', 'reason' => 'Lembut dan terasa seperti teman yang menenangkan.'],
            ],
            'grounding' => [
                ['title' => 'Weightless', 'artist' => 'Marconi Union', 'reason' => 'Ambient yang membantu menurunkan ketegangan.'],
                ['title' => 'Holocene', 'artist' => 'Bon Iver', 'reason' => 'Tenang dan membuat napas terasa lebih pelan.'],
                ['title' => 'Bloom', 'artist' => 'The Paper Kites', 'reason' => 'Hangat untuk menenangkan pikiran yang berisik.'],
                ['title' => 'River Flows in You', 'artist' => 'Yiruma', 'reason' => 'Piano lembut untuk grounding.'],
                ['title' => 'Sunset Lover', 'artist' => 'Petit Biscuit', 'reason' => 'Chill elektronik yang stabil dan menenangkan.'],
            ],
            'reflective' => [
                ['title' => 'Skinny Love', 'artist' => 'Bon Iver', 'reason' => 'Cocok untuk merenung dan merapikan perasaan.'],
                ['title' => 'Landslide', 'artist' => 'Fleetwood Mac', 'reason' => 'Refleksi lembut tentang perubahan hidup.'],
                ['title' => 'Yellow', 'artist' => 'Coldplay', 'reason' => 'Hangat dan kontemplatif.'],
                ['title' => 'Vienna', 'artist' => 'Billy Joel', 'reason' => 'Pengingat untuk pelan-pelan dan tidak terburu-buru.'],
                ['title' => 'To Build a Home', 'artist' => 'The Cinematic Orchestra', 'reason' => 'Menenangkan dan dalam, cocok untuk momen hening.'],
            ],
            'motivational' => [
                ['title' => 'Eye of the Tiger', 'artist' => 'Survivor', 'reason' => 'Bahan bakar semangat untuk bergerak lagi.'],
                ['title' => 'Stronger', 'artist' => 'Kanye West', 'reason' => 'Beat tegas untuk mendorong fokus.'],
                ['title' => 'Lose Yourself', 'artist' => 'Eminem', 'reason' => 'Dorongan kuat untuk mengambil kesempatan.'],
                ['title' => 'Hall of Fame', 'artist' => 'The Script', 'reason' => 'Lirik yang memotivasi untuk konsisten.'],
                ['title' => 'Believer', 'artist' => 'Imagine Dragons', 'reason' => 'Energi tinggi untuk channeling emosi jadi aksi.'],
            ],
            'balanced' => [
                ['title' => 'Riptide', 'artist' => 'Vance Joy', 'reason' => 'Ringan, cocok untuk mood campur aduk.'],
                ['title' => 'Budapest', 'artist' => 'George Ezra', 'reason' => 'Santai dan hangat untuk menemani hari.'],
                ['title' => 'Somewhere Only We Know', 'artist' => 'Keane', 'reason' => 'Nostalgia tapi tetap hangat.'],
                ['title' => 'Better Together', 'artist' => 'Jack Johnson', 'reason' => 'Vibe tenang untuk menstabilkan mood.'],
                ['title' => 'New Light', 'artist' => 'John Mayer', 'reason' => 'Groovy ringan untuk reset energi.'],
            ],
        ];

        $headlines = [
            'joyful' => 'Playlist untuk mempertahankan senyummu.',
            'comfort' => 'Lagu-lagu peluk pelan untuk hati yang capek.',
            'grounding' => 'Teman bernapas pelan dan kembali stabil.',
            'reflective' => 'Soundtrack untuk merenung tanpa menghakimi diri.',
            'motivational' => 'Bahan bakar untuk melangkah lagi.',
            'balanced' => 'Lagu hangat untuk mood yang campur aduk.',
        ];

        $descriptions = [
            'joyful' => 'Pilihan lagu cerah untuk menjaga energi positif tetap mengalir.',
            'comfort' => 'Saat kamu butuh kehangatan, lagu-lagu ini bisa jadi teman aman.',
            'grounding' => 'Nada yang stabil untuk menenangkan pikiran yang tegang.',
            'reflective' => 'Lagu yang memberi ruang untuk memahami diri dengan lembut.',
            'motivational' => 'Beat dan lirik yang memantik aksi berikutnya.',
            'balanced' => 'Sedikit cerah, sedikit tenang—pas untuk hari yang nggak satu warna.',
        ];

        $selected = $fallback[$category] ?? $fallback['balanced'];
        if (is_array($selected) && count($selected) > 1) {
            shuffle($selected);
        }
        $selected = array_slice($selected, 0, self::ITEM_LIMIT);

        $items = array_map(function (array $t) {
            return [
                'title' => $t['title'],
                'artist' => $t['artist'],
                'reason' => $t['reason'],
                'tags' => [],
                'mood' => null,
                'lastfmUrl' => null,
                'coverUrl' => null,
            ];
        }, $selected);

        return [
            'category' => $category,
            'moodLabel' => $mood !== '' ? $mood : null,
            'headline' => $headlines[$category] ?? $headlines['balanced'],
            'description' => $descriptions[$category] ?? $descriptions['balanced'],
            'items' => $items,
        ];
    }

    private function resolveCategory(string $mood, ?int $moodScore): string
    {
        $haystack = Str::lower($mood);

        $categoryKeywords = [
            'joyful' => ['bahagia', 'senang', 'gembira', 'ceria', 'optimis', 'positif', 'bersemangat', 'lega', 'happy', 'joy'],
            'comfort' => ['sedih', 'murung', 'lelah', 'letih', 'kecewa', 'down', 'capek', 'patah', 'galau', 'sepi', 'sunyi', 'kesepian', 'sad'],
            'grounding' => ['cemas', 'gelisah', 'khawatir', 'resah', 'stres', 'stress', 'tegang', 'panik', 'overwhelmed', 'kacau', 'takut', 'anxious'],
            'reflective' => ['tenang', 'damai', 'reflektif', 'nostalgia', 'merenung', 'kontemplatif', 'campur', 'campuran', 'mixed', 'calm'],
            'motivational' => ['termotivasi', 'ambisius', 'ambitious', 'fokus', 'produktif', 'berdaya', 'tekad', 'berani', 'gigih', 'semangat', 'motivated'],
        ];

        foreach ($categoryKeywords as $category => $keywords) {
            foreach ($keywords as $keyword) {
                if ($keyword !== '' && Str::contains($haystack, $keyword)) {
                    return $category;
                }
            }
        }

        if ($moodScore !== null) {
            if ($moodScore >= 70) {
                return 'joyful';
            }
            if ($moodScore <= 40) {
                return 'comfort';
            }
            if ($moodScore >= 55) {
                return 'motivational';
            }
        }

        return 'balanced';
    }

    private function normalizeMood(string $mood): string
    {
        return (string) Str::of($mood)->lower()->trim();
    }
}
