import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Users, Calendar, Clock, Film, ExternalLink, Download, Tv, Server, Zap, MonitorPlay, Check, Play, Headphones, HardDrive, Filter, RefreshCw, Sparkles, AlertCircle } from 'lucide-react';
import { imageUrl } from '../api/tmdb';
import ServerSelector from './ServerSelector';
import { servers } from '../config/servers';
import TorrentDownloadModal from './TorrentDownloadModal';

const WatchDetailsTabs = ({
    contentData,
    type,
    season,
    episode,
    activeServer,
    onServerChange,
    onReload,
    onDownload,
    activeDirectStream,
    onSelectDirectStream
}) => {
    const [activeTab, setActiveTab] = useState('servers');
    const [streams, setStreams] = useState([]);
    const [loadingStreams, setLoadingStreams] = useState(false);
    const [selectedLang, setSelectedLang] = useState('all');
    const [selectedQuality, setSelectedQuality] = useState('all');
    const [showTorrentModal, setShowTorrentModal] = useState(false);

    const [vlcLoading, setVlcLoading] = useState(null);
    const [vlcToast, setVlcToast] = useState(null);

    if (!contentData) return null;

    const title = type === 'movie' ? contentData.title : contentData.name;
    const year = (contentData.release_date || contentData.first_air_date)?.split('-')[0];
    const rating = contentData.vote_average?.toFixed(1);
    const genres = contentData.genres?.map(g => g.name).slice(0, 3).join(', ');

    // Cast details
    const cast = contentData.credits?.cast || [];
    const topCast = cast.slice(0, 6);

    // Build URLs based on type for download tab
    const sVal = season || 1;
    const eVal = episode || 1;

    const fetchStreams = useCallback(async () => {
        if (!contentData?.id) return;
        setLoadingStreams(true);
        try {
            const queryParams = new URLSearchParams({
                tmdbId: String(contentData.id),
                title: title || '',
                type: type || 'movie',
                season: String(sVal),
                episode: String(eVal),
                year: year || ''
            });
            const res = await fetch(`/api/streams?${queryParams.toString()}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            if (data?.streams && Array.isArray(data.streams)) {
                setStreams(data.streams);
            } else {
                setStreams([]);
            }
        } catch (err) {
            console.error('Failed to load direct streams:', err);
            setStreams([]);
        } finally {
            setLoadingStreams(false);
        }
    }, [contentData?.id, title, type, sVal, eVal, year]);

    const handlePlayVlc = async (stream) => {
        setVlcLoading(stream.id);
        try {
            // Also activate in web player with real-time visuals
            if (onSelectDirectStream) {
                onSelectDirectStream(stream);
            }

            // 1. Request local player launch via backend
            const resp = await fetch('/api/player/vlc', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    streamId: stream.id,
                    title: stream.release || stream.title || `${title}`
                })
            });
            const data = await resp.json().catch(() => ({}));

            // 2. If backend couldn't spawn VLC directly, trigger .m3u download fallback
            if (!data?.success) {
                const a = document.createElement('a');
                a.href = `/api/stream/playlist/${stream.id}.m3u`;
                a.download = `${(stream.release || stream.title || 'Stream').replace(/[^a-zA-Z0-9_-]/g, '_')}.m3u`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }

            setVlcToast(`🎬 Opened "${stream.release || stream.title}" in VLC! (Also playing in Web Player)`);
            setTimeout(() => setVlcToast(null), 5000);
        } catch (err) {
            console.error('VLC launch error:', err);
        } finally {
            setVlcLoading(null);
        }
    };

    useEffect(() => {
        if (activeTab === 'streams') {
            fetchStreams();
        }
    }, [activeTab, fetchStreams]);

    const availableLanguages = Array.from(new Set(streams.flatMap(s => s.audioLanguages || [])));
    const availableQualities = Array.from(new Set(streams.map(s => s.quality).filter(Boolean)));

    const filteredStreams = streams.filter(s => {
        if (selectedLang !== 'all' && !(s.audioLanguages || []).includes(selectedLang)) {
            return false;
        }
        if (selectedQuality !== 'all' && s.quality !== selectedQuality) {
            return false;
        }
        return true;
    });

    const vidVaultUrl = type === 'tv'
        ? `https://vidvault.ru/tv/${contentData.id}/${sVal}/${eVal}`
        : `https://vidvault.ru/movie/${contentData.id}`;

    const mediaTvUrl = type === 'tv'
        ? `https://mediatv.trendingpie.com/?id=${contentData.id}&s=${sVal}&e=${eVal}`
        : `https://media.trendingpie.com/?id=${contentData.id}`;

    const handleDownloadOptionClick = (option) => {
        if (option === 'torrent') {
            setShowTorrentModal(true);
        } else if (option === 'rive') {
            if (onDownload) onDownload();
        } else if (option === 'vidvault') {
            window.open(vidVaultUrl, '_blank', 'noopener,noreferrer');
        } else if (option === 'mediatv') {
            window.open(mediaTvUrl, '_blank', 'noopener,noreferrer');
        }
    };

    const tabs = [
        { id: 'servers', label: 'Servers' },
        { id: 'streams', label: '⚡ Streams' },
        { id: 'overview', label: 'Overview' },
        { id: 'downloads', label: 'Downloads' }
    ];

    const formatCurrency = (amount) => {
        if (!amount) return 'N/A';
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
    };

    const formatRuntime = (minutes) => {
        if (!minutes) return 'N/A';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    return (
        <div style={{
            width: '100%',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '24px',
            padding: '1.8rem',
            boxShadow: '0 16px 45px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            boxSizing: 'border-box',
            transition: 'border-color 0.3s ease',
        }}
        className="watch-details-container"
        >
            {/* CSS styles for local hover animations */}
            <style>{`
                .watch-details-container:hover {
                    border-color: rgba(var(--theme-accent-rgb), 0.2) !important;
                }
                .download-tab-card {
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
                }
                .download-tab-card:hover {
                    background: rgba(255, 255, 255, 0.08) !important;
                    border-color: var(--theme-accent) !important;
                    transform: translateY(-2px);
                    box-shadow: 0 8px 30px rgba(var(--theme-accent-rgb), 0.15);
                }
                .cast-avatar-container {
                    transition: all 0.25s ease;
                }
                .cast-card:hover .cast-avatar-container {
                    transform: scale(1.05);
                    border-color: var(--theme-accent) !important;
                    box-shadow: 0 0 12px rgba(var(--theme-accent-rgb), 0.3);
                }
            `}</style>

            {/* Tabs Header */}
            <div style={{
                display: 'flex',
                gap: '0.75rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                paddingBottom: '1rem',
                marginBottom: '1.5rem',
                position: 'relative',
                alignItems: 'center',
                flexWrap: 'wrap'
            }}>
                {tabs.map(tab => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            className="watch-details-tab-btn"
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.65)',
                                fontSize: '0.92rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                padding: '0.65rem 1.5rem',
                                position: 'relative',
                                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                outline: 'none',
                                borderRadius: '9999px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                letterSpacing: '0.02em',
                                lineHeight: 1,
                                boxSizing: 'border-box'
                            }}
                            onMouseEnter={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.95)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.65)';
                                }
                            }}
                        >
                            <span style={{ position: 'relative', zIndex: 2 }}>{tab.label}</span>
                            {isActive && (
                                <motion.div
                                    layoutId="details-tab-indicator"
                                    transition={{
                                        type: "spring",
                                        stiffness: 420,
                                        damping: 30
                                    }}
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        borderRadius: '9999px',
                                        background: 'linear-gradient(135deg, rgba(var(--theme-accent-rgb), 0.28) 0%, rgba(var(--theme-accent-rgb), 0.08) 100%)',
                                        border: '1.5px solid rgba(var(--theme-accent-rgb), 0.55)',
                                        boxShadow: `
                                            inset 0 1px 1px rgba(255, 255, 255, 0.35),
                                            0 4px 16px rgba(0, 0, 0, 0.35),
                                            0 0 16px rgba(var(--theme-accent-rgb), 0.28)
                                        `,
                                        backdropFilter: 'blur(12px)',
                                        WebkitBackdropFilter: 'blur(12px)',
                                        zIndex: 1
                                    }}
                                />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Tab Body */}
            <div style={{ minHeight: '260px' }}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.25 }}
                    >
                        {activeTab === 'overview' && (
                            <div style={{
                                display: 'flex',
                                gap: '2rem',
                                flexDirection: 'row',
                                flexWrap: 'wrap'
                            }}>
                                {/* Poster Display */}
                                {contentData.poster_path && (
                                    <div style={{
                                        width: '140px',
                                        height: '210px',
                                        borderRadius: '16px',
                                        overflow: 'hidden',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        boxShadow: '0 12px 30px rgba(0, 0, 0, 0.5)',
                                        flexShrink: 0
                                    }}>
                                        <img
                                            src={imageUrl(contentData.poster_path, 'w300')}
                                            alt={title}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    </div>
                                )}

                                {/* Content Details */}
                                <div style={{ flex: 1, minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                    <div>
                                        <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'white', margin: '0 0 0.2rem' }}>
                                            {title}
                                        </h2>
                                        {contentData.tagline && (
                                            <p style={{ fontSize: '0.92rem', color: 'rgba(255, 255, 255, 0.5)', fontStyle: 'italic', margin: 0 }}>
                                                "{contentData.tagline}"
                                            </p>
                                        )}
                                    </div>

                                    {/* Quick Badges */}
                                    <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                        {rating && (
                                            <div style={{
                                                display: 'flex', alignItems: 'center', gap: '0.25rem',
                                                background: 'rgba(255, 215, 0, 0.15)', px: '0.5rem', py: '0.2rem',
                                                borderRadius: '6px', padding: '0.2rem 0.5rem', border: '1px solid rgba(255, 215, 0, 0.25)',
                                                fontSize: '0.82rem', color: '#ffd700', fontWeight: 'bold'
                                            }}>
                                                <Star size={12} fill="#ffd700" color="#ffd700" />
                                                {rating}
                                            </div>
                                        )}
                                        {year && (
                                            <span style={{ fontSize: '0.82rem', padding: '0.2rem 0.6rem', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}>
                                                {year}
                                            </span>
                                        )}
                                        {genres && (
                                            <span style={{ fontSize: '0.82rem', padding: '0.2rem 0.6rem', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}>
                                                {genres}
                                            </span>
                                        )}
                                    </div>

                                    {/* Synopsis */}
                                    <p style={{ fontSize: '0.92rem', lineHeight: '1.6', color: 'rgba(255,255,255,0.8)', margin: '0.2rem 0' }}>
                                        {contentData.overview || "No description available."}
                                    </p>

                                    {/* Key Metadata Grid */}
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.6rem',
                                        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                                        paddingTop: '0.8rem',
                                        marginTop: '0.4rem'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.85rem' }}>
                                            <span style={{ color: 'rgba(255,255,255,0.4)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', width: '130px', flexShrink: 0 }}><Film size={14} /> Status</span>
                                            <span style={{ color: 'white', fontWeight: '500' }}>{contentData.status || 'N/A'}</span>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.85rem' }}>
                                            <span style={{ color: 'rgba(255,255,255,0.4)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', width: '130px', flexShrink: 0 }}><Calendar size={14} /> {type === 'movie' ? 'Release Date' : 'First Aired'}</span>
                                            <span style={{ color: 'white', fontWeight: '500' }}>{contentData.release_date || contentData.first_air_date || 'N/A'}</span>
                                        </div>

                                        {type === 'movie' ? (
                                            <>
                                                <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.85rem' }}>
                                                    <span style={{ color: 'rgba(255,255,255,0.4)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', width: '130px', flexShrink: 0 }}><Clock size={14} /> Runtime</span>
                                                    <span style={{ color: 'white', fontWeight: '500' }}>{formatRuntime(contentData.runtime)}</span>
                                                </div>
                                                {contentData.budget > 0 && (
                                                    <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.85rem' }}>
                                                        <span style={{ color: 'rgba(255,255,255,0.4)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', width: '130px', flexShrink: 0 }}><Users size={14} /> Budget</span>
                                                        <span style={{ color: 'white', fontWeight: '500' }}>{formatCurrency(contentData.budget)}</span>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                {contentData.created_by && contentData.created_by.length > 0 && (
                                                    <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.85rem' }}>
                                                        <span style={{ color: 'rgba(255,255,255,0.4)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', width: '130px', flexShrink: 0 }}><Users size={14} /> Creator</span>
                                                        <span style={{ color: 'white', fontWeight: '500' }}>{contentData.created_by.map(c => c.name).join(', ')}</span>
                                                    </div>
                                                )}
                                                {contentData.networks && contentData.networks.length > 0 && (
                                                    <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.85rem' }}>
                                                        <span style={{ color: 'rgba(255,255,255,0.4)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', width: '130px', flexShrink: 0 }}><Tv size={14} /> Network</span>
                                                        <span style={{ color: 'white', fontWeight: '500' }}>{contentData.networks.map(n => n.name).join(', ')}</span>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {/* Cast Row */}
                                    {topCast.length > 0 && (
                                        <div style={{ marginTop: '0.8rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '0.8rem' }}>
                                            <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'rgba(255,255,255,0.5)', margin: '0 0 0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <Users size={14} /> Top Cast
                                            </h4>
                                            <div style={{ display: 'flex', gap: '1.2rem', overflowX: 'auto', paddingBottom: '0.4rem', scrollbarWidth: 'none' }}>
                                                {topCast.map(person => (
                                                    <div key={person.id} className="cast-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '70px', flexShrink: 0 }}>
                                                        <div className="cast-avatar-container" style={{
                                                            width: '46px',
                                                            height: '46px',
                                                            borderRadius: '10px',
                                                            overflow: 'hidden',
                                                            border: '1.5px solid rgba(255, 255, 255, 0.15)',
                                                            marginBottom: '0.3rem',
                                                            boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
                                                        }}>
                                                            {person.profile_path ? (
                                                                <img
                                                                    src={`https://image.tmdb.org/t/p/w200${person.profile_path}`}
                                                                    alt={person.name}
                                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                                />
                                                            ) : (
                                                                <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>👤</div>
                                                            )}
                                                        </div>
                                                        <span style={{ fontSize: '0.72rem', fontWeight: '600', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                                                            {person.name}
                                                        </span>
                                                        <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                                                            {person.character}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'streams' && (
                            <div>
                                {/* Header & Refresh */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                    marginBottom: '1.25rem',
                                    gap: '1rem',
                                    flexWrap: 'wrap'
                                }}>
                                    <div>
                                        <h3 style={{
                                            fontSize: '1.1rem',
                                            fontWeight: '700',
                                            color: 'white',
                                            margin: '0 0 0.3rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem'
                                        }}>
                                            <Sparkles size={18} style={{ color: 'var(--theme-accent)' }} />
                                            Direct 4K & Multi-Audio Streams
                                        </h3>
                                        <p style={{ color: 'rgba(255, 255, 255, 0.55)', fontSize: '0.82rem', margin: 0 }}>
                                            Ad-free direct streaming links aggregated from MovieBox & 4KHDHub with multi-language audio dubs.
                                            {type === 'tv' && (
                                                <span style={{ color: 'var(--theme-accent)', fontWeight: '600', marginLeft: '0.4rem' }}>
                                                    (Season {sVal} • Episode {eVal})
                                                </span>
                                            )}
                                        </p>
                                    </div>

                                    <button
                                        onClick={fetchStreams}
                                        disabled={loadingStreams}
                                        title="Refresh Streams"
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            border: '1px solid rgba(255, 255, 255, 0.12)',
                                            color: 'rgba(255, 255, 255, 0.8)',
                                            borderRadius: '10px',
                                            padding: '0.45rem 0.85rem',
                                            fontSize: '0.78rem',
                                            fontWeight: '600',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.4rem',
                                            cursor: loadingStreams ? 'not-allowed' : 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!loadingStreams) {
                                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                                e.currentTarget.style.color = '#fff';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!loadingStreams) {
                                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
                                            }
                                        }}
                                    >
                                        <RefreshCw size={13} className={loadingStreams ? 'spin-anim' : ''} />
                                        <span>{loadingStreams ? 'Searching...' : 'Refresh'}</span>
                                    </button>
                                </div>

                                {/* VLC Success Notification Toast */}
                                {vlcToast && (
                                    <div style={{
                                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)',
                                        border: '1px solid #10b981',
                                        borderRadius: '12px',
                                        padding: '0.75rem 1.1rem',
                                        marginBottom: '1.25rem',
                                        color: '#ffffff',
                                        fontSize: '0.85rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        boxShadow: '0 4px 20px rgba(16, 185, 129, 0.25)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                            <span style={{ fontSize: '1.2rem' }}>🎬</span>
                                            <span style={{ fontWeight: '600' }}>{vlcToast}</span>
                                        </div>
                                        <button
                                            onClick={() => setVlcToast(null)}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: 'rgba(255, 255, 255, 0.7)',
                                                cursor: 'pointer',
                                                fontSize: '0.8rem'
                                            }}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                )}

                                {/* Filter Pills Bar */}
                                <div style={{
                                    display: 'flex',
                                    gap: '0.5rem',
                                    alignItems: 'center',
                                    flexWrap: 'wrap',
                                    marginBottom: '1.25rem',
                                    padding: '0.65rem 0.85rem',
                                    borderRadius: '14px',
                                    background: 'rgba(0, 0, 0, 0.25)',
                                    border: '1px solid rgba(255, 255, 255, 0.05)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'rgba(255, 255, 255, 0.45)', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: '0.2rem' }}>
                                        <Filter size={13} />
                                        <span>Filters:</span>
                                    </div>

                                    {/* All Filter */}
                                    <button
                                        onClick={() => { setSelectedLang('all'); setSelectedQuality('all'); }}
                                        style={{
                                            background: (selectedLang === 'all' && selectedQuality === 'all')
                                                ? 'var(--theme-accent)'
                                                : 'rgba(255, 255, 255, 0.06)',
                                            color: (selectedLang === 'all' && selectedQuality === 'all') ? '#000' : 'rgba(255, 255, 255, 0.75)',
                                            border: 'none',
                                            borderRadius: '9999px',
                                            padding: '0.3rem 0.75rem',
                                            fontSize: '0.75rem',
                                            fontWeight: '700',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        All ({streams.length})
                                    </button>

                                    {/* Quality Filter Pills */}
                                    {availableQualities.map(q => {
                                        const isSelected = selectedQuality === q;
                                        return (
                                            <button
                                                key={q}
                                                onClick={() => setSelectedQuality(isSelected ? 'all' : q)}
                                                style={{
                                                    background: isSelected
                                                        ? 'linear-gradient(135deg, rgba(var(--theme-accent-rgb), 0.3) 0%, rgba(var(--theme-accent-rgb), 0.1) 100%)'
                                                        : 'rgba(255, 255, 255, 0.06)',
                                                    border: isSelected ? '1px solid var(--theme-accent)' : '1px solid transparent',
                                                    color: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.75)',
                                                    borderRadius: '9999px',
                                                    padding: '0.3rem 0.75rem',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '700',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.3rem',
                                                    transition: 'all 0.2s ease'
                                                }}
                                            >
                                                <span>{q === '4K UHD' ? '🌟' : '📺'}</span>
                                                <span>{q}</span>
                                            </button>
                                        );
                                    })}

                                    {/* Language Filter Pills */}
                                    {availableLanguages.map(lang => {
                                        const isSelected = selectedLang === lang;
                                        const flag = lang === 'Hindi' ? '🇮🇳' : lang === 'English' ? '🇬🇧' : lang === 'Tamil' ? '🇮🇳' : '🌐';
                                        return (
                                            <button
                                                key={lang}
                                                onClick={() => setSelectedLang(isSelected ? 'all' : lang)}
                                                style={{
                                                    background: isSelected
                                                        ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.3) 0%, rgba(168, 85, 247, 0.1) 100%)'
                                                        : 'rgba(255, 255, 255, 0.06)',
                                                    border: isSelected ? '1px solid #a855f7' : '1px solid transparent',
                                                    color: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.75)',
                                                    borderRadius: '9999px',
                                                    padding: '0.3rem 0.75rem',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '700',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.3rem',
                                                    transition: 'all 0.2s ease'
                                                }}
                                            >
                                                <span>{flag}</span>
                                                <span>{lang}</span>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Loading Skeleton */}
                                {loadingStreams && streams.length === 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                        {[1, 2].map(i => (
                                            <div
                                                key={i}
                                                style={{
                                                    height: '86px',
                                                    borderRadius: '16px',
                                                    background: 'rgba(255, 255, 255, 0.03)',
                                                    border: '1px solid rgba(255, 255, 255, 0.06)',
                                                    animation: 'pulse 1.5s infinite ease-in-out'
                                                }}
                                            />
                                        ))}
                                    </div>
                                ) : filteredStreams.length === 0 ? (
                                    <div style={{
                                        textAlign: 'center',
                                        padding: '2.5rem 1.5rem',
                                        background: 'rgba(255, 255, 255, 0.02)',
                                        borderRadius: '16px',
                                        border: '1px solid rgba(255, 255, 255, 0.05)'
                                    }}>
                                        <AlertCircle size={28} style={{ color: 'rgba(255, 255, 255, 0.4)', margin: '0 auto 0.6rem' }} />
                                        <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.92rem', fontWeight: '600', margin: '0 0 0.3rem' }}>
                                            No direct MovieBox streams available for this title.
                                        </p>
                                        <p style={{ color: 'rgba(255, 255, 255, 0.45)', fontSize: '0.8rem', margin: 0 }}>
                                            You can switch to the <b>Servers</b> tab above to stream via standard fast mirrors.
                                        </p>
                                    </div>
                                ) : (
                                    /* Stream Cards List */
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                        {filteredStreams.map((stream, idx) => {
                                            const isPlaying = activeDirectStream?.id === stream.id;
                                            const is4K = stream.quality === '4K UHD';
                                            const hasHindi = (stream.audioLanguages || []).includes('Hindi');

                                            return (
                                                <div
                                                    key={stream.id || idx}
                                                    className="direct-stream-card"
                                                    style={{
                                                        background: isPlaying
                                                            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(10, 20, 15, 0.6) 100%)'
                                                            : 'rgba(255, 255, 255, 0.03)',
                                                        border: isPlaying
                                                            ? '1.5px solid #10b981'
                                                            : '1px solid rgba(255, 255, 255, 0.08)',
                                                        borderRadius: '18px',
                                                        padding: '1.1rem 1.4rem',
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        gap: '1.2rem',
                                                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                                        boxSizing: 'border-box'
                                                    }}
                                                >
                                                    {/* Stream Info Left */}
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        {/* Top Badges Row */}
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.45rem' }}>
                                                            {/* Quality Badge */}
                                                            <span style={{
                                                                fontSize: '0.72rem',
                                                                fontWeight: '800',
                                                                padding: '0.2rem 0.6rem',
                                                                borderRadius: '8px',
                                                                letterSpacing: '0.04em',
                                                                background: is4K
                                                                    ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.1) 100%)'
                                                                    : 'linear-gradient(135deg, rgba(var(--theme-accent-rgb), 0.25) 0%, rgba(var(--theme-accent-rgb), 0.08) 100%)',
                                                                color: is4K ? '#fbbf24' : 'var(--theme-accent)',
                                                                border: is4K ? '1px solid rgba(245, 158, 11, 0.45)' : '1px solid rgba(var(--theme-accent-rgb), 0.45)',
                                                                boxShadow: is4K ? '0 0 10px rgba(245, 158, 11, 0.2)' : '0 0 10px rgba(var(--theme-accent-rgb), 0.2)'
                                                            }}>
                                                                {stream.resolutions ? `RES: ${stream.resolutions}` : stream.quality}
                                                            </span>

                                                            {/* Codec Badge */}
                                                            <span style={{
                                                                fontSize: '0.72rem',
                                                                fontWeight: '800',
                                                                padding: '0.2rem 0.6rem',
                                                                borderRadius: '8px',
                                                                background: 'rgba(59, 130, 246, 0.2)',
                                                                color: '#60a5fa',
                                                                border: '1px solid rgba(59, 130, 246, 0.4)'
                                                            }}>
                                                                {stream.codec || 'HEVC'}
                                                            </span>

                                                            {/* Provider Tag */}
                                                            <span style={{
                                                                fontSize: '0.68rem',
                                                                fontWeight: '600',
                                                                padding: '0.15rem 0.5rem',
                                                                borderRadius: '6px',
                                                                background: 'rgba(255, 255, 255, 0.06)',
                                                                color: 'rgba(255, 255, 255, 0.7)',
                                                                border: '1px solid rgba(255, 255, 255, 0.08)'
                                                            }}>
                                                                {stream.provider}
                                                            </span>
                                                        </div>

                                                        {/* Release Title */}
                                                        <h4 style={{
                                                            fontSize: '0.94rem',
                                                            fontWeight: '600',
                                                            color: '#ffffff',
                                                            margin: '0 0 0.25rem',
                                                            lineHeight: 1.35,
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap'
                                                        }}
                                                        title={stream.title}
                                                        >
                                                            {stream.release || stream.title}
                                                        </h4>

                                                        {/* Meta details */}
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'rgba(255, 255, 255, 0.45)', fontSize: '0.74rem' }}>
                                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                                                <HardDrive size={12} />
                                                                <span>SIZE: {stream.size}</span>
                                                            </span>
                                                            <span>•</span>
                                                            <span style={{ color: '#10b981', fontWeight: '600' }}>
                                                                ⚡ MovieBox CDN Stream
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Dual Action Buttons Right */}
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0, flexWrap: 'wrap' }}>
                                                        {/* VLC Desktop Player Button - Like MovieBox-TUI */}
                                                        <button
                                                            onClick={() => handlePlayVlc(stream)}
                                                            disabled={vlcLoading === stream.id}
                                                            title="Pop up and play stream in VLC Media Player (Native HEVC Hardware Accelerated)"
                                                            style={{
                                                                background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                                                                color: '#ffffff',
                                                                border: 'none',
                                                                borderRadius: '9999px',
                                                                padding: '0.55rem 1.15rem',
                                                                fontSize: '0.8rem',
                                                                fontWeight: '800',
                                                                cursor: vlcLoading === stream.id ? 'not-allowed' : 'pointer',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '0.45rem',
                                                                boxShadow: '0 4px 18px rgba(234, 88, 12, 0.45)',
                                                                transition: 'all 0.2s ease',
                                                                letterSpacing: '0.02em'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                if (vlcLoading !== stream.id) e.currentTarget.style.transform = 'scale(1.04)';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                if (vlcLoading !== stream.id) e.currentTarget.style.transform = 'scale(1)';
                                                            }}
                                                        >
                                                            <Play size={13} fill="currentColor" />
                                                            <span>{vlcLoading === stream.id ? 'Launching VLC...' : '🎬 Play in VLC'}</span>
                                                        </button>

                                                        {/* In-Browser Web Player Button */}
                                                        <button
                                                            onClick={() => {
                                                                if (onSelectDirectStream) {
                                                                    onSelectDirectStream(stream);
                                                                }
                                                            }}
                                                            title="Watch directly inside the top web player"
                                                            style={{
                                                                background: isPlaying
                                                                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                                                    : 'rgba(255, 255, 255, 0.08)',
                                                                border: isPlaying ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.15)',
                                                                color: '#ffffff',
                                                                borderRadius: '9999px',
                                                                padding: '0.55rem 1rem',
                                                                fontSize: '0.8rem',
                                                                fontWeight: '700',
                                                                cursor: 'pointer',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '0.4rem',
                                                                transition: 'all 0.2s ease'
                                                            }}
                                                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.04)'}
                                                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                                        >
                                                            {isPlaying ? (
                                                                <>
                                                                    <Check size={14} />
                                                                    <span>Web Player (Active)</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <MonitorPlay size={13} />
                                                                    <span>Web Player</span>
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'servers' && (
                            <div>
                                <ServerSelector
                                    servers={servers}
                                    activeServer={activeServer}
                                    onServerChange={onServerChange}
                                    onReload={onReload}
                                />
                            </div>
                        )}

                        {activeTab === 'downloads' && (
                            <div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'white', margin: '0 0 0.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Download size={18} style={{ color: 'var(--theme-accent)' }} /> Download Options
                                    </h3>
                                    <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.85rem', margin: 0 }}>
                                        Choose a download option below. External servers will launch in a new window, while Rive loads the downloader inside the player context.
                                        {type === 'tv' && (
                                            <span style={{ color: 'var(--theme-accent)', fontWeight: '600', marginLeft: '0.3rem' }}>
                                                (S{sVal} : E{eVal})
                                            </span>
                                        )}
                                    </p>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                                    {/* Option 1: MediaTV */}
                                    <div
                                        className="download-tab-card"
                                        onClick={() => handleDownloadOptionClick('mediatv')}
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.03)',
                                            border: '1px solid rgba(255, 255, 255, 0.08)',
                                            borderRadius: '16px',
                                            padding: '1rem 1.2rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.8rem',
                                            cursor: 'pointer',
                                            boxSizing: 'border-box'
                                        }}
                                    >
                                        <div style={{
                                            width: '38px',
                                            height: '38px',
                                            borderRadius: '10px',
                                            background: 'rgba(16, 185, 129, 0.1)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#10b981',
                                            flexShrink: 0
                                        }}>
                                            <Server size={18} />
                                        </div>
                                        <div style={{ flexGrow: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                                <h4 style={{ fontSize: '0.88rem', fontWeight: '600', margin: 0, color: 'white' }}>MediaTV</h4>
                                                <span style={{ fontSize: '0.6rem', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '0.1rem 0.4rem', borderRadius: '10px', fontWeight: '600' }}>
                                                    EXTERNAL
                                                </span>
                                            </div>
                                            <p style={{ color: 'rgba(255, 255, 255, 0.45)', fontSize: '0.72rem', margin: '0.1rem 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                Server 1 • Download & Stream
                                            </p>
                                        </div>
                                        <ExternalLink size={14} style={{ color: 'rgba(255, 255, 255, 0.3)', flexShrink: 0 }} />
                                    </div>

                                    {/* Option 2: Rive */}
                                    <div
                                        className="download-tab-card"
                                        onClick={() => handleDownloadOptionClick('rive')}
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.03)',
                                            border: '1px solid rgba(255, 255, 255, 0.08)',
                                            borderRadius: '16px',
                                            padding: '1rem 1.2rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.8rem',
                                            cursor: 'pointer',
                                            boxSizing: 'border-box'
                                        }}
                                    >
                                        <div style={{
                                            width: '38px',
                                            height: '38px',
                                            borderRadius: '10px',
                                            background: 'rgba(var(--theme-accent-rgb), 0.1)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'var(--theme-accent)',
                                            flexShrink: 0
                                        }}>
                                            <MonitorPlay size={18} />
                                        </div>
                                        <div style={{ flexGrow: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                                <h4 style={{ fontSize: '0.88rem', fontWeight: '600', margin: 0, color: 'white' }}>Rive Player</h4>
                                                <span style={{ fontSize: '0.6rem', background: 'rgba(var(--theme-accent-rgb), 0.15)', color: 'var(--theme-accent)', padding: '0.1rem 0.4rem', borderRadius: '10px', fontWeight: '600' }}>
                                                    IN-PLAYER
                                                </span>
                                            </div>
                                            <p style={{ color: 'rgba(255, 255, 255, 0.45)', fontSize: '0.72rem', margin: '0.1rem 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                Server 2 • Load in video frame
                                            </p>
                                        </div>
                                    </div>

                                    {/* Option 3: VidVault */}
                                    <div
                                        className="download-tab-card"
                                        onClick={() => handleDownloadOptionClick('vidvault')}
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.03)',
                                            border: '1px solid rgba(255, 255, 255, 0.08)',
                                            borderRadius: '16px',
                                            padding: '1rem 1.2rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.8rem',
                                            cursor: 'pointer',
                                            boxSizing: 'border-box'
                                        }}
                                    >
                                        <div style={{
                                            width: '38px',
                                            height: '38px',
                                            borderRadius: '10px',
                                            background: 'rgba(239, 68, 68, 0.1)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#ef4444',
                                            flexShrink: 0
                                        }}>
                                            <Zap size={18} />
                                        </div>
                                        <div style={{ flexGrow: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                                <h4 style={{ fontSize: '0.88rem', fontWeight: '600', margin: 0, color: 'white' }}>VidVault</h4>
                                                <span style={{ fontSize: '0.6rem', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '0.1rem 0.4rem', borderRadius: '10px', fontWeight: '600' }}>
                                                    EXTERNAL
                                                </span>
                                            </div>
                                            <p style={{ color: 'rgba(255, 255, 255, 0.45)', fontSize: '0.72rem', margin: '0.1rem 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                Server 3 • Fast External Server
                                            </p>
                                        </div>
                                        <ExternalLink size={14} style={{ color: 'rgba(255, 255, 255, 0.3)', flexShrink: 0 }} />
                                    </div>

                                    {/* Option 4: Torrent & Magnet P2P */}
                                    <div
                                        className="download-tab-card"
                                        onClick={() => handleDownloadOptionClick('torrent')}
                                        style={{
                                            background: 'linear-gradient(135deg, rgba(var(--theme-accent-rgb), 0.12) 0%, rgba(255, 255, 255, 0.03) 100%)',
                                            border: '1px solid rgba(var(--theme-accent-rgb), 0.35)',
                                            borderRadius: '16px',
                                            padding: '1rem 1.2rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.8rem',
                                            cursor: 'pointer',
                                            boxSizing: 'border-box',
                                            boxShadow: '0 4px 20px rgba(var(--theme-accent-rgb), 0.08)'
                                        }}
                                    >
                                        <div style={{
                                            width: '38px',
                                            height: '38px',
                                            borderRadius: '10px',
                                            background: 'rgba(var(--theme-accent-rgb), 0.2)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'var(--theme-accent)',
                                            flexShrink: 0
                                        }}>
                                            <HardDrive size={18} />
                                        </div>
                                        <div style={{ flexGrow: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                                <h4 style={{ fontSize: '0.88rem', fontWeight: '700', margin: 0, color: 'white' }}>Torrent & Magnet</h4>
                                                <span style={{ fontSize: '0.6rem', background: 'var(--theme-accent)', color: '#000', padding: '0.1rem 0.4rem', borderRadius: '10px', fontWeight: '700' }}>
                                                    4K / 1080P
                                                </span>
                                            </div>
                                            <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.72rem', margin: '0.1rem 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                Multi-Quality • Live Sizes & Seeders
                                            </p>
                                        </div>
                                        <Download size={14} style={{ color: 'var(--theme-accent)', flexShrink: 0 }} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Dynamic Multi-Quality Torrent & Magnet Downloader Modal */}
            <TorrentDownloadModal
                isOpen={showTorrentModal}
                onClose={() => setShowTorrentModal(false)}
                contentData={contentData}
                type={type}
                season={sVal}
                episode={eVal}
            />
        </div>
    );
};

export default WatchDetailsTabs;
