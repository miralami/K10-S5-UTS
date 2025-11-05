const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api').replace(/\/$/, '');

function buildSearchParams({ query, type, year, page }) {
  const params = new URLSearchParams();

  params.set('s', query.trim());

  if (type) {
    params.set('type', type);
  }

  if (year) {
    params.set('y', year);
  }

  params.set('page', String(page ?? 1));

  return params.toString();
}

function normalizeOmdbResult(item) {
  return {
    imdbId: item.imdbID,
    title: item.Title,
    year: item.Year,
    type: item.Type,
    posterUrl: item.Poster && item.Poster !== 'N/A' ? item.Poster : null,
    imdbUrl: item.imdbID ? `https://www.imdb.com/title/${item.imdbID}/` : null,
  };
}

export async function searchMovies({ query, type, year, page = 1 }) {
  if (!query || !query.trim()) {
    throw new Error('Judul pencarian diperlukan.');
  }

  const url = `${API_BASE_URL}/movies/search?${buildSearchParams({ query, type, year, page })}`;

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = payload?.message || 'Tidak dapat terhubung ke layanan pencarian film.';
    throw new Error(message);
  }

  if (payload?.Error) {
    throw new Error(payload.Error);
  }

  const results = Array.isArray(payload?.Search) ? payload.Search.map(normalizeOmdbResult) : [];

  return {
    results,
    totalResults: Number(payload?.totalResults) || results.length,
    page,
  };
}
