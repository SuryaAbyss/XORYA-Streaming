import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { signInAnonymously, onAuthStateChanged, GoogleAuthProvider, linkWithPopup, signInWithPopup } from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

const STORAGE_KEY = 'xorya_watchlist';
const FIREBASE_LAST_SYNC_KEY = 'xorya_firebase_last_synced';
const CUSTOM_SYNC_UID_KEY = 'xorya_custom_sync_uid';

const DEFAULT_TIERS = [
  { id: 'tier_must', name: 'Watching', color: '#ff4757', order: 0 },
  { id: 'tier_good', name: 'Must Watch', color: '#ffa502', order: 1 },
  { id: 'tier_maybe', name: 'Maybe Later', color: '#7bed9f', order: 2 },
  { id: 'tier_watched', name: 'Watched', color: '#10b981', order: 3 },
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

function normalizeTiers(rawTiers) {
  let list = Array.isArray(rawTiers) && rawTiers.length > 0 ? rawTiers : DEFAULT_TIERS;
  list = list.map(t => {
    if (t.id === 'tier_must' && t.name === 'Must Watch') return { ...t, name: 'Watching' };
    if (t.id === 'tier_good' && t.name === 'Looks Good') return { ...t, name: 'Must Watch' };
    return t;
  });
  list = list.map(t => ({
    ...t,
    name: t.name.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim()
  }));
  
  // Ensure "Watched" tier is present so marked items have a dedicated home
  const hasWatched = list.some(t => t.name.toLowerCase().includes('watched') || t.id === 'tier_watched');
  if (!hasWatched) {
    list.push({ id: 'tier_watched', name: 'Watched', color: '#10b981', order: list.length });
  }
  return list;
}

function normalizeEntries(rawEntries) {
  if (!Array.isArray(rawEntries)) return [];
  return rawEntries.map(e => {
    if (!e) return null;
    return {
      ...e,
      id: e.id || `entry_${e.tmdbId || Date.now()}_${Math.random().toString(36).slice(2)}`,
      tmdbId: String(e.tmdbId || e.id || ''),
    };
  }).filter(Boolean);
}

const WatchlistContext = createContext(null);

export function WatchlistProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [activeUid, setActiveUid] = useState(() => localStorage.getItem(CUSTOM_SYNC_UID_KEY) || null);
  
  const [lastSyncedAt, setLastSyncedAt] = useState(() => {
    const raw = localStorage.getItem(FIREBASE_LAST_SYNC_KEY);
    return raw ? parseInt(raw) : null;
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [cloudError, setCloudError] = useState(null);

  const [tiers, setTiers] = useState(() => {
    const saved = loadFromStorage();
    return normalizeTiers(saved?.tiers);
  });

  const [entries, setEntries] = useState(() => {
    const saved = loadFromStorage();
    return normalizeEntries(saved?.entries);
  });

  useEffect(() => {
    saveToStorage({ tiers, entries });
  }, [tiers, entries]);

  // ─── Firebase Auth ───────────────────────────────────────────────────────────
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setFirebaseUser(user);
        if (!localStorage.getItem(CUSTOM_SYNC_UID_KEY)) {
          setActiveUid(user.uid);
        }
      } else {
        signInAnonymously(auth).catch(err => {
          console.error("Anonymous sign in failed:", err);
          setCloudError(err.message);
        });
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // ─── Firebase Real-time Listener ──────────────────────────────────────────────
  const lastLocalUpdate = useRef(Date.now());
  const isInitialLoad = useRef(true);

  useEffect(() => {
    if (!activeUid) return;

    const unsubscribeDb = onSnapshot(doc(db, 'watchlists', activeUid), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const remoteUpdated = data.updatedAt || 0;

        if (isInitialLoad.current) {
          if (data.tiers && data.tiers.length > 0) {
            setTiers(normalizeTiers(data.tiers));
          }
          if (data.entries) {
            setEntries(prev => {
              const remoteEntries = normalizeEntries(data.entries);
              const mergedMap = new Map();
              
              remoteEntries.forEach(entry => {
                if (entry && (entry.id || entry.tmdbId)) {
                  mergedMap.set(String(entry.tmdbId || entry.id), entry);
                }
              });

              prev.forEach(entry => {
                const key = String(entry.tmdbId || entry.id);
                const existing = mergedMap.get(key);
                if (!existing || (entry.updatedAt || 0) >= (existing.updatedAt || 0)) {
                  mergedMap.set(key, entry);
                }
              });

              return Array.from(mergedMap.values());
            });
          }
          const now = remoteUpdated || Date.now();
          setLastSyncedAt(now);
          localStorage.setItem(FIREBASE_LAST_SYNC_KEY, now.toString());
        } else if (remoteUpdated > lastLocalUpdate.current) {
          if (data.tiers) setTiers(normalizeTiers(data.tiers));
          if (data.entries) setEntries(normalizeEntries(data.entries));
          setLastSyncedAt(remoteUpdated);
          localStorage.setItem(FIREBASE_LAST_SYNC_KEY, remoteUpdated.toString());
        }
      }
      isInitialLoad.current = false;
    }, (error) => {
      console.error('Firebase listen error:', error);
      setCloudError(error.message);
    });

    return () => unsubscribeDb();
  }, [activeUid]);

  // ─── Firebase Auto-Sync (Debounced Write) ───────────────────────────────────
  const syncTimeoutRef = useRef(null);
  
  useEffect(() => {
    if (!activeUid || isInitialLoad.current) return;
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

    syncTimeoutRef.current = setTimeout(async () => {
      try {
        setIsSyncing(true);
        setCloudError(null);
        const now = Date.now();
        lastLocalUpdate.current = Math.max(lastLocalUpdate.current, now);
        
        await setDoc(doc(db, 'watchlists', activeUid), { 
          tiers, entries, updatedAt: now 
        }, { merge: true });

        setLastSyncedAt(now);
        localStorage.setItem(FIREBASE_LAST_SYNC_KEY, now.toString());
      } catch (err) {
        console.warn('Firebase Auto Sync warning:', err);
        setCloudError(err.message || 'Auto sync failed');
      } finally {
        setIsSyncing(false);
      }
    }, 1500);

    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [tiers, entries, activeUid]);

  // ─── Cloud Linking Methods ──────────────────────────────────────────────────
  const clearCloudError = useCallback(() => {
    setCloudError(null);
  }, []);

  const linkWithGoogle = useCallback(async () => {
    if (!firebaseUser) return false;
    try {
      setIsSyncing(true);
      setCloudError(null);
      const provider = new GoogleAuthProvider();
      if (firebaseUser.isAnonymous) {
        await linkWithPopup(firebaseUser, provider);
      } else {
        await signInWithPopup(auth, provider);
      }
      return true;
    } catch (err) {
      console.error("Google link failed:", err);
      if (err.code === 'auth/unauthorized-domain' || err.message?.includes('unauthorized-domain')) {
        const domain = typeof window !== 'undefined' ? window.location.hostname : 'current domain';
        setCloudError(`Domain '${domain}' is not authorized. Add '${domain}' in Firebase Console > Authentication > Settings > Authorized domains.`);
      } else if (err.code === 'auth/popup-closed-by-user') {
        setCloudError("Sign-in popup closed before completing.");
      } else if (err.code === 'auth/credential-already-in-use') {
        try {
          const provider = new GoogleAuthProvider();
          const result = await signInWithPopup(auth, provider);
          if (result.user) {
            setCloudError(null);
            return true;
          }
        } catch {
          setCloudError("This Google account is already linked to another session.");
        }
      } else {
        setCloudError(err.message || "Failed to link Google account.");
      }
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [firebaseUser]);

  const generateSyncCode = useCallback(async () => {
    if (!activeUid) return null;
    try {
      setCloudError(null);
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      await setDoc(doc(db, 'sync_codes', code), { 
        targetUid: activeUid,
        createdAt: Date.now() 
      });
      return code;
    } catch (err) {
      console.error("Sync code generation failed:", err);
      setCloudError(err.message || "Could not generate sync code");
      return null;
    }
  }, [activeUid]);

  const useSyncCode = useCallback(async (code) => {
    try {
      setIsSyncing(true);
      setCloudError(null);
      const codeDoc = await getDoc(doc(db, 'sync_codes', code.trim()));
      if (codeDoc.exists()) {
        const targetUid = codeDoc.data().targetUid;
        localStorage.setItem(CUSTOM_SYNC_UID_KEY, targetUid);
        setActiveUid(targetUid);
        return true;
      } else {
        setCloudError("Invalid or expired Sync Code");
        return false;
      }
    } catch (err) {
      console.error("Sync code use failed:", err);
      setCloudError(err.message);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const connectGoogleDrive = useCallback(async () => { return true; }, []);
  const disconnectGoogleDrive = useCallback(() => { }, []);
  const saveCustomClientId = useCallback(() => {}, []);
  const syncNowWithDrive = useCallback(async () => { return true; }, []);
  const restoreFromDrive = useCallback(async () => { return true; }, []);

  // ─── Tier CRUD ───────────────────────────────────────────────────────────────
  const addTier = useCallback((name, color) => {
    lastLocalUpdate.current = Date.now();
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
    lastLocalUpdate.current = Date.now();
    setTiers(prev => prev.map(t => t.id === tierId ? { ...t, name: newName } : t));
  }, []);

  const recolorTier = useCallback((tierId, newColor) => {
    lastLocalUpdate.current = Date.now();
    setTiers(prev => prev.map(t => t.id === tierId ? { ...t, color: newColor } : t));
  }, []);

  const deleteTier = useCallback((tierId) => {
    lastLocalUpdate.current = Date.now();
    setTiers(prev => prev.filter(t => t.id !== tierId));
    setEntries(prev => prev.filter(e => e.tierId !== tierId));
  }, []);

  const reorderTiers = useCallback((fromIndex, toIndex) => {
    lastLocalUpdate.current = Date.now();
    setTiers(prev => {
      const arr = [...prev];
      const [moved] = arr.splice(fromIndex, 1);
      arr.splice(toIndex, 0, moved);
      return arr.map((t, i) => ({ ...t, order: i }));
    });
  }, []);

  // ─── Entry CRUD ──────────────────────────────────────────────────────────────
  const addEntry = useCallback((tierId, media) => {
    lastLocalUpdate.current = Date.now();
    setEntries(prev => {
      const exists = prev.find(e => String(e.tmdbId) === String(media.tmdbId));
      if (exists) {
        return prev.map(e => String(e.tmdbId) === String(media.tmdbId) ? { ...e, tierId, updatedAt: Date.now() } : e);
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
    lastLocalUpdate.current = Date.now();
    setEntries(prev => prev.filter(e => e.id !== entryId && String(e.tmdbId) !== String(entryId)));
  }, []);

  const setStatus = useCallback((entryId, status) => {
    lastLocalUpdate.current = Date.now();
    setEntries(prev => prev.map(e => {
      if (e.id !== entryId && String(e.tmdbId) !== String(entryId)) return e;
      
      let targetTierId = e.tierId;
      // Intelligently move the title to the relevant tier if available
      if (status === 'watched') {
        const watchedTier = tiers.find(t => t.name.toLowerCase().includes('watched') || t.id === 'tier_watched');
        if (watchedTier) targetTierId = watchedTier.id;
      } else if (status === 'watching') {
        const watchingTier = tiers.find(t => t.name.toLowerCase().includes('watching') || t.id === 'tier_must');
        if (watchingTier) targetTierId = watchingTier.id;
      } else if (status === 'pending') {
        const mustWatchTier = tiers.find(t => t.name.toLowerCase().includes('must') || t.name.toLowerCase().includes('good') || t.id === 'tier_good');
        if (mustWatchTier) targetTierId = mustWatchTier.id;
      }
      
      return { ...e, status, tierId: targetTierId, updatedAt: Date.now() };
    }));
  }, [tiers]);

  const moveEntry = useCallback((entryId, toTierId) => {
    lastLocalUpdate.current = Date.now();
    setEntries(prev => prev.map(e => (e.id === entryId || String(e.tmdbId) === String(entryId)) ? { ...e, tierId: toTierId, updatedAt: Date.now() } : e));
  }, []);

  const setNote = useCallback((entryId, note) => {
    lastLocalUpdate.current = Date.now();
    setEntries(prev => prev.map(e => (e.id === entryId || String(e.tmdbId) === String(entryId)) ? { ...e, note, updatedAt: Date.now() } : e));
  }, []);

  const setProgress = useCallback((entryId, season, episode, percent) => {
    lastLocalUpdate.current = Date.now();
    setEntries(prev => prev.map(e => {
      if (e.id !== entryId && String(e.tmdbId) !== String(entryId)) return e;
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
        setTiers(normalizeTiers(parsed.tiers));
        setEntries(normalizeEntries(parsed.entries));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const clearAll = useCallback(() => {
    lastLocalUpdate.current = Date.now();
    setTiers(DEFAULT_TIERS);
    setEntries([]);
  }, []);

  const syncPlaybackWithWatchlist = useCallback((media) => {
    lastLocalUpdate.current = Date.now();
    setEntries(prev => {
      const idx = prev.findIndex(e => String(e.tmdbId) === String(media.tmdbId));
      
      // Target the "Watching" tier
      const watchingTier = tiers.find(t => t.name.toLowerCase().includes('watching') || t.id === 'tier_must') || tiers[0];

      if (idx !== -1) {
        return prev.map((e, i) => i === idx ? {
          ...e,
          status: 'watching',
          tierId: watchingTier ? watchingTier.id : e.tierId,
          updatedAt: Date.now(),
          lastServer: media.server || e.lastServer,
          progress: media.type === 'tv' && (media.season > 1 || media.episode > 1 || !e.progress)
            ? { season: media.season || 1, episode: media.episode || 1 }
            : e.progress
        } : e);
      }

      if (!watchingTier && tiers.length === 0) return prev;
      
      const newEntry = {
        id: `entry_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        tierId: watchingTier ? watchingTier.id : tiers[0].id,
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

  const value = {
    tiers,
    entries,
    stats,
    driveState: {
      isConnected: Boolean(activeUid),
      accessToken: firebaseUser ? firebaseUser.uid : null,
      userProfile: { 
        name: firebaseUser && !firebaseUser.isAnonymous ? firebaseUser.displayName : 'Anonymous Sync',
        email: firebaseUser && !firebaseUser.isAnonymous ? firebaseUser.email : 'Device-only sync'
      },
      lastSyncedAt,
      isSyncing,
      error: cloudError,
      clientId: 'firebase_cloud',
    },
    linkWithGoogle,
    generateSyncCode,
    useSyncCode,
    clearCloudError,
    connectGoogleDrive,
    disconnectGoogleDrive,
    syncNowWithDrive,
    restoreFromDrive,
    saveCustomClientId,
    addTier,
    renameTier,
    recolorTier,
    deleteTier,
    reorderTiers,
    addEntry,
    removeEntry,
    setStatus,
    moveEntry,
    setNote,
    setProgress,
    entriesForTier,
    getEntryByTmdbId,
    syncPlaybackWithWatchlist,
    exportData,
    importData,
    clearAll,
  };

  return (
    <WatchlistContext.Provider value={value}>
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist() {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error('useWatchlist must be used within a WatchlistProvider');
  }
  return context;
}
