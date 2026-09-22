import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { exec } from 'child_process'

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

function torrentDevServerPlugin() {
  return {
    name: 'torrent-dev-server-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, `http://${req.headers.host}`);

        if (url.pathname === '/api/torrents/search') {
          const query = url.searchParams.get('query');
          const type = url.searchParams.get('type') || 'movie';
          const cat = url.searchParams.get('cat') || '200';

          if (!query) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: 'Query is required' }));
          }

          try {
            const searchUrl = `https://apibay.org/q.php?q=${encodeURIComponent(query)}&cat=${cat}`;
            const upstream = await fetch(searchUrl, {
              headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
            });
            const items = await upstream.json();
            const results = [];

            if (Array.isArray(items)) {
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
            }

            results.sort((a, b) => b.seeders - a.seeders);

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            return res.end(JSON.stringify({
              success: true,
              query,
              total: results.length,
              results: results.slice(0, 35)
            }));
          } catch (err) {
            console.error('[Vite Torrent Plugin] Search error:', err.message);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: err.message, results: [] }));
          }
        }

        if (url.pathname === '/api/torrents/terminal' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const parsed = JSON.parse(body || '{}');
              const { query = '', magnet = '', title = '' } = parsed;

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

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.setHeader('Access-Control-Allow-Origin', '*');
              return res.end(JSON.stringify({
                success: true,
                message: magnet ? `Terminal download started for "${title || 'release'}"` : `Interactive terminal launched for "${query}"`
              }));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        next();
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), torrentDevServerPlugin()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  },
  build: {
    sourcemap: true,
  },
})
