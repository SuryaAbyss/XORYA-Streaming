import React, { useState, useMemo } from 'react';
import '@videojs/react/video/skin.css';
import { VideoPlayer, VideoSkin, Video } from '@videojs/react/video';
import { DashVideo } from '@videojs/react/media/dash-video';
import { RefreshCw, Play, Tv } from 'lucide-react';

/**
 * Modern Video.js v10 React Player
 * Built with composable primitives, native DashVideo for DASH manifests, VideoSkin, and instant VLC fallback.
 */
const VjsStreamPlayer = ({ src, poster, title, onOpenVlc, style }) => {
    const [hasError, setHasError] = useState(false);
    const [retryKey, setRetryKey] = useState(0);

    const isDash = useMemo(() => {
        return Boolean(src && (src.includes('.mpd') || src.includes('/dash/')));
    }, [src]);

    if (!src) return null;

    const handleRetry = () => {
        setHasError(false);
        setRetryKey(prev => prev + 1);
    };

    return (
        <div 
            className="vjs-xorya-container" 
            style={{ 
                width: '100%', 
                height: '100%', 
                position: 'relative', 
                background: '#000000',
                borderRadius: '16px',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                ...style 
            }}
        >
            {hasError ? (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '1.2rem',
                    padding: '2.5rem 1.5rem',
                    textAlign: 'center',
                    background: 'radial-gradient(circle at center, rgba(30, 20, 25, 0.96) 0%, rgba(8, 10, 16, 0.99) 100%)',
                    width: '100%',
                    height: '100%',
                    color: '#fff',
                    zIndex: 20
                }}>
                    <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        background: 'rgba(234, 88, 12, 0.15)',
                        border: '1px solid rgba(234, 88, 12, 0.35)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fb923c'
                    }}>
                        <Tv size={28} />
                    </div>
                    <div>
                        <div style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.4rem', color: '#fff' }}>
                            Hardware Acceleration Recommended
                        </div>
                        <div style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.7)', maxWidth: '460px', lineHeight: '1.45' }}>
                            This 1080p HEVC stream requires heavy hardware decoding. Desktop VLC plays this stream flawlessly with direct GPU acceleration.
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.9rem', marginTop: '0.4rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                        {onOpenVlc && (
                            <button
                                onClick={onOpenVlc}
                                style={{
                                    background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                                    border: 'none',
                                    color: '#fff',
                                    padding: '0.7rem 1.5rem',
                                    borderRadius: '30px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    fontSize: '0.88rem',
                                    fontWeight: '700',
                                    boxShadow: '0 4px 16px rgba(234, 88, 12, 0.4)'
                                }}
                            >
                                <Play size={16} fill="#fff" /> Play in Desktop VLC
                            </button>
                        )}
                        <button
                            onClick={handleRetry}
                            style={{
                                background: 'rgba(255,255,255,0.08)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                color: '#fff',
                                padding: '0.7rem 1.3rem',
                                borderRadius: '30px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontSize: '0.84rem',
                                fontWeight: '600'
                            }}
                        >
                            <RefreshCw size={14} /> Retry In-Browser
                        </button>
                    </div>
                </div>
            ) : (
                <VideoPlayer key={retryKey} style={{ width: '100%', height: '100%', display: 'flex' }}>
                    <VideoSkin
                        style={{
                            width: '100%',
                            height: '100%',
                            '--media-accent-color': 'var(--theme-accent, #ff7a00)',
                            '--media-accent-text-color': '#000000',
                            '--media-border-radius': '16px',
                            '--media-object-fit': 'contain'
                        }}
                    >
                        {isDash ? (
                            <DashVideo
                                src={src}
                                autoPlay
                                playsInline
                                poster={poster}
                                onError={(e) => {
                                    console.warn('[DashVideo Stream Error]', e);
                                    setHasError(true);
                                }}
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            />
                        ) : (
                            <Video
                                src={`${src}${src.includes('?') ? '&' : '?'}r=${retryKey}`}
                                autoPlay
                                playsInline
                                poster={poster}
                                onError={(e) => {
                                    console.warn('[Video.js Stream Error]', e);
                                    setHasError(true);
                                }}
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            />
                        )}
                    </VideoSkin>
                </VideoPlayer>
            )}
        </div>
    );
};

export default VjsStreamPlayer;
