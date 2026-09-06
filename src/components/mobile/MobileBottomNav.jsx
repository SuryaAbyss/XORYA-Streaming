import React from 'react';
import { Home, Compass, Search, Bookmark, User } from 'lucide-react';
import { useWatchlist } from '../../hooks/useWatchlist';

const MobileBottomNav = ({ activeTab = 'home', onTabChange }) => {
  const { entries } = useWatchlist();
  const savedCount = entries?.length || 0;

  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'discover', label: 'Discover', icon: Compass },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'saved', label: 'Saved', icon: Bookmark, badge: savedCount > 0 ? savedCount : null },
    { id: 'cinema', label: 'Cinema', icon: User },
  ];

  return (
    <nav
      className="fixed bottom-3.5 left-3.5 right-3.5 max-w-md mx-auto z-40 safe-bottom pointer-events-auto select-none"
      style={{ position: 'fixed', bottom: '14px', left: '14px', right: '14px', maxWidth: '400px', margin: '0 auto', zIndex: 40 }}
      aria-label="Mobile Navigation Dock"
    >
      <div
        className="liquid-glass rounded-full px-2 py-1.5 flex items-center justify-around shadow-[0_16px_36px_rgba(0,0,0,0.85)] border border-white/10"
        style={{
          backdropFilter: 'blur(28px) saturate(190%)',
          WebkitBackdropFilter: 'blur(28px) saturate(190%)',
          backgroundColor: 'rgba(16, 20, 26, 0.88)',
          borderRadius: '9999px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '5px 8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center transition-all duration-200 cursor-pointer ${isActive ? 'text-white' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              style={{
                background: isActive ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                border: isActive ? '1px solid rgba(255, 255, 255, 0.18)' : '1px solid transparent',
                borderRadius: '9999px',
                padding: isActive ? '5px 14px' : '5px 10px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: 'none',
                transition: 'all 0.2s ease',
              }}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative" style={{ position: 'relative' }}>
                <Icon
                  className={`w-4.5 h-4.5 transition-transform duration-200 ${isActive ? 'scale-105 text-white' : 'text-neutral-400'
                    }`}
                  style={{ width: '18px', height: '18px', color: isActive ? '#ffffff' : '#94a3b8' }}
                />
                {tab.badge && (
                  <span
                    className="absolute -top-1.5 -right-2.5 min-w-[15px] h-[15px] px-1 bg-[#0984E3] text-[9px] font-bold text-white rounded-full flex items-center justify-center border border-[#060606]"
                    style={{
                      position: 'absolute',
                      top: '-5px',
                      right: '-9px',
                      minWidth: '15px',
                      height: '15px',
                      padding: '0 4px',
                      backgroundColor: '#0984E3',
                      fontSize: '9px',
                      fontWeight: 'bold',
                      color: '#ffffff',
                      borderRadius: '9999px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1.5px solid #0e1218',
                    }}
                  >
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>
              <span
                className="text-[9px] tracking-tight mt-0.5"
                style={{
                  fontSize: '9.5px',
                  marginTop: '2px',
                  color: isActive ? '#ffffff' : '#94a3b8',
                  fontWeight: isActive ? 600 : 400,
                  fontFamily: "'Unbounded', sans-serif",
                }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
