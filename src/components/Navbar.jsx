import React, { useState, useEffect, useRef } from 'react';
import { Home, Search, Monitor, Film, Bookmark } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import SearchModal from './SearchModal';

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
        }, 14000); // 14 seconds
    };

    const startLogoTimer = () => {
        if (logoTimerRef.current) clearTimeout(logoTimerRef.current);
        logoTimerRef.current = setTimeout(() => {
            setIsLogoTransparent(true);
        }, 14000); // 14 seconds
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

    const containerVariants = {
        hidden: { y: isMobile ? 100 : -100, opacity: 0 },
        visible: {
            y: 0,
            opacity: isTransparent ? (isMobile ? 1 : 0.3) : 1, // Never fade on mobile
            backgroundColor: isTransparent && !isMobile
                ? 'rgba(255, 255, 255, 0.02)'
                : (isMobile ? 'rgba(5, 5, 5, 0.92)' : 'rgba(255, 255, 255, 0.1)'),
            backdropFilter: isTransparent && !isMobile ? 'blur(4px)' : 'blur(20px)',
            WebkitBackdropFilter: isTransparent && !isMobile ? 'blur(4px)' : 'blur(20px)',
            boxShadow: isTransparent && !isMobile
                ? '0 4px 16px rgba(0, 0, 0, 0.05)'
                : (isMobile ? '0 -4px 30px rgba(0, 0, 0, 0.5)' : '0 8px 32px rgba(31, 38, 135, 0.15)'),
            border: '1px solid rgba(255, 255, 255, 0.18)',
            transition: {
                duration: 0.8,
                ease: "easeInOut",
                when: "beforeChildren",
                staggerChildren: 0.1
            }
        }
    };

    const logoVariants = {
        hidden: { opacity: 0, y: -20 },
        visible: {
            opacity: isLogoTransparent ? 0.3 : 1,
            y: 0,
            transition: {
                opacity: { duration: 0.8, ease: "easeInOut" },
                y: { duration: 0.8, ease: "easeOut", delay: 0.2 }
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: -20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
    };

    return (
        <>
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className="navbar-container-glass"
                style={isMobile ? {} : { alignItems: 'center' }}
            >
                {navItems.map((item) => {
                    const active = item.path && isActive(item.path);
                    const Icon = item.icon;

                    if (item.action === 'search') {
                        return (
                            <motion.button
                                variants={itemVariants}
                                key="search"
                                onClick={() => setIsSearchOpen(true)}
                                style={isMobile ? {
                                    // Mobile: identical to other tab items
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
                                    // Desktop: circular icon button
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
                            </motion.button>
                        );
                    }

                    // Icon-only link (desktop: circular pill, mobile: full tab with label)
                    if (item.iconOnly) {
                        return (
                            <motion.div
                                variants={itemVariants}
                                key={item.path}
                                style={isMobile ? { flex: '1 1 0', display: 'flex', height: '100%' } : undefined}
                            >
                                <Link
                                    to={item.path}
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
                            </motion.div>
                        );
                    }

                    return (
                        <motion.div
                            variants={itemVariants}
                            key={item.path}
                            style={isMobile ? { flex: '1 1 0', display: 'flex', height: '100%' } : undefined}
                        >
                            <Link
                                to={item.path}
                                className={`nav-link-pill ${active ? 'active-pill' : ''}`}
                                onMouseEnter={() => !isMobile && setHoveredItem(item.path)}
                                onMouseLeave={() => !isMobile && setHoveredItem(null)}
                                style={isMobile ? {
                                    // On mobile let CSS fully control — just supply the active color
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
                                <AnimatePresence initial={false}>
                                    {(active || hoveredItem === item.path || isMobile) && (
                                        <motion.span 
                                            className="nav-label" 
                                            initial={isMobile ? false : { width: 0, opacity: 0, marginLeft: 0 }}
                                            animate={isMobile ? false : { width: "auto", opacity: 1, marginLeft: "0.4rem" }}
                                            exit={isMobile ? false : { width: 0, opacity: 0, marginLeft: 0 }}
                                            transition={{ duration: 0.2, ease: "easeInOut" }}
                                            style={isMobile ? {} : { fontSize: '0.9rem', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden' }}
                                        >
                                            {item.label}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                                {active && !isMobile && (
                                    <motion.div
                                        layoutId="navbar-glow"
                                        style={{
                                            position: 'absolute',
                                            inset: 0,
                                            background: 'radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, transparent 70%)',
                                            zIndex: -1
                                        }}
                                    />
                                )}
                            </Link>
                        </motion.div>
                    );
                })}
            </motion.div>

            <motion.div
                variants={logoVariants}
                initial="hidden"
                animate="visible"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className="navbar-logo-container"
                style={{ pointerEvents: isLogoTransparent ? 'none' : 'auto' }}
            >
                <Link to="/">
                    <img
                        src="/logo.png"
                        alt="XORAYA Logo"
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
            </motion.div>

            <SearchModal
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
            />
        </>
    );
};

export default Navbar;
