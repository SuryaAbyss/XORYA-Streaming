import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { imageUrl } from '../api/tmdb';
import { Play, Star, Eye, Bookmark, ChevronRight } from 'lucide-react';
import { useMovieModal } from '../context/MovieModalContext';
import { motion } from 'framer-motion';

const InteractiveMovieCard = ({ movie }) => {
    const { openModal } = useMovieModal();
    const [isHovered, setIsHovered] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [rect, setRect] = useState(null);
    const timerRef = useRef(null);
    const cardRef = useRef(null);

    const handleMouseEnter = () => {
        setIsHovered(true);
        // Start exactly 3s timer for the detail popup
        timerRef.current = setTimeout(() => {
            if (cardRef.current) {
                setRect(cardRef.current.getBoundingClientRect());
                setShowDetails(true);
            }
        }, 1500);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        if (timerRef.current) clearTimeout(timerRef.current);
        setShowDetails(false);
    };

    const handleClick = (e) => {
        e.stopPropagation();
        const mediaType = movie.media_type || (movie.name ? 'tv' : 'movie');
        openModal(movie.id, mediaType);
    };

    return (
        <>
            <motion.div
                ref={cardRef}
                variants={{
                    hidden: { opacity: 0, x: 50 },
                    visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } }
                }}
                whileHover={{ scale: 1.15, zIndex: 10, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] } }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onClick={handleClick}
                style={{
                    minWidth: '300px',
                    height: '170px',
                    position: 'relative',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: isHovered ? '0 12px 40px rgba(0,0,0,0.7)' : 'none',
                    backgroundColor: '#1a1a1a'
                }}
            >
                {/* Poster Image - always visible */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 1,
                    zIndex: 1
                }}>
                    <img
                        src={imageUrl(movie.backdrop_path, 'w500')}
                        alt={movie.title || movie.name}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                        }}
                    />
                    {/* Gradient overlay */}
                    <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '50%',
                        background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)',
                        display: 'flex',
                        alignItems: 'flex-end',
                        padding: '1rem'
                    }}>
                        <h3 style={{
                            color: '#fff',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            margin: 0,
                            textShadow: '0 2px 8px rgba(0,0,0,0.8)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}>
                            {movie.title || movie.name}
                        </h3>
                    </div>
                </div>

                {/* Play Button Overlay - shows on hover */}
                {isHovered && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 3,
                        background: 'rgba(0,0,0,0.4)',
                        transition: 'all 0.3s ease',
                        pointerEvents: 'none'
                    }}>
                        <div style={{
                            width: '50px',
                            height: '50px',
                            borderRadius: '50%',
                            background: 'rgba(255, 255, 255, 0.15)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                            transition: 'all 0.3s ease',
                            animation: 'pulse 2s infinite'
                        }}>
                            <Play fill="white" color="white" size={24} style={{ marginLeft: '3px' }} />
                        </div>
                    </div>
                )}

                {/* CSS for animations */}
                <style>{`
                    @keyframes pulse {
                        0%, 100% { transform: scale(1); opacity: 1; }
                        50% { transform: scale(1.05); opacity: 0.9; }
                    }
                    @keyframes fadeInScale {
                        0% { opacity: 0; transform: scale(0.95); }
                        100% { opacity: 1; transform: scale(1); }
                    }
                `}</style>
            </motion.div>

            {/* Hover Data Popup Modal that breaks out using React Portal */}
            {showDetails && rect && createPortal(
                <div
                    onClick={handleClick}
                    onMouseEnter={() => { if (timerRef.current) clearTimeout(timerRef.current); setShowDetails(true); setIsHovered(true); }}
                    onMouseLeave={handleMouseLeave}
                    style={{
                        position: 'fixed',
                        top: `${Math.max(10, rect.top - (300 - rect.height) / 2)}px`,
                        left: `${Math.max(10, Math.min(window.innerWidth - 390, rect.left - (380 - rect.width) / 2))}px`,
                        width: '380px',
                        height: '300px',
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(20, 20, 20, 0.6) 100%)',
                        backdropFilter: 'blur(30px)',
                        WebkitBackdropFilter: 'blur(30px)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '16px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                        zIndex: 99999,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        cursor: 'pointer',
                        animation: 'fadeInScale 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards'
                    }}
                >
                    {/* Top image half */}
                    <div style={{ height: '170px', position: 'relative', flexShrink: 0 }}>
                        <img
                            src={imageUrl(movie.poster_path || movie.backdrop_path, 'w500')}
                            alt={movie.title || movie.name}
                            style={{
                                width: '100%', height: '100%', objectFit: 'cover',
                                maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)',
                                WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)'
                            }}
                        />
                        <div style={{
                            position: 'absolute', bottom: 0, left: 0, right: 0, height: '100%',
                            background: 'linear-gradient(to top, rgba(0, 0, 0, 0.6) 0%, transparent 60%)'
                        }} />
                        <h2 style={{
                            position: 'absolute', bottom: '10px', left: '16px', right: '16px',
                            color: 'white', fontSize: '1.4rem', fontWeight: 'bold', margin: 0,
                            textShadow: '0 2px 10px rgba(0,0,0,0.8)', lineHeight: '1.1'
                        }}>
                            {movie.title || movie.name}
                        </h2>
                    </div>

                    {/* Bottom Details Half */}
                    <div style={{ padding: '0 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', margin: '10px 0 6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.08)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.85rem', color: '#fff', fontWeight: 'bold' }}>
                                <Star size={13} fill="#fbbf24" color="#fbbf24" /> {movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}
                            </div>
                            {movie.popularity && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.08)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.85rem', color: '#fff', fontWeight: 'bold' }}>
                                    <Eye size={13} color="#38bdf8" />
                                    {movie.popularity > 1000
                                        ? `${(movie.popularity / 1000).toFixed(1)}K`
                                        : Math.round(movie.popularity)}
                                </div>
                            )}
                        </div>

                        <p style={{
                            color: '#e2e8f0', fontSize: '0.85rem', lineHeight: '1.4', margin: '0 0 10px',
                            overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
                        }}>
                            {movie.overview || "No description available for this title."}
                        </p>

                        <div style={{ marginTop: 'auto', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowDetails(false);
                                    const mediaType = movie.media_type || (movie.name ? 'tv' : 'movie');
                                    openModal(movie.id, mediaType);
                                }}
                                style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.08)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '25px', padding: '10px 0', fontSize: '0.9rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'; e.currentTarget.style.transform = 'scale(1.02)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.transform = 'scale(1)'; }}
                            >
                                Details <ChevronRight size={14} />
                            </button>
                            <button
                                onClick={(e) => e.stopPropagation()}
                                style={{ width: '38px', height: '38px', flexShrink: 0, borderRadius: '50%', background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.12)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.transform = 'scale(1)'; }}
                            >
                                <Star size={15} />
                            </button>
                            <button
                                onClick={(e) => e.stopPropagation()}
                                style={{ width: '38px', height: '38px', flexShrink: 0, borderRadius: '50%', background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.12)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.transform = 'scale(1)'; }}
                            >
                                <Bookmark size={15} />
                            </button>
                        </div>
                    </div>
                </div >,
                document.body
            )}
        </>
    );
};

export default InteractiveMovieCard;
