import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, DollarSign, Globe, Star, Users, Film, AlignLeft, Info } from 'lucide-react';
import shinyPill from './ShinyPill'; // Assuming this exists or similar

const MovieInfoSidebar = ({ movie }) => {
    const [activeTab, setActiveTab] = useState('overview');

    if (!movie) return null;

    const tabs = [
        { id: 'overview', label: 'Overview', icon: AlignLeft },
        { id: 'cast', label: 'Cast', icon: Users },
        { id: 'details', label: 'Details', icon: Info },
    ];

    const formatCurrency = (amount) => {
        if (!amount) return 'N/A';
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    const formatRuntime = (minutes) => {
        if (!minutes) return 'N/A';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{
                background: 'rgba(20, 20, 20, 0.4)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRadius: '24px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                height: 'calc(100vh - 120px)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                color: 'white'
            }}
        >
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
            >
                <h2 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '0.5rem', lineHeight: '1.2' }}>
                    {movie.title}
                </h2>
                {movie.tagline && (
                    <p style={{
                        fontSize: '1rem',
                        color: 'rgba(255,255,255,0.6)',
                        fontStyle: 'italic',
                        marginBottom: '1rem'
                    }}>
                        "{movie.tagline}"
                    </p>
                )}

                <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.3rem',
                        background: 'rgba(255, 215, 0, 0.15)', px: '0.6rem', py: '0.3rem',
                        borderRadius: '8px', padding: '0.3rem 0.6rem', border: '1px solid rgba(255, 215, 0, 0.3)'
                    }}>
                        <Star size={14} color="#ffd700" fill="#ffd700" />
                        <span style={{ color: '#ffd700', fontWeight: 'bold', fontSize: '0.9rem' }}>
                            {movie.vote_average?.toFixed(1)}
                        </span>
                    </div>
                    {movie.genres?.map(g => (
                        <span key={g.id} style={{
                            padding: '0.3rem 0.8rem',
                            background: 'rgba(255,255,255,0.1)',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            {g.name}
                        </span>
                    ))}
                </div>
            </motion.div>

            {/* Tabs */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                style={{
                    display: 'flex',
                    gap: '0.5rem',
                    padding: '1rem 1.5rem',
                    borderBottom: '1px solid rgba(255,255,255,0.05)'
                }}
            >
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            flex: 1,
                            padding: '0.6rem',
                            borderRadius: '12px',
                            border: 'none',
                            background: activeTab === tab.id ? 'rgba(255,255,255,0.15)' : 'transparent',
                            color: activeTab === tab.id ? 'white' : 'rgba(255,255,255,0.5)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </motion.div>

            {/* Content Area */}
            <div style={{
                padding: '1.5rem',
                overflowY: 'auto',
                flex: 1,

                // Custom Scrollbar
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(255,255,255,0.2) transparent'
            }}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                    >
                        {activeTab === 'overview' && (
                            <div>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <AlignLeft size={18} color="#00bcd4" />
                                    Synopsis
                                </h3>
                                <p style={{ lineHeight: '1.6', color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem' }}>
                                    {movie.overview}
                                </p>
                            </div>
                        )}

                        {activeTab === 'cast' && (
                            <div>
                                {movie.credits?.cast?.length > 0 ? (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '1rem' }}>
                                        {movie.credits.cast.slice(0, 12).map(person => (
                                            <div key={person.id} style={{ textAlign: 'center' }}>
                                                <div style={{
                                                    width: '61px', height: '62px',
                                                    borderRadius: '15px',
                                                    overflow: 'hidden',
                                                    margin: '0 auto 0.5rem',
                                                    border: '2px solid rgba(255,255,255,0.1)'
                                                }}>
                                                    {person.profile_path ? (
                                                        <img
                                                            src={`https://image.tmdb.org/t/p/w200${person.profile_path}`}
                                                            alt={person.name}
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        />
                                                    ) : (
                                                        <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <Users size={20} color="rgba(255,255,255,0.3)" />
                                                        </div>
                                                    )}
                                                </div>
                                                <p style={{ fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {person.name}
                                                </p>
                                                <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {person.character}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>No cast information available.</p>
                                )}
                            </div>
                        )}

                        {activeTab === 'details' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.8rem' }}>
                                    <span style={{ color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Calendar size={16} /> Release Date
                                    </span>
                                    <span>{movie.release_date}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.8rem' }}>
                                    <span style={{ color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Clock size={16} /> Runtime
                                    </span>
                                    <span>{formatRuntime(movie.runtime)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.8rem' }}>
                                    <span style={{ color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <DollarSign size={16} /> Budget
                                    </span>
                                    <span>{formatCurrency(movie.budget)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.8rem' }}>
                                    <span style={{ color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <DollarSign size={16} /> Revenue
                                    </span>
                                    <span>{formatCurrency(movie.revenue)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.8rem' }}>
                                    <span style={{ color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Globe size={16} /> Language
                                    </span>
                                    <span style={{ textTransform: 'uppercase' }}>{movie.original_language}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.8rem' }}>
                                    <span style={{ color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Film size={16} /> Status
                                    </span>
                                    <span>{movie.status}</span>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default MovieInfoSidebar;
