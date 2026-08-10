// Placeholder server configuration - will be replaced with real servers later
export const servers = [
    // Server #1 - VidFast
    {
        id: 'vidfast',
        name: 'VidFast',
        type: 'primary',
        hasDownload: true, // Known to have VidFast Downloader APK
        urlTemplate: {
            movie: (tmdbId) => `https://vidfast.vc/movie/${tmdbId}?autoPlay=true&theme=00bcd4&server=beta`,
            tv: (tmdbId, season, episode) => `https://vidfast.vc/tv/${tmdbId}/${season}/${episode}?autoPlay=true&nextButton=true&autoNext=true&theme=00bcd4&server=beta`
        }
    },
    // Server #2 - VidSrc SBS (2nd Place)
    {
        id: 'vidsrc-sbs',
        name: 'VidSrc SBS',
        type: 'alternate',
        urlTemplate: {
            movie: (tmdbId) => `https://vidsrc.sbs/embed/movie/${tmdbId}?autoplay=1`,
            tv: (tmdbId, season, episode) => `https://vidsrc.sbs/embed/tv/${tmdbId}/${season}/${episode}?autoplay=1`
        }
    },
    // Server #3 - Videasy Net
    {
        id: 'videasy-net',
        name: 'Videasy',
        type: 'alternate',
        urlTemplate: {
            movie: (tmdbId) => `https://player.videasy.net/movie/${tmdbId}?color=00bcd4&overlay=true`,
            tv: (tmdbId, season, episode) => `https://player.videasy.net/tv/${tmdbId}/${season}/${episode}?color=00bcd4&nextEpisode=true&autoplayNextEpisode=true&episodeSelector=true&overlay=true`
        }
    },

    {
        id: 'vidapi',
        name: 'VidAPI',
        type: 'alternate',
        urlTemplate: {
            movie: (tmdbId) => `https://vaplayer.ru/embed/movie/${tmdbId}?primaryColor=%2300bcd4&autoplay=1`,
            tv: (tmdbId, season, episode) => `https://vaplayer.ru/embed/tv/${tmdbId}/${season}/${episode}?primaryColor=%2300bcd4&autoplay=1`
        }
    },
    // Server #2 - VidKing
    {
        id: 'vidking',
        name: 'VidKing',
        type: 'alternate',
        hasDownload: true, // Associated with VidKing downloader apps
        urlTemplate: {
            movie: (tmdbId) => `https://www.vidking.net/embed/movie/${tmdbId}?color=00bcd4&autoPlay=true`,
            tv: (tmdbId, season, episode) => `https://www.vidking.net/embed/tv/${tmdbId}/${season}/${episode}?color=00bcd4&autoPlay=true&nextEpisode=true&episodeSelector=true`
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
    // Server #3 - VidRock
    {
        id: 'vidrock',
        name: 'VidRock',
        type: 'alternate',
        urlTemplate: {
            movie: (tmdbId) => `https://vidrock.ru/movie/${tmdbId}`,
            tv: (tmdbId, season, episode) => `https://vidrock.ru/tv/${tmdbId}/${season}/${episode}`
        }
    },

    // Server #8 - VidSrc
    {
        id: 'vidsrc',
        name: 'VidSrc',
        type: 'alternate',
        hasDownload: true, // Player has built-in download button depending on host
        urlTemplate: {
            movie: (tmdbId) => `https://vidsrc-embed.ru/embed/movie/${tmdbId}?autoplay=1`,
            tv: (tmdbId, season, episode) => `https://vidsrc-embed.ru/embed/tv/${tmdbId}/${season}-${episode}?autoplay=1&autonext=1`
        }
    },
    // Server #9 - PrimeSrc
    {
        id: 'primesrc',
        name: 'PrimeSrc',
        type: 'alternate',
        urlTemplate: {
            movie: (tmdbId) => `https://primesrc.me/embed/movie?tmdb=${tmdbId}`,
            tv: (tmdbId, season, episode) => `https://primesrc.me/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`
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
    // Server Testing Area
    {
        id: 'cinesrc',
        name: 'CineSrc',
        type: 'testing',
        category: 'testing',
        urlTemplate: {
            movie: (tmdbId) => `https://cinesrc.st/embed/movie/${tmdbId}?autoplay=true&color=%2300bcd4`,
            tv: (tmdbId, season, episode) => `https://cinesrc.st/embed/tv/${tmdbId}?s=${season}&e=${episode}&autoplay=true&autonext=true&color=%2300bcd4`
        }
    },
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
        id: 'vixsrc',
        name: 'VixSrc',
        type: 'testing',
        category: 'testing',
        urlTemplate: {
            movie: (tmdbId) => `https://vixsrc.to/movie/${tmdbId}?primaryColor=00bcd4&autoplay=true`,
            tv: (tmdbId, season, episode) => `https://vixsrc.to/tv/${tmdbId}/${season}/${episode}?primaryColor=00bcd4&autoplay=true`
        }
    },
    {
        id: 'vidlove',
        name: 'VidLove',
        type: 'testing',
        category: 'testing',
        urlTemplate: {
            movie: (tmdbId) => `https://player.vidlove.cc/embed/movie/${tmdbId}?primarycolor=00bcd4&autoplay=true`,
            tv: (tmdbId, season, episode) => `https://player.vidlove.cc/embed/tv/${tmdbId}/${season}/${episode}?primarycolor=00bcd4&autoplay=true`
        }
    },
    {
        id: 'vidrift',
        name: 'VidRift',
        type: 'testing',
        category: 'testing',
        urlTemplate: {
            movie: (tmdbId) => `https://embed.vidrift.in/embed/movie/${tmdbId}`,
            tv: (tmdbId, season, episode) => `https://embed.vidrift.in/embed/tv/${tmdbId}/${season}/${episode}`
        }
    },
    {
        id: '111movies',
        name: '111Movies',
        type: 'testing',
        category: 'testing',
        urlTemplate: {
            movie: (tmdbId) => `https://111movies.net/movie/${tmdbId}`,
            tv: (tmdbId, season, episode) => `https://111movies.net/tv/${tmdbId}/${season}/${episode}`
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
    }
];

/**
 * Generate embed URL for a given server
 */
export function getServerUrl(serverId, contentType, tmdbId, season = null, episode = null) {
    const server = servers.find(s => s.id === serverId);
    if (!server) return null;

    if (contentType === 'tv' && season && episode) {
        return server.urlTemplate.tv(tmdbId, season, episode);
    } else {
        return server.urlTemplate.movie(tmdbId);
    }
}
