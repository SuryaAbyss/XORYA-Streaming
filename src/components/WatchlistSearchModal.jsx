import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Film, Tv, Plus, Check } from 'lucide-react';
import { imageUrl } from '../api/tmdb';
import { enhancedSearch, initializeSearchCache, getRecommendedSearchContent } from '../utils/searchEngine';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';

const WatchlistSearchModal = ({ isOpen, onClose, tierId, tierName, tierColor, onAdd, existingIds = [] }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addedIds, setAddedIds] = useState(new Set());
  const [recommended, setRecommended] = useState([]);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);
  const resultsRef = useRef(null);
  const lenisRef = useRef(null);

  const overlayRef = useRef(null);
  const containerRef = useRef(null);
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);

  // Watch isOpen prop to trigger GSAP entrance or exit
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
    } else if (shouldRender && !isClosing) {
      setIsClosing(true);
      const tl = gsap.timeline({
        onComplete: () => {
          setShouldRender(false);
          setIsClosing(false);
        }
      });
      tl.to(containerRef.current, { scale: 0.95, y: 20, opacity: 0, duration: 0.25, ease: "power3.in" })
        .to(overlayRef.current, { opacity: 0, duration: 0.2 }, "-=0.15");
    }
  }, [isOpen]);

  // Entrance animation
  useGSAP(() => {
    if (isOpen && shouldRender && !isClosing) {
      const tl = gsap.timeline();
      tl.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3 })
        .fromTo(containerRef.current,
          { scale: 0.95, y: 20, opacity: 0 },
          { scale: 1, y: 0, opacity: 1, duration: 0.45, ease: "power4.out" },
          "-=0.15"
        );
    }
  }, [isOpen, shouldRender]);

  // Stagger cards when search results or recommended lists load
  useGSAP(() => {
    if (!loading && shouldRender && containerRef.current) {
      const cards = containerRef.current.querySelectorAll('.wl-search-card');
      if (cards && cards.length > 0) {
        gsap.fromTo(cards,
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.4, stagger: 0.03, ease: "power3.out", overwrite: "auto" }
        );
      }
    }
  }, [results.length, recommended.length, loading, shouldRender]);

  // Trap and forward all scroll/wheel events globally
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    let lenisInstance = null;
    let rafId = null;

    const resultsEl = resultsRef.current;
    if (shouldRender && resultsEl) {
      lenisInstance = new Lenis({
        wrapper: resultsEl,
        lerp: 0.1,
        duration: 1.5,
        smoothWheel: true,
      });
      lenisRef.current = lenisInstance;

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
        e.stopPropagation();
        return;
      }

      let delta = e.deltaY;
      if (e.deltaMode === 1) delta *= 33;
      else if (e.deltaMode === 2) delta *= window.innerHeight;
      else if (Math.abs(delta) < 40) delta *= 2.5;

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

    if (shouldRender) {
      document.addEventListener('keydown', handleEscape);
      window.addEventListener('wheel', handleWheel, { passive: false });
      window.addEventListener('touchstart', handleTouchStart, { passive: true });
      window.addEventListener('touchmove', handleTouchMove, { passive: false });

      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      
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

      document.body.style.paddingRight = '';
      document.documentElement.classList.remove('no-scroll');
      document.body.classList.remove('no-scroll');
      const rootEl = document.getElementById('root');
      if (rootEl) {
        rootEl.classList.remove('no-scroll');
      }
    };
  }, [shouldRender, onClose]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setAddedIds(new Set());
      setTimeout(() => inputRef.current?.focus(), 100);
      initializeSearchCache().then(() => {
        setRecommended(getRecommendedSearchContent().slice(0, 8));
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await enhancedSearch(query);
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

  if (!shouldRender) return null;

  return (
    <div
      ref={overlayRef}
      style={{ opacity: 0 }}
      className="wl-search-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      data-lenis-prevent
    >
      <div
        ref={containerRef}
        style={{ opacity: 0, transform: 'translateY(20px) scale(0.95)' }}
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
              <span>No exact matches found. Showing recommendations:</span>
            </div>
          )}
          {!loading && query && results.length === 0 && (
            <div className="wl-search-grid" style={{ marginTop: '1rem' }}>
              {recommended.map(item => {
                const title = item.media_type === 'movie' ? item.title : item.name;
                const year = (item.release_date || item.first_air_date || '').slice(0, 4);
                const added = alreadyAdded(item);
                return (
                  <div
                    key={`rec-${item.id}`}
                    className={`wl-search-card ${added ? 'added' : ''}`}
                    onClick={() => !added && handleAdd(item)}
                    style={{ opacity: 0, transform: 'translateY(15px)' }}
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
                  </div>
                );
              })}
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
                  <div
                    key={item.id}
                    className={`wl-search-card ${added ? 'added' : ''}`}
                    onClick={() => !added && handleAdd(item)}
                    style={{ opacity: 0, transform: 'translateY(15px)' }}
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
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WatchlistSearchModal;
