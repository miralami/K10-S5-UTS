// Movie search feature removed.
// This service previously proxied calls to /movies/search, but the user-facing
// movie search was intentionally removed to focus on Mood & movie recommendations.
// Keep a clear failure function so any accidental calls fail fast with a helpful message.

export async function searchMovies() {
  throw new Error(
    'Movie search has been removed from this application. Use the recommendations endpoint once integrated.'
  );
}
