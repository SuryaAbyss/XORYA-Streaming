import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ReactLenis } from 'lenis/react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import { MovieModalProvider } from './context/MovieModalContext';
import MovieDetailsModal from './components/MovieDetailsModal';
import IntroAnimation from './components/IntroAnimation';
import Footer from './components/Footer';
import VisitorTracker from './components/VisitorTracker';

const MovieDetails = lazy(() => import('./pages/MovieDetails'));
const VideoPlayer = lazy(() => import('./pages/VideoPlayer'));
const Watchlist = lazy(() => import('./pages/Watchlist'));
const ActorDetails = lazy(() => import('./pages/ActorDetails'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

function App() {
  return (
    <Router>
      <VisitorTracker />
      <MovieModalProvider>
        <ReactLenis root options={{ lerp: 0.1, duration: 1.5, smoothWheel: true }}>
          <div className="app">
            <IntroAnimation />
            <Navbar />
            <Suspense fallback={<div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>Loading...</div>}>
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
        </ReactLenis>
      </MovieModalProvider>
    </Router>
  );
}

export default App;
