import React from 'react';
import './DotBackground.css';

const DotBackground = ({ children }) => {
    return (
        <div className="dot-background-container">
            <div className="dot-pattern" />
            {/* 
        This mask div overlays the pattern. 
        It is black, but transparent in the center (via mask-image), 
        revealing the dots in the center and fading to black at edges.
      */}
            <div className="dot-mask" />
            <div className="dot-content">
                {children}
            </div>
        </div>
    );
};

export default DotBackground;
