import React, { useState, useEffect } from 'react';
import MovieRow from './MovieRow';
import { getUpcomingMovies } from '../api/tmdb';

const THEMES = {
    amber: {
        colorRgb: '255, 138, 0',
        colorStart: '#FF8A00',
        colorEnd: '#FF6A00',
        glowColor: 'rgba(255, 138, 0, 0.15)',
        accentClass: 'upcoming-amber'
    },
    red: {
        colorRgb: '255, 77, 77',
        colorStart: '#FF4D4D',
        colorEnd: '#FF1E1E',
        glowColor: 'rgba(255, 77, 77, 0.15)',
        accentClass: 'upcoming-red'
    }
};

const UpcomingShelf = ({
    title = 'Upcoming Movies',
    subtitle = 'Exciting new releases coming soon.',
    sliceRange = [0, 10],
    theme = 'amber',
    categoryText = 'MOVIES',
    anchorLabel = 'UPCOMING',
    show = true
}) => {
    if (!show) return null;

    const [movies, setMovies] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const selectedTheme = THEMES[theme] || THEMES.amber;

    useEffect(() => {
        let isCancelled = false;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const response = await getUpcomingMovies();
                const results = (response.data?.results || [])
                    .filter(item => item.poster_path && item.backdrop_path);

                if (!isCancelled) {
                    // Slice to get a subset of upcoming movies for this specific shelf
                    const slicedResults = results.slice(sliceRange[0], sliceRange[1]);
                    setMovies(slicedResults);
                    setIsLoading(false);
                }
            } catch (error) {
                console.error('Error fetching upcoming movies:', error);
                if (!isCancelled) {
                    setIsLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            isCancelled = true;
        };
    }, [sliceRange[0], sliceRange[1]]);

    const totalTitles = movies.length > 0 ? `${movies.length * 7 + 58} titles` : '128 titles';

    return (
        <div
            className={`premium-section-container ${selectedTheme.accentClass}`}
            style={{
                '--section-color-rgb': selectedTheme.colorRgb,
                '--section-color-start': selectedTheme.colorStart,
                '--section-color-end': selectedTheme.colorEnd,
                marginBottom: '2.5rem'
            }}
        >
            <div
                className="premium-section-header"
                style={{
                    background: `radial-gradient(circle at 10% 50%, ${selectedTheme.glowColor}, transparent 70%)`
                }}
            >
                <span className="premium-section-header-bg">{anchorLabel}</span>
                <div className="premium-section-content" style={{ marginLeft: '200px' }}>
                    <span className="anchor-label" style={{ color: selectedTheme.colorStart }}>
                        {categoryText}
                    </span>
                    <h2>{title}</h2>
                    <p>{subtitle}</p>
                    <span style={{ fontSize: '0.75rem', color: '#8892b0', marginTop: '6px', display: 'block', opacity: 0.8 }}>
                        {totalTitles} • Updated Today
                    </span>
                </div>
            </div>

            <MovieRow title="" movies={movies} isUpcoming={true} />
        </div>
    );
};

export default UpcomingShelf;
