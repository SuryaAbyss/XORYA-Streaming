import React, { useState, useEffect, useRef } from 'react';
import { Home, Search, Monitor, Film } from 'lucide-react';
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
        { action: 'search', icon: Search, label: 'Search' }
    ];

    const containerVariants = {
        hidden: { y: -100, opacity: 0 },
        visible: {
            y: 0,
            opacity: isTransparent ? 0.3 : 1,
            backgroundColor: isTransparent
                ? 'rgba(255, 255, 255, 0.02)'
                : 'rgba(255, 255, 255, 0.1)',
            backdropFilter: isTransparent ? 'blur(4px)' : 'blur(16px)',
            WebkitBackdropFilter: isTransparent ? 'blur(4px)' : 'blur(16px)',
            boxShadow: isTransparent
                ? '0 4px 16px rgba(0, 0, 0, 0.05)'
                : '0 8px 32px rgba(31, 38, 135, 0.15)',
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
                style={{
                    position: 'fixed',
                    top: '2rem',
                    right: '1.8rem',
                    zIndex: 1000,
                    display: 'flex',
                    gap: '0.5rem',
                    padding: '0.5rem',
                    borderRadius: '50px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
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
                                style={{
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
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                                    e.currentTarget.style.color = '#fff';
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
                                    e.currentTarget.style.transform = 'scale(1)';
                                }}
                            >
                                <Icon size={20} />
                            </motion.button>
                        );
                    }

                    return (
                        <motion.div variants={itemVariants} key={item.path}>
                            <Link
                                to={item.path}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.7rem 1.2rem',
                                    borderRadius: '30px',
                                    textDecoration: 'none',
                                    background: active
                                        ? 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)'
                                        : 'transparent',
                                    border: active
                                        ? '1px solid rgba(255,255,255,0.1)'
                                        : '1px solid transparent',
                                    color: active ? '#fff' : 'rgba(255, 255, 255, 0.6)',
                                    transition: 'all 0.3s ease',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                <Icon size={18} />
                                <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{item.label}</span>
                                {active && (
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
                style={{
                    position: 'fixed',
                    top: '0.5rem',
                    left: '0.1rem',
                    zIndex: 1000,
                    pointerEvents: isLogoTransparent ? 'none' : 'auto'
                }}
            >
                <Link to="/">
                    <img
                        src="/logo.png"
                        alt="XORYA Logo"
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
