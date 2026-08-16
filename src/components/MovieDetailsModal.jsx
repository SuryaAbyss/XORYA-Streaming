import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMovieDetails, getTVShowDetails, imageUrl, getSeasonDetails, getTVShowImages, getMovieImages } from '../api/tmdb';
import { X, Play, Heart, Bookmark, Volume2, VolumeX, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import useYouTubePlayer from '../hooks/useYouTubePlayer';
import { useMovieModal } from '../context/MovieModalContext';
import { useWatchlist } from '../hooks/useWatchlist';
import { getServerUrl } from '../config/servers';
import { selectBestTrailer } from '../utils/trailerSelector';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';

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

    const overlayRef = useRef(null);
    const containerRef = useRef(null);
    const mobileContainerRef = useRef(null);
    const [isClosing, setIsClosing] = useState(false);

    // Mobile detection
    const isMobile = typeof window !== 'undefined' && navigator.maxTouchPoints > 0 && window.innerWidth <= 768;

    const handleClose = useCallback(() => {
        if (isClosing) return;
        setIsClosing(true);
        
        const tl = gsap.timeline({
            onComplete: () => {
                closeModal();
                setIsClosing(false);
            }
        });

        if (isMobile) {
            tl.to(mobileContainerRef.current, { y: '100%', opacity: 0, duration: 0.35, ease: "power3.in" })
              .to(overlayRef.current, { opacity: 0, duration: 0.25 }, "-=0.25");
        } else {
            tl.to(containerRef.current, { scale: 0.95, y: 20, opacity: 0, duration: 0.3, ease: "power3.in" })
              .to(overlayRef.current, { opacity: 0, duration: 0.25 }, "-=0.2");
        }
    }, [isClosing, isMobile, closeModal]);

    // Opening animation
    useGSAP(() => {
        if (!movie || isClosing) return;

        const tl = gsap.timeline();

        if (isMobile) {
            tl.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3 })
              .fromTo(mobileContainerRef.current, 
                  { y: '100%', opacity: 0 },
                  { y: 0, opacity: 1, duration: 0.5, ease: "power4.out" },
                  "-=0.15"
              );
            const epItems = mobileContainerRef.current?.querySelectorAll('[data-ep-item]');
            if (epItems && epItems.length > 0) {
                tl.fromTo(epItems,
                    { opacity: 0, y: 12 },
                    { opacity: 1, y: 0, duration: 0.4, stagger: 0.04, ease: "power2.out" },
                    "-=0.2"
                );
            }
        } else {
            tl.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3 })
              .fromTo(containerRef.current,
                  { scale: 0.95, y: 30, opacity: 0 },
                  { scale: 1, y: 0, opacity: 1, duration: 0.5, ease: "power4.out" },
                  "-=0.15"
              );

            const leftElements = containerRef.current?.querySelectorAll('.modal-left-anim');
            if (leftElements && leftElements.length > 0) {
                tl.fromTo(leftElements,
                    { opacity: 0, y: 15 },
                    { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: "power3.out" },
                    "-=0.2"
                );
            }

            const rightElements = containerRef.current?.querySelectorAll('.modal-right-anim');
            if (rightElements && rightElements.length > 0) {
                tl.fromTo(rightElements,
                    { opacity: 0, x: 20 },
                    { opacity: 1, x: 0, duration: 0.6, stagger: 0.05, ease: "power3.out" },
                    "-=0.3"
                );
            }
        }
    }, [movie]);

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

    const preloadSeason = existingEntry?.progress?.season || 1;
    const preloadEpisode = existingEntry?.progress?.episode || 1;
    const preloadingUrl = movie ? getServerUrl('vidfast', selectedMediaType, selectedMovieId, preloadSeason, preloadEpisode) : null;

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

                if (imagesResponse?.data?.logos?.length > 0) {
                    const englishLogo = imagesResponse.data.logos.find(l => l.iso_639_1 === 'en');
                    setLogoPath((englishLogo || imagesResponse.data.logos[0]).file_path);
                } else {
                    setLogoPath(null);
                }

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

    useEffect(() => {
        if (trailerKey && selectedMovieId && !isMobile) {
            trailerStartTimerRef.current = setTimeout(() => {
                setShowTrailer(true);
            }, 5000);
        }

        return () => {
            if (trailerStartTimerRef.current) clearTimeout(trailerStartTimerRef.current);
        };
    }, [trailerKey, selectedMovieId]);

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') handleClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [handleClose]);

    if (!selectedMovieId || !movie) return null;

    // ─── MOBILE LAYOUT ───────────────────────────────────────────────────────
    if (isMobile) {
        return (
            <div
                ref={overlayRef}
                onClick={handleClose}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                    opacity: 0
                }}
            >
                <div
                    ref={mobileContainerRef}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        width: '100%',
                        maxHeight: '92vh',
                        background: '#0a0a0a',
                        borderRadius: '24px 24px 0 0',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        position: 'relative',
                        transform: 'translateY(100%)',
                        opacity: 0
                    }}
                >
                    {/* ── Drag Handle ── */}
                    <div style={{
                        position: 'absolute',
                        top: '10px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '38px',
                        height: '4px',
                        borderRadius: '2px',
                        background: 'rgba(255,255,255,0.18)',
                        zIndex: 20,
                    }} />

                    {/* ── Hero Backdrop Image ── */}
                    <div style={{
                        position: 'relative',
                        width: '100%',
                        height: '52vw',
                        minHeight: '200px',
                        maxHeight: '260px',
                        flexShrink: 0,
                        overflow: 'hidden',
                    }}>
                        {/* Backdrop */}
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            backgroundImage: `url(${imageUrl(movie.backdrop_path, 'w780')})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center 20%',
                        }} />

                        {/* Bottom fade so content below blends in */}
                        <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            width: '100%',
                            height: '70%',
                            background: 'linear-gradient(to bottom, transparent 0%, #0a0a0a 100%)',
                        }} />

                        {/* Close button (top-right) */}
                        <button
                            onClick={handleClose}
                            style={{
                                position: 'absolute',
                                top: '14px',
                                right: '14px',
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                background: 'rgba(0,0,0,0.55)',
                                border: '1px solid rgba(255,255,255,0.18)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                cursor: 'pointer',
                                backdropFilter: 'blur(8px)',
                                WebkitBackdropFilter: 'blur(8px)',
                                zIndex: 10,
                            }}
                        >
                            <X size={16} />
                        </button>

                        {/* Genre label, bottom-left of image */}
                        <div style={{
                            position: 'absolute',
                            bottom: '14px',
                            left: '16px',
                            fontSize: '0.72rem',
                            letterSpacing: '1.5px',
                            fontWeight: '700',
                            color: '#e50914',
                            textTransform: 'uppercase',
                            zIndex: 5,
                        }}>
                            {movie.genres?.[0]?.name
                                ? `${movie.genres[0].name}${selectedMediaType === 'tv' ? ' Series' : ''}`
                                : 'Original Content'}
                        </div>

                        {preloadingUrl && (
                            <iframe
                                src={preloadingUrl}
                                sandbox="allow-scripts allow-same-origin"
                                style={{
                                    position: 'absolute',
                                    width: '1px',
                                    height: '1px',
                                    opacity: 0.01,
                                    pointerEvents: 'none',
                                    zIndex: -1
                                }}
                                aria-hidden="true"
                            />
                        )}
                    </div>

                    {/* ── Scrollable Content Area ── */}
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        WebkitOverflowScrolling: 'touch',
                        paddingBottom: '2rem',
                    }}>
                        {/* Title / Logo */}
                        <div style={{ padding: '0 18px', marginTop: '-8px' }}>
                            {logoPath ? (
                                <img
                                    src={imageUrl(logoPath, 'w500')}
                                    alt={movie.title || movie.name}
                                    style={{
                                        width: 'auto',
                                        maxWidth: '80%',
                                        maxHeight: '80px',
                                        marginBottom: '12px',
                                        filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.8))',
                                        display: 'block',
                                    }}
                                />
                            ) : (
                                <h1 style={{
                                    fontSize: 'clamp(1.6rem, 7vw, 2.5rem)',
                                    fontWeight: '900',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    lineHeight: '1.05',
                                    marginBottom: '10px',
                                    color: '#fff',
                                    textShadow: '0 2px 12px rgba(0,0,0,0.6)',
                                }}>
                                    {movie.title || movie.name}
                                </h1>
                            )}

                            {/* Metadata row */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                marginBottom: '14px',
                                flexWrap: 'wrap',
                            }}>
                                <span style={{ fontWeight: '700', color: '#fff', fontSize: '0.9rem' }}>
                                    {new Date(movie.release_date || movie.first_air_date || Date.now()).getFullYear()}
                                </span>
                                <span style={{
                                    border: '1px solid rgba(255,255,255,0.35)',
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    fontSize: '0.72rem',
                                    fontWeight: '700',
                                    color: 'rgba(255,255,255,0.8)',
                                }}>
                                    {selectedMediaType === 'tv' ? 'TV-MA' : 'R'}
                                </span>
                                <span style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    color: '#ffd700',
                                    fontWeight: '700',
                                    fontSize: '0.9rem',
                                }}>
                                    ★ {movie.vote_average?.toFixed(1)}
                                </span>
                                <span style={{ color: '#aaa', fontSize: '0.85rem' }}>
                                    {selectedMediaType === 'tv'
                                        ? (movie.episode_run_time?.[0] ? `${movie.episode_run_time[0]} min` : `${movie.number_of_seasons} Season${movie.number_of_seasons !== 1 ? 's' : ''}`)
                                        : `${movie.runtime} min`}
                                </span>
                            </div>

                            {/* Overview */}
                            <p style={{
                                fontSize: '0.88rem',
                                lineHeight: '1.6',
                                color: 'rgba(255,255,255,0.75)',
                                marginBottom: '22px',
                                // Allow max 5 lines
                                display: '-webkit-box',
                                WebkitLineClamp: 5,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                            }}>
                                {movie.overview}
                            </p>

                            {/* ── Action Buttons ── */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                marginBottom: '10px',
                            }}>
                                {/* Primary Play Now button — big pill */}
                                <button
                                    onClick={() => {
                                        closeModal();
                                        navigate(`/watch/${selectedMediaType}/${selectedMovieId}?autofs=true`);
                                    }}
                                    style={{

                                        flex: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        height: '50px',
                                        borderRadius: '50px',
                                        background: '#ffffff',
                                        color: '#000',
                                        fontWeight: '700',
                                        fontSize: '0.95rem',
                                        border: 'none',
                                        cursor: 'pointer',
                                        letterSpacing: '0.3px',
                                        boxShadow: '0 4px 20px rgba(255,255,255,0.2)',
                                    }}
                                >
                                    <Play fill="black" size={18} />
                                    Play Now
                                </button>

                                {/* Heart */}
                                <motion.button
                                    onClick={toggleHeart}
                                    whileTap={{ scale: 0.85 }}
                                    animate={isMustWatch ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                                    transition={{ duration: 0.4, type: 'spring', stiffness: 300 }}
                                    style={{
                                        width: '50px',
                                        height: '50px',
                                        borderRadius: '50%',
                                        border: '2px solid rgba(255,255,255,0.3)',
                                        background: isMustWatch ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.06)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: isMustWatch ? '#ef4444' : 'white',
                                        cursor: 'pointer',
                                        backdropFilter: 'blur(8px)',
                                        flexShrink: 0,
                                    }}
                                >
                                    <Heart size={20} fill={isMustWatch ? '#ef4444' : 'none'} color={isMustWatch ? '#ef4444' : 'currentColor'} />
                                </motion.button>

                                {/* Bookmark */}
                                <motion.button
                                    onClick={toggleBookmark}
                                    whileTap={{ scale: 0.85 }}
                                    animate={isMaybeLater ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                                    transition={{ duration: 0.4, type: 'spring', stiffness: 300 }}
                                    style={{
                                        width: '50px',
                                        height: '50px',
                                        borderRadius: '50%',
                                        border: '2px solid rgba(255,255,255,0.3)',
                                        background: isMaybeLater ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.06)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: isMaybeLater ? '#3b82f6' : 'white',
                                        cursor: 'pointer',
                                        backdropFilter: 'blur(8px)',
                                        flexShrink: 0,
                                    }}
                                >
                                    <Bookmark size={20} fill={isMaybeLater ? '#3b82f6' : 'none'} color={isMaybeLater ? '#3b82f6' : 'currentColor'} />
                                </motion.button>

                                {/* Mute (only when trailer is playing) */}
                                {showTrailer && trailerKey && (
                                    <button
                                        onClick={toggleMute}
                                        style={{
                                            width: '50px',
                                            height: '50px',
                                            borderRadius: '50%',
                                            border: '2px solid rgba(255,255,255,0.2)',
                                            background: 'rgba(255,255,255,0.06)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white',
                                            cursor: 'pointer',
                                            backdropFilter: 'blur(8px)',
                                            flexShrink: 0,
                                        }}
                                    >
                                        {isMuted ? <VolumeX size={18} color="rgba(255,255,255,0.6)" /> : <Volume2 size={18} color="rgba(255,255,255,0.6)" />}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* ── Episodes list (TV only, on mobile) ── */}
                        {selectedMediaType === 'tv' && episodes && episodes.length > 0 && (
                            <div style={{ padding: '0 18px', marginTop: '16px' }}>
                                <h3 style={{
                                    color: 'white',
                                    fontSize: '1rem',
                                    fontWeight: '700',
                                    marginBottom: '12px',
                                    paddingLeft: '2px',
                                }}>Episodes</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {episodes.slice(0, 6).map((ep, index) => (
                                        <div
                                            key={ep.id || index}
                                            data-ep-item
                                            onClick={() => {
                                                closeModal();
                                                navigate(`/watch/tv/${selectedMovieId}/season/${ep.season_number}/episode/${ep.episode_number}`);
                                            }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                background: 'rgba(255,255,255,0.04)',
                                                borderRadius: '12px',
                                                padding: '8px 10px',
                                                cursor: 'pointer',
                                                border: '1px solid rgba(255,255,255,0.07)',
                                                opacity: 0
                                            }}
                                        >
                                            <div style={{
                                                width: '88px',
                                                height: '54px',
                                                borderRadius: '8px',
                                                overflow: 'hidden',
                                                background: '#222',
                                                flexShrink: 0,
                                            }}>
                                                {ep.still_path ? (
                                                    <img src={imageUrl(ep.still_path, 'w300')} alt={ep.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#555' }}>No Image</div>
                                                )}
                                            </div>
                                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                                <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', marginBottom: '2px' }}>
                                                    Ep {ep.episode_number}
                                                </div>
                                                <div style={{
                                                    fontSize: '0.88rem',
                                                    fontWeight: '600',
                                                    color: '#fff',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                }}>
                                                    {ep.name}
                                                </div>
                                            </div>
                                            <Play size={16} color="rgba(255,255,255,0.5)" style={{ flexShrink: 0 }} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ─── DESKTOP LAYOUT ───────────────────────────────────────────────────────
    return (
        <div
            ref={overlayRef}
            onClick={handleClose}
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
                opacity: 0
            }}
        >
            <div
                ref={containerRef}
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: '100%',
                    maxWidth: '1300px',
                    height: '85vh',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'row',
                    opacity: 0,
                    transform: 'translateY(30px) scale(0.95)'
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
                            <div ref={playerContainerRef} className="yt-player-container" style={{
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
                    
                    {preloadingUrl && (
                        <iframe
                            src={preloadingUrl}
                            sandbox="allow-scripts allow-same-origin"
                            style={{
                                position: 'absolute',
                                width: '1px',
                                height: '1px',
                                opacity: 0.01,
                                pointerEvents: 'none',
                                zIndex: -1
                            }}
                            aria-hidden="true"
                        />
                    )}
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
                    <div className="modal-left-anim" style={{
                        fontSize: '0.85rem', letterSpacing: '2px', fontWeight: 'bold',
                        color: '#e50914', marginBottom: '1.5rem', textTransform: 'uppercase',
                        opacity: 0
                    }}>
                        {movie.genres?.[0]?.name ? `${movie.genres[0].name} Series` : 'Original Content'}
                    </div>

                    {logoPath ? (
                        <img
                            className="modal-left-anim"
                            src={imageUrl(logoPath, 'w500')}
                            alt={movie.title || movie.name}
                            style={{
                                width: '100%',
                                maxWidth: '360px',
                                marginBottom: '1.5rem',
                                filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.9)) drop-shadow(0 0 20px rgba(0,0,0,0.5))',
                                position: 'relative',
                                zIndex: 10,
                                opacity: 0
                            }}
                        />
                    ) : (
                        <h1
                            className="modal-left-anim"
                            style={{
                                fontSize: 'clamp(2.5rem, 4vw, 4rem)',
                                fontWeight: '900',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                lineHeight: '1.1',
                                marginBottom: '1.2rem',
                                textShadow: '0 4px 20px rgba(0,0,0,0.5)',
                                opacity: 0
                            }}
                        >
                            {movie.title || movie.name}
                        </h1>
                    )}

                    <div
                        className="modal-left-anim"
                        style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', opacity: 0 }}
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
                    </div>

                    <p
                        className="modal-left-anim"
                        style={{
                            fontSize: '0.85rem', lineHeight: '1.5', color: 'rgba(255,255,255,0.8)',
                            maxWidth: '450px', marginBottom: '2rem', textShadow: '0 2px 10px rgba(0,0,0,0.8)',
                            opacity: 0
                        }}
                    >
                        {movie.overview?.length > 200 ? movie.overview.substring(0, 200) + '...' : movie.overview}
                    </p>

                    <div
                        className="modal-left-anim"
                        style={{ display: 'flex', alignItems: 'center', gap: '1rem', opacity: 0 }}
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
                    </div>
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
                            onClick={handleClose}
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
                    <div style={{
                        padding: '1.5rem', overflowY: 'auto', flex: 1,
                        scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.2) transparent'
                    }}>
                        {selectedMediaType === 'tv' && episodes && episodes.length > 0 ? (
                            <>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                                    {episodes.map((ep, index) => (
                                        <div
                                            key={ep.id || index}
                                            className="modal-right-anim"
                                            style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1rem',
                                                cursor: 'pointer', opacity: 0
                                            }}
                                            onClick={() => {
                                                closeModal();
                                                navigate(`/watch/tv/${selectedMovieId}/season/${ep.season_number}/episode/${ep.episode_number}`);
                                            }}
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
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <>
                                <h3 style={{ color: 'white', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Full Cast</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                                    {cast.length > 0 ? cast.map((actor, index) => (
                                        <div
                                            key={actor.id}
                                            onClick={() => {
                                                closeModal();
                                                navigate(`/person/${actor.id}`);
                                            }}
                                            className="modal-right-anim"
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '1rem',
                                                padding: '0.5rem', borderRadius: '12px',
                                                background: 'rgba(255,255,255,0.03)',
                                                transition: 'all 0.2s', cursor: 'pointer', opacity: 0
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
                                        </div>
                                    )) : (
                                        <div style={{ color: 'rgba(255,255,255,0.5)' }}>No cast information available</div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MovieDetailsModal;
