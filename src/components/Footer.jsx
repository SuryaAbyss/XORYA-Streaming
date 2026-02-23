import React from 'react';
import { useLocation } from 'react-router-dom';
import { DottedMap } from './ui/dotted-map';
import { HyperText } from './ui/hyper-text';

const markers = [
    { lat: 40.7128, lng: -74.006, size: 0.3 }, // New York
    { lat: 34.0522, lng: -118.2437, size: 0.3 }, // Los Angeles
    { lat: 51.5074, lng: -0.1278, size: 0.3 }, // London
    { lat: -33.8688, lng: 151.2093, size: 0.3 }, // Sydney
    { lat: 48.8566, lng: 2.3522, size: 0.3 }, // Paris
    { lat: 35.6762, lng: 139.6503, size: 0.3 }, // Tokyo
    { lat: 55.7558, lng: 37.6176, size: 0.3 }, // Moscow
    { lat: 39.9042, lng: 116.4074, size: 0.3 }, // Beijing
    { lat: 28.6139, lng: 77.209, size: 0.3 }, // New Delhi
    { lat: -23.5505, lng: -46.6333, size: 0.3 }, // São Paulo
    { lat: 1.3521, lng: 103.8198, size: 0.3 }, // Singapore
    { lat: 25.2048, lng: 55.2708, size: 0.3 }, // Dubai
    { lat: 52.52, lng: 13.405, size: 0.3 }, // Berlin
    { lat: 19.4326, lng: -99.1332, size: 0.3 }, // Mexico City
    { lat: -26.2041, lng: 28.0473, size: 0.3 }, // Johannesburg
];

const Footer = () => {
    const location = useLocation();

    // Do not show footer on the video player page to save space / avoid distraction
    if (location.pathname.includes('/watch/')) return null;

    return (
        <div style={{ position: 'relative', marginTop: 'auto', zIndex: 50 }}>
            {/* Seamless Transition Overlay */}
            <div style={{
                position: 'absolute',
                top: '-80px',
                left: 0,
                width: '100%',
                height: '80px',
                background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.6) 100%)',
                pointerEvents: 'none',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                maskImage: 'linear-gradient(to bottom, transparent 0%, black 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 100%)',
                zIndex: -1
            }} />

            <footer style={{
                background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.9) 100%)',
                backdropFilter: 'blur(30px)',
                WebkitBackdropFilter: 'blur(30px)',
                padding: '4rem 2rem 2rem',
                textAlign: 'center',
                color: 'rgba(255, 255, 255, 0.8)',
                position: 'relative',
                overflow: 'hidden',
            }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none', opacity: 0.4 }}>
                    <DottedMap markers={markers} dotColor="rgba(255, 255, 255, 0.2)" markerColor="#00bcd4" />
                </div>

                <div style={{ maxWidth: '1000px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                    <HyperText
                        as="h2"
                        style={{
                            color: '#fff',
                            fontSize: '2.2rem',
                            fontWeight: '800',
                            marginBottom: '1.2rem',
                            letterSpacing: '5px',
                            background: 'linear-gradient(135deg, #fff 0%, #00bcd4 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            display: 'inline-block',
                        }}
                        startOnView={true}
                        duration={800}
                        animateOnHover={true}
                    >
                        XORYA
                    </HyperText>

                    <p style={{
                        fontSize: '0.95rem',
                        lineHeight: '1.7',
                        marginBottom: '1.5rem',
                        letterSpacing: '0.5px'
                    }}>
                        XORYA stands as a premier destination for free streaming, offering unlimited access to movies, TV shows, anime, and more—all without registration. Boasting an extensive library and cutting-edge features, XORYA delivers the ultimate free streaming experience you've been searching for.
                    </p>

                    <p style={{
                        fontSize: '0.85rem',
                        opacity: 0.8,
                        marginBottom: '2rem'
                    }}>
                        <i>Disclaimer: This site does not store any files on our server. We only provide links to media hosted on third-party services.</i>
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem', fontSize: '0.85rem' }}>
                        <a href="#" style={{ color: 'rgba(255, 255, 255, 0.6)', textDecoration: 'none', transition: 'color 0.3s' }} onMouseEnter={(e) => e.target.style.color = '#00bcd4'} onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.6)'}>Terms of Service</a>
                        <a href="#" style={{ color: 'rgba(255, 255, 255, 0.6)', textDecoration: 'none', transition: 'color 0.3s' }} onMouseEnter={(e) => e.target.style.color = '#00bcd4'} onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.6)'}>Privacy Policy</a>
                        <a href="#" style={{ color: 'rgba(255, 255, 255, 0.6)', textDecoration: 'none', transition: 'color 0.3s' }} onMouseEnter={(e) => e.target.style.color = '#00bcd4'} onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.6)'}>DMCA</a>
                        <a href="#" style={{ color: 'rgba(255, 255, 255, 0.6)', textDecoration: 'none', transition: 'color 0.3s' }} onMouseEnter={(e) => e.target.style.color = '#00bcd4'} onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.6)'}>Contact Us</a>
                    </div>

                    <div style={{
                        width: '100%',
                        height: '1px',
                        background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
                        marginBottom: '2rem'
                    }} />

                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.9rem'
                    }}>
                        <span>© {new Date().getFullYear()} XORYA. Made by</span>
                        <span style={{
                            color: '#00bcd4',
                            fontWeight: '600'
                        }}>Surya Prakash</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Footer;
