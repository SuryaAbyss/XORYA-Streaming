import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { searchMulti, imageUrl } from '../api/tmdb';
import { useMovieModal } from '../context/MovieModalContext';

const SearchModal = ({ isOpen, onClose }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { openModal } = useMovieModal();

    // Debounced search function
    const performSearch = useCallback(async (query) => {
        if (!query || query.trim().length < 2) {
            setResults([]);
            return;
        }

        setLoading(true);
        try {
            const data = await searchMulti(query);
            // Filter to only movies and TV shows
            const filtered = data.results.filter(
                item => item.media_type === 'movie' || item.media_type === 'tv'
            );
            setResults(filtered);
        } catch (error) {
            console.error('Search error:', error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Debounce effect
    useEffect(() => {
        const timer = setTimeout(() => {
            performSearch(searchQuery);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, performSearch]);

    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    const handleCardClick = (item) => {
        if (item.media_type === 'movie') {
            openModal(item.id);
            onClose();
            setSearchQuery('');
            setResults([]);
        } else if (item.media_type === 'tv') {
            // Navigate to TV show video player page (Season 1, Episode 1)
            navigate(`/watch/tv/${item.id}/season/1/episode/1`);
            onClose();
            setSearchQuery('');
            setResults([]);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="search-modal-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="search-modal-content"
                        initial={{ scale: 0.9, opacity: 0, y: -20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: -20 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="search-modal-header">
                            <div className="search-input-wrapper">
                                <Search size={20} className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search for movies and TV shows..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="search-input"
                                    autoFocus
                                />
                            </div>
                            <button onClick={onClose} className="search-close-btn">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Results */}
                        <div className="search-results">
                            {loading && (
                                <div className="search-loading">
                                    <div className="spinner"></div>
                                    <p>Searching...</p>
                                </div>
                            )}

                            {!loading && searchQuery && results.length === 0 && (
                                <div className="search-empty">
                                    <p>No results found for "{searchQuery}"</p>
                                </div>
                            )}

                            {!loading && results.length > 0 && (
                                <div className="search-grid">
                                    {results.map((item) => (
                                        <motion.div
                                            key={`${item.media_type}-${item.id}`}
                                            className="search-card"
                                            onClick={() => handleCardClick(item)}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            whileHover={{ scale: 1.05 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <div className="search-card-image">
                                                {item.poster_path ? (
                                                    <img
                                                        src={imageUrl(item.poster_path, 'w300')}
                                                        alt={item.title || item.name}
                                                        loading="lazy"
                                                    />
                                                ) : (
                                                    <div className="search-card-no-image">
                                                        {item.media_type === 'movie' ? '🎬' : '📺'}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="search-card-info">
                                                <h3>{item.title || item.name}</h3>
                                                <p className="search-card-meta">
                                                    {item.media_type === 'movie' ? 'Movie' : 'TV Show'}
                                                    {item.release_date || item.first_air_date ? (
                                                        <> • {(item.release_date || item.first_air_date).split('-')[0]}</>
                                                    ) : null}
                                                </p>
                                                {item.vote_average > 0 && (
                                                    <p className="search-card-rating">
                                                        ⭐ {item.vote_average.toFixed(1)}
                                                    </p>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}

                            {!loading && !searchQuery && (
                                <div className="search-empty">
                                    <Search size={48} style={{ opacity: 0.3 }} />
                                    <p>Start typing to search for movies and TV shows</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SearchModal;
