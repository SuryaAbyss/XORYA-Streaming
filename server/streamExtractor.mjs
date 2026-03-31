/**
 * streamExtractor.mjs  (v3)
 * -----------------------------------------
 * Uses puppeteer-extra + stealth plugin to bypass bot detection.
 * Tries multiple embed sources in order of reliability.
 */

import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { executablePath } from 'puppeteer'; // get the real path from base puppeteer

// Apply all stealth evasions
puppeteerExtra.use(StealthPlugin());

const TIMEOUT_MS = 35000;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// ─── URL scoring ───────────────────────────────────────────────────────────────
function scoreUrl(url) {
    let score = 0;
    if (/index\.m3u8/i.test(url)) score += 10;
    if (/\.m3u8/i.test(url)) score += 5;
    if (/720|1080|hd/i.test(url)) score += 3;
    if (/\.mp4/i.test(url)) score += 4;
    if (/master/i.test(url)) score -= 2;
    return score;
}

function isStreamUrl(url) {
    if (!/\.m3u8|\.mp4/i.test(url)) return false;
    const skip = ['google', 'analytics', 'facebook', 'pixel', 'doubleclick', 'gtag', 'fonts.google'];
    return !skip.some(d => url.includes(d));
}

/**
 * Build ordered list of embed URLs to try — most reliable first.
 * vidsrc.to and vidsrc.me are generally open and cloud-friendly.
 */
function buildEmbedUrls(server, contentType, tmdbId, season, episode) {
    // Cloud-friendly sources first
    const vidsrc = contentType === 'tv'
        ? `https://vidsrc.to/embed/tv/${tmdbId}/${season}/${episode}`
        : `https://vidsrc.to/embed/movie/${tmdbId}`;

    const vidsrc2 = contentType === 'tv'
        ? `https://vidsrc.me/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`
        : `https://vidsrc.me/embed/movie?tmdb=${tmdbId}`;

    const vidfast = contentType === 'tv'
        ? `https://vidfast.pro/tv/${tmdbId}/${season}/${episode}?autoPlay=true&theme=00bcd4`
        : `https://vidfast.pro/movie/${tmdbId}?autoPlay=true&theme=00bcd4`;

    const vidking = contentType === 'tv'
        ? `https://www.vidking.net/embed/tv/${tmdbId}/${season}/${episode}?color=00bcd4&autoPlay=true`
        : `https://www.vidking.net/embed/movie/${tmdbId}?color=00bcd4&autoPlay=true`;

    // If user explicitly chose vidfast or vidking, put that first but still fallback
    if (server === 'vidfast') return [vidfast, vidsrc, vidsrc2, vidking];
    if (server === 'vidking') return [vidking, vidsrc, vidsrc2, vidfast];
    return [vidsrc, vidsrc2, vidfast, vidking]; // default order
}

/**
 * Try a single embed URL with puppeteer. Returns candidates or empty array.
 */
async function tryEmbed(embedUrl) {
    console.log(`  [extractor] Trying: ${embedUrl}`);

    // Remove broken Docker env path — puppeteer must use its own cache
    delete process.env.PUPPETEER_EXECUTABLE_PATH;

    const browser = await puppeteerExtra.launch({
        headless: true,
        executablePath: executablePath(), // from base puppeteer, always correct
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-blink-features=AutomationControlled',
            '--disable-web-security',
            '--autoplay-policy=no-user-gesture-required',
            '--window-size=1280,720',
        ],
        defaultViewport: { width: 1280, height: 720 },
    });

    const page = await browser.newPage();
    await page.setUserAgent(UA);
    await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    });

    const candidates = [];

    await page.setRequestInterception(true);
    page.on('request', (req) => {
        const url = req.url();
        if (isStreamUrl(url)) {
            const score = scoreUrl(url);
            if (!candidates.find(c => c.url === url)) {
                console.log(`  [intercept] score=${score}: ${url}`);
                candidates.push({ url, headers: req.headers(), score });
            }
        }
        req.continue();
    });

    page.on('response', (res) => {
        const url = res.url();
        if (isStreamUrl(url) && !candidates.find(c => c.url === url)) {
            const score = scoreUrl(url);
            console.log(`  [response]  score=${score}: ${url}`);
            candidates.push({ url, headers: {}, score });
        }
    });

    try {
        await page.goto(embedUrl, { waitUntil: 'networkidle2', timeout: TIMEOUT_MS });
        await new Promise(r => setTimeout(r, 5000));

        // Try clicking anything that may trigger playback
        const selectors = ['video', '[class*="play"]', '[id*="play"]', 'button', '.vjs-big-play-button'];
        for (const sel of selectors) {
            try { await page.click(sel); console.log(`  [click] ${sel}`); } catch (_) {}
        }

        await new Promise(r => setTimeout(r, 6000));
    } catch (err) {
        console.log(`  [extractor] Nav error (ok if URLs found): ${err.message}`);
    }

    let cookieString = '';
    try {
        const cookies = await page.cookies();
        cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');
        console.log(`  [extractor] ${cookies.length} cookies captured`);
    } catch (_) {}

    await browser.close();

    return { candidates, cookieString, embedUrl };
}

/**
 * Extract an authenticated stream result. Tries multiple sources.
 * @returns {Promise<StreamResult>}
 */
export async function extractStreamUrls({ server = 'vidsrc', contentType = 'movie', tmdbId, season = 1, episode = 1 }) {
    const urls = buildEmbedUrls(server, contentType, tmdbId, season, episode);

    for (const embedUrl of urls) {
        try {
            const { candidates, cookieString } = await tryEmbed(embedUrl);

            if (candidates.length > 0) {
                candidates.sort((a, b) => b.score - a.score);
                const best = candidates[0];
                console.log(`  [extractor] SUCCESS from ${embedUrl}`);
                return {
                    url: best.url,
                    allUrls: candidates.map(c => c.url),
                    headers: best.headers,
                    referer: best.headers?.referer || embedUrl,
                    cookies: cookieString || best.headers?.cookie || '',
                };
            }

            console.log(`  [extractor] No URLs from ${embedUrl}, trying next...`);
        } catch (err) {
            console.log(`  [extractor] Error from ${embedUrl}: ${err.message}, trying next...`);
        }
    }

    // All sources failed
    return { url: null, allUrls: [], headers: {}, referer: '', cookies: '' };
}
