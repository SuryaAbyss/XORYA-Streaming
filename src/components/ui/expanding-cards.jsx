"use client";

import * as React from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Check, Trash2, Clock, Eye, ChevronLeft, ChevronRight } from "lucide-react";
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

export const ExpandingCards = ({ items, tierColor, defaultActiveIndex = 0, className = "" }) => {
  const [activeIndex, setActiveIndex] = React.useState(defaultActiveIndex);
  const [isDesktop, setIsDesktop] = React.useState(false);
  const navigate = useNavigate();

  const containerRef = React.useRef(null);

  const [showLeftArrow, setShowLeftArrow] = React.useState(false);
  const [showRightArrow, setShowRightArrow] = React.useState(false);

  React.useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const updateArrows = () => {
    if (containerRef.current && items.length > 10) {
      const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    } else {
      setShowLeftArrow(false);
      setShowRightArrow(false);
    }
  };

  // Scroll active card horizontally into view within the container only (prevents window jumping)
  React.useEffect(() => {
    if (activeIndex !== null && containerRef.current && items[activeIndex]) {
      const activeCardEl = containerRef.current.querySelector(`[data-id="${items[activeIndex].id || items[activeIndex].tmdbId}"]`);
      if (activeCardEl) {
        const container = containerRef.current;
        const cardLeft = activeCardEl.offsetLeft;
        const cardRight = cardLeft + activeCardEl.offsetWidth;
        const scrollLeft = container.scrollLeft;
        const clientWidth = container.clientWidth;

        if (cardLeft < scrollLeft) {
          container.scrollTo({ left: Math.max(0, cardLeft - 16), behavior: 'smooth' });
        } else if (cardRight > scrollLeft + clientWidth) {
          container.scrollTo({ left: cardRight - clientWidth + 16, behavior: 'smooth' });
        }
      }
    }
    updateArrows();
  }, [activeIndex, items]);

  React.useEffect(() => {
    const container = containerRef.current;
    if (container) {
      updateArrows();
      container.addEventListener('scroll', updateArrows);
      window.addEventListener('resize', updateArrows);
    }
    return () => {
      if (container) {
        container.removeEventListener('scroll', updateArrows);
      }
      window.removeEventListener('resize', updateArrows);
    };
  }, [items]);

  React.useEffect(() => {
    setActiveIndex(prev => {
      if (items.length === 0) return 0;
      if (prev >= items.length) return Math.max(0, items.length - 1);
      return prev;
    });
  }, [items.length]);

  const scroll = (direction) => {
    if (containerRef.current) {
      const scrollAmount = 400;
      const currentScroll = containerRef.current.scrollLeft;
      const newScroll = direction === 'left'
        ? currentScroll - scrollAmount
        : currentScroll + scrollAmount;

      containerRef.current.scrollTo({
        left: newScroll,
        behavior: 'smooth'
      });
    }
  };

  const gridStyle = React.useMemo(() => {
    if (activeIndex === null) return {};
    
    // Balanced horizontal layout with comfortable spine width
    const columns = items
      .map((_, index) => (index === activeIndex ? "315px" : "60px"))
      .join(" ");
    return { gridTemplateColumns: columns, gridTemplateRows: '1fr' };
  }, [activeIndex, items.length]);

  const handleInteraction = (index) => {
    if (activeIndex === index) {
      items[index].onViewDetails?.();
    } else {
      setActiveIndex(index);
    }
  };

  return (
    <div className="expanding-cards-wrapper" style={{ position: 'relative', width: '100%', '--tier-color': tierColor }}>
      {showLeftArrow && (
        <button
          className="wl-carousel-arrow left"
          onClick={(e) => { e.stopPropagation(); scroll('left'); }}
          aria-label="Scroll left"
        >
          <ChevronLeft size={18} />
        </button>
      )}

      {showRightArrow && (
        <button
          className="wl-carousel-arrow right"
          onClick={(e) => { e.stopPropagation(); scroll('right'); }}
          aria-label="Scroll right"
        >
          <ChevronRight size={18} />
        </button>
      )}

      <ul
        ref={containerRef}
        className={`expanding-cards-container ${className}`}
        style={gridStyle}
      >
        {items.map((item, index) => (
          <li
            key={item.id || item.tmdbId || index}
            data-id={item.id || item.tmdbId}
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
              {item.progress && (
                <div className="ec-top-badge">
                  <ProgressTracker 
                    progress={item.progress} 
                    onChange={item.onProgressChange} 
                  />
                </div>
              )}

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
                        title="View Details"
                      >
                        <ExternalLink size={12} />
                        <span>Details</span>
                      </button>

                      <div className="ec-status-group">
                        <button 
                          type="button"
                          className={`ec-status-btn status-watched ${item.status === 'watched' ? 'active' : ''}`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            item.onStatusChange?.('watched');
                          }}
                          title="Mark as Watched"
                          aria-label="Mark as Watched"
                        >
                          <Check size={13} strokeWidth={2.5} />
                        </button>
                        <button 
                          type="button"
                          className={`ec-status-btn status-watching ${item.status === 'watching' ? 'active' : ''}`}
                          onClick={(e) => { 
                            e.preventDefault(); 
                            e.stopPropagation(); 
                            item.onStatusChange?.('watching'); 
                          }}
                          title="Mark as Watching"
                          aria-label="Mark as Watching"
                        >
                          <Eye size={13} strokeWidth={2.5} />
                        </button>
                        <button 
                          type="button"
                          className={`ec-status-btn status-pending ${item.status === 'pending' ? 'active' : ''}`}
                          onClick={(e) => { 
                            e.preventDefault(); 
                            e.stopPropagation(); 
                            item.onStatusChange?.('pending'); 
                          }}
                          title="Move to To-Watch"
                          aria-label="Move to To-Watch"
                        >
                          <Clock size={13} strokeWidth={2.5} />
                        </button>
                      </div>

                      <button 
                        type="button"
                        className="ec-delete-btn"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          item.onDelete?.();
                        }}
                        title="Remove from Watchlist"
                        aria-label="Remove from Watchlist"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </div>
  );
};

ExpandingCards.displayName = "ExpandingCards";

