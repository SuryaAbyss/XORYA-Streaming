import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, Bookmark, ChevronLeft, ChevronRight } from 'lucide-react';
import { getMovieDetails, getTVShowDetails, imageUrl, getMovieImages, getTVShowImages, getCollectionDetails, getMovieRecommendations, getTVShowRecommendations } from '../api/tmdb';
import { useWatchlist } from '../hooks/useWatchlist';
import { servers, getServerUrl } from '../config/servers';
import ServerSelector from '../components/ServerSelector';
import EpisodesSidebar from '../components/EpisodesSidebar';
import MovieInfoSidebar from '../components/MovieInfoSidebar';
import MovieRow from '../components/MovieRow';
import DownloadButton from '../components/DownloadButton';


const VideoPlayer = () => {
    const { type, id, season: urlSeason, episode: urlEpisode } = useParams();
    const navigate = useNavigate();
    const { syncPlaybackWithWatchlist, getEntryByTmdbId, addEntry, removeEntry } = useWatchlist();

    const [contentData, setContentData] = useState(null);
    const [logoPath, setLogoPath] = useState(null);
    const [collectionData, setCollectionData] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeServer, setActiveServer] = useState('vidfast');

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
        } catch { }
        return { s: 1, e: 1 };
    };

    const initProg = getInitialProgress();
    const [currentSeason, setCurrentSeason] = useState(initProg.s);
    const [currentEpisode, setCurrentEpisode] = useState(initProg.e);

    // Keep state perfectly in sync if URL changes outside of component load
    useEffect(() => {
        if (urlSeason && urlEpisode) {
            setCurrentSeason(parseInt(urlSeason));
            setCurrentEpisode(parseInt(urlEpisode));
        }
    }, [urlSeason, urlEpisode]);
    const [seasons, setSeasons] = useState([]);
    // Tracks total episode count per season: { 1: 10, 2: 13, ... }
    const [episodeCounts, setEpisodeCounts] = useState({});

    useEffect(() => {
        fetchContentData();
    }, [type, id]);

    // Handle vidsrc.wtf Watch Progress
    useEffect(() => {
        const handleMessage = (event) => {
            if (event.origin !== "https://vidsrc.wtf" && event.origin !== "https://www.vidsrc.wtf") return;
            if (event.data?.type === "MEDIA_DATA") {
                const mediaData = event.data.data;
                localStorage.setItem("vidsrcwtf-Progress", JSON.stringify(mediaData));
            }
        };

        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, []);

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
            } catch { }
        }
    }, [type, id, urlSeason, urlEpisode, navigate, getEntryByTmdbId]);

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
                episode: type === 'tv' ? currentEpisode : undefined
            });
        }, 1000);
        return () => clearTimeout(timer);
    }, [id, type, contentData, currentSeason, currentEpisode, syncPlaybackWithWatchlist]);

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

                // Fetch recommendations
                try {
                    const recResponse = await getMovieRecommendations(id);
                    setRecommendations(recResponse.data.results.filter(r => r.poster_path));
                } catch (recError) {
                    console.warn('Failed to fetch movie recommendations:', recError);
                }
            } else {
                const response = await getTVShowDetails(id);
                data = response.data;
                setSeasons(data.seasons?.filter(s => s.season_number > 0) || []);

                // Fetch Logo for TV Show safely
                try {
                    const images = await getTVShowImages(id);
                    if (images.data.logos.length > 0) {
                        logo = images.data.logos[0].file_path;
                    }
                } catch (imgError) {
                    console.warn('Failed to fetch TV logo:', imgError);
                }

                // Fetch recommendations
                try {
                    const recResponse = await getTVShowRecommendations(id);
                    setRecommendations(recResponse.data.results.filter(r => r.poster_path));
                } catch (recError) {
                    console.warn('Failed to fetch tv recommendations:', recError);
                }
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

    const handleEpisodeSelect = (season, episode) => {
        setCurrentSeason(season);
        setCurrentEpisode(episode);
        // Update URL
        navigate(`/watch/tv/${id}/season/${season}/episode/${episode}`, { replace: true });
    };

    const handlePreviousEpisode = () => {
        if (currentEpisode > 1) {
            handleEpisodeSelect(currentSeason, currentEpisode - 1);
        }
    };

    const handleNextEpisode = () => {
        const totalEpisodesInCurrentSeason = episodeCounts[currentSeason];
        // If we know the count and are at the last episode, jump to next season
        if (totalEpisodesInCurrentSeason && currentEpisode >= totalEpisodesInCurrentSeason) {
            const currentSeasonIndex = seasons.findIndex(s => s.season_number === currentSeason);
            const nextSeason = seasons[currentSeasonIndex + 1];
            if (nextSeason) {
                handleEpisodeSelect(nextSeason.season_number, 1);
            }
        } else {
            handleEpisodeSelect(currentSeason, currentEpisode + 1);
        }
    };

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '50px',
                        height: '50px',
                        border: '3px solid rgba(0, 188, 212, 0.3)',
                        borderTop: '3px solid #00bcd4',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 1rem'
                    }}></div>
                    <p>Loading player...</p>
                </div>
            </div>
        );
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

    // Generate URL using logic we fixed earlier (passing handles for TV correctly)
    const playerUrl = getServerUrl(
        activeServer,
        type,
        id,
        type === 'tv' ? currentSeason : null,
        type === 'tv' ? currentEpisode : null
    );

    const title = type === 'movie' ? contentData.title : contentData.name;
    const displayTitle = type === 'tv'
        ? `${title} - Season ${currentSeason} Episode ${currentEpisode}`
        : title;

    return (
        <div style={{
            minHeight: '100vh',
            position: 'relative',
            backgroundColor: 'transparent', // Make transparent so fixed background shows
            paddingTop: '80px',
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
                                filter: 'blur(5px) brightness(0.45)',
                                opacity: 0.85,
                                transform: 'scale(1.1)',
                            }}
                        />
                        {/* Overlay to ensure text readability and blend edges */}
                        <div
                            style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'radial-gradient(circle at center, transparent 0%, #0a0a0a 90%)',
                            }}
                        />
                    </>
                )}
            </div>

            {/* Content Wrapper to ensure it sits above the background */}
            <div style={{ position: 'relative', zIndex: 10, zoom: 0.8 }}>
                {/* Header */}
                {/* Floating Glass Header Island */}
                <div style={{
                    position: 'fixed',
                    top: '1rem',
                    left: '1rem',
                    width: 'fit-content',
                    background: 'rgba(28, 28, 30, 0.6)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    borderRadius: '28px',
                    padding: '0.65rem 1rem',
                    zIndex: 100,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.4rem',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                    maxWidth: 'calc(100vw - 2rem)',
                    boxSizing: 'border-box',
                }}>
                    <button
                        onClick={() => navigate(-1)}
                        style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '44px',
                            height: '44px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                            e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                    >
                        <ArrowLeft size={22} />
                    </button>

                    {logoPath ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <img
                                src={imageUrl(logoPath, 'w500')}
                                alt={title}
                                style={{
                                    maxHeight: '44px',
                                    maxWidth: '180px',
                                    width: 'auto',
                                    objectFit: 'contain'
                                }}
                            />
                            {type === 'tv' && (
                                <span style={{
                                    fontSize: '0.9rem',
                                    color: 'rgba(255, 255, 255, 0.7)',
                                    borderLeft: '1px solid rgba(255, 255, 255, 0.2)',
                                    paddingLeft: '1rem'
                                }}>
                                    S{currentSeason} : E{currentEpisode}
                                </span>
                            )}
                        </div>
                    ) : (
                        <h1 style={{
                            fontSize: '1.1rem',
                            fontWeight: '600',
                            color: 'rgba(255, 255, 255, 0.9)',
                            margin: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '400px',
                            letterSpacing: '0.5px'
                        }}>
                            {displayTitle}
                        </h1>
                    )}

                    <div style={{ width: '1px', height: '24px', background: 'rgba(255, 255, 255, 0.1)' }}></div>

                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        {(() => {
                            const entry = getEntryByTmdbId(id);
                            const isMustWatch = entry?.tierId === 'tier_good';
                            const isMaybeLater = entry?.tierId === 'tier_maybe';

                            const mediaObj = contentData ? {
                                tmdbId: id,
                                type: type,
                                title: type === 'movie' ? contentData.title : contentData.name,
                                poster: contentData.poster_path,
                                backdrop: contentData.backdrop_path,
                                year: (contentData.release_date || contentData.first_air_date)?.split('-')[0],
                                rating: contentData.vote_average?.toFixed(1)
                            } : null;

                            const toggleMustWatch = () => {
                                if (!mediaObj) return;
                                if (isMustWatch) removeEntry(entry.id);
                                else addEntry('tier_good', mediaObj);
                            };

                            const toggleMaybeLater = () => {
                                if (!mediaObj) return;
                                if (isMaybeLater) removeEntry(entry.id);
                                else addEntry('tier_maybe', mediaObj);
                            };

                            return (
                                <>
                                    <button
                                        onClick={toggleMustWatch}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            padding: '0.5rem',
                                            color: isMustWatch ? '#ffa502' : 'rgba(255, 255, 255, 0.7)',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            transform: isMustWatch ? 'scale(1.1)' : 'scale(1)',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.color = isMustWatch ? '#ffa502' : 'white';
                                            e.currentTarget.style.transform = 'scale(1.1)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.color = isMustWatch ? '#ffa502' : 'rgba(255, 255, 255, 0.7)';
                                            e.currentTarget.style.transform = isMustWatch ? 'scale(1.1)' : 'scale(1)';
                                        }}
                                    >
                                        <Heart size={22} fill={isMustWatch ? '#ffa502' : 'none'} />
                                    </button>
                                    <button
                                        onClick={toggleMaybeLater}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            padding: '0.5rem',
                                            color: isMaybeLater ? '#00bcd4' : 'rgba(255, 255, 255, 0.7)',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            transform: isMaybeLater ? 'scale(1.1)' : 'scale(1)',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.color = isMaybeLater ? '#00bcd4' : 'white';
                                            e.currentTarget.style.transform = 'scale(1.1)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.color = isMaybeLater ? '#00bcd4' : 'rgba(255, 255, 255, 0.7)';
                                            e.currentTarget.style.transform = isMaybeLater ? 'scale(1.1)' : 'scale(1)';
                                        }}
                                    >
                                        <Bookmark size={22} fill={isMaybeLater ? '#00bcd4' : 'none'} />
                                    </button>
                                </>
                            );
                        })()}
                    </div>
                </div>

                {/* Main Content */}
                <div style={{ display: 'flex', justifyContent: 'center', padding: '0.75rem 0 2.4rem' }}>
                    <div
                        className="watch-layout-outer"
                        style={{ width: '100%' }}
                    >
                        <div
                            className="watch-layout"
                            style={{
                                display: 'flex',
                                minHeight: 'calc(100vh - 80px)',
                                padding: '1.1rem 1.1rem 0',
                                maxWidth: '1600px',
                                margin: '0 auto',
                                gap: '1.5rem',
                                boxSizing: 'border-box',
                            }}
                        >
                            {/* Player Area */}
                            <div
                                className="watch-main"
                                style={{
                                    flex: 1,
                                    minWidth: 0,
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}
                            >
                                {/* Video Player Container */}
                                <div style={{
                                    width: '100%',
                                    maxWidth: '990px', // Slightly reduced from 1100px
                                    margin: '0 auto',
                                    aspectRatio: '16/9',
                                    borderRadius: '14px',
                                    overflow: 'hidden',
                                    backgroundColor: 'rgba(0, 0, 0, 0.9)', // Ensure background is dark
                                    boxShadow: '0 18px 45px rgba(0, 0, 0, 0.7)',
                                    position: 'relative'
                                }}>

                                    <iframe
                                        src={playerUrl}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            border: 'none'
                                        }}
                                        allowFullScreen
                                        webkitAllowFullScreen
                                        mozAllowFullScreen
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                                        referrerPolicy="no-referrer-when-downgrade"
                                        scrolling="no"
                                    />
                                </div>

                                {/* Previous/Next Controls for TV Shows */}
                                {type === 'tv' && (
                                    <div style={{
                                        display: 'flex',
                                        gap: '1rem',
                                        marginTop: '1.15rem',
                                        justifyContent: 'center'
                                    }}>
                                        <button
                                            onClick={handlePreviousEpisode}
                                            disabled={currentEpisode === 1}
                                            style={{
                                                padding: '0.75rem 1.5rem',
                                                background: currentEpisode === 1
                                                    ? 'rgba(255, 255, 255, 0.03)'
                                                    : 'rgba(255, 255, 255, 0.08)',
                                                backdropFilter: 'blur(15px)',
                                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                                borderRadius: '10px',
                                                color: currentEpisode === 1 ? 'rgba(255,255,255,0.3)' : 'white',
                                                fontSize: '0.85rem',
                                                fontWeight: '600',
                                                cursor: currentEpisode === 1 ? 'not-allowed' : 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                transition: 'all 0.3s ease',
                                                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                                            }}
                                        >
                                            <ChevronLeft size={18} />
                                            Previous
                                        </button>
                                        <button
                                            onClick={handleNextEpisode}
                                            style={{
                                                padding: '0.75rem 1.5rem',
                                                background: 'rgba(255, 255, 255, 0.08)',
                                                backdropFilter: 'blur(15px)',
                                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                                borderRadius: '10px',
                                                color: 'white',
                                                fontSize: '0.85rem',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                transition: 'all 0.3s ease',
                                                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                                            }}
                                        >
                                            Next
                                            <ChevronRight size={18} />
                                        </button>
                                    </div>
                                )}

                                {/* Server Selector */}
                                <div style={{
                                    width: '100%',
                                    maxWidth: '990px', // Matches the player's maxWidth
                                    boxSizing: 'border-box',
                                    margin: '1rem auto 0',
                                    borderRadius: '20px',
                                    padding: '1.2rem',
                                    background: 'rgba(255, 255, 255, 0.01)', // Much more transparent
                                    backdropFilter: 'blur(12px)',
                                    WebkitBackdropFilter: 'blur(12px)',
                                    border: '1px solid rgba(255, 255, 255, 0.05)',
                                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                                }}>
                                    <ServerSelector
                                        servers={servers}
                                        activeServer={activeServer}
                                        onServerChange={handleServerChange}
                                    />
                                </div>


                            </div>

                            {/* Episodes Sidebar (TV Shows Only) */}
                            {type === 'tv' && (
                                <div
                                    className="watch-sidebar"
                                    style={{
                                        width: '490px',
                                        flexShrink: 0,
                                        minWidth: 0
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
                                    />
                                    <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                                        <DownloadButton
                                            onDownload={() => handleServerChange('rive-download')}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Movie Details Sidebar (Movies Only) */}
                            {type === 'movie' && (
                                <div
                                    className="watch-sidebar"
                                    style={{
                                        width: '480px',
                                        flexShrink: 0,
                                        minWidth: 0,
                                        alignSelf: 'flex-start', // Keeps it at the top
                                        marginTop: '10px', // <--- Change this to move it down (e.g., '20px')
                                        marginLeft: '-8px', // <--- Change this to add space from the player
                                        marginRight: '25px' // <--- Change this to add space from the player
                                    }}
                                >
                                    <MovieInfoSidebar movie={contentData} />
                                    <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                                        <DownloadButton
                                            onDownload={() => handleServerChange('rive-download')}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
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
                    <div style={{ maxWidth: '1500px', margin: '0 auto 4rem', padding: '0 1rem' }}>
                        <MovieRow
                            title="More Like This"
                            movies={recommendations}
                        />
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
                        .watch-layout {
                            flex-direction: column;
                        }
                        .watch-sidebar {
                            width: 100% !important;
                            margin-left: 0 !important;
                            margin-right: 0 !important;
                        }
                    }

                    @media (max-width: 768px) {
                        .watch-layout {
                            flex-direction: column;
                            padding: 0.5rem 0.5rem 0;
                            gap: 1rem;
                        }
                        .watch-layout-outer {
                            width: 100% !important;
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
            </div>
        </div>
    );
};

export default VideoPlayer;
