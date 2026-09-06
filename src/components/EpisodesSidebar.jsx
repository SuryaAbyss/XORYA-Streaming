import React, { useState, useEffect } from 'react';
import { Play, Calendar, Star, Clock, Info, ChevronDown, ChevronUp, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { getSeasonDetails, getTVEpisodeCredits, getTVEpisodeImages, imageUrl } from '../api/tmdb';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const EpisodesSidebar = ({
    showId,
    seasons = [],
    currentSeason,
    currentEpisode,
    onSeasonChange,
    onEpisodeSelect,
    onEpisodesLoaded,
    showData,
    recommendations = [],
    hideTabs = false,
    mediaType = 'tv'
}) => {
    const navigate = useNavigate();
    const isMovie = mediaType === 'movie';
    const [activeTab, setActiveTab] = useState(isMovie ? 'details' : 'episodes'); // 'episodes', 'details', 'cast', 'similar'

    useEffect(() => {
        if (isMovie) {
            setActiveTab('details');
        } else if (hideTabs) {
            setActiveTab('episodes');
        }
    }, [hideTabs, isMovie]);

    const [autoplay, setAutoplay] = useState(true);
    const [countdown, setCountdown] = useState(10);
    const [isCounting, setIsCounting] = useState(false);
    const [episodes, setEpisodes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isEpisodesOpen, setIsEpisodesOpen] = useState(true);
    const [showAllEpisodes, setShowAllEpisodes] = useState(false);
    const [seriesCast, setSeriesCast] = useState([]);
    const [episodeGuests, setEpisodeGuests] = useState([]);
    const [loadingEpisodeCast, setLoadingEpisodeCast] = useState(false);
    const [episodeStills, setEpisodeStills] = useState([]);
    const [loadingStills, setLoadingStills] = useState(false);
    const [previewImageIndex, setPreviewImageIndex] = useState(null);

    useEffect(() => {
        setPreviewImageIndex(null);
    }, [currentEpisode, currentSeason]);


    useEffect(() => {
        const fetchEpisodeStills = async () => {
            if (!showId || !currentSeason || !currentEpisode || isMovie) return;
            setLoadingStills(true);
            try {
                const data = await getTVEpisodeImages(showId, currentSeason, currentEpisode);
                if (data && data.stills && data.stills.length > 0) {
                    setEpisodeStills(data.stills.map(s => s.file_path));
                } else {
                    setEpisodeStills([]);
                }
            } catch (error) {
                console.error('Failed to fetch episode stills:', error);
                setEpisodeStills([]);
            } finally {
                setLoadingStills(false);
            }
        };

        fetchEpisodeStills();
    }, [showId, currentSeason, currentEpisode, isMovie]);

    useEffect(() => {
        const fetchEpisodeCast = async () => {
            if (!showId || !currentSeason || !currentEpisode) return;
            setLoadingEpisodeCast(true);
            try {
                const data = await getTVEpisodeCredits(showId, currentSeason, currentEpisode);
                setEpisodeGuests(data.guest_stars || []);
                setSeriesCast(data.cast || []);
            } catch (error) {
                console.error('Failed to fetch episode credits:', error);
                setEpisodeGuests([]);
                setSeriesCast([]);
            } finally {
                setLoadingEpisodeCast(false);
            }
        };

        fetchEpisodeCast();
    }, [showId, currentSeason, currentEpisode]);


    useEffect(() => {
        const fetchEpisodes = async () => {
            if (!showId) return;

            setLoading(true);
            try {
                const response = await getSeasonDetails(showId, currentSeason);
                const episodeList = response.episodes || [];
                setEpisodes(episodeList);
                setIsEpisodesOpen(true); // Auto-open when season changes
                setShowAllEpisodes(false);
                // Notify parent of episode count so Next button can handle season transitions
                if (onEpisodesLoaded) onEpisodesLoaded(currentSeason, episodeList.length);
            } catch (error) {
                console.error('Failed to fetch season details:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchEpisodes();
    }, [showId, currentSeason]);

    // Countdown and Autoplay logic
    useEffect(() => {
        let timer;
        if (isCounting && countdown > 0 && autoplay) {
            timer = setInterval(() => {
                setCountdown(c => c - 1);
            }, 1000);
        } else if (countdown === 0 && autoplay) {
            // Trigger next episode
            const nextEp = episodes.find(e => e.episode_number === currentEpisode + 1);
            if (nextEp) {
                onEpisodeSelect(currentSeason, nextEp.episode_number);
            }
            setIsCounting(false);
            setCountdown(10);
        }
        return () => clearInterval(timer);
    }, [isCounting, countdown, autoplay, episodes, currentEpisode, currentSeason, onEpisodeSelect]);

    // Reset countdown when current episode changes
    useEffect(() => {
        setCountdown(10);
        setIsCounting(false);
    }, [currentEpisode, currentSeason]);

    // Collapse episode list back to current episode whenever the episode changes
    useEffect(() => {
        setShowAllEpisodes(false);
    }, [currentEpisode, currentSeason]);

    const [glassMapUrl, setGlassMapUrl] = useState('');

    useEffect(() => {
        fetch("https://essykings.github.io/JavaScript/map.png")
            .then((response) => response.blob())
            .then((blob) => {
                const objURL = URL.createObjectURL(blob);
                setGlassMapUrl(objURL);
            })
            .catch(err => console.error("Failed to load map for glass effect", err));

        return () => {
            if (glassMapUrl) URL.revokeObjectURL(glassMapUrl);
        };
    }, []);

    if (!showId && !showData) return null;

    const nextEpisode = episodes.find(e => e.episode_number === currentEpisode + 1);

    // Default (collapsed) view: show the currently-playing episode + next 2.
    // This ensures E18 is always visible without needing to expand.
    const currentEpIdx = episodes.findIndex(e => e.episode_number === currentEpisode);
    const visibleEpisodes = showAllEpisodes
        ? episodes
        : episodes.slice(
            currentEpIdx >= 0 ? currentEpIdx : 0,
            currentEpIdx >= 0 ? currentEpIdx + 3 : 3
        );

    const currentEp = episodes.find(e => e.episode_number === currentEpisode);
    const displayedStills = episodeStills.length > 0
        ? episodeStills
        : (currentEp?.still_path ? [currentEp.still_path] : (showData?.backdrop_path ? [showData.backdrop_path] : []));

    const tabs = isMovie ? [
        { id: 'details', label: 'Details' },
        { id: 'cast', label: 'Cast' },
        { id: 'similar', label: 'More Like This' }

    ] : [
        { id: 'episodes', label: 'Episodes' },
        { id: 'cast', label: 'Cast' },
        { id: 'details', label: 'Details' },
        { id: 'similar', label: 'More Like This' }
    ];

    const renderDetailsTab = () => {
        if (!showData) return <div style={{ color: 'rgba(255,255,255,0.4)', padding: '1.5rem 0.5rem' }}>No details available</div>;

        if (isMovie) {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', color: 'white', fontSize: '0.9rem', padding: '0.5rem 0' }}>
                    <div>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--theme-accent)' }}>Synopsis</h4>
                        <p style={{ lineHeight: '1.6', color: 'rgba(255,255,255,0.8)', margin: 0 }}>{showData.overview}</p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'rgba(255,255,255,0.5)' }}>Release Date</span>
                            <span>{showData.release_date ? new Date(showData.release_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</span>
                        </div>
                        {showData.runtime > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'rgba(255,255,255,0.5)' }}>Runtime</span>
                                <span>{Math.floor(showData.runtime / 60)}h {showData.runtime % 60}m</span>
                            </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'rgba(255,255,255,0.5)' }}>Status</span>
                            <span>{showData.status || 'Released'}</span>
                        </div>
                        {showData.vote_average > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'rgba(255,255,255,0.5)' }}>Rating</span>
                                <span style={{ color: '#facc15', fontWeight: '700' }}>★ {showData.vote_average.toFixed(1)} / 10</span>
                            </div>
                        )}
                        {showData.genres && showData.genres.length > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: 'rgba(255,255,255,0.5)' }}>Genres</span>
                                <span style={{ fontWeight: '600', color: 'rgba(255,255,255,0.9)' }}>
                                    {showData.genres.map(g => g.name).join(', ')}
                                </span>
                            </div>
                        )}
                        {showData.budget > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'rgba(255,255,255,0.5)' }}>Budget</span>
                                <span>${showData.budget.toLocaleString()}</span>
                            </div>
                        )}
                        {showData.revenue > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'rgba(255,255,255,0.5)' }}>Revenue</span>
                                <span>${showData.revenue.toLocaleString()}</span>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        // TV Show Episode Details View
        const currentEp = episodes.find(e => e.episode_number === currentEpisode);
        const epOverview = currentEp?.overview || 'No specific episode summary available for this episode.';
        const displayedStills = episodeStills.length > 0
            ? episodeStills
            : (currentEp?.still_path ? [currentEp.still_path] : (showData?.backdrop_path ? [showData.backdrop_path] : []));

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', color: 'white', fontSize: '0.9rem', padding: '0.5rem 0' }}>
                {/* 1. Episode Details Overview */}
                <div>
                    <div style={{
                        fontSize: '0.78rem',
                        fontWeight: '700',
                        color: 'var(--theme-accent)',
                        marginBottom: '0.3rem',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase'
                    }}>
                        Season {currentSeason} • Episode {currentEpisode}
                    </div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: '800', marginBottom: '0.6rem', color: '#fff' }}>
                        {currentEp?.name || `Episode ${currentEpisode}`}
                    </h4>
                    <p style={{ lineHeight: '1.6', color: 'rgba(255,255,255,0.85)', margin: 0, fontSize: '0.88rem' }}>
                        {epOverview}
                    </p>
                </div>

                {/* 2. Small Image Cards Section - TMDB Episode Stills */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'rgba(255, 255, 255, 0.65)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Episode Stills ({displayedStills.length})</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--theme-accent)', fontWeight: '600' }}>
                            Season {currentSeason} Episode {currentEpisode}
                        </span>
                    </div>

                    {loadingStills ? (
                        <div style={{ padding: '1rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
                            Fetching episode stills...
                        </div>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                            gap: '0.75rem',
                            maxHeight: '260px',
                            overflowY: 'auto',
                            paddingRight: '0.2rem'
                        }}>
                            {displayedStills.map((stillPath, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => setPreviewImageIndex(idx)}
                                    title="Click to enlarge image"
                                    style={{
                                        borderRadius: '10px',
                                        overflow: 'hidden',
                                        border: '1px solid rgba(255, 255, 255, 0.12)',
                                        background: 'rgba(255, 255, 255, 0.04)',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                                        cursor: 'pointer',
                                        transition: 'all 0.25s ease'
                                    }}
                                >
                                    <div style={{ width: '100%', aspectRatio: '16/9', overflow: 'hidden', position: 'relative' }}>
                                        <img
                                            src={imageUrl(stillPath, 'w300')}
                                            alt={`Season ${currentSeason} Episode ${currentEpisode} still ${idx + 1}`}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    </div>
                                </div>
                            ))}

                        </div>
                    )}
                </div>

                {/* 3. Episode Air Date & Rating */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem' }}>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'rgba(255,255,255,0.5)' }}>Episode Air Date</span>
                        <span style={{ fontWeight: '600' }}>
                            {currentEp?.air_date
                                ? new Date(currentEp.air_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
                                : (showData.first_air_date ? new Date(showData.first_air_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A')
                            }
                        </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'rgba(255,255,255,0.5)' }}>Episode Rating</span>
                        <span style={{ color: '#facc15', fontWeight: '700' }}>
                            ★ {currentEp?.vote_average ? currentEp.vote_average.toFixed(1) : (showData.vote_average?.toFixed(1) || 'N/A')} / 10
                        </span>
                    </div>
                    {currentEp?.runtime && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'rgba(255,255,255,0.5)' }}>Episode Runtime</span>
                            <span>{currentEp.runtime}m</span>
                        </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'rgba(255,255,255,0.5)' }}>Series Status</span>
                        <span>{showData.status || 'Ended'}</span>
                    </div>
                    {showData.genres && showData.genres.length > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: 'rgba(255,255,255,0.5)' }}>Genres</span>
                            <span style={{ fontWeight: '600', color: 'rgba(255,255,255,0.9)' }}>
                                {showData.genres.map(g => g.name).join(', ')}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        );
    };


    const renderCastTab = () => {
        if (loadingEpisodeCast) {
            return (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'rgba(255,255,255,0.4)' }}>
                    <div style={{
                        width: '30px',
                        height: '30px',
                        border: '2px solid rgba(var(--theme-accent-rgb), 0.3)',
                        borderTop: '2px solid var(--theme-accent)',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 0.8rem'
                    }}></div>
                    Loading episode cast...
                </div>
            );
        }

        const regulars = seriesCast.length > 0 ? seriesCast : (showData?.credits?.cast || []);
        const guests = episodeGuests;
        if (regulars.length === 0 && guests.length === 0) return <div style={{ color: 'rgba(255,255,255,0.4)', padding: '1.5rem 0.5rem' }}>No cast info available</div>;

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', padding: '0.5rem 0' }}>
                {/* Series Main Cast / Permanent Members */}
                {regulars.length > 0 && (
                    <div>
                        <div style={{
                            fontSize: '0.8rem',
                            fontWeight: '700',
                            color: 'var(--theme-accent)',
                            marginBottom: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem'
                        }}>
                            <span style={{ width: '4px', height: '4px', background: 'var(--theme-accent)', borderRadius: '50%' }}></span>
                            {isMovie ? 'Movie Main Cast' : 'Series Main Cast'}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '1rem', color: 'white' }}>
                            {regulars.slice(0, 18).map(person => (
                                <div key={person.id || person.credit_id} style={{ textAlign: 'center' }}>
                                    <div style={{
                                        width: '56px',
                                        height: '56px',
                                        borderRadius: '10px',
                                        overflow: 'hidden',
                                        margin: '0 auto 0.4rem',
                                        border: '1.5px solid rgba(var(--theme-accent-rgb), 0.3)',
                                        boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                                    }}>
                                        {person.profile_path ? (
                                            <img
                                                src={`https://image.tmdb.org/t/p/w200${person.profile_path}`}
                                                alt={person.name}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>👤</div>
                                        )}
                                    </div>
                                    <p style={{ fontSize: '0.75rem', fontWeight: '600', margin: '0 0 0.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {person.name}
                                    </p>
                                    <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {person.character || (person.roles && person.roles[0]?.character)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Divider & Guest Stars */}
                {guests.length > 0 && (
                    <>
                        <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', margin: '0.5rem 0' }} />
                        <div>
                            <div style={{
                                fontSize: '0.8rem',
                                fontWeight: '700',
                                color: 'rgba(255, 255, 255, 0.55)',
                                marginBottom: '0.8rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem'
                            }}>
                                <span style={{ width: '4px', height: '4px', background: 'rgba(255, 255, 255, 0.35)', borderRadius: '50%' }}></span>
                                Guest Appearances (Season {currentSeason} Episode {currentEpisode})
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '1rem', color: 'white' }}>
                                {guests.map(person => (
                                    <div key={person.id || person.credit_id} style={{ textAlign: 'center' }}>
                                        <div style={{
                                            width: '56px',
                                            height: '56px',
                                            borderRadius: '10px',
                                            overflow: 'hidden',
                                            margin: '0 auto 0.4rem',
                                            border: '1.5px solid rgba(255, 255, 255, 0.15)',
                                            boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                                        }}>
                                            {person.profile_path ? (
                                                <img
                                                    src={`https://image.tmdb.org/t/p/w200${person.profile_path}`}
                                                    alt={person.name}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>👤</div>
                                            )}
                                        </div>
                                        <p style={{ fontSize: '0.75rem', fontWeight: '600', margin: '0 0 0.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {person.name}
                                        </p>
                                        <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {person.character || (person.roles && person.roles[0]?.character)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        );
    };

    const renderSimilarTab = () => {
        if (recommendations.length === 0) return <div style={{ color: 'rgba(255,255,255,0.4)', padding: '1.5rem 0.5rem' }}>No recommendations available</div>;
        return (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', color: 'white', padding: '0.5rem 0' }}>
                {recommendations.slice(0, 8).map(show => (
                    <div
                        key={show.id}
                        onClick={() => navigate(isMovie ? `/watch/movie/${show.id}` : `/watch/tv/${show.id}`)}
                        style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}
                    >
                        <div style={{
                            width: '100%',
                            aspectRatio: '16/9',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            border: '1px solid rgba(255,255,255,0.1)',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                            transition: 'all 0.2s ease'
                        }}
                            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--theme-accent)'}
                            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                        >
                            <img
                                src={imageUrl(show.backdrop_path || show.poster_path, 'w300')}
                                alt={show.name || show.title}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        </div>
                        <span style={{
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            color: 'rgba(255,255,255,0.9)'
                        }}>
                            {show.name || show.title}
                        </span>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="watch-episode-panel" style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            overflow: 'hidden',
            fontFamily: "var(--font-main, 'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif)"
        }}>
            {/* Tabs Header */}
            {!hideTabs && (
                <div style={{
                    display: 'flex',
                    gap: '1.2rem',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    paddingBottom: '0.8rem',
                    marginBottom: '1rem',
                    paddingLeft: '0.2rem',
                    paddingRight: '0.2rem',
                    flexShrink: 0
                }}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: activeTab === tab.id ? 'var(--theme-accent)' : 'rgba(255, 255, 255, 0.65)',
                                fontSize: '0.9rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                padding: '0.2rem 0',
                                position: 'relative',
                                transition: 'all 0.2s ease',
                                outline: 'none'
                            }}
                        >
                            {tab.label}
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="sidebar-tab-indicator"
                                    style={{
                                        position: 'absolute',
                                        bottom: '-0.85rem',
                                        left: 0,
                                        right: 0,
                                        height: '2px',
                                        background: 'var(--theme-accent)',
                                        boxShadow: '0 0 8px var(--theme-accent)'
                                    }}
                                />
                            )}
                        </button>
                    ))}
                </div>
            )}

            {/* Scrollable Content Panel */}
            <div
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '0 0.2rem 2rem',
                    boxSizing: 'border-box',
                    overscrollBehavior: 'contain',
                    scrollbarWidth: 'none', // Hide standard scrollbar
                    msOverflowStyle: 'none'
                }}
                onWheel={(e) => e.stopPropagation()}
            >
                {activeTab === 'episodes' && (
                    <>
                        <div className="watch-season-row" style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr auto',
                            gap: '0.8rem',
                            alignItems: 'center',
                            marginBottom: '1rem'
                        }}>
                            <div style={{ position: 'relative' }}>
                                <select
                                    value={currentSeason}
                                    onChange={(e) => onSeasonChange(parseInt(e.target.value))}
                                    style={{
                                        width: '100%',
                                        padding: '0.82rem 2.5rem 0.82rem 1rem',
                                        background: 'rgba(255, 255, 255, 0.06)',
                                        border: '1px solid rgba(255, 255, 255, 0.12)',
                                        borderRadius: '10px',
                                        color: 'white',
                                        fontSize: '0.9rem',
                                        fontWeight: '650',
                                        cursor: 'pointer',
                                        appearance: 'none'
                                    }}
                                >
                                    {seasons.map((season) => (
                                        <option key={season.id} value={season.season_number} style={{ background: '#10131a', color: 'white' }}>
                                            {season.name}
                                        </option>
                                    ))}
                                </select>
                                <div style={{
                                    position: 'absolute',
                                    right: '1rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    pointerEvents: 'none',
                                    color: 'rgba(255,255,255,0.65)'
                                }}>
                                    <ChevronDown size={16} />
                                </div>
                            </div>

                            <button
                                onClick={() => setIsEpisodesOpen(!isEpisodesOpen)}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.82rem 1rem',
                                    background: 'rgba(var(--theme-accent-rgb), 0.08)',
                                    border: '1px solid rgba(var(--theme-accent-rgb), 0.18)',
                                    borderRadius: '10px',
                                    color: 'rgba(255,255,255,0.86)',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    fontSize: '0.82rem',
                                    fontWeight: 700
                                }}
                            >
                                {episodes.length} Episodes
                                {isEpisodesOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                            </button>
                        </div>

                        {/* Expandable Episodes List */}
                        <AnimatePresence>
                            {isEpisodesOpen && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                                    style={{ overflow: 'hidden' }}
                                >
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '1rem',
                                        paddingBottom: '1rem'
                                    }}>
                                        {loading ? (
                                            <div style={{
                                                textAlign: 'center',
                                                padding: '3rem 1rem',
                                                color: 'rgba(255,255,255,0.4)'
                                            }}>
                                                <div style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    border: '3px solid rgba(var(--theme-accent-rgb), 0.3)',
                                                    borderTop: '3px solid var(--theme-accent)',
                                                    borderRadius: '50%',
                                                    animation: 'spin 1s linear infinite',
                                                    margin: '0 auto 1rem'
                                                }}></div>
                                                Loading episodes...
                                            </div>
                                        ) : (
                                            visibleEpisodes.map((episode) => {
                                                const isCurrentEpisode = episode.episode_number === currentEpisode;

                                                if (isCurrentEpisode) {
                                                    return (
                                                        <motion.div
                                                            className="watch-episode-card active"
                                                            key={episode.id}
                                                            initial={{ opacity: 0, y: 15 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, scale: 0.95 }}
                                                            transition={{ duration: 0.3 }}
                                                            style={{
                                                                background: 'rgba(var(--theme-accent-rgb), 0.04)',
                                                                border: '1px solid var(--theme-accent)',
                                                                borderRadius: '12px',
                                                                boxShadow: '0 0 15px rgba(var(--theme-accent-rgb), 0.15)',
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                gap: '0.8rem',
                                                                padding: '0.8rem',
                                                                cursor: 'default'
                                                            }}
                                                        >
                                                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                                                {/* Thumbnail */}
                                                                <div style={{
                                                                    width: '125px',
                                                                    flexShrink: 0,
                                                                    aspectRatio: '16/9',
                                                                    borderRadius: '8px',
                                                                    overflow: 'hidden',
                                                                    position: 'relative',
                                                                    background: '#1a1a1a',
                                                                    border: '1px solid rgba(var(--theme-accent-rgb), 0.3)'
                                                                }}>
                                                                    {episode.still_path ? (
                                                                        <img
                                                                            src={imageUrl(episode.still_path, 'w300')}
                                                                            alt={episode.name}
                                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                                        />
                                                                    ) : (
                                                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>ðŸ“º</div>
                                                                    )}
                                                                    <div style={{
                                                                        position: 'absolute',
                                                                        bottom: 0,
                                                                        left: 0,
                                                                        right: 0,
                                                                        height: '3px',
                                                                        background: 'rgba(255,255,255,0.2)'
                                                                    }}>
                                                                        <div style={{ width: '45%', height: '100%', background: 'var(--theme-accent)' }} />
                                                                    </div>
                                                                </div>

                                                                {/* Info */}
                                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                                                                        <h4 style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--theme-accent)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                            E{episode.episode_number} â€¢ {episode.name}
                                                                        </h4>
                                                                        {/* Equalizer animation */}
                                                                        <div className="active-equalizer" style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '12px', flexShrink: 0 }}>
                                                                            <div className="eq-bar" style={{ width: '2px', background: 'var(--theme-accent)', animation: 'eq-pulse 1s infinite alternate 0.1s', height: '100%' }}></div>
                                                                            <div className="eq-bar" style={{ width: '2px', background: 'var(--theme-accent)', animation: 'eq-pulse 1s infinite alternate 0.3s', height: '70%' }}></div>
                                                                            <div className="eq-bar" style={{ width: '2px', background: 'var(--theme-accent)', animation: 'eq-pulse 1s infinite alternate 0.5s', height: '40%' }}></div>
                                                                        </div>
                                                                    </div>

                                                                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.4rem' }}>
                                                                        <span style={{ color: '#fbbf24' }}>â˜… {episode.vote_average?.toFixed(1)}</span>
                                                                        <span>â€¢</span>
                                                                        <span>{episode.runtime ? `${episode.runtime} min` : '42 min'}</span>
                                                                    </div>

                                                                    <p style={{
                                                                        fontSize: '0.72rem',
                                                                        color: 'rgba(255,255,255,0.6)',
                                                                        lineHeight: '1.4',
                                                                        display: '-webkit-box',
                                                                        WebkitLineClamp: 2,
                                                                        WebkitBoxOrient: 'vertical',
                                                                        overflow: 'hidden',
                                                                        margin: 0
                                                                    }}>
                                                                        {episode.overview}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            {/* Continue Watching Action button */}
                                                            <button style={{
                                                                width: '100%',
                                                                padding: '0.6rem',
                                                                background: 'linear-gradient(90deg, var(--theme-accent) 0%, rgba(var(--theme-accent-rgb), 0.7) 100%)',
                                                                border: 'none',
                                                                borderRadius: '8px',
                                                                color: 'black',
                                                                fontSize: '0.82rem',
                                                                fontWeight: '700',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                gap: '0.5rem',
                                                                boxShadow: '0 4px 12px rgba(var(--theme-accent-rgb), 0.25)',
                                                                transition: 'all 0.2s'
                                                            }}
                                                                onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.1)'}
                                                                onMouseLeave={(e) => e.currentTarget.style.filter = 'none'}
                                                            >
                                                                <Play size={12} fill="black" />
                                                                Continue Watching
                                                            </button>
                                                        </motion.div>
                                                    );
                                                }

                                                {/* Inactive Episode Card */ }
                                                return (
                                                    <motion.div
                                                        className="watch-episode-card"
                                                        key={episode.id}
                                                        initial={{ opacity: 0, y: 15 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.95 }}
                                                        transition={{ duration: 0.3 }}
                                                        style={{
                                                            background: 'rgba(0, 0, 0, 0.3)',
                                                            border: '1px solid rgba(255, 255, 255, 0.04)',
                                                            borderRadius: '12px',
                                                            padding: '0.6rem',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            gap: '0.8rem',
                                                            alignItems: 'center',
                                                            transition: 'all 0.2s'
                                                        }}
                                                        onClick={() => onEpisodeSelect(currentSeason, episode.episode_number)}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.04)';
                                                            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)';
                                                        }}
                                                    >
                                                        <div style={{
                                                            width: '105px',
                                                            flexShrink: 0,
                                                            aspectRatio: '16/9',
                                                            borderRadius: '8px',
                                                            overflow: 'hidden',
                                                            background: '#1a1a1a',
                                                            border: '1px solid rgba(255, 255, 255, 0.05)'
                                                        }}>
                                                            {episode.still_path ? (
                                                                <img
                                                                    src={imageUrl(episode.still_path, 'w300')}
                                                                    alt={episode.name}
                                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                                />
                                                            ) : (
                                                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>ðŸ“º</div>
                                                            )}
                                                        </div>

                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <h4 style={{ fontSize: '0.84rem', fontWeight: '600', color: 'rgba(255,255,255,0.85)', margin: '0 0 0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                <span style={{ color: 'var(--theme-accent)', fontWeight: 800 }}>E{episode.episode_number}</span> &nbsp; {episode.name}
                                                            </h4>
                                                            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>
                                                                <span style={{ color: '#fbbf24' }}>â˜… {episode.vote_average?.toFixed(1)}</span>
                                                                <span>â€¢</span>
                                                                <span>{episode.runtime ? `${episode.runtime} min` : '42 min'}</span>
                                                            </div>
                                                            <p className="watch-episode-summary" style={{
                                                                color: 'rgba(255,255,255,0.48)',
                                                                fontSize: '0.72rem',
                                                                lineHeight: 1.35,
                                                                margin: '0.28rem 0 0',
                                                                display: '-webkit-box',
                                                                WebkitLineClamp: 2,
                                                                WebkitBoxOrient: 'vertical',
                                                                overflow: 'hidden'
                                                            }}>
                                                                {episode.overview || 'Episode details are not available yet.'}
                                                            </p>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })
                                        )}
                                    </div>
                                    {!loading && !showAllEpisodes && episodes.length > visibleEpisodes.length && (
                                        <button
                                            onClick={() => setShowAllEpisodes(true)}
                                            className="watch-view-all-episodes"
                                            style={{
                                                width: '100%',
                                                padding: '0.85rem',
                                                marginTop: '0.2rem',
                                                borderRadius: '10px',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                background: 'rgba(255,255,255,0.045)',
                                                color: 'rgba(255,255,255,0.9)',
                                                cursor: 'pointer',
                                                fontSize: '0.86rem',
                                                fontWeight: 700
                                            }}
                                        >
                                            View all {episodes.length} episodes
                                        </button>
                                    )}
                                    {!loading && showAllEpisodes && (
                                        <button
                                            onClick={() => setShowAllEpisodes(false)}
                                            className="watch-view-all-episodes"
                                            style={{
                                                width: '100%',
                                                padding: '0.85rem',
                                                marginTop: '0.2rem',
                                                borderRadius: '10px',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                background: 'rgba(255,255,255,0.045)',
                                                color: 'rgba(255,255,255,0.9)',
                                                cursor: 'pointer',
                                                fontSize: '0.86rem',
                                                fontWeight: 700
                                            }}
                                        >
                                            Show fewer episodes
                                        </button>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </>
                )}

                {activeTab === 'details' && renderDetailsTab()}
                {activeTab === 'cast' && renderCastTab()}
                {activeTab === 'similar' && renderSimilarTab()}
            </div>
            {/* Up Next Autoplay section - OUTSIDE scroll area, always pinned at bottom */}
            {activeTab === 'episodes' && nextEpisode && (
                <div style={{
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    paddingTop: '1.2rem',
                    padding: '1.2rem 0.2rem 0',
                    flexShrink: 0
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'white' }}>Up Next</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Autoplay</span>
                            <button
                                onClick={() => setAutoplay(!autoplay)}
                                style={{
                                    width: '32px',
                                    height: '18px',
                                    borderRadius: '9px',
                                    background: autoplay ? 'var(--theme-accent)' : 'rgba(255,255,255,0.15)',
                                    border: 'none',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    transition: 'all 0.2s ease',
                                    padding: 0
                                }}
                            >
                                <div style={{
                                    width: '14px',
                                    height: '14px',
                                    borderRadius: '50%',
                                    background: autoplay ? 'black' : 'white',
                                    position: 'absolute',
                                    top: '2px',
                                    left: autoplay ? '16px' : '2px',
                                    transition: 'all 0.2s ease'
                                }} />
                            </button>
                        </div>
                    </div>

                    <div
                        onClick={() => {
                            if (isCounting) {
                                setIsCounting(false);
                                setCountdown(10);
                            } else {
                                setIsCounting(true);
                            }
                        }}
                        style={{
                            background: 'rgba(0, 0, 0, 0.3)',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            borderRadius: '12px',
                            padding: '0.8rem',
                            cursor: 'pointer',
                            display: 'flex',
                            gap: '0.8rem',
                            alignItems: 'center',
                            transition: 'all 0.2s ease',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)'}
                    >
                        <div style={{
                            width: '100px',
                            flexShrink: 0,
                            aspectRatio: '16/9',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            background: '#1a1a1a',
                            border: '1px solid rgba(255,255,255,0.05)'
                        }}>
                            {nextEpisode.still_path ? (
                                <img src={imageUrl(nextEpisode.still_path, 'w300')} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>ðŸ“º</div>
                            )}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                            <h5 style={{ fontSize: '0.82rem', fontWeight: '700', color: 'white', margin: '0 0 0.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                E{nextEpisode.episode_number} â€¢ {nextEpisode.name}
                            </h5>
                            <p style={{
                                fontSize: '0.7rem',
                                color: 'rgba(255,255,255,0.5)',
                                lineHeight: '1.3',
                                display: '-webkit-box',
                                WebkitLineClamp: 1,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                margin: 0
                            }}>
                                {nextEpisode.overview || 'No description available.'}
                            </p>
                            {autoplay && isCounting && (
                                <div style={{ fontSize: '0.7rem', color: 'var(--theme-accent)', fontWeight: '600', marginTop: '0.2rem' }}>
                                    Starts in {countdown} seconds
                                </div>
                            )}
                            {!isCounting && (
                                <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.2rem' }}>
                                    Click to test autoplay
                                </div>
                            )}
                        </div>

                        {autoplay && isCounting && (
                            <div style={{ width: '32px', height: '32px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <svg width="32" height="32" style={{ transform: 'rotate(-90deg)' }}>
                                    <circle cx="16" cy="16" r="13" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
                                    <circle cx="16" cy="16" r="13" fill="none" stroke="var(--theme-accent)" strokeWidth="2"
                                        strokeDasharray={2 * Math.PI * 13}
                                        strokeDashoffset={2 * Math.PI * 13 * (1 - countdown / 10)}
                                        style={{ transition: 'stroke-dashoffset 1s linear' }}
                                    />
                                </svg>
                                <span style={{ position: 'absolute', fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--theme-accent)' }}>{countdown}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {/* Image Viewer Lightbox Modal */}
            <AnimatePresence>
                {previewImageIndex !== null && displayedStills && displayedStills[previewImageIndex] && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setPreviewImageIndex(null)}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 999999,
                            background: 'rgba(0, 0, 0, 0.88)',
                            backdropFilter: 'blur(16px)',
                            WebkitBackdropFilter: 'blur(16px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '2rem'
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                position: 'relative',
                                maxWidth: '85vw',
                                maxHeight: '82vh',
                                borderRadius: '16px',
                                overflow: 'hidden',
                                boxShadow: '0 25px 60px rgba(0,0,0,0.95)',
                                border: '1px solid rgba(255,255,255,0.15)',
                                background: '#09090b',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            {/* Close Button (X) */}
                            <button
                                onClick={() => setPreviewImageIndex(null)}
                                aria-label="Close image preview"
                                style={{
                                    position: 'absolute',
                                    top: '14px',
                                    right: '14px',
                                    width: '38px',
                                    height: '38px',
                                    borderRadius: '50%',
                                    background: 'rgba(0, 0, 0, 0.65)',
                                    border: '1px solid rgba(255, 255, 255, 0.25)',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    zIndex: 10,
                                    transition: 'all 0.2s ease',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                                }}
                            >
                                <X size={20} color="#ffffff" />
                            </button>

                            {/* Main Preview Image */}
                            <img
                                src={imageUrl(displayedStills[previewImageIndex], 'original')}
                                alt={`Season ${currentSeason} Episode ${currentEpisode} Preview ${previewImageIndex + 1}`}
                                style={{
                                    width: 'auto',
                                    height: 'auto',
                                    maxWidth: '100%',
                                    maxHeight: '76vh',
                                    objectFit: 'contain',
                                    display: 'block'
                                }}
                            />

                            {/* Counter & Cycle Buttons */}
                            {displayedStills.length > 1 && (
                                <div style={{
                                    position: 'absolute',
                                    bottom: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1.2rem',
                                    background: 'rgba(0, 0, 0, 0.75)',
                                    padding: '6px 18px',
                                    borderRadius: '30px',
                                    border: '1px solid rgba(255, 255, 255, 0.18)',
                                    color: '#fff',
                                    fontSize: '0.85rem',
                                    fontWeight: '600',
                                    backdropFilter: 'blur(8px)',
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                                }}>
                                    <button
                                        onClick={() => setPreviewImageIndex((prev) => (prev > 0 ? prev - 1 : displayedStills.length - 1))}
                                        style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                    <span>{previewImageIndex + 1} / {displayedStills.length}</span>
                                    <button
                                        onClick={() => setPreviewImageIndex((prev) => (prev < displayedStills.length - 1 ? prev + 1 : 0))}
                                        style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes eq-pulse {
                    0% { height: 3px; }
                    100% { height: 12px; }
                }
            `}</style>
        </div>
    );
};


export default EpisodesSidebar;
