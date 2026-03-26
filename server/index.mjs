/**
 * XORYA Download Server  (v2)
 * ----------------------------------------
 * Fixed: Now passes full browser session (cookies, referer, origin, user-agent)
 *        to ffmpeg so it can properly download authenticated .m3u8 segments.
 */

import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import { createRequire } from 'module';
import { extractStreamUrls } from './streamExtractor.mjs';

const require = createRequire(import.meta.url);
const ffmpegPath = require('ffmpeg-static');

const app = express();
const PORT = 3001;

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

app.use(cors({ origin: '*' }));
app.use(express.json());

// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/api/health', (_, res) => {
    res.json({ status: 'ok', service: 'XORYA Download Server v2' });
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
