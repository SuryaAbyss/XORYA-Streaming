import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { imageUrl, getMovieImages, getMovieVideos } from '../api/tmdb';
import { Play, Info, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useYouTubePlayer from '../hooks/useYouTubePlayer';
import { selectBestTrailer } from '../utils/trailerSelector';
import ShinyPill from './ShinyPill';

const Hero = ({ movie, onPlay, onInfo, onTrailerStart, isTrailerPlaying, onTrailerEnd }) => {
    const navigate = useNavigate();
    const [logoPath, setLogoPath] = useState(null);
    const [videoKey, setVideoKey] = useState(null);
    const [showVideo, setShowVideo] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuteHovered, setIsMuteHovered] = useState(false);
    const [isMuteFaded, setIsMuteFaded] = useState(false);
    const playerContainerRef = useRef(null);
    const muteFadeTimerRef = useRef(null);

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
        active: !!videoKey, // Mount player immediately to preload/buffer during the 5s delay
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

            // Fetch Video - Use smart selection to get best quality, newest trailer
            getMovieVideos(movie.id).then(res => {
                const videos = res.data.results;
                const bestTrailer = selectBestTrailer(videos);
                if (bestTrailer) {
                    setVideoKey(bestTrailer.key);
                }
            }).catch(console.error);
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

    if (!movie) return null;

    return (
        <div
            style={{
                height: '100vh',
                width: '100%',
                position: 'relative',
                marginBottom: '0',
                overflow: 'hidden'
            }}
        >
            {/* Video Background - YouTube IFrame Player API */}
            <div
                style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    zIndex: showVideo ? 2 : -1,
                    opacity: showVideo ? 1 : 0,
                    transition: 'opacity 1s ease-in-out',
                    overflow: 'hidden',
                    maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)'
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
                        filter: 'contrast(1.08) saturate(1.05) brightness(0.95)', // Slight dramatic cinematic tone
                        willChange: 'transform',
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

            {/* Static Background Image - w1280 for fast load, preloaded from Home */}
            <motion.div
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{
                    opacity: showVideo ? 0 : 1,
                    scale: 1
                }}
                transition={{
                    opacity: { duration: 0.8, ease: "easeIn" }, // Fades out slightly earlier than video fades in
                    scale: { duration: 1.5, ease: "easeOut" }
                }}
                style={{
                    position: 'absolute',
                    top: 0, left: 0, width: '100%', height: '100%',
                    backgroundImage: `url(${imageUrl(movie.backdrop_path, 'w1280')})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    zIndex: 0,
                    maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)'
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
                WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)'
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
                initial="hidden"
                animate="visible"
                variants={{
                    hidden: { opacity: 0 },
                    visible: {
                        opacity: 1,
                        transition: {
                            staggerChildren: 0.15,
                            delayChildren: 0.2
                        }
                    }
                }}
                style={{
                    position: 'absolute',
                    top: isTrailerPlaying ? '70%' : '35%',
                    left: '3%',
                    maxWidth: '600px',
                    transform: 'translateY(-50%)',
                    zIndex: 25,
                    transition: 'top 1s cubic-bezier(0.25, 0.46, 0.45, 0.94), left 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                }}>
                <motion.div
                    variants={{
                        hidden: { opacity: 0, y: 30, scale: 0.95 },
                        visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.8, type: "spring", bounce: 0.4 } }
                    }}
                    style={{ marginBottom: '1rem' }}
                >
                    {logoPath ? (
                        <img
                            src={imageUrl(logoPath, 'w500')}
                            alt={movie.title}
                            style={{ maxHeight: '100px', width: 'auto', display: 'block' }}
                        />
                    ) : (
                        <h1 className="gradient-text" style={{ fontSize: '2.5rem', lineHeight: 1.1 }}>
                            {movie.title}
                        </h1>
                    )}
                </motion.div>

                <motion.div
                    style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}
                >
                    <motion.div variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } } }}>
                        <button
                            onClick={() => {
                                if (onPlay) onPlay(movie);
                                if (movie?.id) navigate(`/watch/movie/${movie.id}`);
                            }}
                            style={{
                                padding: '0.5rem 1.2rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                borderRadius: '50px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                background: 'rgba(255, 255, 255, 0.06)',
                                backdropFilter: 'blur(20px)',
                                WebkitBackdropFilter: 'blur(20px)',
                                color: 'white',
                                border: 'none',
                                fontSize: '0.8rem',
                                height: '36px',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                                outline: 'none'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
                            }}
                        >
                            <Play fill="white" color="white" size={16} />
                            <span>Play Now</span>
                        </button>
                    </motion.div>

                    <motion.div variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } } }}>
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
                                fontSize: '0.85rem',
                                height: '38px'
                            }}
                        >
                            <Info size={20} />
                            <span>More Info</span>
                        </button>
                    </motion.div>

                    {/* Mute Toggle - Always visible */}
                    <motion.div variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } } }}>
                        <button
                            onClick={toggleMute}
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
                    </motion.div>
                </motion.div>
            </motion.div>
        </div >
    );
};

export default Hero;
