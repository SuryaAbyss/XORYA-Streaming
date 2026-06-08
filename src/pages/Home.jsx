import React, { useEffect, useState } from 'react';
import Hero from '../components/Hero';
import MovieRow from '../components/MovieRow';
import Top10Section from '../components/Top10Section';
import ProvidersSection from '../components/ProvidersSection';
import SmokeBackground from '../components/SmokeBackground';
import GridBackground from '../components/GridBackground';
import SEO from '../components/SEO';
import { imageUrl } from '../api/tmdb';
import { loadYouTubeAPI } from '../hooks/useYouTubePlayer';
import {
    getTrendingMovies,
    getTrendingMoviesWeek,
    getTopRatedMovies,
    getActionMovies,
    getComedyMovies,
    getHorrorMovies,
    getRomanceMovies,
    getDocumentaries,
    getSciFiMovies,
    getUpcomingMovies,
    getTrendingTVShows,
    getTrendingTVShowsWeek,
    getPopularTVShows,
    getTopRatedTVShows,
    getDramaTVShows
} from '../api/tmdb';

const Home = ({ category = 'all' }) => {
    const [trending, setTrending] = useState([]);
    const [topRated, setTopRated] = useState([]);
    const [action, setAction] = useState([]);
    const [comedy, setComedy] = useState([]);
    const [horror, setHorror] = useState([]);
    const [romance, setRomance] = useState([]);
    const [docs, setDocs] = useState([]);
    const [scifi, setSciFi] = useState([]);
    const [upcoming, setUpcoming] = useState([]);

    // Detect mobile for layout adjustments
    const isMobileView = typeof window !== 'undefined' && navigator.maxTouchPoints > 0 && window.innerWidth <= 768;

    // TV Show state
    const [trendingTV, setTrendingTV] = useState([]);
    const [popularTV, setPopularTV] = useState([]);
    const [topRatedTV, setTopRatedTV] = useState([]);
    const [dramaTV, setDramaTV] = useState([]);

    // Preload YouTube API early so trailer loads faster (desktop only)
    useEffect(() => {
        const isMobile = navigator.maxTouchPoints > 0 && window.innerWidth <= 768;
        if (!isMobile) {
            loadYouTubeAPI();
        }
    }, []);

    // Scroll to top on mount or category change
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [category]);

    useEffect(() => {
        const fetchSecondary = async () => {
            // allSettled: if any single request fails/throttles, others still succeed
            const safe = (r) => {
                if (r.status !== 'fulfilled') return [];
                return (r.value?.data?.results || []).filter(item => item.poster_path && item.backdrop_path);
            };
            const results = await Promise.allSettled([
                getTopRatedMovies(), getActionMovies(), getComedyMovies(), getHorrorMovies(),
                getRomanceMovies(), getDocumentaries(), getSciFiMovies(), getUpcomingMovies(),
                getPopularTVShows(), getTopRatedTVShows(), getDramaTVShows()
            ]);
            const [
                topRatedRes, actionRes, comedyRes, horrorRes,
                romanceRes, docsRes, scifiRes, upcomingRes,
                popularTVRes, topRatedTVRes, dramaTVRes
            ] = results;

            if (safe(topRatedRes).length) setTopRated(safe(topRatedRes));
            if (safe(actionRes).length) setAction(safe(actionRes));
            if (safe(comedyRes).length) setComedy(safe(comedyRes));
            if (safe(horrorRes).length) setHorror(safe(horrorRes));
            if (safe(romanceRes).length) setRomance(safe(romanceRes));
            if (safe(docsRes).length) setDocs(safe(docsRes));
            if (safe(scifiRes).length) setSciFi(safe(scifiRes));
            if (safe(upcomingRes).length) setUpcoming(safe(upcomingRes));

            const filterAnimation = (arr) => arr.filter(item => !item.genre_ids?.includes(16));
            if (safe(popularTVRes).length) setPopularTV(filterAnimation(safe(popularTVRes)));
            if (safe(topRatedTVRes).length) setTopRatedTV(filterAnimation(safe(topRatedTVRes)));
            if (safe(dramaTVRes).length) setDramaTV(filterAnimation(safe(dramaTVRes)));
        };

        const fetchPrimary = async () => {
            // allSettled: one throttled page won't kill the whole batch
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

            // Helper to merge, deduplicate by id, and shuffle
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
            if (trendingTVItems.length) setTrendingTV(trendingTVItems);

            // Trigger secondary load after primary completes
            fetchSecondary();
        };

        fetchPrimary();
    }, []);


    const [isTrailerPlaying, setIsTrailerPlaying] = useState(false);
    const [currentHeroIndex, setCurrentHeroIndex] = useState(() => Math.floor(Math.random() * 20));

    const showMovies = category === 'all' || category === 'movies';
    const showTV = category === 'all' || category === 'tv';
    const mainData = category === 'tv' ? trendingTV : trending;

    // Re-randomize when trending data first loads
    React.useEffect(() => {
        if (mainData.length > 0) {
            setCurrentHeroIndex(Math.floor(Math.random() * mainData.length));
        }
    }, [mainData.length > 0, category]);

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

    return (
        <div className="home-page pb-0">
            <SEO 
                title="XORYA - Premium Streaming Platform"
                description="Watch the latest and most popular movies and TV shows on XORYA. Experience premium streaming with an interactive interface."
            />
            <h1 style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', border: 0 }}>XORYA - Premium Streaming Platform</h1>
            {/* Grid pattern only in the hero/header area */}
            <GridBackground>
                <Hero
                    movie={heroMovie}
                    onTrailerStart={handleTrailerStart}
                    onTrailerEnd={handleTrailerEnd}
                    isTrailerPlaying={isTrailerPlaying}
                />
            </GridBackground>

            <div style={{ position: 'relative', zIndex: 20, pointerEvents: 'none' }}>
                {/* Custom XORAYA Open Layout */}
                <div style={{
                    position: 'relative',
                    background: 'linear-gradient(to bottom, transparent 0%, #000 150px)',
                    marginTop: isTrailerPlaying ? '-15vh' : (isMobileView ? '-2vh' : '-45vh'),
                    paddingTop: isTrailerPlaying ? 'calc(6rem + 15vh)' : (isMobileView ? '2.5rem' : '6rem'),
                    paddingBottom: '1rem',
                    transition: 'margin-top 1s cubic-bezier(0.25, 0.46, 0.45, 0.94), padding-top 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    pointerEvents: 'none'
                }}>
                    <div style={{ pointerEvents: 'auto' }}>
                        <MovieRow title={category === 'tv' ? 'Trending TV' : 'Trending Now'} movies={mainData} />
                    </div>
                </div>

                {/* Full-area animated smoke background: TOP 10 → end of page */}
                <div style={{
                    position: 'relative',
                    marginTop: '-250px',
                    paddingTop: '250px',
                    overflow: 'visible',
                    pointerEvents: 'auto'
                }}>
                    {/* Animated Smoke Background with a soft fade-in effect at the top */}
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: 0
                    }}>
                        <SmokeBackground
                            color="rgba(248,113,113,0.9)"
                            backgroundColor="transparent"
                            duration={160}
                            blurIntensity="0.75em"
                            density={1.1}
                        />
                    </div>

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        {/* Red box - wraps entire TOP 10 section (header + carousel) */}
                        <div
                            className="top10-outer-box"
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
                            }}>
                            {/* Gradient blur overlay for extra glassmorphism depth */}
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'radial-gradient(ellipse 80% 50% at 20% 30%, rgba(220, 38, 38, 0.15) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 70%, rgba(220, 38, 38, 0.08) 0%, transparent 50%)',
                                pointerEvents: 'none',
                                borderRadius: 'inherit',
                            }} />
                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <Top10Section movies={mainData} />
                            </div>
                        </div>

                        <div style={{
                            paddingTop: '2rem',
                            paddingBottom: '0',
                        }}>
                            {category === 'all' && <ProvidersSection />}

                            {/* Stylish TV Popular Header */}
                            {showTV && (
                                <>
                                    <div className="home-section-header" style={{ padding: '0 2rem', marginBottom: '-1rem', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <h2 style={{
                                            fontSize: '1.8rem',
                                            fontWeight: '800',
                                            textTransform: 'uppercase',
                                            background: 'linear-gradient(to right, #38bdf8, #818cf8)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                            margin: 0,
                                            letterSpacing: '2px',
                                            textShadow: '0 0 20px rgba(56, 189, 248, 0.3)'
                                        }}>
                                            TV
                                        </h2>
                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#818cf8', opacity: 0.8 }} />
                                        <span style={{
                                            fontSize: '1.1rem',
                                            color: '#e2e8f0',
                                            fontWeight: '600',
                                            letterSpacing: '3px',
                                            textTransform: 'uppercase',
                                            textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                                        }}>
                                            Popular
                                        </span>
                                    </div>
                                    <MovieRow title="" movies={popularTV} />
                                    {/* Stylish TV Top Rated Header */}
                                    <div className="home-section-header" style={{ padding: '0 2rem', marginBottom: '-1rem', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <h2 style={{
                                            fontSize: '1.8rem',
                                            fontWeight: '800',
                                            textTransform: 'uppercase',
                                            background: 'linear-gradient(to right, #38bdf8, #818cf8)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                            margin: 0,
                                            letterSpacing: '2px',
                                            textShadow: '0 0 20px rgba(56, 189, 248, 0.3)'
                                        }}>
                                            TV
                                        </h2>
                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#818cf8', opacity: 0.8 }} />
                                        <span style={{
                                            fontSize: '1.1rem',
                                            color: '#e2e8f0',
                                            fontWeight: '600',
                                            letterSpacing: '3px',
                                            textTransform: 'uppercase',
                                            textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                                        }}>
                                            Top Rated
                                        </span>
                                    </div>
                                    <MovieRow title="" movies={topRatedTV} />

                                    {/* Removed TV Trending Header and Row */}
                                </>
                            )}

                            {/* Stylish Movie Upcoming Header */}
                            {showMovies && (
                                <>
                                    <div className="home-section-header" style={{ padding: '0 2rem', marginBottom: '-1rem', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <h2 style={{
                                            fontSize: '1.8rem',
                                            fontWeight: '800',
                                            textTransform: 'uppercase',
                                            background: 'linear-gradient(to right, #fbbf24, #f59e0b)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                            margin: 0,
                                            letterSpacing: '2px',
                                            textShadow: '0 0 20px rgba(251, 191, 36, 0.3)'
                                        }}>
                                            Movies
                                        </h2>
                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#f59e0b', opacity: 0.8 }} />
                                        <span style={{
                                            fontSize: '1.1rem',
                                            color: '#e2e8f0',
                                            fontWeight: '600',
                                            letterSpacing: '3px',
                                            textTransform: 'uppercase',
                                            textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                                        }}>
                                            Upcoming
                                        </span>
                                    </div>
                                    <MovieRow title="" movies={upcoming} />

                                    {/* Stylish Movie Action Thriller Header */}
                                    <div className="home-section-header" style={{ padding: '0 2rem', marginBottom: '-1rem', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <h2 style={{
                                            fontSize: '1.8rem',
                                            fontWeight: '800',
                                            textTransform: 'uppercase',
                                            background: 'linear-gradient(to right, #fbbf24, #f59e0b)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                            margin: 0,
                                            letterSpacing: '2px',
                                            textShadow: '0 0 20px rgba(251, 191, 36, 0.3)'
                                        }}>
                                            Movies
                                        </h2>
                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#f59e0b', opacity: 0.8 }} />
                                        <span style={{
                                            fontSize: '1.1rem',
                                            color: '#e2e8f0',
                                            fontWeight: '600',
                                            letterSpacing: '3px',
                                            textTransform: 'uppercase',
                                            textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                                        }}>
                                            Action Thriller
                                        </span>
                                    </div>
                                    <MovieRow title="" movies={action} />

                                    {/* Stylish Movie Horror Header */}
                                    <div className="home-section-header" style={{ padding: '0 2rem', marginBottom: '-1rem', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <h2 style={{
                                            fontSize: '1.8rem',
                                            fontWeight: '800',
                                            textTransform: 'uppercase',
                                            background: 'linear-gradient(to right, #fbbf24, #f59e0b)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                            margin: 0,
                                            letterSpacing: '2px',
                                            textShadow: '0 0 20px rgba(251, 191, 36, 0.3)'
                                        }}>
                                            Movies
                                        </h2>
                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#f59e0b', opacity: 0.8 }} />
                                        <span style={{
                                            fontSize: '1.1rem',
                                            color: '#e2e8f0',
                                            fontWeight: '600',
                                            letterSpacing: '3px',
                                            textTransform: 'uppercase',
                                            textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                                        }}>
                                            Horror
                                        </span>
                                    </div>
                                    <MovieRow title="" movies={horror} />
                                </>
                            )}
                        </div>
                    </div>

                    {/* Smooth bottom fade — blends the last row into the footer */}
                    <div style={{
                        position: 'relative',
                        height: '180px',
                        marginTop: '-180px',
                        pointerEvents: 'none',
                        background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.6) 40%, #000 100%)',
                        zIndex: 5,
                    }} />
                </div>
            </div>
        </div>
    );
};
export default Home;
