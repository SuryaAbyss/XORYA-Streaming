import React, { useState, useRef } from 'react';
import { Plus, Pencil, Trash2, Check, X, ChevronUp, ChevronDown, Eye, EyeOff, ArrowUpDown, CheckCircle2 } from 'lucide-react';
import WatchlistCard from './WatchlistCard';
import WatchlistSearchModal from './WatchlistSearchModal';
import { ExpandingCards } from './ui/expanding-cards';
import { HoverBorderGradient } from './ui/hover-border-gradient';
import { imageUrl } from '../api/tmdb';
import { Film, Tv, Play, Info, Star } from 'lucide-react';
import { useMovieModal } from '../context/MovieModalContext';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';

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
  isSearching,
}) => {
  const { openModal } = useMovieModal();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(tier.name);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [showWatched, setShowWatched] = useState(false);
  const [sortBy, setSortBy] = useState('date'); // 'date' | 'rating' | 'year' | 'alphabetical'
  const [showSortMenu, setShowSortMenu] = useState(false);
  const inputRef = useRef(null);

  const rowRef = useRef(null);
  const colorPickerRef = useRef(null);

  // Mount animation for rows
  useGSAP(() => {
    gsap.fromTo(rowRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }
    );
  }, []);

  // Animating color picker dropdown on toggle
  useGSAP(() => {
    if (showColorPicker && colorPickerRef.current) {
      gsap.fromTo(colorPickerRef.current,
        { opacity: 0, scale: 0.85 },
        { opacity: 1, scale: 1, duration: 0.25, ease: "back.out(1.2)" }
      );
    }
  }, [showColorPicker]);

  const handleRename = () => {
    if (editName.trim()) onRename(tier.id, editName.trim());
    setIsEditing(false);
  };

  const watched = entries.filter(e => e.status === 'watched').length;
  const pct = entries.length > 0 ? Math.round((watched / entries.length) * 100) : 0;
  
  const visibleEntries = entries
    .filter(e => showWatched || e.status !== 'watched')
    .sort((a, b) => {
      if (sortBy === 'rating') {
        const rA = parseFloat(a.rating) || 0;
        const rB = parseFloat(b.rating) || 0;
        return rB - rA;
      }
      if (sortBy === 'year') {
        const yA = parseInt(a.year) || 0;
        const yB = parseInt(b.year) || 0;
        return yB - yA;
      }
      if (sortBy === 'alphabetical') {
        return (a.title || '').localeCompare(b.title || '');
      }
      const tA = a.updatedAt || a.addedAt || 0;
      const tB = b.updatedAt || b.addedAt || 0;
      return tB - tA;
    });

  return (
    <>
      <div
        ref={rowRef}
        className="wl-tier-row"
        style={{ '--tier-color': tier.color, opacity: 0 }}
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
              {showColorPicker && (
                <div
                  ref={colorPickerRef}
                  className="wl-color-picker"
                  onMouseLeave={() => setShowColorPicker(false)}
                  style={{ opacity: 0, transform: 'scale(0.85)' }}
                >
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c}
                      className={`wl-color-swatch ${c === tier.color ? 'selected' : ''}`}
                      style={{ background: c }}
                      onClick={() => { onRecolor(tier.id, c); setShowColorPicker(false); }}
                    />
                  ))}
                </div>
              )}
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
                  <div
                    className="wl-tier-progress-fill"
                    style={{
                      background: tier.color,
                      width: `${pct}%`,
                      transition: 'width 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                    }}
                  />
                </div>
                <span className="wl-tier-progress-label" style={{ color: tier.color }}>{pct}%</span>
              </div>
            )}

            {/* Action buttons */}
            <div className="wl-tier-actions">
              {/* Show/Hide Watched Toggle */}
              <button
                className={`wl-tier-icon-btn ${showWatched ? 'active' : ''}`}
                style={showWatched ? { color: '#7bed9f' } : {}}
                onClick={() => setShowWatched(v => !v)}
                title={showWatched ? 'Hide Watched' : 'Show Watched'}
              >
                {showWatched ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>

              {/* Sort Menu */}
              <div style={{ position: 'relative' }}>
                <button
                  className={`wl-tier-icon-btn ${sortBy !== 'date' ? 'active' : ''}`}
                  onClick={() => setShowSortMenu(v => !v)}
                  title={`Sort by: ${sortBy}`}
                >
                  <ArrowUpDown size={14} />
                </button>
                {showSortMenu && (
                  <div
                    className="wl-sort-menu"
                    onMouseLeave={() => setShowSortMenu(false)}
                    style={{ '--tier-color': tier.color }}
                  >
                    {[
                      { key: 'date', label: 'Date Added' },
                      { key: 'rating', label: 'Rating' },
                      { key: 'year', label: 'Year' },
                      { key: 'alphabetical', label: 'Name' },
                    ].map(opt => (
                      <button
                        key={opt.key}
                        className={`wl-sort-menu-item ${sortBy === opt.key ? 'active' : ''}`}
                        onClick={() => { setSortBy(opt.key); setShowSortMenu(false); }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

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
        <div
          style={{
            maxHeight: collapsed ? '0px' : '1500px',
            opacity: collapsed ? 0 : 1,
            overflow: 'hidden',
            transition: 'max-height 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.3s ease'
          }}
        >
          {entries.length === 0 ? (
            isSearching ? (
              <div className="wl-tier-empty">
                <p>No matching titles</p>
                <span className="wl-tier-empty-hint">Try searching for something else</span>
              </div>
            ) : (
              <div
                className="wl-tier-empty"
                onClick={() => setShowSearch(true)}
                style={{ cursor: 'pointer' }}
              >
                <p>This tier is empty</p>
                <span className="wl-tier-empty-hint">Click <strong>Add</strong> to add movies or series</span>
              </div>
            )
          ) : visibleEntries.length === 0 ? (
            <div className="wl-tier-cards-new">
              <div
                className="wl-tier-empty"
                style={{ flex: 1, margin: 0, minHeight: '120px' }}
              >
                <p style={{ color: tier.color }}>All caught up! 🎉</p>
                <span className="wl-tier-empty-hint">You have watched everything in this tier.</span>
              </div>
              <div className="wl-tier-add-row">
                <button
                  className="wl-btn-add-compact"
                  style={{
                    '--tier-color': tier.color,
                    borderColor: tier.color + '33',
                    transition: 'transform 0.2s'
                  }}
                  onClick={() => setShowSearch(true)}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  title={`Add titles to ${tier.name}`}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          ) : (
            <div className="wl-tier-cards-new">
              {/* Expanding Cards Layout */}
              <ExpandingCards
                tierColor={tier.color}
                defaultActiveIndex={0}
                items={visibleEntries.map(entry => ({
                  id: entry.id,
                  title: entry.title,
                  description: `${entry.year || 'N/A'} • ⭐ ${entry.rating || '0.0'} • ${entry.type === 'tv' ? 'Series' : 'Movie'}`,
                  imgSrc: imageUrl(entry.poster, 'w500'),
                  backdropSrc: entry.backdrop ? imageUrl(entry.backdrop, 'w1280') : imageUrl(entry.poster, 'w780'),
                  status: entry.status,
                  progress: entry.type === 'tv' ? (entry.progress || { season: 1, episode: 1 }) : (entry.progress && entry.progress.percent !== undefined ? entry.progress : null),
                  icon: entry.type === 'tv' ? <Tv size={16} /> : <Film size={16} />,
                  onViewDetails: () => openModal(entry.tmdbId, entry.type),
                  onStatusChange: (status) => onStatusChange(entry.id, status),
                  onProgressChange: (s, e, p) => onProgress(entry.id, s, e, p),
                  onDelete: () => onRemoveEntry(entry.id)
                }))}
                className="mb-4"
              />

              {/* Add more button at end of row */}
              <div className="wl-tier-add-row">
                <button
                  className="wl-btn-add-compact"
                  style={{
                    '--tier-color': tier.color,
                    borderColor: tier.color + '33',
                    transition: 'transform 0.2s'
                  }}
                  onClick={() => setShowSearch(true)}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  title={`Add titles to ${tier.name}`}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

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
