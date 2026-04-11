import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ReactLenis } from 'lenis/react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import MovieDetails from './pages/MovieDetails';
import VideoPlayer from './pages/VideoPlayer';
import Watchlist from './pages/Watchlist';
import { MovieModalProvider } from './context/MovieModalContext';
import MovieDetailsModal from './components/MovieDetailsModal';
import IntroAnimation from './components/IntroAnimation';
import Footer from './components/Footer';
import ActorDetails from './pages/ActorDetails';
import VisitorTracker from './components/VisitorTracker';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <Router>
      <VisitorTracker />
      <MovieModalProvider>
        <ReactLenis root options={{ lerp: 0.1, duration: 1.5, smoothWheel: true }}>
          <div className="app">
            <IntroAnimation />
            <Navbar />
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
            <MovieDetailsModal />
            <Footer />
          </div>
        </ReactLenis>
      </MovieModalProvider>
    </Router>
  );
}

export default App;
