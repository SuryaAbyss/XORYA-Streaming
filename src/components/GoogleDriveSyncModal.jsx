import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cloud, X, Shield, Key, Link as LinkIcon, Download, Copy, Check } from 'lucide-react';

const GoogleDriveSyncModal = ({
    isOpen,
    onClose,
    driveState,
    linkWithGoogle,
    generateSyncCode,
    useSyncCode
}) => {
    const [codeInput, setCodeInput] = useState('');
    const [generatedCode, setGeneratedCode] = useState(null);
    const [isCopied, setIsCopied] = useState(false);
    const [localError, setLocalError] = useState('');

    if (!isOpen) return null;

    const handleGoogleLink = async () => {
        setLocalError('');
        const success = await linkWithGoogle();
        if (success) {
            onClose();
        } else {
            setLocalError('Failed to link Google account.');
        }
    };

    const handleGenerate = async () => {
        setLocalError('');
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
        const success = await useSyncCode(codeInput);
        if (success) {
            onClose();
        } else {
            setLocalError('Invalid or expired Sync Code.');
        }
    };

    const copyCode = () => {
        navigator.clipboard.writeText(generatedCode);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const isGoogleUser = driveState.userProfile?.email !== 'Device-only sync';

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
                        position: 'relative'
                    }}
                >
                    <button onClick={onClose} style={{
                        position: 'absolute', top: '1.2rem', right: '1.2rem', background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '50%', width: '32px', height: '32px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255, 255, 255, 0.7)',
                        cursor: 'pointer', transition: 'all 0.2s ease'
                    }}>
                        <X size={16} />
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.4rem' }}>
                        <div style={{
                            width: '46px', height: '46px', borderRadius: '14px',
                            background: 'linear-gradient(135deg, rgba(66, 133, 244, 0.2) 0%, rgba(52, 168, 83, 0.2) 100%)',
                            border: '1px solid rgba(66, 133, 244, 0.35)', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', color: '#4285F4'
                        }}>
                            <Cloud size={24} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0, letterSpacing: '-0.3px' }}>Firebase Cloud Sync</h2>
                            <p style={{ fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.6)', margin: '2px 0 0' }}>Real-time cross-device sync active</p>
                        </div>
                    </div>

                    {/* Status Card */}
                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '1.2rem', marginBottom: '1.4rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: isGoogleUser ? '#4285F4' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>
                                    {isGoogleUser ? 'G' : 'A'}
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>{driveState.userProfile?.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)' }}>{driveState.userProfile?.email}</div>
                                </div>
                            </div>
                            <span style={{ fontSize: '0.7rem', fontWeight: '700', padding: '3px 10px', borderRadius: '20px', background: 'rgba(52, 168, 83, 0.15)', color: '#34A853', border: '1px solid rgba(52, 168, 83, 0.3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Check size={12} /> Connected
                            </span>
                        </div>
                    </div>

                    {(driveState.error || localError) && (
                        <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', padding: '0.75rem 1rem', fontSize: '0.78rem', color: '#f87171', marginBottom: '1.2rem' }}>
                            ⚠️ {localError || driveState.error}
                        </div>
                    )}

                    {!isGoogleUser && (
                        <>
                            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: '1rem', lineHeight: '1.5' }}>
                                Your watchlist is currently saved anonymously on this device. To prevent data loss if you clear your browser cache, please choose one of the options below to link your account.
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1.5rem' }}>
                                {/* Option 1: Google */}
                                <button
                                    onClick={handleGoogleLink}
                                    disabled={driveState.isSyncing}
                                    style={{
                                        background: 'linear-gradient(135deg, #4285F4 0%, #34A853 100%)',
                                        border: 'none', borderRadius: '12px', padding: '0.9rem', color: 'white',
                                        fontSize: '0.9rem', fontWeight: '700', cursor: driveState.isSyncing ? 'not-allowed' : 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                                        boxShadow: '0 8px 25px rgba(66, 133, 244, 0.25)'
                                    }}
                                >
                                    <Shield size={18} />
                                    <span>{driveState.isSyncing ? 'Linking...' : 'Link with Google (Recommended)'}</span>
                                </button>
                                
                                <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', margin: '0.2rem 0' }}>OR</div>

                                {/* Option 2: Sync Code */}
                                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1rem' }}>
                                    <h3 style={{ fontSize: '0.9rem', fontWeight: '600', margin: '0 0 0.5rem' }}>Use a 6-Digit Sync Code</h3>
                                    
                                    {!generatedCode ? (
                                        <button onClick={handleGenerate} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '0.6rem', color: 'white', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
                                            <Key size={14} /> Generate Code for another device
                                        </button>
                                    ) : (
                                        <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '8px', padding: '1rem', textAlign: 'center', marginBottom: '0.8rem', display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center' }}>
                                            <span style={{ fontSize: '1.5rem', fontWeight: '800', letterSpacing: '4px', color: '#7bed9f' }}>{generatedCode}</span>
                                            <button onClick={copyCode} style={{ background: 'transparent', border: 'none', color: isCopied ? '#7bed9f' : 'white', cursor: 'pointer' }}>
                                                {isCopied ? <Check size={18} /> : <Copy size={18} />}
                                            </button>
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <input
                                            type="text"
                                            value={codeInput}
                                            onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            placeholder="Enter a 6-digit code..."
                                            style={{ flex: 1, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.6rem', color: 'white', outline: 'none', textAlign: 'center', fontSize: '1rem', letterSpacing: '2px' }}
                                        />
                                        <button onClick={handleUseCode} style={{ background: 'rgba(0, 188, 212, 0.2)', border: '1px solid rgba(0, 188, 212, 0.4)', borderRadius: '8px', color: '#00bcd4', padding: '0 1rem', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}>
                                            Link Device
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default GoogleDriveSyncModal;
