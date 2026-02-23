import React, { useRef } from 'react';
import InteractiveMovieCard from './InteractiveMovieCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const MovieRow = ({ title, movies, onMovieClick }) => {
    const rowRef = useRef(null);

    const scroll = (direction) => {
        if (rowRef.current) {
            const { current } = rowRef;
            const scrollAmount = direction === 'left' ? -600 : 600;
            current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    if (!movies || movies.length === 0) return null;

    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
                hidden: { opacity: 0 },
                visible: {
                    opacity: 1,
                    transition: {
                        staggerChildren: 0.1,
                        delayChildren: 0.1
                    }
                }
            }}
            style={{ marginBottom: '2.5rem', position: 'relative' }}
        >
            <motion.h2
                variants={{
                    hidden: { opacity: 0, x: -20 },
                    visible: { opacity: 1, x: 0, transition: { duration: 0.6 } }
                }}
                className="movie-row-title"
            >
                {title}
            </motion.h2>

            <div className="group" style={{ position: 'relative' }}>
                <button
                    onClick={() => scroll('left')}
                    className="movie-row-arrow left"
                    style={{}}
                >
                    <ChevronLeft size={30} />
                </button>

                <div
                    ref={rowRef}
                    className="movie-row-container"
                    style={{}}
                >
                    {movies.map((movie, index) => (
                        <InteractiveMovieCard key={movie.id} movie={movie} index={index} />
                    ))}
                </div>

                <button
                    onClick={() => scroll('right')}
                    className="movie-row-arrow right"
                    style={{}}
                >
                    <ChevronRight size={30} />
                </button>
            </div>
        </motion.div>
    );
};

export default MovieRow;
