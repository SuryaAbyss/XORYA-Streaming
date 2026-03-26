const urls = [
    'https://vidfast.pro',
    'https://www.vidking.net',
    'https://videasy.net',
    'https://moviesapi.club',
    'https://vidnest.fun',
    'https://vidora.su',
    'https://vidrock.net',
    'https://vidsrc.to',
    'https://primesrc.me',
    'https://autoembed.cc',
    'https://godriveplayer.com',
    'https://www.2embed.cc',
    'https://www.NontonGo.win',
    'https://vidsync.xyz',
    'https://vidlink.pro',
    'https://embedmaster.link',
    'https://multiembed.mov',
    'https://cinesrc.st'
];

async function check() {
    console.log('Checking for download options...');
    const results = [];
    for (const url of urls) {
        try {
            const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
            const text = await res.text();
            if (text.toLowerCase().includes('download')) {
                results.push(url + ' - MIGHT SUPPORT DOWNLOADS (Found \\'download\\' on homepage)');
            } else {
                results.push(url + ' - NO DOWNLOAD KEYWORD FOUND');
            }
        } catch (e) {
            results.push(url + ' - FAILED TO FETCH (' + e.message + ')');
        }
    }
    console.log(results.join('\n'));
}
check();
