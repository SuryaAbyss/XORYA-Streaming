import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { imageUrl } from '../api/tmdb';



const Top10Card = ({ movie, index, isLandscape }) => {
    const [isHovered, setIsHovered] = useState(false);
    const navigate = useNavigate();

    const handleClick = () => {
        // Default to movie, but check media_type if available
        const type = movie.media_type || 'movie';
        navigate(`/watch/${type}/${movie.id}`);
    };

    return (
        <div
            style={{
                position: 'relative',
                minWidth: isLandscape ? '280px' : '180px',
                height: isLandscape ? '180px' : '270px',
                cursor: 'pointer'
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleClick}
        >
            {/* Rank Number */}
            <div style={{
                position: 'absolute',
                bottom: '-15px',
                left: '-8px',
                fontSize: '6rem',
                fontWeight: '900',
                color: isHovered ? '#dc2626' : 'transparent',
                WebkitTextStroke: '2px #dc2626',
                textStroke: '2px #dc2626',
                lineHeight: 1,
                zIndex: isHovered ? 5 : 2,
                pointerEvents: 'none',
                transform: isHovered ? 'scale(1.15) translateX(-8px)' : 'scale(1)',
                transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}>
                {index + 1}
            </div>

            {/* Movie Poster Container */}
            <div style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                borderRadius: '8px',
                overflow: 'hidden',
                transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                transition: 'transform 0.3s ease'
            }}>
                {/* Movie Poster */}
                <img
                    src={imageUrl(isLandscape ? movie.backdrop_path : movie.poster_path, 'w500')}
                    alt={movie.title}
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
                    background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 50%)',
                    zIndex: 1
                }} />

                {/* Movie Title */}
                <div style={{
                    position: 'absolute',
                    bottom: '1rem',
                    left: '1rem',
                    right: '1rem',
                    zIndex: 3,
                    color: '#fff'
                }}>
                    <h3 style={{
                        fontSize: '0.95rem',
                        fontWeight: 'bold',
                        margin: 0,
                        textShadow: '0 2px 8px rgba(0,0,0,0.8)'
                    }}>
                        {movie.title}
                    </h3>
                </div>
            </div>
        </div>
    );
};

const Top10Section = ({ movies }) => {
    const [scrollPosition, setScrollPosition] = useState(0);
    const containerRef = React.useRef(null);

    const scroll = (direction) => {
        if (containerRef.current) {
            const scrollAmount = 400;
            const newPosition = direction === 'left'
                ? scrollPosition - scrollAmount
                : scrollPosition + scrollAmount;

            containerRef.current.scrollTo({
                left: newPosition,
                behavior: 'smooth'
            });
            setScrollPosition(newPosition);
        }
    };

    // Take only top 10 movies
    const top10 = movies.slice(0, 10);

    return (
        <div style={{
            position: 'relative',
            padding: '2rem 4%',
            background: 'transparent',
        }}>
            {/* Highlighted header box - title area only (like Spotlight Picks) */}
            <div style={{ display: 'flex', justifyContent: 'left', marginBottom: '2rem' }}>
            <div style={{
                display: 'inline-block',
                padding: '1rem 1.5rem 1.25rem',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '16px',
                boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3)',
            }}>
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
                    <h2 style={{
                        fontSize: '2.5rem',
                        fontWeight: '900',
                        color: 'transparent',
                        WebkitTextStroke: '2px #dc2626',
                        textStroke: '2px #dc2626',
                        letterSpacing: '-0.05em',
                        margin: 0,
                        lineHeight: 1
                    }}>
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
                <span style={{
                    display: 'block',
                    fontSize: '0.85rem',
                    color: 'rgba(255, 255, 255, 0.8)',
                    marginTop: '0.5rem',
                }}>
                    Trending Right Now
                </span>
            </div>
            </div>

            {/* Navigation Buttons */}
            <button
                onClick={() => scroll('left')}
                style={{
                    position: 'absolute',
                    left: '1%',
                    top: '60%',
                    transform: 'translateY(-50%)',
                    zIndex: 10,
                    background: 'rgba(0,0,0,0.7)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '50%',
                    width: '50px',
                    height: '50px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    color: '#fff'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(0,0,0,0.7)';
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                }}
            >
                <ChevronLeft size={24} />
            </button>

            <button
                onClick={() => scroll('right')}
                style={{
                    position: 'absolute',
                    right: '1%',
                    top: '60%',
                    transform: 'translateY(-50%)',
                    zIndex: 10,
                    background: 'rgba(0,0,0,0.7)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '50%',
                    width: '50px',
                    height: '50px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    color: '#fff'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(0,0,0,0.7)';
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                }}
            >
                <ChevronRight size={24} />
            </button>

            {/* Scrollable Container */}
            <div
                ref={containerRef}
                style={{
                    display: 'flex',
                    gap: '2rem',
                    overflowX: 'auto',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    padding: '1rem 0',
                }}
                className="hide-scrollbar"
            >
                {top10.map((movie, index) => {
                    const isLandscape = index % 3 === 1;
                    return (
                        <Top10Card
                            key={movie.id}
                            movie={movie}
                            index={index}
                            isLandscape={isLandscape}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default Top10Section;
