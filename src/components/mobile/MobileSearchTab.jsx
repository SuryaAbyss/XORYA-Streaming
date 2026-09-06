import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Star, Plus, Check } from 'lucide-react';
import { tmdb, imageUrl } from '../../api/tmdb';
import { useMovieModal } from '../../context/MovieModalContext';
import { useWatchlist } from '../../hooks/useWatchlist';

const POPULAR_SEARCHES = ['Dune', 'Oppenheimer', 'Blade Runner', 'Interstellar', 'The Batman', 'Sci-Fi'];

const MobileSearchTab = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  const { openModal } = useMovieModal();
  const { entries, addEntry, removeEntry, tiers } = useWatchlist();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await tmdb.get('/search/multi', {
          params: { query: query.trim(), page: 1, include_adult: false },
        });
        const filtered = (res.data?.results || []).filter(
          (item) => (item.media_type === 'movie' || item.media_type === 'tv') && (item.poster_path || item.backdrop_path)
        );
        setResults(filtered);
      } catch (err) {
        console.error('Search query failed:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="w-full px-4 pt-14 pb-32">
      {/* Search Input */}
      <div className="relative mb-5">
        <div
          className="liquid-glass rounded-2xl px-4 py-3 flex items-center gap-3 border border-white/10 shadow-xl"
          style={{
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            backgroundColor: 'rgba(20, 24, 34, 0.85)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <Search className="w-4 h-4 text-neutral-400" style={{ width: '16px', height: '16px', color: '#94a3b8' }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search titles, directors, actors..."
            className="w-full bg-transparent text-white text-xs focus:outline-none placeholder:text-neutral-400 font-refra-body"
            style={{ width: '100%', background: 'transparent', border: 'none', color: '#ffffff', fontSize: '13px', outline: 'none' }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 text-neutral-400 hover:text-white cursor-pointer bg-transparent border-0"
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Suggested Tags (When query is empty) */}
      {!query && (
        <div className="mt-4">
          <h3
            className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-3"
            style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em' }}
          >
            POPULAR SEARCHES
          </h3>
          <div className="flex flex-wrap gap-2" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {POPULAR_SEARCHES.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setQuery(tag)}
                className="liquid-glass px-3.5 py-1.5 rounded-full text-xs font-medium text-neutral-300 hover:text-white border border-white/10 cursor-pointer active:scale-95 transition-all"
                style={{
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  backgroundColor: 'rgba(30, 36, 48, 0.7)',
                  borderRadius: '9999px',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  padding: '6px 14px',
                  fontSize: '12px',
                  color: '#e2e8f0',
                  cursor: 'pointer',
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-2 gap-3 mt-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-[#14161d] rounded-2xl animate-pulse" style={{ aspectRatio: '2 / 3', borderRadius: '16px', backgroundColor: '#14161d' }} />
          ))}
        </div>
      )}

      {/* Results grid */}
      {!loading && results.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mt-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          {results.map((item) => {
            const mediaType = item.media_type || (item.title ? 'movie' : 'tv');
            const title = item.title || item.name || 'Untitled';
            const year = (item.release_date || item.first_air_date || '').slice(0, 4);
            const rating = item.vote_average ? item.vote_average.toFixed(1) : null;
            const poster = imageUrl(item.poster_path || item.backdrop_path, 'w500');
            const isSaved = entries.some((e) => String(e.tmdbId) === String(item.id));

            const handleWatchlist = (e) => {
              e.stopPropagation();
              if (isSaved) {
                const entry = entries.find((e) => String(e.tmdbId) === String(item.id));
                if (entry) removeEntry(entry.id);
              } else {
                const defaultTier = tiers[0]?.id || 'tier_must';
                addEntry(defaultTier, {
                  tmdbId: item.id,
                  type: mediaType,
                  title,
                  poster: item.poster_path,
                  backdrop: item.backdrop_path,
                  year,
                  rating: rating || '0.0',
                });
              }
            };

            return (
              <div
                key={item.id}
                onClick={() => openModal(item.id, mediaType)}
                className="aspect-[2/3] bg-[#14161d] rounded-2xl overflow-hidden shadow-lg relative group mobile-card-touch border border-white/[0.06] cursor-pointer"
                style={{ aspectRatio: '2 / 3', borderRadius: '16px', overflow: 'hidden', position: 'relative', cursor: 'pointer' }}
              >
                <img
                  src={poster}
                  alt={title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                <div className="absolute inset-0 pointer-events-none" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0c0d10 0%, rgba(12, 13, 16, 0.4) 50%, transparent 100%)' }} />
                <div className="absolute inset-x-0 bottom-0 h-1/2 pointer-events-none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '50%', background: 'linear-gradient(to top, rgba(12, 13, 16, 0.95) 0%, rgba(12, 13, 16, 0.6) 50%, transparent 100%)' }} />

                <button
                  type="button"
                  onClick={handleWatchlist}
                  className="absolute top-2 right-2 p-1.5 rounded-full shadow-md z-10 liquid-glass border border-white/10"
                  style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 10, borderRadius: '9999px', padding: '6px', background: isSaved ? 'rgba(0, 206, 201, 0.25)' : 'rgba(30, 39, 46, 0.65)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer' }}
                >
                  {isSaved ? <Check className="w-3.5 h-3.5 text-[#00CEC9]" style={{ width: '14px', height: '14px' }} /> : <Plus className="w-3.5 h-3.5 text-white" style={{ width: '14px', height: '14px' }} />}
                </button>

                <div className="absolute inset-x-0 bottom-0 p-2.5 z-10 pointer-events-none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '10px' }}>
                  <h4 className="text-xs font-semibold text-white truncate leading-tight drop-shadow-sm font-refra-body" style={{ fontSize: '12px', color: '#fff', fontWeight: 600 }}>
                    {title}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[10px] text-neutral-300 mt-0.5" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: '#cbd5e1' }}>
                    {rating && (
                      <span className="flex items-center gap-1 font-medium text-white" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" style={{ width: '10px', height: '10px' }} />
                        {rating}
                      </span>
                    )}
                    {rating && year && <span>•</span>}
                    {year && <span>{year}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* No results */}
      {!loading && query && results.length === 0 && (
        <div className="text-center py-12 text-neutral-400">
          <p className="text-sm">No titles found for &ldquo;{query}&rdquo;</p>
          <p className="text-xs text-neutral-500 mt-1">Try another keyword or category</p>
        </div>
      )}
    </div>
  );
};

export default MobileSearchTab;
