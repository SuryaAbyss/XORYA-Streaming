import React, { useMemo } from 'react';

// Crisp SVG Brand Icons matching the minimalist visual reference (Image 2) - Enlarged & High Clarity
const ICONS = {
    netflix: (
        <svg width="15" height="21" viewBox="0 0 111 200" fill="none" style={{ flexShrink: 0, display: 'block' }}>
            <path d="M0 0H28L68 116.5V0H96V200H68L28 83.5V200H0V0Z" fill="#E50914" />
        </svg>
    ),
    prime: (
        <svg width="48" height="19" viewBox="0 0 100 36" fill="none" style={{ flexShrink: 0, display: 'block' }}>
            <text x="0" y="22" fill="#00A8E1" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" fontWeight="900" fontSize="24" letterSpacing="-0.5">prime</text>
            <path d="M4 29c18 6 38 6 52-2" stroke="#00A8E1" strokeWidth="3" strokeLinecap="round" fill="none"/>
            <path d="M54 24l4 3-4 3" fill="#00A8E1"/>
        </svg>
    ),
    disney: (
        <svg width="54" height="20" viewBox="0 0 100 38" fill="none" style={{ flexShrink: 0, display: 'block' }}>
            <path d="M5 28C26 7 62 4 92 18" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" fill="none" opacity="0.9" />
            <text x="7" y="28" fill="#ffffff" fontFamily="Georgia, serif" fontWeight="bold" fontSize="23">Disney</text>
            <text x="77" y="27" fill="#00d2d3" fontFamily="-apple-system, sans-serif" fontWeight="900" fontSize="22">+</text>
        </svg>
    ),
    hbo: (
        <svg width="50" height="19" viewBox="0 0 100 28" fill="none" style={{ flexShrink: 0, display: 'block' }}>
            <text x="0" y="22" fill="#ffffff" fontFamily="-apple-system, sans-serif" fontWeight="900" fontSize="23" letterSpacing="0.5">HBO</text>
            <text x="56" y="22" fill="#a855f7" fontFamily="-apple-system, sans-serif" fontWeight="800" fontSize="19" fontStyle="italic">max</text>
        </svg>
    ),
    appletv: (
        <svg width="44" height="19" viewBox="0 0 85 28" fill="none" style={{ flexShrink: 0, display: 'block' }}>
            <path d="M8 8.5c1-1.3 2.6-2 4-2 .2 1.4-.4 2.8-1.2 3.7-1 1-2.4 1.7-3.8 1.6-.2-1.3.4-2.4 1-3.3zm3.7 3.5c-2 0-3.6 1.2-4.5 1.2s-2.4-1.1-4-1.1c-2 0-3.9 1.2-5 3.1-2.1 3.7-.5 9.1 1.5 12 1 1.4 2.1 3 3.7 2.9 1.5-.1 2.1-1 3.9-1s2.4.9 4 .9c1.6 0 2.6-1.4 3.6-2.9 1.2-1.7 1.7-3.4 1.7-3.5-.1-.1-3.2-1.3-3.2-5 0-3 2.5-4.5 2.6-4.6-1.5-2.2-3.8-2.5-4.3-2.5z" fill="#ffffff"/>
            <text x="24" y="22" fill="#ffffff" fontFamily="-apple-system, sans-serif" fontWeight="700" fontSize="19">tv+</text>
        </svg>
    ),
    paramount: (
        <svg width="74" height="19" viewBox="0 0 125 28" fill="none" style={{ flexShrink: 0, display: 'block' }}>
            <path d="M8 4l2.5 6.5h7l-5.5 4 2 6.5-6-4-6 4 2-6.5-5.5-4h7z" fill="#0064FF"/>
            <text x="24" y="21" fill="#ffffff" fontFamily="-apple-system, sans-serif" fontWeight="800" fontSize="16" letterSpacing="-0.5">Paramount+</text>
        </svg>
    ),
    hulu: (
        <svg width="42" height="16" viewBox="0 0 80 24" fill="none" style={{ flexShrink: 0, display: 'block' }}>
            <text x="0" y="20" fill="#1ce783" fontFamily="-apple-system, sans-serif" fontWeight="900" fontSize="23" letterSpacing="-1">hulu</text>
        </svg>
    )
};

const PLATFORMS_META = {
    netflix: { id: 'netflix', name: 'Netflix' },
    prime: { id: 'prime', name: 'Prime Video' },
    disney: { id: 'disney', name: 'Disney+' },
    hbo: { id: 'hbo', name: 'HBO Max' },
    appletv: { id: 'appletv', name: 'Apple TV+' },
    paramount: { id: 'paramount', name: 'Paramount+' },
    hulu: { id: 'hulu', name: 'Hulu' }
};

/**
 * Detects the primary release/streaming platform for a given movie/show from TMDB data
 */
function detectPrimaryPlatform(contentData) {
    if (!contentData) return null;

    // 1. Check TV Networks (e.g. Paramount+, Netflix, HBO, Disney+, Apple TV+)
    if (Array.isArray(contentData.networks)) {
        for (const net of contentData.networks) {
            const name = (net.name || '').toLowerCase();
            if (/netflix/i.test(name)) return 'netflix';
            if (/paramount|cbs|showtime/i.test(name)) return 'paramount';
            if (/disney/i.test(name)) return 'disney';
            if (/amazon|prime/i.test(name)) return 'prime';
            if (/hbo|max/i.test(name)) return 'hbo';
            if (/apple/i.test(name)) return 'appletv';
            if (/hulu/i.test(name)) return 'hulu';
        }
    }

    // 2. Check Watch Providers (Flatrate streaming platforms)
    const wpResults = contentData['watch/providers']?.results;
    if (wpResults) {
        const regionData = wpResults.US || wpResults.GB || wpResults.IN || Object.values(wpResults)[0];
        const flatrate = regionData?.flatrate || [];
        for (const p of flatrate) {
            const pName = (p.provider_name || '').toLowerCase();
            if (/netflix/i.test(pName)) return 'netflix';
            if (/paramount/i.test(pName)) return 'paramount';
            if (/disney/i.test(pName)) return 'disney';
            if (/amazon|prime/i.test(pName)) return 'prime';
            if (/hbo|max/i.test(pName)) return 'hbo';
            if (/apple/i.test(pName)) return 'appletv';
            if (/hulu/i.test(pName)) return 'hulu';
        }
    }

    // 3. Check Production Companies (for movies e.g. Pixar/Disney, Netflix Studios)
    if (Array.isArray(contentData.production_companies)) {
        for (const co of contentData.production_companies) {
            const cName = (co.name || '').toLowerCase();
            if (/netflix/i.test(cName)) return 'netflix';
            if (/disney|marvel|lucasfilm|pixar/i.test(cName)) return 'disney';
            if (/amazon|mgm/i.test(cName)) return 'prime';
            if (/warner|hbo/i.test(cName)) return 'hbo';
            if (/apple/i.test(cName)) return 'appletv';
            if (/paramount/i.test(cName)) return 'paramount';
        }
    }

    return null;
}

const OttPlatformStrip = ({ contentData, type = 'movie' }) => {
    const activeKey = useMemo(() => {
        return detectPrimaryPlatform(contentData) || 'netflix';
    }, [contentData]);

    // Build companion platforms (excluding the active platform)
    const companionPlatforms = useMemo(() => {
        const pool = ['netflix', 'prime', 'disney', 'hbo', 'appletv'];
        return pool.filter(k => k !== activeKey).slice(0, 4);
    }, [activeKey]);

    return (
        <div
            className="ott-platforms-strip"
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '1rem',
                marginTop: '0.1rem',
                flexWrap: 'nowrap',
                userSelect: 'none',
                height: '22px',
                lineHeight: 1
            }}
        >
            {/* "Available on" label */}
            <span
                style={{
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    color: 'rgba(255, 255, 255, 0.65)',
                    letterSpacing: '0.2px',
                    whiteSpace: 'nowrap',
                    marginRight: '-0.1rem'
                }}
            >
                Available on
            </span>

            {/* Primary Platform Logo */}
            <div
                title={`${PLATFORMS_META[activeKey]?.name || 'Platform'} • Official Release`}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'transform 0.15s ease, opacity 0.15s ease',
                    flexShrink: 0
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                }}
            >
                {ICONS[activeKey]}
            </div>

            {/* Subtle Vertical Divider Line | */}
            <span
                style={{
                    width: '1px',
                    height: '14px',
                    background: 'rgba(255, 255, 255, 0.25)',
                    margin: '0 0.1rem',
                    flexShrink: 0
                }}
            />

            {/* Companion Platform Logos */}
            {companionPlatforms.map((key) => {
                const meta = PLATFORMS_META[key];
                if (!meta) return null;
                return (
                    <div
                        key={key}
                        title={meta.name}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            cursor: 'pointer',
                            opacity: 0.9,
                            transition: 'opacity 0.15s ease, transform 0.15s ease',
                            flexShrink: 0
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.opacity = '1';
                            e.currentTarget.style.transform = 'scale(1.1)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = '0.9';
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                    >
                        {ICONS[key]}
                    </div>
                );
            })}
        </div>
    );
};

export default OttPlatformStrip;
