import React, { useRef } from 'react';
import InteractiveMovieCard from './InteractiveMovieCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

const MovieRow = ({ title, movies, onMovieClick, isUpcoming }) => {
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
            <div style={{ marginBottom: '2.5rem', minHeight: '272px', position: 'relative' }}>
                {title && (
                    <h2 className="movie-row-title" style={{ opacity: 0.3, marginTop: 0 }}>
                        {title}
                    </h2>
                )}
                <div className="movie-row-container" style={{ overflow: 'hidden' }}>
                    {[...Array(6)].map((_, i) => (
                        <div
                            key={i}
                            className="card-skeleton"
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
                    {title}
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
                    className="movie-row-container"
                >
                    {movies.map((movie, index) => (
                        <InteractiveMovieCard key={movie.id} movie={movie} index={index} isUpcoming={isUpcoming} />
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
