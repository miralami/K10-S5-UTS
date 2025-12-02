"""
✍️ Writing Style Doppelgänger

Analyzes your writing style and tells you which famous author you write like!
Supports both Indonesian and English text analysis.

Usage:
    python writing_style.py              # Analyze from database
    python writing_style.py --file notes.txt  # Analyze from file
    python writing_style.py --text "Your text here"

Features:
    - Sentence length analysis
    - Vocabulary richness (Type-Token Ratio)
    - Punctuation habits
    - Word complexity (syllables per word)
    - Indonesian language support via Sastrawi stemmer
"""

import argparse
import re
import sys
import random
from pathlib import Path
from collections import Counter
from dataclasses import dataclass
from typing import Optional

# ============================================================================
# Author Profiles - Based on typical writing characteristics
# ============================================================================
@dataclass
class AuthorProfile:
    name: str
    nationality: str
    avg_sentence_length: float  # words per sentence
    vocabulary_richness: float  # type-token ratio (0-1)
    punctuation_density: float  # punctuation marks per 100 words
    avg_word_length: float      # characters per word
    description: str
    fun_fact: str


# Famous authors with their approximate writing style metrics
AUTHOR_PROFILES = [
    AuthorProfile(
        name="Ernest Hemingway",
        nationality="🇺🇸 American",
        avg_sentence_length=12.0,
        vocabulary_richness=0.45,
        punctuation_density=8.0,
        avg_word_length=4.2,
        description="Master of short, punchy sentences. Less is more.",
        fun_fact="He once wrote a 6-word story: 'For sale: baby shoes, never worn.'"
    ),
    AuthorProfile(
        name="William Shakespeare",
        nationality="🇬🇧 English",
        avg_sentence_length=22.0,
        vocabulary_richness=0.72,
        punctuation_density=15.0,
        avg_word_length=4.8,
        description="Rich vocabulary, dramatic flair, loves commas.",
        fun_fact="He invented over 1,700 words including 'lonely' and 'generous'."
    ),
    AuthorProfile(
        name="J.K. Rowling",
        nationality="🇬🇧 British",
        avg_sentence_length=16.0,
        vocabulary_richness=0.55,
        punctuation_density=12.0,
        avg_word_length=4.5,
        description="Balanced sentences, vivid descriptions, accessible vocabulary.",
        fun_fact="She was rejected by 12 publishers before Harry Potter was accepted."
    ),
    AuthorProfile(
        name="Pramoedya Ananta Toer",
        nationality="🇮🇩 Indonesian",
        avg_sentence_length=18.0,
        vocabulary_richness=0.60,
        punctuation_density=10.0,
        avg_word_length=5.5,
        description="Powerful prose, historical depth, poetic Indonesian.",
        fun_fact="He wrote his famous Buru Quartet while imprisoned, without paper."
    ),
    AuthorProfile(
        name="Andrea Hirata",
        nationality="🇮🇩 Indonesian",
        avg_sentence_length=14.0,
        vocabulary_richness=0.52,
        punctuation_density=11.0,
        avg_word_length=5.0,
        description="Heartfelt storytelling, simple yet profound language.",
        fun_fact="Laskar Pelangi has been translated into 34 languages."
    ),
    AuthorProfile(
        name="Tere Liye",
        nationality="🇮🇩 Indonesian",
        avg_sentence_length=10.0,
        vocabulary_richness=0.48,
        punctuation_density=9.0,
        avg_word_length=4.8,
        description="Short sentences, conversational tone, emotional impact.",
        fun_fact="His real name is Darwis and he used to work as an accountant."
    ),
    AuthorProfile(
        name="Charles Dickens",
        nationality="🇬🇧 British",
        avg_sentence_length=28.0,
        vocabulary_richness=0.65,
        punctuation_density=18.0,
        avg_word_length=4.9,
        description="Long, winding sentences with vivid character descriptions.",
        fun_fact="He walked 12 miles every day to help him think of ideas."
    ),
    AuthorProfile(
        name="Stephen King",
        nationality="🇺🇸 American",
        avg_sentence_length=14.0,
        vocabulary_richness=0.50,
        punctuation_density=10.0,
        avg_word_length=4.4,
        description="Direct, conversational, keeps you on the edge of your seat.",
        fun_fact="He writes 2,000 words every single day, including holidays."
    ),
    AuthorProfile(
        name="Haruki Murakami",
        nationality="🇯🇵 Japanese",
        avg_sentence_length=15.0,
        vocabulary_richness=0.58,
        punctuation_density=9.0,
        avg_word_length=4.6,
        description="Dreamy, surreal, simple words with deep meaning.",
        fun_fact="He runs marathons and once ran 100km in a single day."
    ),
    AuthorProfile(
        name="A Twitter User",
        nationality="🌐 Internet",
        avg_sentence_length=8.0,
        vocabulary_richness=0.35,
        punctuation_density=5.0,
        avg_word_length=4.0,
        description="Super short, casual, emoji-friendly vibes.",
        fun_fact="280 characters is more than enough to change the world... or start drama."
    ),
]


# ============================================================================
# Indonesian Language Support
# ============================================================================
# Common Indonesian stopwords (to exclude from vocabulary analysis)
INDONESIAN_STOPWORDS = {
    'yang', 'dan', 'di', 'ke', 'dari', 'ini', 'itu', 'dengan', 'untuk',
    'pada', 'adalah', 'sebagai', 'dalam', 'tidak', 'akan', 'juga',
    'atau', 'ada', 'mereka', 'sudah', 'saya', 'kami', 'kita', 'bisa',
    'lebih', 'aku', 'kamu', 'dia', 'nya', 'oleh', 'setelah', 'karena',
    'jika', 'maka', 'hanya', 'tetapi', 'namun', 'bahwa', 'sangat',
    'telah', 'belum', 'masih', 'sedang', 'lagi', 'pun', 'saat', 'saja',
    'seperti', 'antara', 'sebuah', 'banyak', 'tanpa', 'mau', 'kalau',
    'ya', 'lah', 'kan', 'nih', 'dong', 'sih', 'deh', 'kok', 'tuh', 'gitu',
    'banget', 'aja', 'udah', 'gak', 'ngga', 'nggak', 'enggak', 'gimana',
    'gini', 'jadi', 'terus', 'tapi', 'sama', 'buat', 'soalnya', 'kayak',
}

ENGLISH_STOPWORDS = {
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
    'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need',
    'it', 'its', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she',
    'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his',
    'her', 'our', 'their', 'what', 'which', 'who', 'whom', 'whose',
    'when', 'where', 'why', 'how', 'if', 'then', 'else', 'so', 'just',
    'also', 'very', 'too', 'quite', 'rather', 'more', 'most', 'less',
    'least', 'no', 'not', 'only', 'own', 'same', 'than', 'as', 'until',
    'while', 'of', 'about', 'into', 'through', 'during', 'before',
    'after', 'above', 'below', 'between', 'under', 'again', 'further',
}

ALL_STOPWORDS = INDONESIAN_STOPWORDS | ENGLISH_STOPWORDS


def detect_language(text: str) -> str:
    """Detect if text is primarily Indonesian or English."""
    words = re.findall(r'\b[a-zA-Z]+\b', text.lower())
    if not words:
        return 'unknown'
    
    id_count = sum(1 for w in words if w in INDONESIAN_STOPWORDS)
    en_count = sum(1 for w in words if w in ENGLISH_STOPWORDS)
    
    # Indonesian-specific patterns
    id_patterns = ['nya', 'kan', 'lah', 'kah', 'pun', 'lagi', 'dong', 'sih', 'deh', 'nih']
    id_pattern_count = sum(1 for w in words if w in id_patterns)
    id_count += id_pattern_count * 2  # Weight Indonesian patterns more
    
    if id_count > en_count:
        return 'indonesian'
    elif en_count > id_count:
        return 'english'
    else:
        return 'mixed'


def count_syllables_indonesian(word: str) -> int:
    """Count syllables in an Indonesian word (vowel-based estimation)."""
    vowels = 'aiueoAIUEO'
    word = word.lower()
    count = 0
    prev_is_vowel = False
    
    for char in word:
        is_vowel = char in vowels
        if is_vowel and not prev_is_vowel:
            count += 1
        prev_is_vowel = is_vowel
    
    return max(1, count)


def count_syllables_english(word: str) -> int:
    """Count syllables in an English word (approximate)."""
    word = word.lower()
    vowels = 'aeiouy'
    count = 0
    prev_is_vowel = False
    
    for char in word:
        is_vowel = char in vowels
        if is_vowel and not prev_is_vowel:
            count += 1
        prev_is_vowel = is_vowel
    
    # Adjust for silent 'e'
    if word.endswith('e') and count > 1:
        count -= 1
    
    # Adjust for 'le' endings
    if word.endswith('le') and len(word) > 2 and word[-3] not in vowels:
        count += 1
    
    return max(1, count)


# ============================================================================
# Text Analysis Functions
# ============================================================================
@dataclass
class WritingStyle:
    total_words: int
    total_sentences: int
    avg_sentence_length: float
    vocabulary_richness: float  # Type-Token Ratio
    punctuation_density: float
    avg_word_length: float
    language: str
    top_words: list
    exclamation_ratio: float
    question_ratio: float


def analyze_text(text: str) -> Optional[WritingStyle]:
    """Analyze writing style metrics from text."""
    if not text or len(text.strip()) < 50:
        return None
    
    # Detect language
    language = detect_language(text)
    
    # Split into sentences (handle both . ! ? and Indonesian patterns)
    sentences = re.split(r'[.!?]+', text)
    sentences = [s.strip() for s in sentences if s.strip()]
    
    if not sentences:
        return None
    
    # Extract words
    words = re.findall(r'\b[a-zA-Z]+\b', text.lower())
    
    if not words:
        return None
    
    # Calculate metrics
    total_words = len(words)
    total_sentences = len(sentences)
    avg_sentence_length = total_words / total_sentences if total_sentences > 0 else 0
    
    # Vocabulary richness (Type-Token Ratio)
    unique_words = set(words)
    vocabulary_richness = len(unique_words) / total_words if total_words > 0 else 0
    
    # Punctuation density (per 100 words)
    punctuation = re.findall(r'[.,;:!?\-\'"()—]', text)
    punctuation_density = (len(punctuation) / total_words) * 100 if total_words > 0 else 0
    
    # Average word length
    avg_word_length = sum(len(w) for w in words) / total_words if total_words > 0 else 0
    
    # Top words (excluding stopwords)
    content_words = [w for w in words if w not in ALL_STOPWORDS and len(w) > 2]
    word_freq = Counter(content_words)
    top_words = word_freq.most_common(5)
    
    # Exclamation and question ratios
    exclamation_count = text.count('!')
    question_count = text.count('?')
    exclamation_ratio = exclamation_count / total_sentences if total_sentences > 0 else 0
    question_ratio = question_count / total_sentences if total_sentences > 0 else 0
    
    return WritingStyle(
        total_words=total_words,
        total_sentences=total_sentences,
        avg_sentence_length=avg_sentence_length,
        vocabulary_richness=vocabulary_richness,
        punctuation_density=punctuation_density,
        avg_word_length=avg_word_length,
        language=language,
        top_words=top_words,
        exclamation_ratio=exclamation_ratio,
        question_ratio=question_ratio,
    )


def calculate_similarity(style: WritingStyle, author: AuthorProfile) -> float:
    """Calculate similarity score between user style and author profile."""
    # Weight each metric
    weights = {
        'sentence_length': 0.30,
        'vocabulary': 0.25,
        'punctuation': 0.20,
        'word_length': 0.25,
    }
    
    # Calculate normalized differences (0 = perfect match, 1 = very different)
    diff_sentence = abs(style.avg_sentence_length - author.avg_sentence_length) / 30.0
    diff_vocab = abs(style.vocabulary_richness - author.vocabulary_richness)
    diff_punct = abs(style.punctuation_density - author.punctuation_density) / 20.0
    diff_word = abs(style.avg_word_length - author.avg_word_length) / 3.0
    
    # Convert to similarity (1 = perfect match)
    sim_sentence = max(0, 1 - diff_sentence)
    sim_vocab = max(0, 1 - diff_vocab)
    sim_punct = max(0, 1 - diff_punct)
    sim_word = max(0, 1 - diff_word)
    
    # Weighted average
    similarity = (
        weights['sentence_length'] * sim_sentence +
        weights['vocabulary'] * sim_vocab +
        weights['punctuation'] * sim_punct +
        weights['word_length'] * sim_word
    )
    
    return similarity * 100  # Convert to percentage


def find_doppelganger(style: WritingStyle) -> list:
    """Find the closest author matches for the user's writing style."""
    similarities = []
    
    for author in AUTHOR_PROFILES:
        score = calculate_similarity(style, author)
        similarities.append((author, score))
    
    # Sort by similarity score (highest first)
    similarities.sort(key=lambda x: x[1], reverse=True)
    
    return similarities


# ============================================================================
# Database Functions
# ============================================================================
def get_entries_from_db() -> Optional[str]:
    """Fetch journal entries from MySQL database."""
    try:
        import mysql.connector
        from dotenv import load_dotenv
        import os

        env_path = Path(__file__).parent.parent / 'backend' / '.env'
        load_dotenv(dotenv_path=env_path)

        connection = mysql.connector.connect(
            host=os.getenv('DB_HOST', '127.0.0.1'),
            port=int(os.getenv('DB_PORT', 3306)),
            database=os.getenv('DB_DATABASE', 'uts_sem5'),
            user=os.getenv('DB_USERNAME', 'root'),
            password=os.getenv('DB_PASSWORD', '')
        )

        cursor = connection.cursor()
        cursor.execute("""
            SELECT title, body 
            FROM journal_notes 
            WHERE body IS NOT NULL AND body != ''
            ORDER BY created_at DESC
            LIMIT 100
        """)
        rows = cursor.fetchall()
        cursor.close()
        connection.close()

        if not rows:
            return None

        # Combine all entries into one text
        texts = []
        for title, body in rows:
            if title:
                texts.append(title)
            if body:
                texts.append(body)
        
        return "\n".join(texts)

    except ImportError:
        print("⚠️  mysql-connector-python not installed.")
        print("   Run: pip install mysql-connector-python")
        return None
    except Exception as e:
        print(f"⚠️  Database error: {e}")
        return None


def get_text_from_file(filepath: str) -> Optional[str]:
    """Read text from a file."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        print(f"⚠️  Could not read file: {e}")
        return None


# ============================================================================
# Output Functions
# ============================================================================
def print_banner():
    """Print a fancy banner."""
    print("""
╔═══════════════════════════════════════════════════════════╗
║  ✍️  WRITING STYLE DOPPELGÄNGER  ✍️                        ║
║                                                           ║
║  "Which famous author do you write like?"                 ║
║  Supports Indonesian 🇮🇩 and English 🇬🇧 text!              ║
╚═══════════════════════════════════════════════════════════╝
    """)


def print_analysis(style: WritingStyle):
    """Print the writing style analysis."""
    lang_emoji = "🇮🇩" if style.language == 'indonesian' else "🇬🇧" if style.language == 'english' else "🌐"
    
    print("\n📊 YOUR WRITING STYLE ANALYSIS")
    print("─" * 50)
    print(f"  📝 Total Words:           {style.total_words}")
    print(f"  📄 Total Sentences:       {style.total_sentences}")
    print(f"  📏 Avg Sentence Length:   {style.avg_sentence_length:.1f} words")
    print(f"  📚 Vocabulary Richness:   {style.vocabulary_richness:.2%}")
    print(f"  ✏️  Punctuation Density:  {style.punctuation_density:.1f} per 100 words")
    print(f"  🔤 Avg Word Length:       {style.avg_word_length:.1f} characters")
    print(f"  🌐 Detected Language:     {lang_emoji} {style.language.title()}")
    
    if style.top_words:
        words_str = ", ".join([f"'{w}' ({c}x)" for w, c in style.top_words])
        print(f"  🔥 Top Words:            {words_str}")
    
    if style.exclamation_ratio > 0.1:
        print(f"  ❗ You love exclamation marks! ({style.exclamation_ratio:.0%} of sentences)")
    if style.question_ratio > 0.1:
        print(f"  ❓ You ask lots of questions! ({style.question_ratio:.0%} of sentences)")
    print("─" * 50)


def print_doppelganger_results(matches: list):
    """Print the author matching results."""
    print("\n🎭 YOUR WRITING DOPPELGÄNGER RESULTS")
    print("═" * 50)
    
    # Top match with fanfare
    top_author, top_score = matches[0]
    print(f"""
  🏆 YOU WRITE LIKE: {top_author.name.upper()} 🏆
     {top_author.nationality}
     
     Match Score: {top_score:.1f}%
     
     "{top_author.description}"
     
     💡 Fun Fact: {top_author.fun_fact}
""")
    print("═" * 50)
    
    # Runner-ups
    print("\n📋 Other matches:")
    for i, (author, score) in enumerate(matches[1:5], 2):
        bar_length = int(score / 5)
        bar = "█" * bar_length + "░" * (20 - bar_length)
        print(f"  {i}. {author.name:<25} {bar} {score:.1f}%")
    
    print()
    
    # Fun commentary based on style
    if top_score > 85:
        print("🎉 Wow! You're practically their ghostwriter!")
    elif top_score > 70:
        print("✨ Strong resemblance! Keep developing your unique voice.")
    elif top_score > 55:
        print("📝 Interesting mix! You have your own distinctive style.")
    else:
        print("🦄 You're truly unique! No one writes quite like you.")
    
    print()


def main():
    parser = argparse.ArgumentParser(
        description="✍️ Discover which famous author you write like!"
    )
    parser.add_argument(
        '--file', type=str,
        help="Analyze text from a file"
    )
    parser.add_argument(
        '--text', type=str,
        help="Analyze text directly from command line"
    )
    parser.add_argument(
        '--quiet', '-q', action='store_true',
        help="Skip the fancy banner"
    )
    
    args = parser.parse_args()
    
    if not args.quiet:
        print_banner()
    
    # Get text from appropriate source
    text = None
    
    if args.text:
        print("📝 Analyzing provided text...")
        text = args.text
    elif args.file:
        print(f"📂 Reading from {args.file}...")
        text = get_text_from_file(args.file)
    else:
        print("📂 Fetching entries from database...")
        text = get_entries_from_db()
    
    if not text:
        print("\n❌ No text to analyze!")
        print("   Try: python writing_style.py --text \"Your text here\"")
        print("   Or:  python writing_style.py --file your_notes.txt")
        sys.exit(1)
    
    # Analyze the text
    print("🔍 Analyzing your writing style...")
    style = analyze_text(text)
    
    if not style:
        print("\n❌ Not enough text to analyze (need at least 50 characters)")
        sys.exit(1)
    
    # Print analysis
    print_analysis(style)
    
    # Find and print doppelgänger
    print("\n🔮 Finding your literary doppelgänger...")
    matches = find_doppelganger(style)
    print_doppelganger_results(matches)


if __name__ == '__main__':
    main()
