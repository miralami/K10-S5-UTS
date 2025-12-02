"""
🎬 Movie Recommendation Service

Generates personalized movie recommendations based on mood analysis.
Uses Google Gemini API for AI-powered suggestions with fallback to curated lists.
"""

import os
import json
import logging
from typing import Optional
from dataclasses import dataclass, field

import google.generativeai as genai

logger = logging.getLogger(__name__)


@dataclass
class MovieItem:
    title: str
    year: int
    tagline: str
    imdb_id: Optional[str] = None
    genres: list = field(default_factory=list)
    reason: str = ""
    poster_url: Optional[str] = None


@dataclass
class MovieRecommendationResult:
    category: str
    mood_label: str
    headline: str
    description: str
    items: list = field(default_factory=list)


# Fallback movie recommendations by category
FALLBACK_MOVIES = {
    'joyful': [
        MovieItem('La La Land', 2016, 'Musikal modern tentang mimpi dan cinta.', 'tt3783958', 
                  ['Musikal', 'Romansa'], 'Film penuh warna dan musik yang cocok untuk mempertahankan mood positifmu.'),
        MovieItem('The Grand Budapest Hotel', 2014, 'Komedi visual penuh warna.', 'tt2278388',
                  ['Komedi', 'Petualangan'], 'Humor unik dan visual cerah yang sempurna untuk menjaga semangatmu.'),
        MovieItem('Paddington 2', 2017, 'Petualangan beruang paling optimis.', 'tt4468740',
                  ['Keluarga', 'Komedi'], 'Kehangatan dan kebaikan yang akan membuat hatimu semakin ringan.'),
    ],
    'comfort': [
        MovieItem('About Time', 2013, 'Cinta dan kesempatan kedua.', 'tt2194499',
                  ['Drama', 'Romansa'], 'Kisah hangat yang mengingatkan pentingnya momen-momen kecil dalam hidup.'),
        MovieItem('Chef', 2014, 'Makanan hangat untuk hati lelah.', 'tt2883512',
                  ['Drama', 'Komedi'], 'Perjalanan menyembuhkan diri lewat passion dan keluarga.'),
        MovieItem('Little Women', 2019, 'Ikatan keluarga yang menghangatkan.', 'tt3281548',
                  ['Drama', 'Keluarga'], 'Kisah persaudaraan yang memberi ruang aman untuk perasaanmu.'),
    ],
    'grounding': [
        MovieItem('The Secret Life of Walter Mitty', 2013, 'Petualangan menemukan diri sendiri.', 'tt0359950',
                  ['Petualangan', 'Drama'], 'Inspirasi untuk melangkah keluar dari zona nyaman dengan tenang.'),
        MovieItem('Finding Nemo', 2003, 'Petualangan laut yang menenangkan.', 'tt0266543',
                  ['Animasi', 'Petualangan'], 'Keindahan laut dan humor ringan yang membantu meredakan pikiran.'),
        MovieItem('A Beautiful Day in the Neighborhood', 2019, 'Ketenangan ala Mr. Rogers.', 'tt3224458',
                  ['Drama', 'Biografi'], 'Pendekatan lembut untuk menghadapi emosi yang overwhelming.'),
    ],
    'reflective': [
        MovieItem('Her', 2013, 'Cinta di era digital.', 'tt1798709',
                  ['Drama', 'Romansa'], 'Film kontemplatif yang memberi ruang untuk introspeksi mendalam.'),
        MovieItem('Before Sunrise', 1995, 'Percakapan malam yang bermakna.', 'tt0112471',
                  ['Drama', 'Romansa'], 'Dialog mendalam yang cocok untuk suasana hati reflektif.'),
        MovieItem('Lost in Translation', 2003, 'Kesunyian Tokyo yang penuh arti.', 'tt0335266',
                  ['Drama'], 'Film tentang koneksi manusia yang cocok untuk momen merenung.'),
    ],
    'motivational': [
        MovieItem('The Pursuit of Happyness', 2006, 'Perjuangan mengejar mimpi.', 'tt0454921',
                  ['Drama', 'Biografi'], 'Kisah nyata yang membakar semangat untuk terus berjuang.'),
        MovieItem('Hidden Figures', 2016, 'Ilmuwan yang mengguncang batasan.', 'tt4846340',
                  ['Drama', 'Biografi'], 'Inspirasi untuk berani melampaui ekspektasi orang lain.'),
        MovieItem('Moneyball', 2011, 'Berpikir di luar kebiasaan.', 'tt1210166',
                  ['Drama', 'Olahraga'], 'Strategi dan keberanian untuk melakukan terobosan.'),
    ],
    'balanced': [
        MovieItem('Inside Out', 2015, 'Memahami emosi lewat petualangan.', 'tt2096673',
                  ['Animasi', 'Keluarga'], 'Film yang mengajarkan bahwa semua emosi punya tempatnya.'),
        MovieItem('Soul', 2020, 'Mencari makna hidup.', 'tt2948372',
                  ['Animasi', 'Petualangan'], 'Refleksi indah tentang apa yang membuat hidup bermakna.'),
        MovieItem('The Peanut Butter Falcon', 2019, 'Persahabatan di perjalanan.', 'tt4364194',
                  ['Petualangan', 'Drama'], 'Cerita hangat yang memberi dorongan lembut untuk hari-harimu.'),
    ],
}

HEADLINES = {
    'joyful': 'Pertahankan vibe positifmu!',
    'comfort': 'Pelukan hangat lewat layar.',
    'grounding': 'Teman penenang pikiran.',
    'reflective': 'Teman merenung penuh makna.',
    'motivational': 'Bahan bakar produktif.',
    'balanced': 'Pilihan hangat untuk mood yang campur aduk.',
}

DESCRIPTIONS = {
    'joyful': 'Film-film cerah ini siap menjaga semangatmu tetap tinggi sepanjang minggu.',
    'comfort': 'Saat hati butuh kehangatan, kisah-kisah lembut ini membantu terasa lebih ringan.',
    'grounding': 'Cerita menenangkan ini mengajakmu bernapas lebih pelan.',
    'reflective': 'Film bertempo lembut yang membantu merangkai sudut pandang baru.',
    'motivational': 'Kisah perjuangan inspiratif yang memantik aksi berikutnya.',
    'balanced': 'Tontonan seimbang penuh empati untuk mood yang belum pasti.',
}

# Mood keyword mapping
CATEGORY_KEYWORDS = {
    'joyful': ['bahagia', 'senang', 'gembira', 'ceria', 'optimis', 'positif', 'bersemangat', 'lega', 'happy', 'joy'],
    'comfort': ['sedih', 'murung', 'lelah', 'letih', 'kecewa', 'down', 'capek', 'patah', 'galau', 'sepi', 'sunyi', 'kesepian', 'sad'],
    'grounding': ['cemas', 'gelisah', 'khawatir', 'resah', 'stres', 'stress', 'tegang', 'panik', 'overwhelmed', 'kacau', 'takut', 'anxious'],
    'reflective': ['tenang', 'damai', 'reflektif', 'nostalgia', 'merenung', 'kontemplatif', 'campur', 'campuran', 'mixed', 'calm'],
    'motivational': ['termotivasi', 'ambisius', 'ambitious', 'fokus', 'produktif', 'berdaya', 'tekad', 'berani', 'gigih', 'semangat', 'motivated'],
}


def resolve_category(mood: str, mood_score: Optional[int]) -> str:
    """Resolve recommendation category based on mood and score."""
    mood_lower = mood.lower().strip()
    
    for category, keywords in CATEGORY_KEYWORDS.items():
        for keyword in keywords:
            if keyword in mood_lower:
                return category
    
    # Score-based fallback
    if mood_score is not None:
        if mood_score >= 70:
            return 'joyful'
        elif mood_score <= 40:
            return 'comfort'
        elif mood_score >= 55:
            return 'motivational'
    
    return 'balanced'


def build_recommendation_prompt(
    mood: str,
    mood_score: Optional[int],
    summary: str,
    highlights: list,
    affirmation: str
) -> str:
    """Build the prompt for Gemini AI movie recommendations."""
    mood_info = f"Mood dominan: {mood}" if mood else "Mood tidak teridentifikasi"
    score_info = f"Skor mood: {mood_score}/100" if mood_score else ""
    summary_info = f"Ringkasan minggu: {summary}" if summary else ""
    highlights_info = f"Highlights: {', '.join(highlights[:3])}" if highlights else ""
    affirmation_info = f"Afirmasi: {affirmation}" if affirmation else ""
    
    context_parts = [p for p in [mood_info, score_info, summary_info, highlights_info, affirmation_info] if p]
    context_str = "\n".join(context_parts)
    
    return f"""Kamu adalah asisten rekomendasi film yang ahli. Berdasarkan analisis mood mingguan pengguna berikut:

{context_str}

Berikan 3 rekomendasi film yang SANGAT SESUAI dengan kondisi emosional pengguna.

KRITERIA PEMILIHAN FILM:
- Jika mood positif (bahagia, senang, optimis): pilih film yang mempertahankan energi positif
- Jika mood sedih/lelah: pilih film yang menghangatkan hati dan memberi kenyamanan
- Jika mood cemas/stres: pilih film yang menenangkan dan grounding
- Jika mood reflektif/nostalgia: pilih film yang bermakna dan kontemplatif
- Jika mood termotivasi: pilih film yang inspiratif dan membangun semangat

Kembalikan dalam format JSON EXACT berikut:
{{
  "category": "string (joyful/comfort/grounding/reflective/motivational/balanced)",
  "headline": "string (judul bagian dalam bahasa Indonesia, personal dan hangat)",
  "description": "string (deskripsi singkat mengapa film-film ini cocok, dalam bahasa Indonesia)",
  "movies": [
    {{
      "title": "string (judul film dalam bahasa Inggris)",
      "year": number (tahun rilis),
      "tagline": "string (tagline singkat dalam bahasa Indonesia)",
      "imdbId": "string atau null (format: tt1234567)",
      "genres": ["string"] (maksimal 3 genre),
      "reason": "string (alasan personal mengapa film ini cocok untuk mood pengguna, dalam bahasa Indonesia)"
    }}
  ]
}}

PENTING:
- Pilih film-film yang BERAGAM (berbeda genre, tahun, style)
- Film harus NYATA dan TERKENAL (bukan fiksi)
- Alasan harus PERSONAL dan terkait langsung dengan kondisi mood pengguna
- Gunakan bahasa Indonesia yang hangat dan empatik"""


def get_ai_recommendations(
    model: genai.GenerativeModel,
    mood: str,
    mood_score: Optional[int],
    summary: str,
    highlights: list,
    affirmation: str
) -> Optional[MovieRecommendationResult]:
    """Get AI-generated movie recommendations from Gemini."""
    try:
        prompt = build_recommendation_prompt(mood, mood_score, summary, highlights, affirmation)
        
        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                temperature=0.7,
                top_p=0.95,
                top_k=40,
                max_output_tokens=2048,
            )
        )
        
        decoded = json.loads(response.text)
        
        items = []
        for movie in decoded.get('movies', []):
            items.append(MovieItem(
                title=movie.get('title', 'Unknown'),
                year=movie.get('year', 0),
                tagline=movie.get('tagline', ''),
                imdb_id=movie.get('imdbId'),
                genres=movie.get('genres', []),
                reason=movie.get('reason', 'Film yang cocok untuk mood kamu.'),
            ))
        
        return MovieRecommendationResult(
            category=decoded.get('category', 'ai-generated'),
            mood_label=mood if mood else '',
            headline=decoded.get('headline', 'Rekomendasi Film untuk Minggu Ini'),
            description=decoded.get('description', 'Film-film yang dipilih khusus berdasarkan mood mingguan kamu.'),
            items=items,
        )
        
    except Exception as e:
        logger.warning(f"AI movie recommendations failed: {e}")
        return None


def get_fallback_recommendations(mood: str, mood_score: Optional[int]) -> MovieRecommendationResult:
    """Get fallback recommendations when AI is unavailable."""
    category = resolve_category(mood, mood_score)
    
    movies = FALLBACK_MOVIES.get(category, FALLBACK_MOVIES['balanced'])
    headline = HEADLINES.get(category, HEADLINES['balanced'])
    description = DESCRIPTIONS.get(category, DESCRIPTIONS['balanced'])
    
    return MovieRecommendationResult(
        category=category,
        mood_label=mood.lower().strip() if mood else '',
        headline=headline,
        description=description,
        items=movies,
    )


def get_movie_recommendations(
    model: Optional[genai.GenerativeModel],
    mood: str,
    mood_score: Optional[int],
    summary: str = "",
    highlights: list = None,
    affirmation: str = ""
) -> MovieRecommendationResult:
    """
    Get movie recommendations based on mood analysis.
    Tries AI first, falls back to curated list if AI fails.
    """
    highlights = highlights or []
    
    # Try AI-generated recommendations first
    if model:
        result = get_ai_recommendations(model, mood, mood_score, summary, highlights, affirmation)
        if result and result.items:
            logger.info(f"AI-generated {len(result.items)} movie recommendations")
            return result
    
    # Fallback to curated recommendations
    logger.info("Using fallback movie recommendations")
    return get_fallback_recommendations(mood, mood_score)
