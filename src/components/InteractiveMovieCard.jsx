import React, { useState, useEffect } from 'react';
import { imageUrl, getLogoUrl, getMovieImages, getTVShowImages } from '../api/tmdb';
import { Star } from 'lucide-react';
import { useMovieModal } from '../context/MovieModalContext';

// In-memory logo cache to avoid repeated API calls
const logoCache = new Map();

const InteractiveMovieCard = ({ movie, index = 0 }) => {
    const { openModal, selectedMovieId } = useMovieModal();
    const [isHovered, setIsHovered] = useState(false);
    const [logoUrl, setLogoUrl] = useState(null);
    const [imgLoaded, setImgLoaded] = useState(false);
    const [imgError, setImgError] = useState(false);

    const isMobile = typeof window !== 'undefined' && navigator.maxTouchPoints > 0 && window.innerWidth <= 768;

    // ── Fetch transparent title logo ───────────────────────────────────────
    useEffect(() => {
        if (!movie?.id) return;
        if (logoCache.has(movie.id)) {
            setLogoUrl(logoCache.get(movie.id));
            return;
        }
        const mediaType = movie.media_type || (movie.name ? 'tv' : 'movie');
        (async () => {
            try {
                const apiCall = mediaType === 'tv' ? getTVShowImages : getMovieImages;
                const res = await apiCall(movie.id);
                const logos = res.data?.logos || [];
                if (logos.length > 0) {
                    const englishLogo = logos.find(l => l.iso_639_1 === 'en') || logos[0];
                    const url = getLogoUrl(englishLogo.file_path);
                    logoCache.set(movie.id, url);
                    setLogoUrl(url);
                } else {
                    logoCache.set(movie.id, null);
                }
            } catch {
                logoCache.set(movie.id, null);
            }
        })();
    }, [movie?.id, movie?.media_type, movie?.name]);

    // ── Derived values ─────────────────────────────────────────────────────
    const match = movie.vote_average ? Math.round(movie.vote_average * 10) : null;
    const year  = movie.release_date?.substring(0, 4) || movie.first_air_date?.substring(0, 4) || null;

    // Always use backdrop (landscape) as the primary image — fallback to poster
    const backdropPath = movie.backdrop_path;
    const posterPath   = movie.poster_path;
    // Thumbnail shown in normal state: backdrop preferred, poster as last resort
    const thumbPath    = backdropPath || posterPath;
    // Hover image: same backdrop, fades in over the thumbnail
    const hoverPath    = backdropPath || posterPath;

    // ── Handlers ───────────────────────────────────────────────────────────
    const handleMouseEnter = () => {
        if (isMobile || selectedMovieId) return;
        setIsHovered(true);
    };
    const handleMouseLeave = () => setIsHovered(false);

    const handleClick = (e) => {
        e.stopPropagation();
        const mediaType = movie.media_type || (movie.name ? 'tv' : 'movie');
        openModal(movie.id, mediaType);
    };

    return (
        <div
            className={`interactive-movie-card${isHovered ? ' hovered' : ''}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleClick(e)}
            aria-label={`View details for ${movie.title || movie.name}`}
        >
            {/* ── Thumbnail (landscape backdrop, always visible) ───────── */}
            {thumbPath && !imgError ? (
                <img
                    src={imageUrl(thumbPath, 'w780')}
                    alt={movie.title || movie.name}
                    className="imc-thumb"
                    loading="lazy"
                    onLoad={() => setImgLoaded(true)}
                    onError={() => setImgError(true)}
                    draggable={false}
                />
            ) : (
                // Fallback placeholder
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '2rem', color: 'rgba(255,255,255,0.15)'
                }}>🎬</div>
            )}

            {/* ── Base thumbnail gradient for title contrast ────────────── */}
            <div className="imc-thumb-gradient" aria-hidden="true" />

            {/* ── Hover backdrop (same img or separate quality) ────────── */}
            {hoverPath && !imgError && (
                <img
                    src={imageUrl(hoverPath, 'w780')}
                    alt=""
                    aria-hidden="true"
                    className="imc-backdrop"
                    loading="lazy"
                    draggable={false}
                />
            )}

            {/* ── Gradient overlay ─────────────────────────────────────── */}
            <div className="imc-gradient" aria-hidden="true" />

            {/* ── Rating badge (top-left, fades out on hover) ──────────── */}
            {movie.vote_average ? (
                <div className="imc-rating" aria-label={`Rating: ${movie.vote_average.toFixed(1)}`}>
                    <Star size={10} fill="#fbbf24" color="#fbbf24" />
                    {movie.vote_average.toFixed(1)}
                </div>
            ) : null}

            {/* ── Logo / title (bottom, fades out on hover) ────────────── */}
            <div className="imc-logo-wrap" aria-hidden="true">
                {logoUrl ? (
                    <img
                        src={logoUrl}
                        alt={movie.title || movie.name}
                        className="imc-logo"
                    />
                ) : (
                    <p className="imc-title-fallback">{movie.title || movie.name}</p>
                )}
            </div>

            {/* ── Info overlay (title + match% + year, slides in on hover) */}
            <div className="imc-info" aria-hidden={!isHovered}>
                <h3>{movie.title || movie.name}</h3>
                <div className="imc-meta">
                    {match !== null && <span className="imc-match">{match}% Match</span>}
                    {year && <span className="imc-year">• {year}</span>}
                </div>
            </div>
        </div>
    );
};

export default InteractiveMovieCard;
