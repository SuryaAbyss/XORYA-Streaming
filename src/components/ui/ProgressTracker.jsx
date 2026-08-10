import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ProgressTracker = ({ progress, onChange }) => {
  const [showPicker, setShowPicker] = React.useState(false);

  const isMovie = progress && progress.percent !== undefined;

  if (isMovie) {
    return (
      <div className="ec-progress-section" onClick={(e) => e.stopPropagation()}>
        <button 
          type="button"
          className={`ec-progress-label-btn ${showPicker ? 'active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowPicker(!showPicker);
          }}
        >
          <span>{progress.percent}% Watched</span>
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
                <span className="ec-popover-tag">Progress</span>
                <div className="ec-popover-btns">
                  <button type="button" onClick={(e) => { e.stopPropagation(); onChange?.(undefined, undefined, Math.max(0, progress.percent - 10)); }}>-10%</button>
                  <span className="ec-popover-val">{progress.percent}%</span>
                  <button type="button" onClick={(e) => { e.stopPropagation(); onChange?.(undefined, undefined, Math.min(100, progress.percent + 10)); }}>+10%</button>
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
  }

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
        <span>S{progress?.season ?? 1}</span>
        <span className="dot">·</span>
        <span>E{progress?.episode ?? 1}</span>
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
                <button type="button" onClick={(e) => { e.stopPropagation(); onChange?.(Math.max(1, (progress?.season ?? 1) - 1), progress?.episode ?? 1); }}>-</button>
                <span className="ec-popover-val">{progress?.season ?? 1}</span>
                <button type="button" onClick={(e) => { e.stopPropagation(); onChange?.((progress?.season ?? 1) + 1, progress?.episode ?? 1); }}>+</button>
              </div>
            </div>
            <div className="ec-popover-row">
              <span className="ec-popover-tag">Episode</span>
              <div className="ec-popover-btns">
                <button type="button" onClick={(e) => { e.stopPropagation(); onChange?.(progress?.season ?? 1, Math.max(1, (progress?.episode ?? 1) - 1)); }}>-</button>
                <span className="ec-popover-val">{progress?.episode ?? 1}</span>
                <button type="button" onClick={(e) => { e.stopPropagation(); onChange?.(progress?.season ?? 1, (progress?.episode ?? 1) + 1); }}>+</button>
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
