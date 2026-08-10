import React from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Shield, FlaskConical, AlertTriangle } from 'lucide-react';

const ServerSelector = ({ servers, activeServer, onServerChange, onReload }) => {
    const [isExpanded, setIsExpanded] = React.useState(false);
    // Detect mobile for grid layout
    const isMobile = typeof window !== 'undefined' && navigator.maxTouchPoints > 0 && window.innerWidth <= 768;

    // Filter out testing servers first
    const testingServers = servers.filter(s => s.category === 'testing');

    // Explicitly marked poor/bad servers (Vidora, VidLink)
    const explicitPoor = servers.filter(s => s.category === 'poor' || s.category === 'bad');

    // Remaining regular servers
    const remainingServers = servers.filter(s => s.category !== 'testing' && s.category !== 'poor' && s.category !== 'bad');

    // Find autoembed index to split remaining servers
    const splitIndex = remainingServers.findIndex(s => s.id === 'autoembed');
    const actualSplitIndex = splitIndex !== -1 ? splitIndex : remainingServers.length - 1;

    const goodServers = remainingServers.slice(0, actualSplitIndex + 1);
    const implicitPoor = remainingServers.slice(actualSplitIndex + 1);
    const poorServers = [...explicitPoor, ...implicitPoor];

    const displayedGood = isExpanded ? goodServers : goodServers.slice(0, 6);
    const displayedPoor = isExpanded ? poorServers : poorServers;
    const displayedTesting = testingServers;


    const renderServerButton = (server, isPoorCategory = false, isTestingCategory = false) => {
        const isActive = activeServer === server.id;

        // Colors for Good (Theme Accent) vs Poor (Red) vs Testing (Yellow/Amber)
        let baseColor = 'var(--theme-accent-rgb)'; // Dynamic Theme Color
        if (isPoorCategory) baseColor = '244, 67, 54'; // Red
        if (isTestingCategory) baseColor = '245, 158, 11'; // Amber

        return (
            <motion.button
                key={server.id}
                onClick={() => onServerChange(server.id)}
                whileHover={{ scale: 1.04, boxShadow: `0 8px 24px rgba(${baseColor}, 0.18)` }}
                whileTap={{ scale: 0.97 }}
                style={{
                    padding: isMobile ? '0.6rem 0.5rem' : '0.75rem 1.4rem',
                    background: isActive
                        ? `linear-gradient(135deg, rgba(${baseColor}, 0.15) 0%, rgba(${baseColor}, 0.05) 100%)`
                        : 'rgba(255, 255, 255, 0.02)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: isActive
                        ? `1.5px solid rgba(${baseColor}, 0.45)`
                        : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '14px',
                    color: isActive ? '#fff' : 'rgba(255, 255, 255, 0.75)',
                    fontSize: isMobile ? '0.82rem' : '0.88rem',
                    fontWeight: isActive ? '600' : '500',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: isActive
                        ? `0 8px 24px 0 rgba(${baseColor}, 0.15)`
                        : '0 4px 15px rgba(0, 0, 0, 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    minWidth: isMobile ? 'unset' : '130px',
                    width: isMobile ? '100%' : 'auto',
                    minHeight: isMobile ? '56px' : 'auto',
                    justifyContent: 'center',
                    textShadow: isActive ? `0 0 10px rgba(${baseColor}, 0.3)` : 'none',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.15rem' }}>
                    <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: isActive ? `rgb(${baseColor})` : 'rgba(255, 255, 255, 0.3)',
                        boxShadow: isActive ? `0 0 6px rgb(${baseColor})` : 'none',
                        display: 'inline-block'
                    }} />
                    <span>{server.name}</span>
                </div>
                <span style={{
                    fontSize: '0.62rem',
                    opacity: isActive ? 0.95 : 0.55,
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginTop: '0.2rem',
                    color: isActive ? `rgb(${baseColor})` : 'rgba(255, 255, 255, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px'
                }}>
                    {isPoorCategory ? '⚠️ Legacy' : isTestingCategory ? '🔧 Test' : '⚡ 1080p'}
                </span>
            </motion.button>
        );
    };

    return (
        <div style={{
            marginTop: '0.5rem',
            padding: isMobile ? '0.5rem' : '0rem',
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        background: 'rgba(var(--theme-accent-rgb), 0.1)',
                        border: '1px solid rgba(var(--theme-accent-rgb), 0.25)',
                        borderRadius: '8px',
                        padding: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--theme-accent)'
                    }}>
                        <Shield size={18} />
                    </div>
                    <div>
                        <h3 style={{
                            color: 'white',
                            fontSize: '1.05rem',
                            fontWeight: '700',
                            margin: 0,
                            letterSpacing: '0.3px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.6rem'
                        }}>
                            Recommended / Best Servers
                            <span style={{
                                fontSize: '0.65rem',
                                color: 'var(--theme-accent)',
                                background: 'rgba(var(--theme-accent-rgb), 0.12)',
                                border: '1px solid rgba(var(--theme-accent-rgb), 0.2)',
                                padding: '2px 8px',
                                borderRadius: '20px',
                                fontWeight: '700',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}>
                                High Speed
                            </span>
                        </h3>
                    </div>
                </div>
                
                {onReload && (
                    <motion.button
                        onClick={onReload}
                        whileHover={{ scale: 1.1, rotate: 180 }}
                        whileTap={{ scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            borderRadius: '8px',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'rgba(255,255,255,0.8)',
                            cursor: 'pointer'
                        }}
                        title="Reload Server"
                    >
                        <RefreshCw size={14} />
                    </motion.button>
                )}
            </div>

            <div style={{
                display: isMobile ? 'grid' : 'flex',
                gridTemplateColumns: isMobile ? '1fr' : undefined,
                flexWrap: isMobile ? undefined : 'wrap',
                gap: isMobile ? '0.55rem' : '0.8rem',
                marginBottom: (isExpanded && poorServers.length > 0) || testingServers.length > 0 ? '2rem' : '0'
            }}>
                {displayedGood.map((server) => renderServerButton(server, false, false))}

                {!isExpanded && (
                    <motion.button
                        onClick={() => setIsExpanded(true)}
                        whileHover={{ scale: 1.05, background: 'rgba(255, 255, 255, 0.08)' }}
                        whileTap={{ scale: 0.95 }}
                        style={{
                            padding: isMobile ? '0.7rem 0.5rem' : '0.8rem 1.5rem',
                            background: 'rgba(255, 255, 255, 0.03)',
                            backdropFilter: 'blur(16px)',
                            WebkitBackdropFilter: 'blur(16px)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: isMobile ? '14px' : '30px',
                            color: 'rgba(255, 255, 255, 0.8)',
                            fontSize: isMobile ? '0.85rem' : '0.9rem',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: isMobile ? 'unset' : '110px',
                            width: isMobile ? '100%' : 'auto',
                            minHeight: isMobile ? '48px' : 'auto',
                            // On mobile: span both columns
                            gridColumn: isMobile ? '1 / -1' : undefined,
                        }}
                    >
                        More Servers
                    </motion.button>
                )}
            </div>

            {/* Testing Servers Section */}
            {displayedTesting.length > 0 && (
                <div style={{ marginBottom: isExpanded && poorServers.length > 0 ? '2rem' : '0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.2rem' }}>
                        <div style={{
                            background: 'rgba(245, 158, 11, 0.1)',
                            border: '1px solid rgba(245, 158, 11, 0.25)',
                            borderRadius: '8px',
                            padding: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#f59e0b'
                        }}>
                            <FlaskConical size={18} />
                        </div>
                        <h3 style={{
                            color: 'white',
                            fontSize: '1.05rem',
                            fontWeight: '700',
                            margin: 0,
                            letterSpacing: '0.3px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.6rem'
                        }}>
                            Testing / Secondary Servers
                            <span style={{
                                fontSize: '0.65rem',
                                color: '#f59e0b',
                                background: 'rgba(245, 158, 11, 0.12)',
                                border: '1px solid rgba(245, 158, 11, 0.2)',
                                padding: '2px 8px',
                                borderRadius: '20px',
                                fontWeight: '700',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}>
                                Experimental
                            </span>
                        </h3>
                    </div>
                    <div style={{
                        display: isMobile ? 'grid' : 'flex',
                        gridTemplateColumns: isMobile ? '1fr' : undefined,
                        flexWrap: isMobile ? undefined : 'wrap',
                        gap: isMobile ? '0.55rem' : '0.8rem'
                    }}>
                        {displayedTesting.map((server) => renderServerButton(server, false, true))}
                    </div>
                </div>
            )}

            {poorServers.length > 0 && (

                <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.2rem' }}>
                        <div style={{
                            background: 'rgba(244, 67, 54, 0.1)',
                            border: '1px solid rgba(244, 67, 54, 0.25)',
                            borderRadius: '8px',
                            padding: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#f44336'
                        }}>
                            <AlertTriangle size={18} />
                        </div>
                        <h3 style={{
                            color: 'white',
                            fontSize: '1.05rem',
                            fontWeight: '700',
                            margin: 0,
                            letterSpacing: '0.3px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.6rem'
                        }}>
                            Poor Quality / Backup Servers
                            <span style={{
                                fontSize: '0.65rem',
                                color: '#f44336',
                                background: 'rgba(244, 67, 54, 0.12)',
                                border: '1px solid rgba(244, 67, 54, 0.2)',
                                padding: '2px 8px',
                                borderRadius: '20px',
                                fontWeight: '700',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}>
                                Slow
                            </span>
                        </h3>
                    </div>
                    <div style={{
                        display: isMobile ? 'grid' : 'flex',
                        gridTemplateColumns: isMobile ? '1fr' : undefined,
                        flexWrap: isMobile ? undefined : 'wrap',
                        gap: isMobile ? '0.55rem' : '0.8rem'
                    }}>
                        {displayedPoor.map((server) => renderServerButton(server, true, false))}

                        <motion.button
                            onClick={() => setIsExpanded(false)}
                            whileHover={{ scale: 1.05, background: 'rgba(255, 255, 255, 0.08)' }}
                            whileTap={{ scale: 0.95 }}
                            style={{
                                padding: isMobile ? '0.7rem 0.5rem' : '0.8rem 1.5rem',
                                background: 'rgba(255, 255, 255, 0.03)',
                                backdropFilter: 'blur(16px)',
                                WebkitBackdropFilter: 'blur(16px)',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                borderRadius: isMobile ? '14px' : '30px',
                                color: 'rgba(255, 255, 255, 0.8)',
                                fontSize: isMobile ? '0.85rem' : '0.9rem',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minWidth: isMobile ? 'unset' : '110px',
                                width: isMobile ? '100%' : 'auto',
                                minHeight: isMobile ? '48px' : 'auto',
                                gridColumn: isMobile ? '1 / -1' : undefined,
                            }}
                        >
                            Show Less
                        </motion.button>
                    </div>
                </>
            )}
        </div>
    );
};

export default ServerSelector;

