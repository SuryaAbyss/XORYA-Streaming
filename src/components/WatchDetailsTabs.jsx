import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Users, Calendar, Clock, Film, ExternalLink, Download, Tv, Server, Zap, MonitorPlay } from 'lucide-react';
import { imageUrl } from '../api/tmdb';
import ServerSelector from './ServerSelector';
import { servers } from '../config/servers';

const WatchDetailsTabs = ({
    contentData,
    type,
    season,
    episode,
    activeServer,
    onServerChange,
    onReload,
    onDownload
}) => {
    const [activeTab, setActiveTab] = useState('servers');

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
    const vidVaultUrl = type === 'tv'
        ? `https://vidvault.ru/tv/${contentData.id}/${sVal}/${eVal}`
        : `https://vidvault.ru/movie/${contentData.id}`;

    const mediaTvUrl = type === 'tv'
        ? `https://mediatv.trendingpie.com/?id=${contentData.id}&s=${sVal}&e=${eVal}`
        : `https://media.trendingpie.com/?id=${contentData.id}`;

    const handleDownloadOptionClick = (option) => {
        if (option === 'rive') {
            if (onDownload) onDownload();
        } else if (option === 'vidvault') {
            window.open(vidVaultUrl, '_blank', 'noopener,noreferrer');
        } else if (option === 'mediatv') {
            window.open(mediaTvUrl, '_blank', 'noopener,noreferrer');
        }
    };

    const tabs = [
        { id: 'servers', label: 'Servers' },
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
                gap: '1rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                paddingBottom: '0.8rem',
                marginBottom: '1.5rem',
                position: 'relative'
            }}>
                {tabs.map(tab => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: isActive ? 'white' : 'rgba(255, 255, 255, 0.65)',
                                fontSize: '0.95rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                padding: '0.5rem 1.2rem',
                                position: 'relative',
                                transition: 'color 0.2s ease',
                                outline: 'none',
                                borderRadius: '16px'
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
                                        borderRadius: '16px',
                                        background: 'linear-gradient(135deg, rgba(var(--theme-accent-rgb), 0.25) 0%, rgba(var(--theme-accent-rgb), 0.08) 100%)',
                                        border: '1.5px solid rgba(var(--theme-accent-rgb), 0.45)',
                                        boxShadow: `
                                            inset 0 1px 1px rgba(255, 255, 255, 0.4),
                                            0 6px 20px rgba(0, 0, 0, 0.35),
                                            0 0 15px rgba(var(--theme-accent-rgb), 0.25)
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
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default WatchDetailsTabs;
