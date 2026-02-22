import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMovieDetails, getTVShowDetails, imageUrl } from '../api/tmdb';
import { X, Play, Plus, Download, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useYouTubePlayer from '../hooks/useYouTubePlayer';
import { useMovieModal } from '../context/MovieModalContext';
import { selectBestTrailer } from '../utils/trailerSelector';

const MovieDetailsModal = () => {
    const { selectedMovieId, selectedMediaType, closeModal } = useMovieModal();
    const navigate = useNavigate();
    const [movie, setMovie] = useState(null);
    const [cast, setCast] = useState([]);
    const [trailerKey, setTrailerKey] = useState(null);
    const [showTrailer, setShowTrailer] = useState(false);
    const [hideUI, setHideUI] = useState(false);
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

    // Fetch movie details when modal opens
    useEffect(() => {
        if (!selectedMovieId) {
            setMovie(null);
            setTrailerKey(null);
            setShowTrailer(false);
            return;
        }

        const fetchMovieDetails = async () => {
            try {
                let response;
                if (selectedMediaType === 'tv') {
                    response = await getTVShowDetails(selectedMovieId);
                } else {
                    response = await getMovieDetails(selectedMovieId);
                }

                setMovie(response.data);
                setCast(response.data.credits?.cast?.slice(0, 9) || []);

                // Fetch trailer - use smart selection from appended videos
                const videos = response.data.videos?.results || [];
                const bestTrailer = selectBestTrailer(videos);
                if (bestTrailer) {
                    setTrailerKey(bestTrailer.key);
                } else {
                    setTrailerKey(null);
                }
            } catch (error) {
                console.error('Failed to fetch movie details:', error);
            }
        };

        fetchMovieDetails();
    }, [selectedMovieId]);

    // Auto-play trailer after 5 seconds
    useEffect(() => {
        if (trailerKey && selectedMovieId) {
            trailerStartTimerRef.current = setTimeout(() => {
                setShowTrailer(true);
            }, 5000);

            // Hide UI after 10 seconds total
            uiHideTimerRef.current = setTimeout(() => {
                setHideUI(true);
            }, 10000);
        }

        return () => {
            if (trailerStartTimerRef.current) clearTimeout(trailerStartTimerRef.current);
            if (uiHideTimerRef.current) clearTimeout(uiHideTimerRef.current);
        };
    }, [trailerKey, selectedMovieId]);

    // Handle ESC key to close modal
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') closeModal();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [closeModal]);

    if (!selectedMovieId || !movie) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                onClick={closeModal}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.85)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem',
                    overflowY: 'auto',
                }}
            >
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        width: '90vw',
                        maxWidth: '1200px',
                        maxHeight: '90vh',
                        backgroundColor: '#000',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        position: 'relative',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    }}
                >
                    {/* Close Button */}
                    <button
                        onClick={closeModal}
                        style={{
                            position: 'absolute',
                            top: '1rem',
                            right: '1rem',
                            zIndex: 10000,
                            background: 'rgba(0, 0, 0, 0.7)',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            borderRadius: '50%',
                            width: '45px',
                            height: '45px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            backdropFilter: 'blur(10px)',
                        }}
                        onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
                        onMouseLeave={(e) => e.target.style.background = 'rgba(0, 0, 0, 0.7)'}
                    >
                        <X size={24} color="white" />
                    </button>

                    {/* Scrollable Content */}
                    <div style={{
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        color: 'white',
                    }}>
                        {/* Hero Section with Backdrop/Trailer */}
                        <div style={{
                            position: 'relative',
                            height: '70vh',
                            overflow: 'hidden'
                        }}>
                            {/* Backdrop Image */}
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
                                transition: 'opacity 1s ease'
                            }} />

                            {/* Trailer Video */}
                            {showTrailer && trailerKey && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        overflow: 'hidden',
                                        zIndex: 1
                                    }}
                                    onContextMenu={(e) => e.preventDefault()}
                                >
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

                            {/* Dark Overlay */}
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 70%, rgba(0,0,0,0.95) 100%)',
                                zIndex: 2
                            }} />

                            {/* Movie Info Overlay */}
                            <div style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                padding: '0 3rem',
                                paddingBottom: '2rem',
                                zIndex: 3
                            }}>
                                {/* Title */}
                                <motion.h1
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6 }}
                                    style={{
                                        fontSize: 'clamp(1.5rem, 3.5vw, 2.5rem)',
                                        fontWeight: 'bold',
                                        marginBottom: '0.6rem',
                                        textShadow: '0 4px 20px rgba(0,0,0,0.8)',
                                    }}
                                >
                                    {movie.title || movie.name}
                                </motion.h1>

                                {/* Metadata */}
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
                                                flexWrap: 'wrap'
                                            }}
                                        >
                                            <span style={{
                                                background: 'rgba(255,255,255,0.15)',
                                                padding: '0.2rem 0.6rem',
                                                borderRadius: '3px',
                                                border: '1px solid rgba(255,255,255,0.2)',
                                            }}>
                                                {new Date(movie.release_date || movie.first_air_date || Date.now()).getFullYear()}
                                            </span>
                                            <span style={{ color: '#ffd700', fontWeight: 'bold' }}>★ {movie.vote_average.toFixed(1)}</span>
                                            <span>
                                                {selectedMediaType === 'tv'
                                                    ? (movie.episode_run_time?.[0] ? `${movie.episode_run_time[0]} min` : `${movie.number_of_seasons} Seasons`)
                                                    : `${movie.runtime} min`}
                                            </span>
                                            <span style={{
                                                background: 'rgba(255,255,255,0.1)',
                                                padding: '0.2rem 0.6rem',
                                                borderRadius: '3px',
                                            }}>
                                                {movie.genres[0]?.name || 'Drama'}
                                            </span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Description */}
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
                                    <button
                                        onClick={() => {
                                            closeModal();
                                            if (selectedMediaType === 'tv') {
                                                navigate(`/watch/tv/${selectedMovieId}/season/1/episode/1`);
                                            } else {
                                                navigate(`/watch/movie/${selectedMovieId}`);
                                            }
                                        }}
                                        style={{
                                            padding: '0.5rem 1.2rem',
                                            borderRadius: '50px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.4rem',
                                            background: 'rgba(255, 255, 255, 0.1)',
                                            backdropFilter: 'blur(20px)',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            border: '1px solid rgba(255, 255, 255, 0.2)',
                                            color: '#ffffff',
                                            fontSize: '0.8rem',
                                            transition: 'all 0.3s ease',
                                        }}
                                    >
                                        <Play fill="white" color="white" size={14} /> Play
                                    </button>

                                    {showTrailer && trailerKey && (
                                        <button
                                            onClick={toggleMute}
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
                                        >
                                            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                                        </button>
                                    )}

                                    <AnimatePresence>
                                        {!hideUI && (
                                            <>
                                                <motion.button
                                                    initial={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.9 }}
                                                    transition={{ duration: 0.3 }}
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
                                                    }}
                                                >
                                                    <Plus size={16} />
                                                </motion.button>

                                                <motion.button
                                                    initial={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.9 }}
                                                    transition={{ duration: 0.3, delay: 0.05 }}
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
                                                    }}
                                                >
                                                    <Download size={16} />
                                                </motion.button>
                                            </>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            </div>
                        </div>

                        {/* Actors Section */}
                        {cast.length > 0 && (
                            <div style={{ padding: '2rem 3rem 3rem' }}>
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
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                                    gap: '1rem'
                                }}>
                                    {cast.map((actor, index) => (
                                        <motion.div
                                            key={actor.id}
                                            initial={{ opacity: 0, y: 30 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.5, delay: index * 0.05 }}
                                            style={{
                                                borderRadius: '8px',
                                                overflow: 'hidden',
                                                background: 'rgba(255,255,255,0.05)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                transition: 'all 0.3s ease',
                                                cursor: 'pointer'
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
                                                        fontSize: '2rem',
                                                        color: '#555'
                                                    }}>
                                                        👤
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ padding: '0.7rem' }}>
                                                <h3 style={{
                                                    fontSize: '0.8rem',
                                                    fontWeight: 'bold',
                                                    marginBottom: '0.2rem',
                                                }}>
                                                    {actor.name}
                                                </h3>
                                                <p style={{
                                                    fontSize: '0.7rem',
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
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default MovieDetailsModal;
