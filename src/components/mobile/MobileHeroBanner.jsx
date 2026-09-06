import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Plus, Check, Info, Star } from 'lucide-react';
import { imageUrl } from '../../api/tmdb';
import { useMovieModal } from '../../context/MovieModalContext';
import { useWatchlist } from '../../hooks/useWatchlist';

// Genre ID mapper for common TMDB genres
const GENRE_MAP = {
  28: 'Action', 12: 'Adventure', 16: 'Anime', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
  27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
  10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western',
  10759: 'Action & Adventure', 10762: 'Kids', 10763: 'News', 10764: 'Reality',
  10765: 'Sci-Fi & Fantasy', 10766: 'Soap', 10767: 'Talk', 10768: 'War & Politics'
};

const MobileHeroBanner = ({ movies = [] }) => {
  const navigate = useNavigate();
  const { openModal } = useMovieModal();
  const { entries, addEntry, removeEntry, tiers } = useWatchlist();

  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef(null);
  const autoSlideTimer = useRef(null);

  const heroList = movies && movies.length > 0 ? movies.slice(0, 7) : [];
  const currentMovie = heroList[currentIndex] || null;

  // Auto-cycle hero banner every 7 seconds
  useEffect(() => {
    if (heroList.length <= 1) return;
    autoSlideTimer.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroList.length);
    }, 7000);

    return () => {
      if (autoSlideTimer.current) clearInterval(autoSlideTimer.current);
    };
  }, [heroList.length, currentIndex]);

  if (!currentMovie) {
    return (
      <div className="w-full px-3 pt-2 pb-2">
        <div className="w-full rounded-3xl aspect-[3.5/5] bg-[#13151b] animate-pulse" />
      </div>
    );
  }

  const mediaType = currentMovie.title ? 'movie' : 'tv';
  const title = currentMovie.title || currentMovie.name || 'Featured Title';
  const releaseYear = (currentMovie.release_date || currentMovie.first_air_date || '2026').slice(0, 4);
  const rating = currentMovie.vote_average ? currentMovie.vote_average.toFixed(1) : '7.8';

  const genres = (currentMovie.genre_ids || [])
    .slice(0, 2)
    .map((id) => GENRE_MAP[id])
    .filter(Boolean)
    .join(' • ') || (mediaType === 'tv' ? 'Series • Drama' : 'Cinema • Action');

  const posterSrc = currentMovie.poster_path
    ? imageUrl(currentMovie.poster_path, 'w780')
    : currentMovie.backdrop_path
      ? imageUrl(currentMovie.backdrop_path, 'w780')
      : '/logo.png';

  // Watchlist status
  const isSaved = entries.some((e) => String(e.tmdbId) === String(currentMovie.id));

  const handleWatchlistToggle = (e) => {
    e.stopPropagation();
    if (isSaved) {
      const entry = entries.find((e) => String(e.tmdbId) === String(currentMovie.id));
      if (entry) removeEntry(entry.id);
    } else {
      const defaultTier = tiers[0]?.id || 'tier_must';
      addEntry(defaultTier, {
        tmdbId: currentMovie.id,
        type: mediaType,
        title,
        poster: currentMovie.poster_path,
        backdrop: currentMovie.backdrop_path,
        year: releaseYear,
        rating,
      });
    }
  };

  const handlePlay = (e) => {
    e.stopPropagation();
    navigate(`/watch/${mediaType}/${currentMovie.id}`);
  };

  const handleInfo = (e) => {
    e.stopPropagation();
    openModal(currentMovie.id, mediaType);
  };

  // Touch Swipe handlers
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diffX = touchStartX.current - e.changedTouches[0].clientX;
    if (diffX > 45) {
      // Swiped left -> next
      setCurrentIndex((prev) => (prev + 1) % heroList.length);
    } else if (diffX < -45) {
      // Swiped right -> prev
      setCurrentIndex((prev) => (prev - 1 + heroList.length) % heroList.length);
    }
    touchStartX.current = null;
  };

  return (
    <section className="relative w-full px-3.5 pt-2 pb-3 select-none" style={{ padding: '8px 14px 16px 14px', width: '100%', boxSizing: 'border-box' }}>
      <div
        className="relative w-full rounded-3xl overflow-hidden bg-[#13151b] aspect-[3.5/5] shadow-2xl cursor-pointer group"
        style={{ aspectRatio: '3.5 / 5', minHeight: '440px', maxHeight: '580px', position: 'relative', overflow: 'hidden', borderRadius: '28px' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={handleInfo}
      >
        {/* Background Poster Artwork */}
        <div className="absolute inset-0" style={{ position: 'absolute', inset: 0 }}>
          <img
            key={currentMovie.id}
            src={posterSrc}
            alt={title}
            className="w-full h-full object-cover object-center pointer-events-none transition-opacity duration-700 ease-out"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
            loading="eager"
          />
        </div>

        {/* Liquid Glass Overlay Gradients */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, #060606 0%, rgba(12, 13, 16, 0.35) 50%, transparent 100%)',
            pointerEvents: 'none',
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-3/4 pointer-events-none"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: '75%',
            background: 'linear-gradient(to top, #060606 0%, rgba(12, 13, 16, 0.88) 60%, transparent 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Bottom Content Metadata & Actions */}
        <div
          className="absolute inset-x-0 bottom-0 px-4 pb-4 pt-10 z-20 flex flex-col gap-2.5 pointer-events-auto"
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '16px', zIndex: 20, display: 'flex', flexDirection: 'column', gap: '10px' }}
        >
          {/* Metadata Badges */}
          <div className="flex items-center gap-2 flex-wrap" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span
              className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold liquid-glass text-white shadow-sm border border-white/10"
              style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', backgroundColor: 'rgba(30, 39, 46, 0.65)', padding: '2px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600, color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.12)' }}
            >
              {releaseYear}
            </span>
            <span
              className="px-2.5 py-0.5 rounded-full text-[11px] font-medium liquid-glass text-neutral-300 shadow-sm border border-white/10"
              style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', backgroundColor: 'rgba(30, 39, 46, 0.65)', padding: '2px 10px', borderRadius: '9999px', fontSize: '11px', color: '#cbd5e1', border: '1px solid rgba(255, 255, 255, 0.12)' }}
            >
              {mediaType === 'tv' ? 'Series' : '1h 48m'}
            </span>
            <span
              className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold liquid-glass text-white flex items-center gap-1 shadow-sm border border-white/10"
              style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', backgroundColor: 'rgba(30, 39, 46, 0.65)', padding: '2px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600, color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.12)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <Star className="w-3 h-3 fill-white text-white" style={{ width: '11px', height: '11px', color: '#ffffff', fill: '#ffffff' }} />
              {rating}
            </span>
            {genres && (
              <span className="text-xs text-neutral-300 font-light truncate drop-shadow" style={{ fontSize: '11.5px', color: '#cbd5e1', fontWeight: 300 }}>
                {genres}
              </span>
            )}
          </div>

          {/* Title */}
          <h2 className="text-xl sm:text-2xl font-panchange font-bold tracking-tight text-white leading-tight drop-shadow-md truncate" style={{ fontFamily: "'Unbounded', 'Syne', sans-serif", fontSize: '1.3rem', fontWeight: 700, margin: '2px 0', letterSpacing: '-0.02em', color: '#ffffff' }}>
            {title}
          </h2>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1" style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '4px' }}>
            {/* Primary Play Button */}
            <button
              type="button"
              onClick={handlePlay}
              className="flex-1 py-2.5 px-4 rounded-xl bg-white hover:bg-neutral-100 text-neutral-950 font-bold text-xs flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95 min-h-[42px] cursor-pointer"
              style={{ flex: 1, backgroundColor: '#ffffff', color: '#0a0a0c', minHeight: '42px', height: '42px', borderRadius: '14px', border: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', fontFamily: "'Unbounded', sans-serif", fontSize: '11.5px' }}
            >
              <Play className="w-3.5 h-3.5 fill-neutral-950 text-neutral-950" style={{ width: '13px', height: '13px', fill: '#0a0a0c', color: '#0a0a0c' }} />
              <span>Play</span>
            </button>

            {/* Watchlist Toggle */}
            <button
              type="button"
              onClick={handleWatchlistToggle}
              className="rounded-xl flex items-center justify-center transition-all active:scale-95 min-h-[42px] min-w-[42px] shadow-lg cursor-pointer border border-white/10"
              style={{ minHeight: '42px', minWidth: '42px', width: '42px', height: '42px', borderRadius: '14px', border: isSaved ? 'none' : '1px solid rgba(255,255,255,0.14)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', backgroundColor: isSaved ? '#00CEC9' : 'rgba(30, 39, 46, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: isSaved ? '#060606' : '#ffffff' }}
              aria-label={isSaved ? 'Remove from Watchlist' : 'Add to Watchlist'}
            >
              {isSaved ? <Check className="w-4 h-4 text-black" style={{ width: '15px', height: '15px', strokeWidth: 2.5 }} /> : <Plus className="w-4 h-4" style={{ width: '15px', height: '15px', color: '#ffffff' }} />}
            </button>

            {/* Details Modal Trigger */}
            <button
              type="button"
              onClick={handleInfo}
              className="rounded-xl text-white flex items-center justify-center transition-all active:scale-95 min-h-[42px] min-w-[42px] shadow-lg cursor-pointer border border-white/10"
              style={{ minHeight: '42px', minWidth: '42px', width: '42px', height: '42px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.14)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', backgroundColor: 'rgba(30, 39, 46, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ffffff' }}
              aria-label="View Movie Details"
            >
              <Info className="w-4 h-4" style={{ width: '15px', height: '15px', color: '#ffffff' }} />
            </button>
          </div>

          {/* Pagination Indicators */}
          <div className="flex items-center justify-center gap-1.5 mt-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '4px' }}>
            {heroList.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(i);
                }}
                className="p-1 cursor-pointer"
                style={{ background: 'transparent', border: 'none', padding: '4px', cursor: 'pointer' }}
                aria-label={`Go to slide ${i + 1}`}
              >
                <div
                  style={{
                    height: '4px',
                    borderRadius: '9999px',
                    width: i === currentIndex ? '20px' : '6px',
                    backgroundColor: i === currentIndex ? '#ffffff' : 'rgba(255, 255, 255, 0.28)',
                    transition: 'all 0.3s ease',
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MobileHeroBanner;
