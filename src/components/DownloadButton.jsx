import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, X, Server, ExternalLink, Zap, MonitorPlay } from 'lucide-react';
import { Button } from './ui/flow-hover-button';

/**
 * Download button — opens a premium glassmorphic modal with multiple download options.
 * 
 * Props:
 * - tmdbId: TMDB ID of the content
 * - type: 'movie' or 'tv'
 * - season: season number (for tv)
 * - episode: episode number (for tv)
 * - onDownload: callback to trigger Rive's in-player download (switches active server)
 */
const DownloadButton = ({ tmdbId, type, season, episode, onDownload }) => {
    const [isOpen, setIsOpen] = useState(false);

    const sVal = season || 1;
    const eVal = episode || 1;

    // Build URLs based on type
    const vidVaultUrl = type === 'tv'
        ? `https://vidvault.ru/tv/${tmdbId}/${sVal}/${eVal}`
        : `https://vidvault.ru/movie/${tmdbId}`;

    const mediaTvUrl = type === 'tv'
        ? `https://mediatv.trendingpie.com/?id=${tmdbId}&s=${sVal}&e=${eVal}`
        : `https://media.trendingpie.com/?id=${tmdbId}`;

    const handleOptionSelect = (option) => {
        if (option === 'rive') {
            if (onDownload) onDownload();
        } else if (option === 'vidvault') {
            window.open(vidVaultUrl, '_blank', 'noopener,noreferrer');
        } else if (option === 'mediatv') {
            window.open(mediaTvUrl, '_blank', 'noopener,noreferrer');
        }
        setIsOpen(false);
    };

    const renderModal = () => {
        if (!isOpen) return null;

        const modalContent = (
            <div
                className="download-modal-overlay"
                onClick={() => setIsOpen(false)}
                style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(5, 5, 5, 0.85)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    zIndex: 999999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem',
                }}
            >
                <style>{`
                    @keyframes downloadFadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    @keyframes downloadSlideUp {
                        from { opacity: 0; transform: translateY(20px) scale(0.95); }
                        to { opacity: 1; transform: translateY(0) scale(1); }
                    }
                    .download-modal-overlay {
                        animation: downloadFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    }
                    .download-modal-content {
                        animation: downloadSlideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                    }
                    .download-card {
                        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
                    }
                    .download-card:hover {
                        background: rgba(255, 255, 255, 0.08) !important;
                        border-color: rgba(0, 188, 212, 0.4) !important;
                        transform: translateY(-2px);
                        box-shadow: 0 8px 30px rgba(0, 188, 212, 0.15);
                    }
                    .download-close-btn {
                        transition: all 0.2s ease !important;
                    }
                    .download-close-btn:hover {
                        background: rgba(255, 255, 255, 0.1) !important;
                        color: #00bcd4 !important;
                        transform: rotate(90deg);
                    }
                `}</style>

                <div
                    className="download-modal-content"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        backgroundColor: 'rgba(20, 20, 25, 0.75)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '24px',
                        padding: '2rem',
                        width: '100%',
                        maxWidth: '520px',
                        boxShadow: '0 24px 64px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
                        color: 'white',
                        position: 'relative',
                        backdropFilter: 'blur(40px)',
                        WebkitBackdropFilter: 'blur(40px)',
                        boxSizing: 'border-box',
                    }}
                >
                    {/* Close Button */}
                    <button
                        onClick={() => setIsOpen(false)}
                        className="download-close-btn"
                        style={{
                            position: 'absolute',
                            top: '1.25rem',
                            right: '1.25rem',
                            background: 'transparent',
                            border: 'none',
                            color: 'rgba(255, 255, 255, 0.6)',
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            outline: 'none',
                        }}
                    >
                        <X size={20} />
                    </button>

                    {/* Header */}
                    <div style={{ marginBottom: '1.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                            <Download size={22} style={{ color: '#00bcd4' }} />
                            <h2 style={{ fontSize: '1.35rem', fontWeight: '700', margin: 0, letterSpacing: '0.3px' }}>
                                Download Options
                            </h2>
                        </div>
                        <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.88rem', margin: 0 }}>
                            Select one of the servers below to download the content:
                            {type === 'tv' && (
                                <span style={{ color: '#00bcd4', fontWeight: '600', marginLeft: '0.3rem' }}>
                                    (Season {sVal}, Episode {eVal})
                                </span>
                            )}
                        </p>
                    </div>

                    {/* Option List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {/* Server 1 - MediaTV */}
                        <div
                            className="download-card"
                            onClick={() => handleOptionSelect('mediatv')}
                            style={{
                                background: 'rgba(255, 255, 255, 0.03)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '16px',
                                padding: '1.2rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                cursor: 'pointer',
                            }}
                        >
                            <div style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: '12px',
                                background: 'rgba(16, 185, 129, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#10b981',
                                flexShrink: 0,
                            }}>
                                <Server size={20} />
                            </div>
                            <div style={{ flexGrow: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <h3 style={{ fontSize: '0.95rem', fontWeight: '600', margin: 0 }}>MediaTV (Server 1)</h3>
                                    <span style={{
                                        fontSize: '0.68rem',
                                        background: 'rgba(16, 185, 129, 0.15)',
                                        color: '#10b981',
                                        padding: '0.15rem 0.5rem',
                                        borderRadius: '20px',
                                        fontWeight: '600',
                                    }}>
                                        EXTERNAL
                                    </span>
                                </div>
                                <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.78rem', margin: '0.2rem 0 0' }}>
                                    Direct stream & download on MediaTV
                                </p>
                            </div>
                            <ExternalLink size={16} style={{ color: 'rgba(255, 255, 255, 0.3)', flexShrink: 0 }} />
                        </div>

                        {/* Server 2 - Rive */}
                        <div
                            className="download-card"
                            onClick={() => handleOptionSelect('rive')}
                            style={{
                                background: 'rgba(255, 255, 255, 0.03)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '16px',
                                padding: '1.2rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                cursor: 'pointer',
                                position: 'relative',
                            }}
                        >
                            <div style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: '12px',
                                background: 'rgba(0, 188, 212, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#00bcd4',
                                flexShrink: 0,
                            }}>
                                <MonitorPlay size={20} />
                            </div>
                            <div style={{ flexGrow: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <h3 style={{ fontSize: '0.95rem', fontWeight: '600', margin: 0 }}>Rive (Server 2)</h3>
                                    <span style={{
                                        fontSize: '0.68rem',
                                        background: 'rgba(0, 188, 212, 0.15)',
                                        color: '#00bcd4',
                                        padding: '0.15rem 0.5rem',
                                        borderRadius: '20px',
                                        fontWeight: '600',
                                    }}>
                                        IN-PLAYER
                                    </span>
                                </div>
                                <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.78rem', margin: '0.2rem 0 0' }}>
                                    Load download client directly inside player
                                </p>
                            </div>
                        </div>

                        {/* Server 3 - VidVault */}
                        <div
                            className="download-card"
                            onClick={() => handleOptionSelect('vidvault')}
                            style={{
                                background: 'rgba(255, 255, 255, 0.03)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '16px',
                                padding: '1.2rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                cursor: 'pointer',
                            }}
                        >
                            <div style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: '12px',
                                background: 'rgba(239, 68, 68, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#ef4444',
                                flexShrink: 0,
                            }}>
                                <Zap size={20} />
                            </div>
                            <div style={{ flexGrow: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <h3 style={{ fontSize: '0.95rem', fontWeight: '600', margin: 0 }}>VidVault (Server 3)</h3>
                                    <span style={{
                                        fontSize: '0.68rem',
                                        background: 'rgba(239, 68, 68, 0.15)',
                                        color: '#ef4444',
                                        padding: '0.15rem 0.5rem',
                                        borderRadius: '20px',
                                        fontWeight: '600',
                                    }}>
                                        EXTERNAL
                                    </span>
                                </div>
                                <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.78rem', margin: '0.2rem 0 0' }}>
                                    Fast download links on VidVault website
                                </p>
                            </div>
                            <ExternalLink size={16} style={{ color: 'rgba(255, 255, 255, 0.3)', flexShrink: 0 }} />
                        </div>
                    </div>
                </div>
            </div>
        );

        return createPortal(modalContent, document.body);
    };

    return (
        <>
            <Button
                id="xorya-download-btn"
                onClick={() => setIsOpen(true)}
                icon={<Download size={16} />}
            >
                Download
            </Button>
            {renderModal()}
        </>
    );
};

export default DownloadButton;
