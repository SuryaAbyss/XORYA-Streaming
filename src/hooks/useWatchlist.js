import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'xorya_watchlist';

const DEFAULT_TIERS = [
  { id: 'tier_must', name: 'Watching', color: '#ff4757', order: 0 },
  { id: 'tier_good',  name: 'Must Watch', color: '#ffa502', order: 1 },
  { id: 'tier_maybe', name: 'Maybe Later', color: '#7bed9f', order: 2 },
];

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveToStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* storage full or private mode */ }
}

export function useWatchlist() {
  const [tiers, setTiers] = useState(() => {
    const saved = loadFromStorage();
    let initialTiers = saved?.tiers ?? DEFAULT_TIERS;
    
    // Migrate old names
    initialTiers = initialTiers.map(t => {
      if (t.id === 'tier_must' && t.name === 'Must Watch') return { ...t, name: 'Watching' };
      if (t.id === 'tier_good' && t.name === 'Looks Good') return { ...t, name: 'Must Watch' };
      return t;
    });

    // Strip all emojis from existing tier names
    return initialTiers.map(t => ({
      ...t,
      name: t.name.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim()
    }));
  });

  const [entries, setEntries] = useState(() => {
    const saved = loadFromStorage();
    return saved?.entries ?? [];
  });

  // Persist on every change
  useEffect(() => {
    saveToStorage({ tiers, entries });
  }, [tiers, entries]);

  // ─── Tier CRUD ───────────────────────────────────────────────────────────────

  const addTier = useCallback((name, color) => {
    const newTier = {
      id: `tier_${Date.now()}`,
      name,
      color,
      order: Date.now(),
    };
    setTiers(prev => [...prev, newTier]);
    return newTier.id;
  }, []);

  const renameTier = useCallback((tierId, newName) => {
    setTiers(prev => prev.map(t => t.id === tierId ? { ...t, name: newName } : t));
  }, []);

  const recolorTier = useCallback((tierId, newColor) => {
    setTiers(prev => prev.map(t => t.id === tierId ? { ...t, color: newColor } : t));
  }, []);

  const deleteTier = useCallback((tierId) => {
    setTiers(prev => prev.filter(t => t.id !== tierId));
    // Also remove all entries in that tier
    setEntries(prev => prev.filter(e => e.tierId !== tierId));
  }, []);

  const reorderTiers = useCallback((fromIndex, toIndex) => {
    setTiers(prev => {
      const arr = [...prev];
      const [moved] = arr.splice(fromIndex, 1);
      arr.splice(toIndex, 0, moved);
      return arr.map((t, i) => ({ ...t, order: i }));
    });
  }, []);

  // ─── Entry CRUD ──────────────────────────────────────────────────────────────

  const addEntry = useCallback((tierId, media) => {
    // Prevent duplicates across all tiers
    setEntries(prev => {
      const exists = prev.find(e => String(e.tmdbId) === String(media.tmdbId));
      if (exists) {
        // Move to new tier instead
        return prev.map(e => String(e.tmdbId) === String(media.tmdbId) ? { ...e, tierId } : e);
      }
      return [...prev, {
        id: `entry_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        tierId,
        tmdbId: String(media.tmdbId),
        type: media.type,            // 'movie' | 'tv'
        title: media.title,
        poster: media.poster,
        backdrop: media.backdrop,
        year: media.year,
        rating: media.rating,
        status: 'pending',           // 'pending' | 'watching' | 'watched'
        addedAt: Date.now(),
        note: '',
      }];
    });
  }, []);

  const removeEntry = useCallback((entryId) => {
    setEntries(prev => prev.filter(e => e.id !== entryId));
  }, []);

  const setStatus = useCallback((entryId, status) => {
    setEntries(prev => prev.map(e => e.id === entryId ? { ...e, status } : e));
  }, []);

  const moveEntry = useCallback((entryId, toTierId) => {
    setEntries(prev => prev.map(e => e.id === entryId ? { ...e, tierId: toTierId } : e));
  }, []);

  const setNote = useCallback((entryId, note) => {
    setEntries(prev => prev.map(e => e.id === entryId ? { ...e, note } : e));
  }, []);

  // TV show episode progress  { season: 1, episode: 1 }
  const setProgress = useCallback((entryId, season, episode) => {
    setEntries(prev => prev.map(e =>
      e.id === entryId ? { ...e, progress: { season: Math.max(1, season), episode: Math.max(1, episode) } } : e
    ));
  }, []);

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  const entriesForTier = useCallback((tierId) =>
    entries.filter(e => e.tierId === tierId), [entries]);

  const stats = {
    total: entries.length,
    watched: entries.filter(e => e.status === 'watched').length,
    watching: entries.filter(e => e.status === 'watching').length,
    pending: entries.filter(e => e.status === 'pending').length,
  };

  const getEntryByTmdbId = useCallback((tmdbId) => {
    return entries.find(e => String(e.tmdbId) === String(tmdbId));
  }, [entries]);

  // ─── Export / Import ─────────────────────────────────────────────────────────

  const exportData = useCallback(() => {
    const data = JSON.stringify({ tiers, entries }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `xorya-watchlist-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [tiers, entries]);

  const importData = useCallback((jsonString) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.tiers && parsed.entries) {
        setTiers(parsed.tiers);
        setEntries(parsed.entries);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const clearAll = useCallback(() => {
    setTiers(DEFAULT_TIERS);
    setEntries([]);
  }, []);

  /**
   * Automatically updates or adds a title based on playback activity
   * media: { tmdbId, type, title, poster, backdrop, year, rating, season, episode }
   */
  const syncPlaybackWithWatchlist = useCallback((media) => {
    setEntries(prev => {
      const idx = prev.findIndex(e => String(e.tmdbId) === String(media.tmdbId));
      
      // If already exists, update status. Only update progress if explicitly specified and > 1, OR if it's the first time setting it.
      if (idx !== -1) {
        return prev.map((e, i) => i === idx ? {
          ...e,
          status: 'watching',
          progress: media.type === 'tv' && (media.season > 1 || media.episode > 1 || !e.progress)
            ? { season: media.season || 1, episode: media.episode || 1 }
            : e.progress
        } : e);
      }

      // If not exists, auto-add to the first tier
      if (tiers.length === 0) return prev; // Safety check
      
      const newEntry = {
        id: `entry_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        tierId: tiers[0].id, // Default to first tier
        tmdbId: media.tmdbId.toString(),
        type: media.type,
        title: media.title,
        poster: media.poster,
        backdrop: media.backdrop,
        year: media.year,
        rating: media.rating,
        status: 'watching',
        addedAt: Date.now(),
        progress: media.type === 'tv' ? { season: media.season || 1, episode: media.episode || 1 } : undefined,
      };

      return [...prev, newEntry];
    });
  }, [tiers]);

  return {
    tiers,
    entries,
    stats,
    // Tier ops
    addTier,
    renameTier,
    recolorTier,
    deleteTier,
    reorderTiers,
    // Entry ops
    addEntry,
    removeEntry,
    setStatus,
    moveEntry,
    setNote,
    setProgress,
    // Helpers
    entriesForTier,
    getEntryByTmdbId,
    // Playback sync
    syncPlaybackWithWatchlist,
    // Data ops
    exportData,
    importData,
    clearAll,
  };
}
