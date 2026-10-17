import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Languages,
    FileText,
    ExternalLink,
    Search,
    RotateCcw,
    X,
    Download,
    Sparkles,
    Film,
    Tv,
    Info,
    Check
} from 'lucide-react';

const SubtitleDownloadModal = ({
    isOpen,
    onClose,
    contentData,
    type = 'movie',
    season = 1,
    episode = 1
}) => {
    const title = contentData?.title || contentData?.name || '';
    const year = new Date(contentData?.release_date || contentData?.first_air_date || Date.now()).getFullYear();

    // Build the default search query
    const getDefaultQuery = () => {
        if (!title) return '';
        if (type === 'tv') {
            const sFormatted = String(season).padStart(2, '0');
            const eFormatted = String(episode).padStart(2, '0');
            return `${title} S${sFormatted}E${eFormatted}`;
        }
        return `${title} ${year || ''}`.trim();
    };

    const [searchQuery, setSearchQuery] = useState(getDefaultQuery());
    const [activeUrl, setActiveUrl] = useState('');
    const [iframeLoading, setIframeLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const iframeRef = useRef(null);

    // Update default query when contentData or season/episode changes
    useEffect(() => {
        const query = getDefaultQuery();
        setSearchQuery(query);
        setActiveUrl(`https://www.subtitlecat.com/index.php?search=${encodeURIComponent(query)}`);
        setIframeLoading(true);
    }, [contentData?.id, title, type, season, episode, isOpen]);

    // Handle Escape key to close
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen || !contentData) return null;

    const handleSearchSubmit = (e) => {
        if (e) e.preventDefault();
        const trimmed = searchQuery.trim();
        if (!trimmed) return;
        setIframeLoading(true);
        setActiveUrl(`https://www.subtitlecat.com/index.php?search=${encodeURIComponent(trimmed)}`);
    };

    const handleReload = () => {
        setIframeLoading(true);
        if (iframeRef.current) {
            iframeRef.current.src = activeUrl;
        }
    };

    const handleOpenExternal = () => {
        window.open(activeUrl, '_blank', 'noopener,noreferrer');
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(activeUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <AnimatePresence>
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.76)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    zIndex: 10030,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem',
                    boxSizing: 'border-box'
                }}
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.93, y: 18 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.93, y: 18 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        width: '100%',
                        maxWidth: '1050px',
                        height: '88vh',
                        maxHeight: '940px',
                        background: 'linear-gradient(135deg, rgba(18, 20, 26, 0.94) 0%, rgba(10, 11, 15, 0.97) 100%)',
                        border: '1.5px solid rgba(253, 186, 41, 0.35)',
                        borderRadius: '22px',
                        boxShadow: '0 30px 80px rgba(0, 0, 0, 0.85), 0 0 35px rgba(253, 186, 41, 0.12)',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        position: 'relative'
                    }}
                >
                    {/* Top Bar Header */}
                    <div style={{
                        padding: '1rem 1.4rem',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                        background: 'rgba(255, 255, 255, 0.02)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        flexWrap: 'wrap'
                    }}>
                        {/* Brand & Content Details */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', minWidth: '220px' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, rgba(253, 186, 41, 0.25) 0%, rgba(253, 186, 41, 0.06) 100%)',
                                border: '1px solid rgba(253, 186, 41, 0.45)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fdba29',
                                boxShadow: '0 4px 15px rgba(253, 186, 41, 0.2)',
                                flexShrink: 0
                            }}>
                                <Languages size={20} />
                            </div>

                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.2px' }}>
                                        Subtitle<span style={{ color: '#fdba29' }}>Cat</span>
                                    </h3>
                                    <span style={{
                                        fontSize: '0.62rem',
                                        fontWeight: '800',
                                        background: 'rgba(253, 186, 41, 0.2)',
                                        color: '#fdba29',
                                        padding: '0.12rem 0.45rem',
                                        borderRadius: '6px',
                                        border: '1px solid rgba(253, 186, 41, 0.35)',
                                        letterSpacing: '0.4px'
                                    }}>
                                        100+ LANGUAGES
                                    </span>
                                </div>
                                <p style={{ margin: '0.15rem 0 0', fontSize: '0.76rem', color: 'rgba(255, 255, 255, 0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '320px' }}>
                                    {title} {year ? `(${year})` : ''} {type === 'tv' ? `• S${season} : E${episode}` : ''}
                                </p>
                            </div>
                        </div>

                        {/* Search Input Box */}
                        <form
                            onSubmit={handleSearchSubmit}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                flexGrow: 1,
                                maxWidth: '420px',
                                background: 'rgba(0, 0, 0, 0.5)',
                                border: '1px solid rgba(255, 255, 255, 0.14)',
                                borderRadius: '12px',
                                padding: '0.28rem 0.6rem',
                                transition: 'border-color 0.2s'
                            }}
                            onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(253, 186, 41, 0.6)'}
                            onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.14)'}
                        >
                            <Search size={15} style={{ color: 'rgba(255, 255, 255, 0.45)', flexShrink: 0 }} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search subtitle title or release..."
                                style={{
                                    flexGrow: 1,
                                    background: 'transparent',
                                    border: 'none',
                                    outline: 'none',
                                    color: '#ffffff',
                                    fontSize: '0.82rem',
                                    fontWeight: '500'
                                }}
                            />
                            <button
                                type="submit"
                                style={{
                                    background: '#fdba29',
                                    color: '#000000',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '0.28rem 0.65rem',
                                    fontSize: '0.74rem',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    transition: 'transform 0.15s ease'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.04)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                Search
                            </button>
                        </form>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
                            <button
                                onClick={handleOpenExternal}
                                title="Open directly in SubtitleCat (New Tab)"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                    background: 'rgba(253, 186, 41, 0.15)',
                                    border: '1px solid rgba(253, 186, 41, 0.35)',
                                    color: '#fdba29',
                                    padding: '0.42rem 0.75rem',
                                    borderRadius: '10px',
                                    fontSize: '0.76rem',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(253, 186, 41, 0.25)';
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(253, 186, 41, 0.15)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                <ExternalLink size={14} />
                                <span>Open in New Tab</span>
                            </button>

                            <button
                                onClick={handleReload}
                                title="Refresh page"
                                style={{
                                    width: '34px',
                                    height: '34px',
                                    borderRadius: '10px',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    color: 'rgba(255, 255, 255, 0.75)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                            >
                                <RotateCcw size={15} />
                            </button>

                            <button
                                onClick={onClose}
                                title="Close"
                                style={{
                                    width: '34px',
                                    height: '34px',
                                    borderRadius: '10px',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    color: 'rgba(255, 255, 255, 0.75)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                                    e.currentTarget.style.color = '#ef4444';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.75)';
                                }}
                            >
                                <X size={17} />
                            </button>
                        </div>
                    </div>

                    {/* Quick Tips Sub-Bar */}
                    <div style={{
                        padding: '0.45rem 1.4rem',
                        background: 'rgba(253, 186, 41, 0.06)',
                        borderBottom: '1px solid rgba(253, 186, 41, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.8rem',
                        fontSize: '0.74rem',
                        color: 'rgba(255, 255, 255, 0.75)',
                        flexWrap: 'wrap'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <Info size={14} style={{ color: '#fdba29', flexShrink: 0 }} />
                            <span>
                                Showing live results for <strong style={{ color: '#ffffff' }}>"{searchQuery}"</strong>. Click any release below to select your language and download .SRT files.
                            </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                            <button
                                onClick={handleCopyLink}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: copied ? '#4ade80' : 'rgba(255, 255, 255, 0.6)',
                                    fontSize: '0.72rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.3rem',
                                    padding: '0'
                                }}
                            >
                                {copied ? <Check size={13} /> : <FileText size={13} />}
                                <span>{copied ? 'Link Copied!' : 'Copy Search Link'}</span>
                            </button>

                            <a
                                href={activeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    color: '#fdba29',
                                    textDecoration: 'none',
                                    fontWeight: '600',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.2rem'
                                }}
                            >
                                Direct Page ↗
                            </a>
                        </div>
                    </div>

                    {/* Live Embedded SubtitleCat Frame Area */}
                    <div style={{ position: 'relative', flexGrow: 1, width: '100%', height: '100%', overflow: 'hidden' }}>
                        {iframeLoading && (
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: 'rgba(12, 14, 18, 0.95)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.8rem',
                                zIndex: 10
                            }}>
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                    style={{
                                        width: '36px',
                                        height: '36px',
                                        borderRadius: '50%',
                                        border: '3px solid rgba(253, 186, 41, 0.2)',
                                        borderTopColor: '#fdba29'
                                    }}
                                />
                                <span style={{ fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.7)', fontWeight: '600' }}>
                                    Loading SubtitleCat for "{searchQuery}"...
                                </span>
                            </div>
                        )}

                        <iframe
                            ref={iframeRef}
                            src={activeUrl}
                            title="SubtitleCat Subtitle Search"
                            onLoad={() => setIframeLoading(false)}
                            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
                            style={{
                                width: '100%',
                                height: '100%',
                                border: 'none',
                                background: '#ffffff',
                                display: 'block'
                            }}
                        />
                    </div>

                    {/* Bottom Status & Fallback Bar */}
                    <div style={{
                        padding: '0.65rem 1.4rem',
                        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                        background: 'rgba(10, 11, 15, 0.98)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '0.6rem'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.74rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                            <span>Tip: Most video players (VLC, MPV, Web) auto-load the subtitle if placed in the same folder.</span>
                        </div>

                        <button
                            onClick={handleOpenExternal}
                            style={{
                                background: 'transparent',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                color: 'rgba(255, 255, 255, 0.85)',
                                padding: '0.25rem 0.65rem',
                                borderRadius: '6px',
                                fontSize: '0.72rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.3rem'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#fdba29'}
                            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'}
                        >
                            <ExternalLink size={12} />
                            <span>Trouble loading? Open SubtitleCat in browser</span>
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default SubtitleDownloadModal;
