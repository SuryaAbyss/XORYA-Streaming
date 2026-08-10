import React, { useState, useEffect, useRef } from 'react';
import { useLazySection } from '../hooks/useLazySection';
import {
    ChevronDown,
    Check,
    Flame,
    Star,
    TrendingUp,
    Calendar,
    Radio,
    Swords,
    Target,
    Skull,
    Smile,
    Rocket,
    Drama,
    Heart,
    FileText,
    Tv,
    Film,
    Clock,
    BookOpen
} from 'lucide-react';
import { gsap } from 'gsap';
import MovieRow from './MovieRow';
import * as api from '../api/tmdb';
import * as imdbApi from '../api/imdb';
import GridPattern from './ui/GridPattern';

const IconMap = {
    flame: Flame,
    star: Star,
    trending: TrendingUp,
    calendar: Calendar,
    radio: Radio,
    swords: Swords,
    target: Target,
    skull: Skull,
    smile: Smile,
    rocket: Rocket,
    drama: Drama,
    heart: Heart,
    fileText: FileText,
    tv: Tv,
    film: Film,
    clock: Clock,
    bookOpen: BookOpen
};

const SHELF_CONFIGS = {
    tv: {
        categoryText: "TV",
        anchorLabel: "TV SHOWS",
        categories: [
            // Sections
            {
                id: 'popular',
                label: 'Popular Right Now',
                apiFunc: 'getIMDbCuratedTVShows',
                colorRgb: '0, 163, 255',
                colorStart: '#00A3FF',
                colorEnd: '#0047FF',
                subtitle: '487 titles • Updated Today',
                group: 'section',
                icon: 'flame'
            },
            {
                id: 'top_rated',
                label: 'Top Rated',
                apiFunc: 'getTopRatedTVShows',
                colorRgb: '157, 77, 255',
                colorStart: '#9D4DFF',
                colorEnd: '#6030FF',
                subtitle: '325 titles • Updated Today',
                group: 'section',
                icon: 'star'
            },
            {
                id: 'trending',
                label: 'Trending',
                apiFunc: 'getTrendingTVShows',
                colorRgb: '0, 255, 213',
                colorStart: '#00FFD5',
                colorEnd: '#00B3A6',
                subtitle: 'Trending Now',
                group: 'section',
                icon: 'trending'
            },
            {
                id: 'airing_today',
                label: 'Airing Today',
                apiFunc: 'getAiringTodayTVShows',
                colorRgb: '0, 255, 135',
                colorStart: '#00FF87',
                colorEnd: '#00B359',
                subtitle: 'Airing Today',
                group: 'section',
                icon: 'calendar'
            },
            {
                id: 'on_the_air',
                label: 'On The Air',
                apiFunc: 'getOnTheAirTVShows',
                colorRgb: '0, 229, 255',
                colorStart: '#00E5FF',
                colorEnd: '#0097A7',
                subtitle: 'Currently Broadcasting',
                group: 'section',
                icon: 'radio'
            },
            // Genres
            {
                id: 'action',
                label: 'Action & Adventure',
                apiFunc: 'getActionTVShows',
                colorRgb: '255, 138, 0',
                colorStart: '#FF8A00',
                colorEnd: '#FF6A00',
                subtitle: 'Action & Adventure Series',
                group: 'genre',
                icon: 'swords'
            },
            {
                id: 'thriller',
                label: 'Mystery & Thriller',
                apiFunc: 'getMysteryTVShows',
                colorRgb: '138, 43, 226',
                colorStart: '#8A2BE2',
                colorEnd: '#4B0082',
                subtitle: 'Mysterious & Suspenseful',
                group: 'genre',
                icon: 'target'
            },
            {
                id: 'comedy',
                label: 'Comedy Shows',
                apiFunc: 'getComedyTVShows',
                colorRgb: '255, 215, 0',
                colorStart: '#FFD700',
                colorEnd: '#FF8C00',
                subtitle: 'Humorous & Fun',
                group: 'genre',
                icon: 'smile'
            },
            {
                id: 'drama',
                label: 'Drama Series',
                apiFunc: 'getDramaTVShows',
                colorRgb: '108, 122, 137',
                colorStart: '#6C7A89',
                colorEnd: '#4E5A65',
                subtitle: 'Dramatic Stories',
                group: 'genre',
                icon: 'drama'
            },
            {
                id: 'scifi',
                label: 'Sci-Fi & Fantasy',
                apiFunc: 'getSciFiTVShows',
                colorRgb: '56, 189, 248',
                colorStart: '#38bdf8',
                colorEnd: '#0369a1',
                subtitle: 'Out of this World',
                group: 'genre',
                icon: 'rocket'
            },
            {
                id: 'crime',
                label: 'Crime',
                apiFunc: 'getCrimeTVShows',
                colorRgb: '165, 42, 42',
                colorStart: '#A52A2A',
                colorEnd: '#5C1515',
                subtitle: 'Crime Investigations',
                group: 'genre',
                icon: 'drama'
            },
            {
                id: 'documentary',
                label: 'Documentary',
                apiFunc: 'getDocumentaryTVShows',
                colorRgb: '128, 128, 0',
                colorStart: '#808000',
                colorEnd: '#4D4D00',
                subtitle: 'Real World Stories',
                group: 'genre',
                icon: 'fileText'
            }
        ]
    },
    movie: {
        categoryText: "MOVIES",
        anchorLabel: "MOVIES",
        categories: [
            // Sections
            {
                id: 'popular',
                label: 'Popular Right Now',
                apiFunc: 'getPopularMovies',
                colorRgb: '255, 77, 77',
                colorStart: '#FF4D4D',
                colorEnd: '#FF1E1E',
                subtitle: 'Trending Among Viewers',
                group: 'section',
                icon: 'flame'
            },
            {
                id: 'top_rated',
                label: 'Top Rated',
                apiFunc: 'getTopRatedMovies',
                colorRgb: '255, 215, 0',
                colorStart: '#FFD700',
                colorEnd: '#FFB300',
                subtitle: 'Based on Viewer Ratings',
                scaledDown: true,
                group: 'section',
                icon: 'star'
            },
            {
                id: 'trending',
                label: 'Trending',
                apiFunc: 'getTrendingMovies',
                colorRgb: '0, 255, 213',
                colorStart: '#00FFD5',
                colorEnd: '#00B3A6',
                subtitle: 'Trending Today',
                group: 'section',
                icon: 'trending'
            },
            {
                id: 'upcoming',
                label: 'Upcoming Releases',
                apiFunc: 'getUpcomingMovies',
                colorRgb: '255, 138, 0',
                colorStart: '#FF8A00',
                colorEnd: '#FF6A00',
                subtitle: 'Coming Soon to XORYA',
                group: 'section',
                icon: 'clock'
            },
            // Genres
            {
                id: 'action',
                label: 'Action Movies',
                apiFunc: 'getActionMovies',
                colorRgb: '255, 77, 77',
                colorStart: '#FF4D4D',
                colorEnd: '#FF1E1E',
                subtitle: 'High-Octane Action',
                group: 'genre',
                icon: 'swords'
            },
            {
                id: 'thriller',
                label: 'Thriller Movies',
                apiFunc: 'getThrillerMovies',
                colorRgb: '220, 20, 60',
                colorStart: '#DC143C',
                colorEnd: '#8B0000',
                subtitle: 'Suspenseful Thrillers',
                group: 'genre',
                icon: 'target'
            },
            {
                id: 'comedy',
                label: 'Comedy Movies',
                apiFunc: 'getComedyMovies',
                colorRgb: '255, 215, 0',
                colorStart: '#FFD700',
                colorEnd: '#FF8C00',
                subtitle: 'Laugh out Loud',
                group: 'genre',
                icon: 'smile'
            },
            {
                id: 'horror',
                label: 'Horror Collection',
                apiFunc: 'getHorrorMovies',
                colorRgb: '255, 77, 77',
                colorStart: '#FF4D4D',
                colorEnd: '#FF1E1E',
                subtitle: 'Spooky & Terrifying Stories',
                group: 'genre',
                icon: 'skull'
            },
            {
                id: 'scifi',
                label: 'Sci-Fi Movies',
                apiFunc: 'getSciFiMovies',
                colorRgb: '56, 189, 248',
                colorStart: '#38bdf8',
                colorEnd: '#0369a1',
                subtitle: 'Sci-Fi & Fantasy',
                group: 'genre',
                icon: 'rocket'
            },
            {
                id: 'romance',
                label: 'Romance',
                apiFunc: 'getRomanceMovies',
                colorRgb: '255, 105, 180',
                colorStart: '#FF69B4',
                colorEnd: '#C71585',
                subtitle: 'Love & Romance',
                group: 'genre',
                icon: 'heart'
            },
            {
                id: 'crime',
                label: 'Crime',
                apiFunc: 'getCrimeMovies',
                colorRgb: '75, 0, 130',
                colorStart: '#4B0082',
                colorEnd: '#2A004D',
                subtitle: 'Mystery & Crime',
                group: 'genre',
                icon: 'drama'
            },
            {
                id: 'documentary',
                label: 'Documentary',
                apiFunc: 'getDocumentaries',
                colorRgb: '95, 158, 160',
                colorStart: '#5F9EA0',
                colorEnd: '#2F4F4F',
                subtitle: 'Real Life Documentaries',
                group: 'genre',
                icon: 'fileText'
            }
        ]
    },
    anime: {
        categoryText: "ANIME",
        anchorLabel: "ANIME / ANIMATION",
        categories: [
            // Sections
            {
                id: 'anime_tv',
                label: 'Anime Series',
                apiFunc: 'getAnimeTVShows',
                colorRgb: '255, 138, 0',
                colorStart: '#FF8A00',
                colorEnd: '#FF6A00',
                subtitle: 'Popular Anime Series',
                group: 'section',
                icon: 'tv'
            },
            {
                id: 'anime_movies',
                label: 'Anime Movies',
                apiFunc: 'getAnimeMovies',
                colorRgb: '255, 105, 180',
                colorStart: '#FF69B4',
                colorEnd: '#C71585',
                subtitle: 'Feature Anime Movies',
                group: 'section',
                icon: 'film'
            },
            // Genres
            {
                id: 'action',
                label: 'Action Anime',
                apiFunc: 'getAnimeAction',
                colorRgb: '255, 77, 77',
                colorStart: '#FF4D4D',
                colorEnd: '#FF1E1E',
                subtitle: 'Action & Adventure Anime',
                group: 'genre',
                icon: 'swords'
            },
            {
                id: 'fantasy',
                label: 'Fantasy Anime',
                apiFunc: 'getAnimeFantasy',
                colorRgb: '157, 77, 255',
                colorStart: '#9D4DFF',
                colorEnd: '#6030FF',
                subtitle: 'Magic & Supernatural Anime',
                group: 'genre',
                icon: 'clock'
            },
            {
                id: 'comedy',
                label: 'Comedy Anime',
                apiFunc: 'getAnimeComedy',
                colorRgb: '255, 215, 0',
                colorStart: '#FFD700',
                colorEnd: '#FF8C00',
                subtitle: 'Funny & Whimsical Anime',
                group: 'genre',
                icon: 'smile'
            }
        ]
    },
    docs: {
        categoryText: "DOCS",
        anchorLabel: "DOCUMENTARIES",
        categories: [
            // Sections
            {
                id: 'docs_movies',
                label: 'Documentary Movies',
                apiFunc: 'getDocumentaries',
                colorRgb: '95, 158, 160',
                colorStart: '#5F9EA0',
                colorEnd: '#2F4F4F',
                subtitle: 'Award-Winning Docu-Films',
                group: 'section',
                icon: 'film'
            },
            {
                id: 'docs_tv',
                label: 'Docuseries',
                apiFunc: 'getDocumentaryTVShows',
                colorRgb: '0, 168, 150',
                colorStart: '#00A896',
                colorEnd: '#028090',
                subtitle: 'In-Depth Docuseries',
                group: 'section',
                icon: 'tv'
            },
            // Genres
            {
                id: 'history',
                label: 'History & War',
                apiFunc: 'getHistoryDocs',
                colorRgb: '205, 127, 50',
                colorStart: '#CD7F32',
                colorEnd: '#8B5A2B',
                subtitle: 'Historical Chronicles',
                group: 'genre',
                icon: 'bookOpen'
            },
            {
                id: 'nature',
                label: 'Science & Nature',
                apiFunc: 'getScienceDocs',
                colorRgb: '46, 139, 87',
                colorStart: '#2E8B57',
                colorEnd: '#1E5A38',
                subtitle: 'Exploring Our Planet',
                group: 'genre',
                icon: 'calendar'
            },
            {
                id: 'crime',
                label: 'True Crime',
                apiFunc: 'getCrimeDocs',
                colorRgb: '139, 0, 0',
                colorStart: '#8B0000',
                colorEnd: '#4A0000',
                subtitle: 'True Crime Investigations',
                group: 'genre',
                icon: 'skull'
            }
        ]
    },
    topRatedMovies: {
        categoryText: "MOVIES",
        anchorLabel: "MOVIES",
        categories: [
            {
                id: 'top_rated',
                label: 'Top Rated Movies',
                apiFunc: 'getIMDbCuratedTopMovies',
                colorRgb: '255, 215, 0',
                colorStart: '#FFD700',
                colorEnd: '#FFB300',
                subtitle: 'Highest Rated of All Time',
                group: 'section',
                icon: 'star'
            }
        ]
    },
    topRatedSeries: {
        categoryText: "TV",
        anchorLabel: "TV SHOWS",
        categories: [
            {
                id: 'top_rated_tv',
                label: 'Top Rated Series',
                apiFunc: 'getIMDbCuratedTopTVShows',
                colorRgb: '157, 77, 255',
                colorStart: '#9D4DFF',
                colorEnd: '#6030FF',
                subtitle: 'Best-Rated Series of All Time',
                group: 'section',
                icon: 'star'
            }
        ]
    }
};

const DynamicContentShelf = ({ shelfType, show, lazyLoad = true }) => {
    const config = SHELF_CONFIGS[shelfType];
    if (!show || !config) return null;

    const [selectedCat, setSelectedCat] = useState(config.categories[0]);
    const [movies, setMovies] = useState([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const headerContentRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);

    // Lazy section: only load when user scrolls near this section
    const { ref: lazyRef, isVisible: lazyVisible } = useLazySection('250px 0px');
    // If lazyLoad is disabled, treat as always visible
    const shouldFetch = !lazyLoad || lazyVisible;

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Load data when category changes — but ONLY if section is visible (lazy)
    useEffect(() => {
        if (!shouldFetch) return; // wait until scrolled into view

        let isCancelled = false;

        const fetchData = async () => {
            setIsLoading(true);

            // GSAP fade-out of header
            if (headerContentRef.current) {
                gsap.to(headerContentRef.current, {
                    opacity: 0, y: -10, duration: 0.15, ease: 'power2.in'
                });
            }

            try {
                const fetchFn = api[selectedCat.apiFunc] || imdbApi[selectedCat.apiFunc];
                if (!fetchFn) throw new Error(`API function ${selectedCat.apiFunc} is not defined`);
                const response = await fetchFn();
                const rawList = Array.isArray(response) ? response : (response.data?.results || []);
                const results = rawList.filter(item => item.poster_path && item.backdrop_path);

                if (!isCancelled) {
                    setMovies(results);
                    setIsLoading(false);
                    setTimeout(() => {
                        if (headerContentRef.current) {
                            gsap.fromTo(headerContentRef.current,
                                { opacity: 0, y: 10 },
                                { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }
                            );
                        }
                    }, 50);
                }
            } catch (error) {
                console.error('Error fetching dynamic shelf data: ', error);
                if (!isCancelled) setIsLoading(false);
            }
        };

        fetchData();
        return () => { isCancelled = true; };
    }, [selectedCat, shouldFetch]);

    const handleCategorySelect = (cat) => {
        setSelectedCat(cat);
        setIsDropdownOpen(false);
    };

    // Helper to group categories
    const sections = config.categories.filter(cat => cat.group === 'section');
    const genres = config.categories.filter(cat => cat.group === 'genre');

    const renderItem = (cat) => {
        const IconComponent = IconMap[cat.icon];
        const isSelected = selectedCat.id === cat.id;
        return (
            <li
                key={cat.id}
                onClick={() => handleCategorySelect(cat)}
                className={`premium-dropdown-item ${isSelected ? 'selected' : ''}`}
                role="option"
                aria-selected={isSelected}
            >
                {IconComponent && (
                    <IconComponent
                        size={16}
                        className="premium-dropdown-item-icon"
                        style={{
                            color: isSelected ? 'var(--section-color-start)' : cat.colorStart || 'var(--section-color-start)'
                        }}
                    />
                )}
                <span className="premium-dropdown-item-label">{cat.label}</span>
                {isSelected && (
                    <Check
                        size={16}
                        className="premium-dropdown-item-checkmark"
                        style={{ color: 'var(--section-color-start)' }}
                    />
                )}
            </li>
        );
    };

    // While not yet visible and lazyLoad is on, show a slim placeholder
    if (lazyLoad && !lazyVisible) {
        return (
            <div ref={lazyRef} className="section-lazy-placeholder" aria-hidden="true">
                <div className="skeleton-row">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="skeleton-card" style={{ animationDelay: `${i * 0.08}s` }} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div
            ref={lazyRef}
            className={`premium-section-container section-loaded ${selectedCat.scaledDown ? 'scaled-down' : ''} ${isDropdownOpen ? 'dropdown-open' : ''}`}
            style={{
                '--section-color-rgb': selectedCat.colorRgb,
                '--section-color-start': selectedCat.colorStart,
                '--section-color-end': selectedCat.colorEnd
            }}
        >
            <GridPattern
                width={30}
                height={30}
                strokeDasharray="2 2"
                style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0.12,
                    pointerEvents: 'none',
                    zIndex: 0,
                    stroke: 'rgba(255, 255, 255, 0.05)',
                    maskImage: 'radial-gradient(ellipse 60% 50% at 50% 50%, #000 30%, transparent 100%)',
                    WebkitMaskImage: 'radial-gradient(ellipse 60% 50% at 50% 50%, #000 30%, transparent 100%)'
                }}
            />
            <div className="premium-section-header">
                <span className="premium-section-header-bg">{config.categoryText}</span>
                <div className="premium-section-content" ref={headerContentRef}>
                    <span className="anchor-label">{config.anchorLabel}</span>
                    <h2>{selectedCat.label}</h2>
                    <p>{selectedCat.subtitle}</p>
                </div>

                {/* Glassmorphic Dropdown */}
                <div className="premium-dropdown" ref={dropdownRef}>
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className={`premium-dropdown-btn ${isDropdownOpen ? 'active' : ''}`}
                        aria-expanded={isDropdownOpen}
                        aria-haspopup="listbox"
                    >
                        {selectedCat.label}
                        <ChevronDown size={16} className="premium-dropdown-chevron" />
                    </button>

                    {isDropdownOpen && (
                        <div className="premium-dropdown-menu" role="listbox" data-lenis-prevent>
                            {sections.length > 0 && (
                                <div className="premium-dropdown-group">
                                    <div className="premium-dropdown-group-header">BROWSE BY SECTION</div>
                                    <ul className="premium-dropdown-group-list">
                                        {sections.map((cat) => renderItem(cat))}
                                    </ul>
                                </div>
                            )}

                            {sections.length > 0 && genres.length > 0 && (
                                <div className="premium-dropdown-divider" />
                            )}

                            {genres.length > 0 && (
                                <div className="premium-dropdown-group">
                                    <div className="premium-dropdown-group-header">BROWSE BY GENRE</div>
                                    <ul className="premium-dropdown-group-list">
                                        {genres.map((cat) => renderItem(cat))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <MovieRow title="" movies={movies} isLandscape={true} />
        </div>
    );
};

export default DynamicContentShelf;
