import React, { useState, useRef, useEffect } from 'react';
import './WatchlistCard.css';
import Lenis from 'lenis';
import {
  Plus, Download, Upload, Trash2, X, Search,
  Eye, Clock, CheckCircle2, LayoutList, Film, Tv, Cloud
} from 'lucide-react';
import { useWatchlist } from '../hooks/useWatchlist';
import TierRow from '../components/TierRow';
import { imageUrl } from '../api/tmdb';
import ProgressTracker from '../components/ui/ProgressTracker';
import { useMovieModal } from '../context/MovieModalContext';
import GoogleDriveSyncModal from '../components/GoogleDriveSyncModal';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';

const PRESET_COLORS = [
  '#ff4757', '#ffa502', '#eccc68', '#7bed9f',
  '#70a1ff', '#a29bfe', '#fd79a8', '#00cec9',
];

const STATUS_CONFIG = {
  all: { label: 'All Titles', icon: LayoutList, color: '#70a1ff' },
  watched: { label: 'Watched', icon: CheckCircle2, color: '#7bed9f' },
  watching: { label: 'Watching', icon: Eye, color: '#ffa502' },
  pending: { label: 'To Watch', icon: Clock, color: '#aaa' },
};

// ── New Tier Modal ──────────────────────────────────────────────────────────────
const NewTierModal = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#ff4757');

  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);

  const overlayRef = useRef(null);
  const containerRef = useRef(null);

  // Sync isOpen prop
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
    } else if (shouldRender && !isClosing) {
      setIsClosing(true);
      const tl = gsap.timeline({
        onComplete: () => {
          setShouldRender(false);
          setIsClosing(false);
        }
      });
      tl.to(containerRef.current, { scale: 0.9, opacity: 0, y: 15, duration: 0.25, ease: "power3.in" })
        .to(overlayRef.current, { opacity: 0, duration: 0.2 }, "-=0.15");
    }
  }, [isOpen]);

  // Entrance animation
  useGSAP(() => {
    if (isOpen && shouldRender && !isClosing) {
      const tl = gsap.timeline();
      tl.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3 })
        .fromTo(containerRef.current,
          { scale: 0.9, opacity: 0, y: 15 },
          { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: "power4.out" },
          "-=0.15"
        );
    }
  }, [isOpen, shouldRender]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name.trim(), color);
    setName(''); setColor('#ff4757');
    onClose();
  };

  if (!shouldRender) return null;

  return (
    <div
      ref={overlayRef}
      style={{ opacity: 0 }}
      className="wl-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={containerRef}
        style={{ opacity: 0, transform: 'translateY(15px) scale(0.9)' }}
        className="wl-new-tier-modal"
      >
        <div className="wl-modal-header">
          <h3>Create New Tier</h3>
          <button className="wl-modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="wl-modal-body">
          <label className="wl-modal-label">Tier Name</label>
          <input
            className="wl-modal-input"
            placeholder="e.g. Top Priority"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            autoFocus maxLength={40}
          />
          <label className="wl-modal-label" style={{ marginTop: '1.25rem' }}>Tier Color</label>
          <div className="wl-modal-colors">
            {PRESET_COLORS.map(c => (
              <button
                key={c}
                className={`wl-color-swatch ${c === color ? 'selected' : ''}`}
                style={{ background: c }}
                onClick={() => setColor(c)}
              />
            ))}
            <input
              type="color" value={color}
              onChange={e => setColor(e.target.value)}
              className="wl-modal-color-input" title="Custom color"
            />
          </div>
          {name && (
            <div className="wl-modal-preview" style={{ borderColor: color + '55', background: color + '11' }}>
              <span style={{ color, fontWeight: 700 }}>{name}</span>
            </div>
          )}
        </div>
        <div className="wl-modal-footer">
          <button className="wl-btn wl-btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="wl-btn wl-btn-primary"
            style={{ background: color, color: '#000' }}
            onClick={handleSave}
            disabled={!name.trim()}
          >
            <Plus size={16} /> Create Tier
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Filter Panel ────────────────────────────────────────────────────────────────
const FilterPanel = ({ isOpen, onClose, filter, entries, tiers, onProgress, onStatusChange }) => {
  const { openModal } = useMovieModal();
  const cfg = STATUS_CONFIG[filter] || STATUS_CONFIG.all;
  const Icon = cfg.icon;

  const filtered = filter === 'all'
    ? entries
    : entries.filter(e => e.status === filter);

  const getTier = (tierId) => tiers.find(t => t.id === tierId);

  const STATUS_BADGE = {
    pending: { label: 'To Watch', color: '#aaa', bg: 'rgba(170,170,170,0.15)' },
    watching: { label: 'Watching', color: '#ffa502', bg: 'rgba(255,165,2,0.15)' },
    watched: { label: 'Watched', color: '#7bed9f', bg: 'rgba(123,237,159,0.15)' },
  };

  const bodyRef = useRef(null);
  const lenisRef = useRef(null);

  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);

  const overlayRef = useRef(null);
  const panelRef = useRef(null);

  // Sync isOpen prop
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
    } else if (shouldRender && !isClosing) {
      setIsClosing(true);
      const tl = gsap.timeline({
        onComplete: () => {
          setShouldRender(false);
          setIsClosing(false);
        }
      });
      tl.to(panelRef.current, { x: '100%', opacity: 0, duration: 0.3, ease: "power3.in" })
        .to(overlayRef.current, { opacity: 0, duration: 0.25 }, "-=0.2");
    }
  }, [isOpen]);

  // Entrance animation
  useGSAP(() => {
    if (isOpen && shouldRender && !isClosing) {
      const tl = gsap.timeline();
      tl.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3 })
        .fromTo(panelRef.current,
          { x: '100%', opacity: 0 },
          { x: 0, opacity: 1, duration: 0.5, ease: "power4.out" },
          "-=0.15"
        );
    }
  }, [isOpen, shouldRender]);

  // Stagger grid cards when results change
  useGSAP(() => {
    if (shouldRender && !isClosing && panelRef.current) {
      const cards = panelRef.current.querySelectorAll('.wl-filter-card');
      if (cards && cards.length > 0) {
        gsap.fromTo(cards,
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.45, stagger: 0.03, ease: "power3.out", overwrite: "auto" }
        );
      }
    }
  }, [filtered.length, shouldRender, isClosing]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    let lenisInstance = null;
    let rafId = null;

    const bodyEl = bodyRef.current;
    if (shouldRender && bodyEl) {
      lenisInstance = new Lenis({
        wrapper: bodyEl,
        lerp: 0.1,
        duration: 1.5,
        smoothWheel: true,
      });
      lenisRef.current = lenisInstance;

      const raf = (time) => {
        lenisInstance.raf(time);
        rafId = requestAnimationFrame(raf);
      };
      rafId = requestAnimationFrame(raf);
    }

    const handleWheel = (e) => {
      const bodyEl = bodyRef.current;
      const lenis = lenisRef.current;
      if (!bodyEl || !lenis) return;

      const isInsideBody = bodyEl.contains(e.target);
      if (isInsideBody) {
        e.stopPropagation();
        return;
      }

      let delta = e.deltaY;
      if (e.deltaMode === 1) delta *= 33;
      else if (e.deltaMode === 2) delta *= window.innerHeight;
      else if (Math.abs(delta) < 40) delta *= 2.5;

      lenis.scrollTo(lenis.scroll + delta, { immediate: false });
      
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
    };

    let touchStartY = 0;
    const handleTouchStart = (e) => {
      if (e.touches.length > 0) touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      const bodyEl = bodyRef.current;
      const lenis = lenisRef.current;
      if (!bodyEl || !lenis) return;

      const isInsideBody = bodyEl.contains(e.target);
      if (isInsideBody) {
        e.stopPropagation();
        return;
      }

      if (e.touches.length > 0) {
        const touchY = e.touches[0].clientY;
        const deltaY = touchStartY - touchY;
        touchStartY = touchY;
        lenis.scrollTo(lenis.scroll + deltaY * 1.5, { immediate: true });
      }
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
    };

    if (shouldRender) {
      document.addEventListener('keydown', handleEscape);
      window.addEventListener('wheel', handleWheel, { passive: false });
      window.addEventListener('touchstart', handleTouchStart, { passive: true });
      window.addEventListener('touchmove', handleTouchMove, { passive: false });

      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      
      document.documentElement.classList.add('no-scroll');
      document.body.classList.add('no-scroll');
      const rootEl = document.getElementById('root');
      if (rootEl) rootEl.classList.add('no-scroll');
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);

      if (lenisInstance) {
        lenisInstance.destroy();
        lenisRef.current = null;
      }
      if (rafId) cancelAnimationFrame(rafId);

      document.body.style.paddingRight = '';
      document.documentElement.classList.remove('no-scroll');
      document.body.classList.remove('no-scroll');
      const rootEl = document.getElementById('root');
      if (rootEl) rootEl.classList.remove('no-scroll');
    };
  }, [shouldRender, onClose]);

  if (!shouldRender) return null;

  return (
    <div
      ref={overlayRef}
      style={{ opacity: 0 }}
      className="wl-filter-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      data-lenis-prevent
    >
      <div
        ref={panelRef}
        style={{ opacity: 0, transform: 'translateX(100%)' }}
        className="wl-filter-panel"
        data-lenis-prevent
      >
        {/* Header */}
        <div className="wl-filter-header">
          <div className="wl-filter-header-left">
            <div className="wl-filter-icon" style={{ background: cfg.color + '22', color: cfg.color }}>
              <Icon size={18} />
            </div>
            <div>
              <h2 className="wl-filter-title">{cfg.label}</h2>
              <p className="wl-filter-count">{filtered.length} title{filtered.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button className="wl-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Content */}
        <div className="wl-filter-body" ref={bodyRef}>
          {filtered.length === 0 ? (
            <div className="wl-filter-empty">
              <p>Nothing here yet</p>
              <span>Add movies &amp; series to your tiers to see them here.</span>
            </div>
          ) : (
            <div className="wl-filter-grid">
              {filtered.map(entry => {
                const tier = getTier(entry.tierId);
                const badge = STATUS_BADGE[entry.status] || STATUS_BADGE.pending;
                const prog = entry.progress;
                return (
                  <div
                    key={entry.id}
                    className="wl-filter-card"
                    style={{ '--tier-color': tier?.color ?? '#aaa', cursor: 'pointer', opacity: 0, transform: 'translateY(15px)' }}
                    onClick={(e) => {
                      if (e.target.closest('.wl-filter-card-status') || e.target.closest('.wl-progress-wrap')) return;
                      openModal(entry.tmdbId, entry.type || 'movie');
                    }}
                  >
                    {/* Poster */}
                    <div className="wl-filter-card-poster">
                      {entry.poster ? (
                        <img src={imageUrl(entry.poster, 'w185')} alt={entry.title} loading="lazy" />
                      ) : (
                        <div className="wl-filter-card-no-poster">
                          {entry.type === 'tv' ? <Tv size={20} /> : <Film size={20} />}
                        </div>
                      )}
                      {/* Type pill */}
                      <div className="wl-card-type-badge" style={{ zIndex: 2 }}>
                        {entry.type === 'tv' ? <Tv size={9} /> : <Film size={9} />}
                        <span>{entry.type === 'tv' ? 'TV' : 'Movie'}</span>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="wl-filter-card-info">
                      <p className="wl-filter-card-title" title={entry.title}>{entry.title}</p>

                      {/* Tier dot + name */}
                      {tier && (
                        <div className="wl-filter-card-tier">
                          <span className="wl-filter-card-tier-dot" style={{ background: tier.color }} />
                          <span className="wl-filter-card-tier-name">{tier.name}</span>
                        </div>
                      )}

                      {/* Year + rating */}
                      <p className="wl-filter-card-meta">
                        {entry.year && <span>{entry.year}</span>}
                        {entry.rating && <span>⭐ {entry.rating}</span>}
                      </p>

                      {/* Status badge */}
                      <div className="wl-filter-card-status" style={{ background: badge.bg, color: badge.color }}>
                        {badge.label}
                      </div>

                      {/* TV progress if set */}
                      {entry.type === 'tv' && prog && (
                        <ProgressTracker 
                          progress={prog} 
                          onChange={(s, e) => onProgress?.(entry.id, s, e)} 
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Clickable Stats Card ────────────────────────────────────────────────────────
const StatsCard = ({ label, value, icon: Icon, color, onClick, filterKey, activeFilter, badge }) => {
  const isActive = activeFilter === filterKey;

  return (
    <div 
      className={`hl-card-wrapper ${isActive ? 'active' : ''} ${onClick ? 'clickable' : ''}`} 
      onClick={onClick} 
      style={{ '--card-color': color, opacity: 0, transform: 'translateY(20px)' }}
    >
      <div className="hl-card">
        <div className="hl-bg-elements">
          <div className="hl-bg-gradient"></div>
          <div className="hl-glow-bot"></div>
          <div className="hl-ping-top"></div>
          <div className="hl-ping-bot"></div>
          <div className="hl-shine"></div>
        </div>

        <div className="hl-content">
          <div className="hl-badge-container">
            {badge && (
              <span className="hl-badge" style={{ color: color }}>
                {badge}
              </span>
            )}
          </div>

          <div className="hl-icon-container">
            <div className="hl-icon-ring-1"></div>
            <div className="hl-icon-ring-2"></div>
            <div className="hl-icon-inner">
              <div className="hl-icon-spin">
                <Icon size={24} />
              </div>
            </div>
          </div>

          <h3 className="hl-title">{value}</h3>
          
          <div className="hl-desc">
            {label}
          </div>

          <div className="hl-divider"></div>

          <div className="hl-dots">
            <div className="hl-dot"></div>
            <div className="hl-dot"></div>
            <div className="hl-dot"></div>
          </div>
        </div>

        <div className="hl-corners">
          <div className="hl-corner-tl"></div>
          <div className="hl-corner-br"></div>
        </div>
      </div>
    </div>
  );
};

// ── Main Watchlist Page ─────────────────────────────────────────────────────────
const Watchlist = () => {
  const {
    tiers, entries, stats,
    addTier, renameTier, recolorTier, deleteTier, reorderTiers,
    addEntry, removeEntry, setStatus, moveEntry, setProgress,
    entriesForTier,
    exportData, importData, clearAll,
    driveState, connectGoogleDrive, disconnectGoogleDrive,
    syncNowWithDrive, restoreFromDrive, saveCustomClientId
  } = useWatchlist();

  const [showNewTier, setShowNewTier] = useState(false);
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [importError, setImportError] = useState('');
  const [activeFilter, setActiveFilter] = useState(null); // null | 'all' | 'watched' | 'watching' | 'pending'
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef(null);

  const allEntryIds = entries.map(e => e.tmdbId);
  const sortedTiers = [...tiers].sort((a, b) => a.order - b.order);
  const watchedPct = stats.total > 0 ? Math.round((stats.watched / stats.total) * 100) : 0;

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const ok = importData(ev.target.result);
      if (!ok) setImportError('Invalid file — please use a XORYA watchlist JSON.');
      else setImportError('');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClearAll = () => {
    if (window.confirm('This will delete ALL tiers and entries and reset to defaults. Are you sure?'))
      clearAll();
  };

  const openFilter = (key) => setActiveFilter(prev => prev === key ? null : key);

  // Main Page Entrance Load Timeline
  useGSAP(() => {
    const tl = gsap.timeline();
    tl.fromTo('.wl-hero-badge', { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.4 })
      .fromTo('.wl-hero-title', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, "-=0.25")
      .fromTo('.wl-hero-subtitle', { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.4 }, "-=0.3")
      .fromTo('.wl-overall-progress', { opacity: 0, scaleX: 0.95 }, { opacity: 1, scaleX: 1, duration: 0.4 }, "-=0.2")
      .fromTo('.wl-overall-progress-fill', { width: 0 }, { width: `${watchedPct}%`, duration: 1, ease: "power3.out" }, "-=0.25")
      .fromTo('.hl-card-wrapper', 
        { opacity: 0, y: 20 }, 
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: "power3.out" }, 
        "-=0.5"
      )
      .fromTo('.wl-toolbar-group > *, .wl-toolbar > button', 
        { opacity: 0, y: 10 }, 
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.04 }, 
        "-=0.3"
      )
      .fromTo('.wl-tier-row', 
        { opacity: 0, y: 30 }, 
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: "power3.out" }, 
        "-=0.25"
      );
  }, []);

  return (
    <div className="wl-page">
      {/* ── Hero ── */}
      <div className="wl-hero">
        <div className="wl-hero-bg" />
        <div className="wl-hero-content">
          <div className="wl-hero-badge" style={{ opacity: 0 }}>
            <LayoutList size={14} />
            <span>Personal Watchlist</span>
          </div>
          <h1 className="wl-hero-title" style={{ opacity: 0 }}>My Tier List</h1>
          <p className="wl-hero-subtitle" style={{ opacity: 0 }}>
            Organise, rank &amp; track every movie and series you plan to watch.
          </p>
          {stats.total > 0 && (
            <div className="wl-overall-progress" style={{ opacity: 0 }}>
              <div className="wl-overall-progress-bar">
                <div className="wl-overall-progress-fill" style={{ width: 0 }} />
              </div>
              <span className="wl-overall-progress-label">
                {stats.watched}/{stats.total} watched · {watchedPct}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="wl-stats-row">
        <StatsCard label="Total Titles" value={stats.total} icon={LayoutList} color="#70a1ff" filterKey="all" activeFilter={activeFilter} onClick={() => openFilter('all')} badge="Collection" />
        <StatsCard label="Watched" value={stats.watched} icon={CheckCircle2} color="#7bed9f" filterKey="watched" activeFilter={activeFilter} onClick={() => openFilter('watched')} badge="Done" />
        <StatsCard label="Watching" value={stats.watching} icon={Eye} color="#ffa502" filterKey="watching" activeFilter={activeFilter} onClick={() => openFilter('watching')} badge="Live" />
        <StatsCard label="To Watch" value={stats.pending} icon={Clock} color="#aaa" filterKey="pending" activeFilter={activeFilter} onClick={() => openFilter('pending')} badge="Queue" />
      </div>

      {/* ── Toolbar ── */}
      <div className="wl-toolbar">
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
          <button
            className="wl-btn wl-btn-primary"
            onClick={() => setShowNewTier(true)}
            style={{ transition: 'transform 0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.04)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Plus size={16} /> New Tier
          </button>

          <div className="wl-search-local-container" style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '250px' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', color: 'rgba(255,255,255,0.4)', pointerEvents: 'none' }} />
            <input
              type="text"
              className="wl-local-search-input"
              placeholder="Search in watchlist..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '24px',
                color: '#fff',
                fontSize: '0.8rem',
                outline: 'none',
                transition: 'all 0.3s ease'
              }}
              onFocus={e => { e.target.style.borderColor = '#dc2626'; e.target.style.boxShadow = '0 0 8px rgba(220,38,38,0.2)'; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: '12px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 0 }}
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        <div className="wl-toolbar-group">
          <button 
            className="wl-btn-tool" 
            onClick={() => setShowDriveModal(true)}
            style={{
              background: driveState.isConnected ? 'rgba(66, 133, 244, 0.15)' : 'rgba(255, 255, 255, 0.04)',
              borderColor: driveState.isConnected ? 'rgba(66, 133, 244, 0.4)' : 'rgba(255, 255, 255, 0.1)',
              color: driveState.isConnected ? '#4285F4' : 'rgba(255, 255, 255, 0.8)'
            }}
          >
            <Cloud size={15} />
            <span>{driveState.isConnected ? 'Cloud Sync' : 'Drive Backup'}</span>
            {driveState.isConnected && (
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: driveState.isSyncing ? '#ffa502' : '#34A853',
                display: 'inline-block',
                boxShadow: driveState.isSyncing ? '0 0 6px #ffa502' : '0 0 6px #34A853'
              }} />
            )}
          </button>

          <button className="wl-btn-tool" onClick={exportData}>
            <Download size={15} /><span>Export</span>
          </button>
          <button className="wl-btn-tool" onClick={() => fileInputRef.current?.click()}>
            <Upload size={15} /><span>Import</span>
          </button>
          <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.06)', margin: '0 0.25rem' }} />
          <button className="wl-btn-tool danger" onClick={handleClearAll}>
            <Trash2 size={15} /><span>Reset</span>
          </button>
          <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
        </div>
      </div>

      {importError && (
        <div className="wl-import-error">
          <span>⚠️ {importError}</span>
          <button onClick={() => setImportError('')}><X size={14} /></button>
        </div>
      )}

      {/* ── Cache Restoration Banner if Empty ── */}
      {entries.length === 0 && (
        <div style={{
          margin: '1.5rem 2rem 0',
          padding: '1.2rem 1.5rem',
          background: 'linear-gradient(135deg, rgba(66, 133, 244, 0.12) 0%, rgba(52, 168, 83, 0.08) 100%)',
          border: '1px solid rgba(66, 133, 244, 0.25)',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'rgba(66, 133, 244, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#4285F4'
            }}>
              <Cloud size={20} />
            </div>
            <div>
              <div style={{ color: 'white', fontWeight: '700', fontSize: '0.92rem' }}>
                Cleared browser cache or history?
              </div>
              <div style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '0.8rem', marginTop: '2px' }}>
                Connect your Google Drive to instantly restore your Watchlist titles, tiers, and episode progress.
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowDriveModal(true)}
            style={{
              background: 'linear-gradient(135deg, #4285F4 0%, #34A853 100%)',
              border: 'none',
              borderRadius: '12px',
              padding: '0.65rem 1.2rem',
              color: 'white',
              fontSize: '0.82rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 15px rgba(66, 133, 244, 0.3)'
            }}
          >
            <Cloud size={15} /> Restore from Google Drive
          </button>
        </div>
      )}

      {/* ── Tier Rows ── */}
      <div className="wl-tiers-container">
        {sortedTiers.length === 0 ? (
          <div className="wl-empty-state">
            <h2>No tiers yet</h2>
            <p>Create your first tier to start building your watchlist</p>
            <button className="wl-btn wl-btn-primary" onClick={() => setShowNewTier(true)}>
              <Plus size={16} /> Create First Tier
            </button>
          </div>
        ) : (
          sortedTiers.map((tier, index) => {
            let tierEntries = entriesForTier(tier.id);
            if (searchQuery.trim()) {
              const q = searchQuery.toLowerCase();
              tierEntries = tierEntries.filter(e => e.title?.toLowerCase().includes(q));
            }
            return (
              <TierRow
                key={tier.id}
                tier={tier}
                entries={tierEntries}
                allTiers={sortedTiers}
                allEntryIds={allEntryIds}
                index={index}
                totalTiers={sortedTiers.length}
                onRename={renameTier}
                onRecolor={recolorTier}
                onDelete={deleteTier}
                onAddEntry={addEntry}
                onRemoveEntry={removeEntry}
                onStatusChange={setStatus}
                onMoveEntry={moveEntry}
                onProgress={setProgress}
                onMoveUp={(i) => reorderTiers(i, i - 1)}
                onMoveDown={(i) => reorderTiers(i, i + 1)}
                isSearching={!!searchQuery.trim()}
              />
            );
          })
        )}
      </div>

      {/* ── New Tier Modal ── */}
      <NewTierModal
        isOpen={showNewTier}
        onClose={() => setShowNewTier(false)}
        onSave={addTier}
      />

      {/* ── Filter Panel ── */}
      <FilterPanel
        isOpen={!!activeFilter}
        onClose={() => setActiveFilter(null)}
        filter={activeFilter || 'all'}
        entries={entries}
        tiers={tiers}
        onProgress={setProgress}
        onStatusChange={setStatus}
      />

      {/* ── Google Drive Sync Modal ── */}
      <GoogleDriveSyncModal
        isOpen={showDriveModal}
        onClose={() => setShowDriveModal(false)}
        driveState={driveState}
        onConnect={connectGoogleDrive}
        onDisconnect={disconnectGoogleDrive}
        onSyncNow={syncNowWithDrive}
        onRestore={restoreFromDrive}
        clientId={driveState.clientId}
        onSaveClientId={saveCustomClientId}
      />
    </div>
  );
};

export default Watchlist;
