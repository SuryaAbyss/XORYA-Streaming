import Fuse from 'fuse.js';
import { searchMulti, getTrendingMovies, getTrendingTVShows, getPopularTVShows, getTopRatedMovies } from '../api/tmdb';

let localSearchData = [];
let fuseInstance = null;
let isCacheLoaded = false;
let recommendedContent = [];

export const initializeSearchCache = async () => {
    if (isCacheLoaded) return;
    try {
        const [trendM, trendT, popT, topM] = await Promise.all([
            getTrendingMovies(1),
            getTrendingTVShows(1),
            getPopularTVShows(),
            getTopRatedMovies()
        ]);

        const items = [
            ...(trendM.data?.results || []),
            ...(trendT.data?.results || []),
            ...(popT.data?.results || []),
            ...(topM.data?.results || [])
        ];

        const uniqueMap = new Map();
        items.forEach(item => {
            if (item.id && (item.title || item.name)) {
                // Ensure media_type is set for cards
                if (!item.media_type) {
                    item.media_type = item.name ? 'tv' : 'movie';
                }
                uniqueMap.set(item.id, item);
            }
        });

        localSearchData = Array.from(uniqueMap.values());
        
        // Save some good recommendations for empty states
        recommendedContent = localSearchData.filter(i => i.backdrop_path && i.poster_path).slice(0, 18);

        fuseInstance = new Fuse(localSearchData, {
            keys: [
                { name: 'title', weight: 1.0 },
                { name: 'name', weight: 1.0 },
                { name: 'original_title', weight: 0.5 },
                { name: 'original_name', weight: 0.5 }
            ],
            includeScore: true,
            threshold: 0.4, // Lower threshold = stricter matching
            distance: 100,
            ignoreLocation: true,
        });
        isCacheLoaded = true;
    } catch (error) {
        console.error("Failed to initialize search cache", error);
    }
};

export const getRecommendedSearchContent = () => {
    return recommendedContent;
};

export const enhancedSearch = async (query) => {
    if (!query || query.trim().length < 2) return { results: [] };

    // Initialize cache on first search if not already done
    if (!isCacheLoaded) {
        await initializeSearchCache();
    }

    // Normalizing query: handle spaces and minor special character cleanups
    // TMDB handles 'Spider-Man' well, but fails on 'Spiderman'. 
    // We keep spaces and alphanumeric chars.
    let normalizedQuery = query.toLowerCase().trim();
    // If the user types very weird characters, we can strip them, but TMDB handles most.

    let localResults = [];
    if (fuseInstance) {
        // Run fuzzy search on our local popular movies cache
        const fuzzyRes = fuseInstance.search(query.trim());
        // Only take the very best matches (score < 0.4 usually means a good fuzzy match)
        localResults = fuzzyRes.map(res => res.item);
    }

    let tmdbResults = [];
    try {
        // Query TMDB with original query and normalized
        const tmdbData = await searchMulti(query.trim());
        tmdbResults = tmdbData.results || [];
    } catch (e) {
        console.error("TMDB Search Error", e);
    }

    const mergedMap = new Map();

    // 1. Add TMDB results first as they are server-ranked (Exact matches)
    tmdbResults.forEach(item => {
        if (item.media_type === 'movie' || item.media_type === 'tv') {
            mergedMap.set(item.id, item);
        }
    });

    // 2. Mix in Fuse.js local results if they aren't already there (Typo matches)
    // This solves the "avenger" -> "The Avengers" and "spidrman" -> "Spider-Man" issue
    localResults.slice(0, 8).forEach(item => {
        if (!mergedMap.has(item.id)) {
            mergedMap.set(item.id, item);
        }
    });

    return { results: Array.from(mergedMap.values()) };
};
