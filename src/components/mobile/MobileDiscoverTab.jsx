import React, { useState, useEffect } from 'react';
import { Sparkles, Flame, Award, Clapperboard, Film, ArrowLeft, Star, Plus, Check } from 'lucide-react';
import { tmdb, imageUrl } from '../../api/tmdb';
import { useMovieModal } from '../../context/MovieModalContext';
import { useWatchlist } from '../../hooks/useWatchlist';

const COLLECTIONS = [
  { id: 'sci-fi', genreId: 878, title: 'Sci-Fi', desc: 'Cosmic scale & synthetic horizons', films: '14 films', icon: Sparkles },
  { id: 'neo-noir', genreId: 80, title: 'Neo-Noir', desc: 'Urban shadows & digital crime', films: '9 films', icon: Flame },
  { id: 'arthouse', genreId: 99, title: 'Arthouse', desc: 'Experimental auteur cinema', films: '12 films', icon: Award },
  { id: 'drama', genreId: 18, title: 'Drama', desc: 'Character-driven narratives', films: '18 films', icon: Clapperboard },
  { id: 'thriller', genreId: 53, title: 'Thriller', desc: 'Psychological tension & dread', films: '11 films', icon: Film },
];

const DIRECTORS = [
  { id: 'ev', initials: 'EV', name: 'Elena Vance', desc: 'Master Retrospective', query: 'Nolan' },
  { id: 'ks', initials: 'KS', name: 'Kenji Sato', desc: 'Master Retrospective', query: 'Miyazaki' },
  { id: 'cd', initials: 'CD', name: 'Claire Delacroix', desc: 'Master Retrospective', query: 'Villeneuve' },
  { id: 'mb', initials: 'MB', name: 'Matthias Brandt', desc: 'Master Retrospective', query: 'Fincher' },
];

const MobileDiscoverTab = () => {
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [themeMovies, setThemeMovies] = useState([]);
  const [loading, setLoading] = useState(false);

  const { openModal } = useMovieModal();
  const { entries, addEntry, removeEntry, tiers } = useWatchlist();

  useEffect(() => {
    if (!selectedTheme) return;
    let isMounted = true;
    const fetchTheme = async () => {
      setLoading(true);
      try {
        let results = [];
        if (selectedTheme.genreId) {
          const res = await tmdb.get('/discover/movie', {
            params: {
              with_genres: selectedTheme.genreId,
              sort_by: 'popularity.desc',
              page: 1,
              include_adult: false,
            },
          });
          results = res.data?.results || [];
        } else if (selectedTheme.query) {
          const res = await tmdb.get('/search/movie', {
            params: { query: selectedTheme.query, page: 1 },
          });
          results = res.data?.results || [];
        }
        if (isMounted) setThemeMovies(results);
      } catch (err) {
        console.error('Failed to load theme:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchTheme();
    return () => { isMounted = false; };
  }, [selectedTheme]);

  if (selectedTheme) {
    return (
      <div className="w-full px-4 pt-16 pb-32">
        {/* Back header */}
        <div className="flex items-center gap-3 mb-4">
          <button
            type="button"
            onClick={() => setSelectedTheme(null)}
            className="w-8 h-8 rounded-full liquid-glass flex items-center justify-center text-white border border-white/10"
            style={{ width: '32px', height: '32px', borderRadius: '9999px', background: 'rgba(30, 39, 46, 0.7)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-xl font-panchange font-bold text-white tracking-tight" style={{ fontFamily: "'Unbounded', sans-serif" }}>
              {selectedTheme.title || selectedTheme.name}
            </h2>
            <p className="text-xs text-neutral-400">{selectedTheme.desc}</p>
          </div>
        </div>

        {/* Movies grid */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-[#14161d] rounded-2xl animate-pulse" style={{ aspectRatio: '2 / 3', borderRadius: '16px', backgroundColor: '#14161d' }} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {themeMovies.map((item) => {
              if (!item.poster_path && !item.backdrop_path) return null;
              const title = item.title || item.name;
              const year = (item.release_date || '').slice(0, 4);
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
                    type: 'movie',
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
                  onClick={() => openModal(item.id, 'movie')}
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
                    className="absolute top-2 right-2 p-1.5 rounded-full shadow-md z-10 liquid-glass border border-white/10 text-white"
                    style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 10, borderRadius: '9999px', padding: '6px', background: isSaved ? 'rgba(0, 206, 201, 0.25)' : 'rgba(30, 39, 46, 0.65)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer' }}
                  >
                    {isSaved ? <Check className="w-3.5 h-3.5 text-[#00CEC9]" style={{ width: '14px', height: '14px' }} /> : <Plus className="w-3.5 h-3.5" style={{ width: '14px', height: '14px' }} />}
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
      </div>
    );
  }

  return (
    <div className="w-full px-4 pt-16 pb-32">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-panchange font-bold text-white tracking-tight" style={{ fontFamily: "'Unbounded', sans-serif", fontSize: '1.4rem' }}>
          Explore Cinema
        </h2>
        <p className="text-xs text-neutral-400 mt-0.5" style={{ color: '#94a3b8', fontSize: '12px' }}>
          Curated collections and masterworks
        </p>
      </div>

      {/* Collection Rows */}
      <div className="flex flex-col gap-3 mb-8" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {COLLECTIONS.map((col) => {
          const Icon = col.icon;
          return (
            <div
              key={col.id}
              onClick={() => setSelectedTheme(col)}
              className="liquid-glass rounded-2xl p-3.5 flex items-center justify-between border border-white/10 shadow-lg cursor-pointer active:scale-[0.98] transition-all"
              style={{
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                backgroundColor: 'rgba(20, 24, 34, 0.78)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
              }}
            >
              <div className="flex items-center gap-3.5" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center text-white border border-white/10"
                  style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Icon className="w-5 h-5 text-neutral-200" style={{ width: '18px', height: '18px' }} />
                </div>
                <div>
                  <h3 className="text-sm font-panchange font-bold text-white tracking-tight" style={{ fontFamily: "'Unbounded', sans-serif", fontSize: '13px', color: '#fff' }}>
                    {col.title}
                  </h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5" style={{ fontSize: '11px', color: '#94a3b8' }}>
                    {col.desc}
                  </p>
                </div>
              </div>

              <span
                className="px-2.5 py-1 rounded-full text-[10px] font-medium text-neutral-300 liquid-glass border border-white/10"
                style={{ fontSize: '10px', color: '#cbd5e1', padding: '3px 8px', borderRadius: '9999px', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.1)' }}
              >
                {col.films}
              </span>
            </div>
          );
        })}
      </div>

      {/* Directors in Focus */}
      <div className="mb-4">
        <h3 className="text-xs font-panchange font-bold text-white tracking-tight uppercase mb-3" style={{ fontFamily: "'Unbounded', sans-serif", fontSize: '12px', color: '#e2e8f0', letterSpacing: '0.04em' }}>
          Directors in Focus
        </h3>
        <div className="grid grid-cols-2 gap-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          {DIRECTORS.map((dir) => (
            <div
              key={dir.id}
              onClick={() => setSelectedTheme(dir)}
              className="liquid-glass rounded-2xl p-4 flex flex-col items-center text-center border border-white/10 shadow-lg cursor-pointer active:scale-95 transition-all"
              style={{
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                backgroundColor: 'rgba(20, 24, 34, 0.78)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '16px 12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                cursor: 'pointer',
              }}
            >
              <div
                className="w-10 h-10 rounded-full bg-white/[0.08] flex items-center justify-center text-xs font-bold text-white border border-white/15 mb-2.5"
                style={{ width: '38px', height: '38px', borderRadius: '9999px', background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', color: '#ffffff', marginBottom: '8px' }}
              >
                {dir.initials}
              </div>
              <h4 className="text-xs font-panchange font-bold text-white" style={{ fontFamily: "'Unbounded', sans-serif", fontSize: '11.5px', color: '#fff' }}>
                {dir.name}
              </h4>
              <p className="text-[10px] text-neutral-400 mt-0.5" style={{ fontSize: '10px', color: '#94a3b8' }}>
                {dir.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MobileDiscoverTab;
