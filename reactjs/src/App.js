import { useState } from 'react';
import './App.css';
import { getRecommendations } from './services/recommendationService';
import { searchMovies } from './services/movieSearchService';

const DEFAULT_MOOD = 'Saya ingin film yang hangat dan membangkitkan semangat.';

function App() {
  const [mood, setMood] = useState(DEFAULT_MOOD);
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasFetched, setHasFetched] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('');
  const [searchYear, setSearchYear] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchTotalResults, setSearchTotalResults] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchHasFetched, setSearchHasFetched] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!mood.trim()) {
      setError('Deskripsi mood tidak boleh kosong.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const movies = await getRecommendations(mood);
      setRecommendations(movies);
      setHasFetched(true);
    } catch (fetchError) {
      setError(fetchError.message || 'Terjadi kesalahan saat mengambil rekomendasi.');
      setRecommendations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = async (event) => {
    event.preventDefault();

    if (!searchQuery.trim()) {
      setSearchError('Judul film tidak boleh kosong.');
      return;
    }

    if (searchYear && !/^\d{4}$/.test(searchYear)) {
      setSearchError('Tahun rilis harus terdiri dari 4 digit.');
      return;
    }

    setIsSearching(true);
    setSearchError('');
    setSearchHasFetched(false);
    setSearchResults([]);
    setSearchTotalResults(0);

    try {
      const { results, totalResults } = await searchMovies({
        query: searchQuery,
        type: searchType || undefined,
        year: searchYear || undefined,
        page: 1,
      });

      setSearchResults(results);
      setSearchTotalResults(totalResults);
      setSearchHasFetched(true);
    } catch (fetchError) {
      setSearchError(fetchError.message || 'Terjadi kesalahan saat mencari film.');
      setSearchResults([]);
      setSearchTotalResults(0);
      setSearchHasFetched(true);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchYearChange = (event) => {
    const nextValue = event.target.value;
    if (nextValue === '' || /^\d{0,4}$/.test(nextValue)) {
      setSearchYear(nextValue);
    }
  };

  const getPrimaryWatchProvider = (providers = []) => {
    if (!providers.length) {
      return null;
    }

    const preferredOrder = ['Netflix', 'Disney+', 'Prime Video'];
    const preferredProvider = providers.find((item) => preferredOrder.includes(item.provider));
    return preferredProvider || providers[0];
  };

  return (
    <div className="app-shell">
      <main className="content">
        <section className="hero">
          <h1>Temukan Film yang Cocok dengan Mood Kamu</h1>
          <p>
            Masukkan deskripsi mood atau suasana hati kamu. Kami akan bertanya ke model bahasa dan
            menggabungkannya dengan data TMDB & Letterboxd untuk merangkai rekomendasi film yang
            relevan.
          </p>
          <form className="mood-form" onSubmit={handleSubmit}>
            <label htmlFor="mood-input" className="form-label">
              Mood kamu hari ini
            </label>
            <textarea
              id="mood-input"
              className="mood-input"
              value={mood}
              onChange={(event) => setMood(event.target.value)}
              rows={3}
              placeholder="Contoh: Butuh film yang bikin semangat lagi tapi tetap ringan."
            />
            <button type="submit" className="submit-button" disabled={isLoading}>
              {isLoading ? 'Mencari...' : 'Dapatkan rekomendasi'}
            </button>
          </form>
          {error && <p className="error-text">{error}</p>}
        </section>

        <section className="search-section">
          <h2>Cari Judul Film</h2>
          <p>
            Gunakan katalog OMDB untuk menemukan film, serial, atau episode berdasarkan judul yang kamu
            masukkan.
          </p>
          <form className="mood-form search-form" onSubmit={handleSearchSubmit}>
            <label htmlFor="search-input" className="form-label">
              Judul film
            </label>
            <div className="search-input-row">
              <input
                id="search-input"
                type="text"
                className="search-input"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Contoh: The Matrix"
                disabled={isSearching}
              />
              <button type="submit" className="submit-button" disabled={isSearching}>
                {isSearching ? 'Mencari...' : 'Cari film'}
              </button>
            </div>
            <div className="search-filters">
              <label className="filter-field">
                <span>Jenis</span>
                <select
                  className="select-input"
                  value={searchType}
                  onChange={(event) => setSearchType(event.target.value)}
                  disabled={isSearching}
                >
                  <option value="">Semua</option>
                  <option value="movie">Film</option>
                  <option value="series">Serial</option>
                  <option value="episode">Episode</option>
                </select>
              </label>
              <label className="filter-field">
                <span>Tahun rilis</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="\\d{4}"
                  maxLength={4}
                  className="year-input"
                  value={searchYear}
                  onChange={handleSearchYearChange}
                  placeholder="Contoh: 1999"
                  disabled={isSearching}
                />
              </label>
            </div>
            {searchError && <p className="error-text">{searchError}</p>}
          </form>

          <div className="search-results">
            {isSearching && <p className="status-text">Mengambil data dari OMDB...</p>}
            {!isSearching && searchHasFetched && !searchResults.length && !searchError ? (
              <p className="status-text">Tidak menemukan judul yang cocok.</p>
            ) : null}
            {!isSearching && searchResults.length ? (
              <p className="status-text search-summary">
                Menampilkan {searchResults.length} dari {searchTotalResults} hasil.
              </p>
            ) : null}
            <div className="card-grid">
              {searchResults.map((movie) => (
                <article key={movie.imdbId || movie.title} className="movie-card">
                  {movie.posterUrl ? (
                    <img
                      src={movie.posterUrl}
                      alt={movie.title}
                      className="movie-poster"
                      loading="lazy"
                    />
                  ) : (
                    <div className="poster-placeholder" aria-hidden="true">
                      <span>🎬</span>
                    </div>
                  )}
                  <div className="movie-content">
                    <header>
                      <h2>{movie.title}</h2>
                    </header>
                    <p className="movie-meta">
                      {movie.year || 'Tahun tidak diketahui'}
                      {movie.type ? ` • ${movie.type.charAt(0).toUpperCase()}${movie.type.slice(1)}` : ''}
                    </p>
                    {movie.imdbUrl ? (
                      <a
                        className="watch-button"
                        href={movie.imdbUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Lihat di IMDb
                      </a>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="recommendations">
          {isLoading && !recommendations.length ? (
            <p className="status-text">Mengumpulkan rekomendasi untukmu...</p>
          ) : null}

          {!isLoading && hasFetched && !recommendations.length && !error ? (
            <p className="status-text">Belum ada rekomendasi untuk mood tersebut.</p>
          ) : null}

          <div className="card-grid">
            {recommendations.map((movie) => {
              const primaryProvider = getPrimaryWatchProvider(movie.watchProviders);
              return (
                <article key={movie.id || movie.title} className="movie-card">
                  {movie.posterUrl ? (
                    <img
                      src={movie.posterUrl}
                      alt={movie.title}
                      className="movie-poster"
                      loading="lazy"
                    />
                  ) : (
                    <div className="poster-placeholder" aria-hidden="true">
                      <span>🎬</span>
                    </div>
                  )}
                  <div className="movie-content">
                    <header>
                      <h2>{movie.title}</h2>
                      {movie.letterboxdUrl ? (
                        <a
                          className="letterboxd-link"
                          href={movie.letterboxdUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Lihat di Letterboxd ↗
                        </a>
                      ) : null}
                    </header>
                    {movie.overview ? <p className="movie-overview">{movie.overview}</p> : null}
                    {primaryProvider ? (
                      <a
                        className="watch-button"
                        href={primaryProvider.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Tonton sekarang di {primaryProvider.provider}
                      </a>
                    ) : null}
                    {!primaryProvider && movie.watchProviders?.length ? (
                      <div className="provider-list">
                        {movie.watchProviders.map((provider) => (
                          <a
                            key={provider.provider}
                            className="secondary-provider"
                            href={provider.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {provider.provider}
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
