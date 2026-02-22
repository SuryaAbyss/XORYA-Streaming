import React, { useState, useEffect } from 'react';
import { getWatchProviders, getDiscoverByProvider, imageUrl } from '../api/tmdb';
import MovieRow from './MovieRow';
import { motion } from 'framer-motion';

// Common US Provider IDs in the order we want to display them
const PREFERRED_PROVIDERS = [
    8,    // Netflix
    337,  // Disney+
    9,    // Amazon Prime Video
    119,  // Amazon Prime Video (Alternate)
    350,  // Apple TV+
    2,    // Apple TV
    15,   // Hulu
    283,  // Crunchyroll
    257,  // Fubo
    384,  // HBO Max / Max
    34, // Max?
    531,  // Paramount+
    387,  // Peacock
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
                    if (found && !seen.has(id)) {
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
        <div style={{ padding: '2rem 0', position: 'relative', zIndex: 10 }}>
            <div style={{ padding: '0 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: 'white' }}>Providers</h2>
                    <p style={{ color: '#9ca3af', margin: '0.5rem 0 1.5rem 0', fontSize: '1.1rem' }}>
                        Browse content from your favorite streaming services
                    </p>
                </div>

                {/* Movies | TV Toggle */}
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

            {/* Horizontal Scroll of Providers */}
            <div style={{
                display: 'flex',
                gap: '12px',
                padding: '0 2rem 1.5rem',
                overflowX: 'auto',
                scrollbarWidth: 'none', // Firefox
                msOverflowStyle: 'none',  // IE and Edge
            }}>
                {providers.map((provider) => {
                    const isSelected = selectedProvider?.provider_id === provider.provider_id;

                    // Simple logic to extract brand colors for glow
                    // In a perfect world we'd use color-thief, but simple mapping based on name works well enough:
                    let glowColor = 'rgba(255, 255, 255, 0.4)'; // default
                    if (provider.provider_name.includes('Netflix')) glowColor = 'rgba(229, 9, 20, 0.6)';
                    else if (provider.provider_name.includes('Disney')) glowColor = 'rgba(1, 20, 124, 0.8)';
                    else if (provider.provider_name.includes('Prime')) glowColor = 'rgba(0, 168, 225, 0.6)';
                    else if (provider.provider_name.includes('Hulu')) glowColor = 'rgba(28, 231, 131, 0.6)';
                    else if (provider.provider_name.includes('Crunchyroll')) glowColor = 'rgba(244, 117, 33, 0.6)';
                    else if (provider.provider_name.includes('Max')) glowColor = 'rgba(88, 34, 180, 0.6)';

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
            </div>

            {/* Provider Content Row */}
            {selectedProvider && (
                <div style={{ marginTop: '1rem' }}>
                    <p style={{ padding: '0 2rem', color: '#9ca3af', marginBottom: '-0.5rem' }}>
                        Browse top {type === 'movie' ? 'movies' : 'shows'} from <span style={{ color: 'white', fontWeight: 'bold' }}>{selectedProvider.provider_name}</span>
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
