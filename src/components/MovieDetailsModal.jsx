import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMovieDetails, getTVShowDetails, imageUrl, getSeasonDetails, getTVShowImages, getMovieImages } from '../api/tmdb';
import { X, Play, Heart, Bookmark, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useYouTubePlayer from '../hooks/useYouTubePlayer';
import { useMovieModal } from '../context/MovieModalContext';
import { useWatchlist } from '../hooks/useWatchlist';
import { selectBestTrailer } from '../utils/trailerSelector';

const MovieDetailsModal = () => {
    const { selectedMovieId, selectedMediaType, closeModal } = useMovieModal();
    const { getEntryByTmdbId, addEntry, removeEntry, tiers } = useWatchlist();
    const navigate = useNavigate();
    const [movie, setMovie] = useState(null);
    const [cast, setCast] = useState([]);
    const [episodes, setEpisodes] = useState([]);
    const [logoPath, setLogoPath] = useState(null);
    const [trailerKey, setTrailerKey] = useState(null);
    const [showTrailer, setShowTrailer] = useState(false);
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);
    const trailerStartTimerRef = useRef(null);
    const playerContainerRef = useRef(null);

    const handleTrailerEnd = useCallback(() => {
        // Loop is handled by the hook
    }, []);

    const { isMuted, toggleMute } = useYouTubePlayer(trailerKey, playerContainerRef, {
        active: showTrailer && !!trailerKey,
        onEnd: handleTrailerEnd,
        onPlaying: () => setIsVideoPlaying(true),
        loop: true,
    });

    const existingEntry = getEntryByTmdbId(selectedMovieId);
    const mustWatchTierId = tiers?.find(t => t.name === 'Must Watch')?.id || 'tier_good';
    const maybeLaterTierId = tiers?.find(t => t.name === 'Maybe Later')?.id || 'tier_maybe';

    const isMustWatch = existingEntry?.tierId === mustWatchTierId;
    const isMaybeLater = existingEntry?.tierId === maybeLaterTierId;

    const toggleHeart = (e) => {
        e.stopPropagation();
        if (isMustWatch) removeEntry(existingEntry.id);
        else if (movie) addEntry(mustWatchTierId, {
            tmdbId: selectedMovieId,
            type: selectedMediaType,
            title: movie.title || movie.name,
            poster: movie.poster_path,
            backdrop: movie.backdrop_path,
            year: new Date(movie.release_date || movie.first_air_date || Date.now()).getFullYear(),
            rating: movie.vote_average
        });
    };

    const toggleBookmark = (e) => {
        e.stopPropagation();
        if (isMaybeLater) removeEntry(existingEntry.id);
        else if (movie) addEntry(maybeLaterTierId, {
            tmdbId: selectedMovieId,
            type: selectedMediaType,
            title: movie.title || movie.name,
            poster: movie.poster_path,
            backdrop: movie.backdrop_path,
            year: new Date(movie.release_date || movie.first_air_date || Date.now()).getFullYear(),
            rating: movie.vote_average
        });
    };

    // Fetch movie details when modal opens
    useEffect(() => {
        if (!selectedMovieId) {
            setMovie(null);
            setTrailerKey(null);
            setShowTrailer(false);
            setEpisodes([]);
            setLogoPath(null);
            return;
        }

        const fetchMovieDetails = async () => {
            try {
                let response;
                let eps = [];
                let imagesResponse;
                if (selectedMediaType === 'tv') {
                    response = await getTVShowDetails(selectedMovieId);
                    imagesResponse = await getTVShowImages(selectedMovieId);
                    try {
                        const seasonToFetch = response.data.seasons?.find(s => s.season_number > 0)?.season_number || 1;
                        if (seasonToFetch) {
                            const seasonData = await getSeasonDetails(selectedMovieId, seasonToFetch);
                            eps = seasonData.episodes || [];
                        }
                    } catch (e) {
                        console.error('Failed to fetch episodes:', e);
                    }
                } else {
                    response = await getMovieDetails(selectedMovieId);
                    imagesResponse = await getMovieImages(selectedMovieId);
                }

                setMovie(response.data);
                setCast(response.data.credits?.cast?.slice(0, 9) || []);
                setEpisodes(eps);
                
                // Set Logo
                if (imagesResponse?.data?.logos?.length > 0) {
                    const englishLogo = imagesResponse.data.logos.find(l => l.iso_639_1 === 'en');
                    setLogoPath((englishLogo || imagesResponse.data.logos[0]).file_path);
                } else {
                    setLogoPath(null);
                }

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
        }

        return () => {
            if (trailerStartTimerRef.current) clearTimeout(trailerStartTimerRef.current);
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
                }}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        width: '100%',
                        maxWidth: '1300px',
                        height: '85vh',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'row',
                    }}
                >
                    {/* Inner Box with Hidden Overflow for Backgrounds */}
                    <div style={{
                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                        backgroundColor: '#050505', borderRadius: '24px', overflow: 'hidden',
                        boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.7)',
                        zIndex: 0
                    }}>
                        {/* Background Backdrop */}
                        <div style={{
                            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                            backgroundImage: `url(${imageUrl(movie.backdrop_path, 'original')})`,
                            backgroundSize: 'cover', backgroundPosition: 'center 20%',
                            opacity: isVideoPlaying ? 0 : 0.65, transition: 'opacity 1s ease', zIndex: 0
                        }} />

                        {/* Trailer Video */}
                        {showTrailer && trailerKey && (
                            <div style={{
                                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                overflow: 'hidden', zIndex: 1,
                                opacity: isVideoPlaying ? 0.8 : 0, transition: 'opacity 0.5s ease',
                                pointerEvents: 'none'
                            }}>
                                <div ref={playerContainerRef} style={{
                                    position: 'absolute', top: '50%', left: '50%',
                                    width: '100vw', height: '56.25vw', minHeight: '100vh', minWidth: '177.77vh',
                                    transform: 'translate(-50%, -50%) scale(1.15)',
                                }} />
                            </div>
                        )}

                        {/* Gradients */}
                        <div style={{
                            position: 'absolute', top: 0, left: 0, width: '70%', height: '100%',
                            background: 'linear-gradient(to right, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0) 100%)',
                            zIndex: 2, pointerEvents: 'none'
                        }} />
                        <div style={{
                            position: 'absolute', bottom: 0, left: 0, width: '100%', height: '50%',
                            background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 100%)',
                            zIndex: 2, pointerEvents: 'none'
                        }} />
                    </div>

                    {/* Content Container Left */}
                    <div style={{
                        flex: 1,
                        zIndex: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                        padding: '3rem',
                        color: 'white',
                    }}>
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                            <div style={{ 
                                fontSize: '0.85rem', letterSpacing: '2px', fontWeight: 'bold', 
                                color: '#e50914', marginBottom: '1.5rem', textTransform: 'uppercase' 
                            }}>
                                {movie.genres?.[0]?.name ? `${movie.genres[0].name} Series` : 'Original Content'}
                            </div>
                        </motion.div>

                        {logoPath ? (
                            <motion.img 
                                initial={{ opacity: 0, y: 30, scale: 0.9 }} 
                                animate={{ opacity: 1, y: 0, scale: 1 }} 
                                transition={{ delay: 0.3, type: 'spring', stiffness: 100 }}
                                src={imageUrl(logoPath, 'w500')} 
                                alt={movie.title || movie.name}
                                style={{
                                    width: '100%',
                                    maxWidth: '360px',
                                    marginBottom: '1.5rem',
                                    filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.9)) drop-shadow(0 0 20px rgba(0,0,0,0.5))',
                                    position: 'relative',
                                    zIndex: 10, // Let it float above the UI
                                }}
                            />
                        ) : (
                            <motion.h1 
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                                style={{
                                    fontSize: 'clamp(2.5rem, 4vw, 4rem)',
                                    fontWeight: '900',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                    lineHeight: '1.1',
                                    marginBottom: '1.2rem',
                                    textShadow: '0 4px 20px rgba(0,0,0,0.5)',
                                }}
                            >
                                {movie.title || movie.name}
                            </motion.h1>
                        )}

                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                            style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}
                        >
                            <span style={{ fontWeight: 'bold', color: '#fff' }}>
                                {new Date(movie.release_date || movie.first_air_date || Date.now()).getFullYear()}
                            </span>
                            <span style={{ border: '1px solid rgba(255,255,255,0.4)', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                {selectedMediaType === 'tv' ? 'TV-MA' : 'R'}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#ffd700', fontWeight: 'bold' }}>
                                ★ {movie.vote_average?.toFixed(1)}
                            </span>
                            <span style={{ color: '#ccc' }}>
                                {selectedMediaType === 'tv'
                                    ? (movie.episode_run_time?.[0] ? `${movie.episode_run_time[0]} min` : `${movie.number_of_seasons} Seasons`)
                                    : `${movie.runtime} min`}
                            </span>
                        </motion.div>

                        <motion.p 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                            style={{
                                fontSize: '0.85rem', lineHeight: '1.5', color: 'rgba(255,255,255,0.8)',
                                maxWidth: '450px', marginBottom: '2rem', textShadow: '0 2px 10px rgba(0,0,0,0.8)'
                            }}
                        >
                            {movie.overview?.length > 200 ? movie.overview.substring(0, 200) + '...' : movie.overview}
                        </motion.p>

                        <motion.div 
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                            style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}
                        >
                            <button
                                onClick={() => {
                                    closeModal();
                                    navigate(`/watch/${selectedMediaType}/${selectedMovieId}`);
                                }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.6rem',
                                    padding: '0.8rem 1.8rem', borderRadius: '50px',
                                    background: 'white', color: 'black',
                                    fontWeight: 'bold', fontSize: '0.95rem',
                                    border: 'none', cursor: 'pointer',
                                    boxShadow: '0 4px 15px rgba(255,255,255,0.3)',
                                    transition: 'transform 0.2s',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <Play fill="black" size={18} /> Play Now
                            </button>

                            <motion.button 
                                onClick={toggleHeart}
                                whileTap={{ scale: 0.85 }}
                                animate={isMustWatch ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                                transition={{ duration: 0.4, type: "spring", stiffness: 300 }}
                                style={{
                                width: '48px', height: '48px', borderRadius: '50%',
                                border: '2px solid rgba(255,255,255,0.5)', background: 'rgba(0,0,0,0.4)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: isMustWatch ? '#ef4444' : 'white', cursor: 'pointer', transition: 'background 0.2s, border-color 0.2s', backdropFilter: 'blur(5px)'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.borderColor = 'white'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.4)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'; }}
                            >
                                <Heart size={20} fill={isMustWatch ? '#ef4444' : 'none'} color={isMustWatch ? '#ef4444' : 'currentColor'} />
                            </motion.button>

                            <motion.button
                                onClick={toggleBookmark}
                                whileTap={{ scale: 0.85 }}
                                animate={isMaybeLater ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                                transition={{ duration: 0.4, type: "spring", stiffness: 300 }}
                                style={{
                                width: '48px', height: '48px', borderRadius: '50%',
                                border: '2px solid rgba(255,255,255,0.5)', background: 'rgba(0,0,0,0.4)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: isMaybeLater ? '#3b82f6' : 'white', cursor: 'pointer', transition: 'background 0.2s, border-color 0.2s', backdropFilter: 'blur(5px)'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.borderColor = 'white'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.4)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'; }}
                            >
                                <Bookmark size={20} fill={isMaybeLater ? '#3b82f6' : 'none'} color={isMaybeLater ? '#3b82f6' : 'currentColor'} />
                            </motion.button>

                            {showTrailer && trailerKey && (
                                <button onClick={toggleMute} style={{
                                    width: '48px', height: '48px', borderRadius: '50%',
                                    border: '2px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.4)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'white', cursor: 'pointer', transition: 'all 0.2s', backdropFilter: 'blur(5px)'
                                }}>
                                    {isMuted ? <VolumeX size={18} color="rgba(255,255,255,0.6)" /> : <Volume2 size={18} color="rgba(255,255,255,0.6)" />}
                                </button>
                            )}
                        </motion.div>
                    </div>

                    {/* Right Side Panel - Episodes/Cast */}
                    <div style={{
                        width: '310px',
                        zIndex: 4,
                        background: 'rgba(30, 30, 30, 0.25)',
                        backdropFilter: 'saturate(200%) blur(60px)',
                        WebkitBackdropFilter: 'saturate(200%) blur(60px)',
                        borderLeft: '1px solid rgba(255, 255, 255, 0.15)',
                        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: '-10px 0 30px rgba(0,0,0,0.4)',
                        display: 'flex',
                        flexDirection: 'column',
                        borderTopRightRadius: '24px',
                        borderBottomRightRadius: '24px',
                        overflow: 'hidden',
                    }}>
                        {/* Top Config / Close Bar */}
                        <div style={{ 
                            padding: '1.2rem 1.5rem', display: 'flex', 
                            justifyContent: 'space-between', alignItems: 'center',
                            borderBottom: '1px solid rgba(255,255,255,0.05)' 
                        }}>
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                                <span style={{ border: '1px solid rgba(255,255,255,0.3)', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.75rem', color: 'white' }}>HD</span>
                                <span style={{ border: '1px solid rgba(255,255,255,0.3)', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.75rem', color: 'white' }}>18+</span>
                            </div>
                            <button
                                onClick={closeModal}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'white',
                                    cursor: 'pointer',
                                    opacity: 0.7,
                                    transition: 'opacity 0.2s',
                                    padding: '0',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                                onMouseLeave={(e) => e.currentTarget.style.opacity = 0.7}
                            >
                                <X size={22} />
                            </button>
                        </div>

                        {/* List Area */}
                        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, 
                            scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.2) transparent' 
                        }}>
                            {selectedMediaType === 'tv' && episodes && episodes.length > 0 ? (
                                <>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                                        {episodes.map((ep, index) => (
                                            <motion.div 
                                                key={ep.id || index}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.3 + (index * 0.05) }}
                                                style={{ 
                                                    display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1rem',
                                                    cursor: 'pointer'
                                                }}
                                                onClick={() => {
                                                    closeModal();
                                                    navigate(`/watch/tv/${selectedMovieId}/season/${ep.season_number}/episode/${ep.episode_number}`);
                                                }}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'white', marginBottom: '0.2rem' }}>
                                                        {String(ep.episode_number).padStart(2, '0')}
                                                    </div>
                                                    <div style={{ 
                                                        fontSize: '0.65rem', color: 'rgba(255,255,255,0.7)', 
                                                        maxWidth: '100px', whiteSpace: 'normal',
                                                        lineHeight: '1.2'
                                                    }}>
                                                        {ep.name}
                                                    </div>
                                                </div>
                                                <div style={{ 
                                                    width: '100px', height: '56px', borderRadius: '6px', 
                                                    overflow: 'hidden', background: '#333', flexShrink: 0,
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    boxShadow: '0 5px 15px rgba(0,0,0,0.5)'
                                                }}>
                                                    {ep.still_path ? (
                                                        <img src={imageUrl(ep.still_path, 'w300')} alt={ep.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: '#666' }}>No Image</div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <h3 style={{ color: 'white', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Full Cast</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                                        {cast.length > 0 ? cast.map((actor, index) => (
                                            <motion.div 
                                                key={actor.id}
                                                onClick={() => {
                                                    closeModal();
                                                    navigate(`/person/${actor.id}`);
                                                }}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.3 + (index * 0.1) }}
                                                style={{ 
                                                    display: 'flex', alignItems: 'center', gap: '1rem',
                                                    padding: '0.5rem', borderRadius: '12px',
                                                    background: 'rgba(255,255,255,0.03)',
                                                    transition: 'all 0.2s', cursor: 'pointer'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = 'rgba(0, 188, 212, 0.1)';
                                                    e.currentTarget.style.transform = 'scale(1.02)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                                                    e.currentTarget.style.transform = 'scale(1)';
                                                }}
                                            >
                                                <div style={{ 
                                                    width: '48px', height: '48px', borderRadius: '8px', 
                                                    overflow: 'hidden', background: '#333', flexShrink: 0
                                                }}>
                                                    {actor.profile_path ? (
                                                        <img src={imageUrl(actor.profile_path, 'w200')} alt={actor.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>👤</div>
                                                    )}
                                                </div>
                                                <div style={{ overflow: 'hidden' }}>
                                                    <div style={{ color: 'white', fontWeight: 'bold', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {actor.name}
                                                    </div>
                                                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {actor.character}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )) : (
                                            <div style={{ color: 'rgba(255,255,255,0.5)' }}>No cast information available</div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default MovieDetailsModal;
