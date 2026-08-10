/**
 * imdb.js
 * Integrated IMDb API with 24-Hour LocalStorage Cache & Dynamic Reload Shuffling.
 * Kept strictly separated per category!
 */

import { tmdb } from './tmdb';

const RAPIDAPI_KEY = '18230c05bbmsh3d56d37541e4fc0p109dcejsn3c1fcf7d091a';

const HEADERS_IMDB232 = {
    'x-rapidapi-key': RAPIDAPI_KEY,
    'x-rapidapi-host': 'imdb232.p.rapidapi.com',
    'Content-Type': 'application/json',
};

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 Hours Cache

// 1. POPULAR / TRENDING TV SHOWS RIGHT NOW (Current Hits)
const IMDB_POPULAR_TV_TITLES = [
    "House of the Dragon", "Ted Lasso", "Sterling Point", "Silo", "The Bear",
    "Fallout", "The Boys", "Stranger Things", "Wednesday", "Squid Game",
    "Shogun", "Severance", "Suits", "Yellowstone", "Reacher",
    "Monarch: Legacy of Monsters", "Loki", "Ahsoka", "The Last of Us", "Euphoria"
];

// 2. TOP RATED SERIES OF ALL TIME (Legendary Classics)
const IMDB_TOP_RATED_TV_TITLES = [
    "Breaking Bad", "Band of Brothers", "Chernobyl", "The Wire", "Game of Thrones",
    "The Sopranos", "Avatar: The Last Airbender", "Sherlock", "Fargo", "True Detective",
    "Peaky Blinders", "Better Call Saul", "Mindhunter", "Black Mirror", "Dark",
    "Narcos", "The Office", "Friends", "Twilight Zone", "Firefly"
];

// 3. TOP RATED MOVIES OF ALL TIME
const IMDB_TOP_RATED_MOVIE_TITLES = [
    "The Shawshank Redemption", "The Godfather", "The Dark Knight", "Pulp Fiction",
    "Schindler's List", "12 Angry Men", "Inception", "Fight Club", "The Lord of the Rings: The Return of the King",
    "Forrest Gump", "The Matrix", "Goodfellas", "One Flew Over the Cuckoo's Nest",
    "Seven", "Interstellar", "The Silence of the Lambs", "Saving Private Ryan",
    "City of God", "Life Is Beautiful", "Spirited Away", "The Green Mile", "Gladiator",
    "Whiplash", "The Prestige", "The Departed", "Django Unchained", "Memento"
];

// 4. TOP 10 MULTI-GENRE POOL (Movies & TV Shows across 16 genres)
const IMDB_TOP10_GENRE_POOL = [
    { title: "Mad Max: Fury Road", type: "movie", genre: "Action" },
    { title: "Breaking Bad", type: "tv", genre: "Crime" },
    { title: "Interstellar", type: "movie", genre: "Sci-Fi" },
    { title: "The Haunting of Hill House", type: "tv", genre: "Horror" },
    { title: "Spirited Away", type: "movie", genre: "Animation" },
    { title: "Game of Thrones", type: "tv", genre: "Fantasy" },
    { title: "The Dark Knight", type: "movie", genre: "Thriller" },
    { title: "Chernobyl", type: "tv", genre: "Historical" },
    { title: "The Grand Budapest Hotel", type: "movie", genre: "Comedy" },
    { title: "Sherlock", type: "tv", genre: "Mystery" },
    { title: "The Lord of the Rings: The Fellowship of the Ring", type: "movie", genre: "Adventure" },
    { title: "Succession", type: "tv", genre: "Drama" },
    { title: "La La Land", type: "movie", genre: "Romance" },
    { title: "Band of Brothers", type: "tv", genre: "War" },
    { title: "Django Unchained", type: "movie", genre: "Western" },
    { title: "Paddington 2", type: "movie", genre: "Family" },
    { title: "The Matrix", type: "movie", genre: "Sci-Fi" },
    { title: "Mindhunter", type: "tv", genre: "Crime" },
    { title: "Gladiator", type: "movie", genre: "Historical" },
    { title: "Severance", type: "tv", genre: "Thriller" },
    { title: "Spider-Man: Into the Spider-Verse", type: "movie", genre: "Animation" },
    { title: "Stranger Things", type: "tv", genre: "Mystery" },
    { title: "Pulp Fiction", type: "movie", genre: "Crime" },
    { title: "The Last of Us", type: "tv", genre: "Adventure" }
];

/**
 * Fisher-Yates shuffle helper
 */
function shuffleArray(arr) {
    const array = [...arr];
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

/**
 * Fetch actor news with LocalStorage Caching
 */
export async function getActorNews(imdbNameId, limit = 10) {
    if (!imdbNameId) return [];

    const cacheKey = `xorya_imdb_news_${imdbNameId}`;
    
    try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_TTL_MS && Array.isArray(data) && data.length > 0) {
                return data;
            }
        }
    } catch (e) {
        console.warn('LocalStorage read error:', e);
    }

    try {
        const url232 = `https://imdb232.p.rapidapi.com/api/actors/get-related-news?nm=${imdbNameId}&limit=${limit}`;
        const res = await fetch(url232, { method: 'GET', headers: HEADERS_IMDB232 });
        if (res.ok) {
            const json = await res.json();
            const edges = json?.data?.name?.news?.edges || [];
            if (edges.length > 0) {
                saveToCache(cacheKey, edges);
                return edges;
            }
        }
    } catch (err) {
        console.error('Provider imdb232 error:', err);
    }

    return [];
}

/**
 * Helper to resolve titles via TMDB and cache pool
 */
async function fetchAndCachePool(cacheKey, titles, mediaType) {
    let baseList = [];

    try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_TTL_MS && Array.isArray(data) && data.length > 0) {
                baseList = data;
            }
        }
    } catch (e) {
        console.warn('LocalStorage read error:', e);
    }

    if (!baseList.length) {
        try {
            const endpoint = mediaType === 'tv' ? '/search/tv' : '/search/movie';
            const tmdbResults = await Promise.allSettled(
                titles.map(async (titleName) => {
                    const searchRes = await tmdb.get(endpoint, { params: { query: titleName } });
                    const results = searchRes.data?.results || [];
                    const exact = results.find(r => (r.name || r.title || '').toLowerCase() === titleName.toLowerCase() && r.poster_path && r.backdrop_path);
                    return exact || results.find(r => r.poster_path && r.backdrop_path) || null;
                })
            );

            baseList = tmdbResults
                .filter(r => r.status === 'fulfilled' && r.value)
                .map(r => ({ ...r.value, media_type: mediaType }));

            if (baseList.length > 0) {
                saveToCache(cacheKey, baseList);
            }
        } catch (err) {
            console.error(`Failed to fetch pool for ${cacheKey}:`, err);
        }
    }

    return shuffleArray(baseList);
}

/**
 * 1. Popular / Trending TV Shows Right Now (Shuffled on reload)
 */
export async function getIMDbCuratedTVShows() {
    return fetchAndCachePool('xorya_imdb_popular_tv_pool_v4', IMDB_POPULAR_TV_TITLES, 'tv');
}

/**
 * 2. Top Rated TV Shows of All Time (Shuffled on reload)
 */
export async function getIMDbCuratedTopTVShows() {
    return fetchAndCachePool('xorya_imdb_top_rated_tv_pool_v4', IMDB_TOP_RATED_TV_TITLES, 'tv');
}

/**
 * 3. Top Rated Movies of All Time (Shuffled on reload)
 */
export async function getIMDbCuratedTopMovies() {
    return fetchAndCachePool('xorya_imdb_top_movies_pool_v4', IMDB_TOP_RATED_MOVIE_TITLES, 'movie');
}

/**
 * 4. Top 10 Discovery Mix (Movies + TV across diverse genres, shuffled on reload)
 */
export async function getIMDbTop10MixedPool() {
    const cacheKey = 'xorya_imdb_top10_mix_pool_v1';
    let baseList = [];

    try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_TTL_MS && Array.isArray(data) && data.length > 0) {
                baseList = data;
            }
        }
    } catch (e) {
        console.warn('LocalStorage read error:', e);
    }

    if (!baseList.length) {
        try {
            const tmdbResults = await Promise.allSettled(
                IMDB_TOP10_GENRE_POOL.map(async (item) => {
                    const endpoint = item.type === 'tv' ? '/search/tv' : '/search/movie';
                    const searchRes = await tmdb.get(endpoint, { params: { query: item.title } });
                    const results = searchRes.data?.results || [];
                    const exact = results.find(r => (r.name || r.title || '').toLowerCase() === item.title.toLowerCase() && r.poster_path && r.backdrop_path);
                    const match = exact || results.find(r => r.poster_path && r.backdrop_path);
                    return match ? { ...match, media_type: item.type, genre_category: item.genre } : null;
                })
            );

            baseList = tmdbResults
                .filter(r => r.status === 'fulfilled' && r.value)
                .map(r => r.value);

            if (baseList.length > 0) {
                saveToCache(cacheKey, baseList);
            }
        } catch (err) {
            console.error('Failed to fetch Top 10 mix pool:', err);
        }
    }

    // Shuffle pool and return top 10 items ensuring alternating Movie/TV and multi-genre diversity
    const shuffled = shuffleArray(baseList);
    const movies = shuffled.filter(i => i.media_type === 'movie');
    const tvShows = shuffled.filter(i => i.media_type === 'tv');

    const top10 = [];
    const maxLen = Math.max(movies.length, tvShows.length);
    for (let i = 0; i < maxLen && top10.length < 10; i++) {
        if (movies[i]) top10.push(movies[i]);
        if (tvShows[i] && top10.length < 10) top10.push(tvShows[i]);
    }

    return top10;
}

function saveToCache(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify({
            data,
            timestamp: Date.now()
        }));
    } catch (e) {
        console.warn('LocalStorage save error:', e);
    }
}
