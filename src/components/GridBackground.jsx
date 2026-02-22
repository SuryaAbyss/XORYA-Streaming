import React from 'react';
import { cn } from '../utils/cn';
import GridPattern from './ui/GridPattern';
import './GridBackground.css';

const GridBackground = ({ children, className }) => {
    return (
        <div className={cn("grid-background-container", className)}>
            <GridPattern
                width={30}
                height={30}
                x={-1}
                y={-1}
                strokeDasharray="4 2"
                style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: 0,
                }}
            />
            <div className="grid-content">
                {children}
            </div>
        </div>
    );
};

export default GridBackground;
