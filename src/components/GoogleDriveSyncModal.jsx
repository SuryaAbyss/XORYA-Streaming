import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cloud, CloudOff, RefreshCw, Download, Check, X, Shield, Key, ExternalLink } from 'lucide-react';

const GoogleDriveSyncModal = ({
    isOpen,
    onClose,
    driveState,
    onConnect,
    onDisconnect,
    onSyncNow,
    onRestore,
    clientId,
    onSaveClientId
}) => {
    const [customIdInput, setCustomIdInput] = useState(clientId || '');
    const [showKeyInput, setShowKeyInput] = useState(false);

    useEffect(() => {
        setCustomIdInput(clientId || '');
    }, [clientId]);

    if (!isOpen) return null;

    const formatLastSync = (timestamp) => {
        if (!timestamp) return 'Never';
        const diff = Math.floor((Date.now() - timestamp) / 1000);
        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
        return new Date(timestamp).toLocaleDateString();
    };

    return (
        <AnimatePresence>
            <div style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem',
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)'
            }}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                        width: '100%',
                        maxWidth: '480px',
                        background: 'linear-gradient(135deg, rgba(20, 20, 28, 0.95) 0%, rgba(10, 10, 15, 0.98) 100%)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '24px',
                        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(0, 188, 212, 0.15)',
                        padding: '1.8rem',
                        color: 'white',
                        position: 'relative',
                        boxSizing: 'border-box'
                    }}
                >
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            top: '1.2rem',
                            right: '1.2rem',
                            background: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'rgba(255, 255, 255, 0.7)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <X size={16} />
                    </button>

                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.4rem' }}>
                        <div style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '14px',
                            background: 'linear-gradient(135deg, rgba(66, 133, 244, 0.2) 0%, rgba(52, 168, 83, 0.2) 100%)',
                            border: '1px solid rgba(66, 133, 244, 0.35)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#4285F4'
                        }}>
                            <Cloud size={24} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0, letterSpacing: '-0.3px' }}>
                                Google Drive Cloud Sync
                            </h2>
                            <p style={{ fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.6)', margin: '2px 0 0' }}>
                                Auto-backup Watchlist & Watch Progress to Google Drive
                            </p>
                        </div>
                    </div>

                    {/* Status & Connected User Card */}
                    {driveState.isConnected ? (
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '16px',
                            padding: '1.2rem',
                            marginBottom: '1.4rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                                    {driveState.userProfile?.picture ? (
                                        <img
                                            src={driveState.userProfile.picture}
                                            alt={driveState.userProfile.name}
                                            style={{ width: '36px', height: '36px', borderRadius: '50%' }}
                                        />
                                    ) : (
                                        <div style={{
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: '50%',
                                            background: '#4285F4',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: '700'
                                        }}>
                                            {driveState.userProfile?.name?.charAt(0) || 'G'}
                                        </div>
                                    )}
                                    <div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>
                                            {driveState.userProfile?.name || 'Connected Google Account'}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                                            {driveState.userProfile?.email || 'Auto-Sync Active'}
                                        </div>
                                    </div>
                                </div>
                                <span style={{
                                    fontSize: '0.7rem',
                                    fontWeight: '700',
                                    padding: '3px 10px',
                                    borderRadius: '20px',
                                    background: 'rgba(52, 168, 83, 0.15)',
                                    color: '#34A853',
                                    border: '1px solid rgba(52, 168, 83, 0.3)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}>
                                    <Check size={12} /> Connected
                                </span>
                            </div>

                            <div style={{
                                fontSize: '0.78rem',
                                color: 'rgba(255, 255, 255, 0.6)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                                paddingTop: '0.6rem'
                            }}>
                                <span>Last Synced:</span>
                                <span style={{ color: 'white', fontWeight: '600' }}>
                                    {driveState.isSyncing ? 'Syncing now...' : formatLastSync(driveState.lastSyncedAt)}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '16px',
                            padding: '1.2rem',
                            marginBottom: '1.4rem',
                            textAlign: 'center'
                        }}>
                            <CloudOff size={32} color="rgba(255, 255, 255, 0.3)" style={{ marginBottom: '0.5rem' }} />
                            <div style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.3rem' }}>
                                Not Connected to Google Drive
                            </div>
                            <p style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.55)', margin: 0 }}>
                                Connect to store a private backup in your Google Drive. Never lose your watch progress even if browser history is wiped.
                            </p>
                        </div>
                    )}

                    {/* Error Banner */}
                    {driveState.error && (
                        <div style={{
                            background: 'rgba(239, 68, 68, 0.12)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '12px',
                            padding: '0.75rem 1rem',
                            fontSize: '0.78rem',
                            color: '#f87171',
                            marginBottom: '1.2rem'
                        }}>
                            ⚠️ {driveState.error}
                        </div>
                    )}

                    {/* Client ID Configuration Collapsible */}
                    <div style={{ marginBottom: '1.4rem' }}>
                        <button
                            onClick={() => setShowKeyInput(!showKeyInput)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'rgba(255, 255, 255, 0.5)',
                                fontSize: '0.78rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                padding: 0,
                                marginBottom: showKeyInput ? '0.6rem' : 0
                            }}
                        >
                            <Key size={13} />
                            <span>{showKeyInput ? 'Hide Google OAuth Settings' : 'Configure Google Client ID'}</span>
                        </button>

                        {showKeyInput && (
                            <div style={{
                                background: 'rgba(0, 0, 0, 0.3)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '12px',
                                padding: '0.8rem'
                            }}>
                                <label style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.7)', display: 'block', marginBottom: '0.4rem' }}>
                                    Google OAuth Client ID
                                </label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        type="text"
                                        value={customIdInput}
                                        onChange={(e) => setCustomIdInput(e.target.value)}
                                        placeholder="Paste apps.googleusercontent.com Client ID"
                                        style={{
                                            flex: 1,
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            border: '1px solid rgba(255, 255, 255, 0.12)',
                                            borderRadius: '8px',
                                            padding: '0.5rem 0.75rem',
                                            color: 'white',
                                            fontSize: '0.78rem',
                                            outline: 'none'
                                        }}
                                    />
                                    <button
                                        onClick={() => onSaveClientId(customIdInput)}
                                        style={{
                                            background: 'rgba(0, 188, 212, 0.2)',
                                            border: '1px solid rgba(0, 188, 212, 0.4)',
                                            borderRadius: '8px',
                                            color: '#00bcd4',
                                            padding: '0.5rem 0.9rem',
                                            fontSize: '0.78rem',
                                            fontWeight: '600',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                        {driveState.isConnected ? (
                            <>
                                <div style={{ display: 'flex', gap: '0.65rem' }}>
                                    <button
                                        onClick={onSyncNow}
                                        disabled={driveState.isSyncing}
                                        style={{
                                            flex: 1,
                                            background: 'linear-gradient(135deg, #00bcd4 0%, #00acc1 100%)',
                                            border: 'none',
                                            borderRadius: '14px',
                                            padding: '0.75rem',
                                            color: 'white',
                                            fontSize: '0.85rem',
                                            fontWeight: '600',
                                            cursor: driveState.isSyncing ? 'not-allowed' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem',
                                            opacity: driveState.isSyncing ? 0.7 : 1,
                                            boxShadow: '0 4px 15px rgba(0, 188, 212, 0.3)'
                                        }}
                                    >
                                        <RefreshCw size={15} className={driveState.isSyncing ? 'spin' : ''} />
                                        <span>{driveState.isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                                    </button>

                                    <button
                                        onClick={onRestore}
                                        disabled={driveState.isSyncing}
                                        style={{
                                            flex: 1,
                                            background: 'rgba(255, 255, 255, 0.06)',
                                            border: '1px solid rgba(255, 255, 255, 0.15)',
                                            borderRadius: '14px',
                                            padding: '0.75rem',
                                            color: 'white',
                                            fontSize: '0.85rem',
                                            fontWeight: '600',
                                            cursor: driveState.isSyncing ? 'not-allowed' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem'
                                        }}
                                    >
                                        <Download size={15} />
                                        <span>Restore Backup</span>
                                    </button>
                                </div>

                                <button
                                    onClick={onDisconnect}
                                    style={{
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        border: '1px solid rgba(239, 68, 68, 0.25)',
                                        borderRadius: '14px',
                                        padding: '0.65rem',
                                        color: '#ef4444',
                                        fontSize: '0.82rem',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.4rem',
                                        marginTop: '0.2rem'
                                    }}
                                >
                                    Disconnect Google Drive
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={onConnect}
                                disabled={driveState.isSyncing}
                                style={{
                                    background: 'linear-gradient(135deg, #4285F4 0%, #34A853 100%)',
                                    border: 'none',
                                    borderRadius: '14px',
                                    padding: '0.85rem',
                                    color: 'white',
                                    fontSize: '0.9rem',
                                    fontWeight: '700',
                                    cursor: driveState.isSyncing ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.6rem',
                                    boxShadow: '0 8px 25px rgba(66, 133, 244, 0.35)'
                                }}
                            >
                                <Cloud size={18} />
                                <span>{driveState.isSyncing ? 'Connecting...' : 'Connect Google Drive'}</span>
                            </button>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default GoogleDriveSyncModal;
