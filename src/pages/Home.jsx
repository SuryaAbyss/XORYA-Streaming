import React, { useEffect, useState, useRef } from 'react';
import Hero from '../components/Hero';
import MovieRow from '../components/MovieRow';
import Top10Section from '../components/Top10Section';
import ProvidersSection from '../components/ProvidersSection';
import GridBackground from '../components/GridBackground';
import SEO from '../components/SEO';
import { imageUrl } from '../api/tmdb';
import { loadYouTubeAPI } from '../hooks/useYouTubePlayer';
import DynamicContentShelf from '../components/DynamicContentShelf';
import {
    getTrendingMovies,
    getTrendingMoviesWeek,
    getTrendingTVShows,
    getTrendingTVShowsWeek
} from '../api/tmdb';
import { getIMDbCuratedTVShows, getIMDbTop10MixedPool } from '../api/imdb';
import { useLazySection } from '../hooks/useLazySection';
import MobileHomeView from '../components/mobile/MobileHomeView';


const Home = ({ category = 'all' }) => {
    const [trending, setTrending] = useState([]);
    const [trendingTV, setTrendingTV] = useState([]);
    const [top10Data, setTop10Data] = useState([]);

    // Detect mobile for layout adjustments
    const [isMobileView, setIsMobileView] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.innerWidth <= 768;
    });

    useEffect(() => {
        const handleResize = () => {
            setIsMobileView(window.innerWidth <= 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Preload YouTube API early so trailer loads faster (desktop only)
    useEffect(() => {
        if (!isMobileView) {
            loadYouTubeAPI();
        }
    }, [isMobileView]);

    // Scroll to top on mount or category change
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [category]);

    useEffect(() => {
        const fetchPrimary = async () => {
            const safe = (r) => {
                if (r.status !== 'fulfilled') return [];
                return (r.value?.data?.results || []).filter(item => item.poster_path && item.backdrop_path);
            };

            const results = await Promise.allSettled([
                getTrendingMovies(1), getTrendingMovies(2), getTrendingMovies(3),
                getTrendingMoviesWeek(1), getTrendingMoviesWeek(2), getTrendingMoviesWeek(3),
                getTrendingTVShows(1), getTrendingTVShows(2), getTrendingTVShows(3),
                getTrendingTVShowsWeek(1), getTrendingTVShowsWeek(2), getTrendingTVShowsWeek(3)
            ]);

            const [
                trendingDayRes1, trendingDayRes2, trendingDayRes3,
                trendingWeekRes1, trendingWeekRes2, trendingWeekRes3,
                trendingTVDayRes1, trendingTVDayRes2, trendingTVDayRes3,
                trendingTVWeekRes1, trendingTVWeekRes2, trendingTVWeekRes3
            ] = results;

            const mergeAndShuffle = (...arrays) => {
                const uniqueMap = new Map();
                arrays.forEach(arr => {
                    arr.forEach(item => uniqueMap.set(item.id, item));
                });
                const combined = Array.from(uniqueMap.values());
                for (let i = combined.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [combined[i], combined[j]] = [combined[j], combined[i]];
                }
                return combined;
            };

            const trendingMovies = mergeAndShuffle(
                safe(trendingDayRes1), safe(trendingDayRes2), safe(trendingDayRes3),
                safe(trendingWeekRes1), safe(trendingWeekRes2), safe(trendingWeekRes3)
            );
            if (trendingMovies.length) setTrending(trendingMovies);

            const filterAnimation = (arr) => arr.filter(item => !item.genre_ids?.includes(16));

            const trendingTVItems = mergeAndShuffle(
                filterAnimation(safe(trendingTVDayRes1)),
                filterAnimation(safe(trendingTVDayRes2)),
                filterAnimation(safe(trendingTVDayRes3)),
                filterAnimation(safe(trendingTVWeekRes1)),
                filterAnimation(safe(trendingTVWeekRes2)),
                filterAnimation(safe(trendingTVWeekRes3))
            );

            // Fetch IMDb curated list and place at the top of TV items
            try {
                const imdbShows = await getIMDbCuratedTVShows();
                if (imdbShows && imdbShows.length > 0) {
                    const existingIds = new Set(imdbShows.map(s => s.id));
                    const remainingTMDB = trendingTVItems.filter(s => !existingIds.has(s.id));
                    setTrendingTV([...imdbShows, ...remainingTMDB]);
                } else if (trendingTVItems.length) {
                    setTrendingTV(trendingTVItems);
                }
            } catch (err) {
                if (trendingTVItems.length) setTrendingTV(trendingTVItems);
            }

            // Fetch Top 10 mixed genre pool
            try {
                const mixedTop10 = await getIMDbTop10MixedPool();
                if (mixedTop10 && mixedTop10.length > 0) {
                    setTop10Data(mixedTop10);
                }
            } catch (err) {
                console.error("Top 10 fetch error:", err);
            }
        };

        fetchPrimary();
    }, []);

    const [isTrailerPlaying, setIsTrailerPlaying] = useState(false);
    const [currentHeroIndex, setCurrentHeroIndex] = useState(() => Math.floor(Math.random() * 20));

    const showMovies = category === 'all' || category === 'movies';
    const showTV = category === 'all' || category === 'tv';
    const mainData = category === 'tv' ? trendingTV : trending;

    // Lazy section refs for below-the-fold components
    const { ref: top10Ref, isVisible: top10Visible }         = useLazySection('350px 0px');
    const { ref: providersRef, isVisible: providersVisible } = useLazySection('300px 0px');


    // Re-randomize when trending data first loads
    useEffect(() => {
        if (mainData.length > 0) {
            setCurrentHeroIndex(Math.floor(Math.random() * mainData.length));
        }
    }, [mainData.length, category]);

    const handleTrailerStart = React.useCallback(() => {
        setIsTrailerPlaying(true);
    }, []);

    // Advance to next movie when trailer ends
    const handleTrailerEnd = React.useCallback(() => {
        setIsTrailerPlaying(false);
        setCurrentHeroIndex((prev) => (prev + 1) % Math.max(mainData.length, 1));
    }, [mainData.length]);

    // Update heroMovie when index changes
    const heroMovie = React.useMemo(() => {
        if (mainData.length > 0) {
            return mainData[currentHeroIndex];
        }
        return null;
    }, [mainData, currentHeroIndex]);

    // Preload hero + next few backdrops for smooth transitions
    useEffect(() => {
        if (!mainData.length) return;
        const toPreload = mainData.slice(0, 5).filter(m => m.backdrop_path);
        const links = toPreload.map(m => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = imageUrl(m.backdrop_path, 'w1280');
            link.fetchpriority = 'high';
            document.head.appendChild(link);
            return link;
        });
        return () => links.forEach(link => link.parentNode?.removeChild(link));
    }, [mainData]);

    if (isMobileView) {
        return (
            <div className="home-page pb-0">
                <SEO
                    title="XORYA - Premium Streaming Platform"
                    description="Watch the latest and most popular movies and TV shows on XORYA. Experience premium streaming with an interactive interface."
                />
                <MobileHomeView category={category} top10Data={top10Data} />
            </div>
        );
    }

    return (
        <div className="home-page pb-0">
            <SEO
                title="XORYA - Premium Streaming Platform"
                description="Watch the latest and most popular movies and TV shows on XORYA. Experience premium streaming with an interactive interface."
            />
            <h1 style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', border: 0 }}>XORYA - Premium Streaming Platform</h1>

            <Hero
                movie={heroMovie}
                onTrailerStart={handleTrailerStart}
                onTrailerEnd={handleTrailerEnd}
                isTrailerPlaying={isTrailerPlaying}
            />

            <div style={{
                position: 'relative',
                zIndex: 20,
                pointerEvents: 'none',
                transform: isTrailerPlaying ? 'translateY(36vh)' : 'translateY(0px)',
                transition: 'transform 1.1s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                willChange: 'transform'
            }}>
                <div style={{
                    position: 'relative',
                    background: isTrailerPlaying
                        ? 'linear-gradient(to bottom, transparent 88%, rgba(0,0,0,0.8) 100%)'
                        : 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.85) 100%)',
                    marginTop: isMobileView ? '-2vh' : '-43vh',
                    paddingTop: isMobileView ? '2.5rem' : '6rem',
                    paddingBottom: '1rem',
                    transition: 'background 1s ease',
                    pointerEvents: 'none'
                }}>
                    <div style={{ pointerEvents: 'auto' }}>
                        <MovieRow title={category === 'tv' ? 'Trending TV' : 'Trending Now'} movies={mainData} />
                    </div>
                </div>

                <div style={{
                    position: 'relative',
                    marginTop: '-250px',
                    paddingTop: '250px',
                    overflow: 'visible',
                    pointerEvents: 'none'
                }}>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        {/* Top10 — lazy: loads when user scrolls near it */}
                        <div ref={top10Ref}>
                            {top10Visible ? (
                                <div
                                    className="top10-outer-box section-loaded"
                                    style={{
                                        position: 'relative',
                                        margin: isMobileView ? '0 2% 1.5rem' : '0 2% 2rem',
                                        padding: '0',
                                        border: isMobileView ? '1px solid rgba(220, 38, 38, 0.3)' : '2px solid rgba(220, 38, 38, 0.5)',
                                        borderRadius: isMobileView ? '12px' : '16px',
                                        background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.12) 0%, rgba(0, 0, 0, 0.55) 35%, rgba(0, 0, 0, 0.5) 65%, rgba(220, 38, 38, 0.08) 100%)',
                                        backdropFilter: isMobileView ? 'blur(12px)' : 'blur(24px)',
                                        WebkitBackdropFilter: isMobileView ? 'blur(12px)' : 'blur(24px)',
                                        boxShadow: isMobileView
                                            ? '0 0 16px rgba(220, 38, 38, 0.06), inset 0 0 30px rgba(220, 38, 38, 0.02)'
                                            : '0 0 40px rgba(220, 38, 38, 0.15), inset 0 0 80px rgba(220, 38, 38, 0.04)',
                                        overflow: 'hidden',
                                        pointerEvents: 'auto'
                                    }}>
                                    <div style={{
                                        position: 'absolute', inset: 0,
                                        background: 'radial-gradient(ellipse 80% 50% at 20% 30%, rgba(220, 38, 38, 0.15) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 70%, rgba(220, 38, 38, 0.08) 0%, transparent 50%)',
                                        pointerEvents: 'none', borderRadius: 'inherit',
                                    }} />
                                    <div style={{ position: 'relative', zIndex: 1 }}>
                                        <Top10Section movies={top10Data} />
                                    </div>
                                </div>
                            ) : (
                                /* Skeleton placeholder while Top10 is off-screen */
                                <div className="section-lazy-placeholder" aria-hidden="true">
                                    <div className="skeleton-row">
                                        {[...Array(5)].map((_, i) => (
                                            <div key={i} className="skeleton-card" style={{ animationDelay: `${i * 0.08}s` }} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div style={{
                            paddingTop: '2rem',
                            paddingBottom: '8rem',
                            pointerEvents: 'auto'
                        }}>
                            {/* Providers — lazy */}
                            {category === 'all' && (
                                <div ref={providersRef}>
                                    {providersVisible && <ProvidersSection />}
                                </div>
                            )}

                            {/* Dynamic Content Shelves — each handles its own lazy loading internally */}
                            {/* 1. Popular Right Now - Movies */}
                            <DynamicContentShelf shelfType="movie" show={showMovies} />
                            {/* 2. Popular Right Now - TV Shows */}
                            <DynamicContentShelf shelfType="tv" show={showTV} />
                            {/* 3. Top Rated Movies */}
                            <DynamicContentShelf shelfType="topRatedMovies" show={showMovies} />
                            {/* 4. Top Rated Series */}
                            <DynamicContentShelf shelfType="topRatedSeries" show={showTV} />
                            {/* 5. Anime */}
                            <DynamicContentShelf shelfType="anime" show={category === 'all' || category === 'tv' || category === 'movies'} />
                            {/* 6. Film & Documentary */}
                            <DynamicContentShelf shelfType="docs" show={category === 'all' || category === 'movies' || category === 'tv'} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
