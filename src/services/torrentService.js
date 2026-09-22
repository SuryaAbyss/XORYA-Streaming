/**
 * Torrent & Magnet Service for XORYA
 * -----------------------------------
 * Communicates with the local backend to search live releases,
 * extract exact file sizes, seed counts, and generate tracker-packed magnets.
 */

export const formatBytes = (bytes, decimals = 2) => {
    if (!bytes || bytes === 0) return 'Unknown Size';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const sanitizeQuery = (str) => {
    if (!str) return '';
    return str
        .replace(/[:\-–—]/g, ' ')
        .replace(/[^\w\s]/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
};

async function executeSearchQuery(queryStr, type = 'movie') {
    const clean = queryStr.trim();
    if (!clean) return [];

    try {
        const res = await fetch(`/api/torrents/search?query=${encodeURIComponent(clean)}&type=${type}`);
        if (res.ok) {
            const data = await res.json();
            if (data.results && data.results.length > 0) {
                return data.results;
            }
        }
    } catch (err) {
        console.warn('[TorrentService] Search error:', err.message);
    }
    return [];
}

/**
 * Searches torrent releases for a given title and context
 */
export async function searchTorrents({ title, year, season, episode, type = 'movie' }) {
    const cleanTitle = sanitizeQuery(title);
    if (!cleanTitle) return [];

    let query = cleanTitle;
    if (type === 'tv' && season !== undefined && episode !== undefined) {
        const sStr = String(season).padStart(2, '0');
        const eStr = String(episode).padStart(2, '0');
        query = `${cleanTitle} S${sStr}E${eStr}`;
    } else if (year) {
        query = `${cleanTitle} ${year}`;
    }

    let results = await executeSearchQuery(query, type);

    // Auto-fallback: If query with year returned 0 results (e.g. "Forgotten Island 2026"), retry with clean title
    if (results.length === 0 && query !== cleanTitle) {
        results = await executeSearchQuery(cleanTitle, type);
    }

    return results;
}

/**
 * Direct search by arbitrary query string
 */
export async function searchTorrentsByQuery(queryStr, type = 'movie') {
    return await executeSearchQuery(queryStr, type);
}

/**
 * Triggers the local desktop terminal to launch torlink
 * Supports both downloading a specific release directly, or launching the interactive search hub
 */
export async function launchTorlinkTerminal(param) {
    try {
        const payload = typeof param === 'string'
            ? { query: param }
            : {
                query: param?.query || '',
                magnet: param?.magnet || '',
                title: param?.title || ''
            };

        const res = await fetch('/api/torrents/terminal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        return await res.json();
    } catch (err) {
        console.error('[TorrentService] Failed to launch terminal:', err);
        throw err;
    }
}
