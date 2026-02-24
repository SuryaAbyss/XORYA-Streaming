// Placeholder server configuration - will be replaced with real servers later
export const servers = [
    // Server #1 - VidFast
    {
        id: 'vidfast',
        name: 'VidFast',
        type: 'primary',
        urlTemplate: {
            movie: (tmdbId) => `https://vidfast.pro/movie/${tmdbId}?autoPlay=true&theme=00bcd4`,
            tv: (tmdbId, season, episode) => `https://vidfast.pro/tv/${tmdbId}/${season}/${episode}?autoPlay=true&nextButton=true&autoNext=true&theme=00bcd4`
        }
    },
    {
        id: 'vidora',
        name: 'Vidora',
        type: 'alternate',
        urlTemplate: {
            movie: (tmdbId) => `https://vidora.su/movie/${tmdbId}?autoplay=true&colour=00bcd4`,
            tv: (tmdbId, season, episode) => `https://vidora.su/tv/${tmdbId}/${season}/${episode}?autoplay=true&colour=00bcd4&autonextepisode=true`
        }
    },
    // Server #6 - Videasy Pro
    {
        id: 'videasy-pro',
        name: 'Videasy Pro',
        type: 'alternate',
        urlTemplate: {
            movie: (tmdbId) => `https://player.videasy.net/movie/${tmdbId}?color=00bcd4`,
            tv: (tmdbId, season, episode) => `https://player.videasy.net/tv/${tmdbId}/${season}/${episode}?color=00bcd4&nextEpisode=true&autoplayNextEpisode=true`
        }
    },


    // Server #2 - VidKing
    {
        id: 'vidking',
        name: 'VidKing',
        type: 'alternate',
        urlTemplate: {
            movie: (tmdbId) => `https://www.vidking.net/embed/movie/${tmdbId}?color=00bcd4&autoPlay=true`,
            tv: (tmdbId, season, episode) => `https://www.vidking.net/embed/tv/${tmdbId}/${season}/${episode}?color=00bcd4&autoPlay=true&nextEpisode=true&episodeSelector=true`
        }
    },
    // Server #7 - MoviesAPI
    {
        id: 'moviesapi',
        name: 'MoviesAPI',
        type: 'alternate',
        urlTemplate: {
            movie: (tmdbId) => `https://moviesapi.club/movie/${tmdbId}`,
            tv: (tmdbId, season, episode) => `https://moviesapi.club/tv/${tmdbId}-${season}-${episode}`
        }
    },
    {
        id: 'vidnest',
        name: 'VidNest',
        type: 'alternate',
        urlTemplate: {
            movie: (tmdbId) => `https://vidnest.fun/movie/${tmdbId}`,
            tv: (tmdbId, season, episode) => `https://vidnest.fun/tv/${tmdbId}/${season}/${episode}`
        }
    },
    // Server #3 - VidRock
    {
        id: 'vidrock',
        name: 'VidRock',
        type: 'alternate',
        urlTemplate: {
            movie: (tmdbId) => `https://vidrock.net/movie/${tmdbId}`,
            tv: (tmdbId, season, episode) => `https://vidrock.net/tv/${tmdbId}/${season}/${episode}`
        }
    },
    // Server #8 - VidSrc
    {
        id: 'vidsrc',
        name: 'VidSrc',
        type: 'alternate',
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
        urlTemplate: {
            movie: (tmdbId) => `https://player.autoembed.cc/embed/movie/${tmdbId}`,
            tv: (tmdbId, season, episode) => `https://player.autoembed.cc/embed/tv/${tmdbId}/${season}/${episode}`
        }
    },
    {
        id: 'godrive',
        name: 'GoDrive',
        type: 'alternate',
        urlTemplate: {
            movie: (tmdbId) => `https://godriveplayer.com/player.php?tmdb=${tmdbId}`,
            tv: (tmdbId, season, episode) => `https://godriveplayer.com/player.php?type=series&tmdb=${tmdbId}&season=${season}&episode=${episode}`
        }
    },

    {
        id: '2embed',
        name: '2Embed',
        type: 'alternate',
        urlTemplate: {
            movie: (tmdbId) => `https://www.2embed.cc/embed/${tmdbId}`,
            tv: (tmdbId, season, episode) => `https://www.2embed.cc/embedtv/${tmdbId}&s=${season}&e=${episode}`
        }
    },


    {
        id: 'nontongo',
        name: 'NontonGo',
        type: 'alternate',
        urlTemplate: {
            movie: (tmdbId) => `https://www.NontonGo.win/embed/movie/${tmdbId}`,
            tv: (tmdbId, season, episode) => `https://www.NontonGo.win/embed/tv/${tmdbId}/${season}/${episode}`
        }
    },
    {
        id: 'vidsync',
        name: 'VidSync',
        type: 'alternate',
        urlTemplate: {
            movie: (tmdbId) => `https://vidsync.xyz/embed/movie/${tmdbId}?autoPlay=true&theme=00bcd4`,
            tv: (tmdbId, season, episode) => `https://vidsync.xyz/embed/tv/${tmdbId}/${season}/${episode}?autoPlay=true&nextButton=true&autoNext=true&theme=00bcd4`
        }
    },
    {
        id: 'vidlink',
        name: 'VidLink',
        type: 'alternate',
        urlTemplate: {
            movie: (tmdbId) => `https://vidlink.pro/movie/${tmdbId}?primaryColor=00bcd4&autoplay=true`,
            tv: (tmdbId, season, episode) => `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}?primaryColor=00bcd4&autoplay=true&nextbutton=true`
        }
    },
    {
        id: 'embedmaster',
        name: 'EmbedMaster',
        type: 'alternate',
        urlTemplate: {
            movie: (tmdbId) => `https://embedmaster.link/movie/${tmdbId}`,
            tv: (tmdbId, season, episode) => `https://embedmaster.link/tv/${tmdbId}/${season}/${episode}`
        }
    },
    {
        id: 'multiembed',
        name: 'MultiEmbed',
        type: 'alternate',
        urlTemplate: {
            movie: (tmdbId) => `https://multiembed.mov/directstream.php?video_id=${tmdbId}&tmdb=1`,
            tv: (tmdbId, season, episode) => `https://multiembed.mov/directstream.php?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}`
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
