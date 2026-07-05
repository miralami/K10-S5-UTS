"""
AI Analysis gRPC Server

This server provides journal mood analysis using Google Gemini API.
It exposes three RPCs:
- AnalyzeDaily: Analyze a single day's journal notes
- AnalyzeWeekly: Aggregate daily summaries into a weekly report
- AnalyzeWritingStyle: Analyze writing style and find author doppelgänger
"""

import os
import json
import logging
from concurrent import futures
from pathlib import Path

import grpc
from dotenv import load_dotenv
import google.generativeai as genai

# Import generated protobuf code
import ai_pb2
import ai_pb2_grpc

# Import writing style analysis functions
from writing_style import (
    analyze_text,
    find_doppelganger,
    AUTHOR_PROFILES,
)

# Import movie recommendation functions
from movie_recommendations import (
    get_movie_recommendations,
    MovieRecommendationResult,
)

# Load environment variables from backend/.env
env_path = Path(__file__).parent.parent / 'backend' / '.env'
load_dotenv(dotenv_path=env_path)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
GRPC_PORT = os.getenv('GRPC_PORT', '50052')
GRPC_BIND_ADDRESS = os.getenv('GRPC_BIND_ADDRESS', '0.0.0.0')
GEMINI_MODEL = os.getenv('GEMINI_MODEL', 'gemini-2.0-flash')
GOOGLE_API_KEY = os.getenv('GOOGLE_GENAI_API_KEY', '')

if not GOOGLE_API_KEY:
    logger.warning("GOOGLE_GENAI_API_KEY not set. AI analysis will fail.")


def configure_gemini():
    """Configure the Gemini API client."""
    if GOOGLE_API_KEY:
        genai.configure(api_key=GOOGLE_API_KEY)
        return genai.GenerativeModel(GEMINI_MODEL)
    return None


def build_daily_prompt(notes: list, date: str) -> str:
    """Build the prompt for daily journal analysis."""
    if not notes:
        return f"""Anda adalah mentor journaling yang empatik. Tidak ada catatan yang ditulis pada {date}.
Berikan tanggapan dalam format JSON dengan struktur:
{{
  "summary": string,
  "dominantMood": string,
  "moodScore": number (0-100),
  "highlights": string[],
  "advice": string[],
  "affirmation": string
}}
Gunakan bahasa Indonesia."""

    notes_text = "\n\n---\n\n".join([
        f"Waktu: {note.created_at}\nJudul: {note.title or 'Tanpa judul'}\nIsi: {note.body or '(tidak ada isi)'}"
        for note in notes
    ])

    return f"""Anda adalah mentor journaling yang empatik. Tinjau catatan harian yang ditulis pada {date}.

Catatan:
{notes_text}

Berikan tanggapan dalam format JSON dengan struktur:
{{
  "summary": string,
  "dominantMood": string,
  "moodScore": number (0-100),
  "highlights": string[],
  "advice": string[],
  "affirmation": string
}}
Gunakan bahasa Indonesia dan sertakan rujukan spesifik ke catatan saat relevan."""


def build_weekly_prompt(daily_summaries: list, week_start: str, week_end: str) -> str:
    """Build the prompt for weekly journal analysis."""
    if not daily_summaries:
        return f"""Anda adalah analis jurnal mingguan. Tidak ada aktivitas jurnal antara {week_start} dan {week_end}.
Berikan tanggapan dalam format JSON:
{{
  "summary": string,
  "dominantMood": string,
  "moodScore": number (0-100),
  "highlights": string[],
  "advice": string[],
  "affirmation": string
}}
Gunakan bahasa Indonesia yang hangat."""

    summaries_text = "\n\n---\n\n".join([
        f"Tanggal: {s.date}\nRingkasan: {s.summary}\nMood dominan: {s.dominant_mood} (skor: {s.mood_score})\n"
        f"Highlight: {'; '.join(s.highlights) if s.highlights else 'Tidak ada'}\n"
        f"Saran: {'; '.join(s.advice) if s.advice else 'Tidak ada'}"
        for s in daily_summaries
    ])

    return f"""Anda adalah analis jurnal mingguan. Berikut adalah rangkuman harian antara {week_start} dan {week_end}.

Rangkuman harian:
{summaries_text}

Ringkaslah perkembangan emosi mingguan, sebutkan mood dominan, sorotan penting, saran tindak lanjut, dan afirmasi motivasi. Balas dalam format JSON:
{{
  "summary": string,
  "dominantMood": string,
  "moodScore": number (0-100),
  "highlights": string[],
  "advice": string[],
  "affirmation": string
}}
Gunakan bahasa Indonesia yang hangat."""


def parse_gemini_response(text: str) -> dict:
    """Parse Gemini response text into a dictionary."""
    try:
        # Try to parse as JSON directly
        return json.loads(text)
    except json.JSONDecodeError:
        # If parsing fails, return a default response
        return {
            "summary": text.strip() if text else "Tidak ada tanggapan dari AI.",
            "dominantMood": "unknown",
            "moodScore": 0,
            "highlights": [],
            "advice": [],
            "affirmation": None
        }


def dict_to_analysis_result(data: dict) -> ai_pb2.AnalysisResult:
    """Convert a dictionary to an AnalysisResult protobuf message."""
    return ai_pb2.AnalysisResult(
        summary=data.get("summary", ""),
        dominant_mood=data.get("dominantMood", "unknown"),
        mood_score=data.get("moodScore", 0) or 0,
        highlights=data.get("highlights", []),
        advice=data.get("advice", []),
        affirmation=data.get("affirmation", "") or ""
    )


class AIAnalysisServicer(ai_pb2_grpc.AIAnalysisServiceServicer):
    """Implementation of the AI Analysis gRPC service."""

    def __init__(self):
        self.model = configure_gemini()

    def AnalyzeDaily(self, request, context):
        """Analyze a single day's journal notes."""
        logger.info(f"AnalyzeDaily called for user {request.user_id}, date {request.date}")

        if not self.model:
            context.set_code(grpc.StatusCode.UNAVAILABLE)
            context.set_details("Gemini API not configured")
            return ai_pb2.AnalysisResult()

        try:
            prompt = build_daily_prompt(list(request.notes), request.date)
            
            response = self.model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    response_mime_type="application/json"
                )
            )

            result_dict = parse_gemini_response(response.text)
            logger.info(f"Daily analysis completed for {request.date}")
            return dict_to_analysis_result(result_dict)

        except Exception as e:
            logger.error(f"Error in AnalyzeDaily: {e}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(str(e))
            return ai_pb2.AnalysisResult(
                summary="Gagal menganalisis jurnal harian.",
                dominant_mood="error"
            )

    def AnalyzeWeekly(self, request, context):
        """Analyze a week based on daily summaries."""
        logger.info(f"AnalyzeWeekly called for user {request.user_id}, "
                    f"week {request.week_start} to {request.week_end}")

        if not self.model:
            context.set_code(grpc.StatusCode.UNAVAILABLE)
            context.set_details("Gemini API not configured")
            return ai_pb2.AnalysisResult()

        try:
            prompt = build_weekly_prompt(
                list(request.daily_summaries),
                request.week_start,
                request.week_end
            )

            response = self.model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    response_mime_type="application/json"
                )
            )

            result_dict = parse_gemini_response(response.text)
            logger.info(f"Weekly analysis completed for week {request.week_start}")
            return dict_to_analysis_result(result_dict)

        except Exception as e:
            logger.error(f"Error in AnalyzeWeekly: {e}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(str(e))
            return ai_pb2.AnalysisResult(
                summary="Gagal menganalisis jurnal mingguan.",
                dominant_mood="error"
            )

    def AnalyzeWritingStyle(self, request, context):
        """Analyze writing style and find the closest author match."""
        logger.info(f"AnalyzeWritingStyle called for user {request.user_id}, "
                    f"with {len(request.texts)} text entries")

        try:
            # Combine all texts into one for analysis
            combined_text = "\n".join(request.texts)
            
            if not combined_text or len(combined_text.strip()) < 50:
                context.set_code(grpc.StatusCode.INVALID_ARGUMENT)
                context.set_details("Not enough text to analyze (minimum 50 characters)")
                return ai_pb2.WritingStyleResult()

            # Analyze the text
            style = analyze_text(combined_text)
            
            if not style:
                context.set_code(grpc.StatusCode.INVALID_ARGUMENT)
                context.set_details("Could not analyze the provided text")
                return ai_pb2.WritingStyleResult()

            # Find author matches
            matches = find_doppelganger(style)
            
            # Build the response
            top_author, top_score = matches[0]
            top_match = ai_pb2.AuthorMatch(
                name=top_author.name,
                nationality=top_author.nationality,
                score=top_score,
                description=top_author.description,
                fun_fact=top_author.fun_fact
            )
            
            other_matches = []
            for author, score in matches[1:5]:  # Top 4 runner-ups
                other_matches.append(ai_pb2.AuthorMatch(
                    name=author.name,
                    nationality=author.nationality,
                    score=score,
                    description=author.description,
                    fun_fact=author.fun_fact
                ))
            
            # Extract top words as simple strings
            top_words = [f"{word} ({count}x)" for word, count in style.top_words]
            
            result = ai_pb2.WritingStyleResult(
                total_words=style.total_words,
                total_sentences=style.total_sentences,
                avg_sentence_length=style.avg_sentence_length,
                vocabulary_richness=style.vocabulary_richness,
                punctuation_density=style.punctuation_density,
                avg_word_length=style.avg_word_length,
                detected_language=style.language,
                top_words=top_words,
                top_match=top_match,
                other_matches=other_matches
            )
            
            logger.info(f"Writing style analysis completed for user {request.user_id}. "
                       f"Top match: {top_author.name} ({top_score:.1f}%)")
            return result

        except Exception as e:
            logger.error(f"Error in AnalyzeWritingStyle: {e}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(str(e))
            return ai_pb2.WritingStyleResult()

    def GetMovieRecommendations(self, request, context):
        """Get movie recommendations based on mood analysis."""
        logger.info(f"GetMovieRecommendations called for user {request.user_id}, "
                    f"mood: {request.dominant_mood}, score: {request.mood_score}")

        try:
            # Get recommendations (uses AI if available, fallback otherwise)
            result = get_movie_recommendations(
                model=self.model,
                mood=request.dominant_mood,
                mood_score=request.mood_score if request.mood_score > 0 else None,
                summary=request.summary,
                highlights=list(request.highlights) if request.highlights else [],
                affirmation=request.affirmation
            )

            # Convert to protobuf message
            movie_items = []
            for item in result.items:
                movie_items.append(ai_pb2.MovieItem(
                    title=item.title,
                    year=item.year,
                    tagline=item.tagline,
                    imdb_id=item.imdb_id or "",
                    genres=item.genres,
                    reason=item.reason,
                    poster_url=item.poster_url or ""
                ))

            response = ai_pb2.MovieRecommendationResult(
                category=result.category,
                mood_label=result.mood_label,
                headline=result.headline,
                description=result.description,
                items=movie_items
            )

            logger.info(f"Movie recommendations completed for user {request.user_id}. "
                       f"Category: {result.category}, Items: {len(result.items)}")
            return response

        except Exception as e:
            logger.error(f"Error in GetMovieRecommendations: {e}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(str(e))
            return ai_pb2.MovieRecommendationResult()


def serve():
    """Start the gRPC server."""
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    ai_pb2_grpc.add_AIAnalysisServiceServicer_to_server(
        AIAnalysisServicer(), server
    )

    server.add_insecure_port(f'{GRPC_BIND_ADDRESS}:{GRPC_PORT}')
    server.start()
    logger.info(f"AI Analysis gRPC server started on port {GRPC_PORT}")

    try:
        server.wait_for_termination()
    except KeyboardInterrupt:
        logger.info("Shutting down server...")
        server.stop(0)


if __name__ == '__main__':
    serve()
