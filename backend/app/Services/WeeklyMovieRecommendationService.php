<?php

namespace App\Services;

use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * WeeklyMovieRecommendationService
 *
 * This service provides movie recommendations based on weekly mood analysis.
 * It communicates with the Python AI service via gRPC for AI-powered recommendations,
 * with fallback to curated lists when gRPC is unavailable.
 */
class WeeklyMovieRecommendationService
{
    private AIGrpcClient $grpcClient;

    public function __construct(AIGrpcClient $grpcClient)
    {
        $this->grpcClient = $grpcClient;
    }

    /**
     * Build movie recommendations based on weekly analysis using AI via gRPC.
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

        // Try gRPC-based AI recommendations
        try {
            if ($this->grpcClient->isAvailable()) {
                $recommendations = $this->grpcClient->getMovieRecommendations(
                    (string) Arr::get($analysis, 'userId', '0'),
                    $normalizedMood,
                    $moodScore,
                    $summary,
                    is_array($highlights) ? $highlights : [],
                    $affirmation
                );

                if (! empty($recommendations['items'])) {
                    Log::info('Movie recommendations fetched via gRPC', [
                        'category' => $recommendations['category'],
                        'itemCount' => count($recommendations['items']),
                    ]);

                    return $recommendations;
                }
            }
        } catch (\Exception $e) {
            Log::warning('gRPC movie recommendations failed, using fallback', [
                'error' => $e->getMessage(),
                'mood' => $normalizedMood,
            ]);
        }

        // Fallback to basic recommendations if gRPC fails
        return $this->getFallbackRecommendations($normalizedMood, $moodScore, $moodLabel);
    }

    /**
     * Fallback recommendations when gRPC is unavailable.
     */
    private function getFallbackRecommendations(string $mood, ?int $moodScore, string $moodLabel): array
    {
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
