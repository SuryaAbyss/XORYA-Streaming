import React, { useRef } from 'react';
import InteractiveMovieCard from './InteractiveMovieCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

const MovieRow = ({ title, movies, onMovieClick, isUpcoming, isTrendingRow, isLandscape }) => {
    const rowRef = useRef(null);
    const containerRef = useRef(null);

    const scroll = (direction) => {
        if (rowRef.current) {
            const { current } = rowRef;
            const style = window.getComputedStyle(current);
            const paddingLeft = parseFloat(style.paddingLeft) || 0;
            const paddingRight = parseFloat(style.paddingRight) || 0;
            const gap = parseFloat(style.gap) || 0;
            const visibleWidth = current.clientWidth - paddingLeft - paddingRight;
            const scrollAmount = (visibleWidth + gap) * (direction === 'left' ? -1 : 1);
            current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    useGSAP(() => {
        if (!movies || movies.length === 0) return;

        const rowTitle = containerRef.current.querySelector('.movie-row-title');
        const cards = containerRef.current.querySelectorAll('.interactive-movie-card');

        // Stagger entrance timeline using ScrollTrigger
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: containerRef.current,
                start: "top 95%",
                toggleActions: "play none none none"
            }
        });

        if (rowTitle) {
            tl.fromTo(rowTitle,
                { opacity: 0, x: -20 },
                { opacity: 1, x: 0, duration: 0.6, ease: "power2.out" }
            );
        }

        if (cards.length > 0) {
            tl.fromTo(cards,
                { opacity: 0, scale: 0.9, y: 15 },
                {
                    opacity: 1,
                    scale: 1,
                    y: 0,
                    duration: 0.8,
                    stagger: 0.04,
                    ease: "power3.out"
                },
                "-=0.4"
            );
        }
    }, [movies]);

    if (!movies || movies.length === 0) {
        return (
            <div style={{ marginBottom: '2.5rem', position: 'relative' }}>
                {title && (
                    <h2 className="movie-row-title" style={{ opacity: 0.3, marginTop: 0 }}>
                        {title.split(' ').map((word, i) => (
                            <span key={i} className={`nw-word nw-${(i % 4) + 1}`}>{word}</span>
                        ))}
                    </h2>
                )}
                {/* Skeleton shimmer row — shows while data loads */}
                <div className="skeleton-row">
                    {[...Array(6)].map((_, i) => (
                        <div
                            key={i}
                            className="skeleton-card"
                            aria-hidden="true"
                            style={{ animationDelay: `${i * 0.08}s` }}
                        />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            style={{ marginBottom: '2.5rem', position: 'relative' }}
        >
            {title && (
                <h2 className="movie-row-title">
                    {title.split(' ').map((word, i) => (
                        <span key={i} className={`nw-word nw-${(i % 4) + 1}`}>{word}</span>
                    ))}
                </h2>
            )}

            <div className="group" style={{ position: 'relative' }}>
                <button
                    onClick={() => scroll('left')}
                    className="movie-row-arrow left"
                    aria-label="Scroll left"
                >
                    <ChevronLeft size={24} aria-hidden="true" />
                </button>

                <div
                    ref={rowRef}
                    className="movie-row-container netflix-row-container"
                >
                    {movies.map((movie, index) => (
                        <div
                            key={movie.id}
                            className="netflix-card-item"
                            onMouseEnter={(e) => {
                                const container = rowRef.current;
                                if (!container) return;
                                const items = Array.from(container.querySelectorAll('.netflix-card-item'));
                                const nLi = items.length;
                                if (nLi === 0) return;

                                const scaleFactor = 1.4;
                                const cardWidth = e.currentTarget.offsetWidth;
                                const wBigElement = cardWidth * scaleFactor;
                                const translation = (wBigElement - cardWidth) / 2;

                                e.currentTarget.style.transform = `scale(${scaleFactor})`;
                                e.currentTarget.style.zIndex = '50';

                                if (index === 0) {
                                    e.currentTarget.style.transformOrigin = '0px center';
                                    items.slice(1).forEach(item => {
                                        item.style.transform = `translate(${translation * 2}px, 0px)`;
                                    });
                                } else if (index === nLi - 1) {
                                    e.currentTarget.style.transformOrigin = '100% center';
                                    items.slice(0, nLi - 1).forEach(item => {
                                        item.style.transform = `translate(-${translation * 2}px, 0px)`;
                                    });
                                } else {
                                    e.currentTarget.style.transformOrigin = 'center center';
                                    items.slice(0, index).forEach(item => {
                                        item.style.transform = `translate(-${translation}px, 0px)`;
                                    });
                                    items.slice(index + 1).forEach(item => {
                                        item.style.transform = `translate(${translation}px, 0px)`;
                                    });
                                }
                            }}
                            onMouseLeave={() => {
                                const container = rowRef.current;
                                if (!container) return;
                                const items = container.querySelectorAll('.netflix-card-item');
                                items.forEach(item => {
                                    item.style.transform = 'translate(0px, 0px) scale(1)';
                                    item.style.zIndex = '1';
                                });
                            }}
                        >
                            <InteractiveMovieCard movie={movie} index={index} isUpcoming={isUpcoming} isTrendingRow={isTrendingRow} isLandscape={isLandscape} />
                        </div>
                    ))}
                </div>

                <button
                    onClick={() => scroll('right')}
                    className="movie-row-arrow right"
                    aria-label="Scroll right"
                >
                    <ChevronRight size={24} aria-hidden="true" />
                </button>
            </div>
        </div>
    );
};

export default MovieRow;
