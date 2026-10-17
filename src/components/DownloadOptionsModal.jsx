import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Download,
    X,
    HardDrive,
    MonitorPlay,
    Server,
    Zap,
    Sparkles,
    ExternalLink,
    ChevronDown,
    Film,
    Tv,
    Languages
} from 'lucide-react';
import TorrentDownloadModal from './TorrentDownloadModal';
import SubtitleDownloadModal from './SubtitleDownloadModal';

const DownloadOptionsModal = ({
    isOpen,
    onClose,
    contentData,
    type = 'movie',
    initialSeason = 1,
    initialEpisode = 1,
    seasonsList = []
}) => {
    const [season, setSeason] = useState(initialSeason);
    const [episode, setEpisode] = useState(initialEpisode);
    const [showTorrentModal, setShowTorrentModal] = useState(false);
    const [showSubtitleModal, setShowSubtitleModal] = useState(false);

    useEffect(() => {
        setSeason(initialSeason);
        setEpisode(initialEpisode);
    }, [initialSeason, initialEpisode, isOpen]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && !showTorrentModal) {
                onClose();
            }
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose, showTorrentModal]);

    if (!isOpen || !contentData) return null;

    const title = contentData.title || contentData.name || 'Content';
    const year = new Date(contentData.release_date || contentData.first_air_date || Date.now()).getFullYear();

    // Calculate max episodes for selected season
    const currentSeasonObj = seasonsList?.find(s => s.season_number === season);
    const maxEpisodes = currentSeasonObj?.episode_count || 30;

    // Build URLs based on current season/episode
    const downloadOptions = [
        {
            id: 'torrent',
            name: 'Torrent & Magnet',
            tag: '4K / 1080P',
            tagBg: 'var(--theme-accent)',
            tagColor: '#000000',
            category: 'P2P SWARM',
            desc: 'Multi-Quality • Live Sizes, Seeds & Direct Magnet Links',
            icon: HardDrive,
            iconColor: 'var(--theme-accent)',
            iconBg: 'rgba(var(--theme-accent-rgb), 0.15)',
            isHighlight: true,
            onClick: () => setShowTorrentModal(true)
        },
        {
            id: 'rive',
            name: 'Rive Downloader',
            tag: 'FAST DIRECT',
            tagBg: 'rgba(34, 197, 94, 0.2)',
            tagColor: '#4ade80',
            category: 'SERVER 1',
            desc: 'Direct high-speed MP4 downloads with quality selection',
            icon: MonitorPlay,
            iconColor: '#4ade80',
            iconBg: 'rgba(34, 197, 94, 0.15)',
            onClick: () => {
                const url = `https://rivestream.ru/download?type=${type}&id=${contentData.id}${type === 'tv' ? `&season=${season}&episode=${episode}` : ''}`;
                window.open(url, '_blank', 'noopener,noreferrer');
            }
        },
        {
            id: 'mediatv',
            name: 'MediaTV',
            tag: 'MIRROR',
            tagBg: 'rgba(16, 185, 129, 0.2)',
            tagColor: '#10b981',
            category: 'SERVER 2',
            desc: 'Download mirror & high speed web stream source',
            icon: Server,
            iconColor: '#10b981',
            iconBg: 'rgba(16, 185, 129, 0.15)',
            onClick: () => {
                const url = type === 'tv'
                    ? `https://mediatv.trendingpie.com/?id=${contentData.id}&s=${season}&e=${episode}`
                    : `https://media.trendingpie.com/?id=${contentData.id}`;
                window.open(url, '_blank', 'noopener,noreferrer');
            }
        },
        {
            id: 'vidvault',
            name: 'VidVault',
            tag: 'EXTERNAL',
            tagBg: 'rgba(239, 68, 68, 0.2)',
            tagColor: '#ef4444',
            category: 'SERVER 3',
            desc: 'Fast external video vault mirror & stream host',
            icon: Zap,
            iconColor: '#ef4444',
            iconBg: 'rgba(239, 68, 68, 0.15)',
            onClick: () => {
                const url = type === 'tv'
                    ? `https://vidvault.ru/tv/${contentData.id}/${season}/${episode}`
                    : `https://vidvault.ru/movie/${contentData.id}`;
                window.open(url, '_blank', 'noopener,noreferrer');
            }
        },
        {
            id: 'vidfast',
            name: 'VidFast Beta',
            tag: 'HIGH SPEED',
            tagBg: 'rgba(56, 189, 248, 0.2)',
            tagColor: '#38bdf8',
            category: 'SERVER 4',
            desc: 'Multi-threaded high throughput direct video feed',
            icon: Download,
            iconColor: '#38bdf8',
            iconBg: 'rgba(56, 189, 248, 0.15)',
            onClick: () => {
                const url = type === 'tv'
                    ? `https://vidfast.vc/tv/${contentData.id}/${season}/${episode}?server=beta`
                    : `https://vidfast.vc/movie/${contentData.id}?server=beta`;
                window.open(url, '_blank', 'noopener,noreferrer');
            }
        },
        {
            id: 'streamrip',
            name: 'StreamRip',
            tag: 'DIRECT RIP',
            tagBg: 'rgba(168, 85, 247, 0.2)',
            tagColor: '#c084fc',
            category: 'SERVER 5',
            desc: 'Fast external web video stream grabber',
            icon: Sparkles,
            iconColor: '#c084fc',
            iconBg: 'rgba(168, 85, 247, 0.15)',
            onClick: () => {
                const url = type === 'tv'
                    ? `https://streamrip.fun/tv/${contentData.id}/${season}/${episode}`
                    : `https://streamrip.fun/movie/${contentData.id}`;
                window.open(url, '_blank', 'noopener,noreferrer');
            }
        },
        {
            id: 'subtitlecat',
            name: 'SubtitleCat',
            tag: '100+ LANGUAGES',
            tagBg: 'rgba(253, 186, 41, 0.25)',
            tagColor: '#fdba29',
            category: 'SUBTITLES (.SRT)',
            desc: 'Direct search & download synchronized subtitles in any language',
            icon: Languages,
            iconColor: '#fdba29',
            iconBg: 'rgba(253, 186, 41, 0.18)',
            onClick: () => setShowSubtitleModal(true)
        }
    ];

    return (
        <>
            <AnimatePresence>
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.78)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        zIndex: 10010,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1.2rem',
                        boxSizing: 'border-box'
                    }}
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 20 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: '100%',
                            maxWidth: '680px',
                            maxHeight: '90vh',
                            background: 'linear-gradient(135deg, rgba(22, 24, 30, 0.98) 0%, rgba(12, 13, 18, 0.98) 100%)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            borderRadius: '24px',
                            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            position: 'relative'
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '1.4rem 1.6rem',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: 'rgba(255, 255, 255, 0.02)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                <div style={{
                                    width: '42px',
                                    height: '42px',
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, rgba(var(--theme-accent-rgb), 0.25) 0%, rgba(var(--theme-accent-rgb), 0.06) 100%)',
                                    border: '1px solid rgba(var(--theme-accent-rgb), 0.35)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--theme-accent)',
                                    boxShadow: '0 4px 15px rgba(var(--theme-accent-rgb), 0.2)'
                                }}>
                                    <Download size={22} />
                                </div>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.3px' }}>
                                            Download Options
                                        </h3>
                                        <span style={{
                                            fontSize: '0.62rem',
                                            fontWeight: '800',
                                            letterSpacing: '0.6px',
                                            textTransform: 'uppercase',
                                            background: 'rgba(255, 255, 255, 0.08)',
                                            color: 'rgba(255, 255, 255, 0.8)',
                                            padding: '0.15rem 0.5rem',
                                            borderRadius: '6px',
                                            border: '1px solid rgba(255, 255, 255, 0.12)'
                                        }}>
                                            {type === 'tv' ? 'SERIES' : 'MOVIE'}
                                        </span>
                                    </div>
                                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.55)' }}>
                                        {title} {year ? `(${year})` : ''} • Select a download server
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={onClose}
                                title="Close"
                                style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    background: 'rgba(255, 255, 255, 0.06)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    color: 'rgba(255, 255, 255, 0.75)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                                    e.currentTarget.style.color = '#ffffff';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.75)';
                                }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* TV Show Season & Episode Selector Bar */}
                        {type === 'tv' && (
                            <div style={{
                                padding: '0.85rem 1.6rem',
                                background: 'rgba(255, 255, 255, 0.025)',
                                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                flexWrap: 'wrap'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                                    <Tv size={15} style={{ color: 'var(--theme-accent)' }} />
                                    <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'rgba(255, 255, 255, 0.9)' }}>
                                        Target Episode:
                                    </span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexGrow: 1 }}>
                                    {/* Season Dropdown */}
                                    <div style={{ position: 'relative', flex: 1, minWidth: '120px' }}>
                                        <select
                                            value={season}
                                            onChange={(e) => {
                                                const newSeason = Number(e.target.value);
                                                setSeason(newSeason);
                                                setEpisode(1);
                                            }}
                                            style={{
                                                width: '100%',
                                                background: 'rgba(0, 0, 0, 0.5)',
                                                border: '1px solid rgba(255, 255, 255, 0.14)',
                                                color: '#ffffff',
                                                padding: '0.45rem 2rem 0.45rem 0.75rem',
                                                borderRadius: '10px',
                                                fontSize: '0.82rem',
                                                fontWeight: '600',
                                                appearance: 'none',
                                                outline: 'none',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {seasonsList && seasonsList.length > 0 ? (
                                                seasonsList.map((s) => (
                                                    <option key={s.id || s.season_number} value={s.season_number} style={{ background: '#181a20', color: '#ffffff' }}>
                                                        {s.name || `Season ${s.season_number}`} {s.episode_count ? `(${s.episode_count} eps)` : ''}
                                                    </option>
                                                ))
                                            ) : (
                                                [...Array(10)].map((_, i) => (
                                                    <option key={i + 1} value={i + 1} style={{ background: '#181a20', color: '#ffffff' }}>
                                                        Season {i + 1}
                                                    </option>
                                                ))
                                            )}
                                        </select>
                                        <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'rgba(255,255,255,0.5)' }} />
                                    </div>

                                    {/* Episode Dropdown */}
                                    <div style={{ position: 'relative', flex: 1, minWidth: '120px' }}>
                                        <select
                                            value={episode}
                                            onChange={(e) => setEpisode(Number(e.target.value))}
                                            style={{
                                                width: '100%',
                                                background: 'rgba(0, 0, 0, 0.5)',
                                                border: '1px solid rgba(255, 255, 255, 0.14)',
                                                color: '#ffffff',
                                                padding: '0.45rem 2rem 0.45rem 0.75rem',
                                                borderRadius: '10px',
                                                fontSize: '0.82rem',
                                                fontWeight: '600',
                                                appearance: 'none',
                                                outline: 'none',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {[...Array(maxEpisodes)].map((_, i) => (
                                                <option key={i + 1} value={i + 1} style={{ background: '#181a20', color: '#ffffff' }}>
                                                    Episode {i + 1}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'rgba(255,255,255,0.5)' }} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Options Grid */}
                        <div style={{
                            padding: '1.4rem 1.6rem',
                            overflowY: 'auto',
                            maxHeight: 'calc(90vh - 160px)',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                            gap: '0.9rem',
                            boxSizing: 'border-box'
                        }}>
                            {downloadOptions.map((opt) => {
                                const IconComponent = opt.icon;
                                return (
                                    <motion.div
                                        key={opt.id}
                                        whileHover={{ scale: 1.02, y: -2 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={opt.onClick}
                                        style={{
                                            background: opt.isHighlight
                                                ? 'linear-gradient(135deg, rgba(var(--theme-accent-rgb), 0.14) 0%, rgba(255, 255, 255, 0.03) 100%)'
                                                : 'rgba(255, 255, 255, 0.03)',
                                            border: opt.isHighlight
                                                ? '1.5px solid rgba(var(--theme-accent-rgb), 0.4)'
                                                : '1px solid rgba(255, 255, 255, 0.08)',
                                            borderRadius: '16px',
                                            padding: '1.1rem 1.25rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.9rem',
                                            boxSizing: 'border-box',
                                            transition: 'border-color 0.2s, box-shadow 0.2s',
                                            boxShadow: opt.isHighlight ? '0 8px 24px rgba(var(--theme-accent-rgb), 0.12)' : 'none'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!opt.isHighlight) {
                                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!opt.isHighlight) {
                                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                                            }
                                        }}
                                    >
                                        <div style={{
                                            width: '42px',
                                            height: '42px',
                                            borderRadius: '12px',
                                            background: opt.iconBg,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: opt.iconColor,
                                            flexShrink: 0
                                        }}>
                                            <IconComponent size={20} />
                                        </div>

                                        <div style={{ flexGrow: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
                                                <h4 style={{ margin: 0, fontSize: '0.94rem', fontWeight: '700', color: '#ffffff' }}>
                                                    {opt.name}
                                                </h4>
                                                <span style={{
                                                    fontSize: '0.62rem',
                                                    fontWeight: '700',
                                                    background: opt.tagBg,
                                                    color: opt.tagColor,
                                                    padding: '0.12rem 0.45rem',
                                                    borderRadius: '6px',
                                                    letterSpacing: '0.3px'
                                                }}>
                                                    {opt.tag}
                                                </span>
                                            </div>
                                            <p style={{
                                                margin: 0,
                                                fontSize: '0.74rem',
                                                color: 'rgba(255, 255, 255, 0.55)',
                                                lineHeight: '1.35',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {opt.desc}
                                            </p>
                                        </div>

                                        <div style={{
                                            color: opt.isHighlight ? 'var(--theme-accent)' : 'rgba(255, 255, 255, 0.35)',
                                            flexShrink: 0
                                        }}>
                                            {opt.id === 'torrent' ? <Download size={16} /> : <ExternalLink size={16} />}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Footer Info */}
                        <div style={{
                            padding: '0.9rem 1.6rem',
                            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                            background: 'rgba(0, 0, 0, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '0.5rem'
                        }}>
                            <span style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.4)' }}>
                                🔒 Direct servers open external downloaders • Torrents query verified swarms
                            </span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--theme-accent)', fontWeight: '600' }}>
                                XORYA Downloader Hub
                            </span>
                        </div>
                    </motion.div>
                </div>
            </AnimatePresence>

            {/* Nested Torrent Download Modal */}
            <TorrentDownloadModal
                isOpen={showTorrentModal}
                onClose={() => setShowTorrentModal(false)}
                contentData={contentData}
                type={type}
                season={season}
                episode={episode}
            />

            {/* Nested SubtitleCat Download Modal */}
            <SubtitleDownloadModal
                isOpen={showSubtitleModal}
                onClose={() => setShowSubtitleModal(false)}
                contentData={contentData}
                type={type}
                season={season}
                episode={episode}
            />
        </>
    );
};

export default DownloadOptionsModal;
