import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, Bookmark, ChevronLeft, ChevronRight } from 'lucide-react';
import { getMovieDetails, getTVShowDetails, imageUrl, getMovieImages, getTVShowImages } from '../api/tmdb';
import { servers, getServerUrl } from '../config/servers';
import ServerSelector from '../components/ServerSelector';
import EpisodesSidebar from '../components/EpisodesSidebar';
import MovieInfoSidebar from '../components/MovieInfoSidebar';
import PixelImage from '../components/PixelImage';

const VideoPlayer = () => {
    const { type, id, season: urlSeason, episode: urlEpisode } = useParams();
    const navigate = useNavigate();

    const [contentData, setContentData] = useState(null);
    const [logoPath, setLogoPath] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeServer, setActiveServer] = useState('vidfast');

    // For TV shows
    const [currentSeason, setCurrentSeason] = useState(parseInt(urlSeason) || 1);
    const [currentEpisode, setCurrentEpisode] = useState(parseInt(urlEpisode) || 1);
    const [seasons, setSeasons] = useState([]);

    useEffect(() => {
        fetchContentData();
    }, [type, id]);

    // Keep state in sync with URL
    useEffect(() => {
        if (type === 'tv' && urlSeason && urlEpisode) {
            setCurrentSeason(parseInt(urlSeason));
            setCurrentEpisode(parseInt(urlEpisode));
        }
    }, [urlSeason, urlEpisode]);

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
        // Would need total episode count to validate, simplified for now
        handleEpisodeSelect(currentSeason, currentEpisode + 1);
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
                        <div
                            style={{
                                position: 'absolute',
                                top: '-5%',
                                left: '-5%',
                                width: '110%',
                                height: '110%',
                                filter: 'blur(3px) brightness(0.5)',
                                opacity: 0.7,
                                transform: 'scale(1.1)', // Prevent blur edges
                            }}
                        >
                            <PixelImage
                                src={imageUrl(contentData.backdrop_path || contentData.poster_path, 'w1280')}
                                customGrid={{ rows: 12, cols: 12 }}
                                style={{ width: '100%', height: '100%' }}
                            />
                        </div>
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
            <div style={{ position: 'relative', zIndex: 10 }}>
                {/* Header */}
                {/* Floating Glass Header Island */}
                <div style={{
                    position: 'fixed',
                    top: '1rem',
                    left: '1rem',
                    right: '1rem',
                    background: 'rgba(28, 28, 30, 0.6)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    borderRadius: '24px',
                    padding: '0.5rem 0.75rem',
                    zIndex: 100,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.2rem',
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
                            width: '40px',
                            height: '40px',
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
                        <ArrowLeft size={20} />
                    </button>

                    {logoPath ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <img
                                src={imageUrl(logoPath, 'w500')}
                                alt={title}
                                style={{
                                    maxHeight: '40px',
                                    maxWidth: '150px',
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
                            fontSize: '1rem',
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

                    <div style={{ width: '1px', height: '20px', background: 'rgba(255, 255, 255, 0.1)' }}></div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            style={{
                                background: 'transparent',
                                border: 'none',
                                padding: '0.5rem',
                                color: 'rgba(255, 255, 255, 0.7)',
                                cursor: 'pointer',
                                transition: 'color 0.2s ease',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'}
                        >
                            <Heart size={20} />
                        </button>
                        <button
                            style={{
                                background: 'transparent',
                                border: 'none',
                                padding: '0.5rem',
                                color: 'rgba(255, 255, 255, 0.7)',
                                cursor: 'pointer',
                                transition: 'color 0.2s ease',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'}
                        >
                            <Bookmark size={20} />
                        </button>
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
                                    width: 'fit-content',
                                    minWidth: 'min(100%, 600px)', // Ensure it's not too small but fits content
                                    maxWidth: '100%',
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
                                    />
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
                                </div>
                            )}
                        </div>
                    </div>
                </div>

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
