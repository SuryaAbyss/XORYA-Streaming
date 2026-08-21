import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Agentation } from 'agentation';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import { MovieModalProvider } from './context/MovieModalContext';
import MovieDetailsModal from './components/MovieDetailsModal';
import Footer from './components/Footer';
import VisitorTracker from './components/VisitorTracker';
import LemniscateBloomLoader from './components/LemniscateBloomLoader';
import IntroSequence from './components/IntroSequence';


const MovieDetails = lazy(() => import('./pages/MovieDetails'));
const VideoPlayer = lazy(() => import('./pages/VideoPlayer'));
const Watchlist = lazy(() => import('./pages/Watchlist'));
const ActorDetails = lazy(() => import('./pages/ActorDetails'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

// Scroll to top helper component — forces top position on load, reload, and route changes
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Disable browser automatic scroll restoration
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    const resetScroll = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    };

    resetScroll();
    requestAnimationFrame(resetScroll);
    const timer = setTimeout(resetScroll, 50);

    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
};

function App() {
  const isDev = import.meta.env.DEV || (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development');

  return (
    <Router>
      <IntroSequence>
        <ScrollToTop />
        {isDev && <Agentation />}
        <VisitorTracker />
        <MovieModalProvider>
          <div className="app">
            <Navbar />
            <Suspense fallback={<LemniscateBloomLoader text="Loading..." fullScreen={true} color="#00bcd4" />}>

              <Routes>
                <Route path="/" element={<Home category="all" />} />
                <Route path="/movies" element={<Home category="movies" />} />
                <Route path="/series" element={<Home category="tv" />} />
                <Route path="/movie/:id" element={<MovieDetails />} />
                <Route path="/person/:id" element={<ActorDetails />} />
                <Route path="/watchlist" element={<Watchlist />} />
                <Route path="/watch/:type/:id" element={<VideoPlayer />} />
                <Route path="/watch/:type/:id/season/:season/episode/:episode" element={<VideoPlayer />} />
                <Route path="/iam-admin" element={<AdminDashboard />} />
              </Routes>
            </Suspense>
            <MovieDetailsModal />
            <Footer />
          </div>
        </MovieModalProvider>
      </IntroSequence>
    </Router>
  );
}

export default App;
