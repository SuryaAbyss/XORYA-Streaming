/**
 * streamExtractor.mjs  (v2)
 * -----------------------------------------
 * Puppeteer module that:
 *   1. Intercepts the actual .m3u8 / .mp4 stream URL
 *   2. Captures request headers (including cookies, referer, origin)
 *      so that ffmpeg can replicate the same authenticated session
 *   3. Prefers index.m3u8 over master playlists (better quality locks)
 */

import puppeteer from 'puppeteer';

const TIMEOUT_MS = 30000;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// ─── URL scoring: higher = better candidate ───────────────────────────────────
function scoreUrl(url) {
    let score = 0;
    if (/index\.m3u8/i.test(url)) score += 10;   // Best: indexed playlist
    if (/\.m3u8/i.test(url)) score += 5;          // Good: any HLS playlist
    if (/720|1080|hd/i.test(url)) score += 3;     // Quality hint
    if (/\.mp4/i.test(url)) score += 4;           // Direct mp4 also great
    if (/master/i.test(url)) score -= 2;           // Master playlists are less ideal
    return score;
}

function isStreamUrl(url) {
    if (!/\.m3u8|\.mp4/i.test(url)) return false;
    const skip = ['google', 'analytics', 'facebook', 'pixel', 'doubleclick', 'gtag', 'fonts.google'];
    return !skip.some(d => url.includes(d));
}

function buildEmbedUrl(server, contentType, tmdbId, season, episode) {
    if (server === 'vidfast') {
        return contentType === 'tv'
            ? `https://vidfast.pro/tv/${tmdbId}/${season}/${episode}?autoPlay=true&theme=00bcd4`
            : `https://vidfast.pro/movie/${tmdbId}?autoPlay=true&theme=00bcd4`;
    }
    if (server === 'vidking') {
        return contentType === 'tv'
            ? `https://www.vidking.net/embed/tv/${tmdbId}/${season}/${episode}?color=00bcd4&autoPlay=true`
            : `https://www.vidking.net/embed/movie/${tmdbId}?color=00bcd4&autoPlay=true`;
    }
    return null;
}

/**
 * @typedef  {Object} StreamResult
 * @property {string}   url         - The best stream URL found
 * @property {string[]} allUrls     - All stream URLs intercepted
 * @property {Object}   headers     - Request headers to authenticate ffmpeg
 * @property {string}   referer     - Referer of the page that loaded the stream
 * @property {string}   cookies     - Serialised cookie string for the session
 */

/**
 * Extract an authenticated stream result.
 * @returns {Promise<StreamResult>}
 */
export async function extractStreamUrls({ server = 'vidfast', contentType = 'movie', tmdbId, season = 1, episode = 1 }) {
    const embedUrl = buildEmbedUrl(server, contentType, tmdbId, season, episode);
    if (!embedUrl) throw new Error(`Unknown server: ${server}`);

    console.log(`  [extractor] Launching browser for: ${embedUrl}`);
    
    // The docker image sets a broken PUPPETEER_EXECUTABLE_PATH. 
    // Delete it so Puppeteer uses the fresh binary downloaded into the cache.
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
        delete process.env.PUPPETEER_EXECUTABLE_PATH;
    }

    const browser = await puppeteer.launch({
        headless: true,
        // Use puppeteer's native resolution, deliberately ignoring broken Docker env paths
        executablePath: puppeteer.executablePath(),
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
            '--disable-web-security',
            '--autoplay-policy=no-user-gesture-required',
        ],
    });

    const page = await browser.newPage();

    // Spoof as a real Chrome browser
    await page.setUserAgent(UA);
    await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    });

    // ── Track all candidates ──────────────────────────────────────────────────
    /** @type {{ url: string, headers: Object, score: number }[]} */
    const candidates = [];

    // Intercept requests — capture URL + headers sent for stream fetches
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        const url = req.url();
        if (isStreamUrl(url)) {
            const score = scoreUrl(url);
            if (!candidates.find(c => c.url === url)) {
                console.log(`  [intercept] Found (score=${score}): ${url}`);
                candidates.push({
                    url,
                    headers: req.headers(),   // Includes cookie, referer, origin etc.
                    score,
                });
            }
        }
        req.continue();
    });

    // Also catch response urls (some players only fetch after interaction)
    page.on('response', (res) => {
        const url = res.url();
        if (isStreamUrl(url) && !candidates.find(c => c.url === url)) {
            const score = scoreUrl(url);
            console.log(`  [response]  Found (score=${score}): ${url}`);
            candidates.push({ url, headers: {}, score });
        }
    });

    try {
        await page.goto(embedUrl, { waitUntil: 'networkidle2', timeout: TIMEOUT_MS });
        await new Promise(r => setTimeout(r, 4000));

        // Try clicking the video element / play button to trigger stream
        try { await page.click('video'); console.log('  [click] video'); } catch (_) {}
        try { await page.click('[class*="play"]'); console.log('  [click] play btn'); } catch (_) {}

        await new Promise(r => setTimeout(r, 5000));
    } catch (err) {
        console.log(`  [extractor] Timeout/error (ok if URLs found): ${err.message}`);
    }

    // Grab ALL cookies from the page (for the iframe domain too)
    let cookieString = '';
    try {
        const cookies = await page.cookies();
        cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');
        console.log(`  [extractor] Captured ${cookies.length} cookies`);
    } catch (_) {}

    await browser.close();

    if (candidates.length === 0) {
        return { url: null, allUrls: [], headers: {}, referer: embedUrl, cookies: '' };
    }

    // Sort by score descending — pick the best URL
    candidates.sort((a, b) => b.score - a.score);
    const best = candidates[0];

    return {
        url: best.url,
        allUrls: candidates.map(c => c.url),
        headers: best.headers,
        referer: best.headers?.referer || embedUrl,
        cookies: cookieString || best.headers?.cookie || '',
    };
}
