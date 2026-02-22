import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMovieDetails, imageUrl, getMovieVideos } from '../api/tmdb';
import { ArrowLeft, Play, Plus, Download, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useYouTubePlayer from '../hooks/useYouTubePlayer';

const MovieDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [movie, setMovie] = useState(null);
    const [cast, setCast] = useState([]);
    const [trailerKey, setTrailerKey] = useState(null);
    const [showTrailer, setShowTrailer] = useState(false);
    const [hideUI, setHideUI] = useState(false);
    const [hasScrolled, setHasScrolled] = useState(false);
    const inactivityTimerRef = useRef(null);
    const trailerStartTimerRef = useRef(null);
    const uiHideTimerRef = useRef(null);
    const playerContainerRef = useRef(null);

    const handleTrailerEnd = useCallback(() => {
        // Loop is handled by the hook
    }, []);

    const { isMuted, toggleMute } = useYouTubePlayer(trailerKey, playerContainerRef, {
        active: showTrailer && !!trailerKey,
        onEnd: handleTrailerEnd,
        loop: true,
    });

    useEffect(() => {
        const fetchMovieDetails = async () => {
            try {
                const response = await getMovieDetails(id);
                setMovie(response.data);
                setCast(response.data.credits?.cast?.slice(0, 9) || []);

                // Fetch trailer
                const videosResponse = await getMovieVideos(id);
                const trailer = videosResponse.data.results.find(
                    video => video.type === 'Trailer' && video.site === 'YouTube'
                );
                if (trailer) {
                    setTrailerKey(trailer.key);
                }
            } catch (error) {
                console.error('Failed to fetch movie details:', error);
            }
        };

        fetchMovieDetails();
    }, [id]);

    // Auto-play trailer after 5 seconds
    useEffect(() => {
        if (trailerKey && !hasScrolled) {
            trailerStartTimerRef.current = setTimeout(() => {
                setShowTrailer(true);
            }, 7000);

            // Hide UI after 10 seconds total
            uiHideTimerRef.current = setTimeout(() => {
                setHideUI(true);
            }, 10000);
        }

        return () => {
            if (trailerStartTimerRef.current) clearTimeout(trailerStartTimerRef.current);
            if (uiHideTimerRef.current) clearTimeout(uiHideTimerRef.current);
        };
    }, [trailerKey, hasScrolled]);

    // Scroll detection
    useEffect(() => {
        const handleScroll = () => {
            const scrolled = window.scrollY > 100;

            if (scrolled && !hasScrolled) {
                setHasScrolled(true);
                setHideUI(false);
                if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
            } else if (!scrolled && hasScrolled) {
                if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
                inactivityTimerRef.current = setTimeout(() => {
                    setHideUI(true);
                }, 10000);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
        };
    }, [hasScrolled]);

    if (!movie) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
            }}>
                Loading...
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', color: 'white', paddingBottom: '3rem' }}>
            {/* Hero Section with Backdrop/Trailer */}
            <div style={{
                position: 'relative',
                height: '85vh',
                overflow: 'hidden'
            }}>
                {/* Backdrop Image (shows initially or if no trailer) */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundImage: `url(${imageUrl(movie.backdrop_path, 'original')})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    opacity: showTrailer && trailerKey ? 0 : 1,
                    transition: 'opacity 1s ease',
                    maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)'
                }} />

                {/* Trailer Video - YouTube IFrame Player API */}
                {showTrailer && trailerKey && (
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            overflow: 'hidden',
                            zIndex: 1,
                            maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
                            WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)'
                        }}
                        onContextMenu={(e) => e.preventDefault()}
                    >
                        {/* Player container */}
                        <div
                            ref={playerContainerRef}
                            style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                width: '100vw',
                                height: '56.25vw',
                                minHeight: '100vh',
                                minWidth: '177.77vh',
                                transform: 'translate(-50%, -50%) scale(1.15)',
                                pointerEvents: 'none',
                            }}
                        />
                        {/* Dark interaction-blocking overlay */}
                        <div
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                zIndex: 5,
                                pointerEvents: 'auto',
                                background: 'transparent',
                            }}
                            onContextMenu={(e) => e.preventDefault()}
                        />
                    </div>
                )}

                {/* Glass Blur Overlay - Removed as per request */}

                {/* Back Button */}
                <button
                    onClick={() => navigate('/')}
                    style={{
                        position: 'absolute',
                        top: '2rem',
                        left: '2rem',
                        zIndex: 10,
                        background: 'rgba(0,0,0,0.6)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        borderRadius: '50%',
                        width: '45px',
                        height: '45px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        backdropFilter: 'blur(10px)'
                    }}
                    onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
                    onMouseLeave={(e) => e.target.style.background = 'rgba(0,0,0,0.6)'}
                >
                    <ArrowLeft size={20} color="white" />
                </button>

                {/* Movie Info Overlay */}
                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '0 5%',
                    paddingBottom: '3rem',
                    zIndex: 3
                }}>
                    {/* Title - Always Visible */}
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        style={{
                            fontSize: 'clamp(1.75rem, 4vw, 3rem)',
                            fontWeight: 'bold',
                            marginBottom: '0.6rem',
                            textShadow: '0 4px 20px rgba(0,0,0,0.8)',
                            letterSpacing: '-0.02em'
                        }}
                    >
                        {movie.title}
                    </motion.h1>

                    {/* Metadata - Conditionally Hidden */}
                    <AnimatePresence>
                        {!hideUI && (
                            <motion.div
                                initial={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.5 }}
                                style={{
                                    display: 'flex',
                                    gap: '0.7rem',
                                    alignItems: 'center',
                                    marginBottom: '1rem',
                                    fontSize: '0.85rem',
                                    color: '#ddd',
                                    flexWrap: 'wrap'
                                }}
                            >
                                <span style={{
                                    background: 'rgba(255,255,255,0.15)',
                                    padding: '0.2rem 0.6rem',
                                    borderRadius: '3px',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    fontSize: '0.8rem'
                                }}>
                                    {new Date(movie.release_date).getFullYear()}
                                </span>
                                <span style={{ color: '#ffd700', fontWeight: 'bold', fontSize: '0.85rem' }}>★ {movie.vote_average.toFixed(1)}</span>
                                <span style={{ fontSize: '0.85rem' }}>{movie.runtime} min</span>
                                <span style={{
                                    background: 'rgba(255,255,255,0.1)',
                                    padding: '0.2rem 0.6rem',
                                    borderRadius: '3px',
                                    fontSize: '0.8rem'
                                }}>
                                    {movie.genres[0]?.name || 'Comedy'}
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Description - Conditionally Hidden */}
                    <AnimatePresence>
                        {!hideUI && (
                            <motion.p
                                initial={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.5 }}
                                style={{
                                    fontSize: '0.875rem',
                                    lineHeight: 1.5,
                                    maxWidth: '600px',
                                    marginBottom: '1.5rem',
                                    color: '#ddd',
                                    textShadow: '0 2px 10px rgba(0,0,0,0.8)'
                                }}
                            >
                                {movie.overview}
                            </motion.p>
                        )}
                    </AnimatePresence>

                    {/* Action Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        style={{ display: 'flex', gap: '0.7rem', flexWrap: 'wrap', alignItems: 'center' }}
                    >
                        {/* Play Button - Always Visible */}
                        <button
                            key="play-button-glass"
                            style={{
                                padding: '0.5rem 1.2rem',
                                borderRadius: '50px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                background: 'rgba(255, 255, 255, 0.1)',
                                backdropFilter: 'blur(20px)',
                                WebkitBackdropFilter: 'blur(20px)',
                                fontWeight: '600',
                                cursor: 'pointer',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                color: '#ffffff',
                                fontSize: '0.8rem',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                                outline: 'none'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
                            }}
                        >
                            <Play fill="white" color="white" size={14} /> Play
                        </button>

                        {/* Mute Button - Always Visible when trailer is playing */}
                        {showTrailer && trailerKey && (
                            <button
                                onClick={toggleMute}
                                className="glass"
                                style={{
                                    padding: '0.65rem 1rem',
                                    borderRadius: '5px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                    background: 'rgba(255,255,255,0.15)',
                                    cursor: 'pointer',
                                    border: '1px solid rgba(255,255,255,0.3)',
                                    color: 'white',
                                    fontSize: '0.85rem',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.25)'}
                                onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.15)'}
                            >
                                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                            </button>
                        )}

                        {/* Extra Buttons - Conditionally Hidden */}
                        <AnimatePresence>
                            {!hideUI && (
                                <>
                                    <motion.button
                                        initial={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ duration: 0.3 }}
                                        className="glass"
                                        style={{
                                            padding: '0.65rem 1rem',
                                            borderRadius: '5px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.35rem',
                                            background: 'rgba(255,255,255,0.15)',
                                            cursor: 'pointer',
                                            border: '1px solid rgba(255,255,255,0.3)',
                                            color: 'white',
                                            fontSize: '0.85rem',
                                            transition: 'all 0.3s ease'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                                    >
                                        <Plus size={16} />
                                    </motion.button>

                                    <motion.button
                                        initial={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ duration: 0.3, delay: 0.05 }}
                                        className="glass"
                                        style={{
                                            padding: '0.65rem 1rem',
                                            borderRadius: '5px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.35rem',
                                            background: 'rgba(255,255,255,0.15)',
                                            cursor: 'pointer',
                                            border: '1px solid rgba(255,255,255,0.3)',
                                            color: 'white',
                                            fontSize: '0.85rem',
                                            transition: 'all 0.3s ease'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                                    >
                                        <Download size={16} />
                                    </motion.button>

                                    <motion.button
                                        initial={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ duration: 0.3, delay: 0.1 }}
                                        className="glass"
                                        style={{
                                            padding: '0.65rem 1.3rem',
                                            borderRadius: '5px',
                                            background: 'rgba(255,255,255,0.15)',
                                            cursor: 'pointer',
                                            border: '1px solid rgba(255,255,255,0.3)',
                                            color: 'white',
                                            fontSize: '0.85rem',
                                            fontWeight: '500',
                                            transition: 'all 0.3s ease'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                                    >
                                        Similars
                                    </motion.button>
                                </>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </div>

            {/* Actors Section */}
            {cast.length > 0 && (
                <div style={{ padding: '0 5%' }}>
                    <h2 style={{
                        fontSize: '1.3rem',
                        fontWeight: 'bold',
                        marginBottom: '1rem',
                        borderLeft: '3px solid #e50914',
                        paddingLeft: '0.7rem'
                    }}>
                        Actors
                    </h2>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                        gap: '1rem'
                    }}>
                        {cast.map((actor, index) => (
                            <motion.div
                                key={actor.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.05 }}
                                className="glass"
                                style={{
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    transition: 'all 0.3s ease',
                                    cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <div style={{
                                    width: '100%',
                                    paddingTop: '100%',
                                    position: 'relative',
                                    background: '#1a1a1a'
                                }}>
                                    {actor.profile_path ? (
                                        <img
                                            src={imageUrl(actor.profile_path, 'w500')}
                                            alt={actor.name}
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover'
                                            }}
                                        />
                                    ) : (
                                        <div style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '2.2rem',
                                            color: '#555'
                                        }}>
                                            👤
                                        </div>
                                    )}
                                </div>
                                <div style={{ padding: '0.7rem' }}>
                                    <h3 style={{
                                        fontSize: '0.875rem',
                                        fontWeight: 'bold',
                                        marginBottom: '0.2rem',
                                        color: actor.name.includes('Smith') ? '#ff6b6b' : '#fff'
                                    }}>
                                        {actor.name}
                                    </h3>
                                    <p style={{
                                        fontSize: '0.75rem',
                                        color: '#999',
                                        margin: 0
                                    }}>
                                        {actor.character}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MovieDetails;
