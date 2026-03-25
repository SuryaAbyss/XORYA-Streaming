import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Film, Tv, Plus, Check } from 'lucide-react';
import { searchMulti, imageUrl } from '../api/tmdb';

const WatchlistSearchModal = ({ isOpen, onClose, tierId, tierName, tierColor, onAdd, existingIds = [] }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addedIds, setAddedIds] = useState(new Set());
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

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
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="wl-search-modal"
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
            <div className="wl-search-results">
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
