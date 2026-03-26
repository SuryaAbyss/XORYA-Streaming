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
            const res = await fetch(url);
            const text = await res.text();
            if (text.toLowerCase().includes('download')) {
                results.push(url + ' - MIGHT SUPPORT DOWNLOADS (Found keyword)');
            } else {
                results.push(url + ' - NO');
            }
        } catch (e) {
            results.push(url + ' - ERR');
        }
    }
    console.log(results.join('\n'));
}
check();
