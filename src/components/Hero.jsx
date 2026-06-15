import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { imageUrl, getMovieImages, getMovieVideos } from '../api/tmdb';
import { Play, Info, Volume2, VolumeX, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import useYouTubePlayer from '../hooks/useYouTubePlayer';
import { selectBestTrailer } from '../utils/trailerSelector';
import ShinyPill from './ShinyPill';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';

// Detect mobile/touch devices — trailers are disabled on phones
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
    const playerContainerRef = useRef(null);
    const muteFadeTimerRef = useRef(null);
    const backgroundRef = useRef(null);
    const contentRef = useRef(null);

    // Parallax scrolling hooks
    const { scrollY } = useScroll();
    const backgroundY = useTransform(scrollY, [0, 1000], ['0%', '25%']);
    const contentY = useTransform(scrollY, [0, 1000], ['0%', '15%']);

    // GSAP animations for Hero entrance and transitions
    useGSAP(() => {
        if (!movie) return;

        // Reset and fade in/scale background
        gsap.fromTo(backgroundRef.current,
            { scale: 1.08, opacity: 0 },
            { scale: 1, opacity: showVideo ? 0 : 1, duration: 1.8, ease: "power3.out", overwrite: "auto" }
        );

        // Staggered fade in/up for title logo and CTA buttons
        const items = contentRef.current?.querySelectorAll('.hero-anim-item');
        if (items && items.length > 0) {
            gsap.fromTo(items,
                { opacity: 0, y: 30 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 1.0,
                    ease: "power4.out",
                    stagger: 0.12,
                    delay: 0.2,
                    overwrite: "auto"
                }
            );
        }
    }, [movie]);

    useGSAP(() => {
        if (backgroundRef.current) {
            gsap.to(backgroundRef.current, {
                opacity: showVideo ? 0 : 1,
                duration: 0.8,
                ease: "power2.inOut",
                overwrite: "auto"
            });
        }
    }, [showVideo]);

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

    const { isMuted, toggleMute, playerReady, player } = useYouTubePlayer(videoKey, playerContainerRef, {
        active: !isMobile && !!videoKey, // Never mount on mobile — static backdrop only
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
    useEffect(() => {
        if (!showVideo || !videoKey || !playerReady) return;

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
                                    const stopTime = duration - 5; // Stop 5 seconds before end

                                    if (currentTime >= stopTime) {
                                        // Stop video immediately
                                        player.pauseVideo();

                                        // Trigger trailer end callback
                                        if (onTrailerEnd) {
                                            setShowVideo(false);
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
            style={{
                height: isMobile ? '55vh' : '100vh',
                width: '100%',
                position: 'relative',
                marginBottom: '0',
                overflow: 'hidden'
            }}
        >
            {/* Video Background - YouTube IFrame Player API (desktop only) */}
            {!isMobile && (
                <motion.div
                    style={{
                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                        zIndex: showVideo ? 2 : -1,
                        opacity: showVideo ? 1 : 0,
                        transition: 'opacity 1s ease-in-out',
                        overflow: 'hidden',
                        maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
                        WebkitMaskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
                        y: backgroundY
                    }}
                    onContextMenu={(e) => e.preventDefault()}
                >
                    {/* Player container - YouTube API renders into this div */}
                    <div
                        ref={playerContainerRef}
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%) scale(1.15)',
                            width: '100vw',
                            height: '56.25vw',
                            minWidth: '177.78vh',
                            pointerEvents: 'none',
                            filter: 'contrast(1.08) saturate(1.05) brightness(0.95)',
                            willChange: 'transform',
                        }}
                    />
                    {/* Dark interaction-blocking overlay - blocks right-click but not clicks */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            zIndex: 5,
                            pointerEvents: 'none',
                            background: 'transparent',
                        }}
                    />
                </motion.div>
            )}

            {/* Static Background Image - w1280 for fast load, preloaded from Home */}
            <motion.img
                ref={backgroundRef}
                src={imageUrl(movie.backdrop_path, isMobile ? 'w780' : 'w1280')}
                alt={movie.title || "Movie backdrop"}
                fetchpriority="high"
                style={{
                    position: 'absolute',
                    top: 0, left: 0, width: '100%', height: '100%',
                    objectFit: 'cover',
                    zIndex: 0,
                    maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
                    y: backgroundY
                }}
            />

            {/* Gradient Overlay - Minimal for maximum brightness */}
            <div style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                background: showVideo
                    ? 'linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 30%)'
                    : 'radial-gradient(circle at center, transparent 0%, rgba(5,5,5,0.7) 100%), linear-gradient(to top, rgba(5,5,5,0.9) 10%, transparent 50%)',
                zIndex: showVideo ? 6 : 1,
                transition: 'background 1s ease-in-out',
                maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
                transform: `translateY(${backgroundY})`,
                pointerEvents: 'none'
            }} />

            {/* Cinematic Overlays (Only visible when video is playing for cinematic feel) */}
            <div style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                opacity: showVideo ? 1 : 0, transition: 'opacity 1s ease-in-out', pointerEvents: 'none', zIndex: 3
            }}>
                {/* Cinematic Contrast & Depth Layer */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.75) 100%)',
                    mixBlendMode: 'normal'
                }} />

                {/* Subtle Film Grain Layer */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    opacity: 0.04,
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")'
                }} />

                {/* Emotional Tone (Soft Vignette) */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'radial-gradient(circle at center, rgba(0,0,0,0) 60%, rgba(0,0,0,0.4) 100%)'
                }} />
            </div>

            {/* Content */}
            <motion.div
                ref={contentRef}
                style={isMobile ? {
                    position: 'absolute',
                    bottom: '1.5rem',
                    left: '4%',
                    right: '4%',
                    maxWidth: '100%',
                    zIndex: 25,
                } : {
                    position: 'absolute',
                    top: isTrailerPlaying ? '70%' : '35%',
                    left: '3%',
                    maxWidth: '600px',
                    transform: 'translateY(-50%)',
                    zIndex: 25,
                    y: contentY,
                    transition: 'top 1s cubic-bezier(0.25, 0.46, 0.45, 0.94), left 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                }}>
                <div
                    className="hero-anim-item"
                    style={{ marginBottom: '1rem' }}
                >
                    {logoPath ? (
                        <img
                            src={imageUrl(logoPath, 'w500')}
                            alt={movie.title}
                            width="300"
                            height="100"
                            style={{ maxHeight: '100px', width: 'auto', display: 'block', objectFit: 'contain' }}
                        />
                    ) : (
                        <h1 className="gradient-text" style={{ fontSize: '2.5rem', lineHeight: 1.1 }}>
                            {movie.title}
                        </h1>
                    )}
                </div>

                <div
                    className="hero-anim-item"
                    style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}
                >
                    <div>
                        <button
                            onClick={() => {
                                if (onPlay) onPlay(movie);
                                if (movie?.id) {
                                    const mtype = movie.media_type || (movie.name ? 'tv' : 'movie');
                                    navigate(`/watch/${mtype}/${movie.id}`);
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
                            className="glass"
                            style={{
                                padding: '0.6rem 1.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
                                borderRadius: '50px', fontWeight: 'bold', cursor: 'pointer',
                                background: 'rgba(100, 100, 100, 0.25)', color: 'white', border: 'none',
                                fontSize: isMobile ? '0.9rem' : '0.85rem',
                                height: isMobile ? '46px' : '38px'
                            }}
                        >
                            <Info size={isMobile ? 18 : 20} />
                            <span>More Info</span>
                        </button>
                    </div>

                    {/* Mute Toggle - Only on desktop (trailer is desktop-only) */}
                    {!isMobile && (
                        <div>
                            <button
                                onClick={toggleMute}
                                aria-label={isMuted ? "Unmute video" : "Mute video"}
                                onMouseEnter={() => setIsMuteHovered(true)}
                                onMouseLeave={() => setIsMuteHovered(false)}
                                className="glass"
                                style={{
                                    padding: '0.6rem',
                                    borderRadius: '50%',
                                    background: 'rgba(0,0,0,0.5)',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    color: 'white',
                                    cursor: 'pointer',
                                    height: '38px',
                                    width: '38px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    opacity: isMuteFaded ? 0.3 : 1,
                                    transition: 'opacity 0.8s ease'
                                }}
                            >
                                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                            </button>
                        </div>
                    )}

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
