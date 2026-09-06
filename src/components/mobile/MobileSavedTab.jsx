import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bookmark, Play, Trash2, Star } from 'lucide-react';
import { imageUrl } from '../../api/tmdb';
import { useWatchlist } from '../../hooks/useWatchlist';
import { useMovieModal } from '../../context/MovieModalContext';

const MobileSavedTab = ({ onExploreClick }) => {
  const navigate = useNavigate();
  const { entries, removeEntry } = useWatchlist();
  const { openModal } = useMovieModal();

  return (
    <div className="w-full px-4 pt-14 pb-32">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button
          type="button"
          onClick={onExploreClick}
          className="w-8 h-8 rounded-full liquid-glass flex items-center justify-center text-white border border-white/10"
          style={{ width: '32px', height: '32px', borderRadius: '9999px', background: 'rgba(30, 39, 46, 0.7)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-xl font-panchange font-bold text-white tracking-tight" style={{ fontFamily: "'Unbounded', sans-serif", fontSize: '1.25rem' }}>
            Watchlist
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5" style={{ color: '#94a3b8', fontSize: '11.5px' }}>
            {entries.length} {entries.length === 1 ? 'film' : 'films'} saved
          </p>
        </div>
      </div>

      {/* Empty State */}
      {entries.length === 0 ? (
        <div className="text-center py-16 px-4">
          <div
            className="w-14 h-14 rounded-full liquid-glass mx-auto flex items-center justify-center mb-3 border border-white/10"
            style={{ width: '56px', height: '56px', borderRadius: '9999px', background: 'rgba(30, 39, 46, 0.65)', border: '1px solid rgba(255, 255, 255, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}
          >
            <Bookmark className="w-6 h-6 text-neutral-400" />
          </div>
          <h3 className="text-sm font-semibold text-white">Your watchlist is empty</h3>
          <p className="text-xs text-neutral-400 mt-1 max-w-xs mx-auto">
            Tap the + button on any movie or series to save it for later viewing.
          </p>
          <button
            type="button"
            onClick={onExploreClick}
            className="mt-4 px-4 py-2 rounded-xl bg-white text-neutral-950 font-semibold text-xs shadow-lg active:scale-95 transition-all cursor-pointer"
            style={{ padding: '8px 16px', borderRadius: '12px', background: '#fff', color: '#000', fontWeight: 600, fontSize: '12px', border: 'none', cursor: 'pointer', marginTop: '16px' }}
          >
            Explore Movies & Series
          </button>
        </div>
      ) : (
        /* 2-Column Saved Movies Grid matching Refra Image 5 */
        <div className="grid grid-cols-2 gap-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {entries.map((item) => {
            const poster = item.poster ? imageUrl(item.poster, 'w500') : '/logo.png';
            const handlePlay = (e) => {
              e.stopPropagation();
              navigate(`/watch/${item.type || 'movie'}/${item.tmdbId}`);
            };

            const handleRemove = (e) => {
              e.stopPropagation();
              removeEntry(item.id);
            };

            return (
              <div
                key={item.id}
                onClick={() => openModal(item.tmdbId, item.type || 'movie')}
                className="aspect-[2/3] bg-[#14161d] rounded-2xl overflow-hidden shadow-lg relative group mobile-card-touch border border-white/[0.06] cursor-pointer"
                style={{ aspectRatio: '2 / 3', borderRadius: '16px', overflow: 'hidden', position: 'relative', cursor: 'pointer' }}
              >
                <img
                  src={poster}
                  alt={item.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                <div className="absolute inset-0 pointer-events-none" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0c0d10 0%, rgba(12, 13, 16, 0.4) 50%, transparent 100%)' }} />
                <div className="absolute inset-x-0 bottom-0 h-1/2 pointer-events-none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '50%', background: 'linear-gradient(to top, rgba(12, 13, 16, 0.95) 0%, rgba(12, 13, 16, 0.6) 50%, transparent 100%)' }} />

                {/* Remove / Saved Pill */}
                <button
                  type="button"
                  onClick={handleRemove}
                  className="absolute top-2 right-2 p-1.5 rounded-full shadow-md z-10 liquid-glass border border-white/10"
                  style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 10, borderRadius: '9999px', padding: '6px', background: 'rgba(0, 206, 201, 0.25)', border: '1px solid rgba(0, 206, 201, 0.4)', color: '#00CEC9', cursor: 'pointer' }}
                  aria-label="Remove from watchlist"
                >
                  <Bookmark className="w-3.5 h-3.5 fill-[#00CEC9] text-[#00CEC9]" style={{ width: '14px', height: '14px' }} />
                </button>

                {/* Quick Play CTA */}
                <button
                  type="button"
                  onClick={handlePlay}
                  className="absolute top-2 left-2 p-1.5 rounded-full shadow-md z-10 bg-white text-neutral-950 hover:bg-neutral-200"
                  style={{ position: 'absolute', top: '8px', left: '8px', zIndex: 10, borderRadius: '9999px', padding: '6px', background: '#fff', color: '#000', border: 'none', cursor: 'pointer' }}
                  aria-label="Play now"
                >
                  <Play className="w-3.5 h-3.5 fill-neutral-950" style={{ width: '12px', height: '12px' }} />
                </button>

                {/* Bottom title & rating */}
                <div className="absolute inset-x-0 bottom-0 p-2.5 z-10 pointer-events-none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '10px' }}>
                  <h4 className="text-xs font-semibold text-white truncate leading-tight drop-shadow-sm font-refra-body" style={{ fontSize: '12px', color: '#fff', fontWeight: 600 }}>
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[10px] text-neutral-300 mt-0.5" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: '#cbd5e1' }}>
                    {item.rating && (
                      <span className="flex items-center gap-1 font-medium text-white" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" style={{ width: '10px', height: '10px' }} />
                        {item.rating}
                      </span>
                    )}
                    {item.rating && item.year && <span>•</span>}
                    {item.year && <span>{item.year}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MobileSavedTab;
