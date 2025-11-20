const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api').replace(
  /\/$/,
  ''
);

const FALLBACK_RECOMMENDATIONS = [
  {
    id: 'mock-1',
    title: 'Inside Out (2015)',
    overview:
      'Joy, Sadness, Anger, Fear, and Disgust help Riley adjust to a new city while her inner world navigates change.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/2H1TmgdfNtsKlU9jKdeNyYL5y8T.jpg',
    letterboxdUrl: 'https://letterboxd.com/film/inside-out/',
    watchProviders: [
      {
        provider: 'Disney+',
        url: 'https://www.disneyplus.com/movies/inside-out/6GXXECXoXqE6',
      },
    ],
  },
  {
    id: 'mock-2',
    title: 'The Secret Life of Walter Mitty (2013)',
    overview:
      'Dreamer Walter Mitty embarks on a global journey to find a missing photo, discovering courage and wonder along the way.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/7LcBFIoK0nRm5kWvXI0VEkb24gH.jpg',
    letterboxdUrl: 'https://letterboxd.com/film/the-secret-life-of-walter-mitty-2013/',
    watchProviders: [
      {
        provider: 'Disney+',
        url: 'https://www.disneyplus.com/movies/the-secret-life-of-walter-mitty/6JPBMyZ4ytZH',
      },
    ],
  },
  {
    id: 'mock-3',
    title: 'Amélie (2001)',
    overview:
      'A whimsical Parisian waitress decides to change the lives of those around her for the better while grappling with her own isolation.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/xfg0SBDMzFwxXJeYyQFO03Tr0pz.jpg',
    letterboxdUrl: 'https://letterboxd.com/film/amelie/',
    watchProviders: [
      {
        provider: 'Prime Video',
        url: 'https://www.primevideo.com/detail/0KRGYJGV6F190XG9Y7BI9S0Q2Q',
      },
    ],
  },
];

const SHOULD_USE_FALLBACK = import.meta.env.VITE_USE_FALLBACK_RECS === 'true';

function isValidRecommendationsResponse(payload) {
  if (!payload || !Array.isArray(payload.recommendations)) {
    return false;
  }

  return payload.recommendations.every((item) => item && item.title);
}

export async function getRecommendations(moodDescription) {
  if (!moodDescription || !moodDescription.trim()) {
    throw new Error('Mood description is required.');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/recommendations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mood: moodDescription }),
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => null);
      const message = errorPayload?.message || 'Unable to fetch recommendations right now.';
      throw new Error(message);
    }

    const data = await response.json();

    if (!isValidRecommendationsResponse(data)) {
      throw new Error('Invalid recommendations payload received.');
    }

    return data.recommendations;
  } catch (error) {
    if (process.env.NODE_ENV === 'development' || SHOULD_USE_FALLBACK) {
      console.warn('[recommendationService] Using fallback recommendations.', error);
      return FALLBACK_RECOMMENDATIONS;
    }

    throw error;
  }
}
