import React from 'react';
import { useMovieModal } from '../context/MovieModalContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { imageUrl } from '../api/tmdb';
import { BlurFade } from './ui/blur-fade';
import GridPattern from './ui/GridPattern';

const Top10Card = ({ movie, index }) => {
    const [isHovered, setIsHovered] = React.useState(false);
    const { openModal } = useMovieModal();

    const handleClick = () => {
        const type = movie.media_type || (movie.name ? 'tv' : 'movie');
        openModal(movie.id, type);
    };

    return (
        <BlurFade
            delay={index * 0.05}
            inView
            inViewMargin="-20px"
            direction="down"
            style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'flex-end',
                minWidth: '190px',
                height: '230px',
                cursor: 'pointer',
                scrollSnapAlign: 'start',
                flexShrink: 0,
                overflow: 'visible',
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleClick}
        >
            {/* Rank Number — lives on the LEFT, always visible */}
            <div className={`top10-rank-number ${index === 9 ? 'rank-10' : ''} ${isHovered ? 'hovered' : ''}`}>
                {index + 1}
            </div>

            {/* Movie Poster Container — sits on the RIGHT, overlapping the right edge of the number */}
            <div style={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: '145px',
                borderRadius: '12px',
                overflow: 'hidden',
                zIndex: 2,
                transform: isHovered ? 'scale(1.05) translateY(-5px)' : 'scale(1) translateY(0)',
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isHovered 
                    ? '0 12px 30px rgba(220, 38, 38, 0.35), 0 0 0 2px rgba(220, 38, 38, 0.4)' 
                    : '0 4px 12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
            }}>
                {/* Movie Poster */}
                <img
                    src={imageUrl(movie.poster_path || movie.backdrop_path, 'w500')}
                    alt={movie.title || movie.name}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                    }}
                />

                {/* Gradient Overlay */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 60%)',
                    zIndex: 1
                }} />

            </div>
        </BlurFade>
    );
};

const Top10Section = ({ movies }) => {
    const containerRef = React.useRef(null);
    const [showLeftArrow, setShowLeftArrow] = React.useState(false);
    const [showRightArrow, setShowRightArrow] = React.useState(true);

    const updateArrows = () => {
        if (containerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
            setShowLeftArrow(scrollLeft > 10);
            setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

    React.useEffect(() => {
        const container = containerRef.current;
        if (container) {
            updateArrows();
            container.addEventListener('scroll', updateArrows);
            window.addEventListener('resize', updateArrows);
        }
        return () => {
            if (container) {
                container.removeEventListener('scroll', updateArrows);
            }
            window.removeEventListener('resize', updateArrows);
        };
    }, [movies]);

    const scroll = (direction) => {
        if (containerRef.current) {
            const scrollAmount = 412; // scrolls exactly 2 cards (190px width + 16px gap)
            const currentScroll = containerRef.current.scrollLeft;
            const newScroll = direction === 'left'
                ? currentScroll - scrollAmount
                : currentScroll + scrollAmount;

            containerRef.current.scrollTo({
                left: newScroll,
                behavior: 'smooth'
            });
        }
    };

    // Take only top 10 movies
    const top10 = movies.slice(0, 10);

    return (
        <div className="top10-grid-container">
            {/* Grid Pattern Background */}
            <GridPattern
                width={30}
                height={30}
                strokeDasharray="2 2"
                style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0.15,
                    pointerEvents: 'none',
                    zIndex: 0,
                    stroke: 'rgba(220, 38, 38, 0.15)', // subtle red grid lines
                    maskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, #000 40%, transparent 100%)',
                    WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, #000 40%, transparent 100%)'
                }}
            />

            {/* Left/Top Column: Header */}
            <div className="top10-header-column">
                <div className="top10-header-box">
                    <span style={{
                        display: 'block',
                        fontSize: '0.7rem',
                        fontWeight: '600',
                        letterSpacing: '0.25em',
                        color: 'rgba(255, 255, 255, 0.6)',
                        marginBottom: '0.35rem',
                    }}>
                        DISCOVERY
                    </span>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                    }}>
                        <h2 className="top10-header-title">
                            TOP 10
                        </h2>
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                        }}>
                            <span style={{
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                letterSpacing: '0.2em',
                                color: '#fff'
                            }}>CONTENT</span>
                            <span style={{
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                letterSpacing: '0.2em',
                                color: '#fff'
                            }}>TODAY</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right/Bottom Column: Carousel */}
            <div className="top10-carousel-column">
                {/* Navigation Buttons inside carousel column */}
                {showLeftArrow && (
                    <button
                        className="top10-nav-arrow left"
                        onClick={() => scroll('left')}
                        aria-label="Scroll left"
                    >
                        <ChevronLeft size={24} aria-hidden="true" />
                    </button>
                )}

                {showRightArrow && (
                    <button
                        className="top10-nav-arrow right"
                        onClick={() => scroll('right')}
                        aria-label="Scroll right"
                    >
                        <ChevronRight size={24} aria-hidden="true" />
                    </button>
                )}

                {/* Scrollable Container */}
                <div
                    ref={containerRef}
                    style={{
                        display: 'flex',
                        gap: '16px', // nice spacing between cards
                        overflowX: 'auto',
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                        padding: '1.5rem 1rem 1.5rem 1rem',
                        scrollSnapType: 'x mandatory',
                        WebkitOverflowScrolling: 'touch',
                        width: '100%',
                        zIndex: 1
                    }}
                    className="hide-scrollbar"
                >
                    {top10.map((movie, index) => {
                        return (
                            <Top10Card
                                key={movie.id}
                                movie={movie}
                                index={index}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Top10Section;
