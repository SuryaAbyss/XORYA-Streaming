import React, { useState, useEffect } from 'react';
import { Play, Calendar, Star, Clock, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { getSeasonDetails, imageUrl } from '../api/tmdb';
import { motion, AnimatePresence } from 'framer-motion';

const EpisodesSidebar = ({
    showId,
    seasons = [],
    currentSeason,
    currentEpisode,
    onSeasonChange,
    onEpisodeSelect
}) => {
    const [episodes, setEpisodes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isEpisodesOpen, setIsEpisodesOpen] = useState(true);

    useEffect(() => {
        const fetchEpisodes = async () => {
            if (!showId) return;

            setLoading(true);
            try {
                const response = await getSeasonDetails(showId, currentSeason);
                setEpisodes(response.episodes || []);
                setIsEpisodesOpen(true); // Auto-open when season changes
            } catch (error) {
                console.error('Failed to fetch season details:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchEpisodes();
    }, [showId, currentSeason]);

    const [glassMapUrl, setGlassMapUrl] = useState('');

    useEffect(() => {
        fetch("https://essykings.github.io/JavaScript/map.png")
            .then((response) => response.blob())
            .then((blob) => {
                const objURL = URL.createObjectURL(blob);
                setGlassMapUrl(objURL);
            })
            .catch(err => console.error("Failed to load map for glass effect", err));

        return () => {
            if (glassMapUrl) URL.revokeObjectURL(glassMapUrl);
        };
    }, []);

    if (!showId) return null;

    return (

        <div style={{
            width: '100%',
            height: 'calc(100vh - 80px)',
            background: `
                    radial-gradient(circle at 10% 20%, rgba(255, 255, 255, 0.03) 0%, transparent 20%),
                    radial-gradient(circle at 90% 80%, rgba(255, 255, 255, 0.03) 0%, transparent 20%),
                    linear-gradient(180deg, rgba(7, 10, 18, 0.6) 0%, rgba(5, 7, 13, 0.8) 100%)
                `,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
            borderRadius: '24px',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <div style={{
                height: '100%',
                overflowY: 'auto',
                padding: '2rem 1.5rem',
                maskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)',
            }}>
                {/* Season Selector Dropdown */}
                <div style={{ marginBottom: '1rem', position: 'relative' }}>
                    <select
                        value={currentSeason}
                        onChange={(e) => onSeasonChange(parseInt(e.target.value))}
                        style={{
                            width: '100%',
                            padding: '0.8rem',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '12px',
                            color: 'white',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            appearance: 'none', // Hide default arrow
                            backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)'
                        }}
                    >
                        {seasons.map((season) => (
                            <option key={season.id} value={season.season_number} style={{ background: '#1a1a1a', color: 'white' }}>
                                {season.name}
                            </option>
                        ))}
                    </select>
                    {/* Custom Arrow Icon */}
                    <div style={{
                        position: 'absolute',
                        right: '1rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        pointerEvents: 'none',
                        color: 'rgba(255,255,255,0.5)'
                    }}>
                        <ChevronDown size={16} />
                    </div>
                </div>

                {/* Collapsible Header */}
                <button
                    onClick={() => setIsEpisodesOpen(!isEpisodesOpen)}
                    style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.8rem',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        borderRadius: '12px',
                        color: 'white',
                        cursor: 'pointer',
                        marginBottom: '1rem',
                        transition: 'all 0.2s ease'
                    }}
                >
                    <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                        Season {currentSeason} Episodes
                    </span>
                    {isEpisodesOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {/* Expandable Episodes List */}
                <AnimatePresence>
                    {isEpisodesOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            style={{ overflow: 'hidden' }}
                        >
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1rem',
                                paddingBottom: '1rem'
                            }}>
                                {loading ? (
                                    <div style={{
                                        textAlign: 'center',
                                        padding: '3rem 1rem',
                                        color: 'rgba(255,255,255,0.4)'
                                    }}>
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            border: '3px solid rgba(0, 188, 212, 0.3)',
                                            borderTop: '3px solid #00bcd4',
                                            borderRadius: '50%',
                                            animation: 'spin 1s linear infinite',
                                            margin: '0 auto 1rem'
                                        }}></div>
                                        Loading episodes...
                                    </div>
                                ) : (
                                    episodes.map((episode) => {
                                        const isCurrentEpisode = episode.episode_number === currentEpisode;

                                        return (
                                            <motion.div
                                                key={episode.id}
                                                initial={{ opacity: 0, y: 15 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                transition={{ duration: 0.3 }}
                                                className={`episode-card ${isCurrentEpisode ? 'active' : ''}`}
                                                style={{
                                                    background: isCurrentEpisode
                                                        ? 'rgba(0, 188, 212, 0.05)'
                                                        : 'rgba(0, 0, 0, 0.4)',
                                                    backdropFilter: 'blur(10px)',
                                                    border: isCurrentEpisode
                                                        ? '1px solid #00bcd4'
                                                        : '1px solid rgba(255, 255, 255, 0.05)',
                                                    borderRadius: '12px',
                                                    overflow: 'hidden',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    boxShadow: isCurrentEpisode
                                                        ? '0 0 20px rgba(0, 188, 212, 0.15)'
                                                        : 'none',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '0.8rem',
                                                    padding: '0.8rem'
                                                }}
                                                onClick={() => onEpisodeSelect(currentSeason, episode.episode_number)}
                                                whileHover={{
                                                    borderColor: isCurrentEpisode ? '#00bcd4' : 'rgba(255, 255, 255, 0.5)',
                                                    background: isCurrentEpisode ? 'rgba(0, 188, 212, 0.12)' : 'rgba(255, 255, 255, 0.08)',
                                                    boxShadow: isCurrentEpisode ? '0 0 25px rgba(0, 188, 212, 0.3)' : '0 0 20px rgba(255, 255, 255, 0.1)'
                                                }}
                                                whileTap={{ scale: 0.99 }}
                                            >
                                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                                    {/* Thumbnail - Left Side */}
                                                    <div style={{
                                                        width: '140px',
                                                        flexShrink: 0,
                                                        aspectRatio: '16/9',
                                                        borderRadius: '8px',
                                                        overflow: 'hidden',
                                                        position: 'relative',
                                                        background: '#1a1a1a',
                                                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                                                    }}>
                                                        {episode.still_path ? (
                                                            <img
                                                                src={imageUrl(episode.still_path, 'w500')}
                                                                alt={episode.name}
                                                                style={{
                                                                    width: '100%',
                                                                    height: '100%',
                                                                    objectFit: 'cover'
                                                                }}
                                                            />
                                                        ) : (
                                                            <div style={{
                                                                width: '100%',
                                                                height: '100%',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontSize: '1.5rem',
                                                                opacity: 0.3
                                                            }}>📺</div>
                                                        )}

                                                        {/* Progress Bar (Fake for now) */}
                                                        {isCurrentEpisode && (
                                                            <div style={{
                                                                position: 'absolute',
                                                                bottom: 0,
                                                                left: 0,
                                                                right: 0,
                                                                height: '3px',
                                                                background: 'rgba(255,255,255,0.2)'
                                                            }}>
                                                                <div style={{
                                                                    width: '45%',
                                                                    height: '100%',
                                                                    background: '#00bcd4'
                                                                }} />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Content - Right Side */}
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.2rem' }}>
                                                            <h4 style={{
                                                                fontSize: '0.9rem',
                                                                fontWeight: '700',
                                                                color: isCurrentEpisode ? '#00bcd4' : 'white',
                                                                marginBottom: '0.2rem',
                                                                lineHeight: '1.2'
                                                            }}>
                                                                <span style={{ marginRight: '0.4rem', opacity: 0.7 }}>E{episode.episode_number}</span>
                                                                {episode.name}
                                                            </h4>
                                                        </div>

                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.75rem', color: '#fbbf24' }}>
                                                                <Star size={10} fill="#fbbf24" />
                                                                <span>{episode.vote_average?.toFixed(1)}</span>
                                                            </div>
                                                            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>•</span>
                                                            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                                                                {episode.air_date ? new Date(episode.air_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Unknown'}
                                                            </span>
                                                        </div>

                                                        <p style={{
                                                            fontSize: '0.75rem',
                                                            color: 'rgba(255,255,255,0.6)',
                                                            lineHeight: '1.4',
                                                            display: '-webkit-box',
                                                            WebkitLineClamp: 2,
                                                            lineClamp: 2,
                                                            WebkitBoxOrient: 'vertical',
                                                            overflow: 'hidden',
                                                            margin: 0
                                                        }}>
                                                            {episode.overview}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Action Button - Full Width Bottom */}
                                                {isCurrentEpisode && (
                                                    <motion.button
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        style={{
                                                            width: '100%',
                                                            padding: '0.6rem',
                                                            background: '#00bcd4',
                                                            border: 'none',
                                                            borderRadius: '8px',
                                                            color: 'black',
                                                            fontSize: '0.85rem',
                                                            fontWeight: '700',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            gap: '0.5rem',
                                                            marginTop: '0.2rem'
                                                        }}
                                                        whileHover={{ scale: 1.02, background: '#00acc1' }}
                                                        whileTap={{ scale: 0.98 }}
                                                    >
                                                        <Play size={14} fill="black" />
                                                        Continue Watching
                                                    </motion.button>
                                                )}
                                            </motion.div>
                                        );
                                    })
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div >
    );
};

export default EpisodesSidebar;
