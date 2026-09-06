import React from 'react';
import { Star, Plus, Check } from 'lucide-react';
import { imageUrl } from '../../api/tmdb';
import { useMovieModal } from '../../context/MovieModalContext';
import { useWatchlist } from '../../hooks/useWatchlist';

const MobileContentRail = ({ title, movies = [], subtitle = null }) => {
  const { openModal } = useMovieModal();
  const { entries, addEntry, removeEntry, tiers } = useWatchlist();

  if (!movies || movies.length === 0) return null;

  return (
    <section className="w-full px-3.5 pt-4 pb-2 relative select-none" style={{ width: '100%', boxSizing: 'border-box', marginTop: '14px', marginBottom: '6px' }} aria-label={title}>
      {/* Subtle section divider line */}
      <div className="w-full h-px mb-3" style={{ width: '100%', height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.08)', marginBottom: '12px' }} />

      {/* Rail Header */}
      <div className="flex items-center justify-between mb-2.5 px-0.5" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div>
          <h3 className="text-xs font-panchange font-bold uppercase tracking-wider text-neutral-200" style={{ fontFamily: "'Unbounded', 'Syne', sans-serif", fontSize: '11.5px', fontWeight: 700, letterSpacing: '0.04em', color: '#f1f5f9', margin: 0 }}>
            {title}
          </h3>
          {subtitle && (
            <p className="text-[10px] text-neutral-400 font-light mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Horizontal Snap Rail */}
      <div
        className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 snap-x select-none scroll-smooth-touch"
        style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px', paddingTop: '2px', paddingLeft: '2px', paddingRight: '14px', touchAction: 'pan-x pan-y' }}
      >
        {movies.map((movie) => {
          if (!movie.poster_path && !movie.backdrop_path) return null;

          const mediaType = movie.media_type || (movie.title ? 'movie' : 'tv');
          const movieTitle = movie.title || movie.name || 'Untitled';
          const releaseYear = (movie.release_date || movie.first_air_date || '').slice(0, 4);
          const rating = movie.vote_average ? movie.vote_average.toFixed(1) : null;
          const posterUrl = imageUrl(movie.poster_path || movie.backdrop_path, 'w500');

          const isSaved = entries.some((e) => String(e.tmdbId) === String(movie.id));

          const handleCardClick = () => {
            openModal(movie.id, mediaType);
          };

          const handleWatchlistClick = (e) => {
            e.stopPropagation();
            if (isSaved) {
              const entry = entries.find((e) => String(e.tmdbId) === String(movie.id));
              if (entry) removeEntry(entry.id);
            } else {
              const defaultTier = tiers[0]?.id || 'tier_must';
              addEntry(defaultTier, {
                tmdbId: movie.id,
                type: mediaType,
                title: movieTitle,
                poster: movie.poster_path,
                backdrop: movie.backdrop_path,
                year: releaseYear,
                rating: rating || '0.0',
              });
            }
          };

          return (
            <div
              key={movie.id}
              onClick={handleCardClick}
              className="flex-shrink-0 bg-[#14161d] overflow-hidden shadow-lg snap-start cursor-pointer relative group mobile-card-touch"
              style={{
                width: '140px',
                minWidth: '140px',
                maxWidth: '144px',
                aspectRatio: '2 / 3',
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '18px',
                flexShrink: 0,
                border: '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: '0 8px 22px rgba(0, 0, 0, 0.5)',
              }}
              tabIndex={0}
            >
              {/* Poster Image */}
              <img
                src={posterUrl}
                alt={movieTitle}
                loading="lazy"
                draggable={false}
                className="w-full h-full object-cover transition-transform duration-500 pointer-events-none group-hover:scale-105"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />

              {/* Gradient Overlays */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #060606 0%, rgba(12, 13, 16, 0.25) 50%, transparent 100%)', pointerEvents: 'none' }}
              />
              <div
                className="absolute inset-x-0 bottom-0 pointer-events-none"
                style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '60%', background: 'linear-gradient(to top, rgba(6, 6, 6, 0.96) 0%, rgba(12, 13, 16, 0.75) 60%, transparent 100%)', pointerEvents: 'none' }}
              />

              {/* Watchlist Quick Button */}
              <button
                type="button"
                onClick={handleWatchlistClick}
                className="absolute top-2 right-2 rounded-full shadow-md transition-all active:scale-90 z-10 flex items-center justify-center cursor-pointer"
                style={{
                  position: 'absolute',
                  top: '6px',
                  right: '6px',
                  zIndex: 10,
                  width: '24px',
                  height: '24px',
                  borderRadius: '9999px',
                  border: isSaved ? 'none' : '1px solid rgba(255, 255, 255, 0.16)',
                  background: isSaved ? '#00CEC9' : 'rgba(24, 30, 40, 0.65)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: isSaved ? '#060606' : '#ffffff',
                }}
                aria-label={isSaved ? 'Remove from watchlist' : 'Add to watchlist'}
              >
                {isSaved ? <Check className="w-3 h-3 text-black" style={{ width: '12px', height: '12px', strokeWidth: 2.5 }} /> : <Plus className="w-3 h-3 text-white" style={{ width: '12px', height: '12px' }} />}
              </button>

              {/* Bottom Card Metadata */}
              <div
                className="absolute inset-x-0 bottom-0 z-10 flex flex-col pointer-events-none"
                style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '8px 7px 7px 7px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '1px', pointerEvents: 'none' }}
              >
                <h4 className="text-white truncate leading-tight drop-shadow-sm" style={{ fontFamily: "'Unbounded', 'Syne', sans-serif", fontSize: '10.5px', fontWeight: 700, color: '#ffffff', textShadow: '0 1px 3px rgba(0,0,0,0.9)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {movieTitle}
                </h4>
                <div className="flex items-center text-neutral-300" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9.5px', color: '#cbd5e1', marginTop: '1px' }}>
                  {rating && (
                    <span className="flex items-center gap-0.5 font-medium text-white" style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                      <Star className="w-2.5 h-2.5 fill-white text-white" style={{ width: '9px', height: '9px', fill: '#ffffff', color: '#ffffff' }} />
                      <span style={{ fontWeight: 600, color: '#ffffff' }}>{rating}</span>
                    </span>
                  )}
                  {rating && releaseYear && <span className="text-neutral-500" style={{ color: '#64748b' }}>•</span>}
                  {releaseYear && <span className="text-neutral-300 font-light" style={{ color: '#cbd5e1' }}>{releaseYear}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default MobileContentRail;
