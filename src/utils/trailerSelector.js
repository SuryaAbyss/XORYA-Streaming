/**
 * Smart trailer selection utility adhering to XORYA Hero Trailer System v2
 * Prioritizes: Official Trailer -> Final Trailer -> Main Trailer -> Trailer #1
 * Rejects: Featurette, TV Spot, Clip, Interview, Fan Upload
 *
 * @param {Array} videos - Array of video objects from TMDB API
 * @returns {Object|null} - Best trailer video object or null
 */
export function selectBestTrailer(videos) {
    if (!videos || videos.length === 0) return null;

    const excludedTypes = ['Featurette', 'TV Spot', 'Clip', 'Interview', 'Behind the Scenes'];

    // Filter for YouTube trailers, ignoring non-trailers
    const candidateTrailers = videos.filter(v => {
        if (v.site !== 'YouTube') return false;
        if (excludedTypes.includes(v.type)) return false;
        
        const name = (v.name || '').toLowerCase();
        if (name.includes('featurette') || name.includes('tv spot') || name.includes('clip') || name.includes('interview')) {
            return false;
        }

        return v.type === 'Trailer' || name.includes('trailer');
    });

    if (candidateTrailers.length === 0) {
        // Fallback to any YouTube video if strictly no trailers found
        return videos.find(v => v.site === 'YouTube') || null;
    }

    // Score candidate trailers
    const scoredTrailers = candidateTrailers.map(trailer => {
        let score = 0;
        const name = (trailer.name || '').toUpperCase();

        // 1. Trailer Type Preference
        if (name.includes('OFFICIAL TRAILER')) score += 1000;
        else if (name.includes('FINAL TRAILER')) score += 800;
        else if (name.includes('MAIN TRAILER')) score += 600;
        else if (name.includes('TRAILER 1') || name.includes('TRAILER #1')) score += 400;
        else if (name.includes('TEASER')) score -= 500;

        // 2. Official TMDB Flag
        if (trailer.official) {
            score += 300;
        }

        // 3. Resolution bonus
        if (trailer.size) {
            if (trailer.size >= 2160) score += 400;
            else if (trailer.size >= 1080) score += 250;
            else if (trailer.size >= 720) score += 100;
        }

        // 4. Quality keywords
        if (name.includes('4K') || name.includes('UHD')) score += 150;
        if (name.includes('1080P') || name.includes('HD')) score += 100;

        const publishedDate = trailer.published_at ? new Date(trailer.published_at).getTime() : 0;

        return {
            ...trailer,
            score,
            publishedDate,
        };
    });

    // Sort by score (descending), then date (newest first)
    scoredTrailers.sort((a, b) => {
        if (b.score !== a.score) {
            return b.score - a.score;
        }
        return b.publishedDate - a.publishedDate;
    });

    return scoredTrailers[0];
}
