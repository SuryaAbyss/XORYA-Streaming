/**
 * VidFast / VidKing Stream URL Extractor
 * ----------------------------------------
 * Uses Puppeteer to load the embed page in a headless browser and
 * intercepts all network requests to catch the actual .m3u8 / .mp4 stream URL.
 *
 * Usage:
 *   node scraper/vidfast_scraper.mjs <tmdb_id> <type> [season] [episode]
 *
 * Examples:
 *   node scraper/vidfast_scraper.mjs 550 movie
 *   node scraper/vidfast_scraper.mjs 1396 tv 1 1
 */

import puppeteer from 'puppeteer';

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const TIMEOUT_MS = 30000; // 30 seconds to wait for stream URL

// URL patterns that indicate a real video stream
const STREAM_PATTERNS = [
    /\.m3u8/i,
    /\.mp4/i,
    /\.mkv/i,
    /streamwish/i,
    /filemoon/i,
    /vidhide/i,
    /doodstream/i,
    /streamtape/i,
    /mixdrop/i,
    /upstream/i,
    /voe\.sx/i,
    /rabbitstream/i,
    /megacloud/i,
];

// ─── ARGS ─────────────────────────────────────────────────────────────────────
const [, , tmdbId, contentType = 'movie', season = '1', episode = '1'] = process.argv;

if (!tmdbId) {
    console.error('❌  Usage: node scraper/vidfast_scraper.mjs <tmdb_id> <movie|tv> [season] [episode]');
    process.exit(1);
}

// ─── BUILD URLS ───────────────────────────────────────────────────────────────
const urls = {
    vidfast: contentType === 'tv'
        ? `https://vidfast.pro/tv/${tmdbId}/${season}/${episode}?autoPlay=true&theme=00bcd4`
        : `https://vidfast.pro/movie/${tmdbId}?autoPlay=true&theme=00bcd4`,

    vidking: contentType === 'tv'
        ? `https://www.vidking.net/embed/tv/${tmdbId}/${season}/${episode}?color=00bcd4&autoPlay=true`
        : `https://www.vidking.net/embed/movie/${tmdbId}?color=00bcd4&autoPlay=true`,
};

// ─── SCRAPER ──────────────────────────────────────────────────────────────────
async function extractStreamUrl(serverName, embedUrl) {
    console.log(`\n🚀 [${serverName}] Loading: ${embedUrl}`);

    const browser = await puppeteer.launch({
        headless: 'new',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
        ],
    });

    const page = await browser.newPage();
    const foundUrls = [];

    // Spoof user agent to avoid bot detection
    await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    );

    // ── Intercept all network requests ──────────────────────────────────────
    page.on('request', (req) => {
        const url = req.url();
        for (const pattern of STREAM_PATTERNS) {
            if (pattern.test(url)) {
                // Filter out small tracker/analytics hits
                if (!url.includes('google') && !url.includes('analytics') && !url.includes('pixel')) {
                    if (!foundUrls.includes(url)) {
                        foundUrls.push(url);
                        console.log(`  ✅ Stream URL found: ${url}`);
                    }
                }
            }
        }
    });

    // ── Also intercept responses to catch late-stage XHR stream URLs ────────
    page.on('response', async (res) => {
        const url = res.url();
        for (const pattern of STREAM_PATTERNS) {
            if (pattern.test(url)) {
                if (!url.includes('google') && !url.includes('analytics')) {
                    if (!foundUrls.includes(url)) {
                        foundUrls.push(url);
                        console.log(`  ✅ Response stream URL found: ${url}`);
                    }
                }
            }
        }
    });

    try {
        await page.goto(embedUrl, { waitUntil: 'networkidle2', timeout: TIMEOUT_MS });

        // Wait a bit more for lazy-loaded video players (VidFast uses React)
        await new Promise(r => setTimeout(r, 5000));

        // Try clicking the play button if present (triggers stream fetch)
        try {
            await page.click('video');
            console.log('  🖱️  Clicked video player to trigger stream');
        } catch (_) {
            try {
                await page.click('.play-btn, [class*="play"], [id*="play"]');
                console.log('  🖱️  Clicked play button');
            } catch (_) {
                console.log('  ℹ️  No play button found, stream may auto-start');
            }
        }

        // Wait a bit longer after click for stream to initialize
        await new Promise(r => setTimeout(r, 5000));

    } catch (err) {
        console.log(`  ⚠️  Page load error: ${err.message}`);
    }

    await browser.close();
    return foundUrls;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
    console.log(`\n${'═'.repeat(60)}`);
    console.log(` XORYA Stream URL Extractor`);
    console.log(` Content: ${contentType.toUpperCase()} | TMDB ID: ${tmdbId}${contentType === 'tv' ? ` | S${season}E${episode}` : ''}`);
    console.log(`${'═'.repeat(60)}`);

    const results = {};

    for (const [serverName, embedUrl] of Object.entries(urls)) {
        const found = await extractStreamUrl(serverName, embedUrl);
        results[serverName] = found;
    }

    console.log(`\n${'═'.repeat(60)}`);
    console.log(' RESULTS SUMMARY');
    console.log(`${'═'.repeat(60)}`);

    for (const [server, urls] of Object.entries(results)) {
        if (urls.length === 0) {
            console.log(`\n❌  [${server}] No stream URLs found.`);
            console.log('    Possible reasons: Bot detection, behind DRM, requires user interaction');
        } else {
            console.log(`\n✅  [${server}] Found ${urls.length} stream URL(s):`);
            urls.forEach((url, i) => console.log(`    ${i + 1}. ${url}`));
        }
    }

    console.log('\n');
}

main().catch(console.error);
