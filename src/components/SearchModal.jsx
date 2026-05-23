import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { searchMulti, imageUrl } from '../api/tmdb';
import { useMovieModal } from '../context/MovieModalContext';
import Lenis from 'lenis';

const SearchModal = ({ isOpen, onClose }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeFilter, setActiveFilter] = useState('all');
    const navigate = useNavigate();
    const { openModal } = useMovieModal();

    const filterOptions = [
        { label: 'All', value: 'all' },
        { label: 'Movies', value: 'movie' },
        { label: 'TV Shows', value: 'tv' },
        { label: 'Action', value: 'action' },
        { label: 'Comedy', value: 'comedy' },
        { label: 'Crime', value: 'crime' },
    ];

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

    const resultsRef = useRef(null);
    const overlayRef = useRef(null);
    const lenisRef = useRef(null);

    // Trap and forward all scroll/wheel events globally to the .search-results scroller with local smooth Lenis engine
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };

        let lenisInstance = null;
        let rafId = null;

        const resultsEl = resultsRef.current;
        if (isOpen && resultsEl) {
            // Instantiate localized smooth scroller on search results container
            lenisInstance = new Lenis({
                wrapper: resultsEl,
                lerp: 0.1,
                duration: 1.5,
                smoothWheel: true,
            });
            lenisRef.current = lenisInstance;

            // Smooth animation frame loop
            const raf = (time) => {
                lenisInstance.raf(time);
                rafId = requestAnimationFrame(raf);
            };
            rafId = requestAnimationFrame(raf);
        }

        const handleWheel = (e) => {
            const resultsEl = resultsRef.current;
            const lenis = lenisRef.current;
            if (!resultsEl || !lenis) return;

            const isInsideResults = resultsEl.contains(e.target);
            if (isInsideResults) {
                // Inside results: let native/Lenis browser scrolling handle it natively
                // Stop propagation so that Lenis or root scroll listeners do not intercept it
                e.stopPropagation();
                return;
            }

            // Outside results (hovering over search input, header, overlay):
            // Forward scroll delta to our local smooth Lenis instance.
            let delta = e.deltaY;
            if (e.deltaMode === 1) { // Line mode
                delta *= 33;
            } else if (e.deltaMode === 2) { // Page mode
                delta *= window.innerHeight;
            } else if (Math.abs(delta) < 40) {
                // Scale trackpad precision/smooth-scroll deltas slightly to feel responsive when forwarded
                delta *= 2.5;
            }

            lenis.scrollTo(lenis.scroll + delta, { immediate: false });
            
            if (e.cancelable) e.preventDefault();
            e.stopPropagation();
        };

        let touchStartY = 0;
        const handleTouchStart = (e) => {
            if (e.touches.length > 0) {
                touchStartY = e.touches[0].clientY;
            }
        };

        const handleTouchMove = (e) => {
            const resultsEl = resultsRef.current;
            const lenis = lenisRef.current;
            if (!resultsEl || !lenis) return;

            const isInsideResults = resultsEl.contains(e.target);
            if (isInsideResults) {
                e.stopPropagation();
                return;
            }

            if (e.touches.length > 0) {
                const touchY = e.touches[0].clientY;
                const deltaY = touchStartY - touchY;
                touchStartY = touchY;
                lenis.scrollTo(lenis.scroll + deltaY * 1.5, { immediate: true });
            }
            if (e.cancelable) e.preventDefault();
            e.stopPropagation();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            window.addEventListener('wheel', handleWheel, { passive: false });
            window.addEventListener('touchstart', handleTouchStart, { passive: true });
            window.addEventListener('touchmove', handleTouchMove, { passive: false });

            // Lock scroll and compensate for scrollbar width on body to prevent layout shifting
            const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
            document.body.style.paddingRight = `${scrollbarWidth}px`;
            
            // Add global no-scroll utility to html, body, and the root wrapper
            document.documentElement.classList.add('no-scroll');
            document.body.classList.add('no-scroll');
            const rootEl = document.getElementById('root');
            if (rootEl) {
                rootEl.classList.add('no-scroll');
            }
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            window.removeEventListener('wheel', handleWheel);
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchmove', handleTouchMove);

            if (lenisInstance) {
                lenisInstance.destroy();
                lenisRef.current = null;
            }
            if (rafId) {
                cancelAnimationFrame(rafId);
            }

            // Restore scrolling and clean up classes and padding
            document.body.style.paddingRight = '';
            document.documentElement.classList.remove('no-scroll');
            document.body.classList.remove('no-scroll');
            const rootEl = document.getElementById('root');
            if (rootEl) {
                rootEl.classList.remove('no-scroll');
            }
        };
    }, [isOpen, onClose]);

    const handleCardClick = (item) => {
        if (item.media_type === 'movie') {
            openModal(item.id, 'movie');
            onClose();
            setSearchQuery('');
            setResults([]);
        } else if (item.media_type === 'tv') {
            openModal(item.id, 'tv');
            onClose();
            setSearchQuery('');
            setResults([]);
        }
    };

    const getFilteredResults = () => {
        return results.filter(item => {
            if (activeFilter === 'all') return true;
            if (activeFilter === 'movie') return item.media_type === 'movie';
            if (activeFilter === 'tv') return item.media_type === 'tv';

            const genreIds = item.genre_ids || [];
            if (activeFilter === 'action') return genreIds.includes(28) || genreIds.includes(10759);
            if (activeFilter === 'comedy') return genreIds.includes(35);
            if (activeFilter === 'crime') return genreIds.includes(80);

            return true;
        });
    };

    const displayResults = getFilteredResults();

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={overlayRef}
                    className="search-modal-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    data-lenis-prevent
                >
                    <motion.div
                        className="search-modal-content"
                        initial={{ scale: 0.9, opacity: 0, y: -20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: -20 }}
                        onClick={(e) => e.stopPropagation()}
                        data-lenis-prevent
                    >
                        {/* Header */}
                        <div className="search-modal-header" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                                <div className="search-input-wrapper" style={{ flex: 1, marginBottom: 0 }}>
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
                                <button onClick={onClose} className="search-close-btn" style={{ marginLeft: '1rem' }}>
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Filters Row */}
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                style={{
                                    display: 'flex', gap: '10px', width: '100%', marginTop: '1rem',
                                    overflowX: 'auto', paddingBottom: '5px', scrollbarWidth: 'none',
                                    WebkitOverflowScrolling: 'touch'
                                }}
                            >
                                {filterOptions.map(option => (
                                    <button
                                        key={option.value}
                                        onClick={() => setActiveFilter(option.value)}
                                        style={{
                                            padding: '6px 14px',
                                            borderRadius: '20px',
                                            border: `1px solid ${activeFilter === option.value ? '#e50914' : 'rgba(255,255,255,0.15)'}`,
                                            background: activeFilter === option.value ? 'rgba(229, 9, 20, 0.15)' : 'rgba(255,255,255,0.05)',
                                            color: activeFilter === option.value ? '#e50914' : 'rgba(255,255,255,0.7)',
                                            fontSize: '0.85rem',
                                            fontWeight: activeFilter === option.value ? 'bold' : 'normal',
                                            cursor: 'pointer',
                                            whiteSpace: 'nowrap',
                                            transition: 'all 0.2s ease',
                                        }}
                                        onMouseEnter={(e) => {
                                            if (activeFilter !== option.value) {
                                                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (activeFilter !== option.value) {
                                                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                            }
                                        }}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </motion.div>
                        </div>

                        {/* Results */}
                        <div className="search-results" ref={resultsRef}>
                            {loading && (
                                <div className="search-loading">
                                    <div className="spinner"></div>
                                    <p>Searching...</p>
                                </div>
                            )}

                            {!loading && searchQuery && displayResults.length === 0 && (
                                <div className="search-empty">
                                    <p>No results found for "{searchQuery}" matching that filter.</p>
                                </div>
                            )}

                            {!loading && displayResults.length > 0 && (
                                <div className="search-grid">
                                    {displayResults.map((item) => (
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
