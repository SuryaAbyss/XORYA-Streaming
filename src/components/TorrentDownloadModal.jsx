import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, 
    Download, 
    HardDrive, 
    Zap, 
    Check, 
    Copy, 
    Terminal, 
    RefreshCw, 
    ExternalLink, 
    Layers,
    AlertCircle
} from 'lucide-react';
import { searchTorrents, searchTorrentsByQuery, launchTorlinkTerminal, formatBytes } from '../services/torrentService';

const TorrentDownloadModal = ({
    isOpen,
    onClose,
    contentData,
    type = 'movie',
    season = 1,
    episode = 1
}) => {
    const [torrents, setTorrents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [copiedHash, setCopiedHash] = useState(null);
    const [terminalLaunching, setTerminalLaunching] = useState(false);
    const [terminalToast, setTerminalToast] = useState(null);
    const [customQuery, setCustomQuery] = useState('');

    const title = contentData?.title || contentData?.name || '';
    const year = (contentData?.release_date || contentData?.first_air_date || '').slice(0, 4);

    const fetchReleases = async (queryToUse) => {
        const q = queryToUse !== undefined ? queryToUse : customQuery;
        if (!q && !title) return;
        setLoading(true);
        try {
            let results = [];
            if (q) {
                results = await searchTorrentsByQuery(q, type);
                // If specific query with year had 0 results, retry clean title
                if (results.length === 0 && q.includes(year)) {
                    const fallbackQ = q.replace(year, '').trim();
                    if (fallbackQ) {
                        results = await searchTorrentsByQuery(fallbackQ, type);
                    }
                }
            } else {
                results = await searchTorrents({
                    title,
                    year,
                    season,
                    episode,
                    type
                });
            }
            setTorrents(results);
        } catch (err) {
            console.error('Failed to load torrents:', err);
            setTorrents([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            const defaultQ = type === 'tv'
                ? `${title} S${String(season).padStart(2, '0')}E${String(episode).padStart(2, '0')}`
                : (year && Number(year) <= new Date().getFullYear() ? `${title} ${year}` : title);
            setCustomQuery(defaultQ);
            fetchReleases(defaultQ);
        }
    }, [isOpen, title, year, season, episode, type]);

    // Quality groupings
    const filteredTorrents = useMemo(() => {
        if (selectedFilter === 'all') return torrents;
        if (selectedFilter === '4k') return torrents.filter(t => /4k|2160p|uhd/i.test(t.quality || t.name));
        if (selectedFilter === '1080p') return torrents.filter(t => /1080p|fhd/i.test(t.quality || t.name));
        if (selectedFilter === '720p') return torrents.filter(t => /720p|hd/i.test(t.quality || t.name) && !/1080p|2160p/i.test(t.quality || t.name));
        return torrents;
    }, [torrents, selectedFilter]);

    const counts = useMemo(() => {
        return {
            all: torrents.length,
            '4k': torrents.filter(t => /4k|2160p|uhd/i.test(t.quality || t.name)).length,
            '1080p': torrents.filter(t => /1080p|fhd/i.test(t.quality || t.name)).length,
            '720p': torrents.filter(t => /720p|hd/i.test(t.quality || t.name) && !/1080p|2160p/i.test(t.quality || t.name)).length,
        };
    }, [torrents]);

    const [terminalActiveHash, setTerminalActiveHash] = useState(null);

    const handleCopyMagnet = (hash, magnet) => {
        navigator.clipboard.writeText(magnet);
        setCopiedHash(hash);
        setTimeout(() => setCopiedHash(null), 2500);
    };

    const handleOpenMagnet = (magnet) => {
        window.location.href = magnet;
        setTerminalToast('⚡ Attempting to open magnet in your default torrent app. If nothing opens, you may need qBittorrent installed, or you can use "Terminal" below to download directly!');
        setTimeout(() => setTerminalToast(null), 7000);
    };

    const handleDownloadInTerminal = async (torrent) => {
        setTerminalActiveHash(torrent.infoHash);
        try {
            await launchTorlinkTerminal({
                magnet: torrent.magnet,
                title: torrent.name
            });
            setTerminalToast(`🖥️ Terminal download launched for: "${torrent.name.slice(0, 32)}..."`);
            setTimeout(() => setTerminalToast(null), 5000);
        } catch (err) {
            setTerminalToast('⚠️ Could not spawn terminal. Make sure dev server is running.');
            setTimeout(() => setTerminalToast(null), 5000);
        } finally {
            setTerminalActiveHash(null);
        }
    };

    const handleLaunchTerminal = async () => {
        setTerminalLaunching(true);
        const queryTerm = customQuery || (type === 'tv' 
            ? `${title} S${String(season).padStart(2, '0')}E${String(episode).padStart(2, '0')}`
            : `${title} ${year}`);
        
        try {
            await launchTorlinkTerminal({ query: queryTerm });
            setTerminalToast('🖥️ Interactive torlink terminal launched! Search & download live.');
            setTimeout(() => setTerminalToast(null), 5000);
        } catch (err) {
            setTerminalToast('⚠️ Could not spawn terminal. Make sure dev server is running.');
            setTimeout(() => setTerminalToast(null), 5000);
        } finally {
            setTerminalLaunching(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div 
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem',
                    background: 'rgba(0, 0, 0, 0.78)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)'
                }}
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.93, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.93, y: 15 }}
                    transition={{ duration: 0.24, ease: 'easeOut' }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        width: '100%',
                        maxWidth: '720px',
                        maxHeight: '88vh',
                        background: 'linear-gradient(180deg, #131722 0%, #0c0e14 100%)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)'
                    }}
                >
                    {/* Header */}
                    <div style={{
                        padding: '1.25rem 1.5rem',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'rgba(255, 255, 255, 0.02)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, rgba(var(--theme-accent-rgb), 0.25) 0%, rgba(var(--theme-accent-rgb), 0.05) 100%)',
                                border: '1px solid rgba(var(--theme-accent-rgb), 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--theme-accent)',
                                flexShrink: 0
                            }}>
                                <Download size={20} />
                            </div>
                            <div style={{ minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#ffffff', margin: 0 }}>
                                        {title}
                                    </h3>
                                    {type === 'tv' && (
                                        <span style={{
                                            fontSize: '0.7rem',
                                            fontWeight: '700',
                                            background: 'var(--theme-accent)',
                                            color: '#000',
                                            padding: '0.15rem 0.5rem',
                                            borderRadius: '6px'
                                        }}>
                                            S{season} : E{episode}
                                        </span>
                                    )}
                                    {year && (
                                        <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.45)' }}>
                                            ({year})
                                        </span>
                                    )}
                                </div>
                                <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                                    Choose resolution & quality • Real-time sizes & seeders
                                </p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                            <button
                                onClick={fetchReleases}
                                title="Refresh releases"
                                style={{
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    color: 'rgba(255, 255, 255, 0.7)',
                                    padding: '0.45rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                            </button>
                            <button
                                onClick={onClose}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    color: 'rgba(255, 255, 255, 0.7)',
                                    padding: '0.45rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <X size={17} />
                            </button>
                        </div>
                    </div>

                    {/* Interactive Search Query Bar */}
                    <div style={{
                        padding: '0.65rem 1.5rem',
                        background: 'rgba(255, 255, 255, 0.02)',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem'
                    }}>
                        <input
                            type="text"
                            value={customQuery}
                            onChange={(e) => setCustomQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchReleases(customQuery)}
                            placeholder="Search title, year, or episode..."
                            style={{
                                flexGrow: 1,
                                background: 'rgba(0, 0, 0, 0.4)',
                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                color: '#ffffff',
                                borderRadius: '8px',
                                padding: '0.42rem 0.85rem',
                                fontSize: '0.8rem',
                                outline: 'none'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--theme-accent)'}
                            onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)'}
                        />
                        <button
                            onClick={() => fetchReleases(customQuery)}
                            disabled={loading}
                            style={{
                                background: 'var(--theme-accent)',
                                color: '#000000',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '0.42rem 0.95rem',
                                fontSize: '0.78rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                flexShrink: 0
                            }}
                        >
                            {loading ? 'Searching...' : 'Search'}
                        </button>
                    </div>

                    {/* Filter Tabs & Terminal Launch Banner */}
                    <div style={{
                        padding: '0.85rem 1.5rem',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '0.6rem',
                        background: 'rgba(0, 0, 0, 0.2)'
                    }}>
                        {/* Quality Filters */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                            {[
                                { id: 'all', label: 'All', count: counts.all },
                                { id: '4k', label: '4K UHD', count: counts['4k'] },
                                { id: '1080p', label: '1080p', count: counts['1080p'] },
                                { id: '720p', label: '720p', count: counts['720p'] }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setSelectedFilter(tab.id)}
                                    style={{
                                        background: selectedFilter === tab.id 
                                            ? 'rgba(var(--theme-accent-rgb), 0.15)' 
                                            : 'rgba(255, 255, 255, 0.04)',
                                        border: selectedFilter === tab.id 
                                            ? '1px solid var(--theme-accent)' 
                                            : '1px solid rgba(255, 255, 255, 0.08)',
                                        color: selectedFilter === tab.id ? 'var(--theme-accent)' : 'rgba(255, 255, 255, 0.65)',
                                        padding: '0.3rem 0.75rem',
                                        borderRadius: '20px',
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.35rem',
                                        transition: 'all 0.15s ease'
                                    }}
                                >
                                    <span>{tab.label}</span>
                                    <span style={{ 
                                        opacity: 0.65, 
                                        fontSize: '0.68rem',
                                        background: 'rgba(255,255,255,0.08)',
                                        padding: '0.05rem 0.35rem',
                                        borderRadius: '10px'
                                    }}>
                                        {tab.count}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Terminal Launcher Trigger */}
                        <button
                            onClick={handleLaunchTerminal}
                            disabled={terminalLaunching}
                            style={{
                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                color: '#ffffff',
                                padding: '0.35rem 0.8rem',
                                borderRadius: '8px',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.45rem',
                                transition: 'all 0.2s ease'
                            }}
                            title="Spawn an interactive Windows Terminal window with torlink"
                        >
                            <Terminal size={13} style={{ color: 'var(--theme-accent)' }} />
                            <span>{terminalLaunching ? 'Launching...' : 'Open in Terminal (torlink)'}</span>
                        </button>
                    </div>

                    {/* Toast Notification */}
                    {terminalToast && (
                        <div style={{
                            padding: '0.6rem 1.5rem',
                            background: 'rgba(var(--theme-accent-rgb), 0.15)',
                            borderBottom: '1px solid rgba(var(--theme-accent-rgb), 0.3)',
                            color: '#ffffff',
                            fontSize: '0.78rem',
                            fontWeight: '600',
                            textAlign: 'center'
                        }}>
                            {terminalToast}
                        </div>
                    )}

                    {/* Explanation Tip Banner */}
                    <div style={{
                        margin: '0.65rem 1.5rem 0',
                        padding: '0.55rem 0.85rem',
                        background: 'rgba(56, 189, 248, 0.07)',
                        border: '1px solid rgba(56, 189, 248, 0.2)',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        fontSize: '0.74rem',
                        color: 'rgba(255, 255, 255, 0.82)',
                        lineHeight: 1.45
                    }}>
                        <span style={{ fontSize: '1.05rem', flexShrink: 0 }}>💡</span>
                        <span>
                            <strong>Note on "Open Magnet":</strong> Requires a BitTorrent client (like <strong>qBittorrent</strong>) installed on your PC. Don't have one? Click <strong>Terminal</strong> to download directly with live speed & ETA, or <strong>Copy</strong> the magnet link!
                        </span>
                    </div>

                    {/* Torrent Release List Body */}
                    <div style={{
                        flexGrow: 1,
                        overflowY: 'auto',
                        padding: '1rem 1.5rem 1.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem'
                    }}>
                        {loading ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', padding: '1rem 0' }}>
                                {[1, 2, 3, 4].map(i => (
                                    <div 
                                        key={i} 
                                        style={{
                                            height: '68px',
                                            borderRadius: '12px',
                                            background: 'rgba(255, 255, 255, 0.03)',
                                            border: '1px solid rgba(255, 255, 255, 0.05)',
                                            animation: 'pulse 1.5s infinite ease-in-out'
                                        }}
                                    />
                                ))}
                                <p style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.82rem', margin: '0.5rem 0' }}>
                                    Scanning live indexes & calculating swarm seeds...
                                </p>
                            </div>
                        ) : filteredTorrents.length === 0 ? (
                            <div style={{
                                textAlign: 'center',
                                padding: '3rem 1rem',
                                color: 'rgba(255, 255, 255, 0.5)'
                            }}>
                                <AlertCircle size={36} style={{ color: 'rgba(255, 255, 255, 0.25)', margin: '0 auto 0.75rem' }} />
                                <h4 style={{ color: 'white', margin: '0 0 0.4rem', fontSize: '0.95rem' }}>No Releases Found</h4>
                                <p style={{ fontSize: '0.8rem', maxWidth: '380px', margin: '0 auto 1.2rem', lineHeight: 1.5 }}>
                                    Could not find active torrent releases for this query. Try launching the terminal or searching without season/episode tags.
                                </p>
                                <button
                                    onClick={handleLaunchTerminal}
                                    style={{
                                        background: 'var(--theme-accent)',
                                        color: '#000',
                                        border: 'none',
                                        padding: '0.5rem 1.2rem',
                                        borderRadius: '8px',
                                        fontWeight: '700',
                                        fontSize: '0.8rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Search in Terminal (torlink)
                                </button>
                            </div>
                        ) : (
                            filteredTorrents.map((t, idx) => {
                                const is4K = /4k|2160p|uhd/i.test(t.quality || t.name);
                                const is1080 = /1080p/i.test(t.quality || t.name);
                                const isHevc = /x265|hevc|10bit/i.test(t.codec || t.name);
                                const isCopied = copiedHash === t.infoHash;
                                const isTerminalActive = terminalActiveHash === t.infoHash;

                                return (
                                    <div
                                        key={t.id || idx}
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.03)',
                                            border: '1px solid rgba(255, 255, 255, 0.07)',
                                            borderRadius: '12px',
                                            padding: '0.85rem 1.1rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: '1rem',
                                            transition: 'all 0.18s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.055)';
                                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.07)';
                                        }}
                                    >
                                        {/* Left Info */}
                                        <div style={{ minWidth: 0, flexGrow: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                                                {/* Quality Badge */}
                                                <span style={{
                                                    fontSize: '0.68rem',
                                                    fontWeight: '700',
                                                    padding: '0.12rem 0.45rem',
                                                    borderRadius: '6px',
                                                    background: is4K 
                                                        ? 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)' 
                                                        : is1080 
                                                        ? 'rgba(var(--theme-accent-rgb), 0.2)' 
                                                        : 'rgba(255, 255, 255, 0.1)',
                                                    color: is4K ? '#ffffff' : is1080 ? 'var(--theme-accent)' : 'rgba(255, 255, 255, 0.8)',
                                                    border: is1080 ? '1px solid rgba(var(--theme-accent-rgb), 0.35)' : 'none'
                                                }}>
                                                    {t.quality || 'HD'}
                                                </span>

                                                {/* Codec / Format Badge */}
                                                {isHevc && (
                                                    <span style={{
                                                        fontSize: '0.65rem',
                                                        fontWeight: '600',
                                                        padding: '0.1rem 0.4rem',
                                                        borderRadius: '6px',
                                                        background: 'rgba(16, 185, 129, 0.15)',
                                                        color: '#10b981',
                                                        border: '1px solid rgba(16, 185, 129, 0.3)'
                                                    }}>
                                                        HEVC / x265
                                                    </span>
                                                )}

                                                {t.source && (
                                                    <span style={{
                                                        fontSize: '0.65rem',
                                                        color: 'rgba(255, 255, 255, 0.45)',
                                                        background: 'rgba(255, 255, 255, 0.04)',
                                                        padding: '0.1rem 0.35rem',
                                                        borderRadius: '4px'
                                                    }}>
                                                        {t.source}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Release Title */}
                                            <div 
                                                style={{
                                                    fontSize: '0.84rem',
                                                    fontWeight: '600',
                                                    color: '#ffffff',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}
                                                title={t.name}
                                            >
                                                {t.name}
                                            </div>

                                            {/* Size and Seeders */}
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.85rem',
                                                marginTop: '0.3rem',
                                                fontSize: '0.72rem',
                                                color: 'rgba(255, 255, 255, 0.5)'
                                            }}>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: 'rgba(255, 255, 255, 0.8)', fontWeight: '600' }}>
                                                    <HardDrive size={12} style={{ color: 'var(--theme-accent)' }} />
                                                    {formatBytes(t.sizeBytes)}
                                                </span>

                                                <span style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.25rem',
                                                    color: t.seeders >= 50 ? '#10b981' : t.seeders > 5 ? '#f59e0b' : 'rgba(255, 255, 255, 0.4)',
                                                    fontWeight: '600'
                                                }}>
                                                    <Zap size={11} />
                                                    {t.seeders.toLocaleString()} seeds
                                                </span>
                                            </div>
                                        </div>

                                        {/* Right Action Buttons */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
                                            {/* Copy Magnet Link */}
                                            <button
                                                onClick={() => handleCopyMagnet(t.infoHash, t.magnet)}
                                                title="Copy Magnet Link"
                                                style={{
                                                    background: isCopied ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                                                    border: isCopied ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.1)',
                                                    color: isCopied ? '#10b981' : 'rgba(255, 255, 255, 0.75)',
                                                    padding: '0.45rem 0.65rem',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.3rem',
                                                    fontSize: '0.72rem',
                                                    fontWeight: '600',
                                                    transition: 'all 0.18s ease'
                                                }}
                                            >
                                                {isCopied ? <Check size={13} /> : <Copy size={13} />}
                                                <span>{isCopied ? 'Copied' : 'Copy'}</span>
                                            </button>

                                            {/* Direct Terminal Download Button */}
                                            <button
                                                onClick={() => handleDownloadInTerminal(t)}
                                                disabled={isTerminalActive}
                                                title="Download directly in Windows Terminal using torlink (no client installation required!)"
                                                style={{
                                                    background: 'rgba(168, 85, 247, 0.14)',
                                                    border: '1px solid rgba(168, 85, 247, 0.38)',
                                                    color: '#c084fc',
                                                    padding: '0.45rem 0.75rem',
                                                    borderRadius: '8px',
                                                    cursor: isTerminalActive ? 'not-allowed' : 'pointer',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.35rem',
                                                    fontSize: '0.72rem',
                                                    fontWeight: '700',
                                                    transition: 'all 0.18s ease'
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (!isTerminalActive) {
                                                        e.currentTarget.style.background = 'rgba(168, 85, 247, 0.26)';
                                                        e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.7)';
                                                        e.currentTarget.style.color = '#ffffff';
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (!isTerminalActive) {
                                                        e.currentTarget.style.background = 'rgba(168, 85, 247, 0.14)';
                                                        e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.38)';
                                                        e.currentTarget.style.color = '#c084fc';
                                                    }
                                                }}
                                            >
                                                <Terminal size={13} />
                                                <span>{isTerminalActive ? 'Launching...' : 'Terminal'}</span>
                                            </button>

                                            {/* Open Magnet in Desktop Client */}
                                            <button
                                                onClick={() => handleOpenMagnet(t.magnet)}
                                                title="Open in your default torrent client (qBittorrent, uTorrent, etc.)"
                                                style={{
                                                    background: 'linear-gradient(135deg, var(--theme-accent) 0%, rgba(var(--theme-accent-rgb), 0.85) 100%)',
                                                    color: '#000000',
                                                    border: 'none',
                                                    padding: '0.45rem 0.85rem',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.35rem',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '700',
                                                    boxShadow: '0 4px 12px rgba(var(--theme-accent-rgb), 0.3)',
                                                    transition: 'all 0.18s ease'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(var(--theme-accent-rgb), 0.45)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(var(--theme-accent-rgb), 0.3)';
                                                }}
                                            >
                                                <ExternalLink size={13} />
                                                <span>Open Magnet</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default TorrentDownloadModal;
