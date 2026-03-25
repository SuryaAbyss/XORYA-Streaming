"use client";

import * as React from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Check, Trash2, Clock, Eye } from "lucide-react";
import ProgressTracker from "./ProgressTracker";

/**
 * @typedef {Object} CardItem
 * @property {string | number} id
 * @property {string} title
 * @property {string} description
 * @property {string} imgSrc
 * @property {string} [backdropSrc]
 * @property {string} [status]
 * @property {Object} [progress]
 * @property {number} [progress.season]
 * @property {number} [progress.episode]
 * @property {React.ReactNode} [icon]
 * @property {string} [linkHref]
 * @property {Function} [onViewDetails]
 * @property {Function} [onStatusChange]
 * @property {Function} [onProgressChange]
 * @property {Function} [onDelete]
 */

/**
 * @typedef {Object} ExpandingCardsProps
 * @property {CardItem[]} items
 * @property {number} [defaultActiveIndex]
 * @property {string} [className]
 */

export const ExpandingCards = ({ items, defaultActiveIndex = 0, className = "" }) => {
  const [activeIndex, setActiveIndex] = React.useState(defaultActiveIndex);
  const [isDesktop, setIsDesktop] = React.useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const gridStyle = React.useMemo(() => {
    if (activeIndex === null) return {};
    
    if (isDesktop) {
      const columns = items
        .map((_, index) => (index === activeIndex ? "5fr" : "1fr"))
        .join(" ");
      return { gridTemplateColumns: columns, gridTemplateRows: '1fr' };
    } else {
      const rows = items
        .map((_, index) => (index === activeIndex ? "5fr" : "1fr"))
        .join(" ");
      return { gridTemplateRows: rows, gridTemplateColumns: '1fr' };
    }
  }, [activeIndex, items.length, isDesktop]);

  const handleInteraction = (index) => {
    setActiveIndex(index);
  };

  return (
    <ul
      className={`expanding-cards-container ${className}`}
      style={gridStyle}
    >
      {items.map((item, index) => (
        <li
          key={item.id}
          className="ec-card"
          onMouseEnter={() => isDesktop ? setActiveIndex(index) : null}
          onClick={() => handleInteraction(index)}
          style={{ 
            '--bg-image': `url(${activeIndex === index ? (item.backdropSrc || item.imgSrc) : item.imgSrc})`,
            '--bg-poster': `url(${item.imgSrc})`
          }}
          data-active={activeIndex === index}
          tabIndex={0}
        >
          <img 
            src={item.imgSrc} 
            alt={item.title} 
            className={`ec-poster ${activeIndex === index ? 'ec-img-hidden' : ''}`}
          />
          {item.backdropSrc && (
            <img 
              src={item.backdropSrc} 
              alt={item.title} 
              className={`ec-backdrop ${activeIndex === index ? '' : 'ec-img-hidden'}`}
            />
          )}
          <div className="ec-overlay" />

          <article className="ec-article">
            <h3 className="ec-title-collapsed">
              {item.title}
            </h3>

            <div className="ec-content">
              {item.icon && <div className="ec-icon">{item.icon}</div>}
              
              <div className="ec-content-inner">
                <div className="ec-content-left">
                  <h3 className="ec-title-expanded">{item.title}</h3>
                  <p className="ec-description">{item.description}</p>
                  
                  <div className="ec-actions" onClick={(e) => e.stopPropagation()}>
                    <button 
                      type="button"
                      className="ec-details-btn"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        item.onViewDetails?.();
                      }}
                    >
                      <ExternalLink size={10} />
                      View Details
                    </button>

                    <div className="ec-status-group">
                      <button 
                        type="button"
                        className={`ec-status-btn ${item.status === 'watched' ? 'active' : ''}`}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); item.onStatusChange?.('watched'); }}
                        title="Mark as Watched"
                      >
                        <Check size={14} />
                      </button>
                      <button 
                        type="button"
                        className={`ec-status-btn ${item.status === 'watching' ? 'active' : ''}`}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); item.onStatusChange?.('watching'); }}
                        title="Mark as Watching"
                      >
                        <Eye size={14} />
                      </button>
                      <button 
                        type="button"
                        className={`ec-status-btn ${item.status === 'pending' ? 'active' : ''}`}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); item.onStatusChange?.('pending'); }}
                        title="Move to To-Watch"
                      >
                        <Clock size={14} />
                      </button>
                    </div>

                    <button 
                      type="button"
                      className="ec-delete-btn"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); item.onDelete?.(); }}
                      title="Remove from Watchlist"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {item.progress && (
                  <ProgressTracker 
                    progress={item.progress} 
                    onChange={item.onProgressChange} 
                  />
                )}
              </div>
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
};

ExpandingCards.displayName = "ExpandingCards";
