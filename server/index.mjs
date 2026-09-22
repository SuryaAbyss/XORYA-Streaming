/**
 * XORYA Download Server  (v2)
 * ----------------------------------------
 * Fixed: Now passes full browser session (cookies, referer, origin, user-agent)
 *        to ffmpeg so it can properly download authenticated .m3u8 segments.
 */

import express from 'express';
import cors from 'cors';
import { spawn, exec } from 'child_process';
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import { extractStreamUrls } from './streamExtractor.mjs';
import { getAggregatedStreams, streamCache, getValidStreamSession } from './streamsService.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const require = createRequire(import.meta.url);
const ffmpegPath = require('ffmpeg-static');

const app = express();
const PORT = process.env.PORT || 3001;

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

app.use(cors({ origin: '*' }));
app.use(express.json());

// ─── Stats Tracking ──────────────────────────────────────────────────────────
const STATS_FILE = path.join(__dirname, 'stats_persistence.json');
let activeViewers = new Map(); // visitorId -> lastSeenTimestamp
let totalVisitors = new Set(); // visitorIds

// Load persisted stats if exists
if (fs.existsSync(STATS_FILE)) {
    try {
        const data = JSON.parse(fs.readFileSync(STATS_FILE, 'utf8'));
        totalVisitors = new Set(data.totalVisitors || []);
    } catch (err) {
        console.error('Failed to load stats:', err);
    }
}

const saveStats = () => {
    try {
        const data = { totalVisitors: Array.from(totalVisitors) };
        fs.writeFileSync(STATS_FILE, JSON.stringify(data), 'utf8');
    } catch (err) {
        console.error('Failed to save stats:', err);
    }
};

// Periodic cleanup of active viewers (older than 2 mins)
setInterval(() => {
    const now = Date.now();
    for (const [id, timestamp] of activeViewers.entries()) {
        if (now - timestamp > 120000) {
            activeViewers.delete(id);
        }
    }
}, 60000);

app.post('/api/admin/track', (req, res) => {
    const { visitorId } = req.body;
    if (!visitorId) return res.status(400).json({ error: 'visitorId required' });

    activeViewers.set(visitorId, Date.now());
    if (!totalVisitors.has(visitorId)) {
        totalVisitors.add(visitorId);
        saveStats();
    }
    res.json({ success: true });
});

app.get('/api/admin/stats', (req, res) => {
    const { secret } = req.query;
    // Use environment variables for the admin secret
    const expectedSecret = process.env.ADMIN_SECRET || 'xorya-admin-2024';
    if (secret !== expectedSecret) {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    const now = Date.now();
    const activeNow = activeViewers.size;
    const recentlyActive = Array.from(activeViewers.values()).filter(t => now - t < 900000).length; // 15 mins

    res.json({
        totalVisitors: totalVisitors.size,
        activeNow,
        recentlyActive,
        serverTime: new Date().toISOString()
    });
});

// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/api/health', (_, res) => {
    res.json({ status: 'ok', service: 'XORYA Stats & Download Server' });
});

// ─── Direct Streams (MovieBox & 4KHDHub Aggregator) ──────────────────────────
app.get('/api/streams', async (req, res) => {
    const { tmdbId, title = '', type = 'movie', season = 1, episode = 1, year = '' } = req.query;
    if (!tmdbId && !title) {
        return res.status(400).json({ error: 'tmdbId or title is required' });
    }

    try {
        const streams = await getAggregatedStreams({
            tmdbId,
            title,
            type,
            season: parseInt(season) || 1,
            episode: parseInt(episode) || 1,
            year
        });

        res.json({
            success: true,
            total: streams.length,
            streams
        });
    } catch (err) {
        console.error('Error fetching streams:', err);
        res.status(500).json({ error: 'Failed to fetch direct streams' });
    }
});

// ─── DASH Stream Segment Proxy (For MovieBox DASH MPD & Segments) ───────────
app.get('/api/stream/dash/:streamId/{*subPath}', async (req, res) => {
    const { streamId } = req.params;
    const subPath = Array.isArray(req.params.subPath)
        ? req.params.subPath.join('/')
        : (req.params.subPath || 'index.mpd');
    const stream = await getValidStreamSession(streamId);

    if (!stream) {
        return res.status(404).send('Stream session expired or not found. Please refresh.');
    }

    const targetUrl = `${stream.prefixUrl}/${subPath}`;

    // If requesting MPD manifest, rewrite shorthand codec string so modern browsers' MediaSource accepts it
    if (subPath === 'index.mpd' || subPath.endsWith('.mpd')) {
        try {
            const headers = {
                'User-Agent': stream.userAgent || UA,
                'Referer': stream.referer || 'https://sportslive.wine',
                'Cookie': stream.signCookie
            };
            const upstream = await axios.get(targetUrl, {
                headers,
                responseType: 'text',
                timeout: 15000
            });
            let manifest = upstream.data;
            // Modern Chrome/Edge MediaSource requires detailed profile string (e.g. hev1.1.6.L120.B0)
            manifest = manifest.replace(/codecs="hev1"/g, 'codecs="hev1.1.6.L120.B0"');
            manifest = manifest.replace(/codecs="hvc1"/g, 'codecs="hvc1.1.6.L120.B0"');

            res.setHeader('Content-Type', 'application/dash+xml');
            res.setHeader('Access-Control-Allow-Origin', '*');
            return res.send(manifest);
        } catch (err) {
            console.error(`[DASH MPD Proxy Error] ${subPath}:`, err.message);
            if (!res.headersSent) {
                return res.status(err.response?.status || 500).send('MPD Proxy error');
            }
            return;
        }
    }

    try {
        const headers = {
            'User-Agent': stream.userAgent || UA,
            'Referer': stream.referer || 'https://sportslive.wine',
            'Cookie': stream.signCookie
        };
        if (req.headers.range) {
            headers['Range'] = req.headers.range;
        }

        const upstream = await axios.get(targetUrl, {
            headers,
            responseType: 'stream',
            timeout: 30000
        });

        res.status(upstream.status);
        for (const [key, val] of Object.entries(upstream.headers)) {
            if (['content-type', 'content-length', 'content-range', 'accept-ranges'].includes(key.toLowerCase())) {
                res.setHeader(key, val);
            }
        }
        res.setHeader('Access-Control-Allow-Origin', '*');
        upstream.data.pipe(res);
    } catch (err) {
        console.error(`[DASH Proxy Error] ${subPath}:`, err.message);
        if (!res.headersSent) {
            res.status(err.response?.status || 500).send('Proxy error');
        }
    }
});

// ─── Real-Time H.264 Web Stream Endpoint (For In-Browser Visuals) ─────────────
app.get('/api/stream/h264/:streamId.mp4', async (req, res) => {
    const { streamId } = req.params;
    const stream = await getValidStreamSession(streamId);
    if (!stream) {
        return res.status(404).send('Stream session expired. Please refresh streams.');
    }

    const upstreamHeaders = `Cookie: ${stream.signCookie}\r\nReferer: ${stream.referer || 'https://sportslive.wine'}\r\nUser-Agent: ${stream.userAgent || UA}\r\n`;
    const directMpdUrl = `${stream.prefixUrl}/index.mpd`;

    console.log(`🎥 [H264 Web Stream] Direct streaming ${streamId} via FFmpeg...`);

    const ffmpeg = spawn(ffmpegPath, [
        '-loglevel', 'warning',
        '-headers', upstreamHeaders,
        '-i', directMpdUrl,
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-tune', 'zerolatency',
        '-c:a', 'copy',
        '-movflags', 'frag_keyframe+empty_moov+default_base_moof',
        '-f', 'mp4',
        'pipe:1'
    ]);

    let headersSent = false;
    let initialBuffer = [];
    let initialBytes = 0;
    // Buffer first 200KB so Chrome receives complete MP4 header + first GOP without demuxer timeout
    const BURST_THRESHOLD = 200000;

    ffmpeg.stdout.on('data', (chunk) => {
        if (!headersSent) {
            initialBuffer.push(chunk);
            initialBytes += chunk.length;
            if (initialBytes >= BURST_THRESHOLD) {
                headersSent = true;
                res.writeHead(200, {
                    'Content-Type': 'video/mp4',
                    'Transfer-Encoding': 'chunked',
                    'Access-Control-Allow-Origin': '*'
                });
                for (const b of initialBuffer) {
                    res.write(b);
                }
                initialBuffer = null;
            }
        } else {
            res.write(chunk);
        }
    });

    ffmpeg.stderr.on('data', (data) => {
        const msg = data.toString();
        if (msg.includes('Error') || msg.includes('failed')) {
            console.warn(`[FFmpeg Warning] ${streamId}:`, msg.trim().slice(0, 150));
        }
    });

    ffmpeg.on('close', (code) => {
        if (!headersSent) {
            if (!res.headersSent) res.status(502).send('Failed to transcode stream');
        } else {
            res.end();
        }
    });

    ffmpeg.on('error', (err) => {
        console.error(`[FFmpeg Error] ${streamId}:`, err.message);
        if (!headersSent && !res.headersSent) {
            res.status(500).send('FFmpeg process error');
        }
    });

    req.on('close', () => {
        console.log(`⏹️ [H264 Web Stream] Client closed connection for ${streamId}`);
        if (ffmpeg.pid) {
            try {
                exec(`taskkill /F /T /PID ${ffmpeg.pid}`, () => {});
            } catch (_) {
                ffmpeg.kill();
            }
        }
    });
});

// ─── Desktop Media Player Launcher (VLC like MovieBox-TUI) ───────────────────
const VLC_PATHS = [
    'C:\\Program Files\\VideoLAN\\VLC\\vlc.exe',
    'C:\\Program Files (x86)\\VideoLAN\\VLC\\vlc.exe'
];

function findVlcExecutable() {
    for (const p of VLC_PATHS) {
        if (fs.existsSync(p)) return p;
    }
    return 'vlc';
}

app.post('/api/player/vlc', async (req, res) => {
    const { streamId, title = 'MovieBox Stream' } = req.body;
    if (!streamId) return res.status(400).json({ error: 'streamId is required' });

    const stream = await getValidStreamSession(streamId);
    if (!stream) {
        return res.status(404).json({ error: 'Stream session not found or expired. Please refresh streams.' });
    }

    const vlcExe = findVlcExecutable();
    const manifestUrl = `http://127.0.0.1:${PORT}/api/stream/dash/${streamId}/index.mpd`;

    console.log(`🎬 [VLC Launch] Launching desktop VLC window for: "${title}" -> ${manifestUrl}`);

    try {
        const safeTitle = (title || 'MovieBox Stream').replace(/['"]/g, '');
        // Launch interactive VLC window matching MovieBox-TUI parameters
        const psCmd = `powershell -WindowStyle Normal -Command "Start-Process '${vlcExe}' -ArgumentList '${manifestUrl}', '--adaptive-logic=highest', '--meta-title=\\\"${safeTitle}\\\"' "`;
        
        exec(psCmd, (err) => {
            if (err) console.error('[VLC Process Error]', err.message);
        });

        return res.json({
            success: true,
            message: 'VLC Media Player opened successfully',
            streamTitle: title
        });
    } catch (err) {
        console.error('Failed to spawn VLC:', err.message);
        return res.status(500).json({ error: `Failed to launch VLC: ${err.message}` });
    }
});

// ─── Direct VLC Playlist (.m3u) Stream Endpoint ──────────────────────────────
app.get('/api/stream/playlist/:streamId.m3u', async (req, res) => {
    const { streamId } = req.params;
    const stream = await getValidStreamSession(streamId);
    if (!stream) {
        return res.status(404).send('Stream session expired. Please refresh streams.');
    }

    const title = (stream.title || 'MovieBox Stream').replace(/[\r\n]/g, '');
    const streamUrl = `http://127.0.0.1:${PORT}/api/stream/dash/${streamId}/index.mpd`;
    const m3uContent = `#EXTM3U\n#EXTINF:-1,${title}\n${streamUrl}\n`;

    res.setHeader('Content-Type', 'audio/x-mpegurl');
    res.setHeader('Content-Disposition', `inline; filename="${streamId}.m3u"`);
    res.send(m3uContent);
});

// ─── P2P Torrent Search & Terminal Downloader Endpoints ──────────────────────
const TORRENT_TRACKERS = [
    'udp://tracker.opentrackr.org:1337/announce',
    'udp://open.demonii.com:1337/announce',
    'udp://tracker.openbittorrent.com:6969/announce',
    'udp://tracker.torrent.eu.org:451/announce',
    'udp://exodus.desync.com:6969/announce',
    'udp://open.stealth.si:80/announce',
    'udp://tracker.dler.org:6969/announce',
    'http://tracker.opentrackr.org:1337/announce',
    'http://tracker.openbittorrent.com:80/announce',
    'https://tracker.tamersunion.org:443/announce'
];

function buildMagnetUri(infoHash, name) {
    const dn = encodeURIComponent(name);
    const tr = TORRENT_TRACKERS.map(t => `&tr=${encodeURIComponent(t)}`).join('');
    return `magnet:?xt=urn:btih:${infoHash}&dn=${dn}${tr}`;
}

function parseReleaseInfo(name) {
    let quality = '720p';
    if (/2160p|4k|uhd/i.test(name)) quality = '2160p 4K';
    else if (/1080p|fhd/i.test(name)) quality = '1080p';
    else if (/720p|hd/i.test(name)) quality = '720p';
    else if (/480p|sd|dvdrip/i.test(name)) quality = '480p';

    let codec = '';
    if (/x265|hevc|10bit/i.test(name)) codec = 'x265 (HEVC)';
    else if (/x264|avc/i.test(name)) codec = 'x264';
    else if (/av1/i.test(name)) codec = 'AV1';

    let source = '';
    if (/bluray|bdrip|brrip/i.test(name)) source = 'BluRay';
    else if (/web-dl|webrip|web/i.test(name)) source = 'WEB-DL';
    else if (/hdtv/i.test(name)) source = 'HDTV';

    return { quality, codec, source };
}

app.get('/api/torrents/search', async (req, res) => {
    const { query, type = 'movie', cat } = req.query;
    if (!query) return res.status(400).json({ error: 'Query parameter is required' });

    try {
        console.log(`🧲 [Torrent Search] Query: "${query}" (type: ${type})`);
        
        // Category in Apibay: 200 = All Video (Movies, TV, 4K, HD)
        const category = cat || '200';
        const searchUrl = `https://apibay.org/q.php?q=${encodeURIComponent(query)}&cat=${category}`;
        
        const response = await axios.get(searchUrl, {
            headers: {
                'User-Agent': UA,
                'Accept': 'application/json'
            },
            timeout: 10000
        });

        const items = Array.isArray(response.data) ? response.data : [];
        const results = [];

        for (const it of items) {
            if (!it.info_hash || it.info_hash === '0000000000000000000000000000000000000000' || it.id === '0') {
                continue;
            }

            const infoHash = it.info_hash.toLowerCase();
            const name = it.name || 'Unknown Torrent';
            const sizeBytes = Number(it.size) || 0;
            const seeders = Number(it.seeders) || 0;
            const leechers = Number(it.leechers) || 0;
            const { quality, codec, source } = parseReleaseInfo(name);

            results.push({
                id: it.id || infoHash,
                infoHash,
                name,
                sizeBytes,
                seeders,
                leechers,
                quality,
                codec,
                source,
                magnet: buildMagnetUri(infoHash, name),
                added: Number(it.added) || null
            });
        }

        // Sort by seeders descending
        results.sort((a, b) => b.seeders - a.seeders);

        return res.json({
            success: true,
            query,
            total: results.length,
            results: results.slice(0, 35)
        });
    } catch (err) {
        console.error('Torrent search error:', err.message);
        return res.status(500).json({ error: `Search failed: ${err.message}`, results: [] });
    }
});

app.post('/api/torrents/terminal', (req, res) => {
    const { query = '', magnet = '', title = '' } = req.body || {};

    console.log(`🖥️ [Terminal Launch] Request received - magnet: ${Boolean(magnet)}, query: "${query}"`);

    try {
        let script = '';
        if (magnet) {
            const displayTitle = (title || 'Selected Release').replace(/"/g, '`"');
            script = `
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   XORYA Streaming -> torlink Direct Downloader          " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Item: ${displayTitle}" -ForegroundColor White
Write-Host "Saving to: ~/Downloads" -ForegroundColor Green
Write-Host "Connecting to swarm peers and starting download..." -ForegroundColor Gray
Write-Host ""
npx -y torlnk "${magnet}"
`;
        } else {
            const cleanQ = (query || '').replace(/"/g, '`"');
            script = `
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   XORYA Streaming -> torlink Interactive Hub             " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Suggested search: ${cleanQ}" -ForegroundColor White
Write-Host "Type any movie or show title and press Enter to search." -ForegroundColor Green
Write-Host "Arrows to navigate, press [d] to download, [?] for keys." -ForegroundColor Gray
Write-Host ""
npx -y torlnk
`;
        }

        const b64 = Buffer.from(script, 'utf16le').toString('base64');
        const psCmd = `powershell -WindowStyle Normal -Command "Start-Process powershell -ArgumentList '-NoExit', '-EncodedCommand', '${b64}'"`;

        exec(psCmd, (err) => {
            if (err) console.error('[Terminal Launch Error]', err.message);
        });

        return res.json({
            success: true,
            message: magnet ? `Terminal download started for "${title || 'release'}"` : `Interactive terminal launched for "${query}"`
        });
    } catch (err) {
        console.error('Failed to spawn terminal:', err.message);
        return res.status(500).json({ error: `Failed to launch terminal: ${err.message}` });
    }
});

// ─── Debug: see what stream URL was found ─────────────────────────────────────
app.get('/api/stream-url', async (req, res) => {
    const { tmdbId, type = 'movie', server = 'vidfast', season = 1, episode = 1 } = req.query;
    if (!tmdbId) return res.status(400).json({ error: 'tmdbId is required' });

    try {
        console.log(`\n🔍 [stream-url] tmdbId=${tmdbId} type=${type} server=${server}`);
        const result = await extractStreamUrls({ server, contentType: type, tmdbId, season, episode });

        if (!result.url) {
            return res.status(404).json({ error: 'No stream URL found. Server may be using bot detection.' });
        }
        res.json({
            streamUrl: result.url,
            allUrls: result.allUrls,
            referer: result.referer,
            hasCookies: !!result.cookies,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// ─── Main Download Endpoint ───────────────────────────────────────────────────
app.get('/api/download', async (req, res) => {
    const {
        tmdbId, type = 'movie', server = 'vidfast',
        season = 1, episode = 1, title = 'video',
    } = req.query;

    if (!tmdbId) return res.status(400).json({ error: 'tmdbId is required' });

    try {
        console.log(`\n🎬 [download] tmdbId=${tmdbId} type=${type} server=${server} S${season}E${episode}`);

        // Step 1: Scrape stream + session context from browser
        const result = await extractStreamUrls({
            server, contentType: type, tmdbId,
            season: parseInt(season), episode: parseInt(episode),
        });

        if (!result.url) {
            return res.status(404).json({
                error: 'Could not find stream URL. Try a different server or try again.'
            });
        }

        const { url: streamUrl, referer, cookies } = result;
        const origin = (() => { try { return new URL(referer).origin; } catch { return referer; } })();

        console.log(`  ✅ Best stream URL: ${streamUrl}`);
        console.log(`  📎 Referer: ${referer}`);
        console.log(`  🍪 Cookies: ${cookies ? cookies.substring(0, 80) + '...' : 'none'}`);

        // Step 2: Prepare download filename
        const safeTitle = (type === 'tv')
            ? `${title}_S${String(season).padStart(2, '0')}E${String(episode).padStart(2, '0')}`
            : title;
        const filename = safeTitle.replace(/[^a-z0-9_\-\s]/gi, '_');

        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.mp4"`);
        res.setHeader('X-Stream-Source', 'XORYA-Extractor-v2');

        // Step 3: Build ffmpeg args — pass full session context
        // -------------------------------------------------------
        // Key fix: every segment request ffmpeg makes must carry the
        //   same Cookie + Referer + Origin + User-Agent that the browser sent.
        //   We do this via -headers flag (applied to ALL http(s) requests).
        // -------------------------------------------------------
        const headers = [
            `User-Agent: ${UA}`,
            `Referer: ${referer}`,
            `Origin: ${origin}`,
            `Accept: */*`,
            `Accept-Language: en-US,en;q=0.9`,
            cookies ? `Cookie: ${cookies}` : '',
        ].filter(Boolean).join('\r\n');

        const ffmpegArgs = [
            '-loglevel', 'warning',         // Less noisy output
            '-headers', headers,             // Apply session headers to ALL requests
            '-i', streamUrl,                 // Input: .m3u8 or .mp4
            // ── Output options ───────────────────────────────────────────────
            '-c', 'copy',                     // No re-encode: just remux (fast + lossless)
            '-bsf:a', 'aac_adtstoasc',       // Fix AAC audio framing for MP4 container
            '-movflags', 'frag_keyframe+empty_moov+faststart',
            '-f', 'mp4',
            'pipe:1',                         // Pipe to stdout → HTTP response
        ];

        console.log(`  🎞️  Spawning ffmpeg...`);
        const ffmpeg = spawn(ffmpegPath, ffmpegArgs, { stdio: ['ignore', 'pipe', 'pipe'] });

        // Forward video bytes to browser
        ffmpeg.stdout.pipe(res);

        let ffmpegLog = '';
        ffmpeg.stderr.on('data', (chunk) => {
            ffmpegLog += chunk.toString();
            process.stdout.write(chunk);
        });

        ffmpeg.on('close', (code) => {
            console.log(`  [ffmpeg] Done (exit ${code})`);
            if (code !== 0) {
                console.error(`  [ffmpeg] stderr:\n${ffmpegLog}`);
            }
            if (!res.writableEnded) res.end();
        });

        ffmpeg.on('error', (err) => {
            console.error('  ❌ ffmpeg spawn error:', err.message);
            if (!res.headersSent) {
                res.status(500).json({ error: 'ffmpeg failed: ' + err.message });
            }
        });

        req.on('close', () => {
            console.log('  ⚠️  Client disconnected — killing ffmpeg');
            ffmpeg.kill('SIGTERM');
        });

    } catch (err) {
        console.error('Download error:', err);
        if (!res.headersSent) {
            res.status(500).json({ error: err.message });
        }
    }
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`\n${'═'.repeat(55)}`);
    console.log(` 🚀 XORYA Download Server v2 — port ${PORT}`);
    console.log(`    Health:  http://localhost:${PORT}/api/health`);
    console.log(`    Debug:   http://localhost:${PORT}/api/stream-url?tmdbId=550&type=movie&server=vidfast`);
    console.log(`    DL:      http://localhost:${PORT}/api/download?tmdbId=550&type=movie&server=vidfast&title=Fight+Club`);
    console.log(`${'═'.repeat(55)}\n`);
});
