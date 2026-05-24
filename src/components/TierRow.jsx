import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Check, X, ChevronUp, ChevronDown } from 'lucide-react';
import WatchlistCard from './WatchlistCard';
import WatchlistSearchModal from './WatchlistSearchModal';
import { ExpandingCards } from './ui/expanding-cards';
import { HoverBorderGradient } from './ui/hover-border-gradient';
import { imageUrl } from '../api/tmdb';
import { Film, Tv, Play, Info, Star } from 'lucide-react';
import { useMovieModal } from '../context/MovieModalContext';

const PRESET_COLORS = [
  '#ff4757', '#ff6b81', '#ffa502', '#eccc68',
  '#7bed9f', '#2ed573', '#70a1ff', '#1e90ff',
  '#a29bfe', '#fd79a8', '#fdcb6e', '#00cec9',
];

const TierRow = ({
  tier,
  entries,
  allTiers,
  onRename,
  onRecolor,
  onDelete,
  onAddEntry,
  onRemoveEntry,
  onStatusChange,
  onMoveEntry,
  onProgress,
  allEntryIds,
  index,
  totalTiers,
  onMoveUp,
  onMoveDown,
}) => {
  const { openModal } = useMovieModal();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(tier.name);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const inputRef = useRef(null);

  const handleRename = () => {
    if (editName.trim()) onRename(tier.id, editName.trim());
    setIsEditing(false);
  };

  const watched = entries.filter(e => e.status === 'watched').length;
  const pct = entries.length > 0 ? Math.round((watched / entries.length) * 100) : 0;
  const visibleEntries = entries
    .filter(e => e.status !== 'watched')
    .sort((a, b) => (b.updatedAt || b.addedAt) - (a.updatedAt || a.addedAt));

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="wl-tier-row"
        style={{ '--tier-color': tier.color }}
      >
        {/* ── Tier Header ── */}
        <div className="wl-tier-header">
          {/* Left: color swatch + name */}
          <div className="wl-tier-header-left">
            {/* Color picker toggle */}
            <div className="wl-tier-color-wrap">
              <button
                className="wl-tier-color-dot"
                style={{ background: tier.color, boxShadow: `0 0 12px ${tier.color}66` }}
                onClick={() => setShowColorPicker(v => !v)}
                title="Change color"
              />
              <AnimatePresence>
                {showColorPicker && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    className="wl-color-picker"
                    onMouseLeave={() => setShowColorPicker(false)}
                  >
                    {PRESET_COLORS.map(c => (
                      <button
                        key={c}
                        className={`wl-color-swatch ${c === tier.color ? 'selected' : ''}`}
                        style={{ background: c }}
                        onClick={() => { onRecolor(tier.id, c); setShowColorPicker(false); }}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Name */}
            {isEditing ? (
              <div className="wl-tier-name-edit">
                <input
                  ref={inputRef}
                  className="wl-tier-name-input"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleRename();
                    if (e.key === 'Escape') { setIsEditing(false); setEditName(tier.name); }
                  }}
                  autoFocus
                />
                <button className="wl-tier-icon-btn confirm" onClick={handleRename}><Check size={14} /></button>
                <button className="wl-tier-icon-btn cancel" onClick={() => { setIsEditing(false); setEditName(tier.name); }}><X size={14} /></button>
              </div>
            ) : (
              <HoverBorderGradient>
                <div className="wl-tier-name-display">
                  <h3 className="wl-tier-name" style={{ margin: 0 }}>{tier.name}</h3>
                  <button className="wl-tier-icon-btn edit" onClick={() => { setIsEditing(true); }} title="Rename"><Pencil size={13} /></button>
                </div>
              </HoverBorderGradient>
            )}

            {/* Count badge */}
            <div className="wl-tier-count-badge">
              <span>{entries.length}</span>
            </div>
          </div>

          {/* Right: progress + actions */}
          <div className="wl-tier-header-right">
            {/* Progress */}
            {entries.length > 0 && (
              <div className="wl-tier-progress-wrap">
                <div className="wl-tier-progress-bar">
                  <motion.div
                    className="wl-tier-progress-fill"
                    style={{ background: tier.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
                <span className="wl-tier-progress-label" style={{ color: tier.color }}>{pct}%</span>
              </div>
            )}

            {/* Action buttons */}
            <div className="wl-tier-actions">
              {/* Reorder */}
              {index > 0 && (
                <button className="wl-tier-icon-btn" onClick={() => onMoveUp(index)} title="Move up">
                  <ChevronUp size={14} />
                </button>
              )}
              {index < totalTiers - 1 && (
                <button className="wl-tier-icon-btn" onClick={() => onMoveDown(index)} title="Move down">
                  <ChevronDown size={14} />
                </button>
              )}

              {/* Add movie */}
              <button
                className="wl-tier-add-btn"
                style={{ background: tier.color + '22', color: tier.color, borderColor: tier.color + '55' }}
                onClick={() => setShowSearch(true)}
              >
                <Plus size={14} />
                <span>Add</span>
              </button>

              {/* Delete tier */}
              <button
                className="wl-tier-icon-btn danger"
                onClick={() => {
                  if (entries.length === 0 || window.confirm(`Delete "${tier.name}" and all ${entries.length} item(s) in it?`))
                    onDelete(tier.id);
                }}
                title="Delete tier"
              >
                <Trash2 size={14} />
              </button>

              {/* Collapse */}
              <button
                className="wl-tier-icon-btn"
                onClick={() => setCollapsed(v => !v)}
                title={collapsed ? 'Expand' : 'Collapse'}
              >
                {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Cards grid ── */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ overflow: 'hidden' }}
            >
              {entries.length === 0 ? (
                <motion.div
                  className="wl-tier-empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => setShowSearch(true)}
                >
                  <p>This tier is empty</p>
                  <span className="wl-tier-empty-hint">Click <strong>Add</strong> to add movies or series</span>
                </motion.div>
              ) : visibleEntries.length === 0 ? (
                <div className="wl-tier-cards-new">
                  <motion.div
                    className="wl-tier-empty"
                    style={{ flex: 1, margin: 0, minHeight: '120px' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <p style={{ color: tier.color }}>All caught up! 🎉</p>
                    <span className="wl-tier-empty-hint">You have watched everything in this tier.</span>
                  </motion.div>
                  <div className="wl-tier-add-row">
                    <motion.button
                      className="wl-btn-add-compact"
                      style={{
                        '--tier-color': tier.color,
                        borderColor: tier.color + '33'
                      }}
                      onClick={() => setShowSearch(true)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      title={`Add titles to ${tier.name}`}
                    >
                      <Plus size={14} />
                    </motion.button>
                  </div>
                </div>
              ) : (
                <div className="wl-tier-cards-new">
                  {/* Expanding Cards Layout */}
                  <ExpandingCards
                    defaultActiveIndex={0}
                    items={visibleEntries.map(entry => ({
                      id: entry.id,
                      title: entry.title,
                      description: `${entry.year || 'N/A'} • ⭐ ${entry.rating || '0.0'} • ${entry.type === 'tv' ? 'Series' : 'Movie'}`,
                      imgSrc: imageUrl(entry.poster, 'w500'),
                      backdropSrc: entry.backdrop ? imageUrl(entry.backdrop, 'w1280') : imageUrl(entry.poster, 'w780'),
                      status: entry.status,
                      progress: entry.type === 'tv' ? (entry.progress || { season: 1, episode: 1 }) : null,
                      icon: entry.type === 'tv' ? <Tv size={16} /> : <Film size={16} />,
                      onViewDetails: () => openModal(entry.tmdbId, entry.type),
                      onStatusChange: (status) => onStatusChange(entry.id, status),
                      onProgressChange: (s, e) => onProgress(entry.id, s, e),
                      onDelete: () => onRemoveEntry(entry.id)
                    }))}
                    className="mb-4"
                  />

                  {/* Add more button at end of row */}
                  <div className="wl-tier-add-row">
                    <motion.button
                      className="wl-btn-add-compact"
                      style={{
                        '--tier-color': tier.color,
                        borderColor: tier.color + '33'
                      }}
                      onClick={() => setShowSearch(true)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      title={`Add titles to ${tier.name}`}
                    >
                      <Plus size={14} />
                    </motion.button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Search modal */}
      <WatchlistSearchModal
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        tierId={tier.id}
        tierName={tier.name}
        tierColor={tier.color}
        onAdd={onAddEntry}
        existingIds={allEntryIds}
      />
    </>
  );
};

export default TierRow;
