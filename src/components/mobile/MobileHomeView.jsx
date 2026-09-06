import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileTopBar from './MobileTopBar';
import MobileHeroBanner from './MobileHeroBanner';
import MobileContentRail from './MobileContentRail';
import MobileBottomNav from './MobileBottomNav';
import MobileDiscoverTab from './MobileDiscoverTab';
import MobileSearchTab from './MobileSearchTab';
import MobileSavedTab from './MobileSavedTab';

import {
  getTrendingMovies,
  getTrendingTVShows,
  getTopRatedMovies,
  getSciFiMovies,
  getActionMovies,
  getThrillerMovies,
  getAnimeMovies,
} from '../../api/tmdb';

const MobileHomeView = ({ category = 'all', top10Data = [] }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');

  // Category rails data
  const [trending, setTrending] = useState([]);
  const [trendingTV, setTrendingTV] = useState([]);
  const [anime, setAnime] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [sciFi, setSciFi] = useState([]);
  const [action, setAction] = useState([]);
  const [thrillers, setThrillers] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const fetchMobileFeeds = async () => {
      try {
        const [
          trendingRes,
          trendingTVRes,
          animeRes,
          topRatedRes,
          sciFiRes,
          actionRes,
          thrillerRes,
        ] = await Promise.allSettled([
          getTrendingMovies(1),
          getTrendingTVShows(1),
          getAnimeMovies(),
          getTopRatedMovies(),
          getSciFiMovies(),
          getActionMovies(),
          getThrillerMovies(),
        ]);

        if (!isMounted) return;

        if (trendingRes.status === 'fulfilled') setTrending(trendingRes.value?.data?.results || []);
        if (trendingTVRes.status === 'fulfilled') setTrendingTV(trendingTVRes.value?.data?.results || []);
        if (animeRes.status === 'fulfilled') setAnime(animeRes.value?.data?.results || []);
        if (topRatedRes.status === 'fulfilled') setTopRated(topRatedRes.value?.data?.results || []);
        if (sciFiRes.status === 'fulfilled') setSciFi(sciFiRes.value?.data?.results || []);
        if (actionRes.status === 'fulfilled') setAction(actionRes.value?.data?.results || []);
        if (thrillerRes.status === 'fulfilled') setThrillers(thrillerRes.value?.data?.results || []);
      } catch (err) {
        console.error('Error fetching mobile feeds:', err);
      }
    };

    fetchMobileFeeds();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleTabChange = (tabId) => {
    if (tabId === 'cinema') {
      // Launch player with first trending movie
      const targetMovie = trending[0] || trendingTV[0];
      if (targetMovie) {
        const type = targetMovie.title ? 'movie' : 'tv';
        navigate(`/watch/${type}/${targetMovie.id}`);
      }
      return;
    }
    setActiveTab(tabId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const heroMovies = category === 'tv' ? trendingTV : trending;

  return (
    <div
      className="min-h-screen bg-[#060606] text-[#f0f2f5] font-refra-body relative flex flex-col justify-start selection:bg-neutral-800 selection:text-white pb-16"
      style={{ backgroundColor: '#060606', color: '#f0f2f5', minHeight: '100vh', position: 'relative', overflowX: 'hidden' }}
    >
      {/* Refra Ambient Blurred Backdrop */}
      {trending[0]?.backdrop_path && (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundImage: `url(https://image.tmdb.org/t/p/w780${trending[0].backdrop_path})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(36px) saturate(140%)',
              transform: 'scale(1.2)',
              opacity: 0.22,
              transition: 'opacity 0.7s ease',
            }}
          />
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(6, 6, 6, 0.85)' }} />
        </div>
      )}

      {/* Floating Safe-Top Header */}
      <MobileTopBar />

      {/* Main Tab Content */}
      <main
        className="w-full max-w-md sm:max-w-xl mx-auto flex-1"
        style={{ width: '100%', maxWidth: '440px', margin: '0 auto', position: 'relative', zIndex: 10, flex: 1, padding: '0 0' }}
      >
        {activeTab === 'home' && (
          <div className="pt-2 pb-32" style={{ paddingTop: '10px', paddingBottom: '130px' }}>
            {/* 3.5:5 Spotlight Hero with full 4-sided framing padding */}
            <MobileHeroBanner movies={heroMovies} />

            {/* Content Rails */}
            {category !== 'tv' && (
              <MobileContentRail title="Trending Masterworks" movies={trending} />
            )}

            <MobileContentRail title="Trending TV Series" movies={trendingTV} />

            {top10Data && top10Data.length > 0 && (
              <MobileContentRail title="Top 10 Spotlight" movies={top10Data} />
            )}

            <MobileContentRail title="Trending Anime" movies={anime} />

            <MobileContentRail title="Top Rated Cinema" movies={topRated} />

            <MobileContentRail title="Sci-Fi & Speculative" movies={sciFi} />

            <MobileContentRail title="Action & Adrenaline" movies={action} />

            <MobileContentRail title="Psychological Thrillers" movies={thrillers} />
          </div>
        )}

        {activeTab === 'discover' && <MobileDiscoverTab />}

        {activeTab === 'search' && <MobileSearchTab />}

        {activeTab === 'saved' && (
          <MobileSavedTab onExploreClick={() => setActiveTab('home')} />
        )}
      </main>

      {/* 5-Tab Floating Bottom Dock */}
      <MobileBottomNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onFilterClick={() => setActiveTab('discover')}
      />
    </div>
  );
};

export default MobileHomeView;
