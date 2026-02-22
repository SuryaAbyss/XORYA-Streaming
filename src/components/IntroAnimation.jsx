import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import './IntroAnimation.css';

const IntroAnimation = () => {
    const location = useLocation();
    const [stage, setStage] = useState('initial'); // 'initial' | 'text' | 'video' | 'short-x' | 'fade-out' | 'done'
    const videoRef = useRef(null);
    const isFirstMount = useRef(true);
    const isFirstRender = useRef(true);

    if (isFirstRender.current) {
        if (typeof window !== 'undefined') {
            const lastVisitStr = localStorage.getItem('lastVisitXorya');
            const now = new Date().getTime();
            const thirtyMinutes = 30 * 60 * 1000;

            if (!lastVisitStr) {
                window.HERO_DELAY = 10000; // First time ever: text (2.8s) + video (~5.5s)
            } else {
                const lastVisit = parseInt(lastVisitStr, 10);
                if (now - lastVisit > thirtyMinutes) {
                    window.HERO_DELAY = 7000; // Video only (~5.5s)
                } else {
                    window.HERO_DELAY = 1000; // Short 1s X animation
                }
            }
        }
        isFirstRender.current = false;
    }

    useEffect(() => {
        let textTimer, fadeTimer, doneTimer;

        const now = new Date().getTime();
        const thirtyMinutes = 30 * 60 * 1000;

        if (isFirstMount.current) {
            isFirstMount.current = false;

            const lastVisitStr = localStorage.getItem('lastVisitXorya');
            if (lastVisitStr) {
                const lastVisit = parseInt(lastVisitStr, 10);
                const timeSinceLastVisit = now - lastVisit;

                if (timeSinceLastVisit > thirtyMinutes) {
                    // More than 30 minutes passed: Play ONLY the video
                    setStage('video');
                    localStorage.setItem('lastVisitXorya', now.toString());
                    return;
                } else {
                    // Less than 30 minutes: Play Short X Animation
                    setStage('short-x');
                    fadeTimer = setTimeout(() => {
                        setStage('fade-out');
                        doneTimer = setTimeout(() => setStage('done'), 500); // 500ms fade out
                    }, 1000); // 1 sec show time
                }
            } else {
                // First ever
                setStage('text');
                textTimer = setTimeout(() => {
                    setStage('video');
                }, 2800);
                localStorage.setItem('lastVisitXorya', now.toString());
                localStorage.removeItem('hasVisitedXorya');
            }
        } else {
            // Consecutive navigations play short X animation
            setStage('short-x');
            fadeTimer = setTimeout(() => {
                setStage('fade-out');
                doneTimer = setTimeout(() => setStage('done'), 500);
            }, 1000); // 1 sec show time
        }

        return () => {
            clearTimeout(textTimer);
            clearTimeout(fadeTimer);
            clearTimeout(doneTimer);
        };
    }, [location.pathname]);

    const handleVideoEnded = () => {
        setStage('fade-out');
        setTimeout(() => {
            setStage('done');
        }, 1000); // Wait for fade out animation
    };

    if (stage === 'done') return null;

    return (
        <div className={`intro-container ${stage === 'fade-out' ? 'fade-out' : ''} ${stage === 'short-x' ? 'short-backdrop' : ''}`}>
            {stage === 'text' && (
                <div className="intro-text-container">
                    <h1 className="intro-text">Welcome to XORYA</h1>
                </div>
            )}

            {stage === 'video' && (
                <div className="intro-video-container fade-in">
                    <video
                        ref={videoRef}
                        className="intro-video"
                        src="https://ik.imagekit.io/ojv2gnvx8/VivaCut_video_1771760774421_1080HD.mp4"
                        autoPlay
                        muted
                        playsInline
                        onEnded={handleVideoEnded}
                    />
                </div>
            )}

            {stage === 'short-x' && (
                <div className="intro-short-container fade-in">
                    <div className="glass-x-symbol">
                        <span className="x-text">X</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IntroAnimation;
