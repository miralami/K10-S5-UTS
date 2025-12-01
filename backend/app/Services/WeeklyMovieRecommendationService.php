<?php

namespace App\Services;

use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class WeeklyMovieRecommendationService
{
    private const MAX_RETRIES = 3;
    private const RETRY_DELAY = 2; // seconds
    private const MAX_JITTER = 1000; // milliseconds

    private string $apiKey;
    private string $model;

    public function __construct()
    {
        $this->apiKey = (string) config('services.google_genai.api_key', '');
        $this->model = (string) config('services.google_genai.model', 'gemini-2.5-flash');
    }

    /**
     * Execute HTTP request with retry mechanism and exponential backoff.
     */
    private function httpRequestWithRetry(string $url, array $data, array $headers = [])
    {
        $lastException = null;

        for ($attempt = 1; $attempt <= self::MAX_RETRIES; $attempt++) {
            try {
                $jitter = rand(0, self::MAX_JITTER) / 1000;
                $delay = (self::RETRY_DELAY * $attempt) + $jitter;

                if ($attempt > 1) {
                    usleep((int) ($delay * 1000000));
                    Log::info("Movie recommendation API retry attempt {$attempt}", ['delay' => $delay]);
                }

                $response = Http::timeout(30 + ($attempt * 5))
                    ->withHeaders($headers)
                    ->post($url, $data);

                if ($response->successful()) {
                    return $response;
                }

                $errorMessage = strtolower($response->json('error.message') ?? $response->body());

                $isRetryable = str_contains($errorMessage, 'overloaded') ||
                              str_contains($errorMessage, 'try again') ||
                              str_contains($errorMessage, 'quota') ||
                              $response->status() === 429 ||
                              $response->status() >= 500;

                if (!$isRetryable || $attempt >= self::MAX_RETRIES) {
                    throw new \RuntimeException('API request failed: ' . $errorMessage);
                }

                Log::warning("Movie recommendation API attempt {$attempt} failed, retrying", [
                    'error' => $errorMessage,
                    'status' => $response->status(),
                ]);

            } catch (\Exception $e) {
                $lastException = $e;
                if ($attempt >= self::MAX_RETRIES) {
                    throw $e;
                }
            }
        }

        throw $lastException ?? new \RuntimeException('Failed to complete API request after ' . self::MAX_RETRIES . ' attempts');
    }

    /**
     * Build movie recommendations based on weekly analysis using AI.
     *
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
        $moodLabel = $normalizedMood !== '' ? $normalizedMood : 'kondisi kamu';

        // Try AI-generated recommendations first
        try {
            if ($this->apiKey !== '') {
                $aiRecommendations = $this->getAIRecommendations(
                    $normalizedMood,
                    $moodScore,
                    $summary,
                    $highlights,
                    $affirmation
                );

                if (!empty($aiRecommendations['items'])) {
                    return $aiRecommendations;
                }
            }
        } catch (\Exception $e) {
            Log::warning('AI movie recommendations failed, using fallback', [
                'error' => $e->getMessage(),
                'mood' => $normalizedMood,
            ]);
        }

        // Fallback to basic recommendations if AI fails
        return $this->getFallbackRecommendations($normalizedMood, $moodScore, $moodLabel);
    }

    /**
     * Get AI-generated movie recommendations from Gemini.
     */
    private function getAIRecommendations(
        string $mood,
        ?int $moodScore,
        string $summary,
        array $highlights,
        string $affirmation
    ): array {
        $prompt = $this->buildPrompt($mood, $moodScore, $summary, $highlights, $affirmation);

        $url = 'https://generativelanguage.googleapis.com/v1beta/models/' . $this->model . ':generateContent?key=' . $this->apiKey;

        $payload = [
            'contents' => [
                [
                    'role' => 'user',
                    'parts' => [
                        ['text' => $prompt],
                    ],
                ],
            ],
            'generationConfig' => [
                'response_mime_type' => 'application/json',
                'temperature' => 0.7,
                'top_p' => 0.95,
                'top_k' => 40,
                'max_output_tokens' => 2048,
            ],
            'safetySettings' => [
                ['category' => 'HARM_CATEGORY_HARASSMENT', 'threshold' => 'BLOCK_NONE'],
                ['category' => 'HARM_CATEGORY_HATE_SPEECH', 'threshold' => 'BLOCK_NONE'],
                ['category' => 'HARM_CATEGORY_SEXUALLY_EXPLICIT', 'threshold' => 'BLOCK_NONE'],
                ['category' => 'HARM_CATEGORY_DANGEROUS_CONTENT', 'threshold' => 'BLOCK_NONE'],
            ],
        ];

        $response = $this->httpRequestWithRetry($url, $payload, [
            'Content-Type' => 'application/json',
        ]);

        $responsePayload = $response->json();
        $text = $responsePayload['candidates'][0]['content']['parts'][0]['text'] ?? null;

        if (!is_string($text) || trim($text) === '') {
            throw new \RuntimeException('Empty response from Gemini');
        }

        $decoded = json_decode($text, true);
        if (!is_array($decoded)) {
            throw new \RuntimeException('Invalid JSON response from Gemini');
        }

        return [
            'category' => $decoded['category'] ?? 'ai-generated',
            'moodLabel' => $mood !== '' ? $mood : null,
            'headline' => $decoded['headline'] ?? 'Rekomendasi Film untuk Minggu Ini',
            'description' => $decoded['description'] ?? 'Film-film yang dipilih khusus berdasarkan mood mingguan kamu.',
            'items' => array_map(function (array $movie) {
                return [
                    'title' => $movie['title'] ?? 'Unknown',
                    'year' => $movie['year'] ?? null,
                    'tagline' => $movie['tagline'] ?? null,
                    'posterUrl' => $movie['posterUrl'] ?? null,
                    'imdbId' => $movie['imdbId'] ?? null,
                    'genres' => $movie['genres'] ?? [],
                    'reason' => $movie['reason'] ?? 'Film yang cocok untuk mood kamu.',
                ];
            }, $decoded['movies'] ?? []),
        ];
    }

    /**
     * Build the prompt for Gemini AI.
     */
    private function buildPrompt(
        string $mood,
        ?int $moodScore,
        string $summary,
        array $highlights,
        string $affirmation
    ): string {
        $moodInfo = $mood !== '' ? "Mood dominan: {$mood}" : 'Mood tidak teridentifikasi';
        $scoreInfo = $moodScore !== null ? "Skor mood: {$moodScore}/100" : '';
        $summaryInfo = $summary !== '' ? "Ringkasan minggu: {$summary}" : '';
        $highlightsInfo = !empty($highlights) ? "Highlights: " . implode(', ', array_slice($highlights, 0, 3)) : '';
        $affirmationInfo = $affirmation !== '' ? "Afirmasi: {$affirmation}" : '';

        $context = array_filter([$moodInfo, $scoreInfo, $summaryInfo, $highlightsInfo, $affirmationInfo]);
        $contextStr = implode("\n", $context);

        return <<<PROMPT
Kamu adalah asisten rekomendasi film yang ahli. Berdasarkan analisis mood mingguan pengguna berikut:

{$contextStr}

Berikan 3 rekomendasi film yang SANGAT SESUAI dengan kondisi emosional pengguna.

KRITERIA PEMILIHAN FILM:
- Jika mood positif (bahagia, senang, optimis): pilih film yang mempertahankan energi positif
- Jika mood sedih/lelah: pilih film yang menghangatkan hati dan memberi kenyamanan
- Jika mood cemas/stres: pilih film yang menenangkan dan grounding
- Jika mood reflektif/nostalgia: pilih film yang bermakna dan kontemplatif
- Jika mood termotivasi: pilih film yang inspiratif dan membangun semangat

Kembalikan dalam format JSON EXACT berikut:
{
  "category": "string (joyful/comfort/grounding/reflective/motivational/balanced)",
  "headline": "string (judul bagian dalam bahasa Indonesia, personal dan hangat)",
  "description": "string (deskripsi singkat mengapa film-film ini cocok, dalam bahasa Indonesia)",
  "movies": [
    {
      "title": "string (judul film dalam bahasa Inggris)",
      "year": number (tahun rilis),
      "tagline": "string (tagline singkat dalam bahasa Indonesia)",
      "imdbId": "string atau null (format: tt1234567)",
      "genres": ["string"] (maksimal 3 genre),
      "reason": "string (alasan personal mengapa film ini cocok untuk mood pengguna, dalam bahasa Indonesia, gunakan 'kamu' bukan '%s')"
    }
  ]
}

PENTING:
- Pilih film-film yang BERAGAM (berbeda genre, tahun, style)
- Film harus NYATA dan TERKENAL (bukan fiksi)
- Alasan harus PERSONAL dan terkait langsung dengan kondisi mood pengguna
- Gunakan bahasa Indonesia yang hangat dan empatik
- Jangan gunakan placeholder seperti %s dalam reason
PROMPT;
    }

    /**
     * Fallback recommendations when AI is unavailable.
     */
    private function getFallbackRecommendations(string $mood, ?int $moodScore, string $moodLabel): array
    {
        // Simple category resolution based on mood keywords
        $category = $this->resolveCategory($mood, $moodScore);

        $fallbackMovies = [
            'joyful' => [
                ['title' => 'La La Land', 'year' => 2016, 'imdbId' => 'tt3783958', 'genres' => ['Musikal', 'Romansa'], 'tagline' => 'Musikal modern tentang mimpi dan cinta.', 'reason' => 'Film penuh warna dan musik yang cocok untuk mempertahankan mood positifmu.'],
                ['title' => 'The Grand Budapest Hotel', 'year' => 2014, 'imdbId' => 'tt2278388', 'genres' => ['Komedi', 'Petualangan'], 'tagline' => 'Komedi visual penuh warna.', 'reason' => 'Humor unik dan visual cerah yang sempurna untuk menjaga semangatmu.'],
                ['title' => 'Paddington 2', 'year' => 2017, 'imdbId' => 'tt4468740', 'genres' => ['Keluarga', 'Komedi'], 'tagline' => 'Petualangan beruang paling optimis.', 'reason' => 'Kehangatan dan kebaikan yang akan membuat hatimu semakin ringan.'],
            ],
            'comfort' => [
                ['title' => 'About Time', 'year' => 2013, 'imdbId' => 'tt2194499', 'genres' => ['Drama', 'Romansa'], 'tagline' => 'Cinta dan kesempatan kedua.', 'reason' => 'Kisah hangat yang mengingatkan pentingnya momen-momen kecil dalam hidup.'],
                ['title' => 'Chef', 'year' => 2014, 'imdbId' => 'tt2883512', 'genres' => ['Drama', 'Komedi'], 'tagline' => 'Makanan hangat untuk hati lelah.', 'reason' => 'Perjalanan menyembuhkan diri lewat passion dan keluarga.'],
                ['title' => 'Little Women', 'year' => 2019, 'imdbId' => 'tt3281548', 'genres' => ['Drama', 'Keluarga'], 'tagline' => 'Ikatan keluarga yang menghangatkan.', 'reason' => 'Kisah persaudaraan yang memberi ruang aman untuk perasaanmu.'],
            ],
            'grounding' => [
                ['title' => 'The Secret Life of Walter Mitty', 'year' => 2013, 'imdbId' => 'tt0359950', 'genres' => ['Petualangan', 'Drama'], 'tagline' => 'Petualangan menemukan diri sendiri.', 'reason' => 'Inspirasi untuk melangkah keluar dari zona nyaman dengan tenang.'],
                ['title' => 'Finding Nemo', 'year' => 2003, 'imdbId' => 'tt0266543', 'genres' => ['Animasi', 'Petualangan'], 'tagline' => 'Petualangan laut yang menenangkan.', 'reason' => 'Keindahan laut dan humor ringan yang membantu meredakan pikiran.'],
                ['title' => 'A Beautiful Day in the Neighborhood', 'year' => 2019, 'imdbId' => 'tt3224458', 'genres' => ['Drama', 'Biografi'], 'tagline' => 'Ketenangan ala Mr. Rogers.', 'reason' => 'Pendekatan lembut untuk menghadapi emosi yang overwhelming.'],
            ],
            'reflective' => [
                ['title' => 'Her', 'year' => 2013, 'imdbId' => 'tt1798709', 'genres' => ['Drama', 'Romansa'], 'tagline' => 'Cinta di era digital.', 'reason' => 'Film kontemplatif yang memberi ruang untuk introspeksi mendalam.'],
                ['title' => 'Before Sunrise', 'year' => 1995, 'imdbId' => 'tt0112471', 'genres' => ['Drama', 'Romansa'], 'tagline' => 'Percakapan malam yang bermakna.', 'reason' => 'Dialog mendalam yang cocok untuk suasana hati reflektif.'],
                ['title' => 'Lost in Translation', 'year' => 2003, 'imdbId' => 'tt0335266', 'genres' => ['Drama'], 'tagline' => 'Kesunyian Tokyo yang penuh arti.', 'reason' => 'Film tentang koneksi manusia yang cocok untuk momen merenung.'],
            ],
            'motivational' => [
                ['title' => 'The Pursuit of Happyness', 'year' => 2006, 'imdbId' => 'tt0454921', 'genres' => ['Drama', 'Biografi'], 'tagline' => 'Perjuangan mengejar mimpi.', 'reason' => 'Kisah nyata yang membakar semangat untuk terus berjuang.'],
                ['title' => 'Hidden Figures', 'year' => 2016, 'imdbId' => 'tt4846340', 'genres' => ['Drama', 'Biografi'], 'tagline' => 'Ilmuwan yang mengguncang batasan.', 'reason' => 'Inspirasi untuk berani melampaui ekspektasi orang lain.'],
                ['title' => 'Moneyball', 'year' => 2011, 'imdbId' => 'tt1210166', 'genres' => ['Drama', 'Olahraga'], 'tagline' => 'Berpikir di luar kebiasaan.', 'reason' => 'Strategi dan keberanian untuk melakukan terobosan.'],
            ],
            'balanced' => [
                ['title' => 'Inside Out', 'year' => 2015, 'imdbId' => 'tt2096673', 'genres' => ['Animasi', 'Keluarga'], 'tagline' => 'Memahami emosi lewat petualangan.', 'reason' => 'Film yang mengajarkan bahwa semua emosi punya tempatnya.'],
                ['title' => 'Soul', 'year' => 2020, 'imdbId' => 'tt2948372', 'genres' => ['Animasi', 'Petualangan'], 'tagline' => 'Mencari makna hidup.', 'reason' => 'Refleksi indah tentang apa yang membuat hidup bermakna.'],
                ['title' => 'The Peanut Butter Falcon', 'year' => 2019, 'imdbId' => 'tt4364194', 'genres' => ['Petualangan', 'Drama'], 'tagline' => 'Persahabatan di perjalanan.', 'reason' => 'Cerita hangat yang memberi dorongan lembut untuk hari-harimu.'],
            ],
        ];

        $headlines = [
            'joyful' => 'Pertahankan vibe positifmu!',
            'comfort' => 'Pelukan hangat lewat layar.',
            'grounding' => 'Teman penenang pikiran.',
            'reflective' => 'Teman merenung penuh makna.',
            'motivational' => 'Bahan bakar produktif.',
            'balanced' => 'Pilihan hangat untuk mood yang campur aduk.',
        ];

        $descriptions = [
            'joyful' => 'Film-film cerah ini siap menjaga semangatmu tetap tinggi sepanjang minggu.',
            'comfort' => 'Saat hati butuh kehangatan, kisah-kisah lembut ini membantu terasa lebih ringan.',
            'grounding' => 'Cerita menenangkan ini mengajakmu bernapas lebih pelan.',
            'reflective' => 'Film bertempo lembut yang membantu merangkai sudut pandang baru.',
            'motivational' => 'Kisah perjuangan inspiratif yang memantik aksi berikutnya.',
            'balanced' => 'Tontonan seimbang penuh empati untuk mood yang belum pasti.',
        ];

        $movies = $fallbackMovies[$category] ?? $fallbackMovies['balanced'];
        $headline = $headlines[$category] ?? $headlines['balanced'];
        $description = $descriptions[$category] ?? $descriptions['balanced'];

        return [
            'category' => $category,
            'moodLabel' => $mood !== '' ? $mood : null,
            'headline' => $headline,
            'description' => $description,
            'items' => $movies,
        ];
    }

    /**
     * Resolve category based on mood keywords and score.
     */
    private function resolveCategory(string $mood, ?int $moodScore): string
    {
        $haystack = Str::lower($mood);

        $categoryKeywords = [
            'joyful' => ['bahagia', 'senang', 'gembira', 'ceria', 'optimis', 'positif', 'bersemangat', 'lega'],
            'comfort' => ['sedih', 'murung', 'lelah', 'letih', 'kecewa', 'down', 'capek', 'patah', 'galau', 'sepi', 'sunyi', 'kesepian'],
            'grounding' => ['cemas', 'gelisah', 'khawatir', 'resah', 'stres', 'stress', 'tegang', 'panik', 'overwhelmed', 'kacau', 'takut'],
            'reflective' => ['tenang', 'damai', 'reflektif', 'nostalgia', 'merenung', 'kontemplatif', 'campur', 'campuran', 'mixed'],
            'motivational' => ['termotivasi', 'ambisius', 'ambitious', 'fokus', 'produktif', 'berdaya', 'tekad', 'berani', 'gigih', 'semangat'],
        ];

        foreach ($categoryKeywords as $category => $keywords) {
            foreach ($keywords as $keyword) {
                if ($keyword !== '' && Str::contains($haystack, $keyword)) {
                    return $category;
                }
            }
        }

        // Score-based fallback
        if ($moodScore !== null) {
            if ($moodScore >= 70) return 'joyful';
            if ($moodScore <= 40) return 'comfort';
            if ($moodScore >= 55) return 'motivational';
        }

        return 'balanced';
    }

    private function normalizeMood(string $mood): string
    {
        return (string) Str::of($mood)->lower()->trim();
    }
}
