/**
 * Smart trailer selection utility
 * Prioritizes: TMDB Video Size (1080/2160) + Official Flag + Date (newest first) + Quality keywords (Official, Final, 4K, HD)
 * 
 * @param {Array} videos - Array of video objects from TMDB API
 * @returns {Object|null} - Best trailer video object or null
 */
export function selectBestTrailer(videos) {
    if (!videos || videos.length === 0) return null;

    // Filter for YouTube trailers only
    const trailers = videos.filter(v => v.type === 'Trailer' && v.site === 'YouTube');

    if (trailers.length === 0) {
        // Fallback: return first video if no trailers exist
        return videos[0];
    }

    // Quality keywords ranking (higher score = better)
    const qualityKeywords = {
        '4K': 100,
        'UHD': 100,
        '1080P': 80,
        'FINAL': 70,
        'OFFICIAL': 60,
        'HD': 50,
        'INTERNATIONAL': 30,
        'TEASER': -50, // Heavily deprioritize teasers
    };

    // Score each trailer
    const scoredTrailers = trailers.map(trailer => {
        let score = 0;
        const name = (trailer.name || '').toUpperCase();

        // 1. Prioritize by TMDB Video resolution size
        if (trailer.size) {
            if (trailer.size >= 2160) score += 500;
            else if (trailer.size >= 1080) score += 300;
            else if (trailer.size >= 720) score += 100;
        }

        // 2. Prioritize Official TMDB flag
        if (trailer.official) {
            score += 200;
        }

        // 3. Add points for quality keywords in name
        Object.keys(qualityKeywords).forEach(keyword => {
            if (name.includes(keyword)) {
                score += qualityKeywords[keyword];
            }
        });

        // 4. Add date score (newer = better)
        // Published date might not always exist, handle gracefully
        const publishedDate = trailer.published_at ? new Date(trailer.published_at).getTime() : 0;

        return {
            ...trailer,
            score,
            publishedDate,
        };
    });

    // Sort by: 1) Score (quality + official + size), 2) Date (newest first)
    scoredTrailers.sort((a, b) => {
        if (b.score !== a.score) {
            return b.score - a.score; // Higher score first
        }
        return b.publishedDate - a.publishedDate; // Newer first
    });

    // Return the best trailer (first in sorted list)
    return scoredTrailers[0];
}
