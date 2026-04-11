import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './WatchlistCard.css';
import {
  Plus, Download, Upload, Trash2, X,
  Eye, Clock, CheckCircle2, LayoutList, Film, Tv, Clapperboard
} from 'lucide-react';
import { useWatchlist } from '../hooks/useWatchlist';
import TierRow from '../components/TierRow';
import { imageUrl } from '../api/tmdb';
import ProgressTracker from '../components/ui/ProgressTracker';
import { useMovieModal } from '../context/MovieModalContext';

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

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name.trim(), color);
    setName(''); setColor('#ff4757');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="wl-modal-overlay"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ── Filter Panel (shown when a stat card is clicked) ────────────────────────────
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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="wl-filter-overlay"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 60 }}
            transition={{ type: 'spring', stiffness: 280, damping: 30 }}
            className="wl-filter-panel"
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
            <div className="wl-filter-body">
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
                      <motion.div
                        key={entry.id}
                        className="wl-filter-card"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ '--tier-color': tier?.color ?? '#aaa', cursor: 'pointer' }}
                        onClick={(e) => {
                          // Prevent clicks on action elements from triggering the card click
                          if (e.target.closest('.wl-filter-card-status') || e.target.closest('.wl-progress-wrap')) return;
                          openModal(entry.id, entry.type || 'movie');
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
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ── Clickable Stats Card ────────────────────────────────────────────────────────
const StatsCard = ({ label, value, icon: Icon, color, onClick, filterKey, activeFilter, badge }) => {
  const isActive = activeFilter === filterKey;

  return (
    <div 
      className={`hl-card-wrapper ${isActive ? 'active' : ''} ${onClick ? 'clickable' : ''}`} 
      onClick={onClick} 
      style={{ '--card-color': color }}
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
  } = useWatchlist();

  const [showNewTier, setShowNewTier] = useState(false);
  const [importError, setImportError] = useState('');
  const [activeFilter, setActiveFilter] = useState(null); // null | 'all' | 'watched' | 'watching' | 'pending'
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

  return (
    <div className="wl-page">
      {/* ── Hero ── */}
      <div className="wl-hero">
        <div className="wl-hero-bg" />
        <motion.div
          className="wl-hero-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="wl-hero-badge">
            <LayoutList size={14} />
            <span>Personal Watchlist</span>
          </div>
          <h1 className="wl-hero-title">My Tier List</h1>
          <p className="wl-hero-subtitle">
            Organise, rank &amp; track every movie and series you plan to watch.
          </p>
          {stats.total > 0 && (
            <div className="wl-overall-progress">
              <div className="wl-overall-progress-bar">
                <motion.div
                  className="wl-overall-progress-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${watchedPct}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                />
              </div>
              <span className="wl-overall-progress-label">
                {stats.watched}/{stats.total} watched · {watchedPct}%
              </span>
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Stats Row (clickable) ── */}
      <motion.div
        className="wl-stats-row"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <StatsCard label="Total Titles" value={stats.total} icon={LayoutList} color="#70a1ff" filterKey="all" activeFilter={activeFilter} onClick={() => openFilter('all')} badge="Collection" />
        <StatsCard label="Watched" value={stats.watched} icon={CheckCircle2} color="#7bed9f" filterKey="watched" activeFilter={activeFilter} onClick={() => openFilter('watched')} badge="Done" />
        <StatsCard label="Watching" value={stats.watching} icon={Eye} color="#ffa502" filterKey="watching" activeFilter={activeFilter} onClick={() => openFilter('watching')} badge="Live" />
        <StatsCard label="To Watch" value={stats.pending} icon={Clock} color="#aaa" filterKey="pending" activeFilter={activeFilter} onClick={() => openFilter('pending')} badge="Queue" />

      </motion.div>

      {/* ── Toolbar ── */}
      <div className="wl-toolbar">
        <motion.button
          className="wl-btn wl-btn-primary"
          onClick={() => setShowNewTier(true)}
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
        >
          <Plus size={16} /> New Tier
        </motion.button>

        <div className="wl-toolbar-group">
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

      {/* ── Tier Rows ── */}
      <div className="wl-tiers-container">
        {sortedTiers.length === 0 ? (
          <motion.div className="wl-empty-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2>No tiers yet</h2>
            <p>Create your first tier to start building your watchlist</p>
            <button className="wl-btn wl-btn-primary" onClick={() => setShowNewTier(true)}>
              <Plus size={16} /> Create First Tier
            </button>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {sortedTiers.map((tier, index) => (
              <TierRow
                key={tier.id}
                tier={tier}
                entries={entriesForTier(tier.id)}
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
              />
            ))}
          </AnimatePresence>
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
    </div>
  );
};

export default Watchlist;
