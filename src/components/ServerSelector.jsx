import React from 'react';
import { motion } from 'framer-motion';

const ServerSelector = ({ servers, activeServer, onServerChange }) => {
    const [isExpanded, setIsExpanded] = React.useState(false);

    // Filter out testing servers first
    const testingServers = servers.filter(s => s.category === 'testing');

    // The rest are regular servers (good and poor)
    const regularServers = servers.filter(s => s.category !== 'testing');

    // Find autoembed index to split regular servers
    const splitIndex = regularServers.findIndex(s => s.id === 'autoembed');
    // If not found, fallback to full length
    const actualSplitIndex = splitIndex !== -1 ? splitIndex : regularServers.length - 1;

    const goodServers = regularServers.slice(0, actualSplitIndex + 1);
    const poorServers = regularServers.slice(actualSplitIndex + 1);

    const displayedGood = isExpanded ? goodServers : goodServers.slice(0, 5);
    const displayedPoor = isExpanded ? poorServers : [];
    // Always display testing servers if they exist, or put them under expansion. Let's just always display them.
    const displayedTesting = testingServers;

    const renderServerButton = (server, isPoorCategory = false, isTestingCategory = false) => {
        const isActive = activeServer === server.id;

        // Colors for Good (Green) vs Poor (Red) vs Testing (Yellow/Amber)
        let baseColor = '16, 185, 129'; // Green
        if (isPoorCategory) baseColor = '244, 67, 54'; // Red
        if (isTestingCategory) baseColor = '245, 158, 11'; // Amber

        return (
            <motion.button
                key={server.id}
                onClick={() => onServerChange(server.id)}
                whileHover={{ scale: 1.05, boxShadow: `0 8px 32px rgba(${baseColor}, 0.2)` }}
                whileTap={{ scale: 0.95 }}
                style={{
                    padding: '0.8rem 1.5rem',
                    background: isActive
                        ? `linear-gradient(135deg, rgba(${baseColor}, 0.3) 0%, rgba(${baseColor}, 0.1) 100%)`
                        : 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: isActive
                        ? `1px solid rgba(${baseColor}, 0.5)`
                        : '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '19px',
                    color: isActive ? '#fff' : 'rgba(255, 255, 255, 0.8)',
                    fontSize: '0.9rem',
                    fontWeight: isActive ? '600' : '500',
                    cursor: 'pointer',
                    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    boxShadow: isActive
                        ? `0 8px 32px 0 rgba(${baseColor}, 0.25)`
                        : '0 4px 30px rgba(0, 0, 0, 0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center', // Center text for better pill shape
                    minWidth: '110px',
                    textShadow: isActive ? `0 0 10px rgba(${baseColor}, 0.5)` : 'none'
                }}
            >
                <span style={{ marginBottom: '0.2rem' }}>{server.name}</span>
                <span style={{
                    fontSize: '0.7rem',
                    opacity: 0.7,
                    fontWeight: '400'
                }}>
                    {isActive ? 'Active' : 'Click to switch'}
                </span>
            </motion.button>
        );
    };

    return (
        <div style={{
            marginTop: '0.2rem',
            background: 'rgba(255, 255, 255, 0.02)', // Adjustable transparency
            backdropFilter: 'blur(20px)', // Adjustable blur
            borderRadius: '20px',
            padding: '1rem',
            border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
            <h3 style={{
                color: 'white',
                fontSize: '1.1rem',
                fontWeight: '600',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
            }}>
                <span style={{ width: '4px', height: '16px', background: '#10b981', borderRadius: '2px' }}></span>
                Recommended / Best Servers
            </h3>

            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.8rem',
                marginBottom: (isExpanded && poorServers.length > 0) || testingServers.length > 0 ? '2rem' : '0'
            }}>
                {displayedGood.map((server) => renderServerButton(server, false, false))}

                {!isExpanded && (
                    <motion.button
                        onClick={() => setIsExpanded(true)}
                        whileHover={{ scale: 1.05, background: 'rgba(255, 255, 255, 0.08)' }}
                        whileTap={{ scale: 0.95 }}
                        style={{
                            padding: '0.8rem 1.5rem',
                            background: 'rgba(255, 255, 255, 0.03)',
                            backdropFilter: 'blur(16px)',
                            WebkitBackdropFilter: 'blur(16px)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '30px',
                            color: 'rgba(255, 255, 255, 0.8)',
                            fontSize: '0.9rem',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: '110px'
                        }}
                    >
                        More Servers
                    </motion.button>
                )}
            </div>

            {/* Testing Servers Section */}
            {displayedTesting.length > 0 && (
                <div style={{ marginBottom: isExpanded && poorServers.length > 0 ? '2rem' : '0' }}>
                    <h3 style={{
                        color: 'white',
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        marginBottom: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        opacity: 0.9
                    }}>
                        <span style={{ width: '4px', height: '16px', background: '#f59e0b', borderRadius: '2px' }}></span>
                        Testing Servers
                    </h3>
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.8rem'
                    }}>
                        {displayedTesting.map((server) => renderServerButton(server, false, true))}
                    </div>
                </div>
            )}

            {isExpanded && poorServers.length > 0 && (
                <>
                    <h3 style={{
                        color: 'white',
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        marginBottom: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        opacity: 0.9
                    }}>
                        <span style={{ width: '4px', height: '16px', background: '#f44336', borderRadius: '2px' }}></span>
                        Poor Quality Servers
                    </h3>
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.8rem'
                    }}>
                        {displayedPoor.map((server) => renderServerButton(server, true, false))}

                        <motion.button
                            onClick={() => setIsExpanded(false)}
                            whileHover={{ scale: 1.05, background: 'rgba(255, 255, 255, 0.08)' }}
                            whileTap={{ scale: 0.95 }}
                            style={{
                                padding: '0.8rem 1.5rem',
                                background: 'rgba(255, 255, 255, 0.03)',
                                backdropFilter: 'blur(16px)',
                                WebkitBackdropFilter: 'blur(16px)',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                borderRadius: '30px',
                                color: 'rgba(255, 255, 255, 0.8)',
                                fontSize: '0.9rem',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minWidth: '110px'
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

