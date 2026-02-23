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
                style={{ marginLeft: '2rem', marginBottom: '1rem', fontSize: '1.5rem', fontWeight: '600' }}
                className="neon-text"
            >
                {title}
            </motion.h2>

            <div className="group" style={{ position: 'relative' }}>
                <button
                    onClick={() => scroll('left')}
                    style={{
                        position: 'absolute', left: 0, top: 0, bottom: 0,
                        zIndex: 20, width: '50px', background: 'linear-gradient(to right, rgba(0,0,0,0.8), transparent)',
                        border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                    className="hover:text-cyan-400 transition-colors"
                >
                    <ChevronLeft size={30} />
                </button>

                <div
                    ref={rowRef}
                    style={{
                        display: 'flex',
                        gap: '1rem',
                        overflowX: 'auto',
                        padding: '1.5rem 2rem',
                        scrollBehavior: 'smooth',
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none'
                    }}
                >
                    {movies.map((movie, index) => (
                        <InteractiveMovieCard key={movie.id} movie={movie} index={index} />
                    ))}
                </div>

                <button
                    onClick={() => scroll('right')}
                    style={{
                        position: 'absolute', right: 0, top: 0, bottom: 0,
                        zIndex: 20, width: '50px', background: 'linear-gradient(to left, rgba(0,0,0,0.8), transparent)',
                        border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                    className="hover:text-cyan-400 transition-colors"
                >
                    <ChevronRight size={30} />
                </button>
            </div>
        </motion.div>
    );
};

export default MovieRow;
