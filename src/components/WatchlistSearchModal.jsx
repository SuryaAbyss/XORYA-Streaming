import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Film, Tv, Plus, Check } from 'lucide-react';
import { searchMulti, imageUrl } from '../api/tmdb';
import Lenis from 'lenis';

const WatchlistSearchModal = ({ isOpen, onClose, tierId, tierName, tierColor, onAdd, existingIds = [] }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addedIds, setAddedIds] = useState(new Set());
  const inputRef = useRef(null);
  const debounceRef = useRef(null);
  const resultsRef = useRef(null);
  const lenisRef = useRef(null);

  // Trap and forward all scroll/wheel events globally to the .wl-search-results scroller with local smooth Lenis engine
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    let lenisInstance = null;
    let rafId = null;

    const resultsEl = resultsRef.current;
    if (isOpen && resultsEl) {
      // Instantiate localized smooth scroller on watchlist search results container
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

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setAddedIds(new Set());
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchMulti(query);
        const filtered = (data.results || []).filter(
          r => (r.media_type === 'movie' || r.media_type === 'tv') && r.poster_path
        ).slice(0, 20);
        setResults(filtered);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const handleAdd = (item) => {
    const media = {
      tmdbId: item.id,
      type: item.media_type,
      title: item.media_type === 'movie' ? item.title : item.name,
      poster: item.poster_path,
      backdrop: item.backdrop_path,
      year: (item.release_date || item.first_air_date || '').slice(0, 4),
      rating: item.vote_average?.toFixed(1),
    };
    onAdd(tierId, media);
    setAddedIds(prev => new Set(prev).add(item.id));
  };

  const alreadyAdded = (item) => existingIds.includes(item.id) || addedIds.has(item.id);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="wl-search-overlay"
          onClick={(e) => e.target === e.currentTarget && onClose()}
          data-lenis-prevent
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="wl-search-modal"
            data-lenis-prevent
          >
            {/* Header */}
            <div className="wl-search-header">
              <div className="wl-search-tier-badge" style={{ background: tierColor + '22', borderColor: tierColor + '55' }}>
                <span style={{ color: tierColor, fontWeight: 700, fontSize: '0.85rem' }}>{tierName}</span>
              </div>
              <h3 className="wl-search-title">Add to Watchlist</h3>
              <button className="wl-search-close" onClick={onClose}><X size={18} /></button>
            </div>

            {/* Input */}
            <div className="wl-search-input-wrap">
              <Search size={18} className="wl-search-icon" />
              <input
                ref={inputRef}
                className="wl-search-input"
                placeholder="Search movies or TV shows…"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
              {query && (
                <button className="wl-search-clear" onClick={() => setQuery('')}>
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Results */}
            <div className="wl-search-results" ref={resultsRef}>
              {loading && (
                <div className="wl-search-state">
                  <div className="wl-spinner" />
                  <span>Searching…</span>
                </div>
              )}
              {!loading && query && results.length === 0 && (
                <div className="wl-search-state">
                  <span>No results found</span>
                </div>
              )}
              {!loading && !query && (
                <div className="wl-search-state">
                  <span>Start typing to search</span>
                </div>
              )}
              {!loading && results.length > 0 && (
                <div className="wl-search-grid">
                  {results.map(item => {
                    const title = item.media_type === 'movie' ? item.title : item.name;
                    const year = (item.release_date || item.first_air_date || '').slice(0, 4);
                    const added = alreadyAdded(item);
                    return (
                      <motion.div
                        key={item.id}
                        className={`wl-search-card ${added ? 'added' : ''}`}
                        whileHover={{ scale: 1.03, y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => !added && handleAdd(item)}
                      >
                        <div className="wl-search-card-img">
                          <img src={imageUrl(item.poster_path, 'w300')} alt={title} loading="lazy" />
                          <div className="wl-search-card-type">
                            {item.media_type === 'movie' ? <Film size={10} /> : <Tv size={10} />}
                            <span>{item.media_type === 'movie' ? 'Movie' : 'TV'}</span>
                          </div>
                          {added && (
                            <div className="wl-search-card-added">
                              <Check size={20} />
                            </div>
                          )}
                        </div>
                        <div className="wl-search-card-info">
                          <p className="wl-search-card-title">{title}</p>
                          <p className="wl-search-card-meta">{year} {item.vote_average > 0 && `· ⭐ ${item.vote_average.toFixed(1)}`}</p>
                          <button
                            className="wl-search-add-btn"
                            style={{ background: added ? '#1a1a1a' : tierColor + '22', color: added ? '#555' : tierColor, borderColor: tierColor + '44' }}
                            onClick={(e) => { e.stopPropagation(); !added && handleAdd(item); }}
                          >
                            {added ? <><Check size={12} /> Added</> : <><Plus size={12} /> Add</>}
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WatchlistSearchModal;
