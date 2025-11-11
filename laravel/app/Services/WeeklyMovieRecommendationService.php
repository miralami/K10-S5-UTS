<?php

namespace App\Services;

use Illuminate\Support\Arr;
use Illuminate\Support\Str;

class WeeklyMovieRecommendationService
{
    private const DEFAULT_CATEGORY = 'balanced';

    /**
     * Dataset rekomendasi berdasarkan kategori mood mingguan.
     * Menyimpan kata kunci referensi, headline, deskripsi, dan daftar film.
     *
     * @var array<string, array<string, mixed>>
     */
    private array $catalog = [
        'joyful' => [
            'keywords' => ['bahagia', 'senang', 'gembira', 'ceria', 'optimis', 'positif', 'bersemangat', 'lega'],
            'headline' => 'Pertahankan vibe positifmu, %s!',
            'description' => 'Mood %s terlihat cerah. Tiga film ini siap menjaga semangatmu tetap tinggi sepanjang minggu.',
            'movies' => [
                [
                    'title' => 'La La Land',
                    'year' => 2016,
                    'tagline' => 'Musikal modern tentang mengejar mimpi dan cinta yang getir.',
                    'posterUrl' => 'https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg',
                    'imdbId' => 'tt3783958',
                    'genres' => ['Musikal', 'Romansa'],
                    'reason' => 'Energi %s minggu ini cocok ditemani kisah penuh semangat yang mengingatkan bahwa kegembiraan layak dirayakan.',
                ],
                [
                    'title' => 'Paddington 2',
                    'year' => 2017,
                    'tagline' => 'Petualangan beruang paling optimis di London.',
                    'posterUrl' => 'https://image.tmdb.org/t/p/w500/qYtNbNSMdGvYZAXwv969A3Luu6z.jpg',
                    'imdbId' => 'tt4468740',
                    'genres' => ['Keluarga', 'Petualangan'],
                    'reason' => 'Kehangatan %s akan terasa makin lengkap dengan film keluarga yang mengajarkan kebaikan sederhana.',
                ],
                [
                    'title' => 'The Grand Budapest Hotel',
                    'year' => 2014,
                    'tagline' => 'Komedi visual penuh warna karya Wes Anderson.',
                    'posterUrl' => 'https://image.tmdb.org/t/p/w500/nX5XotM9yprCKarRH4fzOq1VM1J.jpg',
                    'imdbId' => 'tt2278388',
                    'genres' => ['Komedi', 'Petualangan'],
                    'reason' => 'Gaya %s yang ringan cocok disandingkan dengan humor unik dan visual cerah dari hotel paling eksentrik di Eropa.',
                ],
            ],
        ],
        'comfort' => [
            'keywords' => ['sedih', 'murung', 'lelah', 'letih', 'kecewa', 'down', 'capek', 'patah', 'galau', 'sepi', 'sunyi', 'kesepian'],
            'headline' => 'Pelukan hangat lewat layar untuk mood %s.',
            'description' => 'Saat mood %s mendominasi, kisah-kisah lembut ini membantu hati terasa lebih ringan.',
            'movies' => [
                [
                    'title' => 'About Time',
                    'year' => 2013,
                    'tagline' => 'Cinta, keluarga, dan kesempatan kedua.',
                    'posterUrl' => 'https://image.tmdb.org/t/p/w500/i9GUSgddIqrroubiLsvvMRYyRy0.jpg',
                    'imdbId' => 'tt2194499',
                    'genres' => ['Drama', 'Romansa'],
                    'reason' => 'Saat hati %s butuh kehangatan, perjalanan lintas waktu Tim mengingatkan pentingnya momen sederhana.',
                ],
                [
                    'title' => 'Chef',
                    'year' => 2014,
                    'tagline' => 'Makanan hangat untuk hati yang lelah.',
                    'posterUrl' => 'https://image.tmdb.org/t/p/w500/RIzH8FOF6MfX6Cox0Fh6JLFyzo.jpg',
                    'imdbId' => 'tt2883512',
                    'genres' => ['Drama', 'Komedi'],
                    'reason' => 'Aroma kuliner dan perjalanan keluarga ini cocok untuk menenangkan perasaan %s yang sedang rapuh.',
                ],
                [
                    'title' => 'Little Women',
                    'year' => 2019,
                    'tagline' => 'Saudari March dan kehangatan keluarga.',
                    'posterUrl' => 'https://image.tmdb.org/t/p/w500/mSDeRlIC3GNcGrbTHY3fHC1NXpC.jpg',
                    'imdbId' => 'tt3281548',
                    'genres' => ['Drama', 'Keluarga'],
                    'reason' => 'Ikatan keluarga March memberi ruang aman untuk %s yang butuh diyakinkan bahwa harapan masih ada.',
                ],
            ],
        ],
        'grounding' => [
            'keywords' => ['cemas', 'gelisah', 'khawatir', 'resah', 'stres', 'stress', 'tegang', 'panik', 'overwhelmed', 'kacau', 'takut'],
            'headline' => 'Teman penenang pikiran saat kamu merasa %s.',
            'description' => 'Ketika suasana %s hadir, cerita menenangkan ini mengajakmu bernapas lebih pelan.',
            'movies' => [
                [
                    'title' => 'The Secret Life of Walter Mitty',
                    'year' => 2013,
                    'tagline' => 'Melangkah keluar dari kecemasan menuju petualangan.',
                    'posterUrl' => 'https://image.tmdb.org/t/p/w500/8gZsQ8OqiN54xHTmYG3L0uHwax2.jpg',
                    'imdbId' => 'tt0359950',
                    'genres' => ['Petualangan', 'Drama'],
                    'reason' => 'Perjalanan Walter menunjukkan bahwa rasa %s bisa dialihkan dengan langkah kecil yang konsisten.',
                ],
                [
                    'title' => 'A Beautiful Day in the Neighborhood',
                    'year' => 2019,
                    'tagline' => 'Ketenangan ala Mr. Rogers.',
                    'posterUrl' => 'https://image.tmdb.org/t/p/w500/p9PSU0muIXKfkc3O9pAq3gFft60.jpg',
                    'imdbId' => 'tt3224458',
                    'genres' => ['Drama', 'Biografi'],
                    'reason' => 'Pendekatan lembut Mr. Rogers memberi contoh cara memeluk rasa %s sambil tetap lembut pada diri sendiri.',
                ],
                [
                    'title' => 'Finding Nemo',
                    'year' => 2003,
                    'tagline' => 'Petualangan laut yang menenangkan.',
                    'posterUrl' => 'https://image.tmdb.org/t/p/w500/eHuGQ10FUzK1mdOY69wF5pGgEf5.jpg',
                    'imdbId' => 'tt0266543',
                    'genres' => ['Animasi', 'Petualangan'],
                    'reason' => 'Dory dan Marlin mengajarkan cara menghadapi rasa %s dengan humor dan keberanian perlahan-lahan.',
                ],
            ],
        ],
        'reflective' => [
            'keywords' => ['tenang', 'damai', 'reflektif', 'nostalgia', 'merenung', 'kontemplatif', 'campur', 'campuran', 'mixed'],
            'headline' => 'Teman merenung penuh makna saat mood %s.',
            'description' => 'Mood %s cocok ditemani film bertempo lembut yang membantu merangkai sudut pandang baru.',
            'movies' => [
                [
                    'title' => 'Her',
                    'year' => 2013,
                    'tagline' => 'Cinta, kesepian, dan keheningan kota futuristik.',
                    'posterUrl' => 'https://image.tmdb.org/t/p/w500/fsoTLnUXEutsvH9GjpOIl7a0wng.jpg',
                    'imdbId' => 'tt1798709',
                    'genres' => ['Drama', 'Romansa'],
                    'reason' => 'Ketika perasaan %s membuatmu introspektif, kisah Theodore memberi ruang untuk memahami relasi dengan diri sendiri.',
                ],
                [
                    'title' => 'Before Sunrise',
                    'year' => 1995,
                    'tagline' => 'Percakapan malam yang penuh makna.',
                    'posterUrl' => 'https://image.tmdb.org/t/p/w500/6qhBF7eft0ZbhOeJ0fIPJ9i6C3I.jpg',
                    'imdbId' => 'tt0112471',
                    'genres' => ['Drama', 'Romansa'],
                    'reason' => 'Dialog mendalam Jesse dan Celine membantu mengurai rasa %s dengan ritme yang pelan namun jujur.',
                ],
                [
                    'title' => 'Lost in Translation',
                    'year' => 2003,
                    'tagline' => 'Kesunyian Tokyo yang penuh arti.',
                    'posterUrl' => 'https://image.tmdb.org/t/p/w500/y7rDYFfbG3McWIIthE45pY2R5S2.jpg',
                    'imdbId' => 'tt0335266',
                    'genres' => ['Drama'],
                    'reason' => 'Suasana %s bisa menemukan teman seperasaan lewat hubungan sunyi Charlotte dan Bob.',
                ],
            ],
        ],
        'motivational' => [
            'keywords' => ['termotivasi', 'ambisius', 'ambitious', 'fokus', 'produktif', 'berdaya', 'tekad', 'berani', 'gigih', 'semangat'],
            'headline' => 'Bahan bakar produktif untuk semangat %s.',
            'description' => 'Energi %s pantas didampingi kisah perjuangan inspiratif yang memantik aksi berikutnya.',
            'movies' => [
                [
                    'title' => 'The Pursuit of Happyness',
                    'year' => 2006,
                    'tagline' => 'Perjuangan Chris Gardner mengejar mimpi.',
                    'posterUrl' => 'https://image.tmdb.org/t/p/w500/bQL7KD0WFv9g0czkYxoavAEPXsY.jpg',
                    'imdbId' => 'tt0454921',
                    'genres' => ['Drama', 'Biografi'],
                    'reason' => 'Ketika %s membuatmu ingin tetap berjuang, kisah nyata ini menjaga harapan dan daya juang tetap menyala.',
                ],
                [
                    'title' => 'Hidden Figures',
                    'year' => 2016,
                    'tagline' => 'Ilmuwan NASA yang mengguncang batasan.',
                    'posterUrl' => 'https://image.tmdb.org/t/p/w500/9lf10N9Yj2TRmSHBXN2TOAzYm9Z.jpg',
                    'imdbId' => 'tt4846340',
                    'genres' => ['Drama', 'Biografi'],
                    'reason' => 'Tekad %s akan terpacu oleh keberanian tiga matematikawan yang menolak menyerah pada hambatan sosial.',
                ],
                [
                    'title' => 'Moneyball',
                    'year' => 2011,
                    'tagline' => 'Mengubah permainan lewat data dan keberanian.',
                    'posterUrl' => 'https://image.tmdb.org/t/p/w500/3uCB1gKAJ0FAUi4U7GzK9WKHCV4.jpg',
                    'imdbId' => 'tt1210166',
                    'genres' => ['Drama', 'Olahraga'],
                    'reason' => 'Saat dorongan %s ingin melakukan terobosan, strategi Moneyball memberi inspirasi untuk berpikir di luar kebiasaan.',
                ],
            ],
        ],
        'balanced' => [
            'keywords' => ['unknown', 'netral', 'seimbang'],
            'headline' => 'Pilihan hangat untuk mood yang belum pasti.',
            'description' => 'Saat mood terasa campur aduk, tontonan ini menawarkan cerita seimbang penuh empati.',
            'movies' => [
                [
                    'title' => 'Inside Out',
                    'year' => 2015,
                    'tagline' => 'Memahami emosi lewat petualangan animasi.',
                    'posterUrl' => 'https://image.tmdb.org/t/p/w500/2H1TmgdfNtsKlU9jKdeNyYL5y8T.jpg',
                    'imdbId' => 'tt2096673',
                    'genres' => ['Animasi', 'Keluarga'],
                    'reason' => 'Ketika sulit mendeskripsikan mood, film ini mengajarkan bahwa semua emosi punya tempatnya.',
                ],
                [
                    'title' => 'Soul',
                    'year' => 2020,
                    'tagline' => 'Mencari makna hidup dari nada jazz.',
                    'posterUrl' => 'https://image.tmdb.org/t/p/w500/kmcqlZGaSh20zpTbuoF0Cdn07dT.jpg',
                    'imdbId' => 'tt2948372',
                    'genres' => ['Animasi', 'Petualangan'],
                    'reason' => 'Soul mengajakmu menilai ulang prioritas ketika mood belum jelas arahnya.',
                ],
                [
                    'title' => 'The Peanut Butter Falcon',
                    'year' => 2019,
                    'tagline' => 'Sahabat anyar di perjalanan penuh kejutan.',
                    'posterUrl' => 'https://image.tmdb.org/t/p/w500/8Sh5vX5MBqSsI1qSk7Q4dK1rRRe.jpg',
                    'imdbId' => 'tt4364194',
                    'genres' => ['Petualangan', 'Drama'],
                    'reason' => 'Cerita hangat ini memberi dorongan lembut saat mood belum menemukan bentuknya.',
                ],
            ],
        ],
    ];

    /**
     * Bangun rekomendasi film berdasarkan analisis mingguan.
     *
     * @param array<string, mixed>|null $analysis
     * @return array<string, mixed>
     */
    public function buildRecommendations(?array $analysis): array
    {
        $rawMood = (string) Arr::get($analysis, 'dominantMood', '');
        $rawScore = Arr::get($analysis, 'moodScore');
        $moodScore = is_numeric($rawScore) ? (int) $rawScore : null;
        $normalizedMood = $this->normalizeMood($rawMood);

        $category = $this->resolveCategory($normalizedMood, $moodScore);
        $config = $this->catalog[$category] ?? $this->catalog[self::DEFAULT_CATEGORY];

        $moodLabel = $normalizedMood !== '' ? $normalizedMood : 'kondisi kamu';
        $headline = $this->formatCopy($config['headline'], $moodLabel);
        $description = $this->formatCopy($config['description'], $moodLabel);

        $items = array_slice($config['movies'], 0, 3);

        return [
            'category' => $category,
            'moodLabel' => $normalizedMood !== '' ? $normalizedMood : null,
            'headline' => $headline,
            'description' => $description,
            'items' => array_map(function (array $movie) use ($moodLabel) {
                return [
                    'title' => $movie['title'],
                    'year' => $movie['year'],
                    'tagline' => $movie['tagline'],
                    'posterUrl' => $movie['posterUrl'] ?? null,
                    'imdbId' => $movie['imdbId'] ?? null,
                    'genres' => $movie['genres'] ?? [],
                    'reason' => $this->formatCopy($movie['reason'], $moodLabel),
                ];
            }, $items),
        ];
    }

    /**
     * Tentukan kategori rekomendasi berdasarkan mood dan skor mood.
     * Catatan: logika sederhana berbasis keyword + skor agar mudah diatur ulang tanpa API eksternal.
     */
    private function resolveCategory(string $normalizedMood, ?int $moodScore): string
    {
        $haystack = Str::lower($normalizedMood);

        foreach ($this->catalog as $category => $config) {
            foreach ($config['keywords'] as $keyword) {
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

        return self::DEFAULT_CATEGORY;
    }

    private function normalizeMood(string $mood): string
    {
        return (string) Str::of($mood)->lower()->trim();
    }

    private function formatCopy(string $copy, string $moodLabel): string
    {
        return Str::contains($copy, '%s') ? sprintf($copy, $moodLabel) : $copy;
    }
}
