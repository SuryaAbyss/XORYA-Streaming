// Placeholder server configuration - will be replaced with real servers later
// Helper to detect if running on localhost / development environment
export const isLocalhost = Boolean(
    (typeof window !== 'undefined' && (
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.startsWith('192.168.') ||
        window.location.hostname.endsWith('.local')
    )) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.DEV)
);

// Server configuration
export const servers = [
    // --- BEST QUALITY / RECOMMENDED SERVERS ---

    // Server #1 - VidFast
    {
        id: 'vidfast',
        name: 'VidFast',
        type: 'primary',
        hasDownload: true, // Known to have VidFast Downloader APK
        urlTemplate: {
            movie: (tmdbId) => `https://vidfast.vc/movie/${tmdbId}?autoPlay=true&theme=00bcd4&server=beta`,
            tv: (tmdbId, season, episode) => `https://vidfast.vc/tv/${tmdbId}/${season}/${episode}?autoPlay=true&nextButton=false&autoNext=false&theme=00bcd4&server=beta`
        }
    },
    // Server #2 - Filmu (2nd Place)
    {
        id: 'filmu',
        name: 'Filmu',
        type: 'alternate',
        urlTemplate: {
            movie: (tmdbId) => `https://embed.filmu.in/movie/${tmdbId}`,
            tv: (tmdbId, season, episode) => `https://embed.filmu.in/tv/${tmdbId}/${season}/${episode}`
        }
    },
    // Server #3 - EmbedWave (3rd Place)
    {
        id: 'embedwave',
        name: 'EmbedWave',
        type: 'alternate',
        referrerPolicy: 'no-referrer',
        urlTemplate: {
            movie: (tmdbId) => `https://embedwave.cc/embed/movie/${tmdbId}`,
            tv: (tmdbId, season, episode) => `https://embedwave.cc/embed/tv/${tmdbId}/${season}/${episode}`
        }
    },
    // Server #4 - VidRift (.net) (4th Place)
    {
        id: 'vidrift-net',
        name: 'VidRift (.net)',
        type: 'alternate',
        urlTemplate: {
            movie: (tmdbId) => `https://embed.vidrift.net/embed/movie/${tmdbId}?brandColor=00bcd4`,
            tv: (tmdbId, season, episode) => `https://embed.vidrift.net/embed/tv/${tmdbId}/${season}/${episode}?brandColor=00bcd4`
        }
    },
    // Server #5 - 111Movies (5th Place)
    {
        id: '111movies',
        name: '111Movies',
        type: 'alternate',
        urlTemplate: {
            movie: (tmdbId) => `https://111movies.net/movie/${tmdbId}`,
            tv: (tmdbId, season, episode) => `https://111movies.net/tv/${tmdbId}/${season}/${episode}`
        }
    },
    // Server #6 - Nxsha (Hindi)
    {
        id: 'nxsha',
        name: 'Nxsha (Hindi)',
        type: 'alternate',
        urlTemplate: {
            movie: (tmdbId) => `https://nxsha.space/embed/movie/${tmdbId}`,
            tv: (tmdbId, season, episode) => `https://nxsha.space/embed/tv/${tmdbId}/${season}/${episode}`
        }
    },
    // Server #7 - CineSrc
    {
        id: 'cinesrc',
        name: 'CineSrc',
        type: 'alternate',
        urlTemplate: {
            movie: (tmdbId) => `https://cinesrc.st/embed/movie/${tmdbId}?autoplay=true&color=%2300bcd4`,
            tv: (tmdbId, season, episode) => `https://cinesrc.st/embed/tv/${tmdbId}?s=${season}&e=${episode}&autoplay=true&autonext=true&color=%2300bcd4`
        }
    },
    // Server #8 - VidBolt (VIDVOLT)
    {
        id: 'vidbolt',
        name: 'VidBolt',
        type: 'alternate',
        urlTemplate: {
            movie: (tmdbId) => `https://vidbolt.pro/movie/${tmdbId}?theme=00bcd4&autoPlay=true`,
            tv: (tmdbId, season, episode) => `https://vidbolt.pro/tv/${tmdbId}/${season}/${episode}?theme=00bcd4&autoPlay=true`
        }
    },
    // Server #9 - VidRock
    {
        id: 'vidrock',
        name: 'VidRock',
        type: 'alternate',
        urlTemplate: {
            movie: (tmdbId) => `https://vidrock.to/movie/${tmdbId}`,
            tv: (tmdbId, season, episode) => `https://vidrock.to/tv/${tmdbId}/${season}/${episode}`
        }
    },
    // Server #10 - PrimeSrc
    {
        id: 'primesrc',
        name: 'PrimeSrc',
        type: 'alternate',
        urlTemplate: {
            movie: (tmdbId) => `https://primesrc.me/embed/movie?tmdb=${tmdbId}`,
            tv: (tmdbId, season, episode) => `https://primesrc.me/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`
        }
    },

    // Server #12 - Vega Direct Player (Prototype Demo - Localhost / Dev Only)
    ...(isLocalhost ? [{
        id: 'vega-direct-demo',
        name: 'Vega Direct',
        type: 'primary',
        isDirectStream: true,
        streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        urlTemplate: {
            movie: (tmdbId) => `https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8`,
            tv: (tmdbId, season, episode) => `https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8`
        }
    }] : []),

    // --- BAD / POOR / LEGACY SERVERS ---
    {
        id: 'videasy-net',
        name: 'Videasy',
        type: 'alternate',
        category: 'poor',
        urlTemplate: {
            movie: (tmdbId) => `https://player.videasy.net/movie/${tmdbId}?color=00bcd4&overlay=true`,
            tv: (tmdbId, season, episode) => `https://player.videasy.net/tv/${tmdbId}/${season}/${episode}?color=00bcd4&nextEpisode=true&autoplayNextEpisode=true&episodeSelector=true&overlay=true`
        }
    },
    {
        id: 'vidking',
        name: 'VidKing',
        type: 'alternate',
        category: 'poor',
        hasDownload: true, // Associated with VidKing downloader apps
        urlTemplate: {
            movie: (tmdbId) => `https://www.vidking.net/embed/movie/${tmdbId}?color=00bcd4&autoPlay=true`,
            tv: (tmdbId, season, episode) => `https://www.vidking.net/embed/tv/${tmdbId}/${season}/${episode}?color=00bcd4&autoPlay=true&nextEpisode=true&episodeSelector=true`
        }
    },
    {
        id: 'vidsrc',
        name: 'VidSrc',
        type: 'alternate',
        category: 'poor',
        hasDownload: true, // Player has built-in download button depending on host
        urlTemplate: {
            movie: (tmdbId) => `https://vidsrc-embed.ru/embed/movie/${tmdbId}?autoplay=1`,
            tv: (tmdbId, season, episode) => `https://vidsrc-embed.ru/embed/tv/${tmdbId}/${season}-${episode}?autoplay=1&autonext=1`
        }
    },
    {
        id: 'vsembed',
        name: 'VidSrc (VSEmbed)',
        type: 'alternate',
        category: 'poor',
        urlTemplate: {
            movie: (tmdbId) => `https://vsembed.ru/embed/movie/${tmdbId}?autoplay=1`,
            tv: (tmdbId, season, episode) => `https://vsembed.ru/embed/tv/${tmdbId}/${season}/${episode}?autoplay=1&autonext=1`
        }
    },
    {
        id: 'vidlove',
        name: 'VidLove',
        type: 'alternate',
        category: 'poor',
        urlTemplate: {
            movie: (tmdbId) => `https://player.vidlove.cc/embed/movie/${tmdbId}?primarycolor=00bcd4&autoplay=true`,
            tv: (tmdbId, season, episode) => `https://player.vidlove.cc/embed/tv/${tmdbId}/${season}/${episode}?primarycolor=00bcd4&autoplay=true`
        }
    },
    {
        id: 'vixsrc',
        name: 'VixSrc',
        type: 'alternate',
        category: 'poor',
        urlTemplate: {
            movie: (tmdbId) => `https://vixsrc.to/movie/${tmdbId}?primaryColor=00bcd4&autoplay=true`,
            tv: (tmdbId, season, episode) => `https://vixsrc.to/tv/${tmdbId}/${season}/${episode}?primaryColor=00bcd4&autoplay=true`
        }
    },
    {
        id: 'vidlink',
        name: 'VidLink',
        type: 'alternate',
        category: 'poor',
        hasDownload: true, // Official downloader app and player options
        urlTemplate: {
            movie: (tmdbId) => `https://vidlink.pro/movie/${tmdbId}?primaryColor=00bcd4&autoplay=true`,
            tv: (tmdbId, season, episode) => `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}?primaryColor=00bcd4&autoplay=true&nextbutton=true`
        }
    },
    {
        id: 'vidora',
        name: 'Vidora',
        type: 'alternate',
        category: 'poor',
        hasDownload: true, // Has "Vidora All Video Downloader" app
        urlTemplate: {
            movie: (tmdbId) => `https://vidora.su/movie/${tmdbId}?autoplay=true&colour=00bcd4`,
            tv: (tmdbId, season, episode) => `https://vidora.su/tv/${tmdbId}/${season}/${episode}?autoplay=true&colour=00bcd4&autonextepisode=true`
        }
    },
    {
        id: 'autoembed',
        name: 'AutoEmbed',
        type: 'alternate',
        category: 'poor',
        hasDownload: true, // Has mobile APK for offline capabilities
        urlTemplate: {
            movie: (tmdbId) => `https://player.autoembed.cc/embed/movie/${tmdbId}`,
            tv: (tmdbId, season, episode) => `https://player.autoembed.cc/embed/tv/${tmdbId}/${season}/${episode}`
        }
    },
    {
        id: 'godrive',
        name: 'GoDrive',
        type: 'alternate',
        category: 'poor',
        urlTemplate: {
            movie: (tmdbId) => `https://godriveplayer.com/player.php?tmdb=${tmdbId}`,
            tv: (tmdbId, season, episode) => `https://godriveplayer.com/player.php?type=series&tmdb=${tmdbId}&season=${season}&episode=${episode}`
        }
    },
    {
        id: '2embed',
        name: '2Embed',
        type: 'alternate',
        category: 'poor',
        urlTemplate: {
            movie: (tmdbId) => `https://www.2embed.cc/embed/${tmdbId}`,
            tv: (tmdbId, season, episode) => `https://www.2embed.cc/embedtv/${tmdbId}&s=${season}&e=${episode}`
        }
    },
    {
        id: 'nontongo',
        name: 'NontonGo',
        type: 'alternate',
        category: 'poor',
        urlTemplate: {
            movie: (tmdbId) => `https://www.NontonGo.win/embed/movie/${tmdbId}`,
            tv: (tmdbId, season, episode) => `https://www.NontonGo.win/embed/tv/${tmdbId}/${season}/${episode}`
        }
    },
    {
        id: 'vidsync',
        name: 'VidSync',
        type: 'alternate',
        category: 'poor',
        urlTemplate: {
            movie: (tmdbId) => `https://vidsync.xyz/embed/movie/${tmdbId}?autoPlay=true&theme=00bcd4`,
            tv: (tmdbId, season, episode) => `https://vidsync.xyz/embed/tv/${tmdbId}/${season}/${episode}?autoPlay=true&nextButton=true&autoNext=true&theme=00bcd4`
        }
    },
    {
        id: 'embedmaster',
        name: 'EmbedMaster',
        type: 'alternate',
        category: 'poor',
        urlTemplate: {
            movie: (tmdbId) => `https://embedmaster.link/movie/${tmdbId}`,
            tv: (tmdbId, season, episode) => `https://embedmaster.link/tv/${tmdbId}/${season}/${episode}`
        }
    },
    {
        id: 'multiembed',
        name: 'MultiEmbed',
        type: 'alternate',
        category: 'poor',
        urlTemplate: {
            movie: (tmdbId) => `https://multiembed.mov/directstream.php?video_id=${tmdbId}&tmdb=1`,
            tv: (tmdbId, season, episode) => `https://multiembed.mov/directstream.php?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}`
        }
    },
    // Server #7 - MoviesAPI
    {
        id: 'moviesapi',
        name: 'MoviesAPI',
        type: 'alternate',
        category: 'poor',
        urlTemplate: {
            movie: (tmdbId) => `https://moviesapi.club/movie/${tmdbId}`,
            tv: (tmdbId, season, episode) => `https://moviesapi.club/tv/${tmdbId}-${season}-${episode}`
        }
    },
    {
        id: 'vidapi',
        name: 'VidAPI',
        type: 'alternate',
        category: 'poor',
        urlTemplate: {
            movie: (tmdbId) => `https://vaplayer.ru/embed/movie/${tmdbId}?primaryColor=%2300bcd4&autoplay=1`,
            tv: (tmdbId, season, episode) => `https://vaplayer.ru/embed/tv/${tmdbId}/${season}/${episode}?primaryColor=%2300bcd4&autoplay=1`
        }
    },
    {
        id: 'peachify',
        name: 'Peachify',
        type: 'alternate',
        category: 'poor',
        urlTemplate: {
            movie: (tmdbId) => `https://peachify.top/embed/movie/${tmdbId}?accent=00bcd4&autoPlay=true`,
            tv: (tmdbId, season, episode) => `https://peachify.top/embed/tv/${tmdbId}/${season}/${episode}?accent=00bcd4&autoPlay=true&autoNext=30`
        }
    },
    {
        id: 'vidsrcwtf-4',
        name: 'VidSrc WTF (Premium)',
        type: 'alternate',
        category: 'poor',
        urlTemplate: {
            movie: (tmdbId) => `https://vidsrc.wtf/api/4/movie/?id=${tmdbId}&color=00bcd4`,
            tv: (tmdbId, season, episode) => `https://vidsrc.wtf/api/4/tv/?id=${tmdbId}&s=${season}&e=${episode}&color=00bcd4`
        }
    },
    {
        id: 'rive-embed',
        name: 'Rive (Embed)',
        type: 'alternate',
        category: 'poor',
        urlTemplate: {
            movie: (tmdbId) => `https://rivestream.ru/embed?type=movie&id=${tmdbId}`,
            tv: (tmdbId, season, episode) => `https://rivestream.ru/embed?type=tv&id=${tmdbId}&season=${season}&episode=${episode}`
        }
    },
    {
        id: 'bcine',
        name: 'BCine',
        type: 'alternate',
        category: 'poor',
        urlTemplate: {
            movie: (tmdbId) => `https://bcine.app/embed/movie/${tmdbId}?color=00bcd4&autoplay=1`,
            tv: (tmdbId, season, episode) => `https://bcine.app/embed/tv/${tmdbId}/${season}/${episode}?color=00bcd4&autoplay=1`
        }
    },
    {
        id: 'spencerdevs',
        name: 'SpencerDevs',
        type: 'alternate',
        category: 'poor',
        urlTemplate: {
            movie: (tmdbId) => `https://spencerdevs.xyz/movie/${tmdbId}?theme=00bcd4`,
            tv: (tmdbId, season, episode) => `https://spencerdevs.xyz/tv/${tmdbId}/${season}/${episode}?theme=00bcd4`
        }
    },
    {
        id: 'mappltv',
        name: 'Mappl TV',
        type: 'alternate',
        category: 'poor',
        urlTemplate: {
            movie: (tmdbId) => `https://mappl.tv/watch/movie/${tmdbId}`,
            tv: (tmdbId, season, episode) => `https://mappl.tv/watch/tv/${tmdbId}-${season}-${episode}`
        }
    },

    // --- SERVER TESTING AREA ---
    {
        id: 'vidsrcwtf-3',
        name: 'VidSrc WTF (Embeds)',
        type: 'testing',
        category: 'testing',
        urlTemplate: {
            movie: (tmdbId) => `https://vidsrc.wtf/api/3/movie/?id=${tmdbId}&color=00bcd4`,
            tv: (tmdbId, season, episode) => `https://vidsrc.wtf/api/3/tv/?id=${tmdbId}&s=${season}&e=${episode}&color=00bcd4`
        }
    },
    {
        id: 'rive-download',
        name: 'Rive (Download)',
        type: 'testing',
        category: 'testing',
        hasDownload: true,
        urlTemplate: {
            movie: (tmdbId) => `https://rivestream.ru/download?type=movie&id=${tmdbId}`,
            tv: (tmdbId, season, episode) => `https://rivestream.ru/download?type=tv&id=${tmdbId}&season=${season}&episode=${episode}`
        }
    },
    {
        id: 'vidnest',
        name: 'VidNest',
        type: 'testing',
        category: 'testing',
        urlTemplate: {
            movie: (tmdbId) => `https://vidnest.fun/movie/${tmdbId}`,
            tv: (tmdbId, season, episode) => `https://vidnest.fun/tv/${tmdbId}/${season}/${episode}`
        }
    },
    {
        id: 'moviebox',
        name: 'MovieBox API',
        type: 'testing',
        category: 'testing',
        urlTemplate: {
            movie: (tmdbId) => `http://localhost:8000/embed/movie/${tmdbId}`,
            tv: (tmdbId, season, episode) => `http://localhost:8000/embed/tv/${tmdbId}/${season}/${episode}`
        }
    },
    {
        id: 'videasy-pro',
        name: 'Videasy Pro',
        type: 'testing',
        category: 'testing',
        urlTemplate: {
            movie: (tmdbId) => `https://player.videasy.to/movie/${tmdbId}?color=00bcd4`,
            tv: (tmdbId, season, episode) => `https://player.videasy.to/tv/${tmdbId}/${season}/${episode}?color=00bcd4&nextEpisode=true&autoplayNextEpisode=true`
        }
    },
    {
        id: 'vidup',
        name: 'VidUP',
        type: 'testing',
        category: 'testing',
        urlTemplate: {
            movie: (tmdbId) => `https://vidup.to/movie/${tmdbId}?autoPlay=true&theme=00bcd4`,
            tv: (tmdbId, season, episode) => `https://vidup.to/tv/${tmdbId}/${season}/${episode}?autoPlay=true&nextButton=true&autoNext=true&theme=00bcd4`
        }
    },
    {
        id: 'vidcore',
        name: 'VidCore',
        type: 'testing',
        category: 'testing',
        urlTemplate: {
            movie: (tmdbId) => `https://vidcore.io/movie/${tmdbId}?autoPlay=true&theme=00bcd4`,
            tv: (tmdbId, season, episode) => `https://vidcore.io/tv/${tmdbId}/${season}/${episode}?autoPlay=true&nextButton=true&autoNext=true&theme=00bcd4`
        }
    },
    {
        id: 'streamrip',
        name: 'StreamRip',
        type: 'testing',
        category: 'testing',
        hasDownload: true,
        urlTemplate: {
            movie: (tmdbId) => `https://streamrip.fun/movie/${tmdbId}`,
            tv: (tmdbId, season, episode) => `https://streamrip.fun/tv/${tmdbId}/${season}/${episode}`
        }
    },
    {
        id: 'vidly',
        name: 'Vidly',
        type: 'testing',
        category: 'testing',
        urlTemplate: {
            movie: (tmdbId) => `https://vidly.pro/movie/${tmdbId}?color=00bcd4&autoplay=1`,
            tv: (tmdbId, season, episode) => `https://vidly.pro/tv/${tmdbId}/${season}/${episode}?color=00bcd4&autoplay=1&nextEpisode=1`
        }
    },
    {
        id: 'vidy',
        name: 'Vidy',
        type: 'testing',
        category: 'testing',
        urlTemplate: {
            movie: (tmdbId) => `https://vidy.st/movie/${tmdbId}?color=00bcd4&autoplay=true`,
            tv: (tmdbId, season, episode) => `https://vidy.st/tv/${tmdbId}/${season}/${episode}?color=00bcd4&autoplay=true&nextEpisode=true&autoplayNextEpisode=true&episodeSelector=true`
        }
    },
    {
        id: 'tgflix',
        name: 'TGFlix',
        type: 'testing',
        category: 'testing',
        urlTemplate: {
            movie: (tmdbId) => `https://tgflix.qzz.io/play/${tmdbId}`,
            tv: (tmdbId, season, episode) => `https://tgflix.qzz.io/play-series/${tmdbId}/${season}/${episode}`
        }
    },
    {
        id: 'pvrplay',
        name: 'PvrPlay',
        type: 'testing',
        category: 'testing',
        urlTemplate: {
            movie: (tmdbId) => `https://dbhnmkjasgbvsdkjbskkvnskjbfckldsnckjbckjnxkjcsknxjvkjxnvcxknvku.pvrplay.fun/watch/movie/${tmdbId}`,
            tv: (tmdbId, season, episode) => `https://dbhnmkjasgbvsdkjbskkvnskjbfckldsnckjbckjnxkjcsknxjvkjxnvcxknvku.pvrplay.fun/watch/tv/${tmdbId}/${season}/${episode}`
        }
    }
];

/**
 * Generate embed URL for a given server
 */
export function getServerUrl(serverId, contentType, tmdbId, season = null, episode = null) {
    let server = servers.find(s => s.id === serverId);
    if (!server && (serverId === 'vidsrc-sbs' || serverId === 'vidsrc_sbs')) {
        server = servers.find(s => s.id === 'embedwave');
    }
    if (!server && serverId === 'vidrift') {
        server = servers.find(s => s.id === 'vidrift-net');
    }
    if (!server) return null;

    if (contentType === 'tv' && season && episode) {
        return server.urlTemplate.tv(tmdbId, season, episode);
    } else {
        return server.urlTemplate.movie(tmdbId);
    }
}
