import React, { useState } from 'react';
import { Download, Loader2, CheckCircle, AlertCircle, X } from 'lucide-react';

const DOWNLOAD_SERVER_URL = import.meta.env.DEV 
    ? 'http://localhost:3001' 
    : 'https://xorya-streaming-3.onrender.com';

/**
 * Download button that talks to the local XORYA download backend.
 * Shows a modal with server selection and real-time status.
 */
const DownloadButton = ({ tmdbId, type, season, episode, title, style }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [status, setStatus] = useState('idle'); // idle | scraping | downloading | done | error
    const [statusMessage, setStatusMessage] = useState('');
    const [selectedServer, setSelectedServer] = useState('vidsrc');
    const [progress, setProgress] = useState(0);

    const downloadableServers = [
        { id: 'vidsrc', name: 'VidSrc', label: 'Primary · Cloud Ready ✓' },
        { id: 'vidfast', name: 'VidFast', label: 'Alternate' },
        { id: 'vidking', name: 'VidKing', label: 'Alternate' },
    ];

    const handleDownload = async () => {
        setStatus('scraping');
        setStatusMessage('Locating stream source (this takes ~15 seconds)...');
        setProgress(10);

        try {
            // First, check server health
            const health = await fetch(`${DOWNLOAD_SERVER_URL}/api/health`).catch(() => null);
            if (!health || !health.ok) {
                throw new Error('Download server is not running. Please start it with: node server/index.mjs');
            }

            setProgress(25);
            setStatusMessage('Extracting stream URL from server...');

            // Step 1: Get stream URL
            const streamRes = await fetch(
                `${DOWNLOAD_SERVER_URL}/api/stream-url?tmdbId=${tmdbId}&type=${type}&server=${selectedServer}&season=${season || 1}&episode=${episode || 1}`
            );

            setProgress(50);

            if (!streamRes.ok) {
                const err = await streamRes.json();
                throw new Error(err.error || 'Failed to extract stream URL');
            }

            const { streamUrl } = await streamRes.json();
            if (!streamUrl) throw new Error('No stream URL returned from server.');

            setProgress(60);
            setStatus('downloading');
            setStatusMessage('Stream found! Starting download via ffmpeg...');

            // Step 2: Trigger the actual download
            const params = new URLSearchParams({
                tmdbId, type,
                server: selectedServer,
                season: season || 1,
                episode: episode || 1,
                title: title || 'video',
            });

            // Create a hidden anchor and click it to trigger browser download
            const downloadUrl = `${DOWNLOAD_SERVER_URL}/api/download?${params.toString()}`;
            const anchor = document.createElement('a');
            anchor.href = downloadUrl;
            anchor.download = '';
            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);

            setProgress(100);
            setStatus('done');
            setStatusMessage('Download started! Check your browser\'s downloads panel.');

        } catch (err) {
            setStatus('error');
            setStatusMessage(err.message);
            setProgress(0);
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        // Reset after close animation
        setTimeout(() => {
            setStatus('idle');
            setStatusMessage('');
            setProgress(0);
        }, 300);
    };

    const statusColors = {
        idle: '#00bcd4',
        scraping: '#f59e0b',
        downloading: '#10b981',
        done: '#22c55e',
        error: '#ef4444',
    };

    const StatusIcon = () => {
        if (status === 'scraping' || status === 'downloading') return <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />;
        if (status === 'done') return <CheckCircle size={18} />;
        if (status === 'error') return <AlertCircle size={18} />;
        return null;
    };

    return (
        <>
            {/* Trigger Button */}
            <button
                id="xorya-download-btn"
                onClick={() => setIsOpen(true)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.6rem 1.1rem',
                    background: 'rgba(0, 188, 212, 0.12)',
                    border: '1px solid rgba(0, 188, 212, 0.35)',
                    borderRadius: '10px',
                    color: '#00bcd4',
                    fontSize: '0.82rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    letterSpacing: '0.4px',
                    backdropFilter: 'blur(8px)',
                    ...style
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(0, 188, 212, 0.22)';
                    e.currentTarget.style.boxShadow = '0 0 16px rgba(0,188,212,0.25)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(0, 188, 212, 0.12)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.transform = 'translateY(0)';
                }}
            >
                <Download size={15} />
                Download
            </button>

            {/* Modal Overlay */}
            {isOpen && (
                <div
                    onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0, 0, 0, 0.75)',
                        backdropFilter: 'blur(8px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                        padding: '1rem',
                    }}
                >
                    <div style={{
                        background: 'linear-gradient(145deg, rgba(18, 18, 28, 0.98), rgba(10, 10, 20, 0.98))',
                        border: '1px solid rgba(0, 188, 212, 0.2)',
                        borderRadius: '20px',
                        padding: '2rem',
                        width: '100%',
                        maxWidth: '460px',
                        boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 40px rgba(0,188,212,0.06)',
                        position: 'relative',
                    }}>
                        {/* Close Button */}
                        <button
                            onClick={handleClose}
                            style={{
                                position: 'absolute',
                                top: '1rem',
                                right: '1rem',
                                background: 'rgba(255,255,255,0.08)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '32px',
                                height: '32px',
                                color: 'rgba(255,255,255,0.6)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <X size={16} />
                        </button>

                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            <div style={{
                                width: '42px', height: '42px',
                                background: 'rgba(0, 188, 212, 0.15)',
                                border: '1px solid rgba(0, 188, 212, 0.3)',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#00bcd4',
                            }}>
                                <Download size={20} />
                            </div>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: 'white' }}>
                                    Download Content
                                </h2>
                                <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                                    {title || 'Unknown Title'}
                                    {type === 'tv' && season && ` · S${String(season).padStart(2,'0')}E${String(episode).padStart(2,'0')}`}
                                </p>
                            </div>
                        </div>

                        {/* Server Selector */}
                        {status === 'idle' && (
                            <>
                                <p style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                                    Select Download Server
                                </p>
                                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                                    {downloadableServers.map(s => (
                                        <button
                                            key={s.id}
                                            onClick={() => setSelectedServer(s.id)}
                                            style={{
                                                flex: 1,
                                                minWidth: '120px',
                                                padding: '0.75rem 1rem',
                                                background: selectedServer === s.id
                                                    ? 'rgba(0, 188, 212, 0.18)'
                                                    : 'rgba(255,255,255,0.04)',
                                                border: selectedServer === s.id
                                                    ? '1px solid rgba(0, 188, 212, 0.5)'
                                                    : '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '12px',
                                                color: selectedServer === s.id ? '#00bcd4' : 'rgba(255,255,255,0.7)',
                                                cursor: 'pointer',
                                                textAlign: 'center',
                                                transition: 'all 0.2s ease',
                                            }}
                                        >
                                            <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{s.name}</div>
                                            <div style={{ fontSize: '0.7rem', opacity: 0.6, marginTop: '2px' }}>{s.label}</div>
                                        </button>
                                    ))}
                                </div>

                                {/* Info notice */}
                                <div style={{
                                    background: 'rgba(245, 158, 11, 0.08)',
                                    border: '1px solid rgba(245, 158, 11, 0.2)',
                                    borderRadius: '10px',
                                    padding: '0.75rem 1rem',
                                    marginBottom: '1.5rem',
                                    fontSize: '0.78rem',
                                    color: 'rgba(245, 158, 11, 0.85)',
                                    lineHeight: 1.5,
                                }}>
                                    ⚠️ {import.meta.env.DEV ? 'Requires the XORYA download server running locally.' : 'Connected to XORYA Cloud Download Server.'} 
                                    Download may take 15–30s to start.
                                </div>

                                {/* Start Button */}
                                <button
                                    onClick={handleDownload}
                                    style={{
                                        width: '100%',
                                        padding: '0.85rem',
                                        background: 'linear-gradient(135deg, #00bcd4, #0097a7)',
                                        border: 'none',
                                        borderRadius: '12px',
                                        color: 'white',
                                        fontSize: '0.9rem',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        boxShadow: '0 4px 20px rgba(0,188,212,0.35)',
                                        transition: 'all 0.2s ease',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 25px rgba(0,188,212,0.5)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,188,212,0.35)'; }}
                                >
                                    <Download size={18} />
                                    Start Download via {downloadableServers.find(s => s.id === selectedServer)?.name}
                                </button>
                            </>
                        )}

                        {/* Status View */}
                        {status !== 'idle' && (
                            <div>
                                {/* Progress Bar */}
                                <div style={{
                                    background: 'rgba(255,255,255,0.07)',
                                    borderRadius: '100px',
                                    height: '6px',
                                    marginBottom: '1.25rem',
                                    overflow: 'hidden',
                                }}>
                                    <div style={{
                                        height: '100%',
                                        width: `${progress}%`,
                                        background: `linear-gradient(90deg, ${statusColors[status]}, ${statusColors[status]}aa)`,
                                        borderRadius: '100px',
                                        transition: 'width 0.5s ease',
                                        boxShadow: `0 0 10px ${statusColors[status]}55`,
                                    }} />
                                </div>

                                {/* Status message */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '0.75rem',
                                    padding: '1rem',
                                    background: `${statusColors[status]}10`,
                                    border: `1px solid ${statusColors[status]}30`,
                                    borderRadius: '12px',
                                    color: statusColors[status],
                                    marginBottom: '1.25rem',
                                }}>
                                    <StatusIcon />
                                    <span style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>{statusMessage}</span>
                                </div>

                                {(status === 'done' || status === 'error') && (
                                    <button
                                        onClick={handleClose}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            background: 'rgba(255,255,255,0.07)',
                                            border: '1px solid rgba(255,255,255,0.12)',
                                            borderRadius: '12px',
                                            color: 'white',
                                            fontSize: '0.85rem',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        Close
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </>
    );
};

export default DownloadButton;
