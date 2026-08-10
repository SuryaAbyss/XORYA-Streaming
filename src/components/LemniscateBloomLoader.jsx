import React, { useEffect, useRef } from 'react';

const SVG_NS = 'http://www.w3.org/2000/svg';

const config = {
    name: "Lemniscate Bloom",
    tag: "Bernoulli Lemniscate",
    rotate: false,
    particleCount: 75,
    trailSpan: 0.46,
    durationMs: 3300,
    rotationDurationMs: 6500,
    pulseDurationMs: 5000,
    strokeWidth: 5.8,
    lemniscateA: 30,
    lemniscateBoost: 7,
    point(progress, detailScale, config) {
        const t = progress * Math.PI * 2;
        const scale = config.lemniscateA + detailScale * config.lemniscateBoost;
        const denom = 1 + Math.sin(t) ** 2;
        return {
            x: 50 + (scale * Math.cos(t)) / denom,
            y: 50 + (scale * Math.sin(t) * Math.cos(t)) / denom,
        };
    },
};

function normalizeProgress(progress) {
    return ((progress % 1) + 1) % 1;
}

function getDetailScale(time) {
    const pulseProgress = (time % config.pulseDurationMs) / config.pulseDurationMs;
    const pulseAngle = pulseProgress * Math.PI * 2;
    return 0.52 + ((Math.sin(pulseAngle + 0.55) + 1) / 2) * 0.48;
}

function getRotation(time) {
    if (!config.rotate) return 0;
    return -((time % config.rotationDurationMs) / config.rotationDurationMs) * 360;
}

function buildPath(detailScale, steps = 480) {
    return Array.from({ length: steps + 1 }, (_, index) => {
        const point = config.point(index / steps, detailScale, config);
        return `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
    }).join(' ');
}

function getParticle(index, progress, detailScale) {
    const tailOffset = index / (config.particleCount - 1);
    const point = config.point(normalizeProgress(progress - tailOffset * config.trailSpan), detailScale, config);
    const fade = Math.pow(1 - tailOffset, 0.56);
    return {
        x: point.x,
        y: point.y,
        radius: 0.9 + fade * 2.7,
        opacity: 0.04 + fade * 0.96,
    };
}

const LemniscateBloomLoader = ({ text = "Loading player...", fullScreen = true, color = "#00bcd4" }) => {
    const svgRef = useRef(null);
    const groupRef = useRef(null);
    const pathRef = useRef(null);

    useEffect(() => {
        const group = groupRef.current;
        const path = pathRef.current;
        if (!group || !path) return;

        path.setAttribute('stroke-width', String(config.strokeWidth));

        // Create particles inside SVG group
        const particles = Array.from({ length: config.particleCount }, () => {
            const circle = document.createElementNS(SVG_NS, 'circle');
            circle.setAttribute('fill', 'currentColor');
            group.appendChild(circle);
            return circle;
        });

        let animationFrameId;
        const startedAt = performance.now();

        function render(now) {
            const time = now - startedAt;
            const progress = (time % config.durationMs) / config.durationMs;
            const detailScale = getDetailScale(time);

            group.setAttribute('transform', `rotate(${getRotation(time)} 50 50)`);
            path.setAttribute('d', buildPath(detailScale));

            particles.forEach((node, index) => {
                const particle = getParticle(index, progress, detailScale);
                node.setAttribute('cx', particle.x.toFixed(2));
                node.setAttribute('cy', particle.y.toFixed(2));
                node.setAttribute('r', particle.radius.toFixed(2));
                node.setAttribute('opacity', particle.opacity.toFixed(3));
            });

            animationFrameId = requestAnimationFrame(render);
        }

        animationFrameId = requestAnimationFrame(render);

        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            particles.forEach(node => node.remove());
        };
    }, []);

    const content = (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1.25rem',
            color: color,
        }}>
            <div style={{
                width: 'min(50vmin, 170px)',
                aspectRatio: '1',
                display: 'grid',
                placeItems: 'center',
                filter: `drop-shadow(0 0 16px ${color}66) drop-shadow(0 0 35px ${color}33)`,
            }}>
                <svg ref={svgRef} viewBox="0 0 100 100" fill="none" aria-hidden="true" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                    <g ref={groupRef}>
                        <path ref={pathRef} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" opacity="0.18"></path>
                    </g>
                </svg>
            </div>
            {text && (
                <div style={{ textAlign: 'center' }}>
                    <p style={{
                        fontSize: '0.92rem',
                        fontWeight: '600',
                        letterSpacing: '1.5px',
                        color: 'rgba(255, 255, 255, 0.85)',
                        margin: 0,
                        textTransform: 'uppercase',
                    }}>
                        {text}
                    </p>
                </div>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <div style={{
                minHeight: '100vh',
                width: '100%',
                background: 'radial-gradient(circle at center, #090e17 0%, #030305 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                position: 'fixed',
                inset: 0,
                zIndex: 99999,
            }}>
                {content}
            </div>
        );
    }

    return content;
};

export default LemniscateBloomLoader;
