import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ProgressTracker = ({ progress, onChange }) => {
  const [showPicker, setShowPicker] = React.useState(false);

  return (
    <div className="ec-progress-section" onClick={(e) => e.stopPropagation()}>
      {/* Label is now the sole interface for progress tracking */}
      <button 
        type="button"
        className={`ec-progress-label-btn ${showPicker ? 'active' : ''}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowPicker(!showPicker);
        }}
      >
        <span>S{progress.season}</span>
        <span className="dot">·</span>
        <span>E{progress.episode}</span>
      </button>

      {/* Hover Picker Popover */}
      <AnimatePresence>
        {showPicker && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="ec-progress-popover"
          >
            <div className="ec-popover-row">
              <span className="ec-popover-tag">Season</span>
              <div className="ec-popover-btns">
                <button type="button" onClick={(e) => { e.stopPropagation(); onChange?.(Math.max(1, progress.season - 1), progress.episode); }}>-</button>
                <span className="ec-popover-val">{progress.season}</span>
                <button type="button" onClick={(e) => { e.stopPropagation(); onChange?.(progress.season + 1, progress.episode); }}>+</button>
              </div>
            </div>
            <div className="ec-popover-row">
              <span className="ec-popover-tag">Episode</span>
              <div className="ec-popover-btns">
                <button type="button" onClick={(e) => { e.stopPropagation(); onChange?.(progress.season, Math.max(1, progress.episode - 1)); }}>-</button>
                <span className="ec-popover-val">{progress.episode}</span>
                <button type="button" onClick={(e) => { e.stopPropagation(); onChange?.(progress.season, progress.episode + 1); }}>+</button>
              </div>
            </div>
            <button 
              type="button" 
              className="ec-popover-done"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowPicker(false);
              }}
            >
              Done
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProgressTracker;
