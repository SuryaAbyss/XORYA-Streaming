import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Heart, Bookmark, ChevronLeft, ChevronRight, Tv, Languages, Settings, Share2, Download, Star, Maximize2, Minimize2 } from 'lucide-react';
import { getMovieDetails, getTVShowDetails, imageUrl, getMovieImages, getTVShowImages, getCollectionDetails, getMovieRecommendations, getMovieSimilar, getTVShowRecommendations, getTVShowSimilar, getSeasonDetails, getTrendingTVShows, getTrendingMovies, tmdb } from '../api/tmdb';
import { useWatchlist } from '../hooks/useWatchlist';
import { servers, getServerUrl } from '../config/servers';
import EpisodesSidebar from '../components/EpisodesSidebar';
import MovieRow from '../components/MovieRow';
import WatchDetailsTabs from '../components/WatchDetailsTabs';
import LemniscateBloomLoader from '../components/LemniscateBloomLoader';
import MobileVideoPlayerView from '../components/mobile/MobileVideoPlayerView';


// Genre to color mappings for atmospheric fallback themes
const GENRE_COLOR_MAP = {
    'action': '59, 130, 246',      // Blue
    'adventure': '139, 92, 246',   // Violet
    'animation': '236, 72, 153',   // Pink
    'comedy': '245, 158, 11',      // Amber
    'crime': '16, 185, 129',       // Emerald Green
    'documentary': '16, 185, 129', // Emerald
    'drama': '217, 119, 6',        // Gold/Orange
    'family': '34, 197, 94',       // Green
    'fantasy': '168, 85, 247',     // Purple
    'history': '217, 119, 6',      // Gold/Bronze
    'horror': '239, 68, 68',       // Red
    'music': '236, 72, 153',       // Pink
    'mystery': '99, 102, 241',     // Indigo
    'romance': '244, 63, 94',      // Rose
    'science fiction': '139, 92, 246', // Purple/Sci-Fi
    'scifi': '139, 92, 246',
    'tv movie': '107, 114, 128',   // Grey
    'thriller': '220, 38, 38',     // Crimson
    'war': '185, 28, 28',          // Dark Red
    'western': '180, 83, 9'        // Brownish Gold
};

const extractDominantColor = (imageUrl) => {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = imageUrl;
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = 10;
                canvas.height = 10;
                ctx.drawImage(img, 0, 0, 10, 10);
                const data = ctx.getImageData(0, 0, 10, 10).data;

                let r = 0, g = 0, b = 0, count = 0;
                for (let i = 0; i < data.length; i += 4) {
                    const pixelBrightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
                    if (pixelBrightness > 30 && pixelBrightness < 220) {
                        r += data[i];
                        g += data[i + 1];
                        b += data[i + 2];
                        count++;
                    }
                }

                if (count === 0) {
                    resolve(null);
                    return;
                }

                r = Math.round(r / count);
                g = Math.round(g / count);
                b = Math.round(b / count);

                const maxVal = Math.max(r, g, b);
                const minVal = Math.min(r, g, b);
                if (maxVal - minVal < 20) {
                    resolve(null); // Too grey, discard
                    return;
                }

                resolve(`${r}, ${g}, ${b}`);
            } catch {
                resolve(null);
            }
        };
        img.onerror = () => resolve(null);
    });
};

const VideoPlayer = () => {
    const { type, id, season: urlSeason, episode: urlEpisode } = useParams();
    const navigate = useNavigate();
    const { syncPlaybackWithWatchlist, getEntryByTmdbId, addEntry, removeEntry } = useWatchlist();

    const [contentData, setContentData] = useState(null);
    const [logoPath, setLogoPath] = useState(null);
    const [collectionData, setCollectionData] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentEpisodeDetails, setCurrentEpisodeDetails] = useState(null);
    const [accentColorRgb, setAccentColorRgb] = useState('0, 188, 212'); // Default cyan
    const [shareToast, setShareToast] = useState(false);
    const getInitialServer = () => {
        const isMobile = typeof window !== 'undefined' && (
            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
            (navigator.maxTouchPoints > 0 && window.innerWidth <= 768)
        );

        try {
            const raw = localStorage.getItem('xorya_watchlist');
            if (raw) {
                const saved = JSON.parse(raw);
                const entry = saved.entries?.find(e => String(e.tmdbId) === String(id));
                if (entry?.lastServer) {
                    return entry.lastServer;
                }
            }
        } catch {
            // localStorage can be unavailable in private or embedded contexts.
        }
        return isMobile ? 'vidking' : 'vidfast';
    };



    const [activeServer, setActiveServer] = useState(getInitialServer);
    const [iframeKey, setIframeKey] = useState(0);
    const [isTheaterMode, setIsTheaterMode] = useState(false);
    const [isMobileView, setIsMobileView] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.innerWidth <= 768;
    });

    useEffect(() => {
        const handleResize = () => {
            setIsMobileView(window.innerWidth <= 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const playerFrameRef = useRef(null);
    const iframeRef = useRef(null);

    const toggleFullscreen = () => {
        const elem = iframeRef.current || playerFrameRef.current;
        if (!elem) return;

        const isFS = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;

        if (!isFS) {
            const req = elem.requestFullscreen || elem.webkitRequestFullscreen || elem.mozRequestFullScreen || elem.msRequestFullscreen;
            if (req) {
                req.call(elem).catch((err) => {
                    console.error("Error attempting to enable fullscreen:", err);
                });
            }
        } else {
            const exit = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
            if (exit) {
                exit.call(document);
            }
        }
    };



    // Safe initialisation bypassing ANY state closures by scanning localStorage directly
    const getInitialProgress = () => {
        if (type !== 'tv') return { s: 1, e: 1 };
        if (urlSeason && urlEpisode) return { s: parseInt(urlSeason), e: parseInt(urlEpisode) };
        try {
            const raw = localStorage.getItem('xorya_watchlist');
            if (raw) {
                const saved = JSON.parse(raw);
                const entry = saved.entries?.find(e => String(e.tmdbId) === String(id));
                if (entry?.progress) {
                    return { s: parseInt(entry.progress.season), e: parseInt(entry.progress.episode) };
                }
            }
        } catch {
            // localStorage can be unavailable in private or embedded contexts.
        }
        return { s: 1, e: 1 };
    };

    const initProg = getInitialProgress();
    const [currentSeason, setCurrentSeason] = useState(initProg.s);
    const [currentEpisode, setCurrentEpisode] = useState(initProg.e);

    // Keep state perfectly in sync and reset progress when show ID or URL changes
    useEffect(() => {
        if (type !== 'tv') return;

        if (urlSeason && urlEpisode) {
            setCurrentSeason(parseInt(urlSeason));
            setCurrentEpisode(parseInt(urlEpisode));
            return;
        }

        // Try loading from saved progress for this specific ID
        try {
            const raw = localStorage.getItem('xorya_watchlist');
            if (raw) {
                const saved = JSON.parse(raw);
                const entry = saved.entries?.find(e => String(e.tmdbId) === String(id));
                if (entry?.progress) {
                    setCurrentSeason(parseInt(entry.progress.season) || 1);
                    setCurrentEpisode(parseInt(entry.progress.episode) || 1);
                    return;
                }
            }
        } catch (e) {
            console.error('Failed to parse watchlist for ID change reset:', e);
        }

        // Default fallback: reset to Season 1 Episode 1
        setCurrentSeason(1);
        setCurrentEpisode(1);
    }, [id, type, urlSeason, urlEpisode]);
    const [seasons, setSeasons] = useState([]);
    // Tracks total episode count per season: { 1: 10, 2: 13, ... }
    const [episodeCounts, setEpisodeCounts] = useState({});

    useEffect(() => {
        fetchContentData();
    }, [type, id]);

    useEffect(() => {
        document.body.classList.add('watch-page-active');
        return () => document.body.classList.remove('watch-page-active');
    }, []);

    // Auto-trigger full screen for mobile users coming from Play Now button
    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const autoFS = searchParams.get('autofs');
        const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 0 && window.innerWidth <= 768);

        if (autoFS === 'true' && isMobileDevice) {
            const triggerFS = () => {
                const elem = playerFrameRef.current;
                if (!elem || document.fullscreenElement) return;
                const requestMethod = elem.requestFullscreen || elem.webkitRequestFullscreen || elem.mozRequestFullScreen || elem.msRequestFullscreen;
                if (requestMethod) {
                    requestMethod.call(elem).catch((err) => {
                        console.warn('Automated fullscreen request blocked by browser gesture policy:', err);
                    });
                }
            };

            const timer1 = setTimeout(triggerFS, 300);
            const timer2 = setTimeout(triggerFS, 1000);
            return () => {
                clearTimeout(timer1);
                clearTimeout(timer2);
            };
        }
    }, [loading]);



    const handleEpisodeSelect = useCallback((season, episode) => {
        setCurrentSeason(season);
        setCurrentEpisode(episode);
        navigate(`/watch/tv/${id}/season/${season}/episode/${episode}`, { replace: true });
    }, [id, navigate]);

    const handlePreviousEpisode = useCallback(() => {
        if (currentEpisode > 1) {
            handleEpisodeSelect(currentSeason, currentEpisode - 1);
        }
    }, [currentEpisode, currentSeason, handleEpisodeSelect]);

    const handleNextEpisode = useCallback(() => {
        const totalEpisodesInCurrentSeason = episodeCounts[currentSeason];
        if (totalEpisodesInCurrentSeason && currentEpisode >= totalEpisodesInCurrentSeason) {
            const currentSeasonIndex = seasons.findIndex(s => s.season_number === currentSeason);
            const nextSeason = seasons[currentSeasonIndex + 1];
            if (nextSeason) {
                handleEpisodeSelect(nextSeason.season_number, 1);
            }
        } else {
            handleEpisodeSelect(currentSeason, currentEpisode + 1);
        }
    }, [episodeCounts, currentSeason, currentEpisode, seasons, handleEpisodeSelect]);

    // Ref to prevent multiple triggers for the same episode during postMessage stream
    const nextTriggeredRef = useRef(false);

    // Reset nextTriggeredRef when season/episode/id changes
    useEffect(() => {
        nextTriggeredRef.current = false;
    }, [id, currentSeason, currentEpisode]);

    // Handle universal embed player postMessage events & smart credit/end-of-episode detection
    useEffect(() => {
        const handlePlayerMessage = (event) => {
            if (!event.data) return;

            // Save raw server media progress data if present
            if (event.data?.type === 'MEDIA_DATA') {
                const mediaData = event.data.data;
                try {
                    localStorage.setItem("vidsrcwtf-Progress", JSON.stringify(mediaData));
                    localStorage.setItem("peachifyProgress", JSON.stringify(mediaData));
                } catch (e) { }
            }

            let currentTime = null;
            let duration = null;
            let playerStatus = null;

            // Extract status, currentTime, and duration from various embed formats
            if (event.data.type === 'PLAYER_EVENT') {
                const data = event.data.data || event.data;
                playerStatus = data.event || data.player_status;
                currentTime = data.currentTime ?? data.player_progress ?? data.progress ?? data.time;
                duration = data.duration ?? data.player_duration ?? data.totalTime;
            } else if (event.data.event || event.data.type) {
                const typeStr = (event.data.event || event.data.type || '').toString().toLowerCase();
                if (typeStr.includes('time') || typeStr.includes('progress') || typeStr.includes('play') || typeStr.includes('end')) {
                    currentTime = event.data.currentTime ?? event.data.progress ?? event.data.position;
                    duration = event.data.duration ?? event.data.total;
                    playerStatus = event.data.status || event.data.event || event.data.type;
                }
            }

            // Check if we have numerical playback info
            if (currentTime !== null && duration !== null && duration > 0) {
                const remaining = duration - currentTime;
                const percent = (currentTime / duration) * 100;

                // Near End Criteria: Remaining <= 90 seconds OR Watched >= 95% OR status is ended/completed
                const isNearEnd = remaining <= 90 || percent >= 95 || playerStatus === 'completed' || playerStatus === 'ended';

                if (isNearEnd && type === 'tv' && !nextTriggeredRef.current) {
                    nextTriggeredRef.current = true;
                    console.log(`[Smart Credits Detection] Episode near end (${Math.round(remaining)}s remaining). Advancing progress to next episode.`);

                    // Calculate Next Episode
                    let nextS = currentSeason;
                    let nextE = currentEpisode + 1;
                    const totalEpsInCurrentSeason = episodeCounts[currentSeason];

                    if (totalEpsInCurrentSeason && currentEpisode >= totalEpsInCurrentSeason) {
                        const currentSeasonIdx = seasons.findIndex(s => s.season_number === currentSeason);
                        if (currentSeasonIdx !== -1 && seasons[currentSeasonIdx + 1]) {
                            nextS = seasons[currentSeasonIdx + 1].season_number;
                            nextE = 1;
                        }
                    }

                    // Save Next Episode to localStorage (xorya_watchlist)
                    try {
                        const raw = localStorage.getItem('xorya_watchlist');
                        if (raw) {
                            const saved = JSON.parse(raw);
                            if (saved.entries) {
                                const entryIdx = saved.entries.findIndex(e => String(e.tmdbId) === String(id));
                                if (entryIdx !== -1) {
                                    saved.entries[entryIdx].progress = { season: nextS, episode: nextE };
                                    saved.entries[entryIdx].status = 'watching';
                                    saved.entries[entryIdx].updatedAt = Date.now();
                                    localStorage.setItem('xorya_watchlist', JSON.stringify(saved));
                                }
                            }
                        }
                    } catch (err) {
                        console.error('Error saving smart progress:', err);
                    }

                    // If player emitted explicit ended/completed event, trigger handleNextEpisode directly
                    if (playerStatus === 'completed' || playerStatus === 'ended') {
                        handleNextEpisode();
                    }
                }
            }
        };

        window.addEventListener('message', handlePlayerMessage);
        return () => window.removeEventListener('message', handlePlayerMessage);
    }, [id, type, currentSeason, currentEpisode, episodeCounts, seasons, handleNextEpisode]);

    // Fetch details of the current active episode for TV Shows
    useEffect(() => {
        const fetchEpisodeDetails = async () => {
            if (type !== 'tv' || !id || !currentSeason || !currentEpisode) {
                setCurrentEpisodeDetails(null);
                return;
            }
            try {
                const response = await getSeasonDetails(id, currentSeason);
                const ep = response.episodes?.find(e => e.episode_number === currentEpisode);
                if (ep) {
                    setCurrentEpisodeDetails(ep);
                }
            } catch (error) {
                console.warn('Failed to fetch season details for episode title:', error);
            }
        };
        fetchEpisodeDetails();
    }, [type, id, currentSeason, currentEpisode]);

    // Extract dynamic accent color based on backdrop or genres
    useEffect(() => {
        const calculateTheme = async () => {
            if (!contentData) return;

            // 1. Try canvas color extraction from backdrop image (w92 size for performance)
            const backdropPath = contentData.backdrop_path || contentData.poster_path;
            if (backdropPath) {
                const url = imageUrl(backdropPath, 'w92');
                const extracted = await extractDominantColor(url);
                if (extracted) {
                    setAccentColorRgb(extracted);
                    return;
                }
            }

            // 2. Fallback to genre-based coloring
            if (contentData.genres && contentData.genres.length > 0) {
                for (const genreObj of contentData.genres) {
                    const name = genreObj.name?.toLowerCase();
                    if (GENRE_COLOR_MAP[name]) {
                        setAccentColorRgb(GENRE_COLOR_MAP[name]);
                        return;
                    }
                }
            }

            // 3. Fallback to default cyan
            setAccentColorRgb('0, 188, 212');
        };

        calculateTheme();
    }, [contentData]);

    // Handle Collection Reset & Resume Watch Redirect Side-Effect
    useEffect(() => {
        setCollectionData(null);
        setRecommendations([]);

        // If a user clicks play without specifying episode, strictly enforce the redirect from raw localStorage.
        if (type === 'tv' && !urlSeason && !urlEpisode) {
            try {
                const raw = localStorage.getItem('xorya_watchlist');
                if (raw) {
                    const saved = JSON.parse(raw);
                    const entry = saved.entries?.find(e => String(e.tmdbId) === String(id));
                    if (entry?.progress) {
                        navigate(`/watch/tv/${id}/season/${entry.progress.season}/episode/${entry.progress.episode}`, { replace: true });
                        return;
                    }
                }
            } catch {
                // Ignore malformed resume data and fall back to the default episode.
            }
        }
    }, [type, id, urlSeason, urlEpisode, navigate]);

    // Handle Watchlist Synchronization 
    useEffect(() => {
        if (!contentData) return;

        // Debounce network noise, only sync when actually stabilised
        const timer = setTimeout(() => {
            syncPlaybackWithWatchlist({
                tmdbId: id,
                type: type,
                title: type === 'movie' ? contentData.title : contentData.name,
                poster: contentData.poster_path,
                backdrop: contentData.backdrop_path,
                year: (contentData.release_date || contentData.first_air_date)?.split('-')[0],
                rating: contentData.vote_average?.toFixed(1),
                season: type === 'tv' ? currentSeason : undefined,
                episode: type === 'tv' ? currentEpisode : undefined,
                server: activeServer
            });
        }, 1000);
        return () => clearTimeout(timer);
    }, [id, type, contentData, currentSeason, currentEpisode, activeServer, syncPlaybackWithWatchlist]);

    const fetchContentData = async () => {
        setLoading(true);
        try {
            let data;
            let logo = null;

            if (type === 'movie') {
                const response = await getMovieDetails(id);
                data = response.data;

                // Fetch Logo for Movie safely
                try {
                    const images = await getMovieImages(id);
                    if (images.data.logos.length > 0) {
                        logo = images.data.logos[0].file_path;
                    }
                } catch (imgError) {
                    console.warn('Failed to fetch movie logo:', imgError);
                }

                // Fetch Collection details if it belongs to one
                if (data.belongs_to_collection) {
                    try {
                        const colResponse = await getCollectionDetails(data.belongs_to_collection.id);
                        setCollectionData(colResponse.data);
                    } catch (colError) {
                        console.warn('Failed to fetch collection Details:', colError);
                    }
                }

                // Multi-tier recommendation fetcher (Recommendations -> Similar -> Genre -> Trending)
                let recs = [];
                try {
                    const recResponse = await getMovieRecommendations(id);
                    recs = (recResponse.data?.results || []).filter(r => r.poster_path);
                } catch (e) { }

                if (recs.length === 0) {
                    try {
                        const simResponse = await getMovieSimilar(id);
                        recs = (simResponse.data?.results || []).filter(r => r.poster_path);
                    } catch (e) { }
                }

                if (recs.length === 0 && data.genres && data.genres.length > 0) {
                    try {
                        const genreId = data.genres[0].id;
                        const popResponse = await tmdb.get('/discover/movie', {
                            params: { with_genres: genreId, sort_by: 'popularity.desc' }
                        });
                        recs = (popResponse.data?.results || []).filter(r => r.poster_path && String(r.id) !== String(id));
                    } catch (e) { }
                }

                if (recs.length === 0) {
                    try {
                        const trendResponse = await getTrendingMovies();
                        recs = (trendResponse.data?.results || []).filter(r => r.poster_path && String(r.id) !== String(id));
                    } catch (e) { }
                }

                setRecommendations(recs);
            } else {
                const response = await getTVShowDetails(id);
                data = response.data;
                const activeSeasons = data.seasons?.filter(s => s.season_number > 0) || [];
                setSeasons(activeSeasons);

                const counts = {};
                activeSeasons.forEach(s => {
                    if (s.season_number > 0 && s.episode_count) {
                        counts[s.season_number] = s.episode_count;
                    }
                });
                setEpisodeCounts(counts);

                // Fetch Logo for TV Show safely
                try {
                    const images = await getTVShowImages(id);
                    if (images.data.logos.length > 0) {
                        logo = images.data.logos[0].file_path;
                    }
                } catch (imgError) {
                    console.warn('Failed to fetch TV logo:', imgError);
                }

                // Multi-tier recommendation fetcher (Recommendations -> Similar -> Genre -> Trending -> Top Rated)
                let recs = [];
                try {
                    const recResponse = await getTVShowRecommendations(id);
                    recs = (recResponse.data?.results || []).filter(r => r.backdrop_path || r.poster_path);
                } catch (e) { }

                if (recs.length === 0) {
                    try {
                        const simResponse = await getTVShowSimilar(id);
                        recs = (simResponse.data?.results || []).filter(r => r.backdrop_path || r.poster_path);
                    } catch (e) { }
                }

                if (recs.length === 0 && data.genres && data.genres.length > 0) {
                    try {
                        const genreId = data.genres[0].id;
                        const popResponse = await tmdb.get('/discover/tv', {
                            params: { with_genres: genreId, sort_by: 'popularity.desc' }
                        });
                        recs = (popResponse.data?.results || []).filter(r => (r.backdrop_path || r.poster_path) && String(r.id) !== String(id));
                    } catch (e) { }
                }

                if (recs.length === 0) {
                    try {
                        const trendResponse = await getTrendingTVShows();
                        recs = (trendResponse.data?.results || []).filter(r => (r.backdrop_path || r.poster_path) && String(r.id) !== String(id));
                    } catch (e) { }
                }

                if (recs.length === 0) {
                    try {
                        const popTv = await tmdb.get('/tv/popular');
                        recs = (popTv.data?.results || []).filter(r => (r.backdrop_path || r.poster_path) && String(r.id) !== String(id));
                    } catch (e) { }
                }

                setRecommendations(recs);
            }

            setContentData(data);
            setLogoPath(logo);
        } catch (error) {
            console.error('Failed to fetch content:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleServerChange = (serverId) => {
        setActiveServer(serverId);
    };

    const handleReload = () => {
        setIframeKey(prev => prev + 1);
    };

    // Generate URL using logic we fixed earlier (passing handles for TV correctly)
    const playerUrl = getServerUrl(
        activeServer,
        type,
        id,
        type === 'tv' ? currentSeason : null,
        type === 'tv' ? currentEpisode : null
    );

    const loadTimeoutRef = React.useRef(null);
    const [fallbackToast, setFallbackToast] = useState(null);

    const switchToNextServer = () => {
        const playableServers = servers.filter(s => s.id !== 'rive-download');
        const currentIndex = playableServers.findIndex(s => s.id === activeServer);
        if (currentIndex !== -1) {
            const nextIndex = (currentIndex + 1) % playableServers.length;
            const nextServer = playableServers[nextIndex];
            setActiveServer(nextServer.id);
            setFallbackToast(nextServer.name);
            setTimeout(() => setFallbackToast(null), 4000);
        }
    };

    // Monitor playerUrl changes to trigger load timeout of 10 seconds
    useEffect(() => {
        // Clear any existing load timeout
        if (loadTimeoutRef.current) {
            clearTimeout(loadTimeoutRef.current);
        }

        // Only start timeout if it's not a download page
        if (activeServer !== 'rive-download') {
            loadTimeoutRef.current = setTimeout(() => {
                console.log(`Server ${activeServer} load timed out. Auto-switching...`);
                switchToNextServer();
            }, 10000);
        }

        return () => {
            if (loadTimeoutRef.current) {
                clearTimeout(loadTimeoutRef.current);
            }
        };
    }, [playerUrl, activeServer]);

    const handleIframeLoad = () => {
        console.log(`Iframe successfully loaded ${activeServer}`);
        if (loadTimeoutRef.current) {
            clearTimeout(loadTimeoutRef.current);
        }

        const searchParams = new URLSearchParams(window.location.search);
        const autoFS = searchParams.get('autofs');
        const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 0 && window.innerWidth <= 768);

        if (autoFS === 'true' && isMobileDevice && !document.fullscreenElement) {
            const elem = iframeRef.current || playerFrameRef.current;
            if (elem) {
                const requestMethod = elem.requestFullscreen || elem.webkitRequestFullscreen || elem.mozRequestFullScreen || elem.msRequestFullscreen;
                if (requestMethod) {
                    requestMethod.call(elem).catch(() => { });
                }
            }
        }
    };





    if (loading) {
        return <LemniscateBloomLoader text="Loading player..." fullScreen={true} color="#00bcd4" />;
    }


    if (!contentData) {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
            }}>
                <p>Content not found</p>
            </div>
        );
    }

    const title = type === 'movie' ? contentData.title : contentData.name;
    const displayTitle = type === 'tv'
        ? `${title} - Season ${currentSeason} Episode ${currentEpisode}`
        : title;
    const releaseYear = (contentData.release_date || contentData.first_air_date)?.split('-')[0];
    const genreLine = contentData.genres?.map(g => g.name).slice(0, 3).join(', ');
    const durationLabel = type === 'tv'
        ? `${contentData.number_of_seasons || seasons.length} Season${(contentData.number_of_seasons || seasons.length) > 1 ? 's' : ''}`
        : contentData.runtime ? `${Math.floor(contentData.runtime / 60)}h ${contentData.runtime % 60}m` : '';
    const heroBackdrop = contentData.backdrop_path || contentData.poster_path;

    if (isMobileView) {
        const totalEps = episodeCounts[currentSeason] || 10;
        const episodesList = Array.from({ length: totalEps }, (_, i) => ({ episode_number: i + 1 }));
        return (
            <MobileVideoPlayerView
                type={type}
                id={id}
                contentData={contentData}
                playerUrl={getServerUrl(activeServer, type, id, currentSeason, currentEpisode)}
                servers={servers}
                activeServer={activeServer}
                onServerChange={(newServer) => setActiveServer(newServer)}
                currentSeason={currentSeason}
                currentEpisode={currentEpisode}
                onEpisodeChange={handleEpisodeSelect}
                seasons={seasons}
                episodes={episodesList}
                recommendations={recommendations}
            />
        );
    }

    return (
        <div className="xorya-watch-page" style={{
            minHeight: '100vh',
            position: 'relative',
            backgroundColor: 'transparent', // Make transparent so fixed background shows
            paddingTop: '55px',
            overflow: 'hidden' // Ensure pattern doesn't cause scrollbars if it overflows
        }}>
            {/* Blurred Background Image */}
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    zIndex: -1, // Push behind everything
                    pointerEvents: 'none',
                    overflow: 'hidden',
                    backgroundColor: '#0a0a0a' // Base color
                }}
            >
                {contentData && (contentData.backdrop_path || contentData.poster_path) && (
                    <>
                        {/* Single blurred image — PixelImage (144 copies) crashes iOS GPU */}
                        <img
                            src={imageUrl(contentData.backdrop_path || contentData.poster_path, 'w780')}
                            alt=""
                            aria-hidden="true"
                            style={{
                                position: 'absolute',
                                top: '-5%',
                                left: '-5%',
                                width: '110%',
                                height: '110%',
                                objectFit: 'cover',
                                filter: 'blur(40px) brightness(0.85) saturate(0.95)',
                                opacity: 0.85,
                                transform: 'scale(1.1)',
                            }}
                        />
                        {/* Overlay to ensure text readability and blend edges */}
                        <div
                            style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.6) 0%, rgba(10, 10, 10, 0.95) 100%), radial-gradient(circle at center, transparent 0%, #0a0a0a 90%)',
                            }}
                        />
                    </>
                )}
            </div>

            {/* Content Wrapper to ensure it sits above the background */}
            <div className="xorya-watch-shell" style={{
                position: 'relative',
                zIndex: 10,
                zoom: 0.8,
                '--theme-accent': `rgb(${accentColorRgb})`,
                '--theme-accent-rgb': accentColorRgb,
                '--watch-backdrop': heroBackdrop ? `url(${imageUrl(heroBackdrop, 'w1280')})` : 'none'
            }}>
                {/* Structural guides & background grid pattern */}
                <div className="watch-structural-grid">
                    <div className="watch-grid-pattern" />
                    <div className="watch-vert-line line-left" />
                    <div className="watch-vert-line line-right" />
                </div>

                {/* Main Content */}
                <div style={{ display: 'flex', justifyContent: 'center', padding: '0 0 2.4rem', transition: 'all 0.3s ease' }}>
                    <div
                        className="watch-layout-outer"
                        style={{
                            width: '100%',
                            maxWidth: isTheaterMode ? '100vw' : '1720px',
                            padding: isTheaterMode ? '0 0.5rem' : '0 1rem',
                            boxSizing: 'border-box',
                            transition: 'max-width 0.35s ease'
                        }}
                    >
                        <motion.div
                            className="watch-layout"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                minHeight: 'calc(100vh - 120px)',
                                padding: isTheaterMode ? '1rem 1.2rem 2.5rem' : '1.5rem 2.5rem 2.5rem',
                                background: 'rgba(10, 10, 15, 0.45)',
                                backdropFilter: 'blur(40px)',
                                WebkitBackdropFilter: 'blur(40px)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '28px',
                                boxShadow: '0 24px 60px rgba(0, 0, 0, 0.65)',
                                gap: '0px',
                                boxSizing: 'border-box',
                                transition: 'padding 0.35s ease'
                            }}
                        >
                            {/* Hero Details Block */}
                            <div style={{
                                width: '100%',
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'flex-start', // Overrides CSS flex-end
                                minHeight: '0px',
                                paddingBottom: '0px',
                                marginBottom: '0px',
                                gap: '1.6rem',
                                marginTop: '0.2rem',
                                flexWrap: 'wrap'
                            }}>
                                {logoPath ? (
                                    <div style={{ display: 'flex', flexShrink: 0 }}>
                                        <img
                                            src={imageUrl(logoPath, 'w500')}
                                            alt={title}
                                            style={{
                                                height: '52px', // Taller logo
                                                width: 'auto',
                                                maxHeight: '60px',
                                                objectFit: 'contain',
                                                display: 'block'
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <h1 style={{
                                        fontSize: '1.6rem',
                                        fontWeight: '800',
                                        color: 'white',
                                        margin: 0,
                                        letterSpacing: '-0.5px'
                                    }}>
                                        {title}
                                    </h1>
                                )}

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', justifyContent: 'center' }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.6rem',
                                        color: 'rgba(255, 255, 255, 0.65)',
                                        fontSize: '0.82rem',
                                        fontWeight: '600',
                                        flexWrap: 'wrap'
                                    }}>
                                        {releaseYear && <span>{releaseYear}</span>}
                                        {releaseYear && <span style={{ color: 'rgba(255,255,255,0.25)' }}>•</span>}
                                        {genreLine && <span>{genreLine}</span>}
                                        {genreLine && durationLabel && <span style={{ color: 'rgba(255,255,255,0.25)' }}>•</span>}
                                        {durationLabel && <span>{durationLabel}</span>}
                                        {contentData.vote_average > 0 && (
                                            <>
                                                <span style={{ color: 'rgba(255,255,255,0.25)' }}>•</span>
                                                <span style={{ color: '#facc15', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    <Star size={13} fill="#facc15" color="#facc15" />
                                                    {contentData.vote_average.toFixed(1)}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                    {contentData.tagline && (
                                        <p className="watch-hero-tagline" style={{
                                            margin: 0,
                                            color: 'var(--theme-accent)',
                                            fontSize: '0.85rem',
                                            fontStyle: 'italic',
                                            fontWeight: 500
                                        }}>
                                            "{contentData.tagline}"
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Divider Line (Position Control) */}
                            <div style={{
                                width: '100%',
                                height: '1px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                marginTop: '0px',
                                marginBottom: '0px'
                            }} />

                            {/* Columns Wrapper */}
                            <div className="watch-columns" style={{
                                display: 'flex',
                                flexDirection: isTheaterMode ? 'column' : 'row',
                                alignItems: isTheaterMode ? 'center' : 'flex-start',
                                gap: '2.5rem',
                                width: '100%',
                                boxSizing: 'border-box',
                                marginTop: '-1.2rem'
                            }}>
                                {/* Player Area */}
                                <motion.div
                                    className="watch-main"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                                    style={{
                                        flex: 1,
                                        minWidth: 0,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        width: '100%'
                                    }}
                                >
                                    {/* Video Player Container */}
                                    <div
                                        ref={playerFrameRef}
                                        className="watch-player-frame"
                                        style={{
                                            width: '100%',
                                            maxWidth: isTheaterMode ? '100%' : '990px', // Full width in theater mode
                                            margin: '0 auto',
                                            borderRadius: '16px',
                                            overflow: 'hidden',
                                            backgroundColor: 'rgba(0, 0, 0, 0.9)',
                                            boxShadow: '0 24px 70px rgba(0, 0, 0, 0.8), 0 0 40px rgba(var(--theme-accent-rgb), 0.1)',
                                            border: '1px solid rgba(var(--theme-accent-rgb), 0.2)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            position: 'relative'
                                        }}
                                    >
                                        {/* Player Header Bar */}
                                        <div className="watch-player-status" style={{
                                            height: '44px',
                                            padding: '0 1.2rem',
                                            background: 'rgba(15, 15, 20, 0.85)',
                                            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            boxSizing: 'border-box'
                                        }}>
                                            <div style={{
                                                fontSize: '0.85rem',
                                                fontWeight: '600',
                                                color: 'rgba(255, 255, 255, 0.85)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.6rem'
                                            }}>
                                                <span style={{
                                                    width: '8px',
                                                    height: '8px',
                                                    background: 'var(--theme-accent)',
                                                    borderRadius: '50%',
                                                    display: 'inline-block',
                                                    boxShadow: '0 0 8px var(--theme-accent)'
                                                }}></span>
                                                {type === 'tv' ? (
                                                    <span>Now Playing&nbsp;&nbsp; S{currentSeason} • E{currentEpisode} • {currentEpisodeDetails?.name || 'Loading Episode...'}</span>
                                                ) : (
                                                    <span>Now Playing • {title}</span>
                                                )}
                                            </div>
                                            <div style={{
                                                display: 'flex',
                                                gap: '0.6rem',
                                                color: 'rgba(255, 255, 255, 0.75)',
                                                alignItems: 'center'
                                            }}>
                                                {/* Cinema / Theater Mode Toggle Button */}
                                                <button
                                                    onClick={() => setIsTheaterMode(!isTheaterMode)}
                                                    title={isTheaterMode ? "Exit Cinema View" : "Cinema View"}
                                                    style={{
                                                        background: isTheaterMode ? 'rgba(var(--theme-accent-rgb), 0.25)' : 'rgba(255, 255, 255, 0.08)',
                                                        border: isTheaterMode ? '1px solid var(--theme-accent)' : '1px solid rgba(255, 255, 255, 0.12)',
                                                        color: isTheaterMode ? 'var(--theme-accent)' : 'white',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.4rem',
                                                        padding: '0.3rem 0.65rem',
                                                        borderRadius: '6px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: '600',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                >
                                                    <Minimize2 size={13} style={{ transform: isTheaterMode ? 'none' : 'rotate(45deg)' }} />
                                                    <span>{isTheaterMode ? 'Exit Cinema' : 'Cinema View'}</span>
                                                </button>

                                                {/* Fullscreen Button */}
                                                <button
                                                    onClick={toggleFullscreen}
                                                    title="Fullscreen"
                                                    style={{
                                                        background: 'rgba(255, 255, 255, 0.08)',
                                                        border: '1px solid rgba(255, 255, 255, 0.12)',
                                                        color: 'white',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.4rem',
                                                        padding: '0.3rem 0.65rem',
                                                        borderRadius: '6px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: '600',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                >
                                                    <Maximize2 size={13} />
                                                    <span>Fullscreen</span>
                                                </button>
                                            </div>
                                        </div>

                                        <div style={{ width: '100%', aspectRatio: '16/9' }}>
                                            <iframe
                                                ref={iframeRef}
                                                key={iframeKey}
                                                src={playerUrl}

                                                onLoad={handleIframeLoad}
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    border: 'none'
                                                }}
                                                allowFullScreen
                                                webkitAllowFullScreen
                                                mozAllowFullScreen
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen *"
                                                referrerPolicy="no-referrer-when-downgrade"
                                                scrolling="no"
                                            />
                                        </div>
                                    </div>

                                    {/* Under-Player Control Bar */}
                                    {contentData && (
                                        <div className="watch-action-bar" style={{
                                            width: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            marginTop: '1.2rem',
                                            flexWrap: 'wrap',
                                            gap: '1rem',
                                            boxSizing: 'border-box',
                                            padding: '0 0.2rem'
                                        }}>
                                            {/* Left side: Action Utilities */}
                                            <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                                {(() => {
                                                    const entry = getEntryByTmdbId(id);
                                                    const isMustWatch = entry?.tierId === 'tier_good';
                                                    const isMaybeLater = entry?.tierId === 'tier_maybe';

                                                    const mediaObj = {
                                                        tmdbId: id,
                                                        type: type,
                                                        title: type === 'movie' ? contentData.title : contentData.name,
                                                        poster: contentData.poster_path,
                                                        backdrop: contentData.backdrop_path,
                                                        year: (contentData.release_date || contentData.first_air_date)?.split('-')[0],
                                                        rating: contentData.vote_average?.toFixed(1)
                                                    };

                                                    const toggleMustWatch = () => {
                                                        if (isMustWatch) removeEntry(entry.id);
                                                        else addEntry('tier_good', mediaObj);
                                                    };

                                                    const toggleMaybeLater = () => {
                                                        if (isMaybeLater) removeEntry(entry.id);
                                                        else addEntry('tier_maybe', mediaObj);
                                                    };

                                                    return (
                                                        <>
                                                            <button
                                                                onClick={toggleMustWatch}
                                                                style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '0.5rem',
                                                                    padding: '0.6rem 1.2rem',
                                                                    borderRadius: '30px',
                                                                    background: isMustWatch ? 'rgba(255, 165, 2, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                                                                    border: isMustWatch ? '1px solid #ffa502' : '1px solid rgba(255, 255, 255, 0.1)',
                                                                    color: isMustWatch ? '#ffa502' : 'rgba(255, 255, 255, 0.8)',
                                                                    fontSize: '0.82rem',
                                                                    fontWeight: '600',
                                                                    cursor: 'pointer',
                                                                    transition: 'all 0.25s ease',
                                                                    boxShadow: isMustWatch ? '0 0 12px rgba(255, 165, 2, 0.15)' : 'none'
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    if (!isMustWatch) {
                                                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                                                                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                                                                    }
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    if (!isMustWatch) {
                                                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                                                                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                                                    }
                                                                }}
                                                            >
                                                                <Heart size={16} fill={isMustWatch ? '#ffa502' : 'none'} />
                                                                Must Watch
                                                            </button>

                                                            <button
                                                                onClick={toggleMaybeLater}
                                                                style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '0.5rem',
                                                                    padding: '0.6rem 1.2rem',
                                                                    borderRadius: '30px',
                                                                    background: isMaybeLater ? 'rgba(var(--theme-accent-rgb), 0.15)' : 'rgba(255, 255, 255, 0.04)',
                                                                    border: isMaybeLater ? '1px solid var(--theme-accent)' : '1px solid rgba(255, 255, 255, 0.1)',
                                                                    color: isMaybeLater ? 'var(--theme-accent)' : 'rgba(255, 255, 255, 0.8)',
                                                                    fontSize: '0.82rem',
                                                                    fontWeight: '600',
                                                                    cursor: 'pointer',
                                                                    transition: 'all 0.25s ease',
                                                                    boxShadow: isMaybeLater ? '0 0 12px rgba(var(--theme-accent-rgb), 0.15)' : 'none'
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    if (!isMaybeLater) {
                                                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                                                                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                                                                    }
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    if (!isMaybeLater) {
                                                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                                                                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                                                    }
                                                                }}
                                                            >
                                                                <Bookmark size={16} fill={isMaybeLater ? 'var(--theme-accent)' : 'none'} />
                                                                Maybe Later
                                                            </button>
                                                        </>
                                                    );
                                                })()}

                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(window.location.href);
                                                        setShareToast(true);
                                                        setTimeout(() => setShareToast(false), 2000);
                                                    }}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.5rem',
                                                        padding: '0.6rem 1.2rem',
                                                        borderRadius: '30px',
                                                        background: 'rgba(255, 255, 255, 0.04)',
                                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                                        color: 'rgba(255, 255, 255, 0.8)',
                                                        fontSize: '0.82rem',
                                                        fontWeight: '600',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.25s ease',
                                                        position: 'relative'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                                                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                                                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                                    }}
                                                >
                                                    <Share2 size={16} />
                                                    Share
                                                    {shareToast && (
                                                        <span style={{
                                                            position: 'absolute',
                                                            bottom: '125%',
                                                            left: '50%',
                                                            transform: 'translateX(-50%)',
                                                            background: 'rgba(0, 0, 0, 0.85)',
                                                            color: 'white',
                                                            padding: '4px 8px',
                                                            borderRadius: '6px',
                                                            fontSize: '0.7rem',
                                                            pointerEvents: 'none',
                                                            whiteSpace: 'nowrap',
                                                            border: '1px solid rgba(255, 255, 255, 0.15)',
                                                            boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                                                            zIndex: 20
                                                        }}>
                                                            Link Copied!
                                                        </span>
                                                    )}
                                                </button>

                                                <button
                                                    onClick={() => handleServerChange('rive-download')}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.5rem',
                                                        padding: '0.6rem 1.2rem',
                                                        borderRadius: '30px',
                                                        background: 'rgba(255, 255, 255, 0.04)',
                                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                                        color: 'rgba(255, 255, 255, 0.8)',
                                                        fontSize: '0.82rem',
                                                        fontWeight: '600',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.25s ease'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                                                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                                                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                                    }}
                                                >
                                                    <Download size={16} />
                                                    Download
                                                </button>
                                            </div>

                                            {/* Right side: Episode Navigation (TV Shows only) */}
                                            {type === 'tv' && (
                                                <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                                                    <button
                                                        onClick={handlePreviousEpisode}
                                                        disabled={currentEpisode === 1}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.4rem',
                                                            padding: '0.6rem 1.2rem',
                                                            borderRadius: '30px',
                                                            background: 'rgba(255, 255, 255, 0.04)',
                                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                                            color: 'rgba(255, 255, 255, 0.8)',
                                                            fontSize: '0.82rem',
                                                            fontWeight: '600',
                                                            cursor: currentEpisode === 1 ? 'not-allowed' : 'pointer',
                                                            opacity: currentEpisode === 1 ? 0.4 : 1,
                                                            transition: 'all 0.25s ease'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            if (currentEpisode > 1) {
                                                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                                                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                                                            }
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            if (currentEpisode > 1) {
                                                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                                                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                                            }
                                                        }}
                                                    >
                                                        <ChevronLeft size={16} />
                                                        Previous
                                                    </button>

                                                    <button
                                                        className="watch-next-button"
                                                        onClick={handleNextEpisode}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.4rem',
                                                            padding: '0.6rem 1.2rem',
                                                            borderRadius: '30px',
                                                            background: 'var(--theme-accent)',
                                                            border: '1px solid var(--theme-accent)',
                                                            color: '#000',
                                                            fontSize: '0.82rem',
                                                            fontWeight: '700',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.25s ease',
                                                            boxShadow: '0 4px 14px rgba(var(--theme-accent-rgb), 0.3)'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.filter = 'brightness(1.1)';
                                                            e.currentTarget.style.boxShadow = '0 6px 20px rgba(var(--theme-accent-rgb), 0.45)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.filter = 'none';
                                                            e.currentTarget.style.boxShadow = '0 4px 14px rgba(var(--theme-accent-rgb), 0.3)';
                                                        }}
                                                    >
                                                        Next
                                                        <ChevronRight size={16} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Tabbed Details Area - only shown in normal (non-theater) mode */}
                                    {!isTheaterMode && (
                                        <div className="watch-details-wrap" style={{
                                            width: '100%',
                                            maxWidth: '990px',
                                            boxSizing: 'border-box',
                                            margin: '1.5rem auto 0',
                                        }}>
                                            <WatchDetailsTabs
                                                contentData={contentData}
                                                type={type}
                                                season={currentSeason}
                                                episode={currentEpisode}
                                                activeServer={activeServer}
                                                onServerChange={handleServerChange}
                                                onReload={handleReload}
                                                onDownload={() => handleServerChange('rive-download')}
                                            />
                                        </div>
                                    )}

                                </motion.div>

                                {/* ── Theater Mode: Tabs + Sidebar side-by-side row ── */}
                                {isTheaterMode && (
                                    <div style={{
                                        display: 'flex',
                                        gap: '2rem',
                                        width: '100%',
                                        alignItems: 'flex-start',
                                        marginTop: '1.5rem'
                                    }}>
                                        {/* Left: Overview / Servers / Downloads tabs */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <WatchDetailsTabs
                                                contentData={contentData}
                                                type={type}
                                                season={currentSeason}
                                                episode={currentEpisode}
                                                activeServer={activeServer}
                                                onServerChange={handleServerChange}
                                                onReload={handleReload}
                                                onDownload={() => handleServerChange('rive-download')}
                                            />
                                        </div>
                                        {/* Right: Episodes Sidebar (TV) */}
                                        {type === 'tv' && (
                                            <div style={{ width: '450px', flexShrink: 0 }}>
                                                <EpisodesSidebar
                                                    showId={id}
                                                    seasons={seasons}
                                                    currentSeason={currentSeason}
                                                    currentEpisode={currentEpisode}
                                                    onSeasonChange={setCurrentSeason}
                                                    onEpisodeSelect={handleEpisodeSelect}
                                                    onEpisodesLoaded={(season, count) =>
                                                        setEpisodeCounts(prev => ({ ...prev, [season]: count }))
                                                    }
                                                    showData={contentData}
                                                    recommendations={recommendations}
                                                    hideTabs={false}
                                                />
                                            </div>
                                        )}
                                        {/* Right: Movie Sidebar (Movies) */}
                                        {type === 'movie' && (
                                            <div style={{ width: '450px', flexShrink: 0 }}>
                                                <EpisodesSidebar
                                                    showId={id}
                                                    mediaType="movie"
                                                    showData={contentData}
                                                    recommendations={recommendations}
                                                    hideTabs={false}
                                                />
                                            </div>
                                        )}

                                    </div>
                                )}

                                {/* ── Normal Mode Sidebars ── */}
                                {/* Episodes Sidebar (TV Shows Only) */}
                                {!isTheaterMode && type === 'tv' && (
                                    <motion.div
                                        className="watch-sidebar"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
                                        style={{
                                            width: isTheaterMode ? '100%' : '510px',
                                            flexShrink: 0,
                                            minWidth: 0,
                                            position: isTheaterMode ? 'relative' : 'sticky',
                                            top: '1.1rem',
                                            height: isTheaterMode ? 'auto' : 'calc(100% - 1.1rem)',
                                            display: 'flex',
                                            flexDirection: 'column'
                                        }}
                                    >
                                        <EpisodesSidebar
                                            showId={id}
                                            seasons={seasons}
                                            currentSeason={currentSeason}
                                            currentEpisode={currentEpisode}
                                            onSeasonChange={setCurrentSeason}
                                            onEpisodeSelect={handleEpisodeSelect}
                                            onEpisodesLoaded={(season, count) =>
                                                setEpisodeCounts(prev => ({ ...prev, [season]: count }))
                                            }
                                            showData={contentData}
                                            recommendations={recommendations}
                                            hideTabs={false}
                                        />
                                    </motion.div>
                                )}

                                {/* Movie Sidebar (Details, Cast, More Like This) */}
                                {!isTheaterMode && type === 'movie' && (
                                    <motion.div
                                        className="watch-sidebar"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
                                        style={{
                                            width: isTheaterMode ? '100%' : '510px',
                                            flexShrink: 0,
                                            minWidth: 0,
                                            position: isTheaterMode ? 'relative' : 'sticky',
                                            top: '1.1rem',
                                            height: isTheaterMode ? 'auto' : 'calc(100% - 1.1rem)',
                                            display: 'flex',
                                            flexDirection: 'column'
                                        }}
                                    >
                                        <EpisodesSidebar
                                            showId={id}
                                            mediaType="movie"
                                            showData={contentData}
                                            recommendations={recommendations}
                                            hideTabs={false}
                                        />
                                    </motion.div>
                                )}

                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Movie Collection / Next in Sequence */}
                {collectionData && collectionData.parts && collectionData.parts.length > 1 && (
                    <div style={{
                        maxWidth: '1500px',
                        margin: '2rem auto 4rem',
                        padding: '0 1rem',
                        color: 'white',
                    }}>
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.02)',
                            backdropFilter: 'blur(12px)',
                            WebkitBackdropFilter: 'blur(12px)',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            borderRadius: '20px',
                            padding: '2rem',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            {/* Inner ambient glow */}
                            <div style={{
                                position: 'absolute',
                                top: '-50%',
                                left: '-10%',
                                width: '120%',
                                height: '200%',
                                background: 'radial-gradient(circle at top right, rgba(229, 9, 20, 0.05) 0%, transparent 60%)',
                                pointerEvents: 'none',
                                zIndex: 0
                            }} />

                            <h2 style={{
                                fontSize: '1.5rem',
                                fontWeight: 'bold',
                                marginBottom: '1.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                position: 'relative',
                                zIndex: 1
                            }}>
                                <div style={{ width: '4px', height: '24px', background: '#e50914', borderRadius: '4px' }}></div>
                                Watch in Sequence: {collectionData.name}
                            </h2>

                            <div style={{
                                display: 'flex',
                                gap: '1.5rem',
                                overflowX: 'auto',
                                paddingBottom: '1rem',
                                position: 'relative',
                                zIndex: 1,
                                scrollbarWidth: 'thin',
                                scrollbarColor: 'rgba(255,255,255,0.2) transparent'
                            }}>
                                {collectionData.parts
                                    // Make sure we have a poster and sort by release date roughly
                                    .filter(p => p.poster_path)
                                    .sort((a, b) => new Date(a.release_date || '2099') - new Date(b.release_date || '2099'))
                                    .map((part) => {
                                        const isCurrent = part.id.toString() === id.toString();
                                        return (
                                            <div
                                                key={part.id}
                                                onClick={() => {
                                                    if (!isCurrent) navigate(`/watch/movie/${part.id}`);
                                                }}
                                                style={{
                                                    flex: '0 0 auto',
                                                    width: '180px',
                                                    cursor: isCurrent ? 'default' : 'pointer',
                                                    opacity: isCurrent ? 0.6 : 1,
                                                    transition: 'all 0.3s ease',
                                                    filter: isCurrent ? 'grayscale(0.6)' : 'none',
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (!isCurrent) {
                                                        e.currentTarget.style.transform = 'translateY(-10px)';
                                                        e.currentTarget.style.filter = 'brightness(1.2) drop-shadow(0 10px 20px rgba(229,9,20,0.2))';
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (!isCurrent) {
                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                        e.currentTarget.style.filter = 'none';
                                                    }
                                                }}
                                            >
                                                <div style={{
                                                    width: '100%',
                                                    aspectRatio: '2/3',
                                                    borderRadius: '12px',
                                                    overflow: 'hidden',
                                                    marginBottom: '0.75rem',
                                                    position: 'relative',
                                                    boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
                                                    border: isCurrent ? '2px solid rgba(255,255,255,0.3)' : '1px solid rgba(255,255,255,0.1)'
                                                }}>
                                                    <img
                                                        src={imageUrl(part.poster_path, 'w300')}
                                                        alt={part.title}
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        loading="lazy"
                                                    />
                                                    {isCurrent && (
                                                        <div style={{
                                                            position: 'absolute',
                                                            bottom: 0,
                                                            left: 0,
                                                            right: 0,
                                                            background: 'rgba(0,0,0,0.8)',
                                                            color: 'white',
                                                            textAlign: 'center',
                                                            padding: '0.5rem',
                                                            fontSize: '0.8rem',
                                                            fontWeight: 'bold',
                                                            backdropFilter: 'blur(4px)'
                                                        }}>
                                                            Currently Playing
                                                        </div>
                                                    )}
                                                </div>
                                                <h3 style={{
                                                    fontSize: '0.9rem',
                                                    fontWeight: '600',
                                                    margin: 0,
                                                    color: isCurrent ? 'rgba(255,255,255,0.6)' : 'white',
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden',
                                                    lineHeight: 1.3
                                                }}>
                                                    {part.title}
                                                </h3>
                                                <p style={{
                                                    fontSize: '0.8rem',
                                                    color: 'rgba(255,255,255,0.4)',
                                                    margin: '0.2rem 0 0 0'
                                                }}>
                                                    {part.release_date?.split('-')[0]}
                                                </p>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    </div>
                )}

                {/* Recommended / Similar Content */}
                {recommendations && recommendations.length > 0 && (
                    <div style={{
                        maxWidth: '1720px',
                        margin: '2rem auto 4rem',
                        padding: '0 1.5rem',
                        boxSizing: 'border-box'
                    }}>
                        <div style={{
                            background: 'rgba(10, 10, 15, 0.3)',
                            backdropFilter: 'blur(30px)',
                            WebkitBackdropFilter: 'blur(30px)',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            borderRadius: '24px',
                            padding: '2rem',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                            className="watch-recommendations-row"
                        >
                            {/* Ambient glow in matching theme color */}
                            <div style={{
                                position: 'absolute',
                                top: '-50%',
                                left: '-10%',
                                width: '120%',
                                height: '200%',
                                background: 'radial-gradient(circle at top right, rgba(var(--theme-accent-rgb), 0.05) 0%, transparent 60%)',
                                pointerEvents: 'none',
                                zIndex: 0
                            }} />

                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <MovieRow
                                    title={`Because You Watched ${title}`}
                                    movies={recommendations}
                                />
                            </div>
                        </div>

                        <style>{`
                            .watch-recommendations-row {
                                transition: border-color 0.3s ease;
                            }
                            .watch-recommendations-row:hover {
                                border-color: rgba(var(--theme-accent-rgb), 0.15) !important;
                            }
                        `}</style>
                    </div>
                )}

                {/* Spin animation for loading */}
                <style>
                    {`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }

                    @media (max-width: 1200px) {
                        .watch-columns {
                            flex-direction: column !important;
                            gap: 2rem !important;
                        }
                        .watch-sidebar {
                            width: 100% !important;
                            margin-left: 0 !important;
                            margin-right: 0 !important;
                        }
                    }

                    @media (max-width: 768px) {
                        .watch-layout {
                            padding: 1.25rem !important;
                            border-radius: 20px !important;
                            gap: 1.5rem !important;
                        }
                        .watch-layout-outer {
                            width: 100% !important;
                            padding: 0 0.5rem !important;
                        }
                        .watch-columns {
                            flex-direction: column !important;
                            gap: 1.5rem !important;
                        }
                        .watch-main {
                            width: 100%;
                        }
                        .watch-sidebar {
                            width: 100% !important;
                            margin-left: 0 !important;
                            margin-right: 0 !important;
                            margin-top: 0 !important;
                        }
                    }
                `}
                </style>
                {/* Fallback Toast Notification */}
                <AnimatePresence>
                    {fallbackToast && (
                        <motion.div
                            initial={{ opacity: 0, y: 50, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.9 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            style={{
                                position: 'fixed',
                                bottom: '2rem',
                                left: '2rem',
                                background: 'rgba(15, 15, 20, 0.85)',
                                backdropFilter: 'blur(20px)',
                                WebkitBackdropFilter: 'blur(20px)',
                                border: '1px solid rgba(0, 188, 212, 0.3)',
                                borderRadius: '16px',
                                padding: '1rem 1.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.8rem',
                                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 188, 212, 0.1)',
                                zIndex: 999999,
                                color: 'white',
                                maxWidth: '380px'
                            }}
                        >
                            <div style={{
                                width: '8px',
                                height: '8px',
                                background: '#00bcd4',
                                borderRadius: '50%',
                                boxShadow: '0 0 8px #00bcd4'
                            }} />
                            <div style={{ fontSize: '0.88rem', fontWeight: '500' }}>
                                Server slow. Auto-switched to <span style={{ color: '#00bcd4', fontWeight: '700' }}>{fallbackToast}</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default VideoPlayer;
