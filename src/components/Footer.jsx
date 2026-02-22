import React from 'react';
import { useLocation } from 'react-router-dom';

const Footer = () => {
    const location = useLocation();

    // Do not show footer on the video player page to save space / avoid distraction
    if (location.pathname.includes('/watch/')) return null;

    return (
        <footer style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.02) 100%)',
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',
            borderTop: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            padding: '4rem 2rem 2rem',
            textAlign: 'center',
            color: 'rgba(255, 255, 255, 0.8)',
            marginTop: 'auto',
            position: 'relative',
            zIndex: 50,
        }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <h2 style={{
                    color: '#fff',
                    fontSize: '2.2rem',
                    fontWeight: '800',
                    marginBottom: '1.2rem',
                    letterSpacing: '5px',
                    background: 'linear-gradient(135deg, #fff 0%, #00bcd4 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                }}>XORYA</h2>

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
    );
};

export default Footer;
