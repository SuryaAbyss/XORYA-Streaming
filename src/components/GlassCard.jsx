import React from 'react';
import { motion } from 'framer-motion';
import { imageUrl } from '../api/tmdb';

const GlassCard = ({ movie, onClick }) => {
    return (
        <motion.div
            className="glass-card"
            whileHover={{ scale: 1.4, zIndex: 100, y: -10 }}
            transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
            onClick={() => onClick && onClick(movie)}
            style={{
                width: '300px',
                height: '169px', // True 16:9
                borderRadius: '8px', // Sharper corners
                overflow: 'hidden',
                position: 'relative',
                cursor: 'pointer',
                flexShrink: 0,
                boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
                background: '#1a1a1a'
            }}
        >
            <img
                src={imageUrl(movie.backdrop_path || movie.poster_path, 'w780')}
                alt={movie.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                loading="lazy"
            />

            {/* Minimalist Overlay - Only on Hover (conceptually, but kept visible for usability) */}
            <div
                style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: '100%',
                    padding: '10px 15px',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, transparent 100%)'
                }}
            >
                <h3 style={{
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    color: '#fff',
                    textShadow: '0 1px 4px rgba(0,0,0,0.8)'
                }}>
                    {movie.title}
                </h3>
            </div>
        </motion.div>
    );
};

export default GlassCard;
