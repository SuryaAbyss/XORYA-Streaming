import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { animate, createScope, spring } from 'animejs';
import './IntroAnimation.css';
import { ShaderAnimation } from './ShaderAnimation';

const IntroAnimation = () => {
    const location = useLocation();
    const [stage, setStage] = useState('initial');
    
    const rootRef = useRef(null);
    const scopeRef = useRef(null);

    useEffect(() => {
        // Reset stage and trigger entrance on pathname changes
        document.body.style.overflow = 'hidden';
        setStage('short-x');
    }, [location.pathname]);

    useEffect(() => {
        if (stage !== 'short-x') return;

        const isInitial = typeof window !== 'undefined' && !window.XORYA_INITIAL_LOAD_COMPLETE;

        if (typeof window !== 'undefined') {
            // Set the HERO_DELAY for initial mount
            window.HERO_DELAY = isInitial ? 4000 : 1200;
        }

        const activeTime = isInitial ? 3400 : 900;
        const exitTime = isInitial ? 600 : 300;

        let exitTimer;
        let doneTimer;

        // Initialize Anime.js scope on rootRef now that elements are rendered in DOM
        if (rootRef.current) {
            scopeRef.current = createScope({ root: rootRef }).add(self => {
                // 1. Entrance animation for the glass logo badge
                animate('.glass-x-symbol', {
                    opacity: [0, 1],
                    scale: [0.3, 1],
                    rotate: [45, 0],
                    duration: isInitial ? 1200 : 600,
                    ease: spring({ bounce: 0.6 }),
                });

                // 2. Entrance animation for the inner text X
                animate('.x-text', {
                    opacity: [0, 1],
                    scale: [0.5, 1],
                    rotate: [-90, 0],
                    delay: isInitial ? 200 : 100,
                    duration: isInitial ? 1400 : 700,
                    ease: spring({ bounce: 0.5 }),
                });

                // Register methods for exit transition
                self.add('exitIntro', () => {
                    console.log('IntroAnimation: Dispatching xorya-intro-complete');
                    // Trigger custom event so main contents (Hero, Navbar) start their entrance
                    window.dispatchEvent(new CustomEvent('xorya-intro-complete'));

                    // Slide up the container
                    animate(rootRef.current, {
                        translateY: '-100%',
                        opacity: [1, 0.9],
                        duration: exitTime,
                        ease: 'inOut(3)',
                    });

                    // Scale down the glass symbol on exit
                    animate('.glass-x-symbol', {
                        scale: 0.8,
                        opacity: 0,
                        duration: exitTime,
                        ease: 'in(2)',
                    });
                });
            });
        }

        // Set up timeouts to transition stages
        exitTimer = setTimeout(() => {
            if (scopeRef.current && scopeRef.current.methods.exitIntro) {
                scopeRef.current.methods.exitIntro();
            }
            setStage('fade-out');

            doneTimer = setTimeout(() => {
                setStage('done');
                document.body.style.overflow = 'unset';
                // Mark initial load as complete
                if (typeof window !== 'undefined') {
                    window.XORYA_INITIAL_LOAD_COMPLETE = true;
                }
            }, exitTime);
        }, activeTime);

        return () => {
            clearTimeout(exitTimer);
            clearTimeout(doneTimer);
            document.body.style.overflow = 'unset';
            if (scopeRef.current) {
                scopeRef.current.revert();
            }
        };
    }, [stage]);

    if (stage === 'done') return null;

    return (
        <div 
            ref={rootRef} 
            className={`intro-container ${stage === 'fade-out' ? 'fade-out' : ''} ${stage === 'short-x' ? 'short-backdrop' : ''}`}
        >
            {stage === 'short-x' && (
                <>
                    <ShaderAnimation />
                    <div className="intro-short-container">
                        <div className="glass-x-symbol" style={{ opacity: 0, transform: 'scale(0.3) rotate(45deg)' }}>
                            <span className="x-text" style={{ opacity: 0, transform: 'scale(0.5) rotate(-90deg)', display: 'inline-block' }}>X</span>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default IntroAnimation;

