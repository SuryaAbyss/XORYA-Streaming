import React from 'react';
import { useLocation } from 'react-router-dom';
import ParticleTextEffect from './ParticleTextEffect';

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
                background: 'radial-gradient(circle at top, rgba(30, 64, 175, 0.45), transparent 55%), #000',
                backdropFilter: 'blur(30px)',
                WebkitBackdropFilter: 'blur(30px)',
                padding: '3rem 1.5rem 1.5rem',
                textAlign: 'center',
                color: 'rgba(255, 255, 255, 0.8)',
                position: 'relative',
                overflow: 'hidden',
            }}>
                <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                    <ParticleTextEffect />

                    <p style={{
                        fontSize: '0.9rem',
                        lineHeight: '1.6',
                        marginTop: '1.75rem',
                        marginBottom: '1rem',
                        letterSpacing: '0.4px',
                        color: 'rgba(229, 231, 235, 0.85)'
                    }}>
                    XORAYA is your destination for free streaming — movies, TV shows, anime and more, with no registration required.
                    </p>

                    <p style={{
                        fontSize: '0.8rem',
                        opacity: 0.8,
                        marginBottom: '1.5rem'
                    }}>
                        <i>This site does not store any files on its server. We only provide links to media hosted on third‑party services.</i>
                    </p>

                    <div style={{
                        width: '100%',
                        height: '1px',
                        background: 'linear-gradient(90deg, transparent, rgba(148, 163, 184, 0.35), transparent)',
                        marginBottom: '1.25rem'
                    }} />

                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.85rem',
                        color: 'rgba(148, 163, 184, 0.9)'
                    }}>
                    <span>© {new Date().getFullYear()} XORAYA. Crafted by</span>
                        <span style={{
                            color: '#38bdf8',
                            fontWeight: '600'
                        }}>Surya Prakash</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Footer;
