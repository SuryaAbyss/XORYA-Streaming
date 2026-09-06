import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Cast,
  Bell,
  ChevronDown,
  Star,
  Clapperboard,
  Users,
  Film,
  DollarSign,
  Award,
  Check,
  Server,
  Layers
} from 'lucide-react';
import { imageUrl } from '../../api/tmdb';
import MobileContentRail from './MobileContentRail';
import MobileBottomNav from './MobileBottomNav';

const formatCurrency = (val) => {
  if (!val || val <= 0) return 'Not Disclosed';
  if (val >= 1000000000) return `$${(val / 1000000000).toFixed(2)} Billion`;
  if (val >= 1000000) return `$${(val / 1000000).toFixed(1)} Million`;
  return `$${val.toLocaleString()}`;
};

const MobileVideoPlayerView = ({
  type = 'movie',
  id,
  contentData,
  playerUrl,
  servers = [],
  activeServer,
  onServerChange,
  currentSeason = 1,
  currentEpisode = 1,
  onEpisodeChange,
  seasons = [],
  episodes = [],
  recommendations = [],
}) => {
  const navigate = useNavigate();
  const [showServerDrawer, setShowServerDrawer] = useState(false);
  const [showSeasonDrawer, setShowSeasonDrawer] = useState(false);

  // Extract crew details
  const crew = contentData?.credits?.crew || [];
  const cast = (contentData?.credits?.cast || []).slice(0, 12);

  const director = useMemo(() => {
    const d = crew.filter((c) => c.job === 'Director').map((c) => c.name);
    return d.length > 0 ? d.join(', ') : 'Destin Daniel Cretton';
  }, [crew]);

  const writers = useMemo(() => {
    const w = crew
      .filter((c) => ['Writer', 'Screenplay', 'Author', 'Story', 'Comic Book'].includes(c.job))
      .map((c) => c.name);
    return w.length > 0 ? Array.from(new Set(w)).slice(0, 4).join(', ') : 'Stan Lee, Steve Ditko, Erik Sommers';
  }, [crew]);

  const producers = useMemo(() => {
    const p = crew
      .filter((c) => ['Producer', 'Executive Producer'].includes(c.job))
      .map((c) => c.name);
    return p.length > 0 ? Array.from(new Set(p)).slice(0, 5).join(', ') : 'Kevin Feige, Amy Pascal, Louis D\'Esposito';
  }, [crew]);

  const cinematography = useMemo(() => {
    const c = crew.filter((c) => c.job === 'Director of Photography').map((c) => c.name);
    return c.length > 0 ? c.join(', ') : 'Brett Pawlak';
  }, [crew]);

  const musicScore = useMemo(() => {
    const m = crew.filter((c) => ['Original Music Composer', 'Music'].includes(c.job)).map((c) => c.name);
    return m.length > 0 ? m.join(', ') : 'Michael Giacchino';
  }, [crew]);

  const title = contentData?.title || contentData?.name || 'Spider-Man: Brand New Day';
  const tagline = contentData?.tagline || '"A brand new day starts now."';
  const overview =
    contentData?.overview ||
    'Fighting crime full-time as Spider-Man in a world that doesn\'t remember him—and the pressure of seeing his old friends move on without him—sparks a change in Peter Parker he may not have the power to control. But that transformation might also be the only thing that can stop a shocking new threat to the city and those he loves - a powerful villain no one can even see.';

  const releaseYear = (contentData?.release_date || contentData?.first_air_date || '2026').slice(0, 4);
  const runtime = contentData?.runtime
    ? `${Math.floor(contentData.runtime / 60)}h ${contentData.runtime % 60}m`
    : contentData?.episode_run_time?.[0]
      ? `${contentData.episode_run_time[0]}m`
      : '2h 25m';

  const rating = contentData?.vote_average ? contentData.vote_average.toFixed(1) : '7.9';
  const certification = type === 'tv' ? 'TV-MA' : 'PG-13';

  const genres = contentData?.genres || [
    { id: 878, name: 'Science Fiction' },
    { id: 28, name: 'Action' },
    { id: 12, name: 'Adventure' },
  ];

  const currentServerObj = servers.find((s) => s.id === activeServer) || servers[0] || { name: 'PenguPlay' };

  return (
    <div
      className="min-h-screen bg-[#060606] text-[#f0f2f5] font-refra-body relative flex flex-col justify-start selection:bg-neutral-800 selection:text-white pb-20"
      style={{
        backgroundColor: '#060606',
        color: '#f0f2f5',
        minHeight: '100vh',
        position: 'relative',
        overflowX: 'hidden',
      }}
    >
      {/* Refra Ambient Blurred Backdrop */}
      {contentData?.backdrop_path && (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundImage: `url(https://image.tmdb.org/t/p/w780${contentData.backdrop_path})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(36px) saturate(140%)',
              transform: 'scale(1.2)',
              opacity: 0.18,
            }}
          />
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(6, 6, 6, 0.88)' }} />
        </div>
      )}

      {/* Floating Header */}
      <header
        className="fixed top-0 left-0 right-0 z-40 px-3 pt-3 flex items-center justify-between max-w-md mx-auto pointer-events-auto safe-top"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 40,
          maxWidth: '440px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 14px',
        }}
      >
        {/* Back Button */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full liquid-glass flex items-center justify-center text-white border border-white/10 shadow-lg active:scale-95 transition-all cursor-pointer"
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '9999px',
            backgroundColor: 'rgba(20, 24, 32, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#ffffff',
          }}
          aria-label="Go Back"
        >
          <ArrowLeft className="w-4 h-4" style={{ width: '16px', height: '16px' }} />
        </button>

        {/* Top-Right Action Pill */}
        <div
          className="liquid-glass rounded-full px-2 py-1 flex items-center gap-1 shadow-lg border border-white/10"
          style={{
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            backgroundColor: 'rgba(20, 24, 32, 0.75)',
            borderRadius: '9999px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px',
          }}
        >
          <button
            type="button"
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title, url: window.location.href }).catch(() => { });
              }
            }}
            className="w-7 h-7 rounded-full flex items-center justify-center text-neutral-300 hover:text-white transition-colors bg-transparent border-0 cursor-pointer"
            aria-label="Cast or Share"
          >
            <Cast className="w-3.5 h-3.5" style={{ width: '15px', height: '15px' }} />
          </button>
          <button
            type="button"
            className="w-7 h-7 rounded-full flex items-center justify-center text-neutral-300 hover:text-white transition-colors bg-transparent border-0 cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-3.5 h-3.5" style={{ width: '15px', height: '15px' }} />
          </button>
        </div>
      </header>

      {/* Main Player Content Container */}
      <main
        className="w-full max-w-md mx-auto flex-1 relative z-10 flex flex-col pt-16 px-3 pb-24 space-y-4 select-none"
        style={{
          width: '100%',
          maxWidth: '440px',
          margin: '0 auto',
          position: 'relative',
          zIndex: 10,
          flex: 1,
          padding: '60px 12px 110px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          boxSizing: 'border-box',
        }}
      >
        {/* 16:9 Cinema Player Card */}
        <section
          className="relative mx-auto overflow-hidden bg-black/90 shadow-2xl w-full aspect-[16/9] max-h-[62vh] rounded-2xl border border-white/10"
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '16 / 9',
            maxHeight: '60vh',
            borderRadius: '18px',
            overflow: 'hidden',
            backgroundColor: '#000000',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.75)',
          }}
        >
          {playerUrl ? (
            <iframe
              src={playerUrl}
              title={`${title} Stream`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              className="w-full h-full border-0 bg-black"
              style={{ width: '100%', height: '100%', border: 'none', backgroundColor: '#000000' }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-black/80 text-neutral-400 text-xs">
              Loading Stream...
            </div>
          )}
        </section>

        {/* Server Switcher Dropdown Banner */}
        <div
          className="w-full rounded-2xl bg-white/[0.04] overflow-hidden shadow-xl backdrop-blur-xl border border-white/10"
          style={{
            borderRadius: '16px',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
          }}
        >
          <div
            role="button"
            tabIndex={0}
            onClick={() => setShowServerDrawer(!showServerDrawer)}
            className="w-full p-3 flex items-center justify-between gap-2.5 text-left cursor-pointer hover:bg-white/[0.03] active:bg-white/[0.05] transition-colors select-none"
            style={{
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              cursor: 'pointer',
            }}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-1" style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
              <div
                className="w-9 h-9 shrink-0 flex items-center justify-center relative overflow-hidden rounded-xl bg-white/10 text-white"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Server className="w-4 h-4 text-white" style={{ width: '18px', height: '18px' }} />
              </div>

              <div className="min-w-0 flex-1 space-y-1" style={{ minWidth: 0, flex: 1 }}>
                <h3 className="text-xs font-bold text-white tracking-tight truncate" style={{ fontSize: '12.5px', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                  {currentServerObj.name}
                </h3>
                <div className="flex items-center gap-1 flex-wrap" style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', marginTop: '2px' }}>
                  <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[9.5px] font-mono rounded-[4px] bg-white text-black font-bold">4K</span>
                  <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[9.5px] font-mono rounded-[4px] bg-transparent text-white font-medium border border-white/40">BluRay</span>
                  <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[9.5px] font-mono rounded-[4px] bg-white text-black font-bold">10bit</span>
                  <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[9.5px] font-mono rounded-[4px] bg-transparent text-white font-medium border border-white/40">7.1</span>
                  <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[9.5px] font-mono rounded-[4px] bg-transparent text-white font-medium border border-white/40">HEVC</span>
                  <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[9.5px] font-mono rounded-[4px] bg-transparent text-white font-medium border border-white/40">7.07 GB</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              <span className="text-[11px] font-semibold text-neutral-300">Switch</span>
              <div
                className="w-7 h-7 rounded-[6px] bg-white/10 flex items-center justify-center text-neutral-300"
                style={{ width: '26px', height: '26px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ChevronDown className={`w-3.5 h-3.5 text-white transition-transform ${showServerDrawer ? 'rotate-180' : ''}`} style={{ width: '14px', height: '14px' }} />
              </div>
            </div>
          </div>

          {/* Expanded Server List */}
          {showServerDrawer && (
            <div className="border-t border-white/10 p-2 space-y-1 bg-black/40" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '8px', backgroundColor: 'rgba(0,0,0,0.4)' }}>
              {servers.map((srv) => (
                <button
                  key={srv.id}
                  type="button"
                  onClick={() => {
                    onServerChange(srv.id);
                    setShowServerDrawer(false);
                  }}
                  className={`w-full px-3 py-2 rounded-xl text-left flex items-center justify-between text-xs transition-colors cursor-pointer ${activeServer === srv.id ? 'bg-white/15 text-white font-bold' : 'text-neutral-300 hover:bg-white/5'
                    }`}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: activeServer === srv.id ? 'rgba(255,255,255,0.15)' : 'transparent',
                    color: activeServer === srv.id ? '#ffffff' : '#cbd5e1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                  }}
                >
                  <span className="flex items-center gap-2">
                    <Server className="w-3.5 h-3.5" style={{ width: '14px', height: '14px' }} />
                    {srv.name}
                  </span>
                  {activeServer === srv.id && <Check className="w-3.5 h-3.5 text-[#00CEC9]" style={{ width: '14px', height: '14px', color: '#00CEC9' }} />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* TV Show Seasons & Episode Selector */}
        {type === 'tv' && (
          <div
            className="w-full rounded-2xl bg-white/[0.04] p-3.5 space-y-3 backdrop-blur-xl border border-white/10"
            style={{
              borderRadius: '16px',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '14px',
            }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white flex items-center gap-2" style={{ margin: 0, fontSize: '12px', fontWeight: 700 }}>
                <Layers className="w-3.5 h-3.5 text-white" style={{ width: '14px', height: '14px' }} />
                <span>Season {currentSeason} Episodes</span>
              </h3>

              {seasons.length > 1 && (
                <button
                  type="button"
                  onClick={() => setShowSeasonDrawer(!showSeasonDrawer)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white/10 text-white flex items-center gap-1 cursor-pointer border-0"
                  style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', padding: '4px 8px', fontSize: '11px', cursor: 'pointer' }}
                >
                  <span>Season {currentSeason}</span>
                  <ChevronDown className="w-3 h-3" style={{ width: '12px', height: '12px' }} />
                </button>
              )}
            </div>

            {/* Season switcher drawer */}
            {showSeasonDrawer && (
              <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                {seasons.map((s) => (
                  <button
                    key={s.season_number}
                    type="button"
                    onClick={() => {
                      if (onEpisodeChange) onEpisodeChange(s.season_number, 1);
                      setShowSeasonDrawer(false);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer border ${currentSeason === s.season_number
                        ? 'bg-white text-black border-white'
                        : 'bg-white/5 text-neutral-300 border-white/10'
                      }`}
                  >
                    Season {s.season_number}
                  </button>
                ))}
              </div>
            )}

            {/* Horizontal Episode Pills */}
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1 pt-1" style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
              {episodes.map((ep) => {
                const epNum = ep.episode_number || ep;
                const isCurrent = currentEpisode === epNum;
                return (
                  <button
                    key={epNum}
                    type="button"
                    onClick={() => onEpisodeChange && onEpisodeChange(currentSeason, epNum)}
                    className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${isCurrent
                        ? 'bg-white text-black shadow-lg scale-105'
                        : 'bg-white/5 text-neutral-300 hover:bg-white/10 border border-white/10'
                      }`}
                    style={{
                      flexShrink: 0,
                      padding: '8px 14px',
                      borderRadius: '12px',
                      backgroundColor: isCurrent ? '#ffffff' : 'rgba(255,255,255,0.05)',
                      color: isCurrent ? '#000000' : '#cbd5e1',
                      border: isCurrent ? 'none' : '1px solid rgba(255,255,255,0.1)',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    EP {epNum}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Movie Info Glass Card */}
        <div
          className="p-4 rounded-2xl bg-white/[0.04] space-y-3 backdrop-blur-xl border border-white/10"
          style={{
            borderRadius: '16px',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          {/* Metadata Badges */}
          <div className="flex items-center gap-1.5 flex-wrap" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-white" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '9999px', padding: '2px 8px', fontSize: '11px', fontWeight: 600 }}>{releaseYear}</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/5 text-neutral-300" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#cbd5e1', borderRadius: '9999px', padding: '2px 8px', fontSize: '11px' }}>{runtime}</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/5 text-neutral-300" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#cbd5e1', borderRadius: '9999px', padding: '2px 8px', fontSize: '11px' }}>{certification}</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white text-black flex items-center gap-1" style={{ backgroundColor: '#ffffff', color: '#000000', borderRadius: '9999px', padding: '2px 8px', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Star className="w-3 h-3 fill-black text-black" style={{ width: '10px', height: '10px' }} />
              {rating}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-white font-mono" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '9999px', padding: '2px 8px', fontSize: '11px', fontWeight: 600 }}>4K HDR</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-neutral-200" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#e2e8f0', borderRadius: '9999px', padding: '2px 8px', fontSize: '11px', fontWeight: 600 }}>Spatial Master Audio</span>
          </div>

          {/* Title & Tagline */}
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white drop-shadow" style={{ fontFamily: "'Unbounded', 'Syne', sans-serif", fontSize: '1.4rem', fontWeight: 700, color: '#ffffff', margin: '2px 0' }}>
              {title}
            </h2>
            {tagline && (
              <p className="text-xs text-neutral-300 italic font-light mt-0.5" style={{ fontSize: '11.5px', color: '#cbd5e1', fontStyle: 'italic', margin: '2px 0 0 0' }}>
                {tagline}
              </p>
            )}
          </div>

          {/* Exact DevTools Synopsis */}
          <p
            className="text-xs text-neutral-200 font-normal leading-relaxed refra-synopsis"
            style={{
              fontFamily: 'Unbounded, Syne, "Plus Jakarta Sans", sans-serif',
              fontSize: '12px',
              fontWeight: 400,
              lineHeight: '19.5px',
              letterSpacing: '-0.32px',
              textAlign: 'start',
              color: 'var(--color-neutral-200, oklch(0.922 0 none))',
              margin: '2px 0 0 0',
              transition: 'all',
            }}
          >
            {overview}
          </p>

          {/* Genre Pills */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', paddingTop: '4px' }}>
            {genres.map((g) => (
              <span
                key={g.id || g.name}
                className="px-2.5 py-1 rounded-xl text-[11px] font-medium bg-white/5 text-neutral-300 border border-white/5"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#cbd5e1', borderRadius: '10px', padding: '3px 9px', fontSize: '11px', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                {g.name}
              </span>
            ))}
          </div>
        </div>

        {/* Production Team Glass Card */}
        <div
          className="p-4 rounded-2xl bg-white/[0.04] space-y-3 backdrop-blur-xl border border-white/10"
          style={{
            borderRadius: '16px',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '16px',
          }}
        >
          <h3 className="text-sm font-bold text-white flex items-center gap-2" style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clapperboard className="w-4 h-4 text-white" style={{ width: '16px', height: '16px' }} />
            <span>Production Team</span>
          </h3>

          <div className="grid grid-cols-1 gap-2" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5" style={{ padding: '8px 10px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold" style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Director</div>
              <div className="text-xs font-bold text-white mt-0.5" style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>{director}</div>
            </div>

            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5" style={{ padding: '8px 10px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold" style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Screenplay &amp; Writers</div>
              <div className="text-xs font-semibold text-neutral-200 mt-0.5" style={{ fontSize: '11.5px', color: '#e2e8f0' }}>{writers}</div>
            </div>

            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5" style={{ padding: '8px 10px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold" style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Producers</div>
              <div className="text-xs font-semibold text-neutral-200 mt-0.5" style={{ fontSize: '11.5px', color: '#e2e8f0' }}>{producers}</div>
            </div>

            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5" style={{ padding: '8px 10px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold" style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Cinematography</div>
              <div className="text-xs font-semibold text-neutral-200 mt-0.5" style={{ fontSize: '11.5px', color: '#e2e8f0' }}>{cinematography}</div>
            </div>

            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5" style={{ padding: '8px 10px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold" style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Original Score &amp; Music</div>
              <div className="text-xs font-semibold text-neutral-200 mt-0.5" style={{ fontSize: '11.5px', color: '#e2e8f0' }}>{musicScore}</div>
            </div>
          </div>
        </div>

        {/* Top Cast & Actors Glass Card */}
        {cast.length > 0 && (
          <div
            className="p-4 rounded-2xl bg-white/[0.04] space-y-3 backdrop-blur-xl border border-white/10"
            style={{
              borderRadius: '16px',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '16px',
            }}
          >
            <h3 className="text-sm font-bold text-white flex items-center gap-2" style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users className="w-4 h-4 text-white" style={{ width: '16px', height: '16px' }} />
              <span>Top Cast &amp; Actors</span>
            </h3>

            <div className="grid grid-cols-2 gap-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {cast.map((actor) => (
                <div
                  key={actor.id}
                  className="p-2 rounded-xl bg-white/[0.02] flex items-center gap-2 border border-white/5 overflow-hidden"
                  style={{
                    padding: '8px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    minWidth: 0,
                  }}
                >
                  <img
                    alt={actor.name}
                    className="w-9 h-9 rounded-full object-cover shrink-0 shadow-sm"
                    style={{ width: '36px', height: '36px', borderRadius: '9999px', objectFit: 'cover', flexShrink: 0 }}
                    src={actor.profile_path ? imageUrl(actor.profile_path, 'w185') : '/logo.png'}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-white truncate" style={{ fontSize: '11px', fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {actor.name}
                    </div>
                    <div className="text-[10px] text-neutral-400 truncate" style={{ fontSize: '9.5px', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {actor.character || 'Cast Member'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Media Details Glass Card */}
        <div
          className="p-4 rounded-2xl bg-white/[0.04] space-y-3 backdrop-blur-xl border border-white/10"
          style={{
            borderRadius: '16px',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '16px',
          }}
        >
          <h3 className="text-sm font-bold text-white flex items-center gap-2" style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Film className="w-4 h-4 text-white" style={{ width: '16px', height: '16px' }} />
            <span>Media Details</span>
          </h3>

          <div className="grid grid-cols-2 gap-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5" style={{ padding: '8px 10px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold" style={{ fontSize: '10px', color: '#94a3b8' }}>Release Year</div>
              <div className="text-xs font-bold text-white mt-0.5" style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>{releaseYear}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5" style={{ padding: '8px 10px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold" style={{ fontSize: '10px', color: '#94a3b8' }}>Runtime</div>
              <div className="text-xs font-bold text-white mt-0.5" style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>{runtime}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5" style={{ padding: '8px 10px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold" style={{ fontSize: '10px', color: '#94a3b8' }}>Rating / Cert</div>
              <div className="text-xs font-bold text-white mt-0.5" style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>{certification}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5" style={{ padding: '8px 10px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold" style={{ fontSize: '10px', color: '#94a3b8' }}>Resolution</div>
              <div className="text-xs font-bold text-white mt-0.5 font-mono" style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>4K HDR</div>
            </div>
          </div>
        </div>

        {/* Financials & Origin Glass Card */}
        <div
          className="p-4 rounded-2xl bg-white/[0.04] space-y-3 backdrop-blur-xl border border-white/10"
          style={{
            borderRadius: '16px',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '16px',
          }}
        >
          <h3 className="text-sm font-bold text-white flex items-center gap-2" style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DollarSign className="w-4 h-4 text-white" style={{ width: '16px', height: '16px' }} />
            <span>Financials &amp; Origin</span>
          </h3>

          <div className="grid grid-cols-2 gap-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5" style={{ padding: '8px 10px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold" style={{ fontSize: '10px', color: '#94a3b8' }}>Budget</div>
              <div className="text-xs font-bold text-white mt-0.5" style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>{formatCurrency(contentData?.budget)}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5" style={{ padding: '8px 10px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold" style={{ fontSize: '10px', color: '#94a3b8' }}>Box Office</div>
              <div className="text-xs font-bold text-white mt-0.5" style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>{formatCurrency(contentData?.revenue)}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5" style={{ padding: '8px 10px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold" style={{ fontSize: '10px', color: '#94a3b8' }}>Country</div>
              <div className="text-xs font-semibold text-neutral-200 mt-0.5 truncate" style={{ fontSize: '11px', color: '#e2e8f0' }}>
                {contentData?.production_countries?.[0]?.name || 'United States of America'}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5" style={{ padding: '8px 10px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold" style={{ fontSize: '10px', color: '#94a3b8' }}>Languages</div>
              <div className="text-xs font-semibold text-neutral-200 mt-0.5 truncate" style={{ fontSize: '11px', color: '#e2e8f0' }}>
                {contentData?.spoken_languages?.[0]?.english_name || 'English'}
              </div>
            </div>
          </div>

          {contentData?.production_companies && contentData.production_companies.length > 0 && (
            <div className="pt-2">
              <div className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold mb-2" style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '6px' }}>
                Production Studios
              </div>
              <div className="flex items-center gap-1.5 flex-wrap" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {contentData.production_companies.slice(0, 4).map((c) => (
                  <div key={c.id} className="px-2.5 py-1 rounded-xl bg-white/[0.04] flex items-center gap-1.5 border border-white/5" style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {c.logo_path && (
                      <img
                        alt={c.name}
                        className="h-3 max-w-[40px] object-contain filter invert brightness-200"
                        style={{ height: '12px', maxWidth: '40px', objectFit: 'contain', filter: 'invert(1) brightness(2)' }}
                        src={imageUrl(c.logo_path, 'w200')}
                      />
                    )}
                    <span className="text-[10.5px] font-semibold text-neutral-200">{c.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Ratings & Awards Glass Card */}
        <div
          className="p-4 rounded-2xl bg-white/[0.04] space-y-2 backdrop-blur-xl border border-white/10"
          style={{
            borderRadius: '16px',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '16px',
          }}
        >
          <h3 className="text-sm font-bold text-white flex items-center gap-2" style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award className="w-4 h-4 text-white" style={{ width: '16px', height: '16px' }} />
            <span>Ratings &amp; Awards</span>
          </h3>

          <div className="flex items-center gap-2 flex-wrap" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <div className="px-3 py-1.5 rounded-xl bg-white/[0.04] flex items-center gap-2 border border-white/5" style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="text-[11px] text-neutral-400 font-medium">TMDB Score:</span>
              <span className="text-xs font-bold text-white">{rating}/10</span>
            </div>
          </div>
        </div>

        {/* Recommended / Similar Content */}
        {recommendations && recommendations.length > 0 && (
          <div className="pt-2">
            <MobileContentRail title={`Because You Watched ${title}`} movies={recommendations} />
          </div>
        )}
      </main>

      {/* Floating Bottom Nav */}
      <MobileBottomNav activeTab="cinema" onTabChange={(tabId) => {
        if (tabId === 'home') navigate('/');
        else if (tabId === 'discover') navigate('/?tab=discover');
        else if (tabId === 'search') navigate('/?tab=search');
        else if (tabId === 'saved') navigate('/?tab=saved');
      }} />
    </div>
  );
};

export default MobileVideoPlayerView;
