import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import './IntroAnimation.css';
import { ShaderAnimation } from './ShaderAnimation';

const IntroAnimation = () => {
    const location = useLocation();
    const [stage, setStage] = useState('initial');
    const isFirstRender = useRef(true);

    if (isFirstRender.current) {
        if (typeof window !== 'undefined') {
            window.HERO_DELAY = 3000; // Always map the main app delay to our new 3-second loader
        }
        isFirstRender.current = false;
    }

    useEffect(() => {
        let fadeTimer, doneTimer;

        // Play the X Shader Animation on every route visit and initial load
        setStage('short-x');
        fadeTimer = setTimeout(() => {
            setStage('fade-out');
            doneTimer = setTimeout(() => setStage('done'), 500); // 500ms fade out transition
        }, 3000); // 3 sec active viewing time

        return () => {
            clearTimeout(fadeTimer);
            clearTimeout(doneTimer);
        };
    }, [location.pathname]);

    if (stage === 'done') return null;

    return (
        <div className={`intro-container ${stage === 'fade-out' ? 'fade-out' : ''} ${stage === 'short-x' ? 'short-backdrop' : ''}`}>
            {stage === 'short-x' && (
                <>
                    <ShaderAnimation />
                    <div className="intro-short-container fade-in">
                        <div className="glass-x-symbol">
                            <span className="x-text">X</span>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default IntroAnimation;
