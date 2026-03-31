/**
 * streamExtractor.mjs  (v4 - yt-dlp based)
 * -----------------------------------------
 * Uses yt-dlp to extract stream URLs — far more reliable than Puppeteer
 * because yt-dlp has built-in extraction logic for hundreds of embed sites
 * and its own bot-detection evasions.
 */

import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);
const YTDLP = 'yt-dlp';

function buildEmbedUrl(server, contentType, tmdbId, season, episode) {
    if (server === 'vidsrc') {
        return contentType === 'tv'
            ? `https://vidsrc.to/embed/tv/${tmdbId}/${season}/${episode}`
            : `https://vidsrc.to/embed/movie/${tmdbId}`;
    }
    if (server === 'vidsrc2') {
        return contentType === 'tv'
            ? `https://vidsrc.me/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`
            : `https://vidsrc.me/embed/movie?tmdb=${tmdbId}`;
    }
    if (server === 'vidfast') {
        return contentType === 'tv'
            ? `https://vidfast.pro/tv/${tmdbId}/${season}/${episode}?autoPlay=true`
            : `https://vidfast.pro/movie/${tmdbId}?autoPlay=true`;
    }
    if (server === 'vidking') {
        return contentType === 'tv'
            ? `https://www.vidking.net/embed/tv/${tmdbId}/${season}/${episode}`
            : `https://www.vidking.net/embed/movie/${tmdbId}`;
    }
    return null;
}

/**
 * Try to get the stream URL using yt-dlp.
 * yt-dlp returns the best direct stream URL without needing a browser.
 */
async function tryYtDlp(url) {
    console.log(`  [yt-dlp] Trying: ${url}`);
    try {
        const { stdout } = await execFileAsync(YTDLP, [
            '--no-warnings',
            '--get-url',
            '--no-playlist',
            '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
            '--add-header', `Referer:${url}`,
            '--add-header', 'Accept-Language:en-US,en;q=0.9',
            url,
        ], { timeout: 30000 });

        const streamUrl = stdout.trim().split('\n')[0];
        if (streamUrl && (streamUrl.includes('.m3u8') || streamUrl.includes('.mp4') || streamUrl.startsWith('http'))) {
            console.log(`  [yt-dlp] SUCCESS: ${streamUrl}`);
            return { url: streamUrl, referer: url };
        }
        return null;
    } catch (err) {
        console.log(`  [yt-dlp] Failed for ${url}: ${err.message}`);
        return null;
    }
}

/**
 * Extract an authenticated stream result.
 * Tries multiple embed sources using yt-dlp.
 * @returns {Promise<StreamResult>}
 */
export async function extractStreamUrls({ server = 'vidsrc', contentType = 'movie', tmdbId, season = 1, episode = 1 }) {
    // Build ordered list of sources to try
    const sourceOrder = ['vidsrc', 'vidsrc2', 'vidfast', 'vidking'];
    
    // Put the user-selected server first
    const ordered = [server, ...sourceOrder.filter(s => s !== server)];

    for (const src of ordered) {
        const embedUrl = buildEmbedUrl(src, contentType, tmdbId, season, episode);
        if (!embedUrl) continue;

        const result = await tryYtDlp(embedUrl);
        if (result) {
            return {
                url: result.url,
                allUrls: [result.url],
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
                    'Referer': result.referer,
                },
                referer: result.referer,
                cookies: '',
            };
        }

        console.log(`  [extractor] No stream from ${src}, trying next...`);
    }

    // All sources failed
    return { url: null, allUrls: [], headers: {}, referer: '', cookies: '' };
}
