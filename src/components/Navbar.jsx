import React, { useState, useEffect, useRef } from 'react';
import { Home, Search, Monitor, Film, Bookmark } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import SearchModal from './SearchModal';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';

const Navbar = () => {
    const location = useLocation();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isTransparent, setIsTransparent] = useState(false);
    const timerRef = useRef(null);
    const [isLogoTransparent, setIsLogoTransparent] = useState(false);
    const logoTimerRef = useRef(null);
    const [hoveredItem, setHoveredItem] = useState(null);

    const isMobile = typeof window !== 'undefined' && navigator.maxTouchPoints > 0 && window.innerWidth <= 768;
    const isActive = (path) => location.pathname === path;

    const startNavTimer = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            setIsTransparent(true);
        }, 14000);
    };

    const startLogoTimer = () => {
        if (logoTimerRef.current) clearTimeout(logoTimerRef.current);
        logoTimerRef.current = setTimeout(() => {
            setIsLogoTransparent(true);
        }, 14000);
    };

    const startTimers = () => {
        startNavTimer();
        startLogoTimer();
    };

    useEffect(() => {
        startTimers();
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            if (logoTimerRef.current) clearTimeout(logoTimerRef.current);
        };
    }, []);

    const handleMouseEnter = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        if (logoTimerRef.current) clearTimeout(logoTimerRef.current);
        setIsTransparent(false);
        setIsLogoTransparent(false);
    };

    const handleMouseLeave = () => {
        startTimers();
    };

    const navItems = [
        { path: '/', icon: Home, label: 'Home' },
        { path: '/movies', icon: Film, label: 'Movies' },
        { path: '/series', icon: Monitor, label: 'TV Shows' },
        { path: '/watchlist', icon: Bookmark, label: 'Watchlist', iconOnly: true },
        { action: 'search', icon: Search, label: 'Search' }
    ];

    const navRef = useRef(null);
    const logoRef = useRef(null);

    // Timeline mount animations
    useGSAP(() => {
        const tl = gsap.timeline();
        tl.fromTo(navRef.current,
            { y: isMobile ? 100 : -100, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }
        );

        const items = navRef.current?.querySelectorAll('.nav-item-wrap');
        if (items && items.length > 0) {
            tl.fromTo(items,
                { opacity: 0, y: isMobile ? 20 : -20 },
                { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, ease: "power2.out" },
                "-=0.55"
            );
        }

        tl.fromTo(logoRef.current,
            { opacity: 0, y: -20 },
            { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" },
            "-=0.4"
        );
    }, []);

    const navbarStyle = isMobile ? {
        backgroundColor: 'rgba(5, 5, 5, 0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 -4px 30px rgba(0, 0, 0, 0.5)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
    } : {
        opacity: isTransparent ? 0.3 : 1,
        backgroundColor: isTransparent ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.1)',
        backdropFilter: isTransparent ? 'blur(4px)' : 'blur(20px)',
        WebkitBackdropFilter: isTransparent ? 'blur(4px)' : 'blur(20px)',
        boxShadow: isTransparent ? '0 4px 16px rgba(0, 0, 0, 0.05)' : '0 8px 32px rgba(31, 38, 135, 0.15)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        transition: 'opacity 0.8s ease, background-color 0.8s ease, backdrop-filter 0.8s ease, -webkit-backdrop-filter 0.8s ease, box-shadow 0.8s ease, border-color 0.8s ease',
    };

    return (
        <>
            <div
                ref={navRef}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className="navbar-container-glass"
                style={{
                    ...navbarStyle,
                    ...(isMobile ? {} : { alignItems: 'center' }),
                    opacity: 0, // start hidden for GSAP to reveal
                }}
            >
                {navItems.map((item) => {
                    const active = item.path && isActive(item.path);
                    const Icon = item.icon;

                    if (item.action === 'search') {
                        return (
                            <div
                                key="search"
                                className="nav-item-wrap"
                                style={isMobile ? { flex: '1 1 0', display: 'flex', height: '100%' } : undefined}
                            >
                                <button
                                    aria-label="Search"
                                    onClick={() => setIsSearchOpen(true)}
                                    style={isMobile ? {
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flex: '1 1 0',
                                        gap: '4px',
                                        padding: '8px 4px',
                                        height: '100%',
                                        border: 'none',
                                        borderRadius: '0',
                                        background: 'transparent',
                                        color: 'rgba(255, 255, 255, 0.6)',
                                        cursor: 'pointer',
                                    } : {
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '45px',
                                        height: '45px',
                                        borderRadius: '50%',
                                        border: 'none',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        color: 'rgba(255, 255, 255, 0.8)',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                    }}
                                    onMouseEnter={!isMobile ? (e) => {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                                        e.currentTarget.style.color = '#fff';
                                        e.currentTarget.style.transform = 'scale(1.05)';
                                    } : undefined}
                                    onMouseLeave={!isMobile ? (e) => {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                        e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
                                        e.currentTarget.style.transform = 'scale(1)';
                                    } : undefined}
                                >
                                    <Icon size={isMobile ? 22 : 20} />
                                    {isMobile && <span className="nav-label">Search</span>}
                                </button>
                            </div>
                        );
                    }

                    if (item.iconOnly) {
                        return (
                            <div
                                key={item.path}
                                className="nav-item-wrap"
                                style={isMobile ? { flex: '1 1 0', display: 'flex', height: '100%' } : undefined}
                            >
                                <Link
                                    to={item.path}
                                    aria-label={item.label}
                                    style={isMobile ? {
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '100%',
                                        height: '100%',
                                        gap: '4px',
                                        padding: '8px 4px',
                                        textDecoration: 'none',
                                        color: active ? '#fff' : 'rgba(255, 255, 255, 0.6)',
                                    } : {
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '45px',
                                        height: '45px',
                                        borderRadius: '50%',
                                        background: active
                                            ? 'rgba(255, 255, 255, 0.15)'
                                            : 'rgba(255, 255, 255, 0.05)',
                                        color: active ? '#fff' : 'rgba(255, 255, 255, 0.8)',
                                        textDecoration: 'none',
                                        transition: 'all 0.3s ease',
                                        boxShadow: active ? '0 0 0 1px rgba(255,255,255,0.15)' : 'none',
                                    }}
                                    onMouseEnter={!isMobile ? (e) => {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                                        e.currentTarget.style.color = '#fff';
                                        e.currentTarget.style.transform = 'scale(1.05)';
                                    } : undefined}
                                    onMouseLeave={!isMobile ? (e) => {
                                        e.currentTarget.style.background = active
                                            ? 'rgba(255, 255, 255, 0.15)'
                                            : 'rgba(255, 255, 255, 0.05)';
                                        e.currentTarget.style.color = active ? '#fff' : 'rgba(255, 255, 255, 0.8)';
                                        e.currentTarget.style.transform = 'scale(1)';
                                    } : undefined}
                                >
                                    <Icon size={isMobile ? 22 : 20} />
                                    {isMobile && <span className="nav-label">{item.label}</span>}
                                </Link>
                            </div>
                        );
                    }

                    return (
                        <div
                            key={item.path}
                            className="nav-item-wrap"
                            style={isMobile ? { flex: '1 1 0', display: 'flex', height: '100%' } : undefined}
                        >
                            <Link
                                id={`nav-link-${item.label.toLowerCase()}`}
                                to={item.path}
                                aria-label={item.label}
                                className={`nav-link-pill ${active ? 'active-pill' : ''}`}
                                onMouseEnter={() => !isMobile && setHoveredItem(item.path)}
                                onMouseLeave={() => !isMobile && setHoveredItem(null)}
                                style={isMobile ? {
                                    color: active ? '#fff' : 'rgba(255, 255, 255, 0.55)',
                                    width: '100%',
                                } : {
                                    display: 'flex',
                                    alignItems: 'center',
                                    background: active
                                        ? 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)'
                                        : 'transparent',
                                    border: active
                                        ? '1px solid rgba(255,255,255,0.1)'
                                        : '1px solid transparent',
                                    color: active ? '#fff' : 'rgba(255, 255, 255, 0.6)',
                                    padding: '0.6rem 0.8rem',
                                    borderRadius: '30px',
                                }}
                            >
                                <Icon size={isMobile ? 22 : 18} />
                                <span 
                                    className="nav-label" 
                                    style={isMobile ? {} : {
                                        fontSize: '0.9rem',
                                        fontWeight: '500',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        display: 'inline-block',
                                        verticalAlign: 'middle',
                                        maxWidth: (active || hoveredItem === item.path) ? '120px' : '0px',
                                        opacity: (active || hoveredItem === item.path) ? 1 : 0,
                                        marginLeft: (active || hoveredItem === item.path) ? '0.4rem' : '0px',
                                        transition: 'max-width 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.2s ease, margin-left 0.25s ease'
                                    }}
                                >
                                    {item.label}
                                </span>
                                {active && !isMobile && (
                                    <div
                                        style={{
                                            position: 'absolute',
                                            inset: 0,
                                            background: 'radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, transparent 70%)',
                                            zIndex: -1
                                        }}
                                    />
                                )}
                            </Link>
                        </div>
                    );
                })}
            </div>

            <div
                ref={logoRef}
                className="navbar-logo-container"
                style={{
                    pointerEvents: isLogoTransparent ? 'none' : 'auto',
                    opacity: isLogoTransparent ? 0.3 : 1,
                    transition: 'opacity 0.8s ease'
                }}
            >
                <Link to="/" aria-label="XORAYA Home">
                    <img
                        src="/logo.png"
                        alt="XORAYA Logo"
                        width="120"
                        height="40"
                        style={{
                            height: '50px',
                            width: 'auto',
                            objectFit: 'contain',
                            filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))',
                            transition: 'transform 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                            if (!isLogoTransparent) e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                            if (!isLogoTransparent) e.currentTarget.style.transform = 'scale(1)';
                        }}
                    />
                </Link>
            </div>

            <SearchModal
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
            />
        </>
    );
};

export default Navbar;
