import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { imageUrl, getMovieImages, getMovieVideos } from '../api/tmdb';
import { Play, Info, Volume2, VolumeX, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'; // eslint-disable-line no-unused-vars
import useYouTubePlayer from '../hooks/useYouTubePlayer';
import { selectBestTrailer } from '../utils/trailerSelector';
import ShinyPill from './ShinyPill';
import { animate, createScope, createTimeline, stagger } from 'animejs';
import GridPattern from './ui/GridPattern';

// Detect mobile/touch devices  trailers are disabled on phones
const isMobileDevice = () => {
    if (typeof window === 'undefined') return false;
    // Check for touch capability AND a narrow viewport (phones, not tablets/desktops)
    const hasTouch = navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
    const isNarrow = window.innerWidth <= 768;
    return hasTouch && isNarrow;
};

const Hero = ({ movie, onPlay, onInfo, onTrailerStart, isTrailerPlaying, onTrailerEnd }) => {
    const isMobile = isMobileDevice();
    const navigate = useNavigate();
    const [logoPath, setLogoPath] = useState(null);
    const [videoKey, setVideoKey] = useState(null);
    const [showVideo, setShowVideo] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuteHovered, setIsMuteHovered] = useState(false);
    const [isMuteFaded, setIsMuteFaded] = useState(false);
    const [ringProgress, setRingProgress] = useState(0); // 0 = start, 1 = end
    const playerContainerRef = useRef(null);
    const muteFadeTimerRef = useRef(null);
    const backgroundRef = useRef(null);
    const contentRef = useRef(null);

    // Scope refs for anime.js animations

    const heroScopeRef = useRef(null);
    const scopeRef = useRef(null);

    useEffect(() => {
        if (!movie) return;

        let isScopeCreated = false;
        if (heroScopeRef.current) {
            scopeRef.current = createScope({ root: heroScopeRef }).add(self => {
                self.add('playEntrance', () => {
                    console.log('Hero: playEntrance called inside scope context');
                    if (movie) {
                        const timeline = createTimeline({
                            defaults: {
                                ease: 'out(3)',
                                duration: 1200
                            }
                        });

                        // 1. Reveal and zoom-in/fade background
                        timeline.add(backgroundRef.current, {
                            opacity: [0, 1],
                            scale: [1.08, 1],
                            duration: 1800,
                            ease: 'out(4)'
                        });

                        // 2. Stagger reveal titles and controls
                        const items = contentRef.current?.querySelectorAll('.hero-anim-item');
                        if (items && items.length > 0) {
                            timeline.add(items, {
                                opacity: [0, 1],
                                translateY: [30, 0],
                                delay: stagger(120),
                                duration: 1000,
                                ease: 'out(4)'
                            }, '-=1400');
                        }

                        timeline.play();
                    }
                });
            });
            isScopeCreated = true;
        }

        if (backgroundRef.current) {
            backgroundRef.current.style.opacity = '1';
            backgroundRef.current.style.transform = 'scale(1)';
        }
        const items = contentRef.current?.querySelectorAll('.hero-anim-item');
        if (items) {
            items.forEach(item => {
                item.style.opacity = '1';
                item.style.transform = 'translateY(0px)';
            });
        }

        return () => {
            if (isScopeCreated && scopeRef.current) {
                scopeRef.current.revert();
            }
        };
    }, [movie]);

    // Handle transition of background when video trailer toggles
    useEffect(() => {
        if (backgroundRef.current && movie) {
            animate(backgroundRef.current, {
                opacity: showVideo ? 0 : 1,
                duration: 800,
                ease: 'inOut(2)'
            });
        }
    }, [showVideo, movie]);

    // Handle mute fade timer
    useEffect(() => {
        if (isMuteHovered) {
            setIsMuteFaded(false);
            if (muteFadeTimerRef.current) clearTimeout(muteFadeTimerRef.current);
        } else {
            muteFadeTimerRef.current = setTimeout(() => {
                setIsMuteFaded(true);
            }, 7000); // 7 seconds before fade
        }
        return () => {
            if (muteFadeTimerRef.current) clearTimeout(muteFadeTimerRef.current);
        };
    }, [isMuteHovered]);

    const handlePlayerReady = useCallback(() => {
        // Player is ready, quality forcing is handled by the hook
    }, []);

    const handleTrailerEnd = useCallback(() => {
        if (onTrailerEnd) onTrailerEnd();
    }, [onTrailerEnd]);

    const handlePlaying = useCallback(() => {
        setIsPlaying(true);
    }, []);

    const { isMuted, toggleMute, playerReady } = useYouTubePlayer(videoKey, playerContainerRef, {
        active: !isMobile && !!videoKey, // Never mount on mobile � static backdrop only
        onReady: handlePlayerReady,
        onEnd: handleTrailerEnd,
        onPlaying: handlePlaying,
        loop: false, // Disable loop since we're manually controlling rotation
        delayPlay: typeof window !== 'undefined' && window.HERO_DELAY ? window.HERO_DELAY : 1000, // Syncs trailer delay dynamically with the website's Intro length
    });

    useEffect(() => {
        if (movie?.id) {
            // Reset states on new movie
            setLogoPath(null);
            setVideoKey(null);
            setShowVideo(false);
            setIsPlaying(false);

            // Fetch Logo
            getMovieImages(movie.id).then(res => {
                const logos = res.data.logos;
                if (logos.length > 0) {
                    setLogoPath(logos[0].file_path);
                }
            }).catch(console.error);

            // Fetch Video - Skip entirely on mobile devices
            if (!isMobile) {
                getMovieVideos(movie.id).then(res => {
                    const videos = res.data.results;
                    const bestTrailer = selectBestTrailer(videos);
                    if (bestTrailer) {
                        setVideoKey(bestTrailer.key);
                    }
                }).catch(console.error);
            }
        }
    }, [movie]);

    // Fade-in only after video starts playing + 2.5s delay (allowing 1080p to stabilize)
    useEffect(() => {
        if (isPlaying && !showVideo) {
            const timer = setTimeout(() => {
                setShowVideo(true);
                if (onTrailerStart) {
                    onTrailerStart();
                }
            }, 2500); // 2.5s after playback begins

            return () => clearTimeout(timer);
        }
    }, [isPlaying, showVideo, onTrailerStart]);

    // Monitor playback to stop 5 seconds before end (prevent YouTube suggestion screen)
    // Also drives the countdown ring on the mute button
    useEffect(() => {
        if (!showVideo || !videoKey || !playerReady) {
            setRingProgress(0);
            return;
        }

        const monitorInterval = setInterval(() => {
            if (playerContainerRef.current && window.YT) {
                const players = playerContainerRef.current.querySelectorAll('iframe');
                if (players.length > 0) {
                    try {
                        // Try to get player instance
                        const ytPlayers = window.YT.get ? Array.from(players).map(p => window.YT.get(p.id)).filter(Boolean) : [];

                        if (ytPlayers.length > 0) {
                            const player = ytPlayers[0];
                            if (player && typeof player.getCurrentTime === 'function' && typeof player.getDuration === 'function') {
                                const currentTime = player.getCurrentTime();
                                const duration = player.getDuration();

                                if (duration > 0) {
                                    // Update ring progress (0 → 1 over entire video)
                                    setRingProgress(Math.min(1, currentTime / duration));

                                    const stopTime = duration - 5; // Stop 5 seconds before end

                                    if (currentTime >= stopTime) {
                                        // Stop video immediately
                                        player.pauseVideo();

                                        // Trigger trailer end callback
                                        if (onTrailerEnd) {
                                            setShowVideo(false);
                                            setRingProgress(0);
                                            onTrailerEnd();
                                        }
                                    }
                                }
                            }
                        }
                    } catch (error) {
                        console.warn('Error monitoring playback:', error);
                    }
                }
            }
        }, 500); // Check every 500ms

        return () => clearInterval(monitorInterval);
    }, [showVideo, videoKey, playerReady, onTrailerEnd]);

    const isUpcoming = React.useMemo(() => {
        if (!movie) return false;
        const releaseStr = movie.release_date || movie.first_air_date;
        if (!releaseStr) return false;
        return new Date(releaseStr) > new Date();
    }, [movie]);

    if (!movie) {
        return (
            <div
                style={{
                    height: isMobile ? '55vh' : '100vh',
                    width: '100%',
                    background: '#050505',
                    position: 'relative'
                }}
            />
        );
    }

    return (
        <div
            ref={heroScopeRef}
            className="hero-section"
            style={{
                height: isMobile ? '60vh' : '100vh',
                minHeight: isMobile ? '460px' : undefined,
                width: '100%',
                position: 'relative',
                marginBottom: '0',
                overflow: 'visible'
            }}
        >

            {/* Video Background - YouTube IFrame Player API (desktop only) */}
            {/* Using plain div (not motion.div) to prevent Framer Motion re-renders causing jitter */}
            {!isMobile && (
                <div
                    style={{
                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                        zIndex: showVideo ? 2 : -1,
                        opacity: showVideo ? 1 : 0,
                        transition: 'opacity 0.6s ease-in-out',
                        overflow: 'hidden',
                        contain: 'strict',
                    }}
                    onContextMenu={(e) => e.preventDefault()}
                >
                    {/* Responsive iframe container — locked & center-cropped */}
                    <div
                        ref={playerContainerRef}
                        className="yt-player-container"
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%) scale(1.15)',
                            width: '100vw',
                            height: '56.25vw',
                            minWidth: '177.78vh',
                            minHeight: '100vh',
                            pointerEvents: 'none',
                            willChange: 'transform',
                            backfaceVisibility: 'hidden',
                        }}
                    />
                </div>
            )}

            {/* Static Background Image - Original TMDB backdrop stretched down behind Trending section */}
            <motion.img
                ref={backgroundRef}
                src={imageUrl(movie.backdrop_path, isMobile ? 'w780' : 'original')}
                alt={movie.title || "Movie backdrop"}
                fetchpriority="high"
                style={{
                    position: 'absolute',
                    top: 0, left: 0, width: '100%',
                    height: isMobile ? '80vh' : '145vh',
                    objectFit: 'cover',
                    objectPosition: isMobile ? 'center top' : 'center 20%',
                    zIndex: 0
                }}
            />

            {/* === OVERLAY SYSTEM (matches 67movies.nl cinematic approach) === */}

            {/* Layer A: Static image overlays — only visible when video is NOT playing */}
            {!showVideo && (
                <>
                    {/* Radial vignette — darkens the edges, keeps center bright */}
                    <div style={{
                        position: 'absolute', top: 0, left: 0, width: '100%',
                        height: isMobile ? '80vh' : '145vh',
                        background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 20%, rgba(0,0,0,0.3) 65%, rgba(0,0,0,0.65) 100%)',
                        zIndex: 1,
                        pointerEvents: 'none'
                    }} />
                    {/* Top-to-bottom gradient — subtle blend so poster shines behind Trending section */}
                    <div style={{
                        position: 'absolute', top: 0, left: 0, width: '100%',
                        height: isMobile ? '80vh' : '145vh',
                        background: 'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.1) 40%, transparent 60%, rgba(0,0,0,0.2) 80%, rgba(0,0,0,0.85) 100%)',
                        zIndex: 1,
                        pointerEvents: 'none'
                    }} />
                    {/* Left-to-right gradient — keeps left text area readable */}
                    <div style={{
                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                        background: 'linear-gradient(to right, rgba(0,0,0,0.55) 0%, transparent 55%, rgba(0,0,0,0.28) 100%)',
                        zIndex: 1,
                        pointerEvents: 'none'
                    }} />
                </>
            )}

            {/* Layer B: Video overlays — ultra subtle edge vignette to maximize video brightness & color vibrancy */}
            {showVideo && (
                <>
                    {/* Subtle edge vignette — center 60% stays crystal clear and ultra bright */}
                    <div style={{
                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                        background: 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.12) 80%, rgba(0,0,0,0.35) 100%)',
                        zIndex: 8,
                        pointerEvents: 'none',
                    }} />
                    {/* Bottom fade — smoothly blends into site dark theme at bottom edge only */}
                    <div style={{
                        position: 'absolute',
                        bottom: 0, left: 0,
                        width: '100%',
                        height: '32%',
                        background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.65) 85%, #000 100%)',
                        zIndex: 8,
                        pointerEvents: 'none',
                    }} />
                    {/* Left-side subtle fade — maintains text legibility without dimming central action */}
                    <div style={{
                        position: 'absolute',
                        top: 0, left: 0,
                        width: '38%',
                        height: '100%',
                        background: 'linear-gradient(to right, rgba(0,0,0,0.32) 0%, transparent 100%)',
                        zIndex: 8,
                        pointerEvents: 'none',
                    }} />
                </>
            )}

            {/* Content */}
            <motion.div
                ref={contentRef}
                style={isMobile ? {
                    position: 'absolute',
                    bottom: '1.25rem',
                    left: '1.2rem',
                    right: '1.2rem',
                    maxWidth: '100%',
                    zIndex: 25,
                } : {
                    position: 'absolute',
                    top: isTrailerPlaying ? '82%' : '55%',
                    left: '4%',
                    maxWidth: '560px',
                    transform: 'translateY(-50%)',
                    zIndex: 25,
                    transition: 'top 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94), left 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                }}>
                <div
                    className="hero-anim-item"
                    style={{ marginBottom: '0.85rem' }}
                >
                    {logoPath ? (
                        <img
                            src={imageUrl(logoPath, 'w500')}
                            alt={movie.title}
                            width="260"
                            height="80"
                            style={{ maxHeight: isMobile ? '72px' : '100px', width: 'auto', display: 'block', objectFit: 'contain' }}
                        />
                    ) : (
                        <h1 className="gradient-text" style={{ fontSize: isMobile ? '1.8rem' : '2.5rem', lineHeight: 1.1 }}>
                            {movie.title}
                        </h1>
                    )}
                </div>


                <div
                    className="hero-anim-item"
                    style={{ display: 'flex', gap: isMobile ? '0.65rem' : '1rem', alignItems: 'center' }}
                >

                    <div>
                        <button
                            onClick={() => {
                                if (onPlay) onPlay(movie);
                                if (movie?.id) {
                                    const mtype = movie.media_type || (movie.name ? 'tv' : 'movie');
                                    navigate(`/watch/${mtype}/${movie.id}?autofs=true`);
                                }
                            }}
                            className="interactive-play-btn"

                        >
                            <div className="bg-expander"></div>
                            <div className="primary-content">
                                <span className="primary-text">
                                    <Play fill="white" color="white" size={16} />
                                    <span>Play Now</span>
                                </span>
                            </div>
                            <div className="secondary-content">
                                <span>Play Now</span>
                                <Play fill="black" color="black" size={16} />
                            </div>
                        </button>
                    </div>

                    <div>
                        <button
                            onClick={() => {
                                if (onInfo) onInfo(movie);
                                if (movie?.id) navigate(`/movie/${movie.id}`);
                            }}
                            className="hero-glass-btn"
                            style={isMobile ? {
                                height: '46px',
                                fontSize: '0.9rem'
                            } : undefined}
                        >
                            <Info size={isMobile ? 18 : 20} />
                            <span>More Info</span>
                        </button>
                    </div>

                    {/* Mute Toggle - Only on desktop (trailer is desktop-only) */}
                    {!isMobile && (() => {
                        // SVG ring geometry
                        const R = 19;           // radius (fits inside 42px wrapper)
                        const CIRC = 2 * Math.PI * R;  // ~119.4
                        const dashOffset = CIRC * (1 - ringProgress);
                        const nearEnd = ringProgress > 0.85;

                        return (
                            <div className="hero-mute-wrapper">
                                {/* Countdown ring — visible only while trailer plays */}
                                <svg
                                    className={`hero-mute-ring${showVideo ? ' visible' : ''}`}
                                    viewBox="0 0 42 42"
                                    aria-hidden="true"
                                >
                                    {/* background track */}
                                    <circle className="hero-mute-ring-track" cx="21" cy="21" r={R} />
                                    {/* animated progress arc */}
                                    <circle
                                        className={`hero-mute-ring-progress${nearEnd ? ' pulsing' : ''}`}
                                        cx="21" cy="21" r={R}
                                        strokeDasharray={CIRC}
                                        strokeDashoffset={dashOffset}
                                    />
                                </svg>

                                <button
                                    onClick={toggleMute}
                                    aria-label={isMuted ? "Unmute video" : "Mute video"}
                                    onMouseEnter={() => setIsMuteHovered(true)}
                                    onMouseLeave={() => setIsMuteHovered(false)}
                                    className="hero-mute-btn"
                                    style={{ opacity: isMuteFaded ? 0.3 : 1 }}
                                >
                                    {isMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
                                </button>
                            </div>
                        );
                    })()}

                    {/* Soon Releasing Badge */}
                    {isUpcoming && (
                        <div>
                            <div style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '50px',
                                background: 'rgba(239, 68, 68, 0.2)',
                                border: '1px solid rgba(239, 68, 68, 0.4)',
                                color: '#fca5a5',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                backdropFilter: 'blur(4px)',
                                whiteSpace: 'nowrap',
                                display: 'flex',
                                alignItems: 'center'
                            }}>
                                Soon Releasing
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div >
    );
};

export default Hero;
