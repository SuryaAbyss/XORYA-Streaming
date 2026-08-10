import React, { useState, useEffect } from 'react';
import { getWatchProviders, getDiscoverByProvider, imageUrl } from '../api/tmdb';
import MovieRow from './MovieRow';
import { motion } from 'framer-motion';
import { InfiniteSlider } from './ui/infinite-slider';

// Common US Provider IDs in the order we want to display them
const PREFERRED_PROVIDERS = [
    8,    // Netflix
    337,  // Disney+
    9,    // Amazon Prime Video
    119,  // Amazon Prime Video (Alternate)
    350,  // Apple TV+
    2,    // Apple TV
    15,   // Hulu
    384,  // HBO Max legacy
    1899, // Max / HBO Max
    34,   // Max?
    531,  // Paramount+
    386,  // Peacock Premium
    387,  // Peacock Premium Plus
    211,  // Freeform
    2383, // Philo
    156,  // A&E
    43,   // Starz
    80,   // AMC
    526,  // AMC+
    584,  // Discovery+
    300,  // Pluto TV
    73,   // Tubi TV
    283,  // Crunchyroll
    257,  // Fubo
    582,  // MGM+
];

const ProvidersSection = () => {
    const [type, setType] = useState('movie'); // 'movie' or 'tv'
    const [providers, setProviders] = useState([]);
    const [selectedProvider, setSelectedProvider] = useState(null);
    const [providerContent, setProviderContent] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch Providers when component mounts or type changes
    useEffect(() => {
        const fetchProviders = async () => {
            try {
                const res = await getWatchProviders(type);
                // Filter to only the ones we explicitly want, and sort them to match our preferred order
                const allProviders = res.data.results || [];

                const filtered = [];
                const seen = new Set();

                // Add preferred ones first
                PREFERRED_PROVIDERS.forEach(id => {
                    const found = allProviders.find(p => p.provider_id === id);
                    if (found && !seen.has(id) && !seen.has(found.provider_name)) {
                        filtered.push(found);
                        seen.add(id);
                        // don't add duplicate named providers if 2 / 350 overlap
                        seen.add(found.provider_name);
                    }
                });

                setProviders(filtered);

                // Default select the first provider (Netflix usually)
                if (filtered.length > 0) {
                    setSelectedProvider(filtered[0]);
                }
            } catch (err) {
                console.error("Failed to load providers: ", err);
            }
        };

        fetchProviders();
    }, [type]);

    // Fetch content when Selected Provider or Type changes
    useEffect(() => {
        const fetchContent = async () => {
            if (!selectedProvider) return;
            setLoading(true);
            try {
                const res = await getDiscoverByProvider(selectedProvider.provider_id, type);
                setProviderContent(res.data.results || []);
            } catch (err) {
                console.error("Failed to fetch provider content:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchContent();
    }, [selectedProvider, type]);

    return (
        <div
            className="premium-section-container"
            style={{
                '--section-color-rgb': '168, 85, 247',
                '--section-color-start': '#a855f7',
                '--section-color-end': '#7c3aed',
                marginBottom: '2.5rem',
                position: 'relative',
                zIndex: 10
            }}
        >

            <div
                className="premium-section-header"
                style={{
                    background: 'radial-gradient(circle at 10% 50%, rgba(168, 85, 247, 0.15), transparent 70%)'
                }}
            >
                <span className="premium-section-header-bg">STREAM</span>
                <div className="premium-section-content">
                    <span className="anchor-label" style={{ color: '#a855f7' }}>
                        CHANNELS
                    </span>
                    <h2>Providers</h2>
                    <p>Browse content from your favorite streaming services</p>
                </div>

                {/* Movies | TV Toggle */}
                <div className="premium-dropdown" style={{
                    borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
                    height: '100%',
                    padding: '0 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <div style={{
                        display: 'flex',
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '8px',
                        padding: '4px',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        <button
                            onClick={() => setType('movie')}
                            style={{
                                padding: '8px 16px',
                                background: type === 'movie' ? 'rgba(255,255,255,0.1)' : 'transparent',
                                color: type === 'movie' ? 'white' : '#9ca3af',
                                border: 'none',
                                borderRadius: '6px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                boxShadow: type === 'movie' ? '0 2px 8px rgba(0,0,0,0.2)' : 'none'
                            }}
                        >
                            Movies
                        </button>
                        <button
                            onClick={() => setType('tv')}
                            style={{
                                padding: '8px 16px',
                                background: type === 'tv' ? 'rgba(255,255,255,0.1)' : 'transparent',
                                color: type === 'tv' ? 'white' : '#9ca3af',
                                border: 'none',
                                borderRadius: '6px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                boxShadow: type === 'tv' ? '0 2px 8px rgba(0,0,0,0.2)' : 'none'
                            }}
                        >
                            TV Shows
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area inside Container */}
            <div style={{ position: 'relative', zIndex: 1, paddingBottom: '0.5rem' }}>
                {/* Horizontal Scroll of Providers */}
                <div style={{
                    overflow: 'hidden',
                    padding: '1.5rem 0 1rem 0',
                    maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
                    WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)'
                }}>
                    {providers.length > 0 && (
                        <InfiniteSlider gap={16} duration={80} durationOnHover={250}>
                            {providers.map((provider) => {
                                const isSelected = selectedProvider?.provider_id === provider.provider_id;

                                // Simple logic to extract brand colors for glow
                                let glowColor = 'rgba(255, 255, 255, 0.4)'; // default
                                if (provider.provider_name.includes('Netflix')) glowColor = 'rgba(229, 9, 20, 0.6)';
                                else if (provider.provider_name.includes('Disney')) glowColor = 'rgba(1, 20, 124, 0.8)';
                                else if (provider.provider_name.includes('Prime')) glowColor = 'rgba(0, 168, 225, 0.6)';
                                else if (provider.provider_name.includes('Hulu')) glowColor = 'rgba(28, 231, 131, 0.6)';
                                else if (provider.provider_name.includes('Crunchyroll')) glowColor = 'rgba(244, 117, 33, 0.6)';
                                else if (provider.provider_name.includes('Max')) glowColor = 'rgba(88, 34, 180, 0.6)';
                                else if (provider.provider_name.includes('Peacock')) glowColor = 'rgba(235, 196, 21, 0.6)';
                                else if (provider.provider_name.includes('Freeform')) glowColor = 'rgba(1, 153, 255, 0.6)';
                                else if (provider.provider_name.includes('Paramount')) glowColor = 'rgba(0, 100, 255, 0.6)';
                                else if (provider.provider_name.includes('Tubi')) glowColor = 'rgba(246, 126, 32, 0.6)';
                                else if (provider.provider_name.includes('Pluto')) glowColor = 'rgba(255, 255, 0, 0.6)';

                                return (
                                    <motion.button
                                        key={provider.provider_id}
                                        onClick={() => setSelectedProvider(provider)}
                                        style={{
                                            flexShrink: 0,
                                            width: '80px',
                                            height: '80px',
                                            borderRadius: '16px',
                                            padding: '4px', // small gap for border
                                            background: isSelected ? 'linear-gradient(to bottom, #2a2a2a, #111)' : 'rgba(255, 255, 255, 0.05)',
                                            border: isSelected ? `2px solid rgba(255,255,255, 0.8)` : '1px solid rgba(255, 255, 255, 0.1)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'all 0.3s ease',
                                            boxShadow: isSelected ? `0 0 20px ${glowColor}, inset 0 0 10px ${glowColor}` : 'none',
                                        }}
                                    >
                                        <img
                                            src={imageUrl(provider.logo_path, 'w154')}
                                            alt={provider.provider_name}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'contain',
                                                borderRadius: '12px'
                                            }}
                                        />
                                    </motion.button>
                                )
                            })}
                        </InfiniteSlider>
                    )}
                </div>

                {/* Provider Content Row */}
                {selectedProvider && (
                    <div style={{ marginTop: '0.5rem' }}>
                        <p className="providers-browse-text" style={{ paddingLeft: '28px', marginBottom: '0.5rem' }}>
                            Browse top {type === 'movie' ? 'movies' : 'shows'} from <span className="text-white font-bold">{selectedProvider.provider_name}</span>
                        </p>
                        {loading ? (
                            <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : (
                            <MovieRow title="" movies={providerContent} />
                        )}
                    </div>
                )}
            </div>

            <style>{`
                /* Hide scrollbar for Chrome, Safari and Opera */
                div::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </div>
    );
};

export default ProvidersSection;
