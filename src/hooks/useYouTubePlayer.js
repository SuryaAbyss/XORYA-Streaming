import { useEffect, useRef, useState, useCallback } from 'react';

// Detect iOS (Safari AND Chrome on iPhone/iPad both use WebKit engine)
// YouTube IFrame API cannot autoplay on iOS even when muted — it hangs indefinitely
const isIOS = typeof navigator !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

// Global flag to ensure the YouTube IFrame API script is only loaded once
let ytApiLoaded = false;
let ytApiLoadingPromise = null;

export function loadYouTubeAPI() {
    if (ytApiLoaded && window.YT && window.YT.Player) {
        return Promise.resolve();
    }
    if (ytApiLoadingPromise) {
        return ytApiLoadingPromise;
    }

    ytApiLoadingPromise = new Promise((resolve) => {
        // If already loaded by another means
        if (window.YT && window.YT.Player) {
            ytApiLoaded = true;
            resolve();
            return;
        }

        const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
        if (existingScript) {
            // Script tag exists but API isn't ready yet, wait for it
            const prevOnReady = window.onYouTubeIframeAPIReady;
            window.onYouTubeIframeAPIReady = () => {
                ytApiLoaded = true;
                if (prevOnReady) prevOnReady();
                resolve();
            };
            return;
        }

        window.onYouTubeIframeAPIReady = () => {
            ytApiLoaded = true;
            resolve();
        };

        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
    });

    return ytApiLoadingPromise;
}

// Quality preference order (highest first)
const QUALITY_LEVELS = ['highres', 'hd2160', 'hd1440', 'hd1080', 'hd720', 'large', 'medium', 'small', 'tiny'];

function getHighestQuality(availableLevels) {
    if (!availableLevels || availableLevels.length === 0) return null;
    for (const q of QUALITY_LEVELS) {
        if (availableLevels.includes(q)) return q;
    }
    return availableLevels[0];
}

/**
 * useYouTubePlayer – manages a YouTube IFrame Player API instance.
 *
 * @param {string|null} videoKey - YouTube video ID
 * @param {React.RefObject} containerRef - ref to the DOM div that will host the player
 * @param {object} options
 * @param {boolean} options.active - whether the player should be created/playing
 * @param {function} options.onReady - callback when player is ready
 * @param {function} options.onEnd - callback when video ends
 * @param {function} options.onPlaying - callback when video starts playing
 * @param {boolean} options.loop - whether to loop the video (default true)
 * @param {number} options.width - player width (default 1920)
 * @param {number} options.height - player height (default 1080)
 */
export default function useYouTubePlayer(videoKey, containerRef, options = {}) {
    const {
        active = true,
        onReady,
        onEnd,
        onPlaying,
        loop = true,
        width = 1920,
        height = 1080,
        delayPlay = 0,
    } = options;

    const playerRef = useRef(null);
    const qualityIntervalRef = useRef(null);
    const recheckTimeoutRef = useRef(null);
    const [isMuted, setIsMuted] = useState(false);
    const [playerReady, setPlayerReady] = useState(false);

    // Force highest available quality — called once play begins
    const forceHighestQuality = useCallback(() => {
        if (!playerRef.current) return;
        try {
            const available = playerRef.current.getAvailableQualityLevels?.();
            const best = getHighestQuality(available);
            if (best) {
                playerRef.current.setPlaybackQuality(best);
            }
        } catch (e) {
            // ignore
        }
    }, []);

    // Toggle mute
    const toggleMute = useCallback(() => {
        if (!playerRef.current) return;
        try {
            if (isMuted) {
                playerRef.current.unMute();
                setIsMuted(false);
            } else {
                playerRef.current.mute();
                setIsMuted(true);
            }
        } catch (e) {
            // ignore
        }
    }, [isMuted]);

    // On iOS: YouTube IFrame API cannot autoplay even when muted — skip entirely to prevent freezing/crashing
    useEffect(() => {
        if (isIOS) return; // No-op on iOS — all safe defaults already set above

        if (!videoKey || !containerRef.current || !active) {
            return;
        }

        let destroyed = false;

        const initPlayer = async () => {
            await loadYouTubeAPI();

            if (destroyed || !containerRef.current) return;

            // Create a target div inside the container for the player with full 100% fluid styling
            const targetDiv = document.createElement('div');
            targetDiv.id = `yt-player-${videoKey}-${Date.now()}`;
            targetDiv.className = 'yt-player-target';
            targetDiv.style.width = '100%';
            targetDiv.style.height = '100%';
            targetDiv.style.position = 'absolute';
            targetDiv.style.top = '0';
            targetDiv.style.left = '0';
            containerRef.current.innerHTML = '';
            containerRef.current.appendChild(targetDiv);

            playerRef.current = new window.YT.Player(targetDiv.id, {
                width: '100%',
                height: '100%',
                host: 'https://www.youtube-nocookie.com',
                playerVars: {
                    autoplay: 1,
                    mute: 1,
                    controls: 0,
                    modestbranding: 1,
                    rel: 0,
                    iv_load_policy: 3,
                    disablekb: 1,
                    fs: 0,
                    playsinline: 1,
                    cc_load_policy: 0,
                    enablejsapi: 1,
                    origin: window.location.origin,
                },
                events: {
                    onReady: (event) => {
                        if (destroyed) return;
                        setPlayerReady(true);
                        setIsMuted(true);

                        // Force iframe element to be 100% fluid and responsive
                        const iframeEl = event.target?.getIframe?.() || document.getElementById(targetDiv.id);
                        if (iframeEl) {
                            iframeEl.style.width = '100%';
                            iframeEl.style.height = '100%';
                            iframeEl.style.position = 'absolute';
                            iframeEl.style.top = '0';
                            iframeEl.style.left = '0';
                        }

                        if (delayPlay > 0) {
                            setTimeout(() => {
                                if (destroyed) return;
                                event.target.loadVideoById({
                                    videoId: videoKey,
                                    suggestedQuality: 'hd1080',
                                });
                            }, delayPlay);
                        } else {
                            event.target.loadVideoById({
                                videoId: videoKey,
                                suggestedQuality: 'hd1080',
                            });
                        }

                        if (onReady) onReady(event);
                    },
                    onPlaybackQualityChange: (event) => {
                        if (destroyed) return;
                        const quality = event.data;
                        if (quality === 'hd1080' || quality === 'hd720' || quality === 'hd2160' || quality === 'highres') {
                            if (options.onQualityHD) {
                                options.onQualityHD(quality);
                            }
                        }
                    },
                    onStateChange: (event) => {
                        if (destroyed) return;

                        // YT.PlayerState.PLAYING === 1
                        if (event.data === 1) {
                            forceHighestQuality();
                            if (onPlaying) onPlaying(event);
                        }

                        // YT.PlayerState.ENDED === 0
                        if (event.data === 0) {
                            if (loop) {
                                try {
                                    playerRef.current.seekTo(0, true);
                                    playerRef.current.playVideo();
                                } catch (e) {
                                    // ignore
                                }
                            }
                            if (onEnd) onEnd(event);
                        }
                    }
                },
            });
        };

        initPlayer();

        return () => {
            destroyed = true;
            setPlayerReady(false);

            if (recheckTimeoutRef.current) {
                clearTimeout(recheckTimeoutRef.current);
                recheckTimeoutRef.current = null;
            }
            if (qualityIntervalRef.current) {
                clearInterval(qualityIntervalRef.current);
                qualityIntervalRef.current = null;
            }
            if (playerRef.current) {
                try {
                    playerRef.current.destroy();
                } catch (e) {
                    // ignore
                }
                playerRef.current = null;
            }
            // Clean up the container
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
        };
    }, [videoKey, active, loop, width, height, forceHighestQuality, onReady, onEnd, onPlaying]);

    return {
        isMuted,
        toggleMute,
        playerReady,
        player: playerRef,
        forceHighestQuality,
    };
}
