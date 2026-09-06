import React from 'react';
import { Cast, Bell } from 'lucide-react';

const MobileTopBar = ({ onNotificationsClick, onCastClick }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 pointer-events-none flex justify-end max-w-md sm:max-w-xl mx-auto safe-top" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 40, pointerEvents: 'none', maxWidth: '440px', margin: '0 auto', display: 'flex', justifyContent: 'flex-end', padding: '16px 22px 0 0', boxSizing: 'border-box' }}>
      {/* Top-Right Action Glass Pill */}
      <div
        className="pointer-events-auto liquid-glass rounded-full px-2 py-1.5 flex items-center gap-1 shadow-2xl border border-white/10"
        style={{
          pointerEvents: 'auto',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          backgroundColor: 'rgba(24, 30, 40, 0.65)',
          borderRadius: '9999px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 8px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
        }}
      >
        <button
          type="button"
          onClick={onCastClick || (() => {
            if (navigator.share) {
              navigator.share({ title: 'XORYA Streaming', url: window.location.href }).catch(() => {});
            }
          })}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer text-neutral-300 hover:text-white hover:bg-white/10 bg-transparent border-0"
          style={{ width: '32px', height: '32px', borderRadius: '9999px', background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#cbd5e1' }}
          aria-label="Cast to screen"
        >
          <Cast className="w-4 h-4" style={{ width: '16px', height: '16px' }} />
        </button>

        <button
          type="button"
          onClick={onNotificationsClick}
          className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-300 hover:text-white hover:bg-white/10 transition-colors duration-300 relative cursor-pointer bg-transparent border-0"
          style={{ width: '32px', height: '32px', borderRadius: '9999px', background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#cbd5e1', position: 'relative' }}
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" style={{ width: '16px', height: '16px' }} />
        </button>
      </div>
    </header>
  );
};

export default MobileTopBar;
