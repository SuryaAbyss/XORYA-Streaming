import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Hls from 'hls.js';
import {
    Play,
    Pause,
    RotateCcw,
    RotateCw,
    Volume2,
    VolumeX,
    Volume1,
    Maximize,
    Minimize,
    Settings,
    Subtitles,
    Languages,
    Check,
    SkipForward,
    RefreshCw,
    AlertCircle
} from 'lucide-react';

/**
 * DirectStreamPlayer
 * High-performance, ad-free direct stream player utilizing native HTML5 video and Hls.js.
 * Demonstrates the Vega architecture principles:
 * - Direct M3U8/MP4 playback
 * - Multi-quality switching
 * - Audio track selection
 * - Embedded & external subtitle tracks
 * - Skip Intro / Skip Credits integration via TheIntroDB
 */
const DirectStreamPlayer = ({
    src,
    poster,
    title,
    tmdbId,
    season,
    episode,
    externalSubtitles = [],
    onNextEpisode,
    style
}) => {
    const videoRef = useRef(null);
    const containerRef = useRef(null);
    const hlsRef = useRef(null);
    const idleTimerRef = useRef(null);

    // Playback state
    const [isPlaying, setIsPlaying] = useState(false);
    const [isBuffering, setIsBuffering] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [bufferedEnd, setBufferedEnd] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);

    // Track states
    const [qualities, setQualities] = useState([]);
    const [currentQuality, setCurrentQuality] = useState(-1); // -1 = Auto
    const [audioTracks, setAudioTracks] = useState([]);
    const [currentAudioTrack, setCurrentAudioTrack] = useState(-1);
    const [subtitleTracks, setSubtitleTracks] = useState([]);
    const [currentSubtitleTrack, setCurrentSubtitleTrack] = useState(-1); // -1 = Off

    // Menus
    const [openMenu, setOpenMenu] = useState(null); // 'quality' | 'audio' | 'subtitles' | 'speed' | null

    // Skip Timings (TheIntroDB integration)
    const [skipIntervals, setSkipIntervals] = useState([]);
    const [activeSkipPrompt, setActiveSkipPrompt] = useState(null);

    // 1. Fetch Skip Timings (Intro/Recap/Credits) via TheIntroDB
    useEffect(() => {
        if (!tmdbId || !season || !episode) {
            setSkipIntervals([]);
            return;
        }

        let isMounted = true;
        const fetchSkipData = async () => {
            try {
                const res = await fetch(`https://api.theintrodb.org/v2/media?tmdb_id=${tmdbId}&season=${season}&episode=${episode}`);
                if (!res.ok) return;
                const data = await res.json();
                if (!isMounted) return;

                const intervals = [];
                if (Array.isArray(data.intro)) {
                    for (const item of data.intro) {
                        if (item.end_ms > item.start_ms) {
                            intervals.push({ title: 'Skip Intro', from: item.start_ms / 1000, to: item.end_ms / 1000 });
                        }
                    }
                }
                if (Array.isArray(data.credits)) {
                    for (const item of data.credits) {
                        if (item.end_ms > item.start_ms) {
                            intervals.push({ title: 'Skip Credits', from: item.start_ms / 1000, to: item.end_ms / 1000 });
                        }
                    }
                }
                setSkipIntervals(intervals);
            } catch {
                // Silently ignore if introdb is unavailable
            }
        };

        fetchSkipData();
        return () => { isMounted = false; };
    }, [tmdbId, season, episode]);

    // Check active skip prompt during playback
    useEffect(() => {
        if (skipIntervals.length === 0) {
            setActiveSkipPrompt(null);
            return;
        }

        const match = skipIntervals.find(i => currentTime >= i.from && currentTime < i.to);
        setActiveSkipPrompt(match || null);
    }, [currentTime, skipIntervals]);

    // 2. Initialize HLS or Direct Video Stream
    const initPlayer = useCallback(() => {
        const video = videoRef.current;
        if (!video || !src) return;

        setErrorMsg(null);
        setIsBuffering(true);

        // Destroy previous HLS instance if any
        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }

        const isHlsUrl = src.includes('.m3u8') || src.includes('application/x-mpegURL');

        if (isHlsUrl && Hls.isSupported()) {
            const hls = new Hls({
                enableWorker: true,
                lowLatencyMode: false,
                backBufferLength: 90
            });
            hlsRef.current = hls;

            hls.loadSource(src);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
                setIsBuffering(false);
                // Extract Qualities
                const parsedQualities = data.levels.map((lvl, index) => ({
                    id: index,
                    height: lvl.height,
                    bitrate: Math.round(lvl.bitrate / 1000),
                    label: lvl.height ? `${lvl.height}p` : `Level ${index + 1}`
                }));
                setQualities(parsedQualities);
                setCurrentQuality(hls.currentLevel);

                // Extract Audio Tracks
                if (hls.audioTracks && hls.audioTracks.length > 1) {
                    setAudioTracks(hls.audioTracks.map((tr, index) => ({
                        id: index,
                        name: tr.name || tr.lang || `Audio ${index + 1}`,
                        lang: tr.lang
                    })));
                    setCurrentAudioTrack(hls.audioTrack);
                }

                // Extract Subtitle Tracks
                if (hls.subtitleTracks && hls.subtitleTracks.length > 0) {
                    setSubtitleTracks(hls.subtitleTracks.map((st, index) => ({
                        id: index,
                        name: st.name || st.lang || `Subtitle ${index + 1}`,
                        lang: st.lang
                    })));
                }

                video.play().catch(() => setIsPlaying(false));
            });

            hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
                setCurrentQuality(hls.autoLevelEnabled ? -1 : data.level);
            });

            hls.on(Hls.Events.AUDIO_TRACK_SWITCHED, (_, data) => {
                setCurrentAudioTrack(data.id);
            });

            hls.on(Hls.Events.ERROR, (_, data) => {
                if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            console.warn('[Hls Network Error] Attempting recovery...');
                            hls.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            console.warn('[Hls Media Error] Attempting recovery...');
                            hls.recoverMediaError();
                            break;
                        default:
                            setErrorMsg(`Streaming playback error (${data.details || 'fatal'})`);
                            hls.destroy();
                            break;
                    }
                }
            });
        } else if (video.canPlayType('application/vnd.apple.mpegurl') || !isHlsUrl) {
            // Native HLS (Safari/iOS) or Standard MP4 / WebM
            video.src = src;
            video.load();
            video.play().catch(() => setIsPlaying(false));
        } else {
            setErrorMsg('HLS playback is not supported on this browser.');
        }
    }, [src]);

    useEffect(() => {
        initPlayer();
        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
        };
    }, [initPlayer]);

    // 3. User Inactivity & Controls Auto-Hide
    const resetIdleTimer = useCallback(() => {
        setShowControls(true);
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        if (isPlaying) {
            idleTimerRef.current = setTimeout(() => {
                if (!openMenu) {
                    setShowControls(false);
                }
            }, 3000);
        }
    }, [isPlaying, openMenu]);

    const handleMouseMove = () => resetIdleTimer();

    // 4. Transport Controls
    const togglePlay = () => {
        const video = videoRef.current;
        if (!video) return;
        if (video.paused) {
            video.play().catch(e => console.warn(e));
        } else {
            video.pause();
        }
    };

    const handleSeek = (newTime) => {
        const video = videoRef.current;
        if (!video) return;
        video.currentTime = Math.max(0, Math.min(newTime, duration));
        setCurrentTime(video.currentTime);
    };

    const handleSkipIntro = () => {
        if (activeSkipPrompt) {
            handleSeek(activeSkipPrompt.to);
            setActiveSkipPrompt(null);
        }
    };

    const handleVolumeChange = (newVol) => {
        const video = videoRef.current;
        if (!video) return;
        const vol = Math.max(0, Math.min(newVol, 1));
        video.volume = vol;
        video.muted = vol === 0;
        setVolume(vol);
        setIsMuted(vol === 0);
    };

    const toggleMute = () => {
        const video = videoRef.current;
        if (!video) return;
        if (isMuted) {
            video.muted = false;
            setIsMuted(false);
            if (volume === 0) {
                video.volume = 0.5;
                setVolume(0.5);
            }
        } else {
            video.muted = true;
            setIsMuted(true);
        }
    };

    const handleSpeedChange = (speed) => {
        const video = videoRef.current;
        if (!video) return;
        video.playbackRate = speed;
        setPlaybackRate(speed);
        setOpenMenu(null);
    };

    const handleQualitySelect = (levelIndex) => {
        if (!hlsRef.current) return;
        hlsRef.current.currentLevel = levelIndex;
        setCurrentQuality(levelIndex);
        setOpenMenu(null);
    };

    const handleAudioSelect = (trackIndex) => {
        if (!hlsRef.current) return;
        hlsRef.current.audioTrack = trackIndex;
        setCurrentAudioTrack(trackIndex);
        setOpenMenu(null);
    };

    const handleSubtitleSelect = (subIndex) => {
        if (!hlsRef.current) return;
        hlsRef.current.subtitleTrack = subIndex;
        setCurrentSubtitleTrack(subIndex);
        setOpenMenu(null);
    };

    const toggleFullscreen = () => {
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(() => {});
        } else {
            document.exitFullscreen().catch(() => {});
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(Boolean(document.fullscreenElement));
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // Format seconds into HH:MM:SS or MM:SS
    const formatTime = (seconds) => {
        if (!seconds || isNaN(seconds)) return '00:00';
        const s = Math.floor(seconds);
        const hrs = Math.floor(s / 3600);
        const mins = Math.floor((s % 3600) / 60);
        const secs = s % 60;
        if (hrs > 0) {
            return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
        }
        return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => isPlaying && setShowControls(false)}
            style={{
                width: '100%',
                height: '100%',
                background: '#04070d',
                position: 'relative',
                overflow: 'hidden',
                borderRadius: isFullscreen ? '0px' : '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'Inter, system-ui, sans-serif',
                userSelect: 'none',
                ...style
            }}
        >
            {/* HTML5 Video element */}
            <video
                ref={videoRef}
                poster={poster}
                playsInline
                crossOrigin="anonymous"
                onClick={togglePlay}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onWaiting={() => setIsBuffering(true)}
                onPlaying={() => setIsBuffering(false)}
                onTimeUpdate={() => {
                    const v = videoRef.current;
                    if (v) {
                        setCurrentTime(v.currentTime);
                        if (v.buffered.length > 0) {
                            setBufferedEnd(v.buffered.end(v.buffered.length - 1));
                        }
                    }
                }}
                onDurationChange={() => {
                    if (videoRef.current) setDuration(videoRef.current.duration);
                }}
                onEnded={() => {
                    setIsPlaying(false);
                    if (onNextEpisode) onNextEpisode();
                }}
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    cursor: showControls ? 'default' : 'none'
                }}
            >
                {/* External Subtitle Tracks */}
                {externalSubtitles.map((sub, idx) => (
                    <track
                        key={idx}
                        kind="subtitles"
                        label={sub.title || sub.language}
                        srcLang={sub.language}
                        src={sub.uri}
                        default={idx === 0}
                    />
                ))}
            </video>

            {/* Error Overlay */}
            {errorMsg && (
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(5, 8, 15, 0.94)',
                    backdropFilter: 'blur(20px)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 50,
                    padding: '2rem',
                    textAlign: 'center'
                }}>
                    <AlertCircle size={44} color="#ef4444" style={{ marginBottom: '1rem' }} />
                    <div style={{ fontSize: '1.15rem', fontWeight: '700', color: '#fff', marginBottom: '0.4rem' }}>
                        Playback Error
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.65)', maxWidth: '420px', marginBottom: '1.5rem', lineHeight: '1.4' }}>
                        {errorMsg}
                    </div>
                    <button
                        onClick={initPlayer}
                        style={{
                            background: 'var(--theme-accent, #00bcd4)',
                            color: '#000',
                            border: 'none',
                            padding: '0.6rem 1.4rem',
                            borderRadius: '999px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.85rem'
                        }}
                    >
                        <RefreshCw size={15} /> Retry Stream
                    </button>
                </div>
            )}

            {/* Buffering Indicator */}
            {isBuffering && !errorMsg && (
                <div style={{
                    position: 'absolute',
                    zIndex: 25,
                    pointerEvents: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.8rem'
                }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        border: '3.5px solid rgba(255,255,255,0.15)',
                        borderTopColor: 'var(--theme-accent, #00bcd4)',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite'
                    }} />
                    <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: '600' }}>
                        Buffering...
                    </span>
                    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                </div>
            )}

            {/* Top Bar (Title & Mode Badge) */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                padding: '1.25rem 1.75rem',
                background: 'linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                zIndex: 30,
                opacity: showControls ? 1 : 0,
                pointerEvents: showControls ? 'auto' : 'none',
                transition: 'opacity 0.25s ease'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{
                        background: 'rgba(var(--theme-accent-rgb, 0, 188, 212), 0.18)',
                        color: 'var(--theme-accent, #00bcd4)',
                        border: '1px solid rgba(var(--theme-accent-rgb, 0, 188, 212), 0.35)',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: '800',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em'
                    }}>
                        Direct HLS
                    </span>
                    <span style={{ color: '#fff', fontSize: '0.95rem', fontWeight: '600', textShadow: '0 2px 6px rgba(0,0,0,0.8)' }}>
                        {title || 'Direct Stream Playback'}
                    </span>
                </div>
            </div>

            {/* Smart Skip Interval Overlay (Intro / Recap / Credits) */}
            {activeSkipPrompt && (
                <div style={{
                    position: 'absolute',
                    bottom: showControls ? '5.5rem' : '2.5rem',
                    right: '1.75rem',
                    zIndex: 35,
                    transition: 'bottom 0.2s ease'
                }}>
                    <button
                        onClick={handleSkipIntro}
                        style={{
                            background: 'rgba(8, 12, 19, 0.92)',
                            backdropFilter: 'blur(16px)',
                            border: '1.5px solid var(--theme-accent, #00bcd4)',
                            color: '#fff',
                            borderRadius: '999px',
                            padding: '0.65rem 1.4rem',
                            fontSize: '0.86rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.55rem',
                            boxShadow: '0 8px 30px rgba(0,0,0,0.7), 0 0 15px rgba(var(--theme-accent-rgb, 0, 188, 212), 0.35)',
                            transition: 'transform 0.15s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        <SkipForward size={16} fill="var(--theme-accent, #00bcd4)" color="var(--theme-accent, #00bcd4)" />
                        {activeSkipPrompt.title}
                    </button>
                </div>
            )}

            {/* Bottom Controls Bar */}
            <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '2rem 1.5rem 1.25rem',
                background: 'linear-gradient(0deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.65) 65%, rgba(0,0,0,0) 100%)',
                zIndex: 30,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem',
                opacity: showControls ? 1 : 0,
                pointerEvents: showControls ? 'auto' : 'none',
                transition: 'opacity 0.25s ease'
            }}>
                {/* Scrubber / Progress Bar */}
                <div
                    style={{
                        position: 'relative',
                        width: '100%',
                        height: '6px',
                        background: 'rgba(255, 255, 255, 0.2)',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                    onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const clickPos = (e.clientX - rect.left) / rect.width;
                        handleSeek(clickPos * duration);
                    }}
                >
                    {/* Buffered bar */}
                    <div style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: `${duration ? (bufferedEnd / duration) * 100 : 0}%`,
                        background: 'rgba(255, 255, 255, 0.35)',
                        borderRadius: '4px'
                    }} />

                    {/* Played bar */}
                    <div style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: `${duration ? (currentTime / duration) * 100 : 0}%`,
                        background: 'var(--theme-accent, #00bcd4)',
                        borderRadius: '4px',
                        boxShadow: '0 0 10px rgba(var(--theme-accent-rgb, 0, 188, 212), 0.6)'
                    }}>
                        <div style={{
                            position: 'absolute',
                            right: '-6px',
                            top: '-3px',
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            background: '#fff',
                            boxShadow: '0 0 6px rgba(0,0,0,0.6)'
                        }} />
                    </div>
                </div>

                {/* Controls Row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#fff' }}>
                    {/* Left: Playback & Volume */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <button
                            onClick={togglePlay}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#fff',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                padding: '4px'
                            }}
                            title={isPlaying ? 'Pause' : 'Play'}
                        >
                            {isPlaying ? <Pause size={20} fill="#fff" /> : <Play size={20} fill="#fff" />}
                        </button>

                        <button
                            onClick={() => handleSeek(currentTime - 10)}
                            style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px' }}
                            title="Rewind 10s"
                        >
                            <RotateCcw size={17} />
                        </button>

                        <button
                            onClick={() => handleSeek(currentTime + 10)}
                            style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px' }}
                            title="Forward 10s"
                        >
                            <RotateCw size={17} />
                        </button>

                        {/* Volume group */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginLeft: '0.5rem' }}>
                            <button
                                onClick={toggleMute}
                                style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px' }}
                            >
                                {isMuted || volume === 0 ? <VolumeX size={18} /> : volume < 0.5 ? <Volume1 size={18} /> : <Volume2 size={18} />}
                            </button>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={isMuted ? 0 : volume}
                                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                                style={{
                                    width: '65px',
                                    accentColor: 'var(--theme-accent, #00bcd4)',
                                    cursor: 'pointer'
                                }}
                            />
                        </div>

                        {/* Timestamp */}
                        <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.75)', marginLeft: '0.6rem', fontWeight: '500' }}>
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                    </div>

                    {/* Right: Audio / Subtitles / Quality / Speed / Fullscreen */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', position: 'relative' }}>
                        {/* Audio track selector (if multiple tracks) */}
                        {audioTracks.length > 1 && (
                            <div style={{ position: 'relative' }}>
                                <button
                                    onClick={() => setOpenMenu(openMenu === 'audio' ? null : 'audio')}
                                    title="Audio Track"
                                    style={{
                                        background: openMenu === 'audio' ? 'rgba(255,255,255,0.2)' : 'transparent',
                                        border: 'none',
                                        color: '#fff',
                                        cursor: 'pointer',
                                        padding: '5px',
                                        borderRadius: '6px'
                                    }}
                                >
                                    <Languages size={18} />
                                </button>
                                {openMenu === 'audio' && (
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '2.5rem',
                                        right: 0,
                                        background: 'rgba(15, 20, 30, 0.96)',
                                        backdropFilter: 'blur(20px)',
                                        border: '1px solid rgba(255,255,255,0.15)',
                                        borderRadius: '10px',
                                        padding: '0.5rem',
                                        minWidth: '150px',
                                        boxShadow: '0 8px 30px rgba(0,0,0,0.7)'
                                    }}>
                                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', padding: '0.3rem 0.6rem', textTransform: 'uppercase', fontWeight: '700' }}>
                                            Audio
                                        </div>
                                        {audioTracks.map((tr) => (
                                            <button
                                                key={tr.id}
                                                onClick={() => handleAudioSelect(tr.id)}
                                                style={{
                                                    width: '100%',
                                                    textAlign: 'left',
                                                    padding: '0.45rem 0.6rem',
                                                    background: currentAudioTrack === tr.id ? 'rgba(var(--theme-accent-rgb, 0, 188, 212), 0.15)' : 'transparent',
                                                    color: currentAudioTrack === tr.id ? 'var(--theme-accent, #00bcd4)' : '#fff',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    fontSize: '0.8rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between'
                                                }}
                                            >
                                                <span>{tr.name}</span>
                                                {currentAudioTrack === tr.id && <Check size={14} />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Subtitles selector */}
                        {(subtitleTracks.length > 0 || externalSubtitles.length > 0) && (
                            <div style={{ position: 'relative' }}>
                                <button
                                    onClick={() => setOpenMenu(openMenu === 'subtitles' ? null : 'subtitles')}
                                    title="Subtitles"
                                    style={{
                                        background: openMenu === 'subtitles' ? 'rgba(255,255,255,0.2)' : 'transparent',
                                        border: 'none',
                                        color: currentSubtitleTrack !== -1 ? 'var(--theme-accent, #00bcd4)' : '#fff',
                                        cursor: 'pointer',
                                        padding: '5px',
                                        borderRadius: '6px'
                                    }}
                                >
                                    <Subtitles size={18} />
                                </button>
                                {openMenu === 'subtitles' && (
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '2.5rem',
                                        right: 0,
                                        background: 'rgba(15, 20, 30, 0.96)',
                                        backdropFilter: 'blur(20px)',
                                        border: '1px solid rgba(255,255,255,0.15)',
                                        borderRadius: '10px',
                                        padding: '0.5rem',
                                        minWidth: '150px',
                                        boxShadow: '0 8px 30px rgba(0,0,0,0.7)'
                                    }}>
                                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', padding: '0.3rem 0.6rem', textTransform: 'uppercase', fontWeight: '700' }}>
                                            Subtitles
                                        </div>
                                        <button
                                            onClick={() => handleSubtitleSelect(-1)}
                                            style={{
                                                width: '100%',
                                                textAlign: 'left',
                                                padding: '0.45rem 0.6rem',
                                                background: currentSubtitleTrack === -1 ? 'rgba(var(--theme-accent-rgb, 0, 188, 212), 0.15)' : 'transparent',
                                                color: currentSubtitleTrack === -1 ? 'var(--theme-accent, #00bcd4)' : '#fff',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: '0.8rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between'
                                            }}
                                        >
                                            <span>Off</span>
                                            {currentSubtitleTrack === -1 && <Check size={14} />}
                                        </button>
                                        {subtitleTracks.map((tr) => (
                                            <button
                                                key={tr.id}
                                                onClick={() => handleSubtitleSelect(tr.id)}
                                                style={{
                                                    width: '100%',
                                                    textAlign: 'left',
                                                    padding: '0.45rem 0.6rem',
                                                    background: currentSubtitleTrack === tr.id ? 'rgba(var(--theme-accent-rgb, 0, 188, 212), 0.15)' : 'transparent',
                                                    color: currentSubtitleTrack === tr.id ? 'var(--theme-accent, #00bcd4)' : '#fff',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    fontSize: '0.8rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between'
                                                }}
                                            >
                                                <span>{tr.name}</span>
                                                {currentSubtitleTrack === tr.id && <Check size={14} />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Quality selector */}
                        {qualities.length > 0 && (
                            <div style={{ position: 'relative' }}>
                                <button
                                    onClick={() => setOpenMenu(openMenu === 'quality' ? null : 'quality')}
                                    title="Quality"
                                    style={{
                                        background: openMenu === 'quality' ? 'rgba(255,255,255,0.2)' : 'transparent',
                                        border: 'none',
                                        color: '#fff',
                                        cursor: 'pointer',
                                        padding: '0.2rem 0.5rem',
                                        borderRadius: '6px',
                                        fontSize: '0.76rem',
                                        fontWeight: '700'
                                    }}
                                >
                                    {currentQuality === -1 ? 'AUTO' : qualities[currentQuality]?.label || 'HD'}
                                </button>
                                {openMenu === 'quality' && (
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '2.5rem',
                                        right: 0,
                                        background: 'rgba(15, 20, 30, 0.96)',
                                        backdropFilter: 'blur(20px)',
                                        border: '1px solid rgba(255,255,255,0.15)',
                                        borderRadius: '10px',
                                        padding: '0.5rem',
                                        minWidth: '140px',
                                        boxShadow: '0 8px 30px rgba(0,0,0,0.7)'
                                    }}>
                                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', padding: '0.3rem 0.6rem', textTransform: 'uppercase', fontWeight: '700' }}>
                                            Quality
                                        </div>
                                        <button
                                            onClick={() => handleQualitySelect(-1)}
                                            style={{
                                                width: '100%',
                                                textAlign: 'left',
                                                padding: '0.45rem 0.6rem',
                                                background: currentQuality === -1 ? 'rgba(var(--theme-accent-rgb, 0, 188, 212), 0.15)' : 'transparent',
                                                color: currentQuality === -1 ? 'var(--theme-accent, #00bcd4)' : '#fff',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: '0.8rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between'
                                            }}
                                        >
                                            <span>Auto</span>
                                            {currentQuality === -1 && <Check size={14} />}
                                        </button>
                                        {qualities.map((q) => (
                                            <button
                                                key={q.id}
                                                onClick={() => handleQualitySelect(q.id)}
                                                style={{
                                                    width: '100%',
                                                    textAlign: 'left',
                                                    padding: '0.45rem 0.6rem',
                                                    background: currentQuality === q.id ? 'rgba(var(--theme-accent-rgb, 0, 188, 212), 0.15)' : 'transparent',
                                                    color: currentQuality === q.id ? 'var(--theme-accent, #00bcd4)' : '#fff',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    fontSize: '0.8rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between'
                                                }}
                                            >
                                                <span>{q.label}</span>
                                                {currentQuality === q.id && <Check size={14} />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Speed settings menu */}
                        <div style={{ position: 'relative' }}>
                            <button
                                onClick={() => setOpenMenu(openMenu === 'speed' ? null : 'speed')}
                                title="Speed"
                                style={{
                                    background: openMenu === 'speed' ? 'rgba(255,255,255,0.2)' : 'transparent',
                                    border: 'none',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    padding: '5px',
                                    borderRadius: '6px'
                                }}
                            >
                                <Settings size={18} />
                            </button>
                            {openMenu === 'speed' && (
                                <div style={{
                                    position: 'absolute',
                                    bottom: '2.5rem',
                                    right: 0,
                                    background: 'rgba(15, 20, 30, 0.96)',
                                    backdropFilter: 'blur(20px)',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                    borderRadius: '10px',
                                    padding: '0.5rem',
                                    minWidth: '130px',
                                    boxShadow: '0 8px 30px rgba(0,0,0,0.7)'
                                }}>
                                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', padding: '0.3rem 0.6rem', textTransform: 'uppercase', fontWeight: '700' }}>
                                        Speed
                                    </div>
                                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => handleSpeedChange(s)}
                                            style={{
                                                width: '100%',
                                                textAlign: 'left',
                                                padding: '0.45rem 0.6rem',
                                                background: playbackRate === s ? 'rgba(var(--theme-accent-rgb, 0, 188, 212), 0.15)' : 'transparent',
                                                color: playbackRate === s ? 'var(--theme-accent, #00bcd4)' : '#fff',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: '0.8rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between'
                                            }}
                                        >
                                            <span>{s === 1 ? 'Normal' : `${s}x`}</span>
                                            {playbackRate === s && <Check size={14} />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Fullscreen toggle */}
                        <button
                            onClick={toggleFullscreen}
                            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#fff',
                                cursor: 'pointer',
                                padding: '5px'
                            }}
                        >
                            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DirectStreamPlayer;
