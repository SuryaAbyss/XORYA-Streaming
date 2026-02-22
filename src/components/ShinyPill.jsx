import React from 'react';
import { motion } from 'framer-motion';

const ShinyPill = ({ children }) => {
    return (
        <motion.div
            style={{ position: 'relative', overflow: 'hidden', borderRadius: '50px' }}
            whileHover="hover"
        >
            {children}
            <motion.div
                variants={{
                    hover: { x: ['-100%', '200%'] }
                }}
                transition={{ duration: 1.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 0.5 }}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '50%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                    pointerEvents: 'none',
                    skewX: -20,
                    x: '-150%' // Initial position
                }}
            />
        </motion.div>
    );
};

export default ShinyPill;
