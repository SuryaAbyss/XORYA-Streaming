import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trash2, Eye, Clock, CheckCircle2, ChevronDown,
  Film, Tv, Plus, Minus, Clapperboard
} from 'lucide-react';
import { imageUrl } from '../api/tmdb';
import { useMovieModal } from '../context/MovieModalContext';

const STATUS_CONFIG = {
  pending:  { label: 'To Watch',  icon: Clock,         color: '#aaa',    bg: 'rgba(170,170,170,0.12)' },
  watching: { label: 'Watching',  icon: Eye,           color: '#ffa502', bg: 'rgba(255,165,2,0.12)' },
  watched:  { label: 'Watched',   icon: CheckCircle2,  color: '#7bed9f', bg: 'rgba(123,237,159,0.12)' },
};

const STATUSES = ['pending', 'watching', 'watched'];

// ── Compact season/episode stepper shown on TV cards ───────────────────────────
const ProgressStepper = ({ entry, onProgress }) => {
  const [open, setOpen] = useState(false);
  const s = entry.progress?.season  ?? 1;
  const e = entry.progress?.episode ?? 1;

  const bump = (field, delta, ev) => {
    ev.stopPropagation();
    if (field === 'season')  onProgress(entry.id, s + delta, 1);
    if (field === 'episode') onProgress(entry.id, s, e + delta);
  };

  return (
    <div className="wl-progress-wrap">
      {/* Badge — click to open/close stepper */}
      <button
        className="wl-progress-badge"
        onClick={(ev) => { ev.stopPropagation(); setOpen(v => !v); }}
        title="Track episode progress"
      >
        <Clapperboard size={9} />
        <span>S{s} · E{e}</span>
      </button>

      {/* Stepper popover */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 4 }}
            transition={{ duration: 0.15 }}
            className="wl-progress-popover"
            onClick={ev => ev.stopPropagation()}
          >
            {/* Season row */}
            <div className="wl-progress-row">
              <span className="wl-progress-row-label">Season</span>
              <div className="wl-progress-controls">
                <button className="wl-progress-btn" onClick={ev => bump('season', -1, ev)} disabled={s <= 1}>
                  <Minus size={10} />
                </button>
                <span className="wl-progress-val">{s}</span>
                <button className="wl-progress-btn" onClick={ev => bump('season', +1, ev)}>
                  <Plus size={10} />
                </button>
              </div>
            </div>
            {/* Episode row */}
            <div className="wl-progress-row">
              <span className="wl-progress-row-label">Episode</span>
              <div className="wl-progress-controls">
                <button className="wl-progress-btn" onClick={ev => bump('episode', -1, ev)} disabled={e <= 1}>
                  <Minus size={10} />
                </button>
                <span className="wl-progress-val">{e}</span>
                <button className="wl-progress-btn" onClick={ev => bump('episode', +1, ev)}>
                  <Plus size={10} />
                </button>
              </div>
            </div>

            <div className="wl-progress-popover-label">click S/E to edit</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Main card ──────────────────────────────────────────────────────────────────
const WatchlistCard = ({ entry, tierColor, onRemove, onStatusChange, onMove, onProgress, tiers }) => {
  const [showMenu, setShowMenu]     = useState(false);
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [imgError, setImgError]     = useState(false);
  
  const { openModal } = useMovieModal();

  const status     = STATUS_CONFIG[entry.status] || STATUS_CONFIG.pending;
  const StatusIcon = status.icon;

  const cycleStatus = (ev) => {
    ev.stopPropagation();
    const idx  = STATUSES.indexOf(entry.status);
    const next = STATUSES[(idx + 1) % STATUSES.length];
    onStatusChange(entry.id, next);
  };

  const handleCardClick = () => {
    openModal(entry.id, entry.type || 'movie');
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="wl-card"
      style={{ '--tier-color': tierColor, cursor: 'pointer' }}
      onClick={handleCardClick}
    >
      {/* ── Poster ── */}
      <div className="wl-card-poster">
        {entry.poster && !imgError ? (
          <img
            src={imageUrl(entry.poster, 'w300')}
            alt={entry.title}
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="wl-card-no-poster">
            {entry.type === 'tv' ? <Tv size={24} /> : <Film size={24} />}
          </div>
        )}

        {/* Type badge */}
        <div className="wl-card-type-badge">
          {entry.type === 'tv' ? <Tv size={9} /> : <Film size={9} />}
          <span>{entry.type === 'tv' ? 'TV' : 'Movie'}</span>
        </div>

        {/* Hover overlay — cycle status */}
        <div className="wl-card-overlay">
          <motion.button
            className="wl-card-status-btn"
            style={{ background: status.bg, color: status.color }}
            onClick={cycleStatus}
            whileTap={{ scale: 0.9 }}
            title="Click to change status"
          >
            <StatusIcon size={14} />
            <span>{status.label}</span>
          </motion.button>
        </div>
      </div>

      {/* ── Info ── */}
      <div className="wl-card-info">
        <p className="wl-card-title" title={entry.title}>{entry.title}</p>
        <p className="wl-card-meta">
          {entry.year   && <span>{entry.year}</span>}
          {entry.rating && <span>⭐ {entry.rating}</span>}
        </p>

        {/* Status bar */}
        <div
          className="wl-card-status-bar"
          style={{ background: status.bg, color: status.color, borderColor: status.color + '44' }}
          onClick={cycleStatus}
          title="Click to change status"
        >
          <StatusIcon size={10} />
          <span>{status.label}</span>
        </div>

        {/* TV Progress stepper — only for TV shows */}
        {entry.type === 'tv' && (
          <ProgressStepper entry={entry} onProgress={onProgress} />
        )}
      </div>

      {/* ── Context menu (⌄) ── */}
      <div className="wl-card-actions-wrap">
        <button
          className="wl-card-menu-btn"
          onClick={(ev) => { ev.stopPropagation(); setShowMenu(v => !v); setShowMoveMenu(false); }}
        >
          <ChevronDown size={14} />
        </button>

        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -5 }}
              className="wl-card-menu"
              onMouseLeave={() => { setShowMenu(false); setShowMoveMenu(false); }}
            >
              {/* Status options */}
              {STATUSES.map(s => {
                const cfg   = STATUS_CONFIG[s];
                const SIcon = cfg.icon;
                return (
                  <button
                    key={s}
                    className={`wl-card-menu-item ${entry.status === s ? 'active' : ''}`}
                    style={entry.status === s ? { color: cfg.color } : {}}
                    onClick={(ev) => { ev.stopPropagation(); onStatusChange(entry.id, s); setShowMenu(false); }}
                  >
                    <SIcon size={13} />
                    <span>{cfg.label}</span>
                    {entry.status === s && <CheckCircle2 size={11} style={{ marginLeft: 'auto', opacity: 0.7 }} />}
                  </button>
                );
              })}

              <div className="wl-card-menu-divider" />

              {/* Move to tier */}
              <div className="wl-card-menu-submenu-wrap">
                <button
                  className="wl-card-menu-item"
                  onClick={(ev) => { ev.stopPropagation(); setShowMoveMenu(v => !v); }}
                >
                  <span>📦</span>
                  <span>Move to Tier</span>
                  <ChevronDown size={11} style={{ marginLeft: 'auto' }} />
                </button>
                <AnimatePresence>
                  {showMoveMenu && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="wl-card-submenu"
                    >
                      {tiers.filter(t => t.id !== entry.tierId).map(t => (
                        <button
                          key={t.id}
                          className="wl-card-menu-item"
                          style={{ color: t.color }}
                          onClick={(ev) => { ev.stopPropagation(); onMove(entry.id, t.id); setShowMenu(false); setShowMoveMenu(false); }}
                        >
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: t.color, display: 'inline-block', flexShrink: 0 }} />
                          <span>{t.name}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="wl-card-menu-divider" />

              {/* Remove */}
              <button
                className="wl-card-menu-item danger"
                onClick={(ev) => { ev.stopPropagation(); onRemove(entry.id); setShowMenu(false); }}
              >
                <Trash2 size={13} />
                <span>Remove</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default WatchlistCard;
