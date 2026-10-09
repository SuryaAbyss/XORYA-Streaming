import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Cloud, X, Shield, Key, Link as LinkIcon, Download, Copy, Check, 
    Smartphone, Laptop, RefreshCw, Sparkles, CheckCircle2, ArrowRight, ExternalLink
} from 'lucide-react';

const GoogleDriveSyncModal = ({
    isOpen,
    onClose,
    driveState,
    linkWithGoogle,
    generateSyncCode,
    useSyncCode,
    clearCloudError
}) => {
    const [codeInput, setCodeInput] = useState('');
    const [generatedCode, setGeneratedCode] = useState(null);
    const [isCopied, setIsCopied] = useState(false);
    const [localError, setLocalError] = useState('');

    React.useEffect(() => {
        if (isOpen) {
            setLocalError('');
            if (clearCloudError) clearCloudError();
        }
    }, [isOpen, clearCloudError]);

    const handleGoogleLink = async () => {
        setLocalError('');
        if (clearCloudError) clearCloudError();
        const success = await linkWithGoogle();
        if (success) {
            onClose();
        }
    };

    const handleGenerate = async () => {
        setLocalError('');
        if (clearCloudError) clearCloudError();
        const code = await generateSyncCode();
        if (code) {
            setGeneratedCode(code);
        } else {
            setLocalError('Failed to generate sync code.');
        }
    };

    const handleUseCode = async () => {
        if (!codeInput || codeInput.length !== 6) {
            setLocalError('Please enter a valid 6-digit sync code.');
            return;
        }
        setLocalError('');
        if (clearCloudError) clearCloudError();
        const success = await useSyncCode(codeInput);
        if (success) {
            onClose();
        } else {
            setLocalError('Invalid or expired Sync Code.');
        }
    };

    const copyCode = () => {
        if (!generatedCode) return;
        navigator.clipboard.writeText(generatedCode);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const isGoogleUser = driveState?.userProfile?.email && driveState?.userProfile?.email !== 'Device-only sync';

    if (typeof document === 'undefined') return null;

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <div 
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 999999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1.25rem',
                        backgroundColor: 'rgba(4, 6, 12, 0.85)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)'
                    }}
                    onClick={(e) => e.target === e.currentTarget && onClose()}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 15 }}
                        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                        className="sync-modal-container"
                        style={{
                            width: '100%',
                            maxWidth: '960px',
                            minHeight: '520px',
                            maxHeight: '90vh',
                            background: '#091321',
                            border: '1px solid rgba(139, 92, 246, 0.3)',
                            borderRadius: '24px',
                            boxShadow: '0 24px 80px rgba(0, 0, 0, 0.7), 0 0 50px rgba(139, 92, 246, 0.15)',
                            overflow: 'hidden',
                            display: 'grid',
                            gridTemplateColumns: '42% 58%',
                            position: 'relative',
                            color: '#F8FAFC'
                        }}
                    >
                        {/* Close Button */}
                        <button 
                            onClick={onClose} 
                        style={{
                            position: 'absolute',
                            top: '1.2rem',
                            right: '1.2rem',
                            zIndex: 20,
                            background: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            borderRadius: '50%',
                            width: '34px',
                            height: '34px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#9CA3B8',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = '#9CA3B8'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                    >
                        <X size={17} />
                    </button>

                    {/* ═══════════════════════════════════════════════════════════════
                        LEFT PANEL: Cinematic Purple-Blue Branding
                    ═══════════════════════════════════════════════════════════════ */}
                    <div 
                        className="sync-brand-panel"
                        style={{
                            position: 'relative',
                            padding: '2.4rem 2rem',
                            background: 'radial-gradient(circle at 50% 25%, rgba(124, 58, 237, 0.4) 0%, rgba(16, 13, 43, 0.95) 75%), #100D2B',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            overflow: 'hidden',
                            borderRight: '1px solid rgba(139, 92, 246, 0.18)'
                        }}
                    >
                        {/* Background Artwork */}
                        <div 
                            style={{
                                position: 'absolute',
                                inset: 0,
                                backgroundImage: `radial-gradient(circle at 50% 30%, transparent 20%, rgba(16, 13, 43, 0.85) 90%), url('/cloud-sync-branding.jpg')`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center 20%',
                                opacity: 0.45,
                                pointerEvents: 'none',
                                filter: 'contrast(1.15) saturate(1.2)'
                            }}
                        />

                        {/* Top: Branding Tag */}
                        <div style={{ position: 'relative', zIndex: 2 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.8rem' }}>
                                <div>
                                    <div style={{ fontSize: '1.15rem', fontWeight: 900, letterSpacing: '0.08em', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span>XORYA</span>
                                    </div>
                                    <div style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.18em', color: '#38BDF8', textTransform: 'uppercase' }}>
                                        CLOUD SYNC
                                    </div>
                                </div>
                                <div style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    padding: '0.25rem 0.65rem',
                                    borderRadius: '50px',
                                    background: 'rgba(124, 58, 237, 0.25)',
                                    border: '1px solid rgba(192, 132, 252, 0.35)',
                                    fontSize: '0.68rem',
                                    fontWeight: 700,
                                    color: '#C084FC',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}>
                                    <Shield size={11} />
                                    <span>Secure &amp; Private</span>
                                </div>
                            </div>
                        </div>

                        {/* Middle & Bottom: Heading & Benefits */}
                        <div style={{ position: 'relative', zIndex: 2, marginTop: 'auto' }}>
                            <h2 style={{
                                fontSize: '1.85rem',
                                fontWeight: 900,
                                lineHeight: 1.15,
                                color: '#FFFFFF',
                                margin: '0 0 0.6rem',
                                letterSpacing: '-0.02em'
                            }}>
                                Sync Your Watchlist <span style={{ color: '#C084FC' }}>Everywhere</span>
                            </h2>
                            <p style={{
                                fontSize: '0.86rem',
                                color: '#C4CBE0',
                                lineHeight: 1.45,
                                margin: '0 0 1.6rem'
                            }}>
                                Access your titles, tiers, and episode progress seamlessly on any device in real-time.
                            </p>

                            {/* 3 Compact Benefit Rows */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(124, 58, 237, 0.25)', border: '1px solid rgba(192, 132, 252, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C084FC' }}>
                                        <Shield size={14} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>Secure &amp; Private</div>
                                        <div style={{ fontSize: '0.7rem', color: '#9CA3B8' }}>Your personal data is encrypted</div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.2)', border: '1px solid rgba(56, 189, 248, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38BDF8' }}>
                                        <RefreshCw size={14} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>Sync in Real-time</div>
                                        <div style={{ fontSize: '0.7rem', color: '#9CA3B8' }}>Instant cloud mirroring</div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(37, 99, 235, 0.25)', border: '1px solid rgba(37, 99, 235, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60A5FA' }}>
                                        <Laptop size={14} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>Works on Any Device</div>
                                        <div style={{ fontSize: '0.7rem', color: '#9CA3B8' }}>Phone, tablet, laptop or desktop</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ═══════════════════════════════════════════════════════════════
                        RIGHT PANEL: Synchronization Controls
                    ═══════════════════════════════════════════════════════════════ */}
                    <div 
                        className="sync-controls-panel"
                        style={{
                            padding: '2.2rem 2.4rem',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            background: 'rgba(9, 19, 33, 0.98)',
                            overflowY: 'auto'
                        }}
                    >
                        <div>
                            {/* A. Header */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.4rem' }}>
                                <div style={{
                                    width: '46px',
                                    height: '46px',
                                    borderRadius: '14px',
                                    background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.25) 0%, rgba(139, 92, 246, 0.25) 100%)',
                                    border: '1px solid rgba(56, 189, 248, 0.35)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#38BDF8',
                                    boxShadow: '0 6px 20px rgba(37, 99, 235, 0.3)'
                                }}>
                                    <Cloud size={24} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.22rem', fontWeight: 800, margin: 0, color: '#F8FAFC', letterSpacing: '-0.02em' }}>
                                        Firebase Cloud Sync
                                    </h3>
                                    <p style={{ fontSize: '0.8rem', color: '#9CA3B8', margin: '2px 0 0' }}>
                                        Real-time cross-device sync active
                                    </p>
                                </div>
                            </div>

                            {/* B. Anonymous / Google Sync Status Card */}
                            <div style={{
                                background: 'rgba(16, 24, 39, 0.85)',
                                border: '1px solid rgba(148, 163, 184, 0.16)',
                                borderRadius: '16px',
                                padding: '1rem 1.2rem',
                                marginBottom: '1.25rem'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                        <div style={{
                                            width: '38px',
                                            height: '38px',
                                            borderRadius: '50%',
                                            background: isGoogleUser ? 'linear-gradient(135deg, #2563EB, #10B981)' : 'rgba(255, 255, 255, 0.08)',
                                            border: '1px solid rgba(255, 255, 255, 0.15)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 800,
                                            fontSize: '0.95rem',
                                            color: '#fff'
                                        }}>
                                            {isGoogleUser ? 'G' : 'A'}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#F8FAFC' }}>
                                                {isGoogleUser ? (driveState.userProfile?.name || 'Google Account') : 'Anonymous Sync'}
                                            </div>
                                            <div style={{ fontSize: '0.74rem', color: '#9CA3B8' }}>
                                                {driveState.userProfile?.email || 'Device-only sync'}
                                            </div>
                                        </div>
                                    </div>
                                    <span style={{
                                        fontSize: '0.72rem',
                                        fontWeight: 700,
                                        padding: '0.25rem 0.7rem',
                                        borderRadius: '50px',
                                        background: driveState.isConnected ? 'rgba(16, 185, 129, 0.14)' : 'rgba(244, 63, 94, 0.14)',
                                        color: driveState.isConnected ? '#10B981' : '#F43F5E',
                                        border: `1px solid ${driveState.isConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}>
                                        <CheckCircle2 size={12} />
                                        <span>{driveState.isConnected ? 'Connected' : 'Disconnected'}</span>
                                    </span>
                                </div>
                            </div>

                            {/* Error / Domain Notice Banner */}
                            {(driveState.error || localError) && (
                                <div style={{
                                    background: 'rgba(239, 68, 68, 0.12)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    borderRadius: '12px',
                                    padding: '0.75rem 1rem',
                                    fontSize: '0.78rem',
                                    color: '#f87171',
                                    marginBottom: '1.2rem',
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    justifyContent: 'space-between',
                                    gap: '0.6rem'
                                }}>
                                    <div>
                                        <div style={{ fontWeight: '700', marginBottom: '2px' }}>⚠️ Sync Notice</div>
                                        <div>{localError || driveState.error}</div>
                                        {(localError || driveState.error)?.includes('Authorized domains') && (
                                            <div style={{ marginTop: '5px', fontSize: '0.72rem', color: '#fca5a5' }}>
                                                Add domain in Firebase Console: <code>{typeof window !== 'undefined' ? window.location.hostname : 'localhost'}</code>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => {
                                            setLocalError('');
                                            if (clearCloudError) clearCloudError();
                                        }}
                                        style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: 0 }}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            )}

                            {/* C. Primary Action: Link with Google */}
                            <button
                                onClick={handleGoogleLink}
                                disabled={driveState.isSyncing}
                                style={{
                                    width: '100%',
                                    background: 'linear-gradient(100deg, #FFFFFF 0%, #E2E8F0 100%)',
                                    color: '#0F172A',
                                    border: '1px solid rgba(255, 255, 255, 0.4)',
                                    borderRadius: '14px',
                                    padding: '0.85rem 1.2rem',
                                    fontSize: '0.9rem',
                                    fontWeight: 700,
                                    cursor: driveState.isSyncing ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3), 0 0 25px rgba(59, 130, 246, 0.15)',
                                    transition: 'all 0.2s ease',
                                    marginBottom: '1rem'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.4), 0 0 30px rgba(59, 130, 246, 0.25)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3), 0 0 25px rgba(59, 130, 246, 0.15)'; }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                    {/* Official Google 'G' icon */}
                                    <svg width="20" height="20" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z" />
                                        <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z" />
                                        <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15Z" />
                                        <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z" />
                                    </svg>
                                    <div style={{ textAlign: 'left' }}>
                                        <div style={{ fontSize: '0.88rem', fontWeight: 800 }}>
                                            {driveState.isSyncing ? 'Connecting to Google...' : 'Link with Google (Recommended)'}
                                        </div>
                                        <div style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 500 }}>
                                            Keep your watchlist safe across all your devices.
                                        </div>
                                    </div>
                                </div>
                                <ArrowRight size={17} color="#2563EB" />
                            </button>

                            {/* Centered OR Divider */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', margin: '0.8rem 0 1rem' }}>
                                <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.08)' }} />
                                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255, 255, 255, 0.35)', letterSpacing: '0.05em' }}>OR</span>
                                <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.08)' }} />
                            </div>

                            {/* D. Six-digit sync code section */}
                            <div style={{
                                background: 'rgba(16, 24, 39, 0.7)',
                                border: '1px solid rgba(148, 163, 184, 0.12)',
                                borderRadius: '16px',
                                padding: '1.1rem 1.2rem',
                                marginBottom: '1.2rem'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.2)', color: '#A78BFA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <LinkIcon size={14} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F8FAFC' }}>Use a 6-Digit Sync Code</div>
                                            <div style={{ fontSize: '0.72rem', color: '#9CA3B8' }}>Generate code for another device</div>
                                        </div>
                                    </div>

                                    {!generatedCode ? (
                                        <button 
                                            onClick={handleGenerate}
                                            style={{
                                                background: 'rgba(255, 255, 255, 0.06)',
                                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                                borderRadius: '8px',
                                                padding: '0.35rem 0.7rem',
                                                fontSize: '0.72rem',
                                                fontWeight: 600,
                                                color: '#E2E8F0',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Generate Code
                                        </button>
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <span style={{ fontSize: '1rem', fontWeight: 800, letterSpacing: '2px', color: '#10B981' }}>{generatedCode}</span>
                                            <button 
                                                onClick={copyCode}
                                                style={{ background: 'transparent', border: 'none', color: isCopied ? '#10B981' : '#9CA3B8', cursor: 'pointer', padding: '2px' }}
                                                title="Copy Code"
                                            >
                                                {isCopied ? <Check size={14} /> : <Copy size={14} />}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        type="text"
                                        value={codeInput}
                                        onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        placeholder="_ _ _ _ _ _"
                                        maxLength={6}
                                        style={{
                                            flex: 1,
                                            background: 'rgba(0, 0, 0, 0.3)',
                                            border: '1px solid rgba(255, 255, 255, 0.12)',
                                            borderRadius: '10px',
                                            padding: '0.6rem 0.9rem',
                                            color: '#fff',
                                            outline: 'none',
                                            textAlign: 'center',
                                            fontSize: '1rem',
                                            fontWeight: 700,
                                            letterSpacing: '5px'
                                        }}
                                    />
                                    <button 
                                        onClick={handleUseCode}
                                        style={{
                                            background: '#6D3BFF',
                                            border: 'none',
                                            borderRadius: '10px',
                                            color: '#fff',
                                            padding: '0 1.25rem',
                                            fontSize: '0.82rem',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            boxShadow: '0 4px 14px rgba(109, 59, 255, 0.3)'
                                        }}
                                    >
                                        Link Device
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* E. Anonymous storage notice at bottom */}
                        <div style={{
                            background: 'rgba(16, 24, 39, 0.5)',
                            border: '1px solid rgba(56, 189, 248, 0.15)',
                            borderRadius: '12px',
                            padding: '0.75rem 0.95rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '0.75rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.12)', color: '#38BDF8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Shield size={14} />
                                </div>
                                <span style={{ fontSize: '0.72rem', color: '#9CA3B8', lineHeight: 1.35 }}>
                                    Your watchlist is currently saved anonymously on this device. To prevent data loss if you clear browser cache, link your account.
                                </span>
                            </div>
                            <span 
                                onClick={handleGoogleLink}
                                style={{
                                    fontSize: '0.72rem',
                                    color: '#38BDF8',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px'
                                }}
                            >
                                Learn More <ExternalLink size={10} />
                            </span>
                        </div>
                    </div>
                </motion.div>
            </div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
};

export default GoogleDriveSyncModal;
