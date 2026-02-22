import React, { useEffect, useState } from 'react';
import Hero from '../components/Hero';
import MovieRow from '../components/MovieRow';
import Top10Section from '../components/Top10Section';
import ProvidersSection from '../components/ProvidersSection';
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

    // TV Show state
    const [trendingTV, setTrendingTV] = useState([]);
    const [popularTV, setPopularTV] = useState([]);
    const [topRatedTV, setTopRatedTV] = useState([]);
    const [dramaTV, setDramaTV] = useState([]);

    // Preload YouTube API early so trailer loads faster
    useEffect(() => {
        loadYouTubeAPI();
    }, []);

    useEffect(() => {
        const fetchSecondary = async () => {
            try {
                const [
                    topRatedRes, actionRes, comedyRes, horrorRes,
                    romanceRes, docsRes, scifiRes, upcomingRes,
                    popularTVRes, topRatedTVRes, dramaTVRes
                ] = await Promise.all([
                    getTopRatedMovies(), getActionMovies(), getComedyMovies(), getHorrorMovies(),
                    getRomanceMovies(), getDocumentaries(), getSciFiMovies(), getUpcomingMovies(),
                    getPopularTVShows(), getTopRatedTVShows(), getDramaTVShows()
                ]);

                setTopRated(topRatedRes.data.results);
                setAction(actionRes.data.results);
                setComedy(comedyRes.data.results);
                setHorror(horrorRes.data.results);
                setRomance(romanceRes.data.results);
                setDocs(docsRes.data.results);
                setSciFi(scifiRes.data.results);
                setUpcoming(upcomingRes.data.results);

                const filterAnimation = (results) => results.filter(item => !item.genre_ids?.includes(16));
                setPopularTV(filterAnimation(popularTVRes.data.results));
                setTopRatedTV(filterAnimation(topRatedTVRes.data.results));
                setDramaTV(filterAnimation(dramaTVRes.data.results));
            } catch (error) {
                console.error("Failed to fetch secondary movies:", error);
            }
        };

        const fetchPrimary = async () => {
            try {
                const [
                    trendingDayRes1, trendingDayRes2, trendingDayRes3,
                    trendingWeekRes1, trendingWeekRes2, trendingWeekRes3,
                    trendingTVDayRes1, trendingTVDayRes2, trendingTVDayRes3,
                    trendingTVWeekRes1, trendingTVWeekRes2, trendingTVWeekRes3
                ] = await Promise.all([
                    getTrendingMovies(1), getTrendingMovies(2), getTrendingMovies(3),
                    getTrendingMoviesWeek(1), getTrendingMoviesWeek(2), getTrendingMoviesWeek(3),
                    getTrendingTVShows(1), getTrendingTVShows(2), getTrendingTVShows(3),
                    getTrendingTVShowsWeek(1), getTrendingTVShowsWeek(2), getTrendingTVShowsWeek(3)
                ]);

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

                setTrending(mergeAndShuffle(
                    trendingDayRes1.data.results, trendingDayRes2.data.results, trendingDayRes3.data.results,
                    trendingWeekRes1.data.results, trendingWeekRes2.data.results, trendingWeekRes3.data.results
                ));

                const filterAnimation = (results) => results.filter(item => !item.genre_ids?.includes(16));

                setTrendingTV(mergeAndShuffle(
                    filterAnimation(trendingTVDayRes1.data.results),
                    filterAnimation(trendingTVDayRes2.data.results),
                    filterAnimation(trendingTVDayRes3.data.results),
                    filterAnimation(trendingTVWeekRes1.data.results),
                    filterAnimation(trendingTVWeekRes2.data.results),
                    filterAnimation(trendingTVWeekRes3.data.results)
                ));

                // Instantly trigger secondary background load once primary is ready
                fetchSecondary();
            } catch (error) {
                console.error("Failed to fetch primary movies:", error);
            }
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
            document.head.appendChild(link);
            return link;
        });
        return () => links.forEach(link => link.parentNode?.removeChild(link));
    }, [mainData]);

    return (
        <div className="home-page pb-20">
            <Hero
                key={heroMovie?.id || 'hero'}
                movie={heroMovie}
                onTrailerStart={handleTrailerStart}
                onTrailerEnd={handleTrailerEnd}
                isTrailerPlaying={isTrailerPlaying}
            />

            <div style={{ position: 'relative', zIndex: 20 }}>
                {/* Custom XORYA Open Layout */}
                <div style={{
                    position: 'relative',
                    background: 'linear-gradient(to bottom, transparent 0%, #000 100px)',
                    marginTop: isTrailerPlaying ? '0vh' : '-55vh',
                    paddingTop: '6rem',
                    paddingBottom: '4rem',
                    transition: 'margin-top 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                }}>
                    <MovieRow title={category === 'tv' ? 'Trending TV' : 'Trending Now'} movies={mainData} />
                </div>

                {/* Full-area striped background: TOP 10 → end of page */}
                <div className="striped-bg-full" style={{ position: 'relative' }}>
                    <div style={{ position: 'relative' }}>
                        {/* Red box - wraps entire TOP 10 section (header + carousel) */}
                        <div style={{
                            position: 'relative',
                            margin: '0 2% 2rem',
                            padding: '0',
                            border: '2px solid rgba(220, 38, 38, 0.5)',
                            borderRadius: '16px',
                            background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.12) 0%, rgba(0, 0, 0, 0.55) 35%, rgba(0, 0, 0, 0.5) 65%, rgba(220, 38, 38, 0.08) 100%)',
                            backdropFilter: 'blur(24px)',
                            WebkitBackdropFilter: 'blur(24px)',
                            boxShadow: '0 0 40px rgba(220, 38, 38, 0.15), inset 0 0 80px rgba(220, 38, 38, 0.04)',
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
                            paddingBottom: '4rem',
                        }}>
                            {category === 'all' && <ProvidersSection />}

                            {/* Stylish TV Popular Header */}
                            {showTV && (
                                <>
                                    <div style={{ padding: '0 2rem', marginBottom: '-1rem', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <h1 style={{
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
                                        </h1>
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
                                    <div style={{ padding: '0 2rem', marginBottom: '-1rem', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <h1 style={{
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
                                        </h1>
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

                                    {/* Stylish TV Trending Header */}
                                    <div style={{ padding: '0 2rem', marginBottom: '-1rem', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <h1 style={{
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
                                        </h1>
                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#818cf8', opacity: 0.8 }} />
                                        <span style={{
                                            fontSize: '1.1rem',
                                            color: '#e2e8f0',
                                            fontWeight: '600',
                                            letterSpacing: '3px',
                                            textTransform: 'uppercase',
                                            textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                                        }}>
                                            Trending
                                        </span>
                                    </div>
                                    <MovieRow title="" movies={trendingTV} />
                                </>
                            )}

                            {/* Stylish Movie Upcoming Header */}
                            {showMovies && (
                                <>
                                    <div style={{ padding: '0 2rem', marginBottom: '-1rem', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <h1 style={{
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
                                        </h1>
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
                                    <div style={{ padding: '0 2rem', marginBottom: '-1rem', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <h1 style={{
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
                                        </h1>
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
                                    <div style={{ padding: '0 2rem', marginBottom: '-1rem', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <h1 style={{
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
                                        </h1>
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
                </div>
            </div>
        </div>
    );
};
export default Home;
