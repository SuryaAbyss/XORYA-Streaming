import axios from 'axios';

const API_KEY = 'b1f6f35f0eeb0ded1ab9ed6896d06d10';
const BASE_URL = 'https://api.tmdb.org/3';

const tmdb = axios.create({
  baseURL: BASE_URL,
  params: {
    api_key: API_KEY,
  },
});

export const getTrendingMovies = (page = 1) => tmdb.get('/trending/movie/day', { params: { page } });
export const getTrendingMoviesWeek = (page = 1) => tmdb.get('/trending/movie/week', { params: { page } });
export const getUpcomingMovies = () => tmdb.get('/movie/upcoming');
export const getTopRatedMovies = () => tmdb.get('/movie/top_rated');
export const getPopularMovies = () => tmdb.get('/movie/popular');
export const getActionMovies = () => tmdb.get('/discover/movie?with_genres=28');
export const getComedyMovies = () => tmdb.get('/discover/movie?with_genres=35');
export const getHorrorMovies = () => tmdb.get('/discover/movie?with_genres=27');
export const getRomanceMovies = () => tmdb.get('/discover/movie?with_genres=10749');
export const getDocumentaries = () => tmdb.get('/discover/movie?with_genres=99');
export const getSciFiMovies = () => tmdb.get('/discover/movie?with_genres=878');

// TV Show Category APIs
export const getTrendingTVShows = (page = 1) => tmdb.get('/trending/tv/day', { params: { page } });
export const getTrendingTVShowsWeek = (page = 1) => tmdb.get('/trending/tv/week', { params: { page } });
export const getPopularTVShows = () => tmdb.get('/discover/tv?sort_by=popularity.desc&without_genres=16');
export const getTopRatedTVShows = () => tmdb.get('/discover/tv?sort_by=vote_average.desc&vote_count.gte=500&without_genres=16');
export const getActionTVShows = () => tmdb.get('/discover/tv?with_genres=10759&without_genres=16'); // Action & Adventure
export const getComedyTVShows = () => tmdb.get('/discover/tv?with_genres=35&without_genres=16');
export const getDramaTVShows = () => tmdb.get('/discover/tv?with_genres=18&without_genres=16');
export const getAiringTodayTVShows = () => tmdb.get('/tv/airing_today');
export const getOnTheAirTVShows = () => tmdb.get('/tv/on_the_air');
export const getSciFiTVShows = () => tmdb.get('/discover/tv?with_genres=10765&without_genres=16');
export const getMysteryTVShows = () => tmdb.get('/discover/tv?with_genres=9648&without_genres=16');
export const getCrimeTVShows = () => tmdb.get('/discover/tv?with_genres=80&without_genres=16');
export const getDocumentaryTVShows = () => tmdb.get('/discover/tv?with_genres=99&without_genres=16');

// Extra Movie Category APIs
export const getCrimeMovies = () => tmdb.get('/discover/movie?with_genres=80');
export const getThrillerMovies = () => tmdb.get('/discover/movie?with_genres=53');

// Anime APIs (Genre ID 16 is Animation)
export const getAnimeTVShows = () => tmdb.get('/discover/tv?with_genres=16');
export const getAnimeMovies = () => tmdb.get('/discover/movie?with_genres=16');
export const getAnimeAction = () => tmdb.get('/discover/tv?with_genres=16,10759');
export const getAnimeFantasy = () => tmdb.get('/discover/tv?with_genres=16,10765');
export const getAnimeComedy = () => tmdb.get('/discover/tv?with_genres=16,35');

// Documentaries APIs
export const getCrimeDocs = () => tmdb.get('/discover/movie?with_genres=99,80');
export const getHistoryDocs = () => tmdb.get('/discover/movie?with_genres=99,36');
export const getScienceDocs = () => tmdb.get('/discover/movie?with_genres=99,10787');


export const searchMovies = (query) => tmdb.get(`/search/movie?query=${query}`);
export const getMovieDetails = (id) => tmdb.get(`/movie/${id}?append_to_response=videos,credits`);
export const getMovieImages = (id) => tmdb.get(`/movie/${id}/images?include_image_language=en,null`);
export const getMovieVideos = (id) => tmdb.get(`/movie/${id}/videos`);
export const getCollectionDetails = (id) => tmdb.get(`/collection/${id}`);
export const getMovieRecommendations = (id) => tmdb.get(`/movie/${id}/recommendations`);

// Person APIs
export const getPersonDetails = (id) => tmdb.get(`/person/${id}`);
export const getPersonCombinedCredits = (id) => tmdb.get(`/person/${id}/combined_credits`);

// TV Show APIs
export const getTVShowDetails = (id) => tmdb.get(`/tv/${id}?append_to_response=videos,credits`);
export const getTVShowImages = (id) => tmdb.get(`/tv/${id}/images?include_image_language=en,null`);
export const getTVShowRecommendations = (id) => tmdb.get(`/tv/${id}/recommendations`);
export const getTVSeasonDetails = async (id, season) => {
  const response = await tmdb.get(`/tv/${id}/season/${season}`);
  return response.data;
};
export const getSeasonDetails = getTVSeasonDetails; // Alias for consistency

export const searchMulti = async (query) => {
  if (!query || query.trim().length < 2) return { results: [] };
  const response = await tmdb.get('/search/multi', {
    params: { query: query.trim(), page: 1 }
  });
  return response.data;
};
// Helper for image URLs
// sizes: w300, w780, w1280, original
export const imageUrl = (path, size = 'original') => {
  if (!path) return '';
  return `https://image.tmdb.org/t/p/${size}${path}`;
};

export const getWatchProviders = (type) => tmdb.get(`/watch/providers/${type}?watch_region=US`);
export const getDiscoverByProvider = (providerId, type = 'movie') => {
  return tmdb.get(`/discover/${type}`, {
    params: {
      with_watch_providers: providerId,
      watch_region: 'US',
      sort_by: 'popularity.desc',
      without_genres: type === 'tv' ? '16' : '',
    }
  });
};

export default tmdb;
