import { useState, useEffect, useCallback, useRef } from 'react';
import { requestGoogleToken, fetchUserInfo, downloadBackupFromDrive, uploadBackupToDrive } from '../services/googleDriveSync';

const STORAGE_KEY = 'xorya_watchlist';
const DRIVE_CLIENT_ID_KEY = 'xorya_google_client_id';
const DRIVE_TOKEN_KEY = 'xorya_google_access_token';
const DRIVE_USER_KEY = 'xorya_google_user_profile';
const DRIVE_LAST_SYNC_KEY = 'xorya_google_last_synced';

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
  const [clientId, setClientId] = useState(() => {
    return localStorage.getItem(DRIVE_CLIENT_ID_KEY) || import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  });

  const [accessToken, setAccessToken] = useState(() => {
    return sessionStorage.getItem(DRIVE_TOKEN_KEY) || localStorage.getItem(DRIVE_TOKEN_KEY) || '';
  });

  const [userProfile, setUserProfile] = useState(() => {
    try {
      const raw = localStorage.getItem(DRIVE_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  const [lastSyncedAt, setLastSyncedAt] = useState(() => {
    const raw = localStorage.getItem(DRIVE_LAST_SYNC_KEY);
    return raw ? parseInt(raw) : null;
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [cloudError, setCloudError] = useState(null);

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

  // Persist local storage on every change
  useEffect(() => {
    saveToStorage({ tiers, entries });
  }, [tiers, entries]);

  // Debounced Cloud Sync to Google Drive
  const syncTimeoutRef = useRef(null);
  useEffect(() => {
    if (!accessToken) return;

    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

    syncTimeoutRef.current = setTimeout(async () => {
      try {
        setIsSyncing(true);
        setCloudError(null);
        const result = await uploadBackupToDrive(accessToken, { tiers, entries });
        const now = result.timestamp || Date.now();
        setLastSyncedAt(now);
        localStorage.setItem(DRIVE_LAST_SYNC_KEY, now.toString());
      } catch (err) {
        console.warn('Auto Cloud Sync warning:', err);
        setCloudError(err.message || 'Auto sync failed');
      } finally {
        setIsSyncing(false);
      }
    }, 4000); // 4 second debounce

    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [tiers, entries, accessToken]);

  // ─── Google Drive OAuth Ops ──────────────────────────────────────────────────

  const saveCustomClientId = useCallback((newId) => {
    setClientId(newId);
    if (newId) {
      localStorage.setItem(DRIVE_CLIENT_ID_KEY, newId);
    } else {
      localStorage.removeItem(DRIVE_CLIENT_ID_KEY);
    }
  }, []);

  const connectGoogleDrive = useCallback(async () => {
    const activeClientId = clientId || import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!activeClientId) {
      setCloudError('Please enter a Google OAuth Client ID to connect.');
      return false;
    }

    try {
      setIsSyncing(true);
      setCloudError(null);
      const tokenResult = await requestGoogleToken(activeClientId);
      const token = tokenResult.accessToken;

      setAccessToken(token);
      localStorage.setItem(DRIVE_TOKEN_KEY, token);

      // Fetch user profile
      const profile = await fetchUserInfo(token);
      if (profile) {
        setUserProfile(profile);
        localStorage.setItem(DRIVE_USER_KEY, JSON.stringify(profile));
      }

      // Check if backup exists in Drive and restore if local storage is empty
      const backup = await downloadBackupFromDrive(token);
      if (backup?.data) {
        if (entries.length === 0 || (backup.data.updatedAt && backup.data.updatedAt > (lastSyncedAt || 0))) {
          if (backup.data.tiers) setTiers(backup.data.tiers);
          if (backup.data.entries) setEntries(backup.data.entries);
        }
      } else {
        // Upload initial backup
        await uploadBackupToDrive(token, { tiers, entries });
      }

      const now = Date.now();
      setLastSyncedAt(now);
      localStorage.setItem(DRIVE_LAST_SYNC_KEY, now.toString());
      return true;
    } catch (err) {
      console.error('Google Drive connection failed:', err);
      setCloudError(err.message || 'Failed to connect Google Drive');
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [clientId, entries.length, lastSyncedAt, tiers, entries]);

  const disconnectGoogleDrive = useCallback(() => {
    setAccessToken('');
    setUserProfile(null);
    setLastSyncedAt(null);
    setCloudError(null);
    localStorage.removeItem(DRIVE_TOKEN_KEY);
    localStorage.removeItem(DRIVE_USER_KEY);
    localStorage.removeItem(DRIVE_LAST_SYNC_KEY);
    sessionStorage.removeItem(DRIVE_TOKEN_KEY);
  }, []);

  const syncNowWithDrive = useCallback(async () => {
    if (!accessToken) return false;
    try {
      setIsSyncing(true);
      setCloudError(null);
      const result = await uploadBackupToDrive(accessToken, { tiers, entries });
      const now = result.timestamp || Date.now();
      setLastSyncedAt(now);
      localStorage.setItem(DRIVE_LAST_SYNC_KEY, now.toString());
      return true;
    } catch (err) {
      console.error('Manual sync failed:', err);
      setCloudError(err.message || 'Sync failed');
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [accessToken, tiers, entries]);

  const restoreFromDrive = useCallback(async () => {
    if (!accessToken) return false;
    try {
      setIsSyncing(true);
      setCloudError(null);
      const backup = await downloadBackupFromDrive(accessToken);
      if (backup?.data) {
        if (backup.data.tiers) setTiers(backup.data.tiers);
        if (backup.data.entries) setEntries(backup.data.entries);
        setLastSyncedAt(backup.data.updatedAt || Date.now());
        return true;
      } else {
        setCloudError('No backup file found in your Google Drive.');
        return false;
      }
    } catch (err) {
      console.error('Restore failed:', err);
      setCloudError(err.message || 'Restore failed');
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [accessToken]);

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
    setEntries(prev => {
      const exists = prev.find(e => String(e.tmdbId) === String(media.tmdbId));
      if (exists) {
        return prev.map(e => String(e.tmdbId) === String(media.tmdbId) ? { ...e, tierId } : e);
      }
      return [...prev, {
        id: `entry_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        tierId,
        tmdbId: String(media.tmdbId),
        type: media.type,
        title: media.title,
        poster: media.poster,
        backdrop: media.backdrop,
        year: media.year,
        rating: media.rating,
        status: 'pending',
        addedAt: Date.now(),
        updatedAt: Date.now(),
        note: '',
      }];
    });
  }, []);

  const removeEntry = useCallback((entryId) => {
    setEntries(prev => prev.filter(e => e.id !== entryId));
  }, []);

  const setStatus = useCallback((entryId, status) => {
    setEntries(prev => prev.map(e => e.id === entryId ? { ...e, status, updatedAt: Date.now() } : e));
  }, []);

  const moveEntry = useCallback((entryId, toTierId) => {
    setEntries(prev => prev.map(e => e.id === entryId ? { ...e, tierId: toTierId, updatedAt: Date.now() } : e));
  }, []);

  const setNote = useCallback((entryId, note) => {
    setEntries(prev => prev.map(e => e.id === entryId ? { ...e, note, updatedAt: Date.now() } : e));
  }, []);

  const setProgress = useCallback((entryId, season, episode, percent) => {
    setEntries(prev => prev.map(e => {
      if (e.id !== entryId) return e;
      const progressObj = percent !== undefined
        ? { percent: Math.max(0, Math.min(100, percent)) }
        : { season: Math.max(1, season), episode: Math.max(1, episode) };
      
      let status = e.status;
      if (status === 'pending') {
        if (percent !== undefined && percent > 0) {
          status = 'watching';
        } else if (season > 1 || episode > 1) {
          status = 'watching';
        }
      }
      if (percent === 100) {
        status = 'watched';
      }
      
      return { ...e, progress: progressObj, status, updatedAt: Date.now() };
    }));
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

  const syncPlaybackWithWatchlist = useCallback((media) => {
    setEntries(prev => {
      const idx = prev.findIndex(e => String(e.tmdbId) === String(media.tmdbId));
      
      if (idx !== -1) {
        return prev.map((e, i) => i === idx ? {
          ...e,
          status: 'watching',
          updatedAt: Date.now(),
          lastServer: media.server || e.lastServer,
          progress: media.type === 'tv' && (media.season > 1 || media.episode > 1 || !e.progress)
            ? { season: media.season || 1, episode: media.episode || 1 }
            : e.progress
        } : e);
      }

      if (tiers.length === 0) return prev;
      
      const newEntry = {
        id: `entry_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        tierId: tiers[0].id,
        tmdbId: media.tmdbId.toString(),
        type: media.type,
        title: media.title,
        poster: media.poster,
        backdrop: media.backdrop,
        year: media.year,
        rating: media.rating,
        status: 'watching',
        addedAt: Date.now(),
        updatedAt: Date.now(),
        lastServer: media.server,
        progress: media.type === 'tv' ? { season: media.season || 1, episode: media.episode || 1 } : undefined,
      };

      return [...prev, newEntry];
    });
  }, [tiers]);

  return {
    tiers,
    entries,
    stats,
    // Google Drive Sync State & Ops
    driveState: {
      isConnected: Boolean(accessToken),
      accessToken,
      userProfile,
      lastSyncedAt,
      isSyncing,
      error: cloudError,
      clientId,
    },
    connectGoogleDrive,
    disconnectGoogleDrive,
    syncNowWithDrive,
    restoreFromDrive,
    saveCustomClientId,
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

