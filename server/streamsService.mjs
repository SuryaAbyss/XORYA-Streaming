import axios from 'axios';
import {
    buildSignedHeaders,
    generateClientInfoAndUa,
    randomSpoofedIp
} from './movieboxCrypto.mjs';

const MOVIEBOX_HOSTS = [
    'https://api6.aoneroom.com',
    'https://api5.aoneroom.com',
    'https://api4.aoneroom.com',
    'https://api4sg.aoneroom.com',
    'https://api3.aoneroom.com',
    'https://api.inmoviebox.com'
];

let cachedSession = {
    token: null,
    expiresAt: 0,
    userAgent: null,
    clientInfo: null,
    spoofedIp: null
};

/**
 * Ensures a valid MovieBox session token
 */
async function ensureMovieBoxSession() {
    const now = Date.now();
    if (cachedSession.token && cachedSession.expiresAt > now) {
        return cachedSession;
    }

    const { userAgent, clientInfo } = generateClientInfoAndUa();
    const spoofedIp = randomSpoofedIp();

    for (const host of MOVIEBOX_HOSTS) {
        try {
            const url = `${host}/wefeed-mobile-bff/user-api/visitor-login`;
            const body = '{}';
            const headers = buildSignedHeaders('POST', url, body, null, userAgent, clientInfo, spoofedIp);

            const res = await axios.post(url, {}, { headers, timeout: 6000 });
            const token = res.data?.data?.token || res.data?.token;
            if (token) {
                cachedSession = {
                    token,
                    expiresAt: now + 3600 * 1000 * 12, // 12 hours validity
                    userAgent,
                    clientInfo,
                    spoofedIp
                };
                return cachedSession;
            }
        } catch {
            continue;
        }
    }

    return cachedSession;
}

/**
 * Execute signed request to MovieBox API
 */
async function requestMovieBox(method, path, body = null, query = null) {
    const session = await ensureMovieBoxSession();
    if (!session.token) return null;

    for (const host of MOVIEBOX_HOSTS) {
        try {
            let fullUrl = `${host}${path}`;
            if (query) {
                const searchParams = new URLSearchParams(query);
                fullUrl += `?${searchParams.toString()}`;
            }

            const bodyStr = body ? JSON.stringify(body) : (method === 'POST' ? '{}' : null);
            const headers = buildSignedHeaders(
                method,
                fullUrl,
                bodyStr,
                session.token,
                session.userAgent,
                session.clientInfo,
                session.spoofedIp
            );

            const config = { headers, timeout: 7000 };
            const res = method === 'POST'
                ? await axios.post(fullUrl, body || {}, config)
                : await axios.get(fullUrl, config);

            if (res.data?.data || res.data?.results) {
                return res.data?.data || res.data;
            }
        } catch {
            continue;
        }
    }
    return null;
}

/**
 * Parse audio languages from release title
 */
function detectAudioLanguages(title = '') {
    const t = title.toLowerCase();
    const langs = [];

    if (t.includes('hindi') || t.includes('hin')) langs.push('Hindi');
    if (t.includes('tamil') || t.includes('tam')) langs.push('Tamil');
    if (t.includes('telugu') || t.includes('tel')) langs.push('Telugu');
    if (t.includes('malayalam') || t.includes('mal')) langs.push('Malayalam');
    if (t.includes('kannada') || t.includes('kan')) langs.push('Kannada');
    if (t.includes('bengali') || t.includes('ben')) langs.push('Bengali');
    if (t.includes('japanese') || t.includes('jap')) langs.push('Japanese');
    if (t.includes('korean') || t.includes('kor')) langs.push('Korean');
    if (t.includes('spanish') || t.includes('spa')) langs.push('Spanish');
    if (t.includes('french') || t.includes('fre')) langs.push('French');
    if (t.includes('german') || t.includes('ger')) langs.push('German');
    if (t.includes('english') || t.includes('eng') || langs.length === 0 || t.includes('dual')) {
        langs.push('English');
    }

    // Deduplicate
    return Array.from(new Set(langs));
}

/**
 * Detect quality tag from release text
 */
function detectQuality(text = '') {
    const lower = text.toLowerCase();
    if (lower.includes('4k') || lower.includes('2160') || lower.includes('uhd')) {
        return '4K UHD';
    }
    if (lower.includes('1080') || lower.includes('fhd') || lower.includes('bluray') || lower.includes('web-dl') || lower.includes('remux')) {
        return '1080p FHD';
    }
    if (lower.includes('720') || lower.includes('hd')) {
        return '720p HD';
    }
    return '1080p FHD';
}

export const streamCache = new Map();

/**
 * Scrape MovieBox Streams
 */
async function fetchMovieBoxStreams(title, type, season = 1, episode = 1) {
    const streams = [];
    try {
        const session = await ensureMovieBoxSession();
        if (!session.token) return streams;

        const cleanTitle = title.replace(/[^a-zA-Z0-9\s]/g, ' ').trim();
        const searchBody = {
            keyword: cleanTitle,
            page: 1,
            perPage: 15,
            subjectType: 0
        };

        const searchData = await requestMovieBox('POST', '/wefeed-mobile-bff/subject-api/search/v2', searchBody);
        const results = searchData?.data?.results || searchData?.results || [];

        let matchedSubject = null;
        for (const resItem of results) {
            if (resItem.topicType === 'SUBJECT' && Array.isArray(resItem.subjects)) {
                // Look for closest match
                const sTarget = type === 'tv'
                    ? resItem.subjects.find(s => s.subjectType === 2 && s.title.toLowerCase().includes(cleanTitle.toLowerCase()))
                    : resItem.subjects.find(s => s.subjectType === 1 && s.title.toLowerCase().includes(cleanTitle.toLowerCase()));

                if (sTarget) {
                    matchedSubject = sTarget;
                    break;
                } else if (!matchedSubject && resItem.subjects.length > 0) {
                    matchedSubject = resItem.subjects[0];
                }
            }
        }

        if (!matchedSubject) return streams;

        const subjectId = matchedSubject.subjectId || matchedSubject.id;
        if (!subjectId) return streams;

        const seNum = type === 'tv' ? parseInt(season) : 0;
        const epNum = type === 'tv' ? parseInt(episode) : 0;

        const playData = await requestMovieBox(
            'GET',
            '/wefeed-mobile-bff/subject-api/play-info/v2',
            null,
            { subjectId, se: seNum, ep: epNum }
        );

        const playInfo = playData?.data || playData || {};
        const mbStreams = playInfo.streams || [];

        for (const item of mbStreams) {
            const signCookie = item.signCookie;
            if (!signCookie) continue;

            const prefixMatch = signCookie.match(/urlprefix=([A-Za-z0-9+/=]+)/);
            if (!prefixMatch) continue;

            const prefixUrl = Buffer.from(prefixMatch[1], 'base64').toString('utf8').replace(/\/$/, '');
            const mpdUrl = `${prefixUrl}/index.mpd`;

            const streamId = `mb_${subjectId}_s${seNum}e${epNum}_${item.id || '0'}`;
            const epTitle = playInfo.title || matchedSubject.title || title;
            const releaseName = type === 'tv'
                ? `${epTitle} S${String(seNum).padStart(2, '0')}E${String(epNum).padStart(2, '0')}`
                : `${title} (${matchedSubject.year || 'Movie'})`;

            const sizeBytes = parseInt(item.size, 10);
            const sizeStr = !isNaN(sizeBytes) && sizeBytes > 0
                ? `${(sizeBytes / (1024 * 1024)).toFixed(0)}MB`
                : 'Adaptive';

            const codecStr = item.codecName ? item.codecName.toUpperCase() : 'HEVC';

            // Cache for stream proxy and desktop VLC player
            streamCache.set(streamId, {
                id: streamId,
                subjectId,
                season: seNum,
                episode: epNum,
                prefixUrl,
                signCookie,
                referer: 'https://sportslive.wine',
                userAgent: session.userAgent,
                title: releaseName,
                mpdUrl,
                createdAt: Date.now(),
                fetchedAt: Date.now()
            });

            streams.push({
                id: streamId,
                title: releaseName,
                release: releaseName,
                quality: item.resolutions && item.resolutions.includes('1080') ? '1080p FHD' : '720p HD',
                resolutions: item.resolutions || 'Multi',
                audioLanguages: ['English'],
                audioLabel: 'English [Original Audio]',
                size: sizeStr,
                codec: codecStr,
                provider: 'MovieBox CDN',
                streamUrl: `/api/stream/dash/${streamId}/index.mpd`,
                webStreamUrl: `/api/stream/h264/${streamId}.mp4`,
                directMpdUrl: mpdUrl,
                isDirectPlayable: true,
                isMovieBoxStream: true,
                vlcAvailable: true
            });
        }
    } catch (err) {
        console.error('MovieBox scraper error:', err.message);
    }
    return streams;
}

/**
 * Returns a valid, non-expired stream session (auto-refreshes signCookie if expired)
 */
export async function getValidStreamSession(streamId) {
    const stream = streamCache.get(streamId);
    if (!stream) return null;

    // If signCookie is older than 4 minutes, refresh it automatically
    if (!stream.fetchedAt || Date.now() - stream.fetchedAt > 240000) {
        try {
            console.log(`🔄 [StreamSession] Refreshing signCookie for ${streamId}...`);
            const session = await ensureMovieBoxSession();
            const playData = await requestMovieBox(
                'GET',
                '/wefeed-mobile-bff/subject-api/play-info/v2',
                null,
                { subjectId: stream.subjectId, se: stream.season, ep: stream.episode }
            );
            const playInfo = playData?.data || playData || {};
            const item = playInfo.streams?.[0];
            if (item?.signCookie) {
                const prefixMatch = item.signCookie.match(/urlprefix=([A-Za-z0-9+/=]+)/);
                if (prefixMatch) {
                    stream.prefixUrl = Buffer.from(prefixMatch[1], 'base64').toString('utf8').replace(/\/$/, '');
                    stream.signCookie = item.signCookie;
                    stream.fetchedAt = Date.now();
                    console.log(`✅ [StreamSession] Fresh signCookie obtained for ${streamId}`);
                }
            }
        } catch (err) {
            console.error('Failed to refresh stream session:', err.message);
        }
    }
    return stream;
}

/**
 * Scrape 4KHDHub Releases
 */
async function fetch4KHdHubStreams(title, type, season = 1, episode = 1) {
    const streams = [];
    try {
        const cleanTitle = title.replace(/[^a-zA-Z0-9\s]/g, '').trim();
        const searchUrl = `https://4khdhub.one/?s=${encodeURIComponent(cleanTitle)}`;
        const res = await axios.get(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            },
            timeout: 5000
        });

        const html = res.data;
        // Parse cards
        const cardRegex = /<a[^>]+class="[^"]*movie-card[^"]*"[^>]+href="([^"]+)"[^>]*>[\s\S]*?<div[^>]+class="movie-card-title"[^>]*>([^<]+)<\/div>/g;
        let match;
        let moviePageUrl = null;

        while ((match = cardRegex.exec(html)) !== null) {
            const [, href, cardTitle] = match;
            if (cardTitle.toLowerCase().includes(cleanTitle.toLowerCase().split(' ')[0])) {
                moviePageUrl = href;
                break;
            }
        }

        if (!moviePageUrl) return streams;

        // Fetch detail page
        const pageRes = await axios.get(moviePageUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
            },
            timeout: 5000
        });

        const pageHtml = pageRes.data;
        // Extract download items
        const itemRegex = /<div[^>]+class="[^"]*download-item[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/g;
        let itemMatch;

        while ((itemMatch = itemRegex.exec(pageHtml)) !== null) {
            const block = itemMatch[1];
            const titleMatch = block.match(/class="[^"]*file-title"[^>]*>([^<]+)<\/div>/);
            const linkMatch = block.match(/href="([^"]+)"/);
            const sizeMatch = block.match(/class="[^"]*badge-size"[^>]*>([^<]+)<\/span>/);

            if (linkMatch && (titleMatch || sizeMatch)) {
                const releaseTitle = titleMatch ? titleMatch[1].trim() : `${title} High Bitrate`;
                const link = linkMatch[1];
                const size = sizeMatch ? sizeMatch[1].trim() : '3.5 GB';
                const quality = detectQuality(releaseTitle);
                const audioLangs = detectAudioLanguages(releaseTitle);

                let audioLabel = audioLangs.length > 1
                    ? `Dual Audio: ${audioLangs.join(' + ')}`
                    : `${audioLangs[0] || 'English'} [Original]`;

                streams.push({
                    id: `4k_${Math.random().toString(36).substring(7)}`,
                    title: releaseTitle,
                    quality,
                    audioLanguages: audioLangs,
                    audioLabel,
                    size,
                    codec: releaseTitle.toLowerCase().includes('hevc') || releaseTitle.toLowerCase().includes('x265') ? 'HEVC 10-bit' : 'H.264',
                    provider: '4KHDHub Ultra',
                    streamUrl: link,
                    isDirectPlayable: true
                });
            }
        }
    } catch {
        // Continue on error
    }
    return streams;
}

/**
 * Main Stream Aggregator Endpoint Handler
 */
export async function getAggregatedStreams({ tmdbId, title, type = 'movie', season = 1, episode = 1, year = '' }) {
    console.log(`\n⚡ [StreamsService] Searching streams for: "${title}" (${year}) [${type} S${season}E${episode}]`);

    // Run scrapers in parallel
    const [mbStreams, fourKStreams] = await Promise.allSettled([
        fetchMovieBoxStreams(title, type, season, episode),
        fetch4KHdHubStreams(title, type, season, episode)
    ]);

    const results = [];
    if (mbStreams.status === 'fulfilled' && Array.isArray(mbStreams.value)) {
        results.push(...mbStreams.value);
    }
    if (fourKStreams.status === 'fulfilled' && Array.isArray(fourKStreams.value)) {
        results.push(...fourKStreams.value);
    }

    // Sort: 4K first, then 1080p, then 720p
    results.sort((a, b) => {
        const score = (q) => q === '4K UHD' ? 3 : q === '1080p FHD' ? 2 : 1;
        return score(b.quality) - score(a.quality);
    });

    console.log(`  ✅ Found ${results.length} authentic stream releases.`);
    return results;
}
